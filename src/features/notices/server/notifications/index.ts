import type { Notice } from "@/types/notice";
import { sendDiscordNotification } from "@/features/notices/server/notifications/discord";

export async function notifyNewNotices(notices: Notice[]) {
  if (notices.length === 0) {
    return;
  }

  await sendDiscordNotification({ notices });
}
