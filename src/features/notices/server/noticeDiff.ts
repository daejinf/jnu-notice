import type { Notice } from "@/types/notice";
import { getNoticeIdentity } from "@/features/notices/server/noticeIdentity";

export function findNewNotices(currentNotices: Notice[], storedNotices: Notice[]) {
  const storedIdentities = new Set(storedNotices.map(getNoticeIdentity));

  return currentNotices.filter((notice) => !storedIdentities.has(getNoticeIdentity(notice)));
}
