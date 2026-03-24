import type { Notice } from "@/types/notice";

export function getNoticeIdentity(notice: Notice) {
  if (notice.url && notice.url.trim().length > 0) {
    return `url:${notice.url.trim()}`;
  }

  return `fallback:${notice.title.trim()}::${notice.date.trim()}`;
}
