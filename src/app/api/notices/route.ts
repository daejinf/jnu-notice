import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { enabledCenterBoardConfigs } from "@/features/notices/config/centerBoards";
import { enabledCollegeBoardConfigs } from "@/features/notices/config/collegeBoards";
import { enabledDepartmentConfigs } from "@/features/notices/config/departments";
import {
  schoolBoardAllCategory,
  schoolBoardCategories,
} from "@/features/notices/config/schoolBoardCategories";
import { fetchCenterBoardNotices, fetchMultipleCenterBoardNotices } from "@/features/notices/lib/fetchCenterBoardNotices";
import { fetchMultipleCollegeBoardNotices } from "@/features/notices/lib/fetchCollegeBoardNotices";
import { fetchMultipleDepartmentNotices } from "@/features/notices/lib/fetchDepartmentNotices";
import {
  fetchMultipleSchoolBoardNotices,
  fetchSchoolBoardNotices,
} from "@/features/notices/lib/fetchSchoolBoardNotices";
import { dedupeNotices, sortNoticesByDate } from "@/features/notices/lib/sortNotices";

export const revalidate = 1800;
export const dynamic = "force-dynamic";

const PREVIEW_MAX_PAGES = 10;

export async function GET(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      {
        notices: [],
        fetchedAt: new Date().toISOString(),
        error: "로그인이 필요합니다.",
      },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const requestedCategoryKeys = searchParams.get("categories")?.split(",").filter(Boolean) ?? [];
  const requestedCollegeKeys = searchParams.get("colleges")?.split(",").filter(Boolean) ?? [];
  const requestedDepartmentKeys = searchParams.get("departments")?.split(",").filter(Boolean) ?? [];
  const requestedCenterKeys = searchParams.get("centers")?.split(",").filter(Boolean) ?? [];
  const mode = searchParams.get("mode");
  const scope = searchParams.get("scope");
  const debug = searchParams.get("debug") === "1";
  const isPreview = scope === "preview";

  try {
    if (mode === "all") {
      const notices = await fetchSchoolBoardNotices(schoolBoardAllCategory, {
        maxPages: isPreview ? PREVIEW_MAX_PAGES : undefined,
      });

      return NextResponse.json({
        notices,
        fetchedAt: new Date().toISOString(),
      });
    }

    const targetCategories =
      requestedCategoryKeys.length > 0
        ? schoolBoardCategories.filter((category) => requestedCategoryKeys.includes(category.key))
        : [];

    const targetColleges =
      requestedCollegeKeys.length > 0
        ? enabledCollegeBoardConfigs.filter((college) => requestedCollegeKeys.includes(college.key))
        : [];

    const targetDepartments =
      requestedDepartmentKeys.length > 0
        ? enabledDepartmentConfigs.filter((department) => requestedDepartmentKeys.includes(department.key))
        : [];

    const targetCenters =
      requestedCenterKeys.length > 0
        ? enabledCenterBoardConfigs.filter((center) => requestedCenterKeys.includes(center.key))
        : [];

    const [schoolNotices, collegeNotices, departmentNotices, centerNotices] = await Promise.all([
      targetCategories.length > 0
        ? fetchMultipleSchoolBoardNotices(targetCategories, {
            maxPages: isPreview ? PREVIEW_MAX_PAGES : undefined,
          })
        : Promise.resolve([]),
      targetColleges.length > 0
        ? fetchMultipleCollegeBoardNotices(targetColleges, {
            maxPages: isPreview ? PREVIEW_MAX_PAGES : undefined,
          })
        : Promise.resolve([]),
      targetDepartments.length > 0
        ? fetchMultipleDepartmentNotices(targetDepartments, {
            maxPages: isPreview ? PREVIEW_MAX_PAGES : undefined,
          })
        : Promise.resolve([]),
      targetCenters.length > 0
        ? fetchMultipleCenterBoardNotices(targetCenters, {
            maxPages: isPreview ? PREVIEW_MAX_PAGES : undefined,
          })
        : Promise.resolve([]),
    ]);

    const mergedNotices = sortNoticesByDate(
      dedupeNotices([
        ...schoolNotices,
        ...collegeNotices,
        ...departmentNotices,
        ...centerNotices,
      ]),
    );

    if (debug) {
      const centerDebug = await Promise.all(
        targetCenters.map(async (center) => {
          try {
            const notices = await fetchCenterBoardNotices(center, {
              maxPages: isPreview ? PREVIEW_MAX_PAGES : undefined,
            });

            return {
              key: center.key,
              name: center.name,
              engine: center.engine,
              listUrl: center.listUrl,
              count: notices.length,
              sampleTitles: notices.slice(0, 5).map((notice) => notice.title),
            };
          } catch (error) {
            return {
              key: center.key,
              name: center.name,
              engine: center.engine,
              listUrl: center.listUrl,
              count: 0,
              error: error instanceof Error ? error.message : "unknown error",
            };
          }
        }),
      );

      return NextResponse.json({
        notices: mergedNotices,
        fetchedAt: new Date().toISOString(),
        debug: {
          requestedCenterKeys,
          matchedCenterKeys: targetCenters.map((center) => center.key),
          centerDebug,
          centerNoticeCount: centerNotices.length,
          totalNoticeCount: mergedNotices.length,
        },
      });
    }

    return NextResponse.json({
      notices: mergedNotices,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        notices: [],
        fetchedAt: new Date().toISOString(),
        error: "공지 수집 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
