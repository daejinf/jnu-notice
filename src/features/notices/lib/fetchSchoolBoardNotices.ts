import { load } from "cheerio";
import type { Notice } from "@/types/notice";
import type { SchoolBoardCategory } from "@/features/notices/config/schoolBoardCategories";
import { dedupeNotices, sortNoticesByDate } from "@/features/notices/lib/sortNotices";

const SCHOOL_BOARD_BASE_URL =
  "https://www.jnu.ac.kr/WebApp/web/HOM/COM/Board/board.aspx";

const TITLE_CATEGORY_PATTERN = /^\[([^\]]+)\]\s*/;

export const SCHOOL_BOARD_MAX_PAGES = 5;

type FetchSchoolBoardNoticesOptions = {
  page?: number;
  maxPages?: number;
  fetchImpl?: typeof fetch;
};

export function buildSchoolBoardUrl(category: Pick<SchoolBoardCategory, "cate">, page = 1) {
  const url = new URL(SCHOOL_BOARD_BASE_URL);
  url.searchParams.set("boardID", "5");
  url.searchParams.set("cate", category.cate);
  url.searchParams.set("page", String(page));
  return url.toString();
}

function cleanCellText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function parseViews(value: string) {
  const views = Number(value.replaceAll(",", "").trim());
  return Number.isNaN(views) ? 0 : views;
}

function extractCategoryFromTitle(rawTitle: string) {
  const match = rawTitle.match(TITLE_CATEGORY_PATTERN);
  return match?.[1]?.trim() ?? null;
}

function cleanTitle(rawTitle: string) {
  return cleanCellText(rawTitle).replace(TITLE_CATEGORY_PATTERN, "").trim();
}

function buildNoticeUrl(rawHref: string, page: number) {
  if (!rawHref) {
    return SCHOOL_BOARD_BASE_URL;
  }

  if (rawHref.startsWith("http://") || rawHref.startsWith("https://")) {
    return rawHref;
  }

  if (rawHref.startsWith("javascript:")) {
    const keyMatch = rawHref.match(/key\s*=\s*['\"]?(\d+)/i) ?? rawHref.match(/['\"](\d{4,})['\"]/);

    if (keyMatch?.[1]) {
      const url = new URL(SCHOOL_BOARD_BASE_URL);
      url.searchParams.set("boardID", "5");
      url.searchParams.set("bbsMode", "view");
      url.searchParams.set("page", String(page));
      url.searchParams.set("key", keyMatch[1]);
      return url.toString();
    }
  }

  return new URL(rawHref, SCHOOL_BOARD_BASE_URL).toString();
}

function extractNoticeId(rawId: string, noticeUrl: string, fallbackKey: string, index: number) {
  const key = new URL(noticeUrl).searchParams.get("key");

  if (key) {
    return key;
  }

  if (rawId && rawId !== "공지") {
    return rawId;
  }

  return `${fallbackKey}-pinned-${index}`;
}

function parseNoticeRow(
  rowHtml: string,
  category: SchoolBoardCategory,
  page: number,
  index: number,
): Notice | null {
  const $ = load(`<table><tbody>${rowHtml}</tbody></table>`);
  const cells = $("td")
    .map((_, element) => cleanCellText($(element).text()))
    .get();

  const link = $("a").first();
  const rawHref = link.attr("href")?.trim() ?? "";

  if (cells.length < 5 || !rawHref) {
    return null;
  }

  const [rawId, rawTitle, author, date, rawViews] = cells;
  const noticeUrl = buildNoticeUrl(rawHref, page);
  const detectedCategory = extractCategoryFromTitle(rawTitle);
  const isPinned = rawId === "공지";

  return {
    id: extractNoticeId(rawId, noticeUrl, category.key, index),
    title: cleanTitle(rawTitle),
    url: noticeUrl,
    author,
    date,
    views: parseViews(rawViews),
    sourceType: category.sourceType,
    sourceName: category.sourceName,
    category: detectedCategory ?? category.name,
    isPinned,
  };
}

function parseSchoolBoardHtml(html: string, category: SchoolBoardCategory, page: number) {
  const $ = load(html);
  const notices: Notice[] = [];

  $("tr").each((index, row) => {
    const rowHtml = $.html(row);
    const notice = parseNoticeRow(rowHtml, category, page, index);

    if (notice) {
      notices.push(notice);
    }
  });

  return notices;
}

export async function fetchSchoolBoardNotices(
  category: SchoolBoardCategory,
  options: FetchSchoolBoardNoticesOptions = {},
): Promise<Notice[]> {
  const singlePage = options.page;
  const maxPages = singlePage ? 1 : options.maxPages ?? SCHOOL_BOARD_MAX_PAGES;
  const fetchImpl = options.fetchImpl ?? fetch;
  const allNotices: Notice[] = [];

  for (let page = singlePage ?? 1; page <= (singlePage ?? maxPages); page += 1) {
    const url = buildSchoolBoardUrl(category, page);
    const response = await fetchImpl(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`학교 공지 페이지 요청 실패: ${response.status}`);
    }

    const html = await response.text();
    const pageNotices = parseSchoolBoardHtml(html, category, page);

    if (pageNotices.length === 0) {
      break;
    }

    allNotices.push(...pageNotices);
  }

  return sortNoticesByDate(dedupeNotices(allNotices));
}

export async function fetchMultipleSchoolBoardNotices(
  categories: SchoolBoardCategory[],
  options: FetchSchoolBoardNoticesOptions = {},
) {
  const noticeGroups = await Promise.all(
    categories.map((category) => fetchSchoolBoardNotices(category, options)),
  );

  return sortNoticesByDate(dedupeNotices(noticeGroups.flat()));
}
