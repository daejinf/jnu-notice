import type { HotNoticeSnapshot, Notice } from "@/types/notice";
import { getStorageFileCandidates, readJsonFile, writeJsonFile } from "@/features/notices/server/storagePath";
import { dedupeNotices } from "@/features/notices/lib/sortNotices";

const HOT_NOTICE_DAYS = 7;
const HOT_STORAGE_FILE_NAME = "hot-notices.json";

function toSortableTime(date: string) {
  const normalized = date.replaceAll(".", "-");
  const time = new Date(`${normalized}T00:00:00+09:00`).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getThresholdTime() {
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const startOfTodayKst = new Date(
    Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate()),
  );
  startOfTodayKst.setUTCDate(startOfTodayKst.getUTCDate() - (HOT_NOTICE_DAYS - 1));
  return startOfTodayKst.getTime();
}

function buildRecentHotNotices(notices: Notice[]) {
  const thresholdTime = getThresholdTime();

  return dedupeNotices(notices)
    .filter((notice) => toSortableTime(notice.date) >= thresholdTime)
    .sort((a: Notice, b: Notice) => {
      if (b.views !== a.views) {
        return b.views - a.views;
      }

      return toSortableTime(b.date) - toSortableTime(a.date);
    });
}

export async function fetchRecentHotNotices() {
  const snapshot = await readJsonFile<HotNoticeSnapshot>(HOT_STORAGE_FILE_NAME);
  return snapshot?.notices ?? [];
}

export async function saveRecentHotNotices(notices: Notice[]) {
  const recentHotNotices = buildRecentHotNotices(notices);

  await writeJsonFile(HOT_STORAGE_FILE_NAME, {
    checkedAt: new Date().toISOString(),
    notices: recentHotNotices,
  } satisfies HotNoticeSnapshot);
}

export function getHotNoticeStoragePath() {
  return getStorageFileCandidates(HOT_STORAGE_FILE_NAME)[0];
}
