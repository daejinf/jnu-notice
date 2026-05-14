import type { NoticeSummaryResult } from "@/features/notices/server/noticeSummary";
import {
  loadGitHubNoticeSummaryCacheMap,
  saveGitHubNoticeSummaryCacheMap,
} from "@/features/notices/server/githubNoticeSummaryCacheStorage";
import { readJsonFile, writeJsonFile } from "@/features/notices/server/storagePath";

const CACHE_FILE_NAME = "notice-summary-cache.json";

export type NoticeSummaryCacheEntry = {
  value: Omit<NoticeSummaryResult, "fromCache">;
  expiresAt: number;
};

export type NoticeSummaryCacheMap = Record<string, NoticeSummaryCacheEntry>;

async function loadLocalNoticeSummaryCacheMap() {
  return (await readJsonFile<NoticeSummaryCacheMap>(CACHE_FILE_NAME)) ?? {};
}

async function saveLocalNoticeSummaryCacheMap(cacheMap: NoticeSummaryCacheMap) {
  await writeJsonFile(CACHE_FILE_NAME, cacheMap);
}

export async function loadNoticeSummaryCacheMap() {
  return (await loadGitHubNoticeSummaryCacheMap<NoticeSummaryCacheMap>()) ?? (await loadLocalNoticeSummaryCacheMap());
}

export async function saveNoticeSummaryCacheMap(cacheMap: NoticeSummaryCacheMap) {
  await saveLocalNoticeSummaryCacheMap(cacheMap);
  await saveGitHubNoticeSummaryCacheMap(cacheMap).catch(() => false);
}
