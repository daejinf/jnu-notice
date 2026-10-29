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
  return <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">{children}</div>;
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
      className={`rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.035)] ${className}`.trim()}
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
    <section className="py-1 sm:py-2">
      <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${getBadgeToneClass(badgeTone)}`}>
        {badge}
      </span>
      <h1 className="mt-2 text-[28px] font-black leading-tight tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}

export function AppSelectorSection({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-2">
      <div className="grid gap-2 md:grid-cols-2">{children}</div>
    </section>
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
      className={`rounded-xl border px-4 py-4 text-left transition ${
        active
          ? "border-blue-200 bg-blue-50"
          : "border-transparent bg-white hover:bg-slate-50"
      }`}
    >
      <p className="text-xs font-semibold tracking-[0.08em] text-slate-400">{label}</p>
      <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      {meta ? <p className="mt-2 text-xs font-medium text-slate-400">{meta}</p> : null}
      <div className="mt-3 inline-flex rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
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
    <section className="rounded-2xl border border-dashed border-slate-300 bg-[#FBFCFD] px-6 py-16 text-center text-sm text-slate-500">
      {children}
    </section>
  );
}
