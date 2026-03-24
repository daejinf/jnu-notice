"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { selectableCenters, selectableCenterKeys } from "@/data/selectableCenters";
import { selectableColleges, selectableCollegeKeys } from "@/data/selectableColleges";
import { selectableDepartments, selectableDepartmentKeys } from "@/data/selectableDepartments";
import {
  selectableSchoolCategories,
  selectableSchoolCategoryKeys,
} from "@/data/selectableSchoolCategories";
import {
  ACCOUNT_FIRST_SEEN_DATE_STORAGE_KEY,
  BOOKMARK_NOTICE_STORAGE_KEY,
  buildScopedStorageKey,
  CENTER_STORAGE_KEY,
  COLLEGE_STORAGE_KEY,
  DEPARTMENT_STORAGE_KEY,
  READ_NOTICE_STORAGE_KEY,
  SCHOOL_STORAGE_KEY,
} from "@/features/notices/constants/storageKeys";
import { useSelectedCategories } from "@/features/notices/hooks/useSelectedCategories";
import { getNoticeClientId } from "@/features/notices/utils/noticeClientState";
import { formatNoticeDate, formatViews, joinCategoryQuery } from "@/features/notices/utils/format";
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
const NOTICES_PER_PAGE = 30;

type NoticeApiResponse = {
  notices: Notice[];
  error?: string;
};

type NoticeViewMode = "all" | "unread" | "bookmarks";

