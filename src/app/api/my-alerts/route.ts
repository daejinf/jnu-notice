import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { readNoticePreferencesFromCookieStore } from "@/features/notices/server/noticePreferenceCookies";
import { loadNoticePreferences } from "@/features/notices/server/noticePreferences";
import { buildMyAlertsSnapshot } from "@/features/notices/server/myAlerts";
import { loadMyAlertsSnapshot } from "@/features/notices/server/myAlertsSnapshots";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const sessionScope = session.user?.email ?? session.user?.name ?? "default";
  const requestHeaders = await headers();
  const cookieStore = await cookies();
  const preferences =
    (await loadNoticePreferences(sessionScope)) ??
    readNoticePreferencesFromCookieStore(cookieStore);

  const snapshot =
    (preferences && !requestHeaders.get("x-force-live-alerts") ? await loadMyAlertsSnapshot(sessionScope) : null) ??
    (await buildMyAlertsSnapshot(preferences));

  return NextResponse.json(snapshot);
}
