import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { load } from "cheerio";

const REQUEST_TIMEOUT_MS = 15000;
const SUMMARY_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const MAX_CONTENT_CHARS = 12000;

const CONTENT_SELECTOR_CANDIDATES = [
  ".board_view_wrap",
  ".view_body",
  ".view_head",
  "article",
  ".article",
  ".board_view",
  ".board-view",
  ".view-content",
  ".view_cont",
  ".view-con",
  ".cont",
  ".content",
  ".contents",
  ".detail",
  ".detail-content",
  ".substance",
  ".fr-view",
  ".xe_content",
  ".read_body",
  ".bo_v_con",
  ".con",
  "#jwxe_main_content",
  "#content",
  "#contents",
  "#bbs_content",
];

type NoticeSummaryInput = {
  url: string;
  title: string;
  sourceName: string;
};

export type NoticeCalendarItem = {
  label: string;
  when: string;
  note: string;
};

export type NoticeSummaryResult = {
  summary: string;
  bullets: string[];
  targetAudience: string;
  deadline: string;
  actionItems: string[];
  caution: string;
  calendarItems: NoticeCalendarItem[];
  sourceTitle: string;
  extractedAt: string;
  fromCache: boolean;
};

type CacheEntry = {
  value: Omit<NoticeSummaryResult, "fromCache">;
  expiresAt: number;
};

function getSummaryCache() {
  const globalCache = globalThis as typeof globalThis & {
    __noticeSummaryCache?: Map<string, CacheEntry>;
  };

  if (!globalCache.__noticeSummaryCache) {
    globalCache.__noticeSummaryCache = new Map<string, CacheEntry>();
  }

  return globalCache.__noticeSummaryCache;
}

function normalizeCharset(charset: string | null | undefined) {
  const normalized = (charset ?? "").trim().toLowerCase().replaceAll('"', "");

  if (!normalized) return "utf-8";
  if (["utf8", "utf-8"].includes(normalized)) return "utf-8";
  if (["euc-kr", "euckr", "cp949", "x-windows-949", "ks_c_5601-1987"].includes(normalized)) {
    return "euc-kr";
  }

  return normalized;
}

function detectCharsetFromHtml(buffer: Buffer, contentType?: string | null) {
  const headerMatch = contentType?.match(/charset=([^;]+)/i);
  if (headerMatch?.[1]) {
    return normalizeCharset(headerMatch[1]);
  }

  const asciiSample = buffer.toString("latin1", 0, Math.min(buffer.length, 4096));
  const metaCharsetMatch = asciiSample.match(/<meta[^>]+charset=["']?\s*([^\s"'>/]+)/i);
  if (metaCharsetMatch?.[1]) {
    return normalizeCharset(metaCharsetMatch[1]);
  }

  const metaContentTypeMatch = asciiSample.match(/<meta[^>]+content=["'][^"']*charset=([^\s"'>;]+)/i);
  if (metaContentTypeMatch?.[1]) {
    return normalizeCharset(metaContentTypeMatch[1]);
  }

  return "utf-8";
}

function decodeHtmlBuffer(buffer: Buffer, contentType?: string | null) {
  const charset = detectCharsetFromHtml(buffer, contentType);

  try {
    return new TextDecoder(charset).decode(buffer);
  } catch {
    return buffer.toString("utf8");
  }
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function extractStructuredText(rootHtml: string) {
  const $ = load(rootHtml);
  $("script, style, noscript, iframe, svg, nav, footer, header, button, input, select, textarea").remove();
  $("br").replaceWith("\n");
  $("li").prepend("\n- ");
  $("tr").prepend("\n");
  $("p, div, section, article, ul, ol, table").prepend("\n");
  $("td, th").each((_, element) => {
    $(element).prepend(" ");
    $(element).append(" | ");
  });

  return $.root()
    .text()
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

async function requestHtmlViaNode(url: string, redirectCount = 0): Promise<{ html: string; contentType: string | null }> {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const requester = target.protocol === "https:" ? httpsRequest : httpRequest;
    const req = requester(
      target,
      {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        ...(target.protocol === "https:" ? { rejectUnauthorized: false } : {}),
      },
      (response) => {
        const statusCode = response.statusCode ?? 0;
        const location = response.headers.location;

        if (location && statusCode >= 300 && statusCode < 400 && redirectCount < 5) {
          response.resume();
          requestHtmlViaNode(new URL(location, target).toString(), redirectCount + 1)
            .then(resolve)
            .catch(reject);
          return;
        }

        if (statusCode < 200 || statusCode >= 300) {
          response.resume();
          reject(new Error(`detail page request failed: ${response.statusCode}`));
          return;
        }

        const chunks: Buffer[] = [];
        response.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        response.on("end", () => {
          resolve({
            html: decodeHtmlBuffer(Buffer.concat(chunks), response.headers["content-type"]),
            contentType: response.headers["content-type"] ?? null,
          });
        });
      },
    );

    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy(new Error("detail page request timed out"));
    });

    req.on("error", reject);
    req.end();
  });
}

