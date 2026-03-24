import type { Notice } from "@/types/notice";

export function getNoticeClientId(notice: Notice) {
  if (notice.url) {
    return notice.url;
  }

  return `${notice.sourceType}:${notice.sourceName}:${notice.id}`;
}