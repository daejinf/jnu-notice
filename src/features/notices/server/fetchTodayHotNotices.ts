import { loadStoredNotices } from "@/features/notices/server/noticeStorage";
import { dedupeNotices } from "@/features/notices/lib/sortNotices";
import type { Notice } from "@/types/notice";

const HOT_NOTICE_DAYS = 7;

function toSortableTime(date: string) {
  const normalized = date.replaceAll(".", "-");
  const time = new Date(`${normalized}T00:00:00+09:00`).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getThresholdTime() {
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const startOfTodayKst = new Date(Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate()));
  startOfTodayKst.setUTCDate(startOfTodayKst.getUTCDate() - (HOT_NOTICE_DAYS - 1));
  return startOfTodayKst.getTime();
}

export async function fetchRecentHotNotices() {
  const storedNotices = await loadStoredNotices();
  const thresholdTime = getThresholdTime();

  return dedupeNotices(storedNotices)
    .filter((notice) => toSortableTime(notice.date) >= thresholdTime)
    .sort((a: Notice, b: Notice) => {
      if (b.views !== a.views) {
        return b.views - a.views;
      }

      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }

      return toSortableTime(b.date) - toSortableTime(a.date);
    });
}