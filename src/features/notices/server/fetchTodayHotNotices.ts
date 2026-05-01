import type { HotNoticeRankings, HotNoticeSnapshot, Notice } from "@/types/notice";
import { getStorageFileCandidates, readJsonFile, writeJsonFile } from "@/features/notices/server/storagePath";
import { dedupeNotices } from "@/features/notices/lib/sortNotices";
import { loadStoredNotices } from "@/features/notices/server/noticeStorage";

const HOT_NOTICE_PERIOD_KEYS = ["3", "7", "14", "30"] as const;
const HOT_STORAGE_FILE_NAME = "hot-notices.json";
const DAY_MS = 24 * 60 * 60 * 1000;

function toSortableTime(date: string) {
  const normalized = date.replaceAll(".", "-");
  const time = new Date(`${normalized}T00:00:00+09:00`).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getTodayKstDateKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return year && month && day ? `${year}-${month}-${day}` : null;
}

function getHotPeriodRange(days: number) {
  const todayKstDateKey = getTodayKstDateKey();
  const startOfTodayKst = todayKstDateKey
    ? new Date(`${todayKstDateKey}T00:00:00+09:00`).getTime()
    : Date.now();

  return {
    startTime: startOfTodayKst - (days - 1) * DAY_MS,
    endTime: startOfTodayKst + DAY_MS - 1,
  };
}

function buildRecentHotNotices(notices: Notice[], days: number) {
  const { startTime, endTime } = getHotPeriodRange(days);

  return dedupeNotices(notices)
    .filter((notice) => {
      const noticeTime = toSortableTime(notice.date);
      return noticeTime >= startTime && noticeTime <= endTime;
    })
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

function flattenHotRankings(rankings: Partial<HotNoticeRankings> | undefined) {
  return HOT_NOTICE_PERIOD_KEYS.flatMap((periodKey) => rankings?.[periodKey] ?? []);
}

export async function fetchRecentHotNoticeRankings() {
  const [snapshot, storedNotices] = await Promise.all([
    readJsonFile<HotNoticeSnapshot>(HOT_STORAGE_FILE_NAME),
    loadStoredNotices(),
  ]);

  const snapshotNotices = snapshot
    ? [...flattenHotRankings(snapshot.rankings), ...(snapshot.notices ?? [])]
    : [];
  const allKnownNotices = [...snapshotNotices, ...storedNotices];

  return buildRecentHotNoticeRankings(allKnownNotices);
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
