import type { NoticeCheckSnapshot } from "@/types/notice";
import { readJsonFile, writeJsonFile } from "@/features/notices/server/storagePath";

const CHECK_SNAPSHOT_FILE_NAME = "notice-check-snapshot.json";

export async function loadNoticeCheckSnapshot() {
  return await readJsonFile<NoticeCheckSnapshot>(CHECK_SNAPSHOT_FILE_NAME);
}

export async function saveNoticeCheckSnapshot(snapshot: NoticeCheckSnapshot) {
  await writeJsonFile(CHECK_SNAPSHOT_FILE_NAME, snapshot);
}
