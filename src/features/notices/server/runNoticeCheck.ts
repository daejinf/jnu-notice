import type { Notice } from "@/types/notice";
import { enabledCenterBoardConfigs } from "@/features/notices/config/centerBoards";
import { schoolBoardAllCategory } from "@/features/notices/config/schoolBoardCategories";
import { enabledCollegeBoardConfigs } from "@/features/notices/config/collegeBoards";
import { enabledDepartmentConfigs } from "@/features/notices/config/departments";
import { fetchMultipleCenterBoardNotices } from "@/features/notices/lib/fetchCenterBoardNotices";
import { fetchMultipleCollegeBoardNotices } from "@/features/notices/lib/fetchCollegeBoardNotices";
import { fetchMultipleDepartmentNotices } from "@/features/notices/lib/fetchDepartmentNotices";
import { fetchSchoolBoardNotices } from "@/features/notices/lib/fetchSchoolBoardNotices";
import { dedupeNotices, sortNoticesByDate } from "@/features/notices/lib/sortNotices";
import { findNewNotices } from "@/features/notices/server/noticeDiff";
import { saveNoticeCheckSnapshot } from "@/features/notices/server/noticeCheckSnapshot";
import { loadStoredNotices, saveNotices } from "@/features/notices/server/noticeStorage";
import { appendNoticeUpdateSnapshot, filterFreshNotices } from "@/features/notices/server/noticeUpdateHistory";
import { notifyNewNotices } from "@/features/notices/server/notifications";
import { saveRecentHotNotices } from "@/features/notices/server/fetchTodayHotNotices";
import { saveMyAlertsSnapshots } from "@/features/notices/server/myAlertsSnapshots";

async function resolveNoticeGroup(
  label: string,
  task: Promise<Notice[]>,
) {
  try {
    return await task;
  } catch (error) {
    console.error(`[notice-check] ${label} batch failed`, error);
    return [] as Notice[];
  }
}

export async function runNoticeCheck() {
  const [schoolNotices, collegeNotices, departmentNotices, centerNotices] = await Promise.all([
    resolveNoticeGroup("school", fetchSchoolBoardNotices(schoolBoardAllCategory)),
    resolveNoticeGroup("college", fetchMultipleCollegeBoardNotices(enabledCollegeBoardConfigs)),
    resolveNoticeGroup("department", fetchMultipleDepartmentNotices(enabledDepartmentConfigs)),
    resolveNoticeGroup("center", fetchMultipleCenterBoardNotices(enabledCenterBoardConfigs)),
  ]);

  const currentNotices = sortNoticesByDate(
    dedupeNotices([...schoolNotices, ...collegeNotices, ...departmentNotices, ...centerNotices]),
  );
  const storedNotices = await loadStoredNotices();
  const discoveredNotices = findNewNotices(currentNotices, storedNotices);
  const checkedAt = new Date().toISOString();
  const newNotices = filterFreshNotices(discoveredNotices, checkedAt);

  await saveNotices(currentNotices);
  await saveRecentHotNotices(currentNotices);
  await saveNoticeCheckSnapshot({
    checkedAt,
    totalNoticeCount: currentNotices.length,
  });
  await saveMyAlertsSnapshots(currentNotices, checkedAt);

  if (newNotices.length > 0) {
    console.log(`new notices: ${newNotices.length}`);
    newNotices.forEach((notice) => {
      console.log(`${notice.date} | ${notice.sourceName} | ${notice.title}`);
      console.log(notice.url);
    });
  } else {
    console.log("no new notices");
  }

  try {
    await appendNoticeUpdateSnapshot({
      notices: newNotices,
      newNoticeCount: newNotices.length,
      totalNoticeCount: currentNotices.length,
    });
  } catch (error) {
    console.error("[notice-check] failed to append update snapshot", error);
  }

  if (newNotices.length > 0) {
    try {
      await notifyNewNotices(newNotices);
    } catch (error) {
      console.error("[notice-check] failed to notify new notices", error);
    }
  }

  return {
    currentNotices,
    newNotices,
  };
}
