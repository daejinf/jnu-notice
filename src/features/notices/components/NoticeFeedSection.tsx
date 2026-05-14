"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { AppHeroSection, AppPageContainer, AppPanel } from "@/components/ui/AppSurfaces";
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
import { formatNoticeDate, formatViewsLabel, joinCategoryQuery } from "@/features/notices/utils/format";
import type { SchoolBoardCategory } from "@/features/notices/config/schoolBoardCategories";
import type { Notice, NoticeState } from "@/types/notice";

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
const SCHOOL_BOARD_BASE_URL = "https://www.jnu.ac.kr/WebApp/web/HOM/COM/Board/board.aspx";

function buildSchoolCategoryLink(category: Pick<SchoolBoardCategory, "cate">) {
  const url = new URL(SCHOOL_BOARD_BASE_URL);
  url.searchParams.set("boardID", "5");
  url.searchParams.set("cate", category.cate);
  url.searchParams.set("page", "1");
  return url.toString();
}

function getNoticeSourceLink(notice: Notice) {
  if (notice.sourceType === "school") {
    const matchedCategory = selectableSchoolCategories.find((category) => category.name === notice.category);
    return buildSchoolCategoryLink(matchedCategory ?? { cate: "0" });
  }

  if (notice.sourceType === "college") {
    return selectableColleges.find((college) => college.name === notice.sourceName)?.listUrl ?? null;
  }

  if (notice.sourceType === "department") {
    const department = selectableDepartments.find((item) => item.department === notice.sourceName);
    return department?.noticeUrl ?? department?.siteUrl ?? null;
  }

  return selectableCenters.find((center) => center.name === notice.sourceName)?.listUrl ?? null;
}

function getSelectedChipLink(tone: "school" | "college" | "department" | "institution" | "project", name: string) {
  if (tone === "school") {
    const matchedCategory = selectableSchoolCategories.find((category) => category.name === name);
    return buildSchoolCategoryLink(matchedCategory ?? { cate: "0" });
  }

  if (tone === "college") {
    return selectableColleges.find((college) => college.name === name)?.listUrl ?? null;
  }

  if (tone === "department") {
    const department = selectableDepartments.find((item) => name.endsWith(item.department) || item.department === name);
    return department?.noticeUrl ?? department?.siteUrl ?? null;
  }

  return selectableCenters.find((center) => center.name === name)?.listUrl ?? null;
}


type NoticeApiResponse = {
  notices: Notice[];
  error?: string;
};

type NoticeSummaryData = {
  summary: string;
  bullets: string[];
  targetAudience: string;
  deadline: string;
  actionItems: string[];
  benefits: string[];
  requiredDocuments: string[];
  contact: string;
  caution: string;
  attachments: Array<{
    label: string;
    url: string;
    note: string;
  }>;
  actionLinks: Array<{
    label: string;
    url: string;
    note: string;
  }>;
  attachmentAnalysisState: "pending" | "complete";
  calendarItems: Array<{
    label: string;
    eventType: string;
    eventDate: string;
    startAt: string;
    endAt: string;
    when: string;
    note: string;
  }>;
  sourceTitle: string;
  extractedAt: string;
  fromCache: boolean;
};

type NoticeSummaryApiResponse = {
  summary: NoticeSummaryData | null;
  error?: string;
};

type NoticeStateApiResponse = {
  state: NoticeState | null;
  error?: string;
};

type NoticeSummaryState = {
  open: boolean;
  status: "loading" | "success" | "error";
  data?: NoticeSummaryData;
  error?: string;
  isRefreshing?: boolean;
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

function parseCalendarDates(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  const matches = Array.from(normalized.matchAll(/(\d{4}[./-]\d{1,2}[./-]\d{1,2}\([^)]*\)|\d{4}[./-]\d{1,2}[./-]\d{1,2})/g)).map(
    (match) => match[1],
  );

  return {
    start: matches[0] ?? normalized,
    end: matches.length > 1 ? matches[matches.length - 1] : matches[0] ?? normalized,
  };
}

const CALENDAR_EVENT_TYPE_LABELS: Record<string, string> = {
  apply_open: "지원 시작",
  apply_deadline: "지원 마감",
  interview: "면접",
  result: "결과 발표",
  orientation: "설명회",
  class_start: "수업 시작",
  program_start: "프로그램 시작",
  payment: "납부",
  announcement: "안내 일정",
  other: "주요 일정",
};

