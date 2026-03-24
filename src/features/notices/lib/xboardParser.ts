import type { Notice } from "@/types/notice";
import type { DepartmentConfig } from "@/features/notices/config/departments";

export async function fetchXboardDepartmentNotices(
  department: DepartmentConfig,
  _fetchImpl: typeof fetch,
  _maxPages: number,
) {
  console.warn(`[department:xboard] parser not implemented yet for ${department.department}`);
  return [] as Notice[];
}
