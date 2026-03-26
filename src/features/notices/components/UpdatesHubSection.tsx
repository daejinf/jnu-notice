"use client";

import { useState } from "react";
import { MyNoticeAlertsSection } from "@/features/notices/components/MyNoticeAlertsSection";
import { formatNoticeDate, formatViewsLabel } from "@/features/notices/utils/format";
import type { NoticeUpdateSnapshot } from "@/types/notice";

type HistoryTab = "updates" | "alerts";

const TEXT = {
  badge: "\uD788\uC2A4\uD1A0\uB9AC",
  title: "\uBC14\uB85C \uD655\uC778\uD558\uB294 \uAE30\uB85D",
  description: "\uC0C8 \uACF5\uC9C0 \uAE30\uB85D\uACFC \uB0B4 \uC54C\uB9BC\uC744 \uD55C \uACF3\uC5D0\uC11C \uBCF4\uC138\uC694.",
  updatesLabel: "\uAE30\uB85D",
  updatesTitle: "\uC0C8 \uACF5\uC9C0 \uAE30\uB85D",
  updatesDescription: "\uC2E4\uC81C\uB85C \uC0C8\uB85C \uC62C\uB77C\uC628 \uACF5\uC9C0\uB9CC \uBAA8\uC544\uBD05\uB2C8\uB2E4.",
  alertsLabel: "\uB9DE\uCDA4",
  alertsTitle: "\uB0B4 \uC54C\uB9BC",
  alertsDescription: "\uCF1C\uB454 \uC18C\uC2A4\uB9CC \uBC14\uB85C \uD655\uC778\uD569\uB2C8\uB2E4.",
  checkedAt: "\uC218\uC9D1 \uC2DC\uAC01",
  newNotices: "\uC0C8 \uACF5\uC9C0",
  totalChecked: "\uC804\uCCB4 \uD655\uC778",
  empty: "\uC544\uC9C1 \uC313\uC778 \uC0C8 \uACF5\uC9C0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
  author: "\uC791\uC131\uC790",
  date: "\uAC8C\uC2DC\uC77C",
  unsupported: "\uBBF8\uC9C0\uC6D0",
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
                  <a href={notice.url} target="_blank" rel="noreferrer" className="mt-4 block whitespace-normal break-words text-lg font-bold leading-8 tracking-tight text-slate-950 hover:text-[#1B64DA]">{notice.title}</a>
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

export function UpdatesHubSection({
  history,
  initialTab = "updates",
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
            <button
              type="button"
              onClick={() => setTab("updates")}
              className={`rounded-[28px] border px-5 py-4 text-left transition ${
                tab === "updates"
                  ? "border-[#1B64DA] bg-[#F5F9FF] shadow-[0_12px_24px_rgba(27,100,218,0.10)]"
                  : "border-slate-200 bg-[#FCFCFD] hover:border-slate-300 hover:bg-white"
              }`}
            >
              <div className="text-xs font-semibold tracking-[0.08em] text-slate-400">{TEXT.updatesLabel}</div>
              <div className="mt-1 text-xl font-black tracking-tight text-slate-950">{TEXT.updatesTitle}</div>
              <p className="mt-1 text-sm leading-6 text-slate-500">{TEXT.updatesDescription}</p>
              <div className="mt-4 inline-flex rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-[#1B64DA] ring-1 ring-[#D6E6FF]">{`${history.length}회`}</div>
            </button>

            <button
              type="button"
              onClick={() => setTab("alerts")}
              className={`rounded-[28px] border px-5 py-4 text-left transition ${
                tab === "alerts"
                  ? "border-[#1B64DA] bg-[#F5F9FF] shadow-[0_12px_24px_rgba(27,100,218,0.10)]"
                  : "border-slate-200 bg-[#FCFCFD] hover:border-slate-300 hover:bg-white"
              }`}
            >
              <div className="text-xs font-semibold tracking-[0.08em] text-slate-400">{TEXT.alertsLabel}</div>
              <div className="mt-1 text-xl font-black tracking-tight text-slate-950">{TEXT.alertsTitle}</div>
              <p className="mt-1 text-sm leading-6 text-slate-500">{TEXT.alertsDescription}</p>
              <div className="mt-4 inline-flex rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-[#1B64DA] ring-1 ring-[#D6E6FF]">바로 보기</div>
            </button>
          </div>
        </section>

        {tab === "updates" ? <UpdatesHistoryList history={history} /> : <MyNoticeAlertsSection embedded />}
      </div>
    </main>
  );
}
