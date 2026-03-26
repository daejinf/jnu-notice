"use client";

import { useEffect, useMemo, useState } from "react";
import { selectableCenters, selectableCenterKeys } from "@/data/selectableCenters";
import { selectableColleges, selectableCollegeKeys } from "@/data/selectableColleges";
import { selectableDepartments, selectableDepartmentKeys } from "@/data/selectableDepartments";
import { selectableSchoolCategoryKeys } from "@/data/selectableSchoolCategories";
import {
  buildScopedStorageKey,
  CENTER_STORAGE_KEY,
  COLLEGE_STORAGE_KEY,
  DEPARTMENT_STORAGE_KEY,
  SCHOOL_STORAGE_KEY,
} from "@/features/notices/constants/storageKeys";
import { useSelectedCategories } from "@/features/notices/hooks/useSelectedCategories";
import { joinCategoryQuery } from "@/features/notices/utils/format";
import { getNoticeClientId } from "@/features/notices/utils/noticeClientState";
import type { Notice } from "@/types/notice";

const PROJECT_CENTER_KEYS = [
  "greenbio",
  "battery",
  "sw-core",
  "sw-core-education",
  "aicoss",
  "juice-semi",
  "nccoss",
];
const PROJECT_CENTER_NAME_SET = new Set(
  selectableCenters
    .filter((center) => PROJECT_CENTER_KEYS.includes(center.key))
    .map((center) => center.name),
);
const HOT_NOTICE_DAYS = 7;

type NoticeApiResponse = {
  notices: Notice[];
  error?: string;
};

function toSortableTime(date: string) {
  const normalized = date.replaceAll(".", "-");
  const time = new Date(`${normalized}T00:00:00+09:00`).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getThresholdTime() {
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const startOfTodayKst = new Date(
    Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate()),
  );
  startOfTodayKst.setUTCDate(startOfTodayKst.getUTCDate() - (HOT_NOTICE_DAYS - 1));
  return startOfTodayKst.getTime();
}

function formatNoticeDate(date: string) {
  return date ? date.replaceAll("-", ".") : "?? ??";
}

function formatViews(views: number) {
  return new Intl.NumberFormat("ko-KR").format(views);
}

function isUnsupportedViewsNotice(notice: Notice) {
  return (
    notice.sourceType === "center" &&
    (notice.url.includes("https://sojoong.kr/education/") ||
      notice.url.includes("https://sojoong.kr/education_single/"))
  );
}

function formatViewsLabel(notice: Notice) {
  return isUnsupportedViewsNotice(notice) ? "?? ???" : `?? ${formatViews(notice.views)}`;
}

function getSourceBadgeClass(notice: Notice) {
  if (notice.sourceType === "school") return "bg-sky-100 text-sky-700";
  if (notice.sourceType === "college") return "bg-emerald-100 text-emerald-700";
  if (notice.sourceType === "department") return "bg-violet-100 text-violet-700";
  return PROJECT_CENTER_NAME_SET.has(notice.sourceName)
    ? "bg-orange-100 text-orange-700"
    : "bg-amber-100 text-amber-700";
}

function dedupeHotNotices(notices: Notice[]) {
  const noticeMap = new Map<string, Notice>();

  notices.forEach((notice) => {
    const noticeId = getNoticeClientId(notice);
    const current = noticeMap.get(noticeId);

    if (!current) {
      noticeMap.set(noticeId, notice);
      return;
    }

    const shouldReplace =
      notice.views > current.views || toSortableTime(notice.date) > toSortableTime(current.date);

    if (shouldReplace) {
      noticeMap.set(noticeId, notice);
    }
  });

  return Array.from(noticeMap.values());
}

function buildHotNotices(notices: Notice[]) {
  const thresholdTime = getThresholdTime();

  return dedupeHotNotices(notices)
    .filter((notice) => toSortableTime(notice.date) >= thresholdTime)
    .sort((a, b) => {
      if (b.views !== a.views) {
        return b.views - a.views;
      }

      return toSortableTime(b.date) - toSortableTime(a.date);
    });
}