async function fetchNoticeDetailHtml(url: string) {
  const parsedUrl = new URL(url);

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("지원하지 않는 상세 링크 형식입니다.");
  }

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      cache: "no-store",
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`detail page request failed: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/pdf")) {
      throw new Error("PDF 상세 페이지는 아직 지원하지 않습니다.");
    }

    const htmlBuffer = Buffer.from(await response.arrayBuffer());
    return {
      html: decodeHtmlBuffer(htmlBuffer, contentType),
      contentType,
    };
  } catch {
    const fallback = await requestHtmlViaNode(url);

    if (fallback.contentType?.includes("application/pdf")) {
      throw new Error("PDF 상세 페이지는 아직 지원하지 않습니다.");
    }

    return fallback;
  }
}

function pickBestContentBlock(html: string) {
  const $ = load(html);
  $("script, style, noscript, iframe, svg, nav, footer, header, button, input, select, textarea").remove();

  const orderedCandidates = CONTENT_SELECTOR_CANDIDATES
    .map((selector) => ({
      selector,
      text: extractStructuredText($.html($(selector).first()) || ""),
    }))
    .filter((candidate) => candidate.text.length > 0);

  const prioritizedCandidate =
    orderedCandidates.find((candidate) => candidate.text.length >= 120)?.text ?? "";
  const longestCandidate =
    orderedCandidates.sort((left, right) => right.text.length - left.text.length)[0]?.text ?? "";
  const bodyText = extractStructuredText($.html($("body")) || "");
  const title = cleanText($("title").first().text());

  const content = (prioritizedCandidate || longestCandidate || bodyText).slice(0, MAX_CONTENT_CHARS);

  if (!content) {
    throw new Error("상세 페이지에서 읽을 수 있는 본문을 찾지 못했습니다.");
  }

  return {
    sourceTitle: title,
    content,
  };
}

function buildSummaryPrompt(input: NoticeSummaryInput, extractedText: string) {
  return [
    "다음은 대학 공지 상세 페이지 원문입니다.",
    "한국어로만 답하고, 정보가 불충분하면 추측하지 말고 '명시되지 않음'이라고 적어주세요.",
    "중요한 마감일, 대상, 해야 할 일을 빠뜨리지 말고 짧고 실용적으로 정리해주세요.",
    "캘린더에 넣을 가치가 있는 일정만 추려주세요. 일반 안내성 기간 전체보다 신청, 접수, 납부, 마감처럼 사용자가 실제로 챙겨야 하는 일정이 우선입니다.",
    "",
    "[출력 규칙]",
    "- 아래 라벨 형식을 정확히 지켜서 일반 텍스트로만 출력",
    "- 항목명은 영어 대문자 라벨 그대로 유지",
    "- 목록 항목은 반드시 '- '로 시작",
    "- 정보가 없으면 '명시되지 않음' 또는 '없음' 사용",
    "",
    "SUMMARY:",
    "1~2문장 요약",
    "",
    "BULLETS:",
    "- 핵심 포인트",
    "- 핵심 포인트",
    "",
    "TARGET_AUDIENCE:",
    "대상자",
    "",
    "DEADLINE:",
    "마감일 또는 일정",
    "",
    "ACTION_ITEMS:",
    "- 해야 할 일",
    "- 해야 할 일",
    "",
    "CAUTION:",
    "주의사항",
    "",
    "CALENDAR_ITEMS:",
    "- 일정이름 | 일정 | 메모",
    "- 일정이름 | 일정 | 메모",
    "- 최대 3개까지만",
    "",
    `[공지 제목] ${input.title}`,
    `[공지 출처] ${input.sourceName}`,
    `[상세 링크] ${input.url}`,
    "",
    "[공지 원문]",
    extractedText,
  ].join("\n");
}

function parseLabeledSection(rawText: string, label: string, nextLabels: string[]) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedNextLabels = nextLabels.map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const boundary = escapedNextLabels.length > 0 ? `(?=\\n(?:${escapedNextLabels.join("|")}):|$)` : "$";
  const pattern = new RegExp(`${escapedLabel}:\\s*([\\s\\S]*?)${boundary}`, "i");
  const matched = rawText.match(pattern);
  return matched?.[1]?.trim() ?? "";
}

function parseBulletSection(rawText: string) {
  return rawText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);
}

function parseCalendarItems(rawText: string) {
  return rawText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .map((line) => {
      const [label = "", when = "", note = ""] = line.split("|").map((item) => item.trim());
      return { label, when, note };
    })
    .filter((item) => item.label && item.when)
    .slice(0, 3);
}

function parseSummaryText(rawText: string) {
  const summary = parseLabeledSection(rawText, "SUMMARY", [
    "BULLETS",
    "TARGET_AUDIENCE",
    "DEADLINE",
    "ACTION_ITEMS",
    "CAUTION",
    "CALENDAR_ITEMS",
  ]);
  const bulletsText = parseLabeledSection(rawText, "BULLETS", [
    "TARGET_AUDIENCE",
    "DEADLINE",
    "ACTION_ITEMS",
    "CAUTION",
    "CALENDAR_ITEMS",
  ]);
  const targetAudience = parseLabeledSection(rawText, "TARGET_AUDIENCE", [
    "DEADLINE",
    "ACTION_ITEMS",
    "CAUTION",
    "CALENDAR_ITEMS",
  ]);
  const deadline = parseLabeledSection(rawText, "DEADLINE", ["ACTION_ITEMS", "CAUTION", "CALENDAR_ITEMS"]);
  const actionItemsText = parseLabeledSection(rawText, "ACTION_ITEMS", ["CAUTION", "CALENDAR_ITEMS"]);
  const caution = parseLabeledSection(rawText, "CAUTION", ["CALENDAR_ITEMS"]);
  const calendarItemsText = parseLabeledSection(rawText, "CALENDAR_ITEMS", []);

  return {
    summary: summary || "요약을 생성하지 못했습니다.",
    bullets: parseBulletSection(bulletsText).slice(0, 4),
    targetAudience: targetAudience || "명시되지 않음",
    deadline: deadline || "명시되지 않음",
    actionItems: parseBulletSection(actionItemsText).slice(0, 4),
    caution: caution || "없음",
    calendarItems: parseCalendarItems(calendarItemsText),
  };
}

async function requestDeepSeekSummary(input: NoticeSummaryInput, extractedText: string) {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  const model = process.env.DEEPSEEK_MODEL?.trim() || "deepseek-v4-flash";

  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY 환경변수가 설정되지 않았습니다.");
  }

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: buildSummaryPrompt(input, extractedText),
        },
      ],
      temperature: 0.2,
      max_tokens: 1024,
    }),
  });

  const payload = (await response.json()) as {
    error?: { message?: string };
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "DeepSeek 요약 요청에 실패했습니다.");
  }

  const rawText = payload.choices?.[0]?.message?.content?.trim();
  if (!rawText) {
    throw new Error("DeepSeek가 요약 결과를 반환하지 않았습니다.");
  }

  return parseSummaryText(rawText);
}

export async function generateNoticeSummary(input: NoticeSummaryInput): Promise<NoticeSummaryResult> {
  const cache = getSummaryCache();
  const cacheKey = input.url;
  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return {
      ...cached.value,
      fromCache: true,
    };
  }

  const { html } = await fetchNoticeDetailHtml(input.url);
  const extracted = pickBestContentBlock(html);
  const summarized = await requestDeepSeekSummary(input, extracted.content);
  const value = {
    ...summarized,
    sourceTitle: extracted.sourceTitle,
    extractedAt: new Date().toISOString(),
  };

  cache.set(cacheKey, {
    value,
    expiresAt: Date.now() + SUMMARY_CACHE_TTL_MS,
  });

  return {
    ...value,
    fromCache: false,
  };
}
