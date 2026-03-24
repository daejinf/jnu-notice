import { load } from "cheerio";
import type { Notice } from "@/types/notice";
import type { CollegeBoardConfig } from "@/features/notices/config/collegeBoards";
import { dedupeNotices, sortNoticesByDate } from "@/features/notices/lib/sortNotices";
import { buildSubviewNoticeUrl } from "@/features/notices/lib/parsers/subviewUrl";

const COLLEGE_BOARD_DEFAULT_MAX_PAGES = 5;

type FetchCollegeBoardNoticesOptions = {
  page?: number;
  maxPages?: number;
  fetchImpl?: typeof fetch;
};

function cleanCellText(value: string) {
  return value.replace(/\s+/g, " ").replace("새글", "").trim();
}

function parseViews(value: string) {
  const views = Number(value.replaceAll(",", "").trim());
  return Number.isNaN(views) ? 0 : views;
}

function buildCollegePageUrl(college: CollegeBoardConfig, page: number) {
  const url = new URL(college.listUrl);
  url.searchParams.set("page", String(page));
  return url.toString();
}

function buildNoticeUrl(college: CollegeBoardConfig, rawHref: string) {
  if (!rawHref) {
    return college.listUrl;
  }

  if (college.engine === "subview") {
    return buildSubviewNoticeUrl(college.listUrl, rawHref);
  }

  if (rawHref.startsWith("http://") || rawHref.startsWith("https://")) {
    return rawHref;
  }

  if (rawHref.startsWith("/")) {
    const origin = new URL(college.listUrl).origin;
    return new URL(rawHref, origin).toString();
  }

  return new URL(rawHref, college.listUrl).toString();
}

function extractNoticeId(rawId: string, noticeUrl: string, fallbackKey: string, index: number) {
  const numericId = rawId.replace(/\D/g, "");

  if (numericId) {
    return numericId;
  }

  const url = new URL(noticeUrl);
  const articleId =
    url.searchParams.get("articleNo") ??
    url.searchParams.get("num") ??
    url.searchParams.get("no");

  if (articleId) {
    return articleId;
  }

  const pathnameParts = url.pathname.split("/").filter(Boolean);
  const pathId = pathnameParts.at(-2);

  if (pathId && /^\d+$/.test(pathId)) {
    return pathId;
  }

  return `${fallbackKey}-pinned-${index}`;
}

function parseCollegeNoticeRow(
  rowHtml: string,
  college: CollegeBoardConfig,
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
  const isPinned = rawId.includes("공지");
  const noticeUrl = buildNoticeUrl(college, rawHref);

  return {
    id: extractNoticeId(rawId, noticeUrl, college.key, index),
    title: rawTitle,
    url: noticeUrl,
    author,
    date: date.replaceAll(".", "-"),
    views: parseViews(rawViews),
    sourceType: college.sourceType,
    sourceName: college.sourceName,
    category: college.category,
    isPinned,
  };
}

function parseCollegeBoardHtml(html: string, college: CollegeBoardConfig) {
  const $ = load(html);
  const notices: Notice[] = [];

  $("tr").each((index, row) => {
    const rowHtml = $.html(row);
    const notice = parseCollegeNoticeRow(rowHtml, college, index);

    if (notice) {
      notices.push(notice);
    }
  });

  return notices;
}

export async function fetchCollegeBoardNotices(
  college: CollegeBoardConfig,
  options: FetchCollegeBoardNoticesOptions = {},
) {
  if (!college.enabled || !college.listUrl) {
    return [] as Notice[];
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const singlePage = options.page;
  const maxPages =
    singlePage ? 1 : options.maxPages ?? college.maxPages ?? COLLEGE_BOARD_DEFAULT_MAX_PAGES;
  const allNotices: Notice[] = [];

  for (let page = singlePage ?? 1; page <= (singlePage ?? maxPages); page += 1) {
    const pageUrl = buildCollegePageUrl(college, page);
    const response = await fetchImpl(pageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`${college.sourceName} 공지 페이지 요청 실패: ${response.status}`);
    }

    const html = await response.text();
    const pageNotices = parseCollegeBoardHtml(html, college);

    if (pageNotices.length === 0) {
      break;
    }

    allNotices.push(...pageNotices);
  }

  return sortNoticesByDate(dedupeNotices(allNotices));
}

export async function fetchMultipleCollegeBoardNotices(
  colleges: CollegeBoardConfig[],
  options: FetchCollegeBoardNoticesOptions = {},
) {
  const settledGroups = await Promise.all(
    colleges.map(async (college) => {
      try {
        return await fetchCollegeBoardNotices(college, options);
      } catch (error) {
        console.error(`[notice-fetch] ${college.sourceName}`, error);
        return [] as Notice[];
      }
    }),
  );

  return sortNoticesByDate(dedupeNotices(settledGroups.flat()));
}