function HotNoticeCardList({ notices }: { notices: Notice[] }) {
  return (
    <div className="mt-5 grid gap-4">
      {notices.map((notice, index) => (
        <article
          key={`${notice.sourceType}-${notice.sourceName}-${notice.id}-${notice.date}`}
          className="rounded-[28px] border border-slate-200 bg-[#FBFCFD] p-5 transition hover:border-slate-300 hover:bg-white hover:shadow-[0_12px_28px_rgba(15,23,42,0.06)]"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
              #{index + 1}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getSourceBadgeClass(notice)}`}>
              {notice.sourceName}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {notice.category}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {formatViewsLabel(notice)}
            </span>
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
  );
}

export function HotNoticeSection({
  storageScope,
  globalHotNotices,
}: {
  storageScope: string;
  globalHotNotices: Notice[];
}) {
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isReady =
    schoolSelection.isReady &&
    collegeSelection.isReady &&
    departmentSelection.isReady &&
    centerSelection.isReady;

  useEffect(() => {
    if (!isReady) return;

    const hasAnySelection =
      schoolSelection.selectedCategories.length > 0 ||
      collegeSelection.selectedCategories.length > 0 ||
      departmentSelection.selectedCategories.length > 0 ||
      centerSelection.selectedCategories.length > 0;

    if (!hasAnySelection) {
      setNotices([]);
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
          `/api/notices?categories=${schoolQuery}&colleges=${collegeQuery}&departments=${departmentQuery}&centers=${centerQuery}&scope=preview`,
          { signal: controller.signal, cache: "no-store" },
        );
        const data = (await response.json()) as NoticeApiResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "?? ??? ???? ?????.");
        }

        setNotices(data.notices);
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === "AbortError") return;
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : "? ? ?? ??? ??????.";
        setError(message);
        setNotices([]);
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
    isReady,
    schoolSelection.selectedCategories,
  ]);

  const personalHotNotices = useMemo(() => buildHotNotices(notices), [notices]);

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-[0_20px_48px_rgba(15,23,42,0.06)] sm:p-7">
          <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-700">
            HOT ??
          </span>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            ?? ?? ?? ?? 7? ??? ??
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            ?? ?? ??? ??? ??? ???? ?? 7? ??? ?? ??, ??? ?? ???? ?????.
            ? ?? ??? ???? ?? ??? ???? ?? ?? ??? HOT ???? ?????.
          </p>
        </section>

        {error ? (
          <section className="rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </section>
        ) : null}

        {isLoading ? (
          <section className="rounded-[32px] border border-dashed border-slate-300 bg-white/90 px-6 py-16 text-center text-sm text-slate-500 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
            HOT ??? ???? ????.
          </section>
        ) : personalHotNotices.length === 0 ? (
          <section className="rounded-[32px] border border-dashed border-slate-300 bg-white/90 px-6 py-16 text-center text-sm text-slate-500 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
            ?? ?? ?? ?? 7? HOT ??? ?? ????.
          </section>
        ) : (
          <section className="rounded-[36px] border border-slate-200 bg-white p-5 shadow-[0_20px_48px_rgba(15,23,42,0.06)] sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold tracking-tight text-slate-950">
                ? ?? ?? HOT ??
              </h2>
              <span className="rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">
                {`? ${personalHotNotices.length}?`}
              </span>
            </div>
            <HotNoticeCardList notices={personalHotNotices} />
          </section>
        )}

        <section className="rounded-[36px] border border-slate-200 bg-white p-5 shadow-[0_20px_48px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-950">
                HOT ??(??)
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                ???? 30??? ?? ??? ??? ??? ??? ???? ?????.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
              {`? ${globalHotNotices.length}?`}
            </span>
          </div>

          {globalHotNotices.length === 0 ? (
            <div className="mt-5 rounded-[28px] border border-dashed border-slate-200 bg-[#FBFCFD] px-5 py-10 text-center text-sm text-slate-500">
              ??? ?? ?? ?? ?? 7? HOT ??? ?? ????.
            </div>
          ) : (
            <HotNoticeCardList notices={globalHotNotices} />
          )}
        </section>
      </div>
    </main>
  );
}
