import { auth } from "@/auth";
import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import { saveNoticePreferences, loadNoticePreferences } from "@/features/notices/server/noticePreferences";

function getSessionScope(session: Session | null) {
  return session?.user?.email ?? session?.user?.name ?? "default";
}

export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "???? ?????." }, { status: 401 });
  }

  const preferences = await loadNoticePreferences(getSessionScope(session));
  return NextResponse.json({ preferences });
}

export async function PUT(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "???? ?????." }, { status: 401 });
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

  return NextResponse.json({ preferences });
}