function getTodayInKorea() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function toSortableTime(date: string) {
  const normalized = date.replaceAll(".", "-");
  const time = new Date(`${normalized}T00:00:00+09:00`).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function matchesSearch(notice: Notice, query: string) {
  if (!query) return true;

  const sourceGroup =
    notice.sourceType === "school"
      ? "본부 알림"
      : notice.sourceType === "college"
        ? "단과대 알림"
        : notice.sourceType === "department"
          ? "학과 알림"
          : PROJECT_CENTER_NAME_SET.has(notice.sourceName)
            ? "사업단 알림"
            : "기관 알림";

  const haystack = normalizeSearchText(
    [notice.title, notice.author, notice.sourceName, notice.category, sourceGroup].join(" "),
  );

  return haystack.includes(query);
}

function getStatusBadgeClass(notice: Notice) {
  if (notice.statusKind === "closed") return "border border-slate-300 bg-slate-50 text-slate-500";
  if (notice.statusLabel === "D-DAY") return "bg-rose-600 text-white";
  if (notice.statusKind === "deadline") return "border border-emerald-500 bg-white text-emerald-600";
  return "bg-slate-100 text-slate-600";
}

function getSourceBadgeClass(notice: Notice) {
  if (notice.sourceType === "school") return "border border-sky-100 bg-sky-50 text-sky-700";
  if (notice.sourceType === "college") return "border border-emerald-100 bg-emerald-50 text-emerald-700";
  if (notice.sourceType === "department") return "border border-violet-100 bg-violet-50 text-violet-700";
  return PROJECT_CENTER_NAME_SET.has(notice.sourceName)
    ? "border border-orange-100 bg-orange-50 text-orange-700"
    : "border border-amber-100 bg-amber-50 text-amber-700";
}

function getCardClass(notice: Notice, isRead: boolean) {
  if (notice.statusKind === "closed") return "border-slate-200 bg-slate-50 opacity-80";
  if (isRead) return "border-emerald-100 bg-emerald-50/45";
  return "border-slate-200 bg-white hover:border-slate-300 hover:shadow-[0_14px_30px_rgba(15,23,42,0.06)]";
}

function getSegmentClass(active: boolean, tone: "neutral" | "brand" | "bookmark") {
  if (active && tone === "neutral") return "bg-[#191F28] text-white shadow-sm";
  if (active && tone === "brand") return "bg-[#3182F6] text-white shadow-sm";
  if (active && tone === "bookmark") return "bg-[#FF9F0A] text-white shadow-sm";
  if (tone === "brand") return "text-[#1B64DA] hover:bg-blue-50";
  if (tone === "bookmark") return "text-[#B26B00] hover:bg-amber-50";
  return "text-slate-700 hover:bg-white";
}

function loadStoredIds(storageKey: string) {
  const savedValue = window.localStorage.getItem(storageKey);
  if (!savedValue) return [] as string[];

  try {
    const parsedValue = JSON.parse(savedValue) as string[];
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

function dedupeNotices(notices: Notice[]) {
  const noticeMap = new Map<string, Notice>();

  notices.forEach((notice) => {
    const noticeId = getNoticeClientId(notice);
    const current = noticeMap.get(noticeId);

    if (!current) {
      noticeMap.set(noticeId, notice);
      return;
    }

    const shouldReplace =
      (notice.isPinned && !current.isPinned) ||
      notice.views > current.views ||
      toSortableTime(notice.date) > toSortableTime(current.date);

    if (shouldReplace) {
      noticeMap.set(noticeId, notice);
    }
  });

  return Array.from(noticeMap.values());
}

function SectionChip({
  label,
  tone,
}: {
  label: string;
  tone: "school" | "college" | "department" | "institution" | "project";
}) {
  const toneClass = {
    school: "border border-sky-100 bg-sky-50 text-sky-700",
    college: "border border-emerald-100 bg-emerald-50 text-emerald-700",
    department: "border border-violet-100 bg-violet-50 text-violet-700",
    institution: "border border-amber-100 bg-amber-50 text-amber-700",
    project: "border border-orange-100 bg-orange-50 text-orange-700",
  }[tone];

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}>{label}</span>;
}

function CompactActionButton({
  active,
  onClick,
  activeLabel,
  idleLabel,
  activeClass,
  idleClass,
}: {
  active: boolean;
  onClick: () => void;
  activeLabel: string;
  idleLabel: string;
  activeClass: string;
  idleClass: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center justify-center rounded-full px-3 text-xs font-semibold transition ${active ? activeClass : idleClass}`}
    >
      {active ? activeLabel : idleLabel}
    </button>
  );
}

function PageArrowButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      aria-label={direction === "prev" ? "이전 페이지" : "다음 페이지"}
    >
      <span className="text-base font-bold">{direction === "prev" ? "‹" : "›"}</span>
    </button>
  );
}

export function NoticeFeedSection({ storageScope }: { storageScope: string }) {
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
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<NoticeViewMode>("all");
  const [searchInput, setSearchInput] = useState("");
  const [readNoticeIds, setReadNoticeIds] = useState<string[]>([]);
  const [bookmarkNoticeIds, setBookmarkNoticeIds] = useState<string[]>([]);
  const [accountFirstSeenDate, setAccountFirstSeenDate] = useState("");
  const [isClientStateReady, setIsClientStateReady] = useState(false);

  const deferredSearchInput = useDeferredValue(searchInput);
  const normalizedSearchQuery = useMemo(
    () => normalizeSearchText(deferredSearchInput),
    [deferredSearchInput],
  );

  const readStorageKey = buildScopedStorageKey(READ_NOTICE_STORAGE_KEY, storageScope);
  const bookmarkStorageKey = buildScopedStorageKey(BOOKMARK_NOTICE_STORAGE_KEY, storageScope);
  const firstSeenStorageKey = buildScopedStorageKey(ACCOUNT_FIRST_SEEN_DATE_STORAGE_KEY, storageScope);

  const isReady =
    schoolSelection.isReady &&
    collegeSelection.isReady &&
    departmentSelection.isReady &&
    centerSelection.isReady &&
    isClientStateReady;

  useEffect(() => {
    setReadNoticeIds(loadStoredIds(readStorageKey));
    setBookmarkNoticeIds(loadStoredIds(bookmarkStorageKey));

    const savedFirstSeenDate = window.localStorage.getItem(firstSeenStorageKey)?.trim();
    const firstSeenDate = savedFirstSeenDate || getTodayInKorea();

    if (!savedFirstSeenDate) {
      window.localStorage.setItem(firstSeenStorageKey, firstSeenDate);
    }

    setAccountFirstSeenDate(firstSeenDate);
    setIsClientStateReady(true);
  }, [bookmarkStorageKey, firstSeenStorageKey, readStorageKey]);

  useEffect(() => {
    if (!isClientStateReady) return;
    window.localStorage.setItem(readStorageKey, JSON.stringify(readNoticeIds));
  }, [isClientStateReady, readNoticeIds, readStorageKey]);

  useEffect(() => {
    if (!isClientStateReady) return;
    window.localStorage.setItem(bookmarkStorageKey, JSON.stringify(bookmarkNoticeIds));
  }, [bookmarkNoticeIds, bookmarkStorageKey, isClientStateReady]);

  const requestKey = useMemo(
    () =>
      JSON.stringify({
        school: [...schoolSelection.selectedCategories].sort(),
        college: [...collegeSelection.selectedCategories].sort(),
        department: [...departmentSelection.selectedCategories].sort(),
        center: [...centerSelection.selectedCategories].sort(),
      }),
    [
      schoolSelection.selectedCategories,
      collegeSelection.selectedCategories,
      departmentSelection.selectedCategories,
      centerSelection.selectedCategories,
    ],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [requestKey, viewMode, normalizedSearchQuery]);

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
    const timeoutId = window.setTimeout(async () => {
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
          throw new Error(data.error ?? "공지 목록을 불러오지 못했습니다.");
        }

        setNotices(data.notices);
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === "AbortError") return;
        const message = fetchError instanceof Error ? fetchError.message : "알 수 없는 오류가 발생했습니다.";
        setError(message);
        setNotices([]);
      } finally {
        setIsLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [
    centerSelection.selectedCategories,
    collegeSelection.selectedCategories,
    departmentSelection.selectedCategories,
    isReady,
    schoolSelection.selectedCategories,
  ]);

  const uniqueNotices = useMemo(() => dedupeNotices(notices), [notices]);

  const selectedSchoolNames = useMemo(
    () =>
      selectableSchoolCategories
        .filter((category) => schoolSelection.selectedCategories.includes(category.key))
        .map((category) => category.name),
    [schoolSelection.selectedCategories],
  );

  const selectedCollegeNames = useMemo(
    () =>
      selectableColleges
        .filter((college) => collegeSelection.selectedCategories.includes(college.key))
        .map((college) => college.name),
    [collegeSelection.selectedCategories],
  );

  const selectedDepartmentNames = useMemo(
    () =>
      selectableDepartments
        .filter((department) => departmentSelection.selectedCategories.includes(department.key))
        .map((department) => `${department.college} · ${department.department}`),
    [departmentSelection.selectedCategories],
  );

  const selectedInstitutionCenterNames = useMemo(
    () =>
      selectableCenters
        .filter(
          (center) =>
            centerSelection.selectedCategories.includes(center.key) &&
            !PROJECT_CENTER_KEYS.includes(center.key),
        )
        .map((center) => center.name),
    [centerSelection.selectedCategories],
  );

  const selectedProjectCenterNames = useMemo(
    () =>
      selectableCenters
        .filter(
          (center) =>
            centerSelection.selectedCategories.includes(center.key) &&
            PROJECT_CENTER_KEYS.includes(center.key),
        )
        .map((center) => center.name),
    [centerSelection.selectedCategories],
  );

  const readNoticeIdSet = useMemo(() => new Set(readNoticeIds), [readNoticeIds]);
  const bookmarkNoticeIdSet = useMemo(() => new Set(bookmarkNoticeIds), [bookmarkNoticeIds]);

  const joinedAfterNotices = useMemo(
    () =>
      accountFirstSeenDate
        ? uniqueNotices.filter((notice) => toSortableTime(notice.date) >= toSortableTime(accountFirstSeenDate))
        : uniqueNotices,
    [accountFirstSeenDate, uniqueNotices],
  );

  const baseFilteredNotices = useMemo(() => {
    switch (viewMode) {
      case "unread":
        return joinedAfterNotices.filter((notice) => !readNoticeIdSet.has(getNoticeClientId(notice)));
      case "bookmarks":
        return uniqueNotices.filter((notice) => bookmarkNoticeIdSet.has(getNoticeClientId(notice)));
      default:
        return uniqueNotices;
    }
  }, [bookmarkNoticeIdSet, joinedAfterNotices, readNoticeIdSet, uniqueNotices, viewMode]);

  const filteredNotices = useMemo(
    () => baseFilteredNotices.filter((notice) => matchesSearch(notice, normalizedSearchQuery)),
    [baseFilteredNotices, normalizedSearchQuery],
  );

  const totalPages = Math.max(1, Math.ceil(filteredNotices.length / NOTICES_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedNotices = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * NOTICES_PER_PAGE;
    return filteredNotices.slice(startIndex, startIndex + NOTICES_PER_PAGE);
  }, [filteredNotices, safeCurrentPage]);

  const pageNumbers = useMemo(() => {
    const maxVisiblePages = 7;
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const startPage = Math.max(1, safeCurrentPage - 3);
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    const adjustedStartPage = Math.max(1, endPage - maxVisiblePages + 1);

    return Array.from({ length: endPage - adjustedStartPage + 1 }, (_, index) => adjustedStartPage + index);
  }, [safeCurrentPage, totalPages]);

  function markAsRead(notice: Notice) {
    const noticeId = getNoticeClientId(notice);
    setReadNoticeIds((current) => (current.includes(noticeId) ? current : [...current, noticeId]));
  }

  function toggleBookmark(notice: Notice) {
    const noticeId = getNoticeClientId(notice);
    setBookmarkNoticeIds((current) =>
      current.includes(noticeId) ? current.filter((id) => id !== noticeId) : [...current, noticeId],
    );
  }

  const unreadCount = joinedAfterNotices.filter(
    (notice) => !readNoticeIdSet.has(getNoticeClientId(notice)),
  ).length;
  const bookmarkCount = uniqueNotices.filter((notice) => bookmarkNoticeIdSet.has(getNoticeClientId(notice))).length;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/95 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">공지 피드</span>
            <h1 className="mt-3 text-[30px] font-black tracking-tight text-[#191F28] sm:text-[36px]">필요한 공지만 빠르게 확인하세요</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
              본부, 단과대, 학과, 기관, 사업단 공지를 한곳에서 확인할 수 있습니다.
              읽은 공지와 저장한 공지도 자연스럽게 정리됩니다.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:min-w-[360px]">
            <div className="rounded-[22px] bg-[#F7F9FB] p-4">
              <p className="text-xs font-semibold text-slate-500">내 공지</p>
              <p className="mt-2 text-[28px] font-black tracking-tight text-[#191F28]">{joinedAfterNotices.length}</p>
            </div>
            <div className="rounded-[22px] bg-sky-50 p-4">
              <p className="text-xs font-semibold text-sky-700">안 읽은 공지</p>
              <p className="mt-2 text-[28px] font-black tracking-tight text-sky-700">{unreadCount}</p>
            </div>
            <div className="rounded-[22px] bg-amber-50 p-4">
              <p className="text-xs font-semibold text-amber-700">북마크</p>
              <p className="mt-2 text-[28px] font-black tracking-tight text-amber-700">{bookmarkCount}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/95 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-[24px] font-black tracking-tight text-[#191F28]">공지 목록</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                제목을 누르면 읽음 처리와 함께 원문 페이지로 이동합니다. 탭과 검색으로 필요한 공지만 좁혀보세요.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <PageArrowButton
                direction="prev"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              />
              <div className="rounded-full bg-[#F2F4F6] px-4 py-2 text-sm font-semibold text-slate-600">
                {isLoading ? "불러오는 중" : `${filteredNotices.length}개 · ${safeCurrentPage}/${totalPages}페이지`}
              </div>
              <PageArrowButton
                direction="next"
                disabled={safeCurrentPage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              />
            </div>
          </div>

          <div className="rounded-[22px] bg-[#F7F9FB] p-4">
            <div className="flex flex-wrap gap-2">
              {selectedSchoolNames.map((name) => (
                <SectionChip key={`school-${name}`} label={`본부 ${name}`} tone="school" />
              ))}
              {selectedCollegeNames.map((name) => (
                <SectionChip key={`college-${name}`} label={`단과대 ${name}`} tone="college" />
              ))}
              {selectedDepartmentNames.map((name) => (
                <SectionChip key={`department-${name}`} label={`학과 ${name}`} tone="department" />
              ))}
              {selectedInstitutionCenterNames.map((name) => (
                <SectionChip key={`institution-${name}`} label={`기관 ${name}`} tone="institution" />
              ))}
              {selectedProjectCenterNames.map((name) => (
                <SectionChip key={`project-${name}`} label={`사업단 ${name}`} tone="project" />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="inline-flex w-fit rounded-full bg-[#F2F4F6] p-1">
              <button type="button" onClick={() => setViewMode("all")} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${getSegmentClass(viewMode === "all", "neutral")}`}>
                전체 공지
              </button>
              <button type="button" onClick={() => setViewMode("unread")} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${getSegmentClass(viewMode === "unread", "brand")}`}>
                안 읽은 공지
              </button>
              <button type="button" onClick={() => setViewMode("bookmarks")} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${getSegmentClass(viewMode === "bookmarks", "bookmark")}`}>
                북마크
              </button>
            </div>

            <div className="relative w-full xl:max-w-[360px]">
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="제목, 작성자, 출처로 검색"
                className="h-12 w-full rounded-full border border-slate-200 bg-[#F7F9FB] px-5 pr-20 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#3182F6] focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
              {searchInput ? (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-3 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                >
                  초기화
                </button>
              ) : (
                <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm text-slate-400">검색</span>
              )}
            </div>
          </div>
        </div>

        {error ? <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">{error}</div> : null}

        <div className="mt-5 grid gap-3">
          {isLoading ? (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-[#FAFBFC] px-4 py-16 text-center text-sm text-slate-500">
              공지 목록을 불러오고 있습니다.
            </div>
          ) : null}

          {!isLoading && filteredNotices.length === 0 && !error ? (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-[#FAFBFC] px-4 py-16 text-center text-sm text-slate-500">
              지금 조건에 맞는 공지가 없습니다.
            </div>
          ) : null}

          {!isLoading
            ? paginatedNotices.map((notice) => {
                const noticeId = getNoticeClientId(notice);
                const isRead = readNoticeIdSet.has(noticeId);
                const isBookmarked = bookmarkNoticeIdSet.has(noticeId);

                return (
                  <article
                    key={noticeId}
                    className={`rounded-[26px] border px-5 py-4 transition ${getCardClass(notice, isRead)}`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${getSourceBadgeClass(notice)}`}>{notice.sourceName}</span>
                          <span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-500">{notice.category}</span>
                          {notice.isPinned ? <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700">중요</span> : null}
                          {notice.statusLabel ? <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${getStatusBadgeClass(notice)}`}>{notice.statusLabel}</span> : null}
                          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${isRead ? "bg-emerald-600 text-white" : "bg-blue-50 text-blue-700"}`}>{isRead ? "읽음" : "안 읽음"}</span>
                        </div>

                        <a
                          href={notice.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => markAsRead(notice)}
                          className={`mt-3 block text-[18px] font-bold leading-7 tracking-tight ${notice.statusKind === "closed" ? "text-slate-500 hover:text-slate-600" : isRead ? "text-slate-700 hover:text-slate-900" : "text-[#191F28] hover:text-[#1B64DA]"}`}
                        >
                          {notice.title}
                        </a>

                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-slate-500">
                          <span>{notice.author}</span>
                          <span className="text-slate-300">•</span>
                          <span>{formatNoticeDate(notice.date)}</span>
                          <span className="text-slate-300">•</span>
                          <span>조회 {formatViews(notice.views)}</span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 lg:pl-4">
                        <CompactActionButton
                          active={isRead}
                          onClick={() => markAsRead(notice)}
                          activeLabel="읽음"
                          idleLabel="읽기"
                          activeClass="bg-emerald-600 text-white"
                          idleClass="bg-[#F2F4F6] text-slate-700 hover:bg-slate-200"
                        />
                        <CompactActionButton
                          active={isBookmarked}
                          onClick={() => toggleBookmark(notice)}
                          activeLabel="저장됨"
                          idleLabel="저장"
                          activeClass="bg-amber-500 text-white hover:bg-amber-600"
                          idleClass="bg-amber-50 text-amber-700 hover:bg-amber-100"
                        />
                      </div>
                    </div>
                  </article>
                );
              })
            : null}
        </div>

        {!isLoading && totalPages > 1 ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safeCurrentPage === 1}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              이전
            </button>
            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setCurrentPage(pageNumber)}
                className={`h-10 min-w-10 rounded-full px-3 text-sm font-semibold ${pageNumber === safeCurrentPage ? "bg-[#191F28] text-white" : "border border-slate-200 bg-white text-slate-700"}`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safeCurrentPage === totalPages}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              다음
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}