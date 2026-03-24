"use client";

import { useEffect, useMemo, useState } from "react";
import { selectableCenters, selectableCenterKeys } from "@/data/selectableCenters";
import {
  selectableColleges,
  selectableCollegeKeys,
} from "@/data/selectableColleges";
import {
  selectableDepartments,
  selectableDepartmentKeys,
} from "@/data/selectableDepartments";
import {
  selectableSchoolCategories,
  selectableSchoolCategoryKeys,
} from "@/data/selectableSchoolCategories";
import {
  BOOKMARK_NOTICE_STORAGE_KEY,
  CENTER_STORAGE_KEY,
  COLLEGE_STORAGE_KEY,
  DEPARTMENT_STORAGE_KEY,
  READ_NOTICE_STORAGE_KEY,
  SCHOOL_STORAGE_KEY,
} from "@/features/notices/constants/storageKeys";
import { useSelectedCategories } from "@/features/notices/hooks/useSelectedCategories";
import { getNoticeClientId } from "@/features/notices/utils/noticeClientState";
import {
  formatNoticeDate,
  formatViews,
  joinCategoryQuery,
} from "@/features/notices/utils/format";
const PROJECT_CENTER_KEYS = ["greenbio", "battery", "sw-core", "sw-core-education", "aicoss", "juice-semi", "nccoss"];

import type { Notice } from "@/types/notice";

type NoticeApiResponse = {
  notices: Notice[];
  error?: string;
};

type NoticeViewMode = "all" | "unread" | "bookmarks";

const NOTICES_PER_PAGE = 30;

