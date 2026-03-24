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
import { loadStoredNotices, saveNotices } from "@/features/notices/server/noticeStorage";
import { appendNoticeUpdateSnapshot } from "@/features/notices/server/noticeUpdateHistory";
import { notifyNewNotices } from "@/features/notices/server/notifications";

export async function runNoticeCheck() {
  const [schoolNotices, collegeNotices, departmentNotices, centerNotices] = await Promise.all([
    fetchSchoolBoardNotices(schoolBoardAllCategory),
    fetchMultipleCollegeBoardNotices(enabledCollegeBoardConfigs),
    fetchMultipleDepartmentNotices(enabledDepartmentConfigs),
    fetchMultipleCenterBoardNotices(enabledCenterBoardConfigs),
  ]);

  const currentNotices = sortNoticesByDate(
    dedupeNotices([...schoolNotices, ...collegeNotices, ...departmentNotices, ...centerNotices]),
  );
  const storedNotices = await loadStoredNotices();
  const newNotices = findNewNotices(currentNotices, storedNotices);

  await saveNotices(currentNotices);

  if (newNotices.length > 0) {
    console.log(`new notices: ${newNotices.length}`);
    newNotices.forEach((notice) => {
      console.log(`${notice.date} | ${notice.sourceName} | ${notice.title}`);
      console.log(notice.url);
    });

    await appendNoticeUpdateSnapshot(newNotices);
    await notifyNewNotices(newNotices);
  } else {
    console.log("no new notices");
  }

  return {
    currentNotices,
    newNotices,
  };
}