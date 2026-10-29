"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Bookmark, Flame, ListFilter } from "lucide-react";

const items = [
  { href: "/", label: "피드", icon: ListFilter },
  { href: "/hot", label: "인기 공지", icon: Flame },
  { href: "/updates", label: "새 공지", icon: Bell },
  { href: "/settings", label: "관심 소스", icon: Bookmark },
];

function NavigationLink({ href, label, icon: Icon }: (typeof items)[number]) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
        active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
      }`}
    >
      <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
      <span>{label}</span>
    </Link>
  );
}

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <Link href="/" className="flex items-center gap-3 px-6 py-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">JN</span>
          <span>
            <strong className="block text-xl tracking-tight text-slate-950">전대알림</strong>
            <small className="mt-0.5 block text-[10px] font-bold tracking-[0.18em] text-slate-400">JNU NOTICE HUB</small>
          </span>
        </Link>

        <nav className="grid gap-1 px-4" aria-label="주요 메뉴">
          {items.map((item) => <NavigationLink key={item.href} {...item} />)}
        </nav>

        <div className="mt-auto border-t border-slate-100 px-6 py-5 text-xs leading-5 text-slate-500">
          학교 본부 공지는 로그인 없이 볼 수 있어요. 로그인하면 설정을 계정과 동기화합니다.
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden" aria-label="모바일 메뉴">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-semibold ${active ? "text-blue-600" : "text-slate-500"}`}>
              <Icon aria-hidden="true" className="h-5 w-5" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
