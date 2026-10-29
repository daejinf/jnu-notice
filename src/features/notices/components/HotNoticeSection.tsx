"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AppEmptyState,
  AppHeroSection,
  AppPageContainer,
} from "@/components/ui/AppSurfaces";
import { NoticeDetailReader, NoticeRow, NoticeSplitShell, useResolvedNoticeTitles, useScopedNoticeState } from "@/features/notices/components/NoticeExplorer";
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
import type { HotNoticePeriodKey, HotNoticeRankings, Notice } from "@/types/notice";

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

const HOT_PERIOD_OPTIONS: { key: HotNoticePeriodKey; label: string; description: string }[] = [
  { key: "3", label: "최근 3일", description: "3일 기준" },
  { key: "7", label: "최근 7일", description: "7일 기준" },
  { key: "14", label: "최근 14일", description: "14일 기준" },
  { key: "30", label: "최근 30일", description: "한 달 기준" },
];

const DEFAULT_HOT_PERIOD: HotNoticePeriodKey = "7";
const DAY_MS = 24 * 60 * 60 * 1000;
const HOT_PAGE_SIZE = 30;
const EMPTY_SELECTION: string[] = [];

type NoticeApiResponse = {
  notices: Notice[];
  error?: string;
};

type HotViewMode = "personal" | "global";

function toSortableTime(date: string) {
  const normalized = date.replaceAll(".", "-");
  const time = new Date(`${normalized}T00:00:00+09:00`).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getTodayKstDateKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return year && month && day ? `${year}-${month}-${day}` : null;
}

function getHotPeriodRange(days: number) {
  const todayKstDateKey = getTodayKstDateKey();
  const startOfTodayKst = todayKstDateKey
    ? new Date(`${todayKstDateKey}T00:00:00+09:00`).getTime()
    : Date.now();

  return {
    startTime: startOfTodayKst - (days - 1) * DAY_MS,
    endTime: startOfTodayKst + DAY_MS - 1,
  };
}

function formatNoticeDate(date: string) {
  return date ? date.replaceAll("-", ".") : "날짜 없음";
}

