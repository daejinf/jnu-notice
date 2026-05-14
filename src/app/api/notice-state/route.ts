import { auth } from "@/auth";
import type { Session } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { loadNoticeState, saveNoticeState } from "@/features/notices/server/noticeState";

function getSessionScope(session: Session | null) {
  return session?.user?.email ?? session?.user?.name ?? "default";
}

export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const state = await loadNoticeState(getSessionScope(session));
  return NextResponse.json({ state });
}

export async function PUT(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = (await request.json()) as {
    readNoticeIds?: string[];
    bookmarkNoticeIds?: string[];
  };

  const state = await saveNoticeState(getSessionScope(session), {
    readNoticeIds: body.readNoticeIds ?? [],
    bookmarkNoticeIds: body.bookmarkNoticeIds ?? [],
  });

  return NextResponse.json({ state });
}
