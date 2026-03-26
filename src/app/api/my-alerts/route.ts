import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { enabledCenterBoardConfigs } from "@/features/notices/config/centerBoards";
import { enabledCollegeBoardConfigs } from "@/features/notices/config/collegeBoards";
import { enabledDepartmentConfigs } from "@/features/notices/config/departments";
import { schoolBoardCategories } from "@/features/notices/config/schoolBoardCategories";
import { loadStoredNotices } from "@/features/notices/server/noticeStorage";
import { sortNoticesByDate } from "@/features/notices/lib/sortNotices";

export async function GET(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      {
        notices: [],
        error: "???? ?????.",
      },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const requestedCategoryKeys = searchParams.get("categories")?.split(",").filter(Boolean) ?? [];
  const requestedCollegeKeys = searchParams.get("colleges")?.split(",").filter(Boolean) ?? [];
  const requestedDepartmentKeys = searchParams.get("departments")?.split(",").filter(Boolean) ?? [];
  const requestedCenterKeys = searchParams.get("centers")?.split(",").filter(Boolean) ?? [];

  const allowedSchoolCategories = new Set(
    schoolBoardCategories
      .filter((category) => requestedCategoryKeys.includes(category.key))
      .map((category) => category.name),
  );
  const allowedColleges = new Set(
    enabledCollegeBoardConfigs
      .filter((college) => requestedCollegeKeys.includes(college.key))
      .map((college) => college.sourceName),
  );
  const allowedDepartments = new Set(
    enabledDepartmentConfigs
      .filter((department) => requestedDepartmentKeys.includes(department.key))
      .map((department) => department.department),
  );
  const allowedCenters = new Set(
    enabledCenterBoardConfigs
      .filter((center) => requestedCenterKeys.includes(center.key))
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
  });
}