function formatViews(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function isUnsupportedViewsNotice(notice: Notice) {
  return (
    notice.sourceType === "center" &&
    (notice.url.includes("https://sojoong.kr/education/") ||
      notice.url.includes("https://sojoong.kr/education_single/") ||
      notice.url.includes("https://capd.jnu.ac.kr/"))
  );
}

function formatViewsLabel(notice: Notice) {
  return isUnsupportedViewsNotice(notice) ? "조회수 미지원" : `조회 ${formatViews(notice.views)}`;
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

function buildHotNotices(notices: Notice[], periodKey: HotNoticePeriodKey = DEFAULT_HOT_PERIOD) {
  const { startTime, endTime } = getHotPeriodRange(Number(periodKey));

  return dedupeHotNotices(notices)
    .filter((notice) => {
      const noticeTime = toSortableTime(notice.date);
      return noticeTime >= startTime && noticeTime <= endTime;
    })
    .sort((a, b) => {
      if (b.views !== a.views) {
        return b.views - a.views;
      }

      return toSortableTime(b.date) - toSortableTime(a.date);
    });
}

function HotNoticeCardList({ notices, rankOffset = 0 }: { notices: Notice[]; rankOffset?: number }) {
  return (
    <div className="mt-2 min-w-0 divide-y divide-slate-100">
      {notices.map((notice, index) => (
        <article
          key={`${notice.sourceType}-${notice.sourceName}-${notice.id}-${notice.date}-${rankOffset + index}`}
          className="min-w-0 px-1 py-4 transition hover:bg-slate-50 sm:px-3"
        >
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="min-w-8 text-center text-lg font-black text-rose-600">
              #{rankOffset + index + 1}
            </span>
            <span
              className={`max-w-full rounded-full px-3 py-1 text-xs font-semibold [overflow-wrap:anywhere] ${getSourceBadgeClass(notice)}`}
            >
              {notice.sourceName}
            </span>
            <span className="max-w-full rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 [overflow-wrap:anywhere]">
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
            className="mt-3 line-clamp-3 max-w-full break-words pr-0 text-[16px] font-bold leading-7 tracking-tight text-slate-950 hover:text-blue-700 sm:pr-2"
          >
            {notice.title}
          </a>

          <div className="mt-3 flex min-w-0 flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
            <span className="max-w-full [overflow-wrap:anywhere]">{`작성자 ${notice.author}`}</span>
            <span className="max-w-full [overflow-wrap:anywhere]">{`게시일 ${formatNoticeDate(notice.date)}`}</span>
            <span>{formatViewsLabel(notice)}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

function HotPagination({
  currentPage,
  totalCount,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * HOT_PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * HOT_PAGE_SIZE, totalCount);

  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-slate-500">{`${startItem}-${endItem} / ${formatViews(totalCount)}건`}</p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          처음
        </button>
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          이전
        </button>
        <span className="rounded-full bg-[#F5F9FF] px-4 py-2 text-sm font-bold text-[#1B64DA] ring-1 ring-[#D6E6FF]">
          {`${currentPage} / ${totalPages}`}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          다음
        </button>
      </div>
    </div>
  );
}

export function HotNoticeSection({
  storageScope,
  authenticated,
  globalHotRankings,
}: {
  storageScope: string;
  authenticated: boolean;
  globalHotRankings: HotNoticeRankings;
}) {
  const schoolSelection = useSelectedCategories(selectableSchoolCategoryKeys, {
    storageKey: buildScopedStorageKey(SCHOOL_STORAGE_KEY, storageScope),
    defaultSelectedKeys: selectableSchoolCategoryKeys,
  });
  const collegeSelection = useSelectedCategories(selectableCollegeKeys, {
    storageKey: buildScopedStorageKey(COLLEGE_STORAGE_KEY, storageScope),
    defaultSelectedKeys: EMPTY_SELECTION,
  });
  const departmentSelection = useSelectedCategories(selectableDepartmentKeys, {
    storageKey: buildScopedStorageKey(DEPARTMENT_STORAGE_KEY, storageScope),
    defaultSelectedKeys: EMPTY_SELECTION,
  });
  const centerSelection = useSelectedCategories(selectableCenterKeys, {
    storageKey: buildScopedStorageKey(CENTER_STORAGE_KEY, storageScope),
    defaultSelectedKeys: EMPTY_SELECTION,
  });

  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<HotViewMode>(authenticated ? "personal" : "global");
  const [globalPeriod, setGlobalPeriod] = useState<HotNoticePeriodKey>(DEFAULT_HOT_PERIOD);
  const [hotPage, setHotPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const noticeState = useScopedNoticeState({ authenticated, storageScope });

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
          throw new Error(data.error ?? "랭킹에 쓸 공지를 불러오지 못했습니다.");
        }

        setNotices(data.notices);
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === "AbortError") return;
        setError(fetchError instanceof Error ? fetchError.message : "알 수 없는 오류가 발생했습니다.");
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
  const selectedGlobalHotNotices = useMemo(
    () => dedupeHotNotices(globalHotRankings[globalPeriod] ?? []),
    [globalHotRankings, globalPeriod],
  );
  const selectedGlobalPeriodLabel =
    HOT_PERIOD_OPTIONS.find((option) => option.key === globalPeriod)?.label ?? HOT_PERIOD_OPTIONS[1].label;
  const activeHotNotices = viewMode === "personal" ? personalHotNotices : selectedGlobalHotNotices;
  const totalHotPages = Math.max(1, Math.ceil(activeHotNotices.length / HOT_PAGE_SIZE));
  const currentHotPage = Math.min(hotPage, totalHotPages);
  const currentHotPageStart = (currentHotPage - 1) * HOT_PAGE_SIZE;
  const pagedHotNotices = activeHotNotices.slice(currentHotPageStart, currentHotPageStart + HOT_PAGE_SIZE);
  const getDisplayTitle = useResolvedNoticeTitles(pagedHotNotices);
  const selectedNotice = pagedHotNotices.find((notice) => getNoticeClientId(notice) === selectedId) ?? null;

  useEffect(() => {
    setHotPage(1);
  }, [globalPeriod, personalHotNotices.length, selectedGlobalHotNotices.length, viewMode]);

  useEffect(() => {
    if (!pagedHotNotices.length) { setSelectedId(null); return; }
    if (!selectedId || !pagedHotNotices.some((notice) => getNoticeClientId(notice) === selectedId)) {
      setSelectedId(getNoticeClientId(pagedHotNotices[0]));
    }
  }, [pagedHotNotices, selectedId]);

  const handleHotPageChange = (page: number) => {
    setHotPage(Math.min(Math.max(page, 1), totalHotPages));
  };

  return (
    <main className="min-h-screen bg-transparent">
      <AppPageContainer>
        <AppHeroSection
          badge="랭킹"
          badgeTone="rose"
          title="지금 많이 보는 공지"
          description="기간별 조회수 흐름을 기준으로 공지를 다시 정리했습니다."
        />

        {error ? (
          <section className="rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </section>
        ) : null}

        {isLoading && viewMode === "personal" ? <AppEmptyState>랭킹을 불러오는 중입니다.</AppEmptyState> : null}
        {!isLoading && pagedHotNotices.length === 0 ? <AppEmptyState>{viewMode === "personal" ? "켜둔 소스 기준으로 아직 눈에 띄는 공지가 없습니다." : "전체 랭킹을 준비 중입니다."}</AppEmptyState> : null}

        {pagedHotNotices.length ? <NoticeSplitShell
          mobileDetailOpen={mobileDetailOpen}
          list={<>
            <div className="border-b border-slate-200 p-4 sm:p-5">
              <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
                <button type="button" onClick={() => setViewMode("personal")} className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${viewMode === "personal" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}>내 랭킹 · {formatViews(personalHotNotices.length)}</button>
                <button type="button" onClick={() => setViewMode("global")} className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${viewMode === "global" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}>전체 랭킹 · {formatViews(selectedGlobalHotNotices.length)}</button>
              </div>
              {viewMode === "global" ? <div className="mt-3 flex flex-wrap gap-2">{HOT_PERIOD_OPTIONS.map((option) => <button key={option.key} type="button" onClick={() => setGlobalPeriod(option.key)} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${globalPeriod === option.key ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600"}`}>{option.label}</button>)}</div> : <p className="mt-3 text-xs text-slate-500">최근 7일 · 관심 소스 기준</p>}
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>{viewMode === "global" ? selectedGlobalPeriodLabel : "맞춤 순위"}</span><span>{formatViews(activeHotNotices.length)}건</span></div>
            </div>
            <div className="max-h-[calc(100vh-380px)] min-h-[500px] overflow-y-auto">
              {pagedHotNotices.map((notice, index) => {
                const id = getNoticeClientId(notice);
                return <NoticeRow key={id} notice={notice} title={getDisplayTitle(notice)} rank={currentHotPageStart + index + 1} selected={id === selectedId} read={noticeState.readSet.has(id)} bookmarked={noticeState.bookmarkSet.has(id)} onSelect={() => { setSelectedId(id); setMobileDetailOpen(true); noticeState.markRead(notice); }} onToggleBookmark={() => noticeState.toggleBookmark(notice)} />;
              })}
            </div>
            {totalHotPages > 1 ? <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3"><button type="button" disabled={currentHotPage === 1} onClick={() => handleHotPageChange(currentHotPage - 1)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-30">이전</button><span className="text-xs font-semibold text-slate-500">{currentHotPage} / {totalHotPages}</span><button type="button" disabled={currentHotPage === totalHotPages} onClick={() => handleHotPageChange(currentHotPage + 1)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-30">다음</button></div> : null}
          </>}
          detail={<NoticeDetailReader notice={selectedNotice} title={selectedNotice ? getDisplayTitle(selectedNotice) : undefined} bookmarked={selectedNotice ? noticeState.bookmarkSet.has(getNoticeClientId(selectedNotice)) : false} onToggleBookmark={selectedNotice ? () => noticeState.toggleBookmark(selectedNotice) : undefined} onClose={() => setMobileDetailOpen(false)} />}
        /> : null}
      </AppPageContainer>
    </main>
  );
}
