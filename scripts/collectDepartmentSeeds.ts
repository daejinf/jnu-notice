import "dotenv/config";
import { load } from "cheerio";
import { promises as fs } from "node:fs";
import path from "node:path";
import { engineeringDepartmentSeedPages } from "../src/features/notices/seeds/engineeringDepartmentSeeds";
import type { DepartmentSeed } from "../src/features/notices/seeds/types";

function normalizeDepartmentName(name: string) {
  return name.replace(/\s+/g, " ").trim();
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

function extractDepartmentNameFromCellText(cellText: string) {
  const normalized = normalizeDepartmentName(cellText)
    .replace("홈페이지 바로가기", "")
    .replace(/\d{2,3}\)\d{3,4}-\d{4}(,\s*\d{3,4})*/g, "")
    .trim();

  const match = normalized.match(/[가-힣A-Za-z0-9·()]+(학과|학부)$/);
  return match?.[0] ?? "";
}

async function collectDepartmentSeeds(pageUrl: string, college: string): Promise<DepartmentSeed[]> {
  const response = await fetch(pageUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!response.ok) {
    throw new Error(`학과 목록 페이지 요청 실패: ${response.status}`);
  }

  const html = await response.text();
  const $ = load(html);
  const seeds: DepartmentSeed[] = [];
  const seen = new Set<string>();

  $("a").each((_, element) => {
    const text = normalizeDepartmentName($(element).text());
    const rawHref = $(element).attr("href")?.trim() ?? "";

    if (!text.includes("홈페이지 바로가기") || !rawHref) {
      return;
    }

    const cellText = $(element).closest("td").text();
    const department = extractDepartmentNameFromCellText(cellText);
    const siteUrl = toAbsoluteUrl(pageUrl, rawHref);

    if (!department || !siteUrl.includes("jnu.ac.kr")) {
      return;
    }

    const key = `${college}::${department}::${siteUrl}`;

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    seeds.push({
      college,
      department,
      siteUrl,
    });
  });

  return seeds;
}

async function main() {
  const outputPath = path.join(process.cwd(), "data", "departments.seed.json");
  const allSeeds: DepartmentSeed[] = [];

  for (const seedPage of engineeringDepartmentSeedPages) {
    const seeds = await collectDepartmentSeeds(seedPage.url, seedPage.college);
    allSeeds.push(...seeds);
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(allSeeds, null, 2), "utf-8");

  console.log(`saved ${allSeeds.length} department seeds to ${outputPath}`);
}

main().catch((error) => {
  console.error("department seed collection failed");
  console.error(error);
  process.exitCode = 1;
});
