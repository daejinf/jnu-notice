import { enabledCenterBoardConfigs } from "@/features/notices/config/centerBoards";
import { enabledCollegeBoardConfigs } from "@/features/notices/config/collegeBoards";
import { enabledDepartmentConfigs } from "@/features/notices/config/departments";

function hostnameOf(value: string) {
  try {
    return new URL(value).hostname;
  } catch {
    return "";
  }
}

export const allowedNoticeHosts = new Set(
  [
    "www.jnu.ac.kr",
    "jnu.ac.kr",
    ...enabledCenterBoardConfigs.map((item) => hostnameOf(item.listUrl)),
    ...enabledCollegeBoardConfigs.map((item) => hostnameOf(item.listUrl)),
    ...enabledDepartmentConfigs.flatMap((item) => [hostnameOf(item.noticeUrl), hostnameOf(item.siteUrl)]),
  ].filter(Boolean),
);

export function isAllowedNoticeUrl(value: string) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && allowedNoticeHosts.has(url.hostname);
  } catch {
    return false;
  }
}
