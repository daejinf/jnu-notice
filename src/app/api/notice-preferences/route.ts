import { auth } from "@/auth";
import type { Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { saveNoticePreferences, loadNoticePreferences } from "@/features/notices/server/noticePreferences";
import {
  applyNoticePreferencesCookies,
  readNoticePreferencesFromRequest,
} from "@/features/notices/server/noticePreferenceCookies";

function getSessionScope(session: Session | null) {
  return session?.user?.email ?? session?.user?.name ?? "default";
}

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const preferences =
    (await loadNoticePreferences(getSessionScope(session))) ??
    readNoticePreferencesFromRequest(request);

  return NextResponse.json({ preferences });
}

export async function PUT(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = (await request.json()) as {
    schoolCategoryKeys?: string[];
    collegeKeys?: string[];
    departmentKeys?: string[];
    centerKeys?: string[];
  };

  const preferences = await saveNoticePreferences(getSessionScope(session), {
    schoolCategoryKeys: body.schoolCategoryKeys ?? [],
    collegeKeys: body.collegeKeys ?? [],
    departmentKeys: body.departmentKeys ?? [],
    centerKeys: body.centerKeys ?? [],
  });

  const response = NextResponse.json({ preferences });
  applyNoticePreferencesCookies(response, preferences);
  return response;
}
