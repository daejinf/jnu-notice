import "dotenv/config";
import { load } from "cheerio";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { DepartmentNoticeCandidate, DepartmentSeed } from "../src/features/notices/seeds/types";

const NOTICE_KEYWORDS = ["공지", "공지사항", "게시판", "notice", "bbs"];

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function toAbsoluteUrl(baseUrl: string, rawHref: string) {
  if (!rawHref) {
    return "";
  }

  if (rawHref.startsWith("http://") || rawHref.startsWith("https://")) {
    return rawHref;
  }

  return new URL(rawHref, baseUrl).toString();
}

function inferParserType(url: string): "subview-bbs" | "xboard" {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes("board.php") || lowerUrl.includes("xboard")) {
    return "xboard";
  }

  return "subview-bbs";
}

function scoreCandidate(text: string, href: string) {
  const normalizedText = normalizeText(text).toLowerCase();
  const lowerHref = href.toLowerCase();
  let score = 0;
  const reasons: string[] = [];

  if (NOTICE_KEYWORDS.some((keyword) => normalizedText.includes(keyword))) {
    score += 5;
    reasons.push("링크 텍스트가 공지/게시판 계열");
  }

  if (lowerHref.includes("subview.do") || lowerHref.includes("artcllist") || lowerHref.includes("bbs")) {
    score += 3;
    reasons.push("게시판 URL 패턴 포함");
  }

  if (lowerHref.includes("board.php") || lowerHref.includes("xboard")) {
    score += 3;
    reasons.push("xboard URL 패턴 포함");
  }

  if (normalizedText.includes("공지사항")) {
    score += 4;
    reasons.push("정확히 공지사항 텍스트 포함");
  }

  return {
    score,
    reason: reasons.join(", "),
  };
}

async function loadDepartmentSeeds() {
  const inputPath = path.join(process.cwd(), "data", "departments.seed.json");
  const file = await fs.readFile(inputPath, "utf-8");
  return JSON.parse(file) as DepartmentSeed[];
}

async function discoverNoticeCandidate(seed: DepartmentSeed): Promise<DepartmentNoticeCandidate | null> {
  const response = await fetch(seed.siteUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!response.ok) {
    throw new Error(`학과 사이트 요청 실패: ${response.status} (${seed.department})`);
  }

  const html = await response.text();
  const $ = load(html);
  const candidates: DepartmentNoticeCandidate[] = [];

  $("a").each((_, element) => {
    const rawHref = $(element).attr("href")?.trim() ?? "";
    const text = $(element).text();

    if (!rawHref) {
      return;
    }

    const absoluteUrl = toAbsoluteUrl(seed.siteUrl, rawHref);
    const { score, reason } = scoreCandidate(text, absoluteUrl);

    if (score <= 0) {
      return;
    }

    candidates.push({
      ...seed,
      noticeUrl: absoluteUrl,
      parserType: inferParserType(absoluteUrl),
      confidence: score >= 9 ? "high" : score >= 5 ? "medium" : "low",
      reason,
    });
  });

  const sorted = candidates.sort((a, b) => {
    const rank = { high: 3, medium: 2, low: 1 } as const;
    return rank[b.confidence] - rank[a.confidence];
  });

  return sorted[0] ?? null;
}

async function main() {
  const seeds = await loadDepartmentSeeds();
  const outputPath = path.join(process.cwd(), "data", "departments.notice-candidates.json");
  const results: DepartmentNoticeCandidate[] = [];

  for (const seed of seeds) {
    try {
      const candidate = await discoverNoticeCandidate(seed);

      if (candidate) {
        results.push(candidate);
        console.log(`[found] ${seed.department} -> ${candidate.noticeUrl}`);
      } else {
        console.log(`[skip] ${seed.department} -> candidate not found`);
      }
    } catch (error) {
      console.error(`[error] ${seed.department}`);
      console.error(error);
    }
  }

  await fs.writeFile(outputPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(`saved ${results.length} notice candidates to ${outputPath}`);
}

main().catch((error) => {
  console.error("department notice discovery failed");
  console.error(error);
  process.exitCode = 1;
});
