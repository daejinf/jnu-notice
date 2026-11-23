import { NextResponse } from "next/server";
import { enabledCenterBoardConfigs } from "@/features/notices/config/centerBoards";
import { enabledCollegeBoardConfigs } from "@/features/notices/config/collegeBoards";
import { enabledDepartmentConfigs } from "@/features/notices/config/departments";
import { schoolBoardCategories } from "@/features/notices/config/schoolBoardCategories";
import { loadNoticeCheckSnapshot } from "@/features/notices/server/noticeCheckSnapshot";
import { loadFeedNotices, loadStoredNotices } from "@/features/notices/server/noticeStorage";
import type { Notice } from "@/types/notice";

export const dynamic = "force-dynamic";

const CACHE_CONTROL = "public, s-maxage=1800, stale-while-revalidate=300";

function parseKeys(searchParams: URLSearchParams, name: string) {
  return searchParams.get(name)?.split(",").filter(Boolean) ?? [];
}

function filterNotices(
  notices: Notice[],
  schoolKeys: string[],
  collegeKeys: string[],
  departmentKeys: string[],
  centerKeys: string[],
) {
  const schoolNames = new Set(schoolBoardCategories.filter(({ key }) => schoolKeys.includes(key)).map(({ name }) => name));
  const collegeNames = new Set(enabledCollegeBoardConfigs.filter(({ key }) => collegeKeys.includes(key)).map(({ sourceName }) => sourceName));
  const departmentNames = new Set(enabledDepartmentConfigs.filter(({ key }) => departmentKeys.includes(key)).map(({ department }) => department));
  const centerNames = new Set(enabledCenterBoardConfigs.filter(({ key }) => centerKeys.includes(key)).map(({ sourceName }) => sourceName));

  return notices.filter((notice) => {
    if (notice.sourceType === "school") return schoolNames.has(notice.category);
    if (notice.sourceType === "college") return collegeNames.has(notice.sourceName);
    if (notice.sourceType === "department") return departmentNames.has(notice.sourceName);
    if (notice.sourceType === "center") return centerNames.has(notice.sourceName);
    return false;
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const schoolKeys = parseKeys(searchParams, "categories");
  const collegeKeys = parseKeys(searchParams, "colleges");
  const departmentKeys = parseKeys(searchParams, "departments");
  const centerKeys = parseKeys(searchParams, "centers");

  try {
    const [feedSnapshot, latestCheck] = await Promise.all([
      loadFeedNotices(),
      loadNoticeCheckSnapshot(),
    ]);
    // Compatibility fallback until the first scheduled collection creates the feed snapshot.
    const sourceNotices = feedSnapshot?.notices ?? await loadStoredNotices();
    const notices = searchParams.get("mode") === "all"
      ? sourceNotices
      : filterNotices(sourceNotices, schoolKeys, collegeKeys, departmentKeys, centerKeys);

    return NextResponse.json(
      {
        notices,
        fetchedAt: feedSnapshot?.checkedAt ?? latestCheck?.checkedAt ?? null,
      },
      { headers: { "Cache-Control": CACHE_CONTROL } },
    );
  } catch (error) {
    console.error("[notices] failed to load feed snapshot", error);
    return NextResponse.json(
      { notices: [], fetchedAt: null, error: "저장된 공지 피드를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
