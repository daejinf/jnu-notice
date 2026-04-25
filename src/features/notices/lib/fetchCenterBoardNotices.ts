import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { load, type Cheerio, type CheerioAPI } from "cheerio";
import type { AnyNode } from "domhandler";
import type { CollegeBoardConfig } from "@/features/notices/config/collegeBoards";
import type { CenterBoardConfig } from "@/features/notices/config/centerBoards";
import { fetchCollegeBoardNotices } from "@/features/notices/lib/fetchCollegeBoardNotices";
import { mapWithConcurrency } from "@/features/notices/lib/concurrency";
import { dedupeNotices, sortNoticesByDate } from "@/features/notices/lib/sortNotices";
import type { Notice } from "@/types/notice";

const DATE_RANGE_PATTERN = /(\d{4}-\d{2}-\d{2})\s*~\s*(\d{4}-\d{2}-\d{2})/;
const DATE_PATTERN = /(\d{4}[.-]\d{2}[.-]\d{2})/;
const MIN_TITLE_LENGTH = 6;
const MOVE_PAGE_VIEW_PATTERN = /movePageView\((\d+)\)/;
const TITLE_SHORT_DATE_PATTERN = /\((\d{2})\.\s*(\d{2})\.\s*(\d{2})\.?\)/;
const TITLE_FULL_DATE_PATTERN = /\((\d{4})\.\s*(\d{2})\.\s*(\d{2})\.?\)/;
const REQUEST_TIMEOUT_MS = 12000;

type FetchCenterBoardNoticesOptions = {
  page?: number;
  maxPages?: number;
  fetchImpl?: typeof fetch;
};

type GenericParserOptions = {
  scopeSelector?: string;
  linkSelector?: string;
  containerSelector?: string;
  author?: string;
};

function normalizeCharset(charset: string | null | undefined) {
  const normalized = (charset ?? "").trim().toLowerCase().replaceAll('"', '');

  if (!normalized) {
    return "utf-8";
  }

  if (["utf8", "utf-8"].includes(normalized)) {
    return "utf-8";
  }

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

function requestHtmlViaNode(url: string, redirectCount = 0, timeoutMs = REQUEST_TIMEOUT_MS): Promise<string> {
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
          requestHtmlViaNode(new URL(location, target).toString(), redirectCount + 1, timeoutMs)
            .then(resolve)
            .catch(reject);
          return;
        }

        if (statusCode < 200 || statusCode >= 300) {
          response.resume();
          reject(new Error(`request failed: ${statusCode}`));
          return;
        }

        const chunks: Buffer[] = [];
        response.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        response.on("end", () => {
          resolve(decodeHtmlBuffer(Buffer.concat(chunks), response.headers["content-type"]));
        });
      },
    );

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error("request timed out"));
    });

    req.on("error", reject);
    req.end();
  });
}

async function fetchHtml(pageUrl: string, fetchImpl: typeof fetch) {
  try {
    const response = await fetchImpl(pageUrl, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      cache: "no-store",
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`request failed: ${response.status}`);
    }

    const htmlBuffer = Buffer.from(await response.arrayBuffer());
    return decodeHtmlBuffer(htmlBuffer, response.headers.get("content-type"));
  } catch {
    return requestHtmlViaNode(pageUrl);
  }
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeDate(value: string) {
  return value.replaceAll(".", "-");
}

