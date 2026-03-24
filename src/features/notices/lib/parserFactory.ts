import type { DepartmentParserType } from "@/types/notice";
import { fetchSubviewDepartmentNotices } from "@/features/notices/lib/subviewBbsParser";
import { fetchXboardDepartmentNotices } from "@/features/notices/lib/xboardParser";

export function getDepartmentParser(parserType: DepartmentParserType) {
  switch (parserType) {
    case "subview-bbs":
      return fetchSubviewDepartmentNotices;
    case "xboard":
      return fetchXboardDepartmentNotices;
    default:
      throw new Error(`지원하지 않는 학과 parserType: ${parserType satisfies never}`);
  }
}
