import type { Notice, NoticePreferences } from "@/types/notice";
import { enabledCenterBoardConfigs } from "@/features/notices/config/centerBoards";
import { enabledCollegeBoardConfigs } from "@/features/notices/config/collegeBoards";
import { enabledDepartmentConfigs } from "@/features/notices/config/departments";
import { schoolBoardCategories } from "@/features/notices/config/schoolBoardCategories";
import { loadNoticeCheckSnapshot } from "@/features/notices/server/noticeCheckSnapshot";
import { loadStoredNotices } from "@/features/notices/server/noticeStorage";
import { sortNoticesByDate } from "@/features/notices/lib/sortNotices";

export type MyAlertsSnapshot = {
  notices: Notice[];
  fetchedAt: string;
  totalCount: number;
  hasPreferences: boolean;
  preferencesUpdatedAt?: string;
  error?: string;
};

export async function buildMyAlertsSnapshot(preferences: NoticePreferences | null): Promise<MyAlertsSnapshot> {
  if (!preferences) {
    return {
      notices: [],
      fetchedAt: new Date().toISOString(),
      totalCount: 0,
      hasPreferences: false,
    };
  }

  const allowedSchoolCategories = new Set(
    schoolBoardCategories
      .filter((category) => preferences.schoolCategoryKeys.includes(category.key))
      .map((category) => category.name),
  );
  const allowedColleges = new Set(
    enabledCollegeBoardConfigs
      .filter((college) => preferences.collegeKeys.includes(college.key))
      .map((college) => college.sourceName),
  );
  const allowedDepartments = new Set(
    enabledDepartmentConfigs
      .filter((department) => preferences.departmentKeys.includes(department.key))
      .map((department) => department.department),
  );
  const allowedCenters = new Set(
    enabledCenterBoardConfigs
      .filter((center) => preferences.centerKeys.includes(center.key))
      .map((center) => center.sourceName),
  );

  const notices = await loadStoredNotices();
  const filteredNotices = sortNoticesByDate(
    notices.filter((notice) => {
      if (notice.sourceType === "school") {
        return allowedSchoolCategories.has(notice.category);
      }
      if (notice.sourceType === "college") {
        return allowedColleges.has(notice.sourceName);
      }
      if (notice.sourceType === "department") {
        return allowedDepartments.has(notice.sourceName);
      }
      if (notice.sourceType === "center") {
        return allowedCenters.has(notice.sourceName);
      }
      return false;
    }),
  );

  const latestCheck = await loadNoticeCheckSnapshot();

  return {
    notices: filteredNotices,
    fetchedAt: latestCheck?.checkedAt ?? new Date().toISOString(),
    totalCount: filteredNotices.length,
    hasPreferences: true,
    preferencesUpdatedAt: preferences.updatedAt,
  };
}
