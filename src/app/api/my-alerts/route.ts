import { auth } from "@/auth";
import type { Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { readNoticePreferencesFromRequest } from "@/features/notices/server/noticePreferenceCookies";
import { loadNoticePreferences } from "@/features/notices/server/noticePreferences";
import { buildMyAlertsSnapshot } from "@/features/notices/server/myAlerts";

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

  return NextResponse.json(await buildMyAlertsSnapshot(preferences));
}