function toCompactProgramName(label: string, noticeTitle: string) {
  const preferred =
    label.match(/[A-Z][A-Z0-9&+ -]{1,24}/)?.[0]?.trim() ??
    noticeTitle.match(/\(([A-Za-z0-9&+ -]{2,24})\)/)?.[1]?.trim() ??
    label.trim() ??
    noticeTitle.trim();

  return preferred
    .replace(/프로그램 일정/gi, "")
    .replace(/지원 시작일|모집 시작일|접수 시작일|시작일|마감일|모집 마감일|지원 마감일/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildCalendarTitle(notice: Notice, item: NoticeSummaryData["calendarItems"][number]) {
  const programName = toCompactProgramName(item.label, notice.title);
  const eventLabel = CALENDAR_EVENT_TYPE_LABELS[item.eventType] ?? item.note ?? "주요 일정";
  const start = item.startAt && item.startAt !== "명시되지 않음" ? item.startAt : "";
  const end = item.endAt && item.endAt !== "명시되지 않음" ? item.endAt : "";
  const eventDate = item.eventDate && item.eventDate !== "명시되지 않음" ? item.eventDate : "";

  if (start && end && start !== end) {
    return `${programName} | ${eventLabel} | ${start} ~ ${end}`;
  }

  if (eventDate) {
    return `${programName} | ${eventLabel} | ${eventDate}`;
  }

  if (start || end) {
    return `${programName} | ${eventLabel} | ${start || end}`;
  }

  const { start: parsedStart, end: parsedEnd } = parseCalendarDates(item.when);
  if (parsedStart && parsedEnd && parsedStart !== parsedEnd) {
    return `${programName} | ${eventLabel} | ${parsedStart} ~ ${parsedEnd}`;
  }

  return `${programName} | ${eventLabel} | ${item.when}`;
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
      ? "\uBCF8\uBD80 \uC54C\uB9BC"
      : notice.sourceType === "college"
        ? "\uB2E8\uACFC\uB300 \uC54C\uB9BC"
        : notice.sourceType === "department"
          ? "\uD559\uACFC \uC54C\uB9BC"
          : PROJECT_CENTER_NAME_SET.has(notice.sourceName)
            ? "\uC0AC\uC5C5\uB2E8 \uC54C\uB9BC"
            : "\uAE30\uAD00 \uC54C\uB9BC";

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
  if (notice.sourceType === "department") return "border border-violet-100 bg-violet-50 text-slate-500";
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

function parseApiJsonResponse<T>(rawText: string, fallbackMessage: string) {
  try {
    return JSON.parse(rawText) as T;
  } catch {
    const preview = rawText.trim().slice(0, 120).toLowerCase();
    if (preview.startsWith("<!doctype") || preview.startsWith("<html") || preview.startsWith("<")) {
      throw new Error(`${fallbackMessage} 서버가 JSON 대신 HTML 페이지를 반환했습니다.`);
    }

    throw new Error(fallbackMessage);
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
  href,
}: {
  label: string;
  tone: "school" | "college" | "department" | "institution" | "project";
  href?: string | null;
}) {
  const toneClass = {
    school: "border border-sky-200 bg-sky-100 text-sky-900",
    college: "border border-emerald-200 bg-emerald-100 text-emerald-900",
    department: "border border-violet-200 bg-violet-100 text-slate-950",
    institution: "border border-amber-200 bg-amber-100 text-amber-900",
    project: "border border-orange-200 bg-orange-100 text-orange-900",
  }[tone];

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={`max-w-full break-words rounded-full px-3 py-1 text-xs font-semibold leading-5 transition hover:brightness-95 ${toneClass}`}
      >
        {label}
      </a>
    );
  }

  return <span className={`max-w-full break-words rounded-full px-3 py-1 text-xs font-semibold leading-5 ${toneClass}`}>{label}</span>;
}

function CompactActionButton({
  active,
  onClick,
  activeLabel,
  idleLabel,
  activeClass,
  idleClass,
  disabled = false,
}: {
  active: boolean;
  onClick: () => void;
  activeLabel: string;
  idleLabel: string;
  activeClass: string;
  idleClass: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-11 items-center justify-center rounded-[18px] px-4 text-[13px] font-semibold tracking-[-0.01em] transition disabled:cursor-not-allowed disabled:opacity-60 ${active ? activeClass : idleClass}`}
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
      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      aria-label={direction === "prev" ? "\uC774\uC804 \uD398\uC774\uC9C0" : "\uB2E4\uC74C \uD398\uC774\uC9C0"}
    >
      <span className="text-base font-bold">{direction === "prev" ? "\u2039" : "\u203A"}</span>
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
  const [isHydratingNoticeState, setIsHydratingNoticeState] = useState(true);
  const [noticeSummaryById, setNoticeSummaryById] = useState<Record<string, NoticeSummaryState>>({});
  const [copiedCalendarKey, setCopiedCalendarKey] = useState<string | null>(null);

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

  useEffect(() => {
    if (!isClientStateReady) {
      return;
    }

    const controller = new AbortController();

    const run = async () => {
      try {
        const response = await fetch("/api/notice-state", {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = (await response.json()) as NoticeStateApiResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "??뚯벉 ?怨밴묶???븍뜄???? 筌륁궢六??щ빍??");
        }

        if (data.state) {
          setReadNoticeIds((current) => Array.from(new Set([...current, ...data.state!.readNoticeIds])));
          setBookmarkNoticeIds((current) => Array.from(new Set([...current, ...data.state!.bookmarkNoticeIds])));
        }
      } catch (stateError) {
        if (stateError instanceof Error && stateError.name === "AbortError") {
          return;
        }
      } finally {
        setIsHydratingNoticeState(false);
      }
    };

    void run();

    return () => controller.abort();
  }, [isClientStateReady]);

  useEffect(() => {
    if (!isClientStateReady || isHydratingNoticeState) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        await fetch("/api/notice-state", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            readNoticeIds,
            bookmarkNoticeIds,
          }),
          signal: controller.signal,
        });
      } catch (stateError) {
        if (stateError instanceof Error && stateError.name === "AbortError") {
          return;
        }
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [bookmarkNoticeIds, isClientStateReady, isHydratingNoticeState, readNoticeIds]);

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
          throw new Error(data.error ?? "\uACF5\uC9C0 \uBAA9\uB85D\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
        }

        setNotices(data.notices);
      } catch (fetchError) {
        if (fetchError instanceof Error && fetchError.name === "AbortError") return;
        const message = fetchError instanceof Error ? fetchError.message : "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.";
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
        .map((department) => `${department.college} \u00B7 ${department.department}`),
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

  async function copyCalendarText(key: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedCalendarKey(key);
    window.setTimeout(() => {
      setCopiedCalendarKey((current) => (current === key ? null : current));
    }, 1800);
  }

  async function requestNoticeSummary(notice: Notice, includeAttachmentAnalysis = false) {
    const response = await fetch("/api/notice-summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: notice.url,
        title: notice.title,
        sourceName: notice.sourceName,
        includeAttachmentAnalysis,
      }),
    });
    const rawResponseText = await response.text();
    const data = parseApiJsonResponse<NoticeSummaryApiResponse>(
      rawResponseText,
      "AI 요약 응답을 읽지 못했습니다.",
    );
    const summary = data.summary;

    if (!response.ok || !summary) {
      throw new Error(data.error ?? "AI 요약을 불러오지 못했습니다.");
    }

    return summary;
  }

  async function handleNoticeSummary(notice: Notice) {
    const noticeId = getNoticeClientId(notice);
    const currentState = noticeSummaryById[noticeId];

    if (currentState?.status === "success") {
      setNoticeSummaryById((current) => ({
        ...current,
        [noticeId]: {
          ...currentState,
          open: !currentState.open,
        },
      }));
      return;
    }

    setNoticeSummaryById((current) => ({
      ...current,
      [noticeId]: {
        open: true,
        status: "loading",
      },
    }));

    try {
      const summary = await requestNoticeSummary(notice, false);

      setNoticeSummaryById((current) => ({
        ...current,
        [noticeId]: {
          open: true,
          status: "success",
          data: summary,
          isRefreshing: false,
        },
      }));
    } catch (summaryError) {
      const message = summaryError instanceof Error ? summaryError.message : "AI ?? ?? ? ??? ??????.";
      setNoticeSummaryById((current) => ({
        ...current,
        [noticeId]: {
          open: true,
          status: "error",
          error: message,
        },
      }));
    }
  }

  async function handleAttachmentAnalysis(notice: Notice) {
    const noticeId = getNoticeClientId(notice);

    setNoticeSummaryById((current) => {
      const existing = current[noticeId];
      if (!existing || existing.status !== "success") {
        return current;
      }

      return {
        ...current,
        [noticeId]: {
          ...existing,
          isRefreshing: true,
        },
      };
    });

    try {
      const enrichedSummary = await requestNoticeSummary(notice, true);
      setNoticeSummaryById((current) => ({
        ...current,
        [noticeId]: {
          open: current[noticeId]?.open ?? true,
          status: "success",
          data: enrichedSummary,
          isRefreshing: false,
        },
      }));
    } catch (summaryError) {
      const message = summaryError instanceof Error ? summaryError.message : "첨부 분석 중 문제가 발생했습니다.";
      setNoticeSummaryById((current) => {
        const existing = current[noticeId];
        if (!existing || existing.status !== "success") {
          return current;
        }

        return {
          ...current,
          [noticeId]: {
            ...existing,
            isRefreshing: false,
            error: message,
          },
        };
      });
    }
  }

  const unreadCount = joinedAfterNotices.filter(
    (notice) => !readNoticeIdSet.has(getNoticeClientId(notice)),
  ).length;
  const bookmarkCount = uniqueNotices.filter((notice) => bookmarkNoticeIdSet.has(getNoticeClientId(notice))).length;

  return (
    <AppPageContainer>
      <AppHeroSection
        badge="피드"
        badgeTone="blue"
        title="지금 필요한 공지부터"
        description="켜둔 소스를 기준으로 새 공지, 안 읽은 공지, 저장한 공지를 한 흐름으로 정리했습니다."
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 xl:min-w-[520px]">
          <div className="rounded-[24px] border border-slate-200 bg-[#FBFCFD] p-4">
            <p className="text-xs font-semibold text-slate-500">{"\uBC1B\uC740 \uACF5\uC9C0"}</p>
            <p className="mt-2 text-2xl font-black tracking-tight text-[#191F28] sm:text-[28px]">{joinedAfterNotices.length}</p>
          </div>
          <div className="rounded-[24px] border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-semibold text-blue-700">{"\uC548 \uC77D\uC74C"}</p>
            <p className="mt-2 text-2xl font-black tracking-tight text-[#1B64DA] sm:text-[28px]">{unreadCount}</p>
          </div>
          <div className="rounded-[24px] border border-amber-100 bg-amber-50 p-4">
            <p className="text-xs font-semibold text-amber-700">{"\uC800\uC7A5"}</p>
            <p className="mt-2 text-2xl font-black tracking-tight text-amber-700 sm:text-[28px]">{bookmarkCount}</p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-[#FBFCFD] p-4">
            <p className="text-xs font-semibold text-slate-500">{"\uC18C\uC2A4"}</p>
            <p className="mt-2 text-2xl font-black tracking-tight text-[#191F28] sm:text-[28px]">
              {schoolSelection.selectedCategories.length + collegeSelection.selectedCategories.length + departmentSelection.selectedCategories.length + centerSelection.selectedCategories.length}
            </p>
          </div>
        </div>
      </AppHeroSection>

      <div className="mt-5 grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-[108px] xl:self-start">
          <AppPanel className="p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)]">
            <div className="border-b border-slate-100 pb-4">
              <p className="text-sm font-semibold text-slate-500">{"\uBC1B\uB294 \uC18C\uC2A4"}</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">{"\uC9C0\uAE08 \uBCFC \uC18C\uC2A4"}</h2>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {selectedSchoolNames.map((name) => (
                <SectionChip key={`school-${name}`} label={`${"\uBCF8\uBD80"} ${name}`} tone="school" href={getSelectedChipLink("school", name)} />
              ))}
              {selectedCollegeNames.map((name) => (
                <SectionChip key={`college-${name}`} label={`${"\uB2E8\uACFC\uB300"} ${name}`} tone="college" href={getSelectedChipLink("college", name)} />
              ))}
              {selectedDepartmentNames.map((name) => (
                <SectionChip key={`department-${name}`} label={`${"\uD559\uACFC"} ${name}`} tone="department" href={getSelectedChipLink("department", name)} />
              ))}
              {selectedInstitutionCenterNames.map((name) => (
                <SectionChip key={`institution-${name}`} label={`${"\uAE30\uAD00"} ${name}`} tone="institution" href={getSelectedChipLink("institution", name)} />
              ))}
              {selectedProjectCenterNames.map((name) => (
                <SectionChip key={`project-${name}`} label={`${"\uC0AC\uC5C5\uB2E8"} ${name}`} tone="project" href={getSelectedChipLink("project", name)} />
              ))}
            </div>

            {selectedSchoolNames.length === 0 &&
            selectedCollegeNames.length === 0 &&
            selectedDepartmentNames.length === 0 &&
            selectedInstitutionCenterNames.length === 0 &&
            selectedProjectCenterNames.length === 0 ? (
              <div className="mt-4 rounded-[20px] bg-[#FBFCFD] px-4 py-4 text-sm leading-6 text-slate-500">
                {"\uC544\uC9C1 \uCF1C\uB454 \uC18C\uC2A4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uC18C\uC2A4\uAD00\uB9AC\uC5D0\uC11C \uC6B0\uC120 \uACE0\uB974\uBA74 \uBC14\uB85C \uBC18\uC601\uB429\uB2C8\uB2E4."}
              </div>
            ) : null}
          </AppPanel>

        </aside>

        <AppPanel className="p-4 shadow-[0_16px_36px_rgba(15,23,42,0.05)] sm:p-6">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5">
            <section className="rounded-[24px] border border-slate-200 bg-[#FBFCFD] p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">{"\uBCF4\uAE30 \uBC29\uC2DD"}</p>
                  <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">{"\uC815\uB82C"}</h2>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <button type="button" onClick={() => setViewMode("all")} className={`rounded-[18px] px-4 py-3 text-left text-sm font-semibold transition ${getSegmentClass(viewMode === "all", "neutral")}`}>
                    {"\uC804\uCCB4 \uACF5\uC9C0"}
                  </button>
                  <button type="button" onClick={() => setViewMode("unread")} className={`rounded-[18px] px-4 py-3 text-left text-sm font-semibold transition ${getSegmentClass(viewMode === "unread", "brand")}`}>
                    {"\uC548 \uC77D\uC74C"}
                  </button>
                  <button type="button" onClick={() => setViewMode("bookmarks")} className={`rounded-[18px] px-4 py-3 text-left text-sm font-semibold transition ${getSegmentClass(viewMode === "bookmarks", "bookmark")}`}>
                    {"\uC800\uC7A5"}
                  </button>
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-[24px] font-black tracking-tight text-[#191F28]">{"\uC0C8 \uACF5\uC9C0"}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {"\uC81C\uBAA9, \uC791\uC131\uC790, \uC18C\uC2A4 \uAE30\uC900\uC73C\uB85C \uBE60\uB974\uAC8C \uCC3E\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4."}
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:items-center">
                <div className="relative w-full sm:w-[280px]">
                  <input
                    type="search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder={"\uC81C\uBAA9, \uC791\uC131\uC790, \uC18C\uC2A4"}
                    className="h-12 w-full rounded-[18px] border border-slate-200 bg-[#F7F9FB] px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#3182F6] focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                  {searchInput ? (
                    <button
                      type="button"
                      onClick={() => setSearchInput("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-3 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                    >
                      {"\uCD08\uAE30\uD654"}
                    </button>
                  ) : null}
                </div>

                <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap sm:self-auto">
                  <PageArrowButton
                    direction="prev"
                    disabled={safeCurrentPage === 1}
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  />
                  <div className="rounded-[18px] border border-slate-200 bg-[#FBFCFD] px-4 py-2 text-sm font-semibold text-slate-600">
                    {isLoading ? "\uBD88\uB7EC\uC624\uB294 \uC911" : `${filteredNotices.length}\uAC1C | ${safeCurrentPage}/${totalPages}\uD398\uC774\uC9C0`}
                  </div>
                  <PageArrowButton
                    direction="next"
                    disabled={safeCurrentPage === totalPages}
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  />
                </div>
              </div>
            </div>
          </div>

          {error ? <div className="mt-5 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">{error}</div> : null}

          <div className="mt-5 grid gap-3">
            {isLoading ? (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-[#FBFCFD] px-4 py-16 text-center text-sm text-slate-500">
                {"\uACF5\uC9C0\uB97C \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4."}
              </div>
            ) : null}

            {!isLoading && filteredNotices.length === 0 && !error ? (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-[#FBFCFD] px-4 py-16 text-center text-sm text-slate-500">
                {"\uC870\uAC74\uC5D0 \uB9DE\uB294 \uACF5\uC9C0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."}
              </div>
            ) : null}

            {!isLoading
              ? paginatedNotices.map((notice) => {
                  const noticeId = getNoticeClientId(notice);
                  const isRead = readNoticeIdSet.has(noticeId);
                  const isBookmarked = bookmarkNoticeIdSet.has(noticeId);
                  const summaryState = noticeSummaryById[noticeId];
                  const isSummaryLoading = summaryState?.status === "loading";
                  const isSummaryOpen = summaryState?.open ?? false;

                  return (
                    <article
                      key={noticeId}
                      className={`min-w-0 rounded-[24px] border px-4 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.03)] transition sm:px-5 sm:py-5 ${getCardClass(notice, isRead)}`}
                    >
                      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            {getNoticeSourceLink(notice) ? (
                              <a
                                href={getNoticeSourceLink(notice) ?? undefined}
                                target="_blank"
                                rel="noreferrer"
                                className={`max-w-full rounded-2xl px-3 py-1.5 text-[11px] font-semibold transition [overflow-wrap:anywhere] hover:brightness-95 ${getSourceBadgeClass(notice)}`}
                              >
                                {notice.sourceName}
                              </a>
                            ) : (
                              <span className={`max-w-full rounded-2xl px-3 py-1.5 text-[11px] font-semibold [overflow-wrap:anywhere] ${getSourceBadgeClass(notice)}`}>{notice.sourceName}</span>
                            )}
                            <span className="max-w-full rounded-2xl bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-500 [overflow-wrap:anywhere]">{notice.category}</span>
                            {notice.isPinned ? <span className="rounded-2xl bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-700">{"\uC911\uC694"}</span> : null}
                            {notice.statusLabel ? <span className={`rounded-2xl px-3 py-1.5 text-[11px] font-semibold ${getStatusBadgeClass(notice)}`}>{notice.statusLabel}</span> : null}
                            <span className={`rounded-2xl px-3 py-1.5 text-[11px] font-semibold ${isRead ? "bg-emerald-600 text-white" : "bg-blue-50 text-blue-700"}`}>{isRead ? "\uC77D\uC74C" : "\uC548 \uC77D\uC74C"}</span>
                          </div>

                          <a
                            href={notice.url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => markAsRead(notice)}
                            className={`mt-3 block max-w-full break-words text-[18px] font-bold leading-8 tracking-tight [overflow-wrap:anywhere] sm:text-[19px] ${notice.statusKind === "closed" ? "text-slate-500 hover:text-slate-600" : isRead ? "text-slate-700 hover:text-slate-900" : "text-[#191F28] hover:text-[#1B64DA]"}`}
                          >
                            {notice.title}
                          </a>

                          <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-slate-500">
                            <span className="max-w-full [overflow-wrap:anywhere]">{notice.author}</span>
                            <span className="text-slate-300">|</span>
                            <span>{formatNoticeDate(notice.date)}</span>
                            <span className="text-slate-300">|</span>
                            <span>{formatViewsLabel(notice)}</span>
                          </div>
                        </div>

                        <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto lg:flex-nowrap lg:pl-4">
                          <CompactActionButton
                            active={isSummaryOpen && summaryState?.status === "success"}
                            onClick={() => void handleNoticeSummary(notice)}
                            activeLabel="요약 보기"
                            idleLabel={isSummaryLoading ? "요약 중" : "AI 요약"}
                            activeClass="border border-slate-900 bg-slate-900 text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]"
                            idleClass="border border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50"
                            disabled={isSummaryLoading}
                          />
                          <CompactActionButton
                            active={isRead}
                            onClick={() => markAsRead(notice)}
                            activeLabel={"\uC77D\uC74C"}
                            idleLabel={"\uC77D\uAE30"}
                            activeClass="bg-emerald-600 text-white"
                            idleClass="bg-[#F2F4F6] text-slate-700 hover:bg-slate-200"
                          />
                          <CompactActionButton
                            active={isBookmarked}
                            onClick={() => toggleBookmark(notice)}
                            activeLabel={"\uC800\uC7A5\uB428"}
                            idleLabel={"\uC800\uC7A5"}
                            activeClass="bg-amber-500 text-white hover:bg-amber-600"
                            idleClass="bg-amber-50 text-amber-700 hover:bg-amber-100"
                          />
                        </div>
                      </div>

                      {isSummaryOpen ? (
                        <div className="mt-5 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_48px_rgba(15,23,42,0.08)]">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-[linear-gradient(135deg,#f8fafc_0%,#eef5ff_55%,#ffffff_100%)] px-5 py-5 sm:px-6">
                            <div>
                              <p className="text-sm font-bold text-slate-950">AI 요약</p>
                              <p className="text-xs text-slate-500">
                                {summaryState?.data?.fromCache
                                  ? "DeepSeek가 저장된 요약을 다시 불러왔습니다."
                                  : "DeepSeek가 상세 페이지를 읽고 정리한 내용"}
                              </p>
                            </div>
                            {summaryState?.data?.extractedAt ? (
                              <p className="text-xs text-slate-500">
                                {new Date(summaryState.data.extractedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
                              </p>
                            ) : null}
                          </div>

                          {summaryState?.status === "success" &&
                          summaryState.data?.attachmentAnalysisState === "pending" ? (
                            <div className="mx-5 mt-4 flex flex-wrap items-center gap-3 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 sm:mx-6">
                              <p className="text-sm leading-6 text-slate-600">
                                현재는 본문만 먼저 읽었습니다. 필요하면 첨부파일까지 더 깊게 분석할 수 있어요.
                              </p>
                              <button
                                type="button"
                                onClick={() => void handleAttachmentAnalysis(notice)}
                                disabled={summaryState.isRefreshing}
                                className={`inline-flex h-11 items-center rounded-[16px] px-4 text-sm font-semibold transition ${
                                  summaryState.isRefreshing
                                    ? "cursor-wait border border-slate-200 bg-slate-200 text-slate-500"
                                    : "border border-slate-900 bg-slate-900 text-white shadow-[0_10px_22px_rgba(15,23,42,0.18)] hover:bg-slate-800"
                                }`}
                              >
                                {summaryState.isRefreshing ? "첨부 분석 중..." : "첨부까지 분석"}
                              </button>
                            </div>
                          ) : null}

                          {summaryState.status === "loading" ? (
                            <p className="mx-5 mt-4 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700 sm:mx-6">
                              상세 페이지를 읽고 핵심 일정과 지원 조건을 정리하고 있습니다.
                            </p>
                          ) : null}

                          {summaryState.status === "error" ? (
                            <div className="mx-5 mt-4 rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm leading-6 text-rose-700 sm:mx-6">
                              {summaryState.error}
                            </div>
                          ) : null}

                          {summaryState.status === "success" && summaryState.data ? (
                            <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
                              {summaryState.data.calendarItems.length > 0 ? (
                                <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">바로 캨린더에 옮길 일정</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                      중요한 일정만 압축해서 복사할 수 있게 정리했습니다.
                                    </p>
                                  </div>

                                  <div className="mt-3 space-y-3">
                                    {summaryState.data.calendarItems.map((item) => {
                                      const titleKey = `${noticeId}-${item.label}-title`;
                                      const memoKey = `${noticeId}-${item.label}-memo`;
                                      const titleCopied = copiedCalendarKey === titleKey;
                                      const memoCopied = copiedCalendarKey === memoKey;
                                      const programName = toCompactProgramName(item.label, notice.title);
                                      const titleText = buildCalendarTitle(notice, item);
                                      const eventLabel = CALENDAR_EVENT_TYPE_LABELS[item.eventType] ?? item.note ?? "주요 일정";
                                      const dateRange =
                                        item.startAt &&
                                        item.endAt &&
                                        item.startAt !== "명시되지 않음" &&
                                        item.endAt !== "명시되지 않음"
                                          ? item.startAt === item.endAt
                                            ? item.startAt
                                            : `${item.startAt} ~ ${item.endAt}`
                                          : item.eventDate !== "명시되지 않음"
                                            ? item.eventDate
                                            : item.when;
                                      const memoText = [
                                        "메모:",
                                        `- 프로그램: ${programName}`,
                                        `- 일정 종류: ${eventLabel}`,
                                        `- 일정: ${dateRange}`,
                                        `- 일정 설명: ${item.note}`,
                                        `- 출처: ${notice.sourceName}`,
                                        `- 링크: ${notice.url}`,
                                      ].join("\n");
                                      const memoPreview = [
                                        `프로그램: ${programName}`,
                                        `일정 종류: ${eventLabel}`,
                                        `일정: ${dateRange}`,
                                        `출처: ${notice.sourceName}`,
                                      ].join("\n");

                                      return (
                                        <div key={`${noticeId}-${item.label}`} className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                                          <p className="text-sm font-semibold text-slate-900">{titleText}</p>
                                          <p className="mt-1 text-xs text-slate-500">{item.note}</p>
                                          <div className="mt-2 flex flex-wrap gap-2">
                                            <button
                                              type="button"
                                              onClick={() => void copyCalendarText(titleKey, titleText)}
                                              className={`inline-flex h-11 items-center rounded-[16px] border px-4 text-sm font-semibold transition ${titleCopied ? "border-slate-900 bg-slate-900 text-white shadow-[0_10px_22px_rgba(15,23,42,0.16)]" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`}
                                            >
                                              {titleCopied ? "일정 복사됨" : "일정 복사"}
                                            </button>
                                            <button
                                              type="button"
                                              title={memoPreview}
                                              aria-label={memoPreview}
                                              onClick={() => void copyCalendarText(memoKey, memoText)}
                                              className={`inline-flex h-11 items-center rounded-[16px] border px-4 text-sm font-semibold transition ${memoCopied ? "border-slate-900 bg-slate-900 text-white shadow-[0_10px_22px_rgba(15,23,42,0.16)]" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`}
                                            >
                                              {memoCopied ? "메모 복사됨" : "메모 복사"}
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : null}

                              {summaryState.data.sourceTitle ? (
                                <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)] text-sm text-slate-600">
                                  <span className="font-semibold text-slate-900">상세 페이지 제목</span>
                                  <span className="ml-2 break-words">{summaryState.data.sourceTitle}</span>
                                </div>
                              ) : null}

                              {summaryState.data.actionLinks.length > 0 ? (
                                <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                                  <p className="text-sm font-semibold text-slate-900">바로가기</p>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {summaryState.data.actionLinks.map((item) => (
                                      <a
                                        key={`${item.url}-${item.label}`}
                                        href={item.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                                        title={item.note}
                                      >
                                        {item.label}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              ) : null}

                              {summaryState.data.attachments.length > 0 ? (
                                <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                                  <p className="text-sm font-semibold text-slate-900">첨부파일</p>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {summaryState.data.attachments.map((item) => (
                                      <a
                                        key={`${item.url}-${item.label}`}
                                        href={item.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                        title={item.note}
                                      >
                                        {item.label}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              ) : null}

                              <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                                <p className="text-sm font-semibold text-slate-900">한눈에 요약</p>
                                <p className="mt-2 text-sm leading-6 text-slate-700">{summaryState.data.summary}</p>
                              </div>

                              {summaryState.data.bullets.length > 0 ? (
                                <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                                  <p className="text-sm font-semibold text-slate-900">핵심 포인트</p>
                                  <div className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
                                    {summaryState.data.bullets.map((item) => (
                                      <p key={item}>- {item}</p>
                                    ))}
                                  </div>
                                </div>
                              ) : null}

                              <div className="grid gap-3 md:grid-cols-2">
                                <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                                  <p className="text-sm font-semibold text-slate-900">대상자</p>
                                  <p className="mt-2 text-sm leading-6 text-slate-700">{summaryState.data.targetAudience}</p>
                                </div>
                                <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                                  <p className="text-sm font-semibold text-slate-900">마감일 / 일정</p>
                                  <p className="mt-2 text-sm leading-6 text-slate-700">{summaryState.data.deadline}</p>
                                </div>
                              </div>

                              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                                  <p className="text-sm font-semibold text-slate-900">해야 할 일</p>
                                  <div className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
                                    {summaryState.data.actionItems.length > 0 ? (
                                      summaryState.data.actionItems.map((item) => <p key={item}>- {item}</p>)
                                    ) : (
                                      <p>별도로 안내된 행동 항목이 없습니다.</p>
                                    )}
                                  </div>
                                </div>
                                <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                                  <p className="text-sm font-semibold text-slate-900">혜택</p>
                                  <div className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
                                    {summaryState.data.benefits.length > 0 ? (
                                      summaryState.data.benefits.map((item) => <p key={item}>- {item}</p>)
                                    ) : (
                                      <p>별도로 확인된 혜택이 없습니다.</p>
                                    )}
                                  </div>
                                </div>
                                <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)] md:col-span-2 xl:col-span-1">
                                  <p className="text-sm font-semibold text-slate-900">준비 서류</p>
                                  <div className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
                                    {summaryState.data.requiredDocuments.length > 0 ? (
                                      summaryState.data.requiredDocuments.map((item) => <p key={item}>- {item}</p>)
                                    ) : (
                                      <p>별도로 확인된 준비 서류가 없습니다.</p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="grid gap-3 md:grid-cols-2">
                                <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                                  <p className="text-sm font-semibold text-slate-900">문의처</p>
                                  <p className="mt-2 text-sm leading-6 text-slate-700">{summaryState.data.contact}</p>
                                </div>
                                <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                                  <p className="text-sm font-semibold text-slate-900">주의사항</p>
                                  <p className="mt-2 text-sm leading-6 text-slate-700">{summaryState.data.caution}</p>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
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
                className="rounded-[18px] border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {"\uC774\uC804"}
              </button>
              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`h-10 min-w-10 rounded-[16px] px-3 text-sm font-semibold ${pageNumber === safeCurrentPage ? "bg-[#191F28] text-white" : "border border-slate-200 bg-white text-slate-700"}`}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={safeCurrentPage === totalPages}
                className="rounded-[18px] border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {"\uB2E4\uC74C"}
              </button>
            </div>
          ) : null}
        </AppPanel>
      </div>
    </AppPageContainer>
  );
}



