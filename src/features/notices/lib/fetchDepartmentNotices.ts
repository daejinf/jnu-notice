import type { Notice } from "@/types/notice";
import type { DepartmentConfig } from "@/features/notices/config/departments";
import { dedupeNotices, sortNoticesByDate } from "@/features/notices/lib/sortNotices";
import { mapWithConcurrency } from "@/features/notices/lib/concurrency";
import { getDepartmentParser } from "@/features/notices/lib/parserFactory";

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
  const noticeGroups = await mapWithConcurrency(departments, 6, async (department) => {
    try {
      return await fetchDepartmentNotices(department, options);
    } catch (error) {
      console.error(`[notice-fetch] ${department.department}`, error);
      return [] as Notice[];
    }
  });

  return sortNoticesByDate(dedupeNotices(noticeGroups.flat()));
}