function parseViews(value: string) {
  const parsed = Number(cleanText(value).replaceAll(",", ""));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function findColumnIndexByHeader(row: Cheerio<AnyNode>, matcher: (text: string, className: string) => boolean) {
  const headers = row.find("th").toArray();

  for (let index = 0; index < headers.length; index += 1) {
    const header = row.find("th").eq(index);
    const text = cleanText(header.text());
    const className = header.attr("class") ?? "";

    if (matcher(text, className)) {
      return index;
    }
  }

  return -1;
}

function buildNoticeUrl(center: CenterBoardConfig, rawHref: string) {
  if (!rawHref) {
    return center.listUrl;
  }

  if (rawHref.startsWith("http://") || rawHref.startsWith("https://")) {
    return rawHref;
  }

  return new URL(rawHref, center.listUrl).toString();
}

function extractIdFromUrl(url: string, fallback: string) {
  try {
    const parsed = new URL(url);
    const idFromParams =
      parsed.searchParams.get("uid") ??
      parsed.searchParams.get("id") ??
      parsed.searchParams.get("no") ??
      parsed.searchParams.get("articleNo") ??
      parsed.searchParams.get("p") ??
      parsed.searchParams.get("page_id") ??
      parsed.searchParams.get("BoardSeq") ??
      parsed.searchParams.get("Seq");

    if (idFromParams) {
      return idFromParams;
    }

    const pathname = parsed.pathname.split("/").filter(Boolean).join("-");
    return pathname || fallback;
  } catch {
    return fallback;
  }
}

function isSkippableLink(rawHref: string, title: string) {
  if (!rawHref || !title) {
    return true;
  }

  if (
    rawHref.startsWith("#") ||
    rawHref.startsWith("javascript:") ||
    rawHref.includes("/wp-content/") ||
    rawHref.includes("/wp-admin/")
  ) {
    return true;
  }

  return title.length < MIN_TITLE_LENGTH;
}

function buildCenterPageUrl(center: CenterBoardConfig, page: number) {
  if (page <= 1) {
    return center.listUrl;
  }

  if (center.engine === "sojoong-education") {
    const base = center.listUrl.endsWith("/") ? center.listUrl : `${center.listUrl}/`;
    return new URL(`page/${page}/`, base).toString();
  }

  if (center.engine === "sojoong-notice") {
    const url = new URL(center.listUrl);
    url.searchParams.set("mod", "list");
    url.searchParams.set("pageid", String(page));
    return url.toString();
  }

  if (center.engine === "coss-notice") {
    const url = new URL(center.listUrl);
    url.searchParams.set("bd", "notice");
    url.searchParams.set("page", String(page));
    return url.toString();
  }

  if (center.engine === "aspnet-board") {
    const url = new URL(center.listUrl);
    url.searchParams.set("PageNum", String(page));
    return url.toString();
  }

  if (center.engine === "library-bbs") {
    const url = new URL(center.listUrl);
    url.searchParams.set("pn", String(page));
    return url.toString();
  }

  if (center.engine === "grow-notice") {
    const url = new URL(center.listUrl);
    const segments = url.pathname.split("/").filter(Boolean);

    if (segments.length >= 2 && segments[segments.length - 2] === "list") {
      segments[segments.length - 1] = String(page);
      url.pathname = `/${segments.join("/")}`;
      return url.toString();
    }

    url.pathname = "/ko/program/intro/list/0/" + String(page);
    url.search = "";
    return url.toString();
  }

  if (center.engine === "ile-notice") {
    const url = new URL(center.listUrl);
    url.pathname = page <= 1 ? "/ko/community/notice" : `/ko/community/notice/list/${page}`;
    url.search = "";
    return url.toString();
  }

  return null;
}

function buildCossNoticeUrl(center: CenterBoardConfig, id: string) {
  const listUrl = new URL(center.listUrl);
  const detailUrl = new URL(`./view/${id}`, listUrl);
  detailUrl.searchParams.set("bd", "notice");
  detailUrl.searchParams.set("page", "1");

  const cate = listUrl.searchParams.get("cate");
  if (cate) {
    detailUrl.searchParams.set("cate", cate);
  }

  return detailUrl.toString();
}

function parseSojoongEducationHtml(html: string, center: CenterBoardConfig) {
  const $ = load(html);
  const notices: Notice[] = [];
  const seen = new Set<string>();

  $(".edu-box").each((index, element) => {
    const box = $(element);
    const link = box.find(".edu-content a").first();
    const rawHref = link.attr("href")?.trim() ?? "";
    const title = cleanText(link.find("h3").first().text());
    const status = cleanText(link.find("span").first().text()) || center.sourceName;
    const dateText = cleanText(box.find(".edu-date span").first().text());

    if (!rawHref || !title || !dateText) {
      return;
    }

    const dateMatch = dateText.match(DATE_RANGE_PATTERN);
    if (!dateMatch) {
      return;
    }

    const noticeUrl = buildNoticeUrl(center, rawHref);
    const seenKey = `${title}::${dateMatch[1]}`;
    if (seen.has(seenKey)) {
      return;
    }

    seen.add(seenKey);

    notices.push({
      id: extractIdFromUrl(noticeUrl, `${center.key}-${index}`),
      title,
      url: noticeUrl,
      author: status,
      date: dateMatch[1],
      views: 0,
      sourceType: center.sourceType,
      sourceName: center.sourceName,
      category: center.category,
      isPinned: false,
    });
  });

  return sortNoticesByDate(dedupeNotices(notices));
}

function parseSojoongDetailViews(html: string) {
  const $ = load(html);
  const detailText =
    cleanText($(".detail-attr.detail-view .detail-value").first().text()) ||
    cleanText($(".detail-view .detail-value").first().text());

  return parseViews(detailText);
}

async function enrichNoticeViews(
  notices: Notice[],
  fetchImpl: typeof fetch,
  parseDetailViews: (html: string) => number,
) {
  const enriched = await Promise.all(
    notices.map(async (notice) => {
      try {
        const html = await fetchHtml(notice.url, fetchImpl);
        const views = parseDetailViews(html);

        return {
          ...notice,
          views: views || notice.views,
        };
      } catch {
        return notice;
      }
    }),
  );

  return sortNoticesByDate(dedupeNotices(enriched));
}

function findDateInNearbyText($: CheerioAPI, link: Cheerio<AnyNode>) {
  const candidateTexts = [
    cleanText(link.parent().text()),
    cleanText(link.closest("div").text()),
    cleanText(link.parent().prev().text()),
    cleanText(link.parent().next().text()),
    cleanText(link.closest("div").prev().text()),
    cleanText(link.closest("div").next().text()),
    cleanText(link.closest("li").text()),
  ].filter(Boolean);

  for (const candidate of candidateTexts) {
    const match = candidate.match(DATE_PATTERN);
    if (match) {
      return normalizeDate(match[1]);
    }
  }

  return null;
}

function parseSojoongNoticeHtml(html: string, center: CenterBoardConfig) {
  const $ = load(html);
  const notices: Notice[] = [];
  const seen = new Set<string>();

  $('a[href*="mod=document"]').each((index, element) => {
    const link = $(element);
    const rawHref = link.attr("href")?.trim() ?? "";
    const title = cleanText(link.text());

    if (isSkippableLink(rawHref, title)) {
      return;
    }

    const date = findDateInNearbyText($, link);
    if (!date) {
      return;
    }

    const noticeUrl = buildNoticeUrl(center, rawHref);
    const seenKey = `${title}::${date}`;
    if (seen.has(seenKey)) {
      return;
    }

    seen.add(seenKey);

    notices.push({
      id: extractIdFromUrl(noticeUrl, `${center.key}-${index}`),
      title,
      url: noticeUrl,
      author: center.sourceName,
      date,
      views: 0,
      sourceType: center.sourceType,
      sourceName: center.sourceName,
      category: center.category,
      isPinned: title.toLowerCase().includes("notice"),
    });
  });

  return sortNoticesByDate(dedupeNotices(notices));
}

function parseCossNoticeHtml(html: string, center: CenterBoardConfig) {
  const $ = load(html);
  const notices: Notice[] = [];
  const seen = new Set<string>();

  $("table.basicBoard tbody tr").each((index, element) => {
    const row = $(element);
    const cells = row.find("td");
    if (cells.length < 4) {
      return;
    }

    const rawNo = cleanText(cells.eq(0).text());
    const titleCell = cells.eq(1);
    const link = titleCell.find("a").first();
    const title = cleanText(titleCell.find("strong.cutText").first().text()) || cleanText(link.text());
    const rawHref = link.attr("href")?.trim() ?? "";
    const date = normalizeDate(cleanText(cells.eq(2).text()));
    const views = parseViews(cells.eq(3).text());
    const movePageMatch = rawHref.match(MOVE_PAGE_VIEW_PATTERN);

    if (!title || !date || !movePageMatch) {
      return;
    }

    const noticeId = movePageMatch[1];
    const noticeUrl = buildCossNoticeUrl(center, noticeId);
    const seenKey = `${title}::${date}`;

    if (seen.has(seenKey)) {
      return;
    }

    seen.add(seenKey);

    notices.push({
      id: noticeId,
      title,
      url: noticeUrl,
      author: center.sourceName,
      date,
      views,
      sourceType: center.sourceType,
      sourceName: center.sourceName,
      category: center.category,
      isPinned: rawNo.includes("Notice"),
    });
  });

  return sortNoticesByDate(dedupeNotices(notices));
}

function parseAspNetBoardHtml(html: string, center: CenterBoardConfig) {
  const $ = load(html);
  const notices: Notice[] = [];
  const seen = new Set<string>();
  const headerRow = $("table tr").filter((_, element) => $(element).find("th").length > 0).first();
  const viewsColumnIndex = headerRow.length
    ? findColumnIndexByHeader(headerRow, (text, className) => text.includes("조회") || className.includes("hit"))
    : -1;

  $("table tr").each((index, element) => {
    const row = $(element);
    const link = row.find('a[href*="Mode=View"], a[href*="Notice.aspx?"], a[href*="Board.aspx?"]').first();
    const rawHref = link.attr("href")?.trim() ?? "";
    const title = cleanText(link.text());
    const cells = row.find("td");

    if (!rawHref || !title || cells.length < 3) {
      return;
    }

    const rowText = cleanText(row.text());
    const dateMatch = rowText.match(DATE_PATTERN);
    if (!dateMatch) {
      return;
    }

    const noticeUrl = buildNoticeUrl(center, rawHref);
    const date = normalizeDate(dateMatch[1]);
    const seenKey = `${title}::${date}`;

    if (seen.has(seenKey)) {
      return;
    }

    seen.add(seenKey);

    const rawNo = cleanText(cells.eq(0).text());
    const author = cells.length >= 4 ? cleanText(cells.eq(2).text()) || center.sourceName : center.sourceName;
    const views =
      viewsColumnIndex >= 0 && cells.length > viewsColumnIndex
        ? parseViews(cells.eq(viewsColumnIndex).text())
        : cells.length >= 5
          ? parseViews(cells.eq(4).text())
          : 0;

    notices.push({
      id: extractIdFromUrl(noticeUrl, `${center.key}-${index}`),
      title,
      url: noticeUrl,
      author,
      date,
      views,
      sourceType: center.sourceType,
      sourceName: center.sourceName,
      category: center.category,
      isPinned: rawNo.includes("怨듭?") || rawNo.toLowerCase().includes("notice"),
    });
  });

  return sortNoticesByDate(dedupeNotices(notices));
}

function extractDateFromTitle(title: string) {
  const fullMatch = title.match(TITLE_FULL_DATE_PATTERN);
  if (fullMatch) {
    return `${fullMatch[1]}-${fullMatch[2]}-${fullMatch[3]}`;
  }

  const shortMatch = title.match(TITLE_SHORT_DATE_PATTERN);
  if (shortMatch) {
    return `20${shortMatch[1]}-${shortMatch[2]}-${shortMatch[3]}`;
  }

  return "";
}
function getTodayKstDate() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function parseCapdHomeDate(value: string) {
  const raw = cleanText(value);
  const fullMatch = raw.match(/(20\d{2})\.(\d{2})\.(\d{2})/);

  if (fullMatch) {
    return `${fullMatch[1]}-${fullMatch[2]}-${fullMatch[3]}`;
  }

  const shortMatch = raw.match(/(\d{2})\.(\d{2})\.(\d{2})/);
  if (shortMatch) {
    return `20${shortMatch[1]}-${shortMatch[2]}-${shortMatch[3]}`;
  }

  return "";
}

function parseCapdHomeStatus(value: string) {
  const raw = cleanText(value).toUpperCase();

  if (raw === "留덇컧") {
    return { label: "留덇컧", kind: "closed" as const };
  }

  if (raw === "D-DAY" || /^D-\d+$/.test(raw)) {
    return { label: raw, kind: "deadline" as const };
  }

  return null;
}
function getCapdHomeSectionSelector(center: CenterBoardConfig) {
  switch (center.key) {
    case "capd-notice":
      return ".recent.recent1";
    case "capd-program":
      return ".recent.recent2";
    case "capd-job-fair":
      return ".recent.recent3";
    case "capd-recommend":
      return ".recent.recent4";
    default:
      return null;
  }
}

function pushCapdHomeNotice(
  notices: Notice[],
  seen: Set<string>,
  center: CenterBoardConfig,
  title: string,
  rawHref: string,
  rawDate: string,
  index: number,
  isPinned: boolean,
) {
  const normalizedTitle = cleanText(title);
  if (!normalizedTitle || !rawHref) {
    return;
  }

  const noticeUrl = buildNoticeUrl(center, rawHref);
  const date = parseCapdHomeDate(rawDate);
  const seenKey = `${normalizedTitle}::${noticeUrl}`;
  const status = parseCapdHomeStatus(rawDate);

  if (seen.has(seenKey)) {
    return;
  }

  seen.add(seenKey);
  notices.push({
    id: extractIdFromUrl(noticeUrl, `${center.key}-${index}`),
    title: normalizedTitle,
    url: noticeUrl,
    author: center.sourceName,
    date,
    views: 0,
    sourceType: center.sourceType,
    sourceName: center.sourceName,
    category: center.category,
    isPinned,
    statusLabel: status?.label,
    statusKind: status?.kind,
  });
}

function parseCapdHomeSectionHtml(html: string, center: CenterBoardConfig) {
  const selector = getCapdHomeSectionSelector(center);
  if (!selector) {
    return [] as Notice[];
  }

  const $ = load(html);
  const section = $(selector).first();
  if (section.length === 0) {
    return [] as Notice[];
  }

  const notices: Notice[] = [];
  const seen = new Set<string>();

  const featuredLink = section.find('.notice a').first();
  const featuredTitle = cleanText(featuredLink.attr('title') ?? '') || cleanText(featuredLink.find('b').first().text()) || cleanText(featuredLink.text());
  const featuredHref = featuredLink.attr('href')?.trim() ?? '';
  const featuredDate = cleanText(section.find('.notice > span').first().text());
  pushCapdHomeNotice(notices, seen, center, featuredTitle, featuredHref, featuredDate, 0, true);

  section.find('ul > li').each((index, element) => {
    const item = $(element);
    const link = item.find('a').first();
    const title = cleanText(item.attr('title') ?? '') || cleanText(link.attr('title') ?? '') || cleanText(link.find('p').first().text()) || cleanText(link.text());
    const rawHref = link.attr('href')?.trim() ?? '';
    const rawDate = cleanText(item.find('span').last().text());
    pushCapdHomeNotice(notices, seen, center, title, rawHref, rawDate, index + 1, false);
  });

  return sortNoticesByDate(dedupeNotices(notices));
}

function findCapdDetailValue(
  $: CheerioAPI,
  labelPattern: RegExp,
  valuePattern: RegExp,
) {
  const containerSelectors = ["tr", "li", "dl", "dt", "dd", "table", "div", "td", "th"];

  for (const selector of containerSelectors) {
    const elements = $(selector).toArray();

    for (const element of elements) {
      const text = cleanText($(element).text());
      if (!text || !labelPattern.test(text)) {
        continue;
      }

      const match = text.match(valuePattern);
      if (match?.[1]) {
        return cleanText(match[1]);
      }
    }
  }

  return null;
}

function parseCapdDetailMeta(html: string) {
  const $ = load(html);
  const text = cleanText($.root().text());
  const compactHtml = html.replace(/\s+/g, " ");
  const dateLabelPattern = /(?:\uC791\uC131\uC77C|\uB4F1\uB85D\uC77C|\uAC8C\uC2DC\uC77C|\uB4F1\uB85D\uC77C\uC2DC|\uC791\uC131\uC77C\uC2DC)/;
  const dateValuePattern = /(?:\uC791\uC131\uC77C|\uB4F1\uB85D\uC77C|\uAC8C\uC2DC\uC77C|\uB4F1\uB85D\uC77C\uC2DC|\uC791\uC131\uC77C\uC2DC)\s*[:?]?\s*(20\d{2}[.-]\d{2}[.-]\d{2}|\d{2}[.-]\d{2}[.-]\d{2})/;
  const viewsLabelPattern = /(?:\uC870\uD68C\uC218|\uC870\uD68C)/;
  const viewsValuePattern = /(?:\uC870\uD68C\uC218|\uC870\uD68C)\s*[:?]?\s*([0-9,]+)/;

  const dateValue =
    findCapdDetailValue($, dateLabelPattern, dateValuePattern) ??
    text.match(dateValuePattern)?.[1] ??
    compactHtml.match(/(?:\uC791\uC131\uC77C|\uB4F1\uB85D\uC77C|\uAC8C\uC2DC\uC77C|\uB4F1\uB85D\uC77C\uC2DC|\uC791\uC131\uC77C\uC2DC)[^0-9]{0,80}(20\d{2}[.-]\d{2}[.-]\d{2}|\d{2}[.-]\d{2}[.-]\d{2})/)?.[1] ??
    "";

  const viewsValue =
    findCapdDetailValue($, viewsLabelPattern, viewsValuePattern) ??
    text.match(viewsValuePattern)?.[1] ??
    compactHtml.match(/(?:\uC870\uD68C\uC218|\uC870\uD68C)[^0-9]{0,80}([0-9,]+)/)?.[1] ??
    "";

  return {
    date: dateValue ? parseCapdHomeDate(dateValue) : "",
    views: viewsValue ? parseViews(viewsValue) : 0,
  };
}

async function enrichCapdHomeNotices(notices: Notice[], fetchImpl: typeof fetch) {
  const enriched = await Promise.all(
    notices.map(async (notice) => {
      try {
        const html = await fetchHtml(notice.url, fetchImpl);
        const meta = parseCapdDetailMeta(html);

        return {
          ...notice,
          date: meta.date || notice.date || getTodayKstDate(),
          views: meta.views || notice.views,
        };
      } catch {
        return {
          ...notice,
          date: notice.date || getTodayKstDate(),
        };
      }
    }),
  );

  return sortNoticesByDate(dedupeNotices(enriched));
}

function parseGrowNoticeHtml(html: string, center: CenterBoardConfig) {
  const $ = load(html);
  const notices: Notice[] = [];
  const seen = new Set<string>();

  $('ul[data-role="list"] div[data-module="eco"][data-role="item"]').each((index, element) => {
    const item = $(element);
    const link = item.find('a[data-idx]').first();
    const rawHref = link.attr("href")?.trim() ?? "";
    const title = cleanText(item.find(".title_wrap .title").first().text());
    const institution = cleanText(item.find(".department .institution").first().text());
    const department = cleanText(item.find(".department .department").first().text());
    const author = cleanText([institution, department].filter(Boolean).join(" ")) || center.sourceName;
    const date = normalizeDate(item.find('.date_layer time').first().text().slice(0, 10));
    const views = parseViews(item.find('.hit .hit').first().text().replace(/\s*HITS/i, ""));
    const stateLabel = cleanText(item.find('> a > label b').first().text());

    if (!rawHref || !title || !date) {
      return;
    }

    const noticeUrl = buildNoticeUrl(center, rawHref);
    const seenKey = `${title}::${date}`;

    if (seen.has(seenKey)) {
      return;
    }

    seen.add(seenKey);

    notices.push({
      id: extractIdFromUrl(noticeUrl, `${center.key}-${index}`),
      title,
      url: noticeUrl,
      author,
      date,
      views,
      sourceType: center.sourceType,
      sourceName: center.sourceName,
      category: center.category,
      isPinned: stateLabel === "?꾨컯" || stateLabel.startsWith("D-"),
    });
  });

  return sortNoticesByDate(dedupeNotices(notices));
}
function parseIleNoticeHtml(html: string, center: CenterBoardConfig) {
  const $ = load(html);
  const notices: Notice[] = [];
  const seen = new Set<string>();

  $('ul[data-role="table"] > li.tbody').each((index, element) => {
    const row = $(element);
    const link = row.find('.title a').first();
    const rawHref = link.attr('href')?.trim() ?? '';
    const title = cleanText(link.text());
    const author = cleanText(row.find('.name [data-role="name"]').first().text()) || center.sourceName;
    const date = normalizeDate(row.find('.reg_date time').first().text());
    const views = parseViews(row.find('.hit').first().text().replace(/\D+/g, ""));
    const rawNo = cleanText(row.find('.loopnum').first().text());

    if (!rawHref || !title || !date) {
      return;
    }

    const noticeUrl = buildNoticeUrl(center, rawHref);
    const seenKey = `${title}::${date}`;

    if (seen.has(seenKey)) {
      return;
    }

    seen.add(seenKey);

    notices.push({
      id: extractIdFromUrl(noticeUrl, `${center.key}-${index}`),
      title,
      url: noticeUrl,
      author,
      date,
      views,
      sourceType: center.sourceType,
      sourceName: center.sourceName,
      category: center.category,
      isPinned: row.hasClass('notice') || rawNo.includes('怨듭?'),
    });
  });

  return sortNoticesByDate(dedupeNotices(notices));
}

function parseLibraryNoticeHtml(html: string, center: CenterBoardConfig) {
  const $ = load(html);
  const notices: Notice[] = [];
  const seen = new Set<string>();
  const viewsColumnIndex = findColumnIndexByHeader(
    $("table.mobileTable thead tr").first(),
    (text, className) => text.includes("議고쉶") || className.includes("hit"),
  );

  $("table.mobileTable tbody tr").each((index, element) => {
    const row = $(element);
    const cells = row.find("td");
    const link = row.find('a[href]').first();
    const rawHref = link.attr("href")?.trim() ?? "";
    const title = cleanText(link.text());

    if (!rawHref || !title || cells.length === 0) {
      return;
    }

    const date = normalizeDate(cleanText(cells.eq(Math.max(0, viewsColumnIndex - 1)).text()));
    const views =
      viewsColumnIndex >= 0 && cells.length > viewsColumnIndex
        ? parseViews(cells.eq(viewsColumnIndex).text())
        : 0;

    if (!date) {
      return;
    }

    const noticeUrl = buildNoticeUrl(center, rawHref);
    const seenKey = `${title}::${date}`;

    if (seen.has(seenKey)) {
      return;
    }

    seen.add(seenKey);

    notices.push({
      id: extractIdFromUrl(noticeUrl, `${center.key}-${index}`),
      title,
      url: noticeUrl,
      author: center.sourceName,
      date,
      views,
      sourceType: center.sourceType,
      sourceName: center.sourceName,
      category: center.category,
      isPinned: cleanText(cells.eq(1).text()).includes("怨듭?"),
    });
  });

  return sortNoticesByDate(dedupeNotices(notices));
}

function parseGenericDatedLinks(
  html: string,
  center: CenterBoardConfig,
  options: GenericParserOptions = {},
) {
  const $ = load(html);
  const notices: Notice[] = [];
  const seen = new Set<string>();
  const scope = options.scopeSelector ? $(options.scopeSelector).first() : $.root();
  const searchRoot = scope.length > 0 ? scope : $.root();
  const links = searchRoot.find(options.linkSelector ?? "a[href]");

  links.each((index, element) => {
    const link = $(element);
    const rawHref = link.attr("href")?.trim() ?? "";
    const rawTitle = cleanText(link.text()).replace(/^\d{4}[.-]\d{2}[.-]\d{2}\s+/, "");

    if (isSkippableLink(rawHref, rawTitle)) {
      return;
    }

    const container = link.closest(options.containerSelector ?? "article, tr, li, .edu-box, div");
    const blockText = cleanText((container.length > 0 ? container : link).text());
    const dateMatch = blockText.match(DATE_PATTERN) ?? rawTitle.match(DATE_PATTERN);

    if (!dateMatch) {
      return;
    }

    const normalizedDate = normalizeDate(dateMatch[1]);
    const noticeUrl = buildNoticeUrl(center, rawHref);
    const seenKey = `${rawTitle}::${normalizedDate}`;

    if (seen.has(seenKey) || noticeUrl === center.listUrl) {
      return;
    }

    seen.add(seenKey);

    const isPinned = /^notice$/i.test(blockText.split(" ")[0] ?? "") || blockText.includes("怨듭?");

    notices.push({
      id: extractIdFromUrl(noticeUrl, `${center.key}-${index}`),
      title: rawTitle,
      url: noticeUrl,
      author: options.author ?? center.sourceName,
      date: normalizedDate,
      views: 0,
      sourceType: center.sourceType,
      sourceName: center.sourceName,
      category: center.category,
      isPinned,
    });
  });

  return sortNoticesByDate(dedupeNotices(notices));
}

function parseCenterHtml(html: string, center: CenterBoardConfig) {
  switch (center.engine) {
    case "sojoong-education":
      return parseSojoongEducationHtml(html, center);
    case "sojoong-notice":
      return parseSojoongNoticeHtml(html, center);
    case "coss-notice":
      return parseCossNoticeHtml(html, center);
    case "aspnet-board":
      return parseAspNetBoardHtml(html, center);
    case "juice-main":
      return parseGenericDatedLinks(html, center, {
        scopeSelector: "main, #container, #contents, body",
        author: center.sourceName,
      });
    case "grow-notice":
      return parseGrowNoticeHtml(html, center);
    case "ile-notice":
      return parseIleNoticeHtml(html, center);
    case "library-bbs":
      return parseLibraryNoticeHtml(html, center);
    case "capd-program":
      return parseGenericDatedLinks(html, center, {
        scopeSelector: "main, .container, body",
        author: center.sourceName,
      });
    case "capd-home-section":
      return parseCapdHomeSectionHtml(html, center);
    default:
      return [] as Notice[];
  }
}

async function fetchCenterByCustomEngine(
  center: CenterBoardConfig,
  options: FetchCenterBoardNoticesOptions = {},
) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const singlePage = options.page;
  const maxPages = singlePage ? 1 : options.maxPages ?? center.maxPages ?? 1;
  const allNotices: Notice[] = [];

  for (let page = singlePage ?? 1; page <= (singlePage ?? maxPages); page += 1) {
    const pageUrl = buildCenterPageUrl(center, page) ?? center.listUrl;

    const html = await fetchHtml(pageUrl, fetchImpl);
    if (center.engine === "capd-home-section") {
      const pageNotices = parseCapdHomeSectionHtml(html, center);

      if (pageNotices.length === 0) {
        break;
      }

      allNotices.push(...(await enrichCapdHomeNotices(pageNotices, fetchImpl)));

      break;
    }

    const pageNotices = parseCenterHtml(html, center);

    if (pageNotices.length === 0) {
      break;
    }

    allNotices.push(...pageNotices);

    if (!buildCenterPageUrl(center, page + 1)) {
      break;
    }
  }

  if (center.engine === "sojoong-notice") {
    return enrichNoticeViews(allNotices, fetchImpl, parseSojoongDetailViews);
  }

  if (center.engine === "sojoong-education") {
    return sortNoticesByDate(dedupeNotices(allNotices));
  }

  return sortNoticesByDate(dedupeNotices(allNotices));
}

