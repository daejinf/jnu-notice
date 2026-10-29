import Link from "next/link";
import type { Metadata, Viewport } from "next";
import { auth, signIn, signOut } from "@/auth";
import { AppNavigation } from "@/components/ui/AppNavigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "\uC804\uB0A8\uB300 \uACF5\uC9C0 \uD1B5\uD569 \uC54C\uB9BC",
  description: "\uC804\uB0A8\uB300\uD559\uAD50 \uACF5\uC9C0\uC0AC\uD56D\uC744 \uD55C\uACF3\uC5D0\uC11C \uBAA8\uC544\uBCF4\uB294 \uAC1C\uC778 \uB9DE\uCDA4\uD615 \uC54C\uB9BC \uC11C\uBE44\uC2A4",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen min-w-0 bg-[#F7F8FA] text-slate-900 lg:pl-64">
          <AppNavigation />
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
            <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3 lg:hidden">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xs font-black text-white">JN</span>
                <strong className="truncate text-lg tracking-tight">전대알림</strong>
              </div>
              <p className="hidden text-sm font-medium text-slate-500 lg:block">필요한 공지를 더 빠르게 찾으세요</p>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                  {session?.user ? (
                    <>
                      <div className="hidden text-right md:block">
                        <p className="max-w-[180px] truncate text-sm font-semibold text-slate-800">
                          {session.user.name ?? "\uB85C\uADF8\uC778 \uC0AC\uC6A9\uC790"}
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
                          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          {"\uB85C\uADF8\uC544\uC6C3"}
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
                        className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        {"Google \uB85C\uADF8\uC778"}
                      </button>
                    </form>
                  )}
              </div>
            </div>
          </header>
          <div className="pb-20 lg:pb-0">{children}</div>
        </div>
      </body>
    </html>
  );
}
