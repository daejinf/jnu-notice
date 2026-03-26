import type { Notice, NoticeUpdateSnapshot } from "@/types/notice";
import { readJsonFile, writeJsonFile } from "@/features/notices/server/storagePath";
import { getNoticeIdentity } from "@/features/notices/server/noticeIdentity";

const HISTORY_FILE_NAME = "notice-updates.json";
const MAX_HISTORY_COUNT = 120;
const FRESH_NOTICE_GRACE_DAYS = 1;
const DAY_MS = 24 * 60 * 60 * 1000;

type AppendNoticeUpdateSnapshotParams = {
  notices: Notice[];
  newNoticeCount: number;
  totalNoticeCount: number;
};

function normalizeNoticeDate(value: string) {
  return value.replaceAll(".", "-").replaceAll("/", "-");
}

function getNoticeTime(notice: Notice) {
  const time = new Date(`${normalizeNoticeDate(notice.date)}T00:00:00+09:00`).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getCheckedAtBaseline(checkedAt: string) {
  const checkedDate = new Date(checkedAt);

  if (Number.isNaN(checkedDate.getTime())) {
    return 0;
  }

  const kstDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(checkedDate);
  const baseline = new Date(`${kstDate}T00:00:00+09:00`).getTime();

  return Number.isNaN(baseline) ? 0 : baseline - FRESH_NOTICE_GRACE_DAYS * DAY_MS;
}

export function filterFreshNotices(notices: Notice[], checkedAt: string) {
  const baseline = getCheckedAtBaseline(checkedAt);

  if (baseline <= 0) {
    return notices;
  }

  return notices.filter((notice) => getNoticeTime(notice) >= baseline);
}

function normalizeSnapshot(snapshot: NoticeUpdateSnapshot): NoticeUpdateSnapshot {
  const notices = filterFreshNotices(snapshot.notices, snapshot.checkedAt);
  return {
    ...snapshot,
    notices,
    newNoticeCount: notices.length,
    totalNoticeCount: snapshot.totalNoticeCount ?? 0,
  };
}

export async function loadNoticeUpdateHistory(): Promise<NoticeUpdateSnapshot[]> {
  const history = (await readJsonFile<NoticeUpdateSnapshot[]>(HISTORY_FILE_NAME)) ?? [];
  const seen = new Set<string>();

  return history.map((snapshot) => {
    const normalizedSnapshot = normalizeSnapshot(snapshot);
    const dedupedNotices = normalizedSnapshot.notices.filter((notice) => {
      const identity = getNoticeIdentity(notice);

      if (seen.has(identity)) {
        return false;
      }

      seen.add(identity);
      return true;
    });

    return {
      ...normalizedSnapshot,
      notices: dedupedNotices,
      newNoticeCount: dedupedNotices.length,
    };
  });
}

export async function saveNoticeUpdateHistory(history: NoticeUpdateSnapshot[]) {
  await writeJsonFile(HISTORY_FILE_NAME, history);
}

export async function appendNoticeUpdateSnapshot({
  notices,
  newNoticeCount,
  totalNoticeCount,
}: AppendNoticeUpdateSnapshotParams) {
  const checkedAt = new Date().toISOString();
  const filteredNotices = filterFreshNotices(notices, checkedAt);
  const history = await loadNoticeUpdateHistory();
  const nextHistory: NoticeUpdateSnapshot[] = [
    {
      checkedAt,
      notices: filteredNotices,
      newNoticeCount: filteredNotices.length || newNoticeCount,
      totalNoticeCount,
    },
    ...history,
  ].slice(0, MAX_HISTORY_COUNT);

  await saveNoticeUpdateHistory(nextHistory);
}
