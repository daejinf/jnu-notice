import { load } from "cheerio";
import type { Notice } from "@/types/notice";
import type { DepartmentConfig } from "@/features/notices/config/departments";
import { dedupeNotices, sortNoticesByDate } from "@/features/notices/lib/sortNotices";

function cleanCellText(value: string) {
  return value.replace(/\s+/g, " ").replace("새글", "").trim();
}

function parseViews(value: string) {
  const views = Number(value.replaceAll(",", "").trim());
  return Number.isNaN(views) ? 0 : views;
}

function normalizeDate(value: string) {
  const matched = value.match(/\d{4}[./-]\d{1,2}[./-]\d{1,2}/)?.[0] ?? value;
  return matched.replaceAll("/", "-").replaceAll(".", "-");
}

function buildPageUrl(department: DepartmentConfig, page: number) {
  const url = new URL(department.noticeUrl);
  url.searchParams.set("page", String(page));
  return url.toString();
}

function buildNoticeUrl(department: DepartmentConfig, rawHref: string) {
  if (!rawHref) {
    return department.noticeUrl;
  }

  if (rawHref.startsWith("http://") || rawHref.startsWith("https://")) {
    return rawHref;
  }

  if (rawHref.startsWith("/")) {
    return new URL(rawHref, department.noticeUrl).toString();
  }

  return new URL(rawHref, department.noticeUrl).toString();
}

function extractNoticeId(rawId: string, noticeUrl: string, fallbackKey: string, index: number) {
  const numericId = rawId.replace(/\D/g, "");

  if (numericId) {
    return numericId;
  }

  const url = new URL(noticeUrl);
  const articleId =
    url.searchParams.get("number") ??
    url.searchParams.get("num") ??
    url.searchParams.get("no");

  if (articleId) {
    return articleId;
  }

  return `${fallbackKey}-${index}`;
}

function parseDepartmentNoticeRow($: ReturnType<typeof load>, row: any, department: DepartmentConfig, index: number): Notice | null {
  const cells = $(row).find("td");
  const link = $(row).find('td.left a[href*="mode=view"]').first();

  if (cells.length < 5 || link.length === 0) {
    return null;
  }

  const rawId = cleanCellText($(cells[0]).text());
  const rawTitle = cleanCellText(link.text());
  const author = cleanCellText($(cells[cells.length - 3]).text());
  const date = cleanCellText($(cells[cells.length - 2]).text());
  const rawViews = cleanCellText($(cells[cells.length - 1]).text());
  const rawHref = link.attr("href")?.trim() ?? "";

  if (!rawTitle || !date || !rawHref) {
    return null;
  }

  const noticeUrl = buildNoticeUrl(department, rawHref);

  return {
    id: extractNoticeId(rawId, noticeUrl, department.key, index),
    title: rawTitle,
    url: noticeUrl,
    author,
    date: normalizeDate(date),
    views: parseViews(rawViews),
    sourceType: "department",
    sourceName: department.department,
    category: "공지사항",
    isPinned: rawId.includes("공지"),
  };
}

export async function fetchXboardDepartmentNotices(
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
      throw new Error(`xboard department page request failed: ${response.status}`);
    }

    const html = await response.text();
    const $ = load(html);
    const pageNotices: Notice[] = [];

    $("#xb_fm_list table tbody tr").each((index, row) => {
      const notice = parseDepartmentNoticeRow($, row, department, index);

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
