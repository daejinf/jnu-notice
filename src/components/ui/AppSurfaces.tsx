import type { ReactNode } from "react";

type BadgeTone = "blue" | "slate" | "rose";

const badgeToneClassMap: Record<BadgeTone, string> = {
  blue: "bg-blue-50 text-blue-700",
  slate: "bg-slate-100 text-slate-600",
  rose: "bg-rose-50 text-rose-700",
};

function getBadgeToneClass(tone: BadgeTone) {
  return badgeToneClassMap[tone];
}

export function AppPageContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">{children}</div>;
}

export function AppPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_48px_rgba(15,23,42,0.06)] ${className}`.trim()}
    >
      {children}
    </section>
  );
}

export function AppHeroSection({
  badge,
  title,
  description,
  badgeTone = "slate",
  children,
}: {
  badge: string;
  title: string;
  description: string;
  badgeTone?: BadgeTone;
  children?: ReactNode;
}) {
  return (
    <AppPanel className="p-5 sm:rounded-[36px] sm:p-7">
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getBadgeToneClass(badgeTone)}`}>
        {badge}
      </span>
      <h1 className="mt-3 text-[32px] font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
      {children ? <div className="mt-5">{children}</div> : null}
    </AppPanel>
  );
}

export function AppSelectorSection({ children }: { children: ReactNode }) {
  return (
    <AppPanel className="p-3 sm:p-4">
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </AppPanel>
  );
}

export function AppSelectorCard({
  active,
  label,
  title,
  description,
  meta,
  badge,
  onClick,
}: {
  active: boolean;
  label: string;
  title: string;
  description: string;
  meta?: string | null;
  badge: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[28px] border px-5 py-5 text-left transition ${
        active
          ? "border-[#1B64DA] bg-[#F5F9FF] shadow-[0_12px_24px_rgba(27,100,218,0.10)]"
          : "border-slate-200 bg-[#FCFCFD] hover:border-slate-300 hover:bg-white"
      }`}
    >
      <p className="text-xs font-semibold tracking-[0.08em] text-slate-400">{label}</p>
      <h2 className="mt-2 text-[28px] font-black tracking-tight text-slate-950 sm:text-[30px]">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-[15px]">{description}</p>
      {meta ? <p className="mt-3 text-xs font-medium text-slate-400">{meta}</p> : null}
      <div className="mt-5 inline-flex rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-[#1B64DA] ring-1 ring-[#D6E6FF]">
        {badge}
      </div>
    </button>
  );
}

export function AppInlineNote({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <AppPanel className="px-5 py-4 text-sm text-slate-500">
      <span className="font-semibold text-slate-700">{title}</span>
      <span className="ml-2">{description}</span>
    </AppPanel>
  );
}

export function AppEmptyState({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-[36px] border border-dashed border-slate-300 bg-[#FBFCFD] px-6 py-16 text-center text-sm text-slate-500">
      {children}
    </section>
  );
}
