"use client";

import { useState } from "react";
import { MyNoticeAlertsSection } from "@/features/notices/components/MyNoticeAlertsSection";
import { formatNoticeDate, formatViewsLabel } from "@/features/notices/utils/format";
import type { NoticeUpdateSnapshot } from "@/types/notice";

type HistoryTab = "updates" | "alerts";

const TEXT = {
  badge: "히스토리",
  title: "내 알림과 새 공지",
  description: "놓치면 아쉬운 것부터 바로 봅니다.",
  alertsLabel: "내 알림",
  alertsTitle: "내가 켜둔 공지",
  alertsDescription: "고른 소스만 바로 모아봅니다.",
  alertsCta: "지금 보기",
  updatesLabel: "새 공지",
  updatesTitle: "방금 올라온 공지",
  updatesDescription: "실제로 새로 올라온 것만 남깁니다.",
  checkedAt: "수집 시각",
  newNotices: "새 공지",
  totalChecked: "전체 확인",
  empty: "아직 쌓인 새 공지가 없습니다.",
  author: "작성자",
  date: "게시일",
  unsupported: "미지원",
};

function formatCheckedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(date);
}

function getStatusTone(label?: string) {
  if (!label) return "bg-slate-100 text-slate-600";
  if (label === "D-DAY") return "bg-rose-600 text-white";
  if (label === TEXT.unsupported) return "border border-slate-300 bg-slate-50 text-slate-500";
  return "border border-emerald-500 bg-white text-emerald-600";
}

function UpdatesHistoryList({ history }: { history: NoticeUpdateSnapshot[] }) {
  if (history.length === 0) {
    return <section className="rounded-[36px] border border-dashed border-slate-300 bg-[#FBFCFD] px-6 py-16 text-center text-sm text-slate-500">{TEXT.empty}</section>;
  }

  return (
    <div className="grid gap-5">
      {history.map((snapshot) => {
        const newNoticeCount = snapshot.newNoticeCount ?? snapshot.notices.length;
        const totalNoticeCount = snapshot.totalNoticeCount ?? 0;

        return (
          <section key={snapshot.checkedAt} className="rounded-[36px] border border-slate-200 bg-white p-5 shadow-[0_20px_48px_rgba(15,23,42,0.06)] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{TEXT.checkedAt}</p>
                <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">{formatCheckedAt(snapshot.checkedAt)}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">{`${TEXT.newNotices} ${newNoticeCount}건`}</span>
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">{`${TEXT.totalChecked} ${totalNoticeCount}건`}</span>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              {snapshot.notices.map((notice) => (
                <article key={`${snapshot.checkedAt}-${notice.url}`} className="rounded-[28px] border border-slate-200 bg-[#FBFCFD] p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{notice.sourceName}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">{notice.category}</span>
                    {notice.statusLabel ? <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(notice.statusLabel)}`}>{notice.statusLabel}</span> : null}
                  </div>
                  <a href={notice.url} target="_blank" rel="noreferrer" className="mt-4 block whitespace-normal break-words pr-2 text-[17px] font-bold leading-7 tracking-tight text-slate-950 hover:text-[#1B64DA] sm:text-lg">{notice.title}</a>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                    <span>{`${TEXT.author} ${notice.author}`}</span>
                    <span>{`${TEXT.date} ${formatNoticeDate(notice.date)}`}</span>
                    <span>{formatViewsLabel(notice)}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function SelectorCard({
  active,
  label,
  title,
  description,
  badge,
  onClick,
}: {
  active: boolean;
  label: string;
  title: string;
  description: string;
  badge: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[28px] border px-5 py-4 text-left transition ${
        active
          ? "border-[#1B64DA] bg-[#F5F9FF] shadow-[0_12px_24px_rgba(27,100,218,0.10)]"
          : "border-slate-200 bg-[#FCFCFD] hover:border-slate-300 hover:bg-white"
      }`}
    >
      <div className="text-xs font-semibold tracking-[0.08em] text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-bold tracking-tight text-slate-950">{title}</div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-4 inline-flex rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-[#1B64DA] ring-1 ring-[#D6E6FF]">{badge}</div>
    </button>
  );
}

export function UpdatesHubSection({
  history,
  initialTab = "alerts",
}: {
  history: NoticeUpdateSnapshot[];
  initialTab?: HistoryTab;
}) {
  const [tab, setTab] = useState<HistoryTab>(initialTab);

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-[0_20px_48px_rgba(15,23,42,0.06)] sm:p-7">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{TEXT.badge}</span>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{TEXT.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{TEXT.description}</p>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-3 shadow-[0_20px_48px_rgba(15,23,42,0.06)] sm:p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <SelectorCard
              active={tab === "alerts"}
              label={TEXT.alertsLabel}
              title={TEXT.alertsTitle}
              description={TEXT.alertsDescription}
              badge={TEXT.alertsCta}
              onClick={() => setTab("alerts")}
            />
            <SelectorCard
              active={tab === "updates"}
              label={TEXT.updatesLabel}
              title={TEXT.updatesTitle}
              description={TEXT.updatesDescription}
              badge={`${history.length}회`}
              onClick={() => setTab("updates")}
            />
          </div>
        </section>

        {tab === "updates" ? <UpdatesHistoryList history={history} /> : <MyNoticeAlertsSection embedded />}
      </div>
    </main>
  );
}
