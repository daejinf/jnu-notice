import type { Notice, NoticeUpdateSnapshot } from "@/types/notice";
import { readJsonFile, writeJsonFile } from "@/features/notices/server/storagePath";

const HISTORY_FILE_NAME = "notice-updates.json";
const MAX_HISTORY_COUNT = 120;

type AppendNoticeUpdateSnapshotParams = {
  notices: Notice[];
  newNoticeCount: number;
  totalNoticeCount: number;
};

export async function loadNoticeUpdateHistory(): Promise<NoticeUpdateSnapshot[]> {
  return (await readJsonFile<NoticeUpdateSnapshot[]>(HISTORY_FILE_NAME)) ?? [];
}

export async function saveNoticeUpdateHistory(history: NoticeUpdateSnapshot[]) {
  await writeJsonFile(HISTORY_FILE_NAME, history);
}

export async function appendNoticeUpdateSnapshot({
  notices,
  newNoticeCount,
  totalNoticeCount,
}: AppendNoticeUpdateSnapshotParams) {
  const history = await loadNoticeUpdateHistory();
  const nextHistory: NoticeUpdateSnapshot[] = [
    {
      checkedAt: new Date().toISOString(),
      notices,
      newNoticeCount,
      totalNoticeCount,
    },
    ...history,
  ].slice(0, MAX_HISTORY_COUNT);

  await saveNoticeUpdateHistory(nextHistory);
}
