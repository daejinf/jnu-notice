import type { MyAlertsSnapshot, Notice, NoticePreferences } from "@/types/notice";
import { enabledCenterBoardConfigs } from "@/features/notices/config/centerBoards";
import { enabledCollegeBoardConfigs } from "@/features/notices/config/collegeBoards";
import { enabledDepartmentConfigs } from "@/features/notices/config/departments";
import { schoolBoardCategories } from "@/features/notices/config/schoolBoardCategories";
import { loadNoticeCheckSnapshot } from "@/features/notices/server/noticeCheckSnapshot";
import { loadStoredNotices } from "@/features/notices/server/noticeStorage";
import { sortNoticesByDate } from "@/features/notices/lib/sortNotices";

function toSeoulDateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return year && month && day ? `${year}-${month}-${day}` : null;
}

function normalizeNoticeDateKey(value: string) {
  const match = value.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function isNoticeFromCheckedDay(notice: Notice, checkedAt: string) {
  const checkedDateKey = toSeoulDateKey(checkedAt);
  const noticeDateKey = normalizeNoticeDateKey(notice.date);
  if (!checkedDateKey || !noticeDateKey) {
    return false;
  }
  return checkedDateKey === noticeDateKey;
}

export function filterMyAlertNotices(
  notices: Notice[],
  preferences: NoticePreferences,
  checkedAt: string,
) {
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
      const isAllowed = (() => {
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
      })();

      return isAllowed && isNoticeFromCheckedDay(notice, checkedAt);
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

  const filteredNotices = filterMyAlertNotices(notices, preferences, checkedAt);

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
