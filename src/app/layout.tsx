import Link from "next/link";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "전남대 공지 통합 알림",
  description: "학사안내, 취업정보, 장학안내를 모아보는 전남대학교 공지 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/" className="text-lg font-bold text-slate-950">
              전남대 공지 통합 알림
            </Link>
            <nav className="flex items-center gap-2">
              <Link
                href="/"
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
              >
                공지 보기
              </Link>
              <Link
                href="/settings"
                className="inline-flex min-w-[88px] items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                설정
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}