function getNoticeStatusBadgeClass(notice: Notice) {
  if (notice.statusKind === "closed") {
    return "border border-slate-300 bg-white text-slate-500";
  }

  if (notice.statusLabel === "D-DAY") {
    return "bg-rose-600 text-white";
  }

  if (notice.statusKind === "deadline") {
    return "border border-emerald-500 bg-white text-emerald-600";
  }

  return "bg-slate-100 text-slate-700";
}
function loadStoredIds(storageKey: string) {
  const savedValue = window.localStorage.getItem(storageKey);

  if (!savedValue) {
    return [] as string[];
  }

  try {
    const parsedValue = JSON.parse(savedValue) as string[];
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

export function NoticeFeedSection() {
  const schoolSelection = useSelectedCategories(selectableSchoolCategoryKeys, {
    storageKey: SCHOOL_STORAGE_KEY,
  });
  const collegeSelection = useSelectedCategories(selectableCollegeKeys, {
    storageKey: COLLEGE_STORAGE_KEY,
  });
  const departmentSelection = useSelectedCategories(selectableDepartmentKeys, {
    storageKey: DEPARTMENT_STORAGE_KEY,
  });
  const centerSelection = useSelectedCategories(selectableCenterKeys, {
    storageKey: CENTER_STORAGE_KEY,
  });
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<NoticeViewMode>("all");
  const [readNoticeIds, setReadNoticeIds] = useState<string[]>([]);
  const [bookmarkNoticeIds, setBookmarkNoticeIds] = useState<string[]>([]);
  const [isClientStateReady, setIsClientStateReady] = useState(false);

  const isReady =
    schoolSelection.isReady &&
    collegeSelection.isReady &&
    departmentSelection.isReady &&
    centerSelection.isReady &&
    isClientStateReady;

  useEffect(() => {
    setReadNoticeIds(loadStoredIds(READ_NOTICE_STORAGE_KEY));
    setBookmarkNoticeIds(loadStoredIds(BOOKMARK_NOTICE_STORAGE_KEY));
    setIsClientStateReady(true);
  }, []);

  useEffect(() => {
    if (!isClientStateReady) {
      return;
    }

    window.localStorage.setItem(READ_NOTICE_STORAGE_KEY, JSON.stringify(readNoticeIds));
  }, [isClientStateReady, readNoticeIds]);

  useEffect(() => {
    if (!isClientStateReady) {
      return;
    }

    window.localStorage.setItem(BOOKMARK_NOTICE_STORAGE_KEY, JSON.stringify(bookmarkNoticeIds));
  }, [bookmarkNoticeIds, isClientStateReady]);

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
  }, [requestKey, viewMode]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

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
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          return;
        }

        const message =
          fetchError instanceof Error ? fetchError.message : "알 수 없는 오류가 발생했습니다.";
        setError(message);
        setNotices([]);
      } finally {
        setIsLoading(false);
      }
    }, 350);

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
            centerSelection.selectedCategories.includes(center.key) && !PROJECT_CENTER_KEYS.includes(center.key),
        )
        .map((center) => center.name),
    [centerSelection.selectedCategories],
  );

  const selectedPartnerCenterNames = useMemo(
    () =>
      selectableCenters
        .filter(
          (center) =>
            centerSelection.selectedCategories.includes(center.key) && PROJECT_CENTER_KEYS.includes(center.key),
        )
        .map((center) => center.name),
    [centerSelection.selectedCategories],
  );

  const readNoticeIdSet = useMemo(() => new Set(readNoticeIds), [readNoticeIds]);
  const bookmarkNoticeIdSet = useMemo(() => new Set(bookmarkNoticeIds), [bookmarkNoticeIds]);

  const filteredNotices = useMemo(() => {
    switch (viewMode) {
      case "unread":
        return notices.filter((notice) => !readNoticeIdSet.has(getNoticeClientId(notice)));
      case "bookmarks":
        return notices.filter((notice) => bookmarkNoticeIdSet.has(getNoticeClientId(notice)));
      default:
        return notices;
    }
  }, [bookmarkNoticeIdSet, notices, readNoticeIdSet, viewMode]);

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

    return Array.from(
      { length: endPage - adjustedStartPage + 1 },
      (_, index) => adjustedStartPage + index,
    );
  }, [safeCurrentPage, totalPages]);

  function markAsRead(notice: Notice) {
    const noticeId = getNoticeClientId(notice);
    setReadNoticeIds((current) => (current.includes(noticeId) ? current : [...current, noticeId]));
  }

  function toggleBookmark(notice: Notice) {
    const noticeId = getNoticeClientId(notice);
    setBookmarkNoticeIds((current) =>
      current.includes(noticeId)
        ? current.filter((id) => id !== noticeId)
        : [...current, noticeId],
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 via-cyan-500 to-emerald-400 p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
          Campus Notice Hub
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">내가 고른 공지 모아보기</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/90 sm:text-base">
          설정 페이지에서 고른 학교 본부, 단과대, 학과, 기관/사업단 공지를 한곳에서 볼 수 있습니다. 읽은 공지는 더 선명하게 표시되고, 중요한 공지는 북마크로 따로 모아볼 수 있습니다.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">통합 공지 목록</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              제목을 누르면 읽음 처리와 함께 원문 페이지로 이동합니다. 상단 버튼으로 안 읽은 공지와 북마크한 공지를 따로 볼 수 있습니다.
            </p>
          </div>
          <p className="text-sm font-medium text-slate-600">
            {isLoading ? "불러오는 중" : `${filteredNotices.length}개의 공지 · ${safeCurrentPage}/${totalPages}페이지`}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {selectedSchoolNames.map((name) => (
            <span key={`school-${name}`} className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
              본부 {name}
            </span>
          ))}
          {selectedCollegeNames.map((name) => (
            <span key={`college-${name}`} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              단과대 {name}
            </span>
          ))}
          {selectedDepartmentNames.map((name) => (
            <span key={`department-${name}`} className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
              학과 {name}
            </span>
          ))}
          {selectedInstitutionCenterNames.map((name) => (
            <span key={`center-inst-${name}`} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              기관공지 {name}
            </span>
          ))}
          {selectedPartnerCenterNames.map((name) => (
            <span key={`center-partner-${name}`} className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
              사업단 {name}
            </span>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setViewMode("all")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${viewMode === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
          >
            전체 공지
          </button>
          <button
            type="button"
            onClick={() => setViewMode("unread")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${viewMode === "unread" ? "bg-sky-600 text-white" : "bg-sky-100 text-sky-700"}`}
          >
            안 읽은 공지
          </button>
          <button
            type="button"
            onClick={() => setViewMode("bookmarks")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${viewMode === "bookmarks" ? "bg-amber-500 text-white" : "bg-amber-100 text-amber-700"}`}
          >
            북마크
          </button>
        </div>

        {error ? <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">{error}</div> : null}

        <div className="mt-5 grid gap-4">
          {isLoading ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">공지 목록을 불러오고 있습니다.</div> : null}
          {!isLoading && filteredNotices.length === 0 && !error ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">현재 조건에 맞는 공지가 없습니다.</div> : null}
          {!isLoading ? paginatedNotices.map((notice) => {
            const noticeId = getNoticeClientId(notice);
            const isRead = readNoticeIdSet.has(noticeId);
            const isBookmarked = bookmarkNoticeIdSet.has(noticeId);

            return (
              <article
                key={`${notice.sourceType}-${notice.sourceName}-${notice.id}`}
                className={`rounded-2xl border p-4 transition-colors ${notice.statusKind === "closed" ? "border-slate-300 bg-slate-100/90 opacity-70" : isRead ? "border-emerald-200 bg-emerald-50/60" : "border-slate-200 bg-slate-50"}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${notice.sourceType === "department" ? "bg-violet-100 text-violet-700" : notice.sourceType === "college" ? "bg-emerald-100 text-emerald-700" : notice.sourceType === "center" ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700"}`}>
                    {notice.sourceName}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{notice.category}</span>
                  {notice.isPinned ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">중요 공지</span> : null}
                  {notice.statusLabel ? (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getNoticeStatusBadgeClass(notice)}`}>
                      {notice.statusLabel}
                    </span>
                  ) : null}
                  {isRead ? (
                    <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white">
                      ✓ 읽음
                    </span>
                  ) : (
                    <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                      안 읽음
                    </span>
                  )}
                  {isBookmarked ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">북마크</span> : null}
                </div>
                <a
                  href={notice.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => markAsRead(notice)}
                  className={`mt-3 block text-base font-semibold leading-7 sm:text-lg ${notice.statusKind === "closed" ? "text-slate-500 hover:text-slate-600" : isRead ? "text-emerald-800 hover:text-emerald-900" : "text-slate-900 hover:text-sky-700"}`}
                >
                  {isRead ? `✓ ${notice.title}` : notice.title}
                </a>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                  <span>작성자 {notice.author}</span>
                  <span>작성일 {formatNoticeDate(notice.date)}</span>
                  <span>조회 {formatViews(notice.views)}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => markAsRead(notice)}
                    className={`rounded-full px-3 py-2 text-sm font-semibold ${isRead ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}
                  >
                    {isRead ? "읽음 완료" : "읽음 표시"}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleBookmark(notice)}
                    className={`rounded-full px-3 py-2 text-sm font-semibold ${isBookmarked ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-amber-100 text-amber-700 hover:bg-amber-200"}`}
                  >
                    {isBookmarked ? "북마크 해제" : "북마크"}
                  </button>
                </div>
              </article>
            );
          }) : null}
        </div>

        {!isLoading && totalPages > 1 ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safeCurrentPage === 1}
              className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              이전
            </button>
            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setCurrentPage(pageNumber)}
                className={`h-10 min-w-10 rounded-full px-3 text-sm font-semibold ${pageNumber === safeCurrentPage ? "bg-sky-600 text-white" : "border border-slate-200 text-slate-700"}`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safeCurrentPage === totalPages}
              className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              다음
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
