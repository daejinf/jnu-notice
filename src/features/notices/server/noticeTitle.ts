import { load } from "cheerio";
import { isLikelyTruncatedTitle, normalizeNoticeTitle } from "@/features/notices/utils/noticeTitle";

const BOARD_TITLE_SELECTORS = [
  ".board_view_title",
  ".board-view-title",
  ".view-title",
  ".view_title",
  ".bbs-view .title",
  ".board_view .title",
  ".view_head h1",
  ".view_head h2",
  ".view_head h3",
  ".board_view_wrap .view_head h3",
  "article h1",
  "main h1",
  "h1",
];

function isGenericSiteTitle(value: string) {
  const normalized = value.toLowerCase();
  return /^(전남대학교(?: 홈페이지| 광주 생활관| 여수 생활관)?|chonnam national university)$/.test(normalized);
}

export function extractNoticeTitle(html: string) {
  const $ = load(html);
  const candidates: Array<{ value: string; priority: number }> = [];

  BOARD_TITLE_SELECTORS.forEach((selector, index) => {
    const value = normalizeNoticeTitle($(selector).first().text());
    if (value.length >= 6) candidates.push({ value, priority: 400 - index });
  });

  const documentTitle = normalizeNoticeTitle($("title").first().text());
  const openGraphTitle = normalizeNoticeTitle($('meta[property="og:title"]').attr("content"));
  const twitterTitle = normalizeNoticeTitle($('meta[name="twitter:title"]').attr("content"));
  if (documentTitle.length >= 6) candidates.push({ value: documentTitle, priority: 300 });
  if (openGraphTitle.length >= 6) candidates.push({ value: openGraphTitle, priority: 200 });
  if (twitterTitle.length >= 6) candidates.push({ value: twitterTitle, priority: 190 });

  const deduped = [...new Map(candidates.map((item) => [item.value, item])).values()];
  return deduped
    .filter((item) => !isGenericSiteTitle(item.value))
    .sort((left, right) => {
      const complete = Number(!isLikelyTruncatedTitle(right.value)) - Number(!isLikelyTruncatedTitle(left.value));
      return complete || right.priority - left.priority || right.value.length - left.value.length;
    })[0]?.value ?? null;
}
