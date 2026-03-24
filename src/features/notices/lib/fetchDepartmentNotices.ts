import type { Notice } from "@/types/notice";
import type { DepartmentConfig } from "@/features/notices/config/departments";
import { dedupeNotices, sortNoticesByDate } from "@/features/notices/lib/sortNotices";
import { getDepartmentParser } from "@/features/notices/lib/parsers/parserFactory";

type FetchDepartmentNoticesOptions = {
  fetchImpl?: typeof fetch;
  maxPages?: number;
};

export async function fetchDepartmentNotices(
  department: DepartmentConfig,
  options: FetchDepartmentNoticesOptions = {},
) {
  if (!department.enabled) {
    return [] as Notice[];
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const maxPages = options.maxPages ?? department.maxPages;
  const parser = getDepartmentParser(department.parserType);

  return parser(department, fetchImpl, maxPages);
}

export async function fetchMultipleDepartmentNotices(
  departments: DepartmentConfig[],
  options: FetchDepartmentNoticesOptions = {},
) {
  const noticeGroups = await Promise.all(
    departments.map((department) => fetchDepartmentNotices(department, options)),
  );

  return sortNoticesByDate(dedupeNotices(noticeGroups.flat()));
}
