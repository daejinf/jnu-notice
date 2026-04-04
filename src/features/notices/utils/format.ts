import type { Notice } from "@/types/notice";

export function formatNoticeDate(date: string) {
  return date ? date.replaceAll("-", ".") : "\ub0a0\uc9dc \uc5c6\uc74c";
}

export function formatViews(views: number) {
  return new Intl.NumberFormat("ko-KR").format(views);
}

export function isUnsupportedViewsNotice(notice: Notice) {
  return (
    notice.sourceType === "center" &&
    (notice.url.includes("https://sojoong.kr/notice/notice-board/") ||
      notice.url.includes("https://sojoong.kr/education/") ||
      notice.url.includes("https://sojoong.kr/education_single/") ||
      notice.url.includes("https://capd.jnu.ac.kr/"))
  );
}

export function formatViewsLabel(notice: Notice) {
  return isUnsupportedViewsNotice(notice)
    ? "\uc870\ud68c\uc218 \ubbf8\uc9c0\uc6d0"
    : `\uc870\ud68c ${formatViews(notice.views)}`;
}

export function joinCategoryQuery(categoryKeys: string[]) {
  return categoryKeys.join(",");
}
