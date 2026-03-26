import type { Notice } from "@/types/notice";

const IGNORED_QUERY_PARAMS = new Set([
  "jsessionid",
  "listparam",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
]);

function normalizeUrl(rawUrl: string) {
  const trimmedUrl = rawUrl.trim();

  if (!trimmedUrl) {
    return "";
  }

  try {
    const parsedUrl = new URL(trimmedUrl);
    parsedUrl.hash = "";
    parsedUrl.pathname = parsedUrl.pathname.replace(/;jsessionid=[^/;?#]*/gi, "");

    const stableParams = new URLSearchParams();
    const entries = [...parsedUrl.searchParams.entries()].sort(([a], [b]) => a.localeCompare(b));

    for (const [key, value] of entries) {
      if (IGNORED_QUERY_PARAMS.has(key.toLowerCase())) {
        continue;
      }

      stableParams.append(key, value);
    }

    const normalizedSearch = stableParams.toString();
    const normalizedPath = parsedUrl.pathname.replace(/\/+$/, "") || "/";

    return `${parsedUrl.origin}${normalizedPath}${normalizedSearch ? `?${normalizedSearch}` : ""}`;
  } catch {
    return trimmedUrl.replace(/;jsessionid=[^/;?#]*/gi, "");
  }
}

export function getNoticeIdentity(notice: Notice) {
  if (notice.url && notice.url.trim().length > 0) {
    return `url:${normalizeUrl(notice.url)}`;
  }

  return [
    "fallback",
    notice.sourceType,
    notice.sourceName.trim(),
    notice.category.trim(),
    notice.title.trim(),
    notice.date.trim(),
  ].join(":");
}
