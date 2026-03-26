import Link from "next/link";
import type { Metadata } from "next";
import { auth, signIn, signOut } from "@/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "\uC804\uB0A8\uB300 \uACF5\uC9C0 \uD1B5\uD569 \uC54C\uB9BC",
  description: "\uC804\uB0A8\uB300\uD559\uAD50 \uACF5\uC9C0\uC0AC\uD56D\uC744 \uD55C\uACF3\uC5D0\uC11C \uBAA8\uC544\uBCF4\uB294 \uAC1C\uC778 \uB9DE\uCDA4\uD615 \uC54C\uB9BC \uC11C\uBE44\uC2A4",
};

const navItems = [
  { href: "/", label: "\uD53C\uB4DC" },
  { href: "/hot", label: "\uB7AD\uD0B9" },
  { href: "/updates", label: "\uD788\uC2A4\uD1A0\uB9AC" },
  { href: "/settings", label: "\uAD00\uB9AC" },
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
        <div className="min-h-screen text-slate-900">
          <header className="sticky top-0 z-30 border-b border-black/5 bg-white/88 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4 lg:gap-6">
                  <Link href="/" className="min-w-0 shrink-0">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#191F28] text-sm font-bold text-white shadow-[0_8px_20px_rgba(25,31,40,0.18)]">
                        JN
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                          JNU Notice Hub
                        </p>
                        <p className="truncate text-lg font-bold tracking-tight text-slate-950 sm:text-xl">
                          {"\uC804\uB0A8\uB300 \uACF5\uC9C0 \uD1B5\uD569 \uC54C\uB9BC"}
                        </p>
                      </div>
                    </div>
                  </Link>

                  <nav className="hidden items-center gap-2 overflow-x-auto lg:flex">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  {session?.user ? (
                    <>
                      <div className="hidden rounded-2xl border border-slate-200 bg-[#FBFCFD] px-4 py-3 md:block">
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
                          className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
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
                        className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#3182F6] px-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(49,130,246,0.24)] transition hover:bg-[#1B64DA]"
                      >
                        {"Google \uB85C\uADF8\uC778"}
                      </button>
                    </form>
                  )}
                </div>
              </div>

              <nav className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
