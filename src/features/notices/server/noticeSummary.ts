import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { load } from "cheerio";
import {
  loadNoticeSummaryCacheMap,
  saveNoticeSummaryCacheMap,
  type NoticeSummaryCacheEntry,
  type NoticeSummaryCacheMap,
} from "@/features/notices/server/noticeSummaryCache";

const REQUEST_TIMEOUT_MS = 15000;
const SUMMARY_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const MAX_CONTENT_CHARS = 12000;
const SUMMARY_CACHE_VERSION = "v3";

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
  eventType: string;
  eventDate: string;
  startAt: string;
  endAt: string;
  when: string;
  note: string;
};

export type NoticeSummaryResult = {
  summary: string;
  bullets: string[];
  targetAudience: string;
  deadline: string;
  actionItems: string[];
  benefits: string[];
  requiredDocuments: string[];
  contact: string;
  caution: string;
  calendarItems: NoticeCalendarItem[];
  sourceTitle: string;
  extractedAt: string;
  fromCache: boolean;
};

type InMemoryCacheEntry = {
  value: Omit<NoticeSummaryResult, "fromCache">;
  expiresAt: number;
};

type DeepSeekChoiceMessage = {
  content?: string | null;
};

type DeepSeekPayload = {
  error?: { message?: string };
  choices?: Array<{
    finish_reason?: string;
    message?: DeepSeekChoiceMessage;
  }>;
};

type RawSummaryPayload = {
  summary?: unknown;
  bullets?: unknown;
  targetAudience?: unknown;
  deadline?: unknown;
  actionItems?: unknown;
  benefits?: unknown;
  requiredDocuments?: unknown;
  contact?: unknown;
  caution?: unknown;
  calendarItems?: unknown;
};

const CALENDAR_EVENT_TYPE_ALIASES: Record<string, string> = {
  apply_open: "apply_open",
  application_open: "apply_open",
  모집시작: "apply_open",
  지원시작: "apply_open",
  접수시작: "apply_open",
  시작: "apply_open",
  apply_deadline: "apply_deadline",
  application_deadline: "apply_deadline",
  deadline: "apply_deadline",
  모집마감: "apply_deadline",
  지원마감: "apply_deadline",
  접수마감: "apply_deadline",
  마감: "apply_deadline",
  interview: "interview",
  면접: "interview",
  result: "result",
  발표: "result",
  합격발표: "result",
  orientation: "orientation",
  설명회: "orientation",
  ot: "orientation",
  class_start: "class_start",
  개강: "class_start",
  수업시작: "class_start",
  program_start: "program_start",
  인턴시작: "program_start",
  활동시작: "program_start",
  프로그램시작: "program_start",
  payment: "payment",
  납부: "payment",
  등록: "payment",
  announcement: "announcement",
  공지: "announcement",
  other: "other",
};

const CALENDAR_EVENT_TYPE_LABELS: Record<string, string> = {
  apply_open: "지원 시작",
  apply_deadline: "지원 마감",
  interview: "면접",
  result: "결과 발표",
  orientation: "설명회",
  class_start: "수업 시작",
  program_start: "프로그램 시작",
  payment: "납부",
  announcement: "안내 일정",
  other: "주요 일정",
};

