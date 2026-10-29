"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { AppPageContainer } from "@/components/ui/AppSurfaces";
import { selectableCenters, selectableCenterKeys } from "@/data/selectableCenters";
import { selectableColleges, selectableCollegeKeys } from "@/data/selectableColleges";
import { selectableDepartments, selectableDepartmentKeys } from "@/data/selectableDepartments";
import { selectableSchoolCategories, selectableSchoolCategoryKeys } from "@/data/selectableSchoolCategories";
import {
  BOOKMARK_NOTICE_STORAGE_KEY,
  CENTER_STORAGE_KEY,
  COLLEGE_STORAGE_KEY,
  DEPARTMENT_STORAGE_KEY,
  READ_NOTICE_STORAGE_KEY,
  SCHOOL_STORAGE_KEY,
  buildScopedStorageKey,
} from "@/features/notices/constants/storageKeys";
import { useSelectedCategories } from "@/features/notices/hooks/useSelectedCategories";
import { NoticeDetailReader, NoticeRow, useResolvedNoticeTitles } from "@/features/notices/components/NoticeExplorer";
import { joinCategoryQuery } from "@/features/notices/utils/format";
import { getNoticeClientId } from "@/features/notices/utils/noticeClientState";
import { GUEST_STORAGE_SCOPE, mergeGuestStateIntoAccount, readStoredArray } from "@/features/notices/utils/guestState";
import type { Notice, NoticePreferences, NoticeSourceType, NoticeState } from "@/types/notice";

const EMPTY_SELECTION: string[] = [];
const PAGE_SIZE = 30;

type Viewer = { authenticated: boolean; storageScope: string };
type ViewMode = "all" | "unread" | "bookmarks";
const SOURCE_OPTIONS: Array<{ key: NoticeSourceType; label: string }> = [
  { key: "school", label: "본부" },
  { key: "college", label: "단과대" },
  { key: "department", label: "학과" },
  { key: "center", label: "기관·사업단" },
];
function matchesSearch(notice: Notice, query: string) {
  const normalized = query.toLowerCase().replace(/\s+/g, " ").trim();
  if (!normalized) return true;
  return [notice.title, notice.author, notice.sourceName, notice.category]
    .join(" ")
    .toLowerCase()
    .includes(normalized);
}

