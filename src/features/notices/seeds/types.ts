export type DepartmentSeed = {
  college: string;
  department: string;
  siteUrl: string;
};

export type DepartmentNoticeCandidate = DepartmentSeed & {
  noticeUrl: string;
  parserType: "subview-bbs" | "xboard";
  confidence: "high" | "medium" | "low";
  reason: string;
};
