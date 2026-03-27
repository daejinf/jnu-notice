import type { MyAlertsSnapshot, Notice, NoticePreferences } from "@/types/notice";
import { enabledCenterBoardConfigs } from "@/features/notices/config/centerBoards";
import { enabledCollegeBoardConfigs } from "@/features/notices/config/collegeBoards";
import { enabledDepartmentConfigs } from "@/features/notices/config/departments";
import { schoolBoardCategories } from "@/features/notices/config/schoolBoardCategories";
import { loadNoticeCheckSnapshot } from "@/features/notices/server/noticeCheckSnapshot";
import { loadStoredNotices } from "@/features/notices/server/noticeStorage";
import { sortNoticesByDate } from "@/features/notices/lib/sortNotices";

export function filterMyAlertNotices(notices: Notice[], preferences: NoticePreferences) {
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

  return sortNoticesByDate(
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
}

export function buildMyAlertsSnapshotFromNotices(
  notices: Notice[],
  checkedAt: string,
  preferences: NoticePreferences | null,
): MyAlertsSnapshot {
  if (!preferences) {
    return {
      notices: [],
      fetchedAt: checkedAt,
      totalCount: 0,
      hasPreferences: false,
    };
  }

  const filteredNotices = filterMyAlertNotices(notices, preferences);

  return {
    notices: filteredNotices,
    fetchedAt: checkedAt,
    totalCount: filteredNotices.length,
    hasPreferences: true,
    preferencesUpdatedAt: preferences.updatedAt,
  };
}

export async function buildMyAlertsSnapshot(preferences: NoticePreferences | null): Promise<MyAlertsSnapshot> {
  const notices = await loadStoredNotices();
  const latestCheck = await loadNoticeCheckSnapshot();
  const checkedAt = latestCheck?.checkedAt ?? new Date().toISOString();
  return buildMyAlertsSnapshotFromNotices(notices, checkedAt, preferences);
}