export async function fetchCenterBoardNotices(
  center: CenterBoardConfig,
  options: FetchCenterBoardNoticesOptions = {},
) {
  if (!center.enabled || !center.listUrl) {
    return [] as Notice[];
  }

  if (
    center.engine === "sojoong-education" ||
    center.engine === "sojoong-notice" ||
    center.engine === "coss-notice" ||
    center.engine === "juice-main" ||
    center.engine === "aspnet-board" ||
    center.engine === "grow-notice" ||
    center.engine === "ile-notice" ||
    center.engine === "library-bbs" ||
    center.engine === "capd-program" ||
    center.engine === "capd-home-section"
  ) {
    return fetchCenterByCustomEngine(center, options);
  }

  return fetchCollegeBoardNotices(center as unknown as CollegeBoardConfig, options);
}

export async function fetchMultipleCenterBoardNotices(
  centers: CenterBoardConfig[],
  options: FetchCenterBoardNoticesOptions = {},
) {
  const settledGroups = await mapWithConcurrency(centers, 4, async (center) => {
    try {
      return await fetchCenterBoardNotices(center, options);
    } catch (error) {
      console.error(`[center-fetch] ${center.sourceName}`, error);
      return [] as Notice[];
    }
  });

  return sortNoticesByDate(dedupeNotices(settledGroups.flat()));
}






