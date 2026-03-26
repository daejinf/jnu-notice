"use client";

import { useEffect, useState } from "react";
import { formatNoticeDate, formatViewsLabel } from "@/features/notices/utils/format";
import type { Notice } from "@/types/notice";

type MyAlertsResponse = {
  notices: Notice[];
  fetchedAt: string;
  totalCount: number;
  hasPreferences: boolean;
  preferencesUpdatedAt?: string;
  error?: string;
};

const TEXT = {
  badge: "\uB9DE\uCDA4",
  title: "\uB0B4 \uAE30\uC900\uC73C\uB85C\uB9CC \uBCF4\uAE30",
  description: "\uAD00\uB9AC\uC5D0\uC11C \uACE0\uB978 \uC18C\uC2A4\uB9CC \uC11C\uBC84\uC5D0\uC11C \uBC14\uB85C \uBD88\uB7EC\uC635\uB2C8\uB2E4.",
  totalCount: "\uCD1D",
  lastFetched: "\uB9C8\uC9C0\uB9C9 \uBC18\uC601",
  settingsSaved: "\uC124\uC815 \uC800\uC7A5",
  loadError: "\uB0B4 \uC54C\uB9BC\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
  loadErrorFallback: "\uB0B4 \uC54C\uB9BC\uC744 \uBD88\uB7EC\uC624\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.",
  noPreferences: "\uC544\uC9C1 \uCF1C\uB454 \uC18C\uC2A4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uAD00\uB9AC\uC5D0\uC11C \uBA3C\uC800 \uACE0\uB974\uBA74 \uBC14\uB85C \uBC18\uC601\uB429\uB2C8\uB2E4.",
  loading: "\uC11C\uBC84\uC5D0\uC11C \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4.",
  empty: "\uC9C0\uAE08 \uC870\uAC74\uC5D0 \uB9DE\uB294 \uACF5\uC9C0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
  author: "\uC791\uC131\uC790",
  date: "\uAC8C\uC2DC\uC77C",
};

function formatFetchedAt(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function MyNoticeAlertsSection() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [preferencesUpdatedAt, setPreferencesUpdatedAt] = useState<string | null>(null);
  const [hasPreferences, setHasPreferences] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/api/my-alerts", { signal: controller.signal, cache: "no-store" });
        const data = (await response.json()) as MyAlertsResponse;
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
  }, []);

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-[0_20px_48px_rgba(15,23,42,0.06)] sm:p-7">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{TEXT.badge}</span>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{TEXT.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{TEXT.description}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-500">
            <span className="rounded-full bg-slate-100 px-4 py-2 font-semibold text-slate-700">{`${TEXT.totalCount} ${notices.length}?`}</span>
            <span className="rounded-full bg-slate-100 px-4 py-2 font-semibold text-slate-600">{`${TEXT.lastFetched} ${formatFetchedAt(fetchedAt)}`}</span>
            {preferencesUpdatedAt ? <span className="rounded-full bg-slate-100 px-4 py-2 font-semibold text-slate-600">{`${TEXT.settingsSaved} ${formatFetchedAt(preferencesUpdatedAt)}`}</span> : null}
          </div>
        </section>
        {error ? <section className="rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</section> : null}
        {!hasPreferences && !isLoading ? (
          <section className="rounded-[36px] border border-dashed border-slate-300 bg-[#FBFCFD] px-6 py-16 text-center text-sm text-slate-500">{TEXT.noPreferences}</section>
        ) : isLoading ? (
          <section className="rounded-[36px] border border-dashed border-slate-300 bg-[#FBFCFD] px-6 py-16 text-center text-sm text-slate-500">{TEXT.loading}</section>
        ) : notices.length === 0 ? (
          <section className="rounded-[36px] border border-dashed border-slate-300 bg-[#FBFCFD] px-6 py-16 text-center text-sm text-slate-500">{TEXT.empty}</section>
        ) : (
          <div className="grid gap-4">
            {notices.map((notice) => (
              <article key={`${notice.sourceType}-${notice.sourceName}-${notice.id}-${notice.date}`} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{notice.sourceName}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">{notice.category}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{formatViewsLabel(notice)}</span>
                </div>
                <a href={notice.url} target="_blank" rel="noreferrer" className="mt-4 block text-lg font-bold leading-8 tracking-tight text-slate-950 hover:text-[#1B64DA]">{notice.title}</a>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                  <span>{`${TEXT.author} ${notice.author}`}</span>
                  <span>{`${TEXT.date} ${formatNoticeDate(notice.date)}`}</span>
                  <span>{formatViewsLabel(notice)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

