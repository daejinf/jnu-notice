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

export type DepartmentParserType = "subview-bbs" | "xboard";
