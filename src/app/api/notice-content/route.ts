import { NextResponse } from "next/server";
import { getNoticeContentDocument } from "@/features/notices/server/noticeSummary";
import { isAllowedNoticeUrl } from "@/features/notices/server/noticeUrlPolicy";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type NoticeContentRequestBody = {
  url?: string;
};

export async function POST(request: Request) {
  let body: NoticeContentRequestBody;

  try {
    body = (await request.json()) as NoticeContentRequestBody;
  } catch {
    return NextResponse.json({ document: null, error: "요청 본문을 읽지 못했습니다." }, { status: 400 });
  }

  const url = body.url?.trim();
  if (!url || !isAllowedNoticeUrl(url)) {
    return NextResponse.json(
      { document: null, error: "등록된 전남대 공지 주소만 열 수 있습니다." },
      { status: 400 },
    );
  }

  try {
    const document = await getNoticeContentDocument(url);
    return NextResponse.json({ document });
  } catch (error) {
    const message = error instanceof Error ? error.message : "공지 원문을 불러오지 못했습니다.";
    return NextResponse.json({ document: null, error: message }, { status: 500 });
  }
}
