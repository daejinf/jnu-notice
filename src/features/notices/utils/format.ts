import type { Notice } from "@/types/notice";

export function formatNoticeDate(date: string) {
  return date ? date.replaceAll("-", ".") : "날짜 없음";
}

export function formatViews(views: number) {
  return new Intl.NumberFormat("ko-KR").format(views);
}

export function isUnsupportedViewsNotice(notice: Notice) {
  return (
    notice.sourceType === "center" &&
    (notice.url.includes("https://sojoong.kr/education/") ||
      notice.url.includes("https://sojoong.kr/education_single/"))
  );
}

export function formatViewsLabel(notice: Notice) {
  return isUnsupportedViewsNotice(notice) ? "조회 미지원" : `조회 ${formatViews(notice.views)}`;
}

export function joinCategoryQuery(categoryKeys: string[]) {
  return categoryKeys.join(",");
}