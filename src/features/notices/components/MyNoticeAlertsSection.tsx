"use client";

import { useEffect, useState } from "react";
import { formatNoticeDate, formatViewsLabel } from "@/features/notices/utils/format";
import type { MyAlertsSnapshot, Notice } from "@/types/notice";

const TEXT = {
  badge: "맞춤",
  title: "내가 켜둔 공지",
  description: "켜둔 소스 중 오늘 올라온 것만 모아봅니다.",
  totalCount: "총",
  checkedAt: "수집 시각",
  lastFetched: "마지막 반영",
  settingsSaved: "설정 저장",
  loadError: "내 알림을 불러오지 못했습니다.",
  loadErrorFallback: "내 알림을 불러오는 중 오류가 발생했습니다.",
  noPreferences: "아직 켜둔 소스가 없습니다. 관리에서 먼저 고르면 바로 반영됩니다.",
  loading: "서버에서 불러오는 중입니다.",
  empty: "오늘은 켜둔 소스에 새 공지가 없습니다.",
  author: "작성자",
  date: "게시일",
};

function formatFetchedAt(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(date);
}

function AlertsSnapshotHeader({ fetchedAt, totalCount }: { fetchedAt: string | null; totalCount: number }) {
  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_20px_48px_rgba(15,23,42,0.06)] sm:rounded-[36px] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{TEXT.checkedAt}</p>
          <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">{formatFetchedAt(fetchedAt)}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">{`${TEXT.totalCount} ${totalCount}건`}</span>
        </div>
      </div>
    </section>
  );
}

export function MyNoticeAlertsSection({
  embedded = false,
  initialData,
}: {
  embedded?: boolean;
  initialData?: MyAlertsSnapshot;
}) {
  const [notices, setNotices] = useState<Notice[]>(initialData?.notices ?? []);
  const [fetchedAt, setFetchedAt] = useState<string | null>(initialData?.fetchedAt ?? null);
  const [preferencesUpdatedAt, setPreferencesUpdatedAt] = useState<string | null>(initialData?.preferencesUpdatedAt ?? null);
  const [hasPreferences, setHasPreferences] = useState(initialData?.hasPreferences ?? true);
  const [isLoading, setIsLoading] = useState(initialData ? false : true);
  const [error, setError] = useState<string | null>(initialData?.error ?? null);

  useEffect(() => {
    if (initialData) {
      return;
    }

    const controller = new AbortController();
    const run = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/api/my-alerts", { signal: controller.signal, cache: "no-store" });
        const data = (await response.json()) as MyAlertsSnapshot;
        if (!response.ok) throw new Error(data.error ?? TEXT.loadError);
        setNotices(data.notices);
        setFetchedAt(data.fetchedAt);
        setPreferencesUpdatedAt(data.preferencesUpdatedAt ?? null);
        setHasPreferences(data.hasPreferences);
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === "AbortError") return;
        setError(fetchError instanceof Error ? fetchError.message : TEXT.loadErrorFallback);
        setNotices([]);
        setFetchedAt(null);
        setPreferencesUpdatedAt(null);
        setHasPreferences(true);
      } finally {
        setIsLoading(false);
      }
    };
    void run();
    return () => controller.abort();
  }, [initialData]);

  const content = (
    <>
      {!embedded ? (
        <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_20px_48px_rgba(15,23,42,0.06)] sm:rounded-[36px] sm:p-7">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{TEXT.badge}</span>
          <h1 className="mt-3 text-[32px] font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">{TEXT.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{TEXT.description}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-500">
            <span className="rounded-full bg-slate-100 px-4 py-2 font-semibold text-slate-700">{`${TEXT.totalCount} ${notices.length}건`}</span>
            <span className="rounded-full bg-slate-100 px-4 py-2 font-semibold text-slate-600">{`${TEXT.lastFetched} ${formatFetchedAt(fetchedAt)}`}</span>
            {preferencesUpdatedAt ? <span className="rounded-full bg-slate-100 px-4 py-2 font-semibold text-slate-600">{`${TEXT.settingsSaved} ${formatFetchedAt(preferencesUpdatedAt)}`}</span> : null}
          </div>
        </section>
      ) : fetchedAt ? (
        <AlertsSnapshotHeader fetchedAt={fetchedAt} totalCount={notices.length} />
      ) : null}

      {error ? <section className="rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</section> : null}
      {!hasPreferences && !isLoading ? (
        <section className="rounded-[36px] border border-dashed border-slate-300 bg-[#FBFCFD] px-6 py-16 text-center text-sm text-slate-500">{TEXT.noPreferences}</section>
      ) : isLoading ? (
        <section className="rounded-[36px] border border-dashed border-slate-300 bg-[#FBFCFD] px-6 py-16 text-center text-sm text-slate-500">{TEXT.loading}</section>
      ) : notices.length === 0 ? (
        <section className="rounded-[36px] border border-dashed border-slate-300 bg-[#FBFCFD] px-6 py-16 text-center text-sm text-slate-500">{TEXT.empty}</section>
      ) : (
        <div className="grid min-w-0 gap-4">
          {notices.map((notice) => (
            <article key={`${notice.sourceType}-${notice.sourceName}-${notice.id}-${notice.date}`} className="min-w-0 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)] sm:p-5">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="max-w-full rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 [overflow-wrap:anywhere]">{notice.sourceName}</span>
                <span className="max-w-full rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200 [overflow-wrap:anywhere]">{notice.category}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{formatViewsLabel(notice)}</span>
              </div>
              <a href={notice.url} target="_blank" rel="noreferrer" className="mt-4 block max-w-full whitespace-normal break-words pr-0 text-[17px] font-bold leading-7 tracking-tight text-slate-950 [overflow-wrap:anywhere] hover:text-[#1B64DA] sm:pr-2 sm:text-lg">{notice.title}</a>
              <div className="mt-3 flex min-w-0 flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                <span className="max-w-full [overflow-wrap:anywhere]">{`${TEXT.author} ${notice.author}`}</span>
                <span className="max-w-full [overflow-wrap:anywhere]">{`${TEXT.date} ${formatNoticeDate(notice.date)}`}</span>
                <span>{formatViewsLabel(notice)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">{content}</div>
    </main>
  );
}

