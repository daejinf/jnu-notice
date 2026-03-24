import { load } from "cheerio";
import type { Notice } from "@/types/notice";
import type { DepartmentConfig } from "@/features/notices/config/departments";
import { dedupeNotices, sortNoticesByDate } from "@/features/notices/lib/sortNotices";
import { buildSubviewNoticeUrl } from "@/features/notices/lib/parsers/subviewUrl";

function cleanCellText(value: string) {
  return value.replace(/\s+/g, " ").replace("새글", "").trim();
}

function parseViews(value: string) {
  const views = Number(value.replaceAll(",", "").trim());
  return Number.isNaN(views) ? 0 : views;
}

function buildPageUrl(department: DepartmentConfig, page: number) {
  const url = new URL(department.noticeUrl);
  url.searchParams.set("page", String(page));
  return url.toString();
}

function buildNoticeUrl(department: DepartmentConfig, rawHref: string) {
  return buildSubviewNoticeUrl(department.siteUrl, rawHref);
}

function extractNoticeId(rawId: string, noticeUrl: string, fallbackKey: string, index: number) {
  const numericId = rawId.replace(/\D/g, "");

  if (numericId) {
    return numericId;
  }

  const url = new URL(noticeUrl);
  const articleId = url.searchParams.get("articleNo") ?? url.searchParams.get("no");

  if (articleId) {
    return articleId;
  }

  return `${fallbackKey}-${index}`;
}

function parseDepartmentNoticeRow(
  rowHtml: string,
  department: DepartmentConfig,
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

  return {
    id: extractNoticeId(rawId, buildNoticeUrl(department, rawHref), department.key, index),
    title: rawTitle,
    url: buildNoticeUrl(department, rawHref),
    author,
    date: date.replaceAll(".", "-"),
    views: parseViews(rawViews),
    sourceType: "department",
    sourceName: department.department,
    category: "공지사항",
    isPinned: rawId.includes("공지"),
  };
}

export async function fetchSubviewDepartmentNotices(
  department: DepartmentConfig,
  fetchImpl: typeof fetch,
  maxPages: number,
) {
  const allNotices: Notice[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const pageUrl = buildPageUrl(department, page);
    const response = await fetchImpl(pageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`학과 공지 페이지 요청 실패: ${response.status}`);
    }

    const html = await response.text();
    const $ = load(html);
    const pageNotices: Notice[] = [];

    $("tr").each((index, row) => {
      const rowHtml = $.html(row);
      const notice = parseDepartmentNoticeRow(rowHtml, department, index);

      if (notice) {
        pageNotices.push(notice);
      }
    });

    if (pageNotices.length === 0) {
      break;
    }

    allNotices.push(...pageNotices);
  }

  return sortNoticesByDate(dedupeNotices(allNotices));
}