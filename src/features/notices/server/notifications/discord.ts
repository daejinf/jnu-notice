import type { Notice } from "@/types/notice";

export type NotificationPayload = {
  notices: Notice[];
};

export async function sendDiscordNotification({ notices }: NotificationPayload) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log("DISCORD_WEBHOOK_URL not set. Skip notification.");
    return;
  }

  const description = notices
    .map(
      (notice) =>
        `- [${notice.category}] ${notice.title} (${notice.date})\n  ${notice.url}`,
    )
    .join("\n");

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: "JNU Notice Bot",
      content: `새 공지 ${notices.length}건이 등록되었습니다.`,
      embeds: [
        {
          title: "전남대학교 새 공지 알림",
          description,
          color: 3447003,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Discord notification failed: ${response.status}`);
  }
}
