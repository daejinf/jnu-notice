export function formatNoticeDate(date: string) {
  return date ? date.replaceAll("-", ".") : "날짜 없음";
}

export function formatViews(views: number) {
  return new Intl.NumberFormat("ko-KR").format(views);
}

export function joinCategoryQuery(categoryKeys: string[]) {
  return categoryKeys.join(",");
}