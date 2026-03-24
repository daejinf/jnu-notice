import type { Notice } from "@/types/notice";

function toSortableTime(date: string) {
  const normalized = date.replaceAll(".", "-");
  const time = new Date(`${normalized}T00:00:00+09:00`).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function buildDedupeKey(notice: Notice) {
  const sourceKey = `${notice.sourceType}:${notice.sourceName}`;
  const titleKey = notice.title?.trim();
  const dateKey = notice.date?.trim();

  if (titleKey && dateKey) {
    return `${sourceKey}:${titleKey}:${dateKey}`;
  }

  const urlKey = notice.url?.trim();
  if (urlKey) {
    return `${sourceKey}:${urlKey}`;
  }

  return `${sourceKey}:${notice.id}`;
}

export function sortNoticesByDate(notices: Notice[]) {
  return [...notices].sort((a, b) => {
    const aClosed = a.statusKind === "closed";
    const bClosed = b.statusKind === "closed";

    if (aClosed !== bClosed) {
      return aClosed ? 1 : -1;
    }

    const dateDiff = toSortableTime(b.date) - toSortableTime(a.date);

    if (dateDiff !== 0) {
      return dateDiff;
    }

    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }

    return b.views - a.views;
  });
}

export function dedupeNotices(notices: Notice[]) {
  const seen = new Set<string>();

  return notices.filter((notice) => {
    const key = buildDedupeKey(notice);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}