"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AppEmptyState,
  AppHeroSection,
  AppPageContainer,
  AppPanel,
  AppSelectorCard,
  AppSelectorSection,
} from "@/components/ui/AppSurfaces";
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
    <div className="mt-5 grid min-w-0 gap-4">
      {notices.map((notice, index) => (
        <article
          key={`${notice.sourceType}-${notice.sourceName}-${notice.id}-${notice.date}`}
          className="min-w-0 rounded-[28px] border border-slate-200 bg-[#FBFCFD] p-4 transition hover:border-slate-300 hover:bg-white hover:shadow-[0_12px_28px_rgba(15,23,42,0.06)] sm:p-5"
        >
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
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
            className="mt-4 block max-w-full whitespace-normal break-words pr-0 text-[17px] font-bold leading-7 tracking-tight text-slate-950 [overflow-wrap:anywhere] hover:text-[#1B64DA] sm:pr-2 sm:text-lg"
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
  globalHotRankings,
}: {
  storageScope: string;
  globalHotRankings: HotNoticeRankings;
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
  const [viewMode, setViewMode] = useState<HotViewMode>("personal");
  const [globalPeriod, setGlobalPeriod] = useState<HotNoticePeriodKey>(DEFAULT_HOT_PERIOD);
  const [hotPage, setHotPage] = useState(1);

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
  const selectedGlobalHotNotices = globalHotRankings[globalPeriod] ?? [];
  const selectedGlobalPeriodLabel =
    HOT_PERIOD_OPTIONS.find((option) => option.key === globalPeriod)?.label ?? HOT_PERIOD_OPTIONS[1].label;
  const activeHotNotices = viewMode === "personal" ? personalHotNotices : selectedGlobalHotNotices;
  const totalHotPages = Math.max(1, Math.ceil(activeHotNotices.length / HOT_PAGE_SIZE));
  const currentHotPage = Math.min(hotPage, totalHotPages);
  const currentHotPageStart = (currentHotPage - 1) * HOT_PAGE_SIZE;
  const pagedHotNotices = activeHotNotices.slice(currentHotPageStart, currentHotPageStart + HOT_PAGE_SIZE);

  useEffect(() => {
    setHotPage(1);
  }, [globalPeriod, personalHotNotices.length, selectedGlobalHotNotices.length, viewMode]);

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

        <AppSelectorSection>
          <AppSelectorCard
            active={viewMode === "personal"}
            label="맞춤"
            title="내 랭킹"
            description="켜둔 소스 안에서만 추려 보여줍니다."
            badge={`${formatViews(personalHotNotices.length)}건`}
            onClick={() => setViewMode("personal")}
          />
          <AppSelectorCard
            active={viewMode === "global"}
            label="전체"
            title="전체 랭킹"
            description="관리 대상 전체 소스를 묶어 계산합니다."
            badge={`${formatViews(selectedGlobalHotNotices.length)}건`}
            onClick={() => setViewMode("global")}
          />
        </AppSelectorSection>

        {viewMode === "personal" ? (
          isLoading ? (
            <AppEmptyState>랭킹을 불러오는 중입니다.</AppEmptyState>
          ) : personalHotNotices.length === 0 ? (
            <AppEmptyState>켜둔 소스 기준으로 아직 눈에 띄는 공지가 없습니다.</AppEmptyState>
          ) : (
            <AppPanel className="p-5 sm:rounded-[36px] sm:p-6">
              <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-950">내 랭킹</h2>
                  <p className="mt-1 text-sm text-slate-500">최근 7일 안에서 켜둔 소스만 다시 추렸습니다.</p>
                </div>
                <span className="rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">
                  {`${formatViews(personalHotNotices.length)}건`}
                </span>
              </div>
              <HotNoticeCardList notices={pagedHotNotices} rankOffset={currentHotPageStart} />
              <HotPagination
                currentPage={currentHotPage}
                totalCount={personalHotNotices.length}
                totalPages={totalHotPages}
                onPageChange={handleHotPageChange}
              />
            </AppPanel>
          )
        ) : selectedGlobalHotNotices.length === 0 ? (
          <AppEmptyState>전체 랭킹을 준비 중입니다.</AppEmptyState>
        ) : (
          <AppPanel className="p-5 sm:rounded-[36px] sm:p-6">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-950">전체 랭킹</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {`${selectedGlobalPeriodLabel} 기준으로 전체 공지를 다시 정렬했습니다.`}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                  {`${formatViews(selectedGlobalHotNotices.length)}건`}
                </span>
              </div>

              <div className="grid gap-2 sm:grid-cols-4">
                {HOT_PERIOD_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setGlobalPeriod(option.key)}
                    className={`rounded-[24px] border px-4 py-4 text-left transition ${
                      globalPeriod === option.key
                        ? "border-[#1B64DA] bg-[#F5F9FF] shadow-[0_10px_20px_rgba(27,100,218,0.08)]"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-lg font-bold tracking-tight text-slate-950">{option.label}</div>
                    <p className="mt-1 text-sm text-slate-500">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <HotNoticeCardList notices={pagedHotNotices} rankOffset={currentHotPageStart} />
            <HotPagination
              currentPage={currentHotPage}
              totalCount={selectedGlobalHotNotices.length}
              totalPages={totalHotPages}
              onPageChange={handleHotPageChange}
            />
          </AppPanel>
        )}
      </AppPageContainer>
    </main>
  );
}
