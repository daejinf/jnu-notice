import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateNoticeSummary } from "@/features/notices/server/noticeSummary";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type NoticeSummaryRequestBody = {
  url?: string;
  title?: string;
  sourceName?: string;
};

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ summary: null, error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: NoticeSummaryRequestBody;

  try {
    body = (await request.json()) as NoticeSummaryRequestBody;
  } catch {
    return NextResponse.json({ summary: null, error: "요청 본문을 읽지 못했습니다." }, { status: 400 });
  }

  const url = body.url?.trim();
  const title = body.title?.trim();
  const sourceName = body.sourceName?.trim();

  if (!url || !title || !sourceName) {
    return NextResponse.json(
      { summary: null, error: "요약에 필요한 공지 정보가 부족합니다." },
      { status: 400 },
    );
  }

  try {
    const summary = await generateNoticeSummary({ url, title, sourceName });
    return NextResponse.json({ summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 요약 중 오류가 발생했습니다.";
    return NextResponse.json({ summary: null, error: message }, { status: 500 });
  }
}
