import Link from "next/link";
import type { Metadata } from "next";
import { auth, signIn, signOut } from "@/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "전남대 공지 통합 알림",
  description: "전남대학교 공지사항을 한곳에서 모아보는 개인 맞춤형 알림 서비스",
};

const navItems = [
  { href: "/", label: "공지" },
  { href: "/hot", label: "HOT 알림" },
  { href: "/updates", label: "알림 기록" },
  { href: "/settings", label: "설정" },
];

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen bg-transparent text-slate-900">
          <header className="sticky top-0 z-30 border-b border-black/5 bg-white/82 backdrop-blur-2xl">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <Link href="/" className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#191F28] text-sm font-bold text-white shadow-sm">
                    JN
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      JNU Notice
                    </p>
                    <p className="truncate text-lg font-bold tracking-tight text-slate-950">
                      전남대 공지 통합 알림
                    </p>
                  </div>
                </div>
              </Link>

              <div className="flex items-center gap-3">
                <nav className="hidden items-center gap-1 rounded-full bg-slate-100 p-1 md:flex">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-slate-950"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                {session?.user ? (
                  <>
                    <div className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 md:block">
                      <p className="max-w-[180px] truncate text-sm font-semibold text-slate-800">
                        {session.user.name ?? "로그인 사용자"}
                      </p>
                      <p className="max-w-[180px] truncate text-xs text-slate-500">
                        {session.user.email}
                      </p>
                    </div>
                    <form
                      action={async () => {
                        "use server";
                        await signOut({ redirectTo: "/" });
                      }}
                    >
                      <button
                        type="submit"
                        className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        로그아웃
                      </button>
                    </form>
                  </>
                ) : (
                  <form
                    action={async () => {
                      "use server";
                      await signIn("google", { redirectTo: "/" });
                    }}
                  >
                    <button
                      type="submit"
                      className="inline-flex h-11 items-center justify-center rounded-full bg-[#3182F6] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(49,130,246,0.24)] transition hover:bg-[#1B64DA]"
                    >
                      Google 로그인
                    </button>
                  </form>
                )}
              </div>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