function getSummaryCache() {
  const globalCache = globalThis as typeof globalThis & {
    __noticeSummaryCache?: Map<string, InMemoryCacheEntry>;
  };

  if (!globalCache.__noticeSummaryCache) {
    globalCache.__noticeSummaryCache = new Map<string, InMemoryCacheEntry>();
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
    throw new Error("상세 페이지 주소 형식이 올바르지 않습니다.");
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
      throw new Error("PDF 상세 페이지는 아직 AI 요약을 지원하지 않습니다.");
    }

    const htmlBuffer = Buffer.from(await response.arrayBuffer());
    return {
      html: decodeHtmlBuffer(htmlBuffer, contentType),
      contentType,
    };
  } catch {
    const fallback = await requestHtmlViaNode(url);

    if (fallback.contentType?.includes("application/pdf")) {
      throw new Error("PDF 상세 페이지는 아직 AI 요약을 지원하지 않습니다.");
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
    "다음 대학 공지 본문을 읽고 JSON으로만 답하세요.",
    "불필요한 설명, 코드블록, 마크다운 없이 순수 JSON 객체만 반환하세요.",
    "모든 값은 한국어로 작성하세요.",
    "모르는 값은 추측하지 말고 '명시되지 않음'으로 적으세요.",
    "calendarItems는 최대 6개만 넣고, 실제로 캘린더에 옮길 만한 일정만 담으세요.",
    "calendarItems는 시작일/마감일/면접일/발표일/설명회/수업 시작/납부처럼 이벤트 단위로 쪼개세요.",
    "한 일정 구간에 시작일과 마감일이 모두 있으면 시작 이벤트와 마감 이벤트를 각각 따로 만드세요.",
    "calendarItems.eventType은 apply_open, apply_deadline, interview, result, orientation, class_start, program_start, payment, announcement, other 중 하나만 쓰세요.",
    "calendarItems.eventDate에는 대표 날짜 한 개를 넣고, calendarItems.startAt/endAt에는 정확한 시작/끝 날짜를 YYYY.MM.DD(요일) 형식으로 넣으세요. 없으면 '명시되지 않음'으로 적으세요.",
    "calendarItems.note에는 왜 중요한 일정인지 한 줄로 짧게 적으세요.",
    "benefits에는 혜택, 지원 내용, 특전만 넣으세요.",
    "requiredDocuments에는 제출서류, 준비서류만 넣으세요.",
    "contact에는 문의처가 있으면 전화, 이메일, 부서명을 한 줄로 적으세요.",
    "",
    "반환 JSON 스키마:",
    "{",
    '  "summary": "1~2문장 요약",',
    '  "bullets": ["핵심 포인트", "핵심 포인트"],',
    '  "targetAudience": "대상자",',
    '  "deadline": "가장 중요한 마감일 또는 주요 일정",',
    '  "actionItems": ["해야 할 일", "해야 할 일"],',
    '  "benefits": ["혜택", "혜택"],',
    '  "requiredDocuments": ["준비서류", "준비서류"],',
    '  "contact": "문의처",',
    '  "caution": "주의사항",',
    '  "calendarItems": [',
    '    {',
    '      "label": "프로그램명",',
    '      "eventType": "apply_deadline",',
    '      "eventDate": "2026.06.03(수)",',
    '      "startAt": "2026.06.03(수)",',
    '      "endAt": "2026.06.03(수)",',
    '      "when": "2026.06.03(수)",',
    '      "note": "지원서 제출 마감일"',
    "    }",
    "  ]",
    "}",
    "",
    `[공지 제목] ${input.title}`,
    `[출처] ${input.sourceName}`,
    `[원문 링크] ${input.url}`,
    "",
    "[공지 본문]",
    extractedText,
  ].join("\n");
}

function asCleanString(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const cleaned = cleanText(value);
  return cleaned || fallback;
}

function asStringArray(value: unknown, limit: number) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => (typeof item === "string" ? cleanText(item) : ""))
    .filter(Boolean)
    .slice(0, limit);
}

function normalizeCalendarEventType(value: unknown, fallbackText = "") {
  const normalized = cleanText(typeof value === "string" ? value : fallbackText)
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[-/]/g, "_");

  return CALENDAR_EVENT_TYPE_ALIASES[normalized] ?? "other";
}

function normalizeCalendarDateText(value: unknown) {
  return asCleanString(value, "명시되지 않음");
}

function normalizeCalendarItems(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const source = item as Record<string, unknown>;
      const label = asCleanString(source.label, "");
      const eventType = normalizeCalendarEventType(source.eventType, String(source.note ?? ""));
      const eventDate = normalizeCalendarDateText(source.eventDate ?? source.when);
      const startAt = normalizeCalendarDateText(source.startAt ?? source.eventDate ?? source.when);
      const endAt = normalizeCalendarDateText(source.endAt ?? source.eventDate ?? source.when);
      const when = asCleanString(source.when, "");
      const note = asCleanString(source.note, CALENDAR_EVENT_TYPE_LABELS[eventType] ?? "주요 일정");

      if (!label || !when) return null;

      return { label, eventType, eventDate, startAt, endAt, when, note };
    })
    .filter((item): item is NoticeCalendarItem => Boolean(item))
    .sort((left, right) => {
      const leftKey = left.eventDate === "명시되지 않음" ? left.startAt : left.eventDate;
      const rightKey = right.eventDate === "명시되지 않음" ? right.startAt : right.eventDate;
      return leftKey.localeCompare(rightKey, "ko");
    })
    .slice(0, 6);
}

function extractJsonObject(rawText: string) {
  const trimmed = rawText.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return "";
}

function parseSummaryPayload(rawText: string) {
  const jsonText = extractJsonObject(rawText);
  if (!jsonText) {
    throw new Error("DeepSeek 응답에서 JSON 요약 결과를 찾지 못했습니다.");
  }

  let parsed: RawSummaryPayload;

  try {
    parsed = JSON.parse(jsonText) as RawSummaryPayload;
  } catch {
    throw new Error("DeepSeek 요약 결과를 해석하지 못했습니다.");
  }

  return {
    summary: asCleanString(parsed.summary, "요약을 생성했지만 본문 정리가 충분하지 않았습니다."),
    bullets: asStringArray(parsed.bullets, 4),
    targetAudience: asCleanString(parsed.targetAudience, "명시되지 않음"),
    deadline: asCleanString(parsed.deadline, "명시되지 않음"),
    actionItems: asStringArray(parsed.actionItems, 4),
    benefits: asStringArray(parsed.benefits, 4),
    requiredDocuments: asStringArray(parsed.requiredDocuments, 4),
    contact: asCleanString(parsed.contact, "명시되지 않음"),
    caution: asCleanString(parsed.caution, "명시되지 않음"),
    calendarItems: normalizeCalendarItems(parsed.calendarItems),
  };
}

function toPersistentEntry(value: Omit<NoticeSummaryResult, "fromCache">): NoticeSummaryCacheEntry {
  return {
    value,
    expiresAt: Date.now() + SUMMARY_CACHE_TTL_MS,
  };
}

function applyInMemoryCache(cacheKey: string, value: Omit<NoticeSummaryResult, "fromCache">, expiresAt: number) {
  getSummaryCache().set(cacheKey, {
    value,
    expiresAt,
  });
}

async function readPersistentCache(cacheKey: string) {
  const cacheMap = await loadNoticeSummaryCacheMap();
  const entry = cacheMap[cacheKey];

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    delete cacheMap[cacheKey];
    await saveNoticeSummaryCacheMap(cacheMap).catch(() => undefined);
    return null;
  }

  applyInMemoryCache(cacheKey, entry.value, entry.expiresAt);
  return entry.value;
}

async function writePersistentCache(cacheKey: string, value: Omit<NoticeSummaryResult, "fromCache">) {
  const cacheMap: NoticeSummaryCacheMap = await loadNoticeSummaryCacheMap();
  const entry = toPersistentEntry(value);
  cacheMap[cacheKey] = entry;
  applyInMemoryCache(cacheKey, value, entry.expiresAt);
  await saveNoticeSummaryCacheMap(cacheMap).catch(() => undefined);
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
          role: "system",
          content: "You summarize Korean university notices and must return only a valid JSON object.",
        },
        {
          role: "user",
          content: buildSummaryPrompt(input, extractedText),
        },
      ],
      thinking: {
        type: "disabled",
      },
      response_format: {
        type: "json_object",
      },
      temperature: 0.2,
      max_tokens: 1800,
    }),
  });

  const payload = (await response.json()) as DeepSeekPayload;

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "DeepSeek 요약 요청에 실패했습니다.");
  }

  const choice = payload.choices?.[0];
  const rawText = choice?.message?.content?.trim();

  if (!rawText) {
    const reason = choice?.finish_reason ? ` (${choice.finish_reason})` : "";
    throw new Error(`DeepSeek가 비어 있는 응답을 반환했습니다${reason}.`);
  }

  return parseSummaryPayload(rawText);
}

export async function generateNoticeSummary(input: NoticeSummaryInput): Promise<NoticeSummaryResult> {
  const cacheKey = `${input.url}::${SUMMARY_CACHE_VERSION}`;
  const memoryCache = getSummaryCache().get(cacheKey);

  if (memoryCache && memoryCache.expiresAt > Date.now()) {
    return {
      ...memoryCache.value,
      fromCache: true,
    };
  }

  const persistentCache = await readPersistentCache(cacheKey);
  if (persistentCache) {
    return {
      ...persistentCache,
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

  await writePersistentCache(cacheKey, value);

  return {
    ...value,
    fromCache: false,
  };
}
