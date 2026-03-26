"use client";

import { useEffect, useMemo, useState } from "react";
import { selectableCenterKeys } from "@/data/selectableCenters";
import { selectableCollegeKeys } from "@/data/selectableColleges";
import { selectableDepartmentKeys } from "@/data/selectableDepartments";
import { selectableSchoolCategoryKeys } from "@/data/selectableSchoolCategories";
import {
  buildScopedStorageKey,
  CENTER_STORAGE_KEY,
  COLLEGE_STORAGE_KEY,
  DEPARTMENT_STORAGE_KEY,
  SCHOOL_STORAGE_KEY,
} from "@/features/notices/constants/storageKeys";
import { useSelectedCategories } from "@/features/notices/hooks/useSelectedCategories";
import {
  formatNoticeDate,
  formatViewsLabel,
  joinCategoryQuery,
} from "@/features/notices/utils/format";
import type { Notice } from "@/types/notice";

type MyAlertsResponse = {
  notices: Notice[];
  fetchedAt: string;
  totalCount: number;
  error?: string;
};

function formatFetchedAt(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function MyNoticeAlertsSection({ storageScope }: { storageScope: string }) {
  const schoolSelection = useSelectedCategories(selectableSchoolCategoryKeys, {
    storageKey: buildScopedStorageKey(SCHOOL_STORAGE_KEY, storageScope),
  });
  const collegeSelection = useSelectedCategories(selectableCollegeKeys, {
    storageKey: buildScopedStorageKey(COLLEGE_STORAGE_KEY, storageScope),
  });
  const departmentSelection = useSelectedCategories(selectableDepartmentKeys, {
    storageKey: buildScopedStorageKey(DEPARTMENT_STORAGE_KEY, storageScope),
  });
  const centerSelection = useSelectedCategories(selectableCenterKeys, {
    storageKey: buildScopedStorageKey(CENTER_STORAGE_KEY, storageScope),
  });

  const [notices, setNotices] = useState<Notice[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isReady =
    schoolSelection.isReady &&
    collegeSelection.isReady &&
    departmentSelection.isReady &&
    centerSelection.isReady;

  const hasAnySelection = useMemo(
    () =>
      schoolSelection.selectedCategories.length > 0 ||
      collegeSelection.selectedCategories.length > 0 ||
      departmentSelection.selectedCategories.length > 0 ||
      centerSelection.selectedCategories.length > 0,
    [
      centerSelection.selectedCategories.length,
      collegeSelection.selectedCategories.length,
      departmentSelection.selectedCategories.length,
      schoolSelection.selectedCategories.length,
    ],
  );

  useEffect(() => {
    if (!isReady) return;

    if (!hasAnySelection) {
      setNotices([]);
      setFetchedAt(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const run = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const schoolQuery = joinCategoryQuery(schoolSelection.selectedCategories);
        const collegeQuery = joinCategoryQuery(collegeSelection.selectedCategories);
        const departmentQuery = joinCategoryQuery(departmentSelection.selectedCategories);
        const centerQuery = joinCategoryQuery(centerSelection.selectedCategories);

        const response = await fetch(
          `/api/my-alerts?categories=${schoolQuery}&colleges=${collegeQuery}&departments=${departmentQuery}&centers=${centerQuery}`,
          { signal: controller.signal, cache: "no-store" },
        );
        const data = (await response.json()) as MyAlertsResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "? ?? ??? ???? ?????.");
        }

        setNotices(data.notices);
        setFetchedAt(data.fetchedAt);
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === "AbortError") return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "? ? ?? ??? ??????.",
        );
        setNotices([]);
        setFetchedAt(null);
      } finally {
        setIsLoading(false);
      }
    };

    void run();

    return () => controller.abort();
  }, [
    centerSelection.selectedCategories,
    collegeSelection.selectedCategories,
    departmentSelection.selectedCategories,
    hasAnySelection,
    isReady,
    schoolSelection.selectedCategories,
  ]);

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-[0_20px_48px_rgba(15,23,42,0.06)] sm:p-7">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">? ?? ??</span>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            ?? ??? ??? ??? ????
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            ?? ????? ?? ??, ???, ??, ??, ??? ??? ??? ?? ???? ?? ?????. ??? ??? ?? ???? ??, ???? ??? ?? ??? ???? ??? ??? ? ????.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-500">
            <span className="rounded-full bg-slate-100 px-4 py-2 font-semibold text-slate-700">? {notices.length}?</span>
            <span className="rounded-full bg-slate-100 px-4 py-2 font-semibold text-slate-600">?? ?? {formatFetchedAt(fetchedAt)}</span>
          </div>
        </section>

        {error ? (
          <section className="rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </section>
        ) : null}

        {!hasAnySelection && isReady ? (
          <section className="rounded-[36px] border border-dashed border-slate-300 bg-[#FBFCFD] px-6 py-16 text-center text-sm text-slate-500">
            ???? ?? ?? ??? ?? ??? ???. ??? ??? ??? ? ???? ?? ?? ?????.
          </section>
        ) : isLoading ? (
          <section className="rounded-[36px] border border-dashed border-slate-300 bg-[#FBFCFD] px-6 py-16 text-center text-sm text-slate-500">
            ? ?? ??? ???? ????.
          </section>
        ) : notices.length === 0 ? (
          <section className="rounded-[36px] border border-dashed border-slate-300 bg-[#FBFCFD] px-6 py-16 text-center text-sm text-slate-500">
            ?? ?? ???? ??? ??? ?? ????.
          </section>
        ) : (
          <div className="grid gap-4">
            {notices.map((notice) => (
              <article
                key={`${notice.sourceType}-${notice.sourceName}-${notice.id}-${notice.date}`}
                className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.05)]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{notice.sourceName}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">{notice.category}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{formatViewsLabel(notice)}</span>
                </div>

                <a
                  href={notice.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 block text-lg font-bold leading-8 tracking-tight text-slate-950 hover:text-[#1B64DA]"
                >
                  {notice.title}
                </a>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                  <span>{`??? ${notice.author}`}</span>
                  <span>{`??? ${formatNoticeDate(notice.date)}`}</span>
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
