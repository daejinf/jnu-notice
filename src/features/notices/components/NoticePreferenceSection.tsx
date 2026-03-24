"use client";

import { useEffect, useMemo, useState } from "react";
import type { Notice } from "@/types/notice";
import {
  selectableSchoolCategories,
  selectableSchoolCategoryKeys,
} from "@/data/selectableSchoolCategories";
import { selectableColleges, selectableCollegeKeys } from "@/data/selectableColleges";
import { selectableDepartments, selectableDepartmentKeys } from "@/data/selectableDepartments";
import { useSelectedCategories } from "@/features/notices/hooks/useSelectedCategories";
import {
  formatNoticeDate,
  formatViewsLabel,
  joinCategoryQuery,
} from "@/features/notices/utils/format";

type NoticeApiResponse = {
  notices: Notice[];
  error?: string;
};

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
export function NoticePreferenceSection() {
  const schoolSelection = useSelectedCategories(selectableSchoolCategoryKeys, {
    storageKey: "selected-school-categories",
  });
  const collegeSelection = useSelectedCategories(selectableCollegeKeys, {
    storageKey: "selected-college-boards",
  });
  const departmentSelection = useSelectedCategories(selectableDepartmentKeys, {
    storageKey: "selected-department-boards",
  });
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const isReady =
    schoolSelection.isReady && collegeSelection.isReady && departmentSelection.isReady;

  const requestKey = useMemo(
    () =>
      JSON.stringify({
        school: [...schoolSelection.selectedCategories].sort(),
        college: [...collegeSelection.selectedCategories].sort(),
        department: [...departmentSelection.selectedCategories].sort(),
      }),
    [
      collegeSelection.selectedCategories,
      departmentSelection.selectedCategories,
      schoolSelection.selectedCategories,
    ],
  );

  const totalSelectedCount =
    schoolSelection.selectedCategories.length +
    collegeSelection.selectedCategories.length +
    departmentSelection.selectedCategories.length;

  useEffect(() => {
    setCurrentPage(1);
  }, [requestKey]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const hasAnySelection =
      schoolSelection.selectedCategories.length > 0 ||
      collegeSelection.selectedCategories.length > 0 ||
      departmentSelection.selectedCategories.length > 0;

    if (!hasAnySelection) {
      setNotices([]);
      setIsLoading(false);
      setError(null);
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
        const response = await fetch(
          `/api/notices?categories=${schoolQuery}&colleges=${collegeQuery}&departments=${departmentQuery}&scope=preview`,
          { signal: controller.signal },
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
  }, [isReady, requestKey]);

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

  const totalPages = Math.max(1, Math.ceil(notices.length / NOTICES_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedNotices = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * NOTICES_PER_PAGE;
    return notices.slice(startIndex, startIndex + NOTICES_PER_PAGE);
  }, [notices, safeCurrentPage]);

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

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 via-cyan-500 to-emerald-400 p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
          Campus Notice Hub
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          학교 본부, 단과대, 학과 공지를 한곳에서 선택하기
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/90 sm:text-base">
          이제 학교 본부 카테고리, 단과대 공지, 학과 공지를 각각 체크해서 원하는 공지만 모아볼 수 있습니다.
          선택이 많아도 화면이 덜 멈추도록 각 출처의 최근 5페이지까지만 먼저 불러오고, 목록은 30개씩 페이지로 나눠서 보여줍니다.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-semibold text-slate-900">학교 본부 카테고리</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              학사안내, 장학안내, 취업정보 같은 대표 공지를 고를 수 있습니다.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={schoolSelection.selectAllCategories} className="rounded-full bg-sky-600 px-3 py-2 text-sm font-semibold text-white">전체 선택</button>
              <button type="button" onClick={schoolSelection.clearCategories} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">선택 해제</button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {selectableSchoolCategories.map((category) => {
                const checked = schoolSelection.selectedCategories.includes(category.key);
                return (
                  <label key={category.key} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 ${checked ? "border-sky-500 bg-sky-50" : "border-slate-200 bg-slate-50"}`}>
                    <input type="checkbox" checked={checked} onChange={() => schoolSelection.toggleCategory(category.key)} className="h-5 w-5" />
                    <div>
                      <p className="font-semibold text-slate-900">{category.name}</p>
                      <p className="text-sm text-slate-500">대표 공지</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-semibold text-slate-900">단과대 공지</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              단과대 공지사항을 선택할 수 있습니다.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={collegeSelection.selectAllCategories} className="rounded-full bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">전체 선택</button>
              <button type="button" onClick={collegeSelection.clearCategories} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">선택 해제</button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {selectableColleges.map((college) => {
                const checked = collegeSelection.selectedCategories.includes(college.key);
                return (
                  <label key={college.key} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 ${checked ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
                    <input type="checkbox" checked={checked} onChange={() => collegeSelection.toggleCategory(college.key)} className="h-5 w-5" />
                    <div>
                      <p className="font-semibold text-slate-900">{college.name}</p>
                      <p className="text-sm text-slate-500">단과대 공지</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-semibold text-slate-900">학과 공지</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              학과를 선택하면 통합 목록에 함께 반영됩니다. 선택이 많아도 화면이 덜 멈추도록 각 학과의 최근 5페이지까지만 먼저 불러옵니다.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={departmentSelection.selectAllCategories} className="rounded-full bg-violet-600 px-3 py-2 text-sm font-semibold text-white">전체 선택</button>
              <button type="button" onClick={departmentSelection.clearCategories} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">선택 해제</button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {selectableDepartments.map((department) => {
                const checked = departmentSelection.selectedCategories.includes(department.key);
                return (
                  <label key={department.key} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 ${checked ? "border-violet-500 bg-violet-50" : "border-slate-200 bg-slate-50"}`}>
                    <input type="checkbox" checked={checked} onChange={() => departmentSelection.toggleCategory(department.key)} className="h-5 w-5" />
                    <div>
                      <p className="font-semibold text-slate-900">{department.department}</p>
                      <p className="text-sm text-slate-500">{department.college}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">통합 공지 목록</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                제목을 누르면 원문 페이지로 바로 이동합니다. 학교 본부, 단과대, 학과 공지가 날짜순으로 함께 정렬됩니다.
              </p>
            </div>
            <p className="text-sm font-medium text-slate-600">
              {isLoading ? "불러오는 중" : `${notices.length}개의 공지 · ${safeCurrentPage}/${totalPages}페이지`}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {selectedSchoolNames.map((name) => <span key={`school-${name}`} className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">본부 {name}</span>)}
            {selectedCollegeNames.map((name) => <span key={`college-${name}`} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">단과대 {name}</span>)}
            {selectedDepartmentNames.map((name) => <span key={`department-${name}`} className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">학과 {name}</span>)}
          </div>

          {totalSelectedCount >= 15 ? <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">선택한 출처가 많아도 화면에서는 각 출처의 최근 5페이지만 먼저 수집해서 보여주고 있습니다. 공지 목록은 30개씩 페이지로 나눠서 볼 수 있습니다.</div> : null}

          {error ? <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">{error}</div> : null}

          <div className="mt-5 grid gap-4">
            {isLoading ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">공지 목록을 불러오고 있습니다.</div> : null}
            {!isLoading && notices.length === 0 && !error ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">선택한 출처에 해당하는 공지가 없습니다.</div> : null}
            {!isLoading ? paginatedNotices.map((notice) => (
              <article key={`${notice.sourceType}-${notice.sourceName}-${notice.id}`} className={`rounded-2xl border p-4 ${notice.statusKind === "closed" ? "border-slate-300 bg-slate-100/90 opacity-70" : "border-slate-200 bg-slate-50"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${notice.sourceType === "department" ? "bg-violet-100 text-violet-700" : notice.sourceType === "college" ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700"}`}>
                    {notice.sourceName}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{notice.category}</span>
                  {notice.isPinned ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">중요 공지</span> : null}
                  {notice.statusLabel ? (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getNoticeStatusBadgeClass(notice)}`}>
                      {notice.statusLabel}
                    </span>
                  ) : null}
                </div>
                <a href={notice.url} target="_blank" rel="noreferrer" className={`mt-3 block text-base font-semibold leading-7 sm:text-lg ${notice.statusKind === "closed" ? "text-slate-500 hover:text-slate-600" : "text-slate-900 hover:text-sky-700"}`}>
                  {notice.title}
                </a>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                  <span>작성자 {notice.author}</span>
                  <span>작성일 {formatNoticeDate(notice.date)}</span>
                  <span>{formatViewsLabel(notice)}</span>
                </div>
              </article>
            )) : null}
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
    </div>
  );
}