export function NoticeWorkspace({ viewer }: { viewer: Viewer }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchQueryParam = searchParams.get("q") ?? "";
  const school = useSelectedCategories(selectableSchoolCategoryKeys, {
    storageKey: buildScopedStorageKey(SCHOOL_STORAGE_KEY, viewer.storageScope),
    defaultSelectedKeys: selectableSchoolCategoryKeys,
  });
  const college = useSelectedCategories(selectableCollegeKeys, {
    storageKey: buildScopedStorageKey(COLLEGE_STORAGE_KEY, viewer.storageScope),
    defaultSelectedKeys: EMPTY_SELECTION,
  });
  const department = useSelectedCategories(selectableDepartmentKeys, {
    storageKey: buildScopedStorageKey(DEPARTMENT_STORAGE_KEY, viewer.storageScope),
    defaultSelectedKeys: EMPTY_SELECTION,
  });
  const center = useSelectedCategories(selectableCenterKeys, {
    storageKey: buildScopedStorageKey(CENTER_STORAGE_KEY, viewer.storageScope),
    defaultSelectedKeys: EMPTY_SELECTION,
  });

  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(searchQueryParam);
  const deferredSearch = useDeferredValue(search);
  const viewMode = (["all", "unread", "bookmarks"] as const).includes(searchParams.get("view") as ViewMode)
    ? (searchParams.get("view") as ViewMode)
    : "all";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const selectedSourceTypes = useMemo(
    () => searchParams.get("source")?.split(",").filter((item): item is NoticeSourceType => SOURCE_OPTIONS.some((option) => option.key === item)) ?? [],
    [searchParams],
  );
  const selectedFeedCategories = useMemo(
    () => searchParams.get("category")?.split(",").filter(Boolean) ?? [],
    [searchParams],
  );
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [bookmarkIds, setBookmarkIds] = useState<string[]>([]);
  const [clientReady, setClientReady] = useState(false);
  const [accountHydrated, setAccountHydrated] = useState(!viewer.authenticated);

  const readKey = buildScopedStorageKey(READ_NOTICE_STORAGE_KEY, viewer.storageScope);
  const bookmarkKey = buildScopedStorageKey(BOOKMARK_NOTICE_STORAGE_KEY, viewer.storageScope);
  const selectionsReady = school.isReady && college.isReady && department.isReady && center.isReady;

  function updateQuery(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "all" || (key === "page" && value === "1")) next.delete(key);
      else next.set(key, value);
    });
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  useEffect(() => {
    if (viewer.authenticated) mergeGuestStateIntoAccount(viewer.storageScope);
    setReadIds(readStoredArray(readKey));
    setBookmarkIds(readStoredArray(bookmarkKey));
    setClientReady(true);
  }, [bookmarkKey, readKey, viewer.authenticated, viewer.storageScope]);

  useEffect(() => {
    if (!viewer.authenticated || !clientReady || !selectionsReady) return;
    const controller = new AbortController();
    const hydrate = async () => {
      try {
        const [stateResponse, preferencesResponse] = await Promise.all([
          fetch("/api/notice-state", { cache: "no-store", signal: controller.signal }),
          fetch("/api/notice-preferences", { cache: "no-store", signal: controller.signal }),
        ]);
        if (stateResponse.ok) {
          const { state } = (await stateResponse.json()) as { state: NoticeState | null };
          if (state) {
            setReadIds((current) => Array.from(new Set([...current, ...state.readNoticeIds])));
            setBookmarkIds((current) => Array.from(new Set([...current, ...state.bookmarkNoticeIds])));
          }
        }
        if (preferencesResponse.ok) {
          const { preferences } = (await preferencesResponse.json()) as { preferences: NoticePreferences | null };
          if (preferences) {
            school.setSelectedCategories((current) => Array.from(new Set([...current, ...preferences.schoolCategoryKeys])));
            college.setSelectedCategories((current) => Array.from(new Set([...current, ...preferences.collegeKeys])));
            department.setSelectedCategories((current) => Array.from(new Set([...current, ...preferences.departmentKeys])));
            center.setSelectedCategories((current) => Array.from(new Set([...current, ...preferences.centerKeys])));
          }
        }
      } finally {
        setAccountHydrated(true);
      }
    };
    void hydrate();
    return () => controller.abort();
  }, [clientReady, selectionsReady, viewer.authenticated]);

  useEffect(() => {
    if (!clientReady) return;
    window.localStorage.setItem(readKey, JSON.stringify(readIds));
    window.localStorage.setItem(bookmarkKey, JSON.stringify(bookmarkIds));
  }, [bookmarkIds, bookmarkKey, clientReady, readIds, readKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchQueryParam !== deferredSearch) updateQuery({ q: deferredSearch || null, page: null });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [deferredSearch, searchQueryParam]);

  useEffect(() => {
    setSearch(searchQueryParam);
  }, [searchQueryParam]);

  useEffect(() => {
    if (!viewer.authenticated || !accountHydrated || !clientReady) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch("/api/notice-state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readNoticeIds: readIds, bookmarkNoticeIds: bookmarkIds }),
        signal: controller.signal,
      });
    }, 350);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [accountHydrated, bookmarkIds, clientReady, readIds, viewer.authenticated]);

  const requestKey = useMemo(() => JSON.stringify({
    school: school.selectedCategories,
    college: college.selectedCategories,
    department: department.selectedCategories,
    center: center.selectedCategories,
  }), [school.selectedCategories, college.selectedCategories, department.selectedCategories, center.selectedCategories]);

  useEffect(() => {
    if (!selectionsReady || !clientReady || !accountHydrated) return;
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          categories: joinCategoryQuery(school.selectedCategories),
          colleges: joinCategoryQuery(college.selectedCategories),
          departments: joinCategoryQuery(department.selectedCategories),
          centers: joinCategoryQuery(center.selectedCategories),
          scope: "preview",
        });
        const response = await fetch(`/api/notices?${params}`, { cache: "no-store", signal: controller.signal });
        const data = (await response.json()) as { notices: Notice[]; error?: string };
        if (!response.ok) throw new Error(data.error ?? "공지를 불러오지 못했습니다.");
        setNotices(data.notices);
      } catch (caught) {
        if (caught instanceof Error && caught.name === "AbortError") return;
        setError(caught instanceof Error ? caught.message : "공지를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [accountHydrated, clientReady, requestKey, selectionsReady]);

  const readSet = useMemo(() => new Set(readIds), [readIds]);
  const bookmarkSet = useMemo(() => new Set(bookmarkIds), [bookmarkIds]);
  const sourceFiltered = useMemo(() => notices.filter((notice) => (
    selectedSourceTypes.length === 0 || selectedSourceTypes.includes(notice.sourceType)
  )), [notices, selectedSourceTypes]);
  const availableCategories = useMemo(() => Array.from(new Set(sourceFiltered.map((notice) => notice.category))).sort((a, b) => a.localeCompare(b, "ko")), [sourceFiltered]);
  const filtered = useMemo(() => sourceFiltered.filter((notice) => {
    const id = getNoticeClientId(notice);
    if (selectedFeedCategories.length > 0 && !selectedFeedCategories.includes(notice.category)) return false;
    if (viewMode === "unread" && readSet.has(id)) return false;
    if (viewMode === "bookmarks" && !bookmarkSet.has(id)) return false;
    return matchesSearch(notice, deferredSearch);
  }), [bookmarkSet, deferredSearch, readSet, selectedFeedCategories, sourceFiltered, viewMode]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleNotices = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    if (!visibleNotices.length) { setSelectedId(null); return; }
    if (!selectedId || !visibleNotices.some((notice) => getNoticeClientId(notice) === selectedId)) {
      setSelectedId(getNoticeClientId(visibleNotices[0]));
    }
  }, [selectedId, visibleNotices]);

  const selectedNotice = visibleNotices.find((notice) => getNoticeClientId(notice) === selectedId) ?? null;
  const sourceCount = school.selectedCategories.length + college.selectedCategories.length + department.selectedCategories.length + center.selectedCategories.length;
  const activeFilterCount = (viewMode === "all" ? 0 : 1) + selectedSourceTypes.length + selectedFeedCategories.length + (deferredSearch ? 1 : 0);
  const displayCategories = showAllCategories ? availableCategories : availableCategories.slice(0, 8);
  const getDisplayTitle = useResolvedNoticeTitles(visibleNotices);

  function toggleSourceType(sourceType: NoticeSourceType) {
    const next = selectedSourceTypes.includes(sourceType)
      ? selectedSourceTypes.filter((item) => item !== sourceType)
      : [...selectedSourceTypes, sourceType];
    updateQuery({ source: next.join(",") || null, category: null, page: null });
  }

  function toggleFeedCategory(category: string) {
    const next = selectedFeedCategories.includes(category)
      ? selectedFeedCategories.filter((item) => item !== category)
      : [...selectedFeedCategories, category];
    updateQuery({ category: next.join(",") || null, page: null });
  }

  function selectNotice(notice: Notice) {
    const id = getNoticeClientId(notice);
    setSelectedId(id);
    setMobileDetailOpen(true);
    setReadIds((current) => current.includes(id) ? current : [...current, id]);
  }

  function toggleBookmark(notice: Notice) {
    const id = getNoticeClientId(notice);
    setBookmarkIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <main>
      <AppPageContainer>
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">피드</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">지금 필요한 공지</h1>
            <p className="mt-2 text-sm text-slate-500">선택한 {sourceCount}개 소스에서 최신 공지를 모았습니다.</p>
          </div>
          <label className="relative block w-full xl:max-w-xl">
            <Search aria-hidden="true" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <span className="sr-only">공지 검색</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="제목, 작성자, 소스로 공지 검색" className="h-13 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
          </label>
        </section>

        {!viewer.authenticated ? (
          <div className="flex flex-col gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900 sm:flex-row sm:items-center sm:justify-between">
            <span>게스트 모드예요. 읽음·저장·관심 소스는 이 브라우저에 안전하게 보관됩니다.</span>
            <span className="font-semibold">로그인하면 다른 기기와 동기화할 수 있어요.</span>
          </div>
        ) : null}

        <section className="grid min-h-[calc(100vh-220px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)] xl:grid-cols-[minmax(440px,0.92fr)_minmax(500px,1.08fr)]">
          <div className="min-w-0 border-b border-slate-200 xl:border-b-0 xl:border-r">
            <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
                {(["all", "unread", "bookmarks"] as const).map((mode) => (
                  <button key={mode} type="button" onClick={() => updateQuery({ view: mode, page: null })} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${viewMode === mode ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                    {mode === "all" ? "전체" : mode === "unread" ? "안 읽음" : "저장"}
                  </button>
                ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500">{filtered.length}건</span>
                  {activeFilterCount > 0 ? <button type="button" onClick={() => { setSearch(""); router.replace(pathname, { scroll: false }); }} className="text-xs font-semibold text-blue-600 hover:text-blue-800">필터 초기화 · {activeFilterCount}</button> : null}
                </div>
              </div>
              <button type="button" onClick={() => setMobileFiltersOpen((current) => !current)} aria-expanded={mobileFiltersOpen} className="mt-3 flex w-full min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-left text-xs font-bold text-slate-700 md:hidden">
                <SlidersHorizontal className="h-4 w-4" />필터 {activeFilterCount > 0 ? `${activeFilterCount}개 적용` : "선택"}
                <ChevronDown className={`ml-auto h-4 w-4 transition ${mobileFiltersOpen ? "rotate-180" : ""}`} />
              </button>
              {activeFilterCount > 0 ? <div className="mt-3 flex flex-wrap gap-1.5 md:hidden" aria-label="적용된 필터 요약">
                {selectedSourceTypes.map((source) => <span key={source} className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">{SOURCE_OPTIONS.find((item) => item.key === source)?.label}</span>)}
                {selectedFeedCategories.map((category) => <span key={category} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{category}</span>)}
              </div> : null}
              <div className={`${mobileFiltersOpen ? "block" : "hidden"} md:block`}>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-500"><SlidersHorizontal className="h-4 w-4" />출처</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SOURCE_OPTIONS.map((option) => <button key={option.key} type="button" onClick={() => toggleSourceType(option.key)} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${selectedSourceTypes.includes(option.key) ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>{option.label}</button>)}
                </div>
                {availableCategories.length ? <>
                  <div className="mt-4 text-xs font-bold text-slate-500">카테고리</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {displayCategories.map((category) => <button key={category} type="button" onClick={() => toggleFeedCategory(category)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${selectedFeedCategories.includes(category) ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>{category}</button>)}
                    {availableCategories.length > 8 ? <button type="button" onClick={() => setShowAllCategories((current) => !current)} className="rounded-full px-3 py-1.5 text-xs font-semibold text-blue-600">{showAllCategories ? "접기" : `더보기 +${availableCategories.length - 8}`}</button> : null}
                  </div>
                </> : null}
              </div>
            </div>

            <div className="max-h-[calc(100vh-300px)] min-h-[560px] overflow-y-auto">
              {loading ? <div className="flex h-56 items-center justify-center gap-2 text-sm text-slate-500"><LoaderCircle className="h-5 w-5 animate-spin" />공지를 불러오는 중</div> : null}
              {error ? <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
              {!loading && !error && visibleNotices.length === 0 ? <div className="flex h-56 items-center justify-center text-sm text-slate-500">조건에 맞는 공지가 없습니다.</div> : null}
              {visibleNotices.map((notice) => {
                const id = getNoticeClientId(notice);
                return (
                  <NoticeRow
                    key={id}
                    notice={notice}
                    title={getDisplayTitle(notice)}
                    selected={id === selectedId}
                    read={readSet.has(id)}
                    bookmarked={bookmarkSet.has(id)}
                    onSelect={() => selectNotice(notice)}
                    onToggleBookmark={() => toggleBookmark(notice)}
                  />
                );
              })}
            </div>

            {totalPages > 1 ? (
              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                <button type="button" disabled={safePage === 1} onClick={() => updateQuery({ page: String(Math.max(1, safePage - 1)) })} className="rounded-lg p-2 text-slate-600 disabled:opacity-30" aria-label="이전 페이지"><ChevronLeft className="h-5 w-5" /></button>
                <span className="text-xs font-semibold text-slate-500">{safePage} / {totalPages}</span>
                <button type="button" disabled={safePage === totalPages} onClick={() => updateQuery({ page: String(Math.min(totalPages, safePage + 1)) })} className="rounded-lg p-2 text-slate-600 disabled:opacity-30" aria-label="다음 페이지"><ChevronRight className="h-5 w-5" /></button>
              </div>
            ) : null}
          </div>

          <div className={`min-w-0 bg-[#FCFCFD] ${mobileDetailOpen ? "fixed inset-0 z-50 xl:static xl:z-auto" : "hidden xl:block"}`}>
            <NoticeDetailReader
              notice={selectedNotice}
              title={selectedNotice ? getDisplayTitle(selectedNotice) : undefined}
              bookmarked={selectedNotice ? bookmarkSet.has(getNoticeClientId(selectedNotice)) : false}
              onToggleBookmark={selectedNotice ? () => toggleBookmark(selectedNotice) : undefined}
              onClose={() => setMobileDetailOpen(false)}
            />
          </div>
        </section>
      </AppPageContainer>
    </main>
  );
}
