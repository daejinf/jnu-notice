export type NoticeSourceType = "school" | "college" | "department" | "center";

export type Notice = {
  id: string;
  title: string;
  url: string;
  author: string;
  date: string;
  views: number;
  sourceType: NoticeSourceType;
  sourceName: string;
  category: string;
  isPinned: boolean;
  statusLabel?: string;
  statusKind?: "deadline" | "closed";
};

export type NoticeUpdateSnapshot = {
  checkedAt: string;
  notices: Notice[];
  newNoticeCount?: number;
  totalNoticeCount?: number;
};

export type HotNoticeSnapshot = {
  checkedAt: string;
  notices: Notice[];
};

export type NoticeCheckSnapshot = {
  checkedAt: string;
  totalNoticeCount: number;
};

export type DepartmentParserType = "subview-bbs" | "xboard";

export type NoticePreferences = {
  schoolCategoryKeys: string[];
  collegeKeys: string[];
  departmentKeys: string[];
  centerKeys: string[];
  updatedAt: string;
};

export type MyAlertsSnapshot = {
  notices: Notice[];
  fetchedAt: string;
  totalCount: number;
  hasPreferences: boolean;
  preferencesUpdatedAt?: string;
  error?: string;
};

export type MyAlertsSnapshotStore = {
  checkedAt: string;
  scopes: Record<string, MyAlertsSnapshot>;
};
