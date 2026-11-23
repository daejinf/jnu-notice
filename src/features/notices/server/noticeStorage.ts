import type { Notice, NoticeFeedSnapshot } from "@/types/notice";
import { getStorageFileCandidates, readJsonFile, writeJsonFile } from "@/features/notices/server/storagePath";

const STORAGE_FILE_NAME = "stored-notices.json";
const FEED_STORAGE_FILE_NAME = "feed-notices.json";

export async function loadStoredNotices(): Promise<Notice[]> {
  return (await readJsonFile<Notice[]>(STORAGE_FILE_NAME)) ?? [];
}

export async function saveNotices(notices: Notice[]) {
  await writeJsonFile(STORAGE_FILE_NAME, notices);
}

export async function loadFeedNotices(): Promise<NoticeFeedSnapshot | null> {
  return await readJsonFile<NoticeFeedSnapshot>(FEED_STORAGE_FILE_NAME);
}

export async function saveFeedNotices(snapshot: NoticeFeedSnapshot) {
  await writeJsonFile(FEED_STORAGE_FILE_NAME, snapshot);
}

export function getStorageFilePath() {
  return getStorageFileCandidates(STORAGE_FILE_NAME)[0];
}
