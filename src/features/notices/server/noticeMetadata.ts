import { isAllowedNoticeUrl } from "@/features/notices/server/noticeUrlPolicy";
import { extractNoticeTitle } from "@/features/notices/server/noticeTitle";

const METADATA_TTL_MS = 1000 * 60 * 60 * 6;
const REQUEST_TIMEOUT_MS = 10000;

type CacheEntry = { title: string | null; expiresAt: number };

function getCache() {
  const shared = globalThis as typeof globalThis & { __noticeMetadataCache?: Map<string, CacheEntry> };
  if (!shared.__noticeMetadataCache) shared.__noticeMetadataCache = new Map();
  return shared.__noticeMetadataCache;
}

export async function loadNoticeTitle(url: string) {
  if (!isAllowedNoticeUrl(url)) return null;
  const cache = getCache();
  const cached = cache.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached.title;

  try {
    const requestUrl = new URL(url);
    if (requestUrl.hostname.endsWith("jnu.ac.kr") && requestUrl.pathname.toLowerCase().endsWith("/board.aspx") && requestUrl.searchParams.has("key") && !requestUrl.searchParams.has("bbsMode")) {
      requestUrl.searchParams.set("bbsMode", "view");
    }
    const response = await fetch(requestUrl, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`metadata request failed: ${response.status}`);
    const title = extractNoticeTitle(await response.text());
    cache.set(url, { title, expiresAt: Date.now() + METADATA_TTL_MS });
    return title;
  } catch {
    cache.set(url, { title: null, expiresAt: Date.now() + 1000 * 60 * 10 });
    return null;
  }
}
