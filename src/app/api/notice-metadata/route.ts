import { NextResponse } from "next/server";
import { loadNoticeTitle } from "@/features/notices/server/noticeMetadata";
import { isAllowedNoticeUrl } from "@/features/notices/server/noticeUrlPolicy";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { urls?: unknown };
  try {
    body = (await request.json()) as { urls?: unknown };
  } catch {
    return NextResponse.json({ items: {}, error: "요청 본문을 읽지 못했습니다." }, { status: 400 });
  }

  if (!Array.isArray(body.urls) || body.urls.length === 0 || body.urls.length > 30) {
    return NextResponse.json({ items: {}, error: "공지 주소는 1개 이상 30개 이하로 보내주세요." }, { status: 400 });
  }

  const urls = Array.from(new Set(body.urls.filter((value): value is string => typeof value === "string")));
  if (urls.length !== body.urls.length || urls.some((url) => !isAllowedNoticeUrl(url))) {
    return NextResponse.json({ items: {}, error: "등록된 공지 주소만 조회할 수 있습니다." }, { status: 400 });
  }

  const entries = await Promise.all(urls.map(async (url) => [url, { title: await loadNoticeTitle(url) }] as const));
  return NextResponse.json({ items: Object.fromEntries(entries) });
}
