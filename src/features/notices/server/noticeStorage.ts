import type { Notice } from "@/types/notice";
import { getStorageFileCandidates, readJsonFile, writeJsonFile } from "@/features/notices/server/storagePath";

const STORAGE_FILE_NAME = "stored-notices.json";

export async function loadStoredNotices(): Promise<Notice[]> {
  return (await readJsonFile<Notice[]>(STORAGE_FILE_NAME)) ?? [];
}

export async function saveNotices(notices: Notice[]) {
  await writeJsonFile(STORAGE_FILE_NAME, notices);
}

export function getStorageFilePath() {
  return getStorageFileCandidates(STORAGE_FILE_NAME)[0];
}
