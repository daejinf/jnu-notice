import { auth } from "@/auth";
import type { Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { enabledCenterBoardConfigs } from "@/features/notices/config/centerBoards";
import { enabledCollegeBoardConfigs } from "@/features/notices/config/collegeBoards";
import { enabledDepartmentConfigs } from "@/features/notices/config/departments";
import { schoolBoardCategories } from "@/features/notices/config/schoolBoardCategories";
import { readNoticePreferencesFromRequest } from "@/features/notices/server/noticePreferenceCookies";
import { loadNoticePreferences } from "@/features/notices/server/noticePreferences";
import { loadStoredNotices } from "@/features/notices/server/noticeStorage";
import { sortNoticesByDate } from "@/features/notices/lib/sortNotices";

function getSessionScope(session: Session | null) {
  return session?.user?.email ?? session?.user?.name ?? "default";
}

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      {
        notices: [],
        error: "로그인이 필요합니다.",
      },
      { status: 401 },
    );
  }

  const preferences =
    (await loadNoticePreferences(getSessionScope(session))) ??
    readNoticePreferencesFromRequest(request);

  if (!preferences) {
    return NextResponse.json({
      notices: [],
      fetchedAt: new Date().toISOString(),
      totalCount: 0,
      hasPreferences: false,
    });
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

  return NextResponse.json({
    notices: filteredNotices,
    fetchedAt: new Date().toISOString(),
    totalCount: filteredNotices.length,
    hasPreferences: true,
    preferencesUpdatedAt: preferences.updatedAt,
  });
}
