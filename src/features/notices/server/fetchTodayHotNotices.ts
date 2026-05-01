import type { HotNoticeRankings, HotNoticeSnapshot, Notice } from "@/types/notice";
import { getStorageFileCandidates, readJsonFile, writeJsonFile } from "@/features/notices/server/storagePath";
import { dedupeNotices } from "@/features/notices/lib/sortNotices";
import { loadStoredNotices } from "@/features/notices/server/noticeStorage";

const HOT_NOTICE_PERIOD_KEYS = ["3", "7", "14", "30"] as const;
const HOT_STORAGE_FILE_NAME = "hot-notices.json";

function toSortableTime(date: string) {
  const normalized = date.replaceAll(".", "-");
  const time = new Date(`${normalized}T00:00:00+09:00`).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getThresholdTime(days: number) {
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const startOfTodayKst = new Date(
    Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate()),
  );
  startOfTodayKst.setUTCDate(startOfTodayKst.getUTCDate() - (days - 1));
  return startOfTodayKst.getTime();
}

function buildRecentHotNotices(notices: Notice[], days: number) {
  const thresholdTime = getThresholdTime(days);

  return dedupeNotices(notices)
    .filter((notice) => toSortableTime(notice.date) >= thresholdTime)
    .sort((a: Notice, b: Notice) => {
      if (b.views !== a.views) {
        return b.views - a.views;
      }

      return toSortableTime(b.date) - toSortableTime(a.date);
    });
}

function createEmptyHotRankings(): HotNoticeRankings {
  return {
    "3": [],
    "7": [],
    "14": [],
    "30": [],
  };
}

function buildRecentHotNoticeRankings(notices: Notice[]): HotNoticeRankings {
  return HOT_NOTICE_PERIOD_KEYS.reduce((rankings, periodKey) => {
    rankings[periodKey] = buildRecentHotNotices(notices, Number(periodKey));
    return rankings;
  }, createEmptyHotRankings());
}

function normalizeHotRankings(
  rankings: Partial<HotNoticeRankings> | undefined,
  fallbackNotices: Notice[],
): HotNoticeRankings {
  const normalized = createEmptyHotRankings();

  HOT_NOTICE_PERIOD_KEYS.forEach((periodKey) => {
    normalized[periodKey] = rankings?.[periodKey] ?? (periodKey === "7" ? fallbackNotices : []);
  });

  return normalized;
}

export async function fetchRecentHotNoticeRankings() {
  const snapshot = await readJsonFile<HotNoticeSnapshot>(HOT_STORAGE_FILE_NAME);

  if (snapshot?.rankings) {
    return normalizeHotRankings(snapshot.rankings, snapshot.notices ?? []);
  }

  const notices = await loadStoredNotices();
  return buildRecentHotNoticeRankings(notices);
}

export async function fetchRecentHotNotices() {
  const rankings = await fetchRecentHotNoticeRankings();
  return rankings["7"];
}

export async function saveRecentHotNotices(notices: Notice[]) {
  const rankings = buildRecentHotNoticeRankings(notices);

  await writeJsonFile(HOT_STORAGE_FILE_NAME, {
    checkedAt: new Date().toISOString(),
    notices: rankings["7"],
    rankings,
  } satisfies HotNoticeSnapshot);
}

export function getHotNoticeStoragePath() {
  return getStorageFileCandidates(HOT_STORAGE_FILE_NAME)[0];
}
