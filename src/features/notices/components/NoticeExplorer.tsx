"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ExternalLink,
  FileText,
  LoaderCircle,
  Paperclip,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import {
  BOOKMARK_NOTICE_STORAGE_KEY,
  READ_NOTICE_STORAGE_KEY,
  buildScopedStorageKey,
} from "@/features/notices/constants/storageKeys";
import { formatNoticeDate, formatViewsLabel } from "@/features/notices/utils/format";
import { mergeGuestStateIntoAccount, readStoredArray } from "@/features/notices/utils/guestState";
import { getNoticeClientId } from "@/features/notices/utils/noticeClientState";
import { isLikelyTruncatedTitle, selectBestNoticeTitle } from "@/features/notices/utils/noticeTitle";
import type { Notice, NoticeState } from "@/types/notice";

export type NoticeViewer = { authenticated: boolean; storageScope: string };

type ResourceLink = { label: string; url: string; note: string };

type NoticeContentDocument = {
  sourceTitle: string;
  html: string;
  attachments: ResourceLink[];
  actionLinks: ResourceLink[];
  fetchedAt: string;
  fromCache: boolean;
};

type NoticeSummary = {
  summary: string;
  targetAudience: string;
  deadline: string;
  actionItems: string[];
  attachments: ResourceLink[];
  attachmentAnalysisState: "pending" | "complete";
};

type AsyncEntry<T> = { status: "loading" | "success" | "error"; data?: T; error?: string };
export type ResolvedNoticeTitle = {
  text: string;
  state: "ready" | "loading" | "fallback";
  originalTruncated: boolean;
};

export function noticeSourceTone(notice: Notice) {
  if (notice.sourceType === "school") return "bg-blue-50 text-blue-700";
  if (notice.sourceType === "college") return "bg-emerald-50 text-emerald-700";
  if (notice.sourceType === "department") return "bg-violet-50 text-violet-700";
  return "bg-amber-50 text-amber-700";
}

export function useScopedNoticeState(viewer: NoticeViewer) {
  const readKey = buildScopedStorageKey(READ_NOTICE_STORAGE_KEY, viewer.storageScope);
  const bookmarkKey = buildScopedStorageKey(BOOKMARK_NOTICE_STORAGE_KEY, viewer.storageScope);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [bookmarkIds, setBookmarkIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (viewer.authenticated) mergeGuestStateIntoAccount(viewer.storageScope);
    setReadIds(readStoredArray(readKey));
    setBookmarkIds(readStoredArray(bookmarkKey));
    setReady(true);
  }, [bookmarkKey, readKey, viewer.authenticated, viewer.storageScope]);

  useEffect(() => {
    if (!ready || !viewer.authenticated) return;
    const controller = new AbortController();
    void fetch("/api/notice-state", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return;
        const { state } = (await response.json()) as { state: NoticeState | null };
        if (!state) return;
        setReadIds((current) => Array.from(new Set([...current, ...state.readNoticeIds])));
        setBookmarkIds((current) => Array.from(new Set([...current, ...state.bookmarkNoticeIds])));
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [ready, viewer.authenticated]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(readKey, JSON.stringify(readIds));
    window.localStorage.setItem(bookmarkKey, JSON.stringify(bookmarkIds));
  }, [bookmarkIds, bookmarkKey, readIds, readKey, ready]);

  useEffect(() => {
    if (!ready || !viewer.authenticated) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch("/api/notice-state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readNoticeIds: readIds, bookmarkNoticeIds: bookmarkIds }),
        signal: controller.signal,
      });
    }, 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [bookmarkIds, readIds, ready, viewer.authenticated]);

  const readSet = useMemo(() => new Set(readIds), [readIds]);
  const bookmarkSet = useMemo(() => new Set(bookmarkIds), [bookmarkIds]);

  return {
    readSet,
    bookmarkSet,
    markRead(notice: Notice) {
      const id = getNoticeClientId(notice);
      setReadIds((current) => current.includes(id) ? current : [...current, id]);
    },
    toggleBookmark(notice: Notice) {
      const id = getNoticeClientId(notice);
      setBookmarkIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    },
  };
}

export function useResolvedNoticeTitles(notices: Notice[]) {
  const [resolvedTitles, setResolvedTitles] = useState<Record<string, string | null>>({});
  const requestedUrls = useRef(new Set<string>());
  const urlKey = notices.slice(0, 30).map((notice) => notice.url).join("|");

  useEffect(() => {
    const urls = notices.map((notice) => notice.url).filter((url) => !requestedUrls.current.has(url)).slice(0, 30);
    if (!urls.length) return;
    urls.forEach((url) => requestedUrls.current.add(url));
    void fetch("/api/notice-metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls }),
    }).then(async (response) => {
      if (!response.ok) throw new Error("제목을 불러오지 못했습니다.");
      const data = (await response.json()) as { items: Record<string, { title: string | null }> };
      setResolvedTitles((current) => ({
        ...current,
        ...Object.fromEntries(Object.entries(data.items).map(([url, item]) => [url, item.title])),
      }));
    }).catch(() => {
      setResolvedTitles((current) => ({ ...current, ...Object.fromEntries(urls.map((url) => [url, null])) }));
    });
  }, [urlKey]);

  return (notice: Notice): ResolvedNoticeTitle => {
    const originalTruncated = isLikelyTruncatedTitle(notice.title);
    const hasResult = Object.prototype.hasOwnProperty.call(resolvedTitles, notice.url);
    const resolved = resolvedTitles[notice.url];
    if (!hasResult && originalTruncated) return { text: notice.title, state: "loading", originalTruncated };
    const text = selectBestNoticeTitle(notice.title, [resolved], notice.sourceName);
    return { text, state: originalTruncated && !resolved ? "fallback" : "ready", originalTruncated };
  };
}

export function NoticeRow({
  notice,
  title,
  selected,
  read,
  bookmarked,
  rank,
  collectedAt,
  onSelect,
  onToggleBookmark,
}: {
  notice: Notice;
  title: ResolvedNoticeTitle;
  selected: boolean;
  read: boolean;
  bookmarked: boolean;
  rank?: number;
  collectedAt?: string;
  onSelect: () => void;
  onToggleBookmark: () => void;
}) {
  const metadata = [
    notice.sourceName,
    notice.author && !isLikelyTruncatedTitle(notice.author) ? notice.author : null,
    formatViewsLabel(notice),
  ].filter(Boolean).join(" · ");

  return (
    <article className={`grid grid-cols-[minmax(0,1fr)_44px] border-b border-slate-100 transition ${selected ? "bg-blue-50/70" : "hover:bg-slate-50"}`}>
      <button type="button" onClick={onSelect} className="min-w-0 px-4 py-4 text-left focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          {rank ? <span className="min-w-7 text-sm font-black text-rose-600">#{rank}</span> : null}
          <span className={`rounded-lg px-2 py-1 text-[11px] font-bold ${noticeSourceTone(notice)}`}>{notice.category}</span>
          {notice.statusLabel ? <span className="rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700">{notice.statusLabel}</span> : null}
          {!read ? <span className="h-2 w-2 rounded-full bg-blue-500" aria-label="안 읽음" /> : null}
          <time className="ml-auto shrink-0 text-xs text-slate-400">{formatNoticeDate(notice.date)}</time>
        </div>
        {title.state === "loading" ? (
          <div className="mt-3 space-y-2" aria-label="전체 제목을 불러오는 중">
            <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
          </div>
        ) : (
          <h2 className={`mt-2 [overflow-wrap:anywhere] text-[15px] font-bold leading-6 ${read ? "text-slate-600" : "text-slate-950"}`}>{title.text}</h2>
        )}
        {title.state === "fallback" ? <p className="mt-1 text-[11px] font-medium text-amber-700">원문에서 전체 제목을 확인할 수 있어요.</p> : null}
        <p className="mt-1.5 truncate text-xs text-slate-500">
          {metadata}
          {collectedAt ? ` · 수집 ${collectedAt}` : ""}
        </p>
      </button>
      <button type="button" aria-label={bookmarked ? "공지 저장 해제" : "공지 저장"} aria-pressed={bookmarked} onClick={onToggleBookmark} className={`m-0 flex min-h-11 min-w-11 self-center items-center justify-center rounded-xl transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${bookmarked ? "text-blue-600" : "text-slate-400"}`}>
        <Bookmark className="h-5 w-5" fill={bookmarked ? "currentColor" : "none"} />
      </button>
    </article>
  );
}

export function NoticeDetailReader({
  notice,
  title,
  bookmarked,
  onToggleBookmark,
  onClose,
}: {
  notice: Notice | null;
  title?: ResolvedNoticeTitle;
  bookmarked?: boolean;
  onToggleBookmark?: () => void;
  onClose?: () => void;
}) {
  const [contentById, setContentById] = useState<Record<string, AsyncEntry<NoticeContentDocument>>>({});
  const [summaryById, setSummaryById] = useState<Record<string, AsyncEntry<NoticeSummary>>>({});
  const [summaryOpen, setSummaryOpen] = useState(false);
  const requestedContentIds = useRef(new Set<string>());
  const noticeId = notice ? getNoticeClientId(notice) : null;
  const contentEntry = noticeId ? contentById[noticeId] : undefined;
  const summaryEntry = noticeId ? summaryById[noticeId] : undefined;
  const displayTitle = notice
    ? selectBestNoticeTitle(notice.title, [title?.text, contentEntry?.data?.sourceTitle], notice.sourceName)
    : "";
  const titleStillLoading = !!notice && isLikelyTruncatedTitle(notice.title) && title?.state === "loading" && contentEntry?.status !== "success";
  const titleFallback = !!notice && isLikelyTruncatedTitle(displayTitle) && title?.state === "fallback" && contentEntry?.status === "error";

  useEffect(() => {
    setSummaryOpen(false);
    if (!notice || !noticeId || requestedContentIds.current.has(noticeId)) return;
    requestedContentIds.current.add(noticeId);
    setContentById((current) => ({ ...current, [noticeId]: { status: "loading" } }));
    void fetch("/api/notice-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: notice.url }),
    }).then(async (response) => {
      const data = (await response.json()) as { document: NoticeContentDocument | null; error?: string };
      if (!response.ok || !data.document) throw new Error(data.error ?? "공지 원문을 불러오지 못했습니다.");
      setContentById((current) => ({ ...current, [noticeId]: { status: "success", data: data.document! } }));
    }).catch((caught) => {
      setContentById((current) => ({ ...current, [noticeId]: { status: "error", error: caught instanceof Error ? caught.message : "공지 원문을 불러오지 못했습니다." } }));
    });
  }, [notice, noticeId]);

  async function loadSummary(includeAttachmentAnalysis = false) {
    if (!notice || !noticeId) return;
    setSummaryById((current) => ({ ...current, [noticeId]: { ...current[noticeId], status: "loading" } }));
    try {
      const response = await fetch("/api/notice-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: notice.url, title: displayTitle || notice.title, sourceName: notice.sourceName, includeAttachmentAnalysis }),
      });
      const data = (await response.json()) as { summary: NoticeSummary | null; error?: string };
      if (!response.ok || !data.summary) throw new Error(data.error ?? "AI 요약을 불러오지 못했습니다.");
      setSummaryById((current) => ({ ...current, [noticeId]: { status: "success", data: data.summary! } }));
    } catch (caught) {
      setSummaryById((current) => ({ ...current, [noticeId]: { status: "error", error: caught instanceof Error ? caught.message : "AI 요약에 실패했습니다." } }));
    }
  }

  function toggleSummary() {
    const next = !summaryOpen;
    setSummaryOpen(next);
    if (next && !summaryEntry) void loadSummary();
  }

  if (!notice) {
    return <div className="flex min-h-[620px] items-center justify-center p-8 text-center text-sm leading-6 text-slate-500"><div><Building2 className="mx-auto mb-3 h-8 w-8 text-slate-300" />왼쪽 목록에서 공지를 선택하면<br />원문을 이 화면에서 바로 읽을 수 있어요.</div></div>;
  }

  return (
    <div className="h-full max-h-screen min-h-[620px] overflow-y-auto p-5 pb-24 sm:p-7 xl:max-h-[calc(100vh-220px)] xl:pb-7">
      {onClose ? <button type="button" onClick={onClose} className="mb-4 ml-auto flex rounded-xl border border-slate-200 bg-white p-2 text-slate-600 xl:hidden" aria-label="상세 닫기"><X className="h-5 w-5" /></button> : null}
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${noticeSourceTone(notice)}`}>{notice.category}</span>
          {onToggleBookmark ? <button type="button" onClick={onToggleBookmark} className={`flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${bookmarked ? "border-blue-200 bg-blue-50 text-blue-600" : "border-slate-200 bg-white text-slate-500"}`} aria-label={bookmarked ? "공지 저장 해제" : "공지 저장"} aria-pressed={bookmarked}><Bookmark className="h-5 w-5" fill={bookmarked ? "currentColor" : "none"} /></button> : null}
        </div>
        {titleStillLoading ? <div className="mt-5 space-y-3" aria-label="전체 제목을 불러오는 중"><div className="h-7 w-full animate-pulse rounded bg-slate-200" /><div className="h-7 w-4/5 animate-pulse rounded bg-slate-200" /></div> : <h2 className="mt-4 [overflow-wrap:anywhere] text-2xl font-black leading-tight tracking-tight text-slate-950 sm:text-3xl">{displayTitle}</h2>}
        {titleFallback ? <p className="mt-2 text-xs font-semibold text-amber-700">원문 페이지에서 전체 제목을 확인해 주세요.</p> : null}
        <p className="mt-3 text-sm text-slate-500">{notice.sourceName} · {formatNoticeDate(notice.date)} · {formatViewsLabel(notice)}</p>
      </div>

      <section className="mt-7 overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/60">
        <button type="button" onClick={toggleSummary} aria-expanded={summaryOpen} className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-bold text-blue-800">
          <Sparkles className="h-5 w-5" />AI 핵심 요약
          <span className="ml-auto text-xs font-semibold text-blue-600">{summaryOpen ? "접기" : "펼쳐보기"}</span>
          <ChevronDown className={`h-4 w-4 transition ${summaryOpen ? "rotate-180" : ""}`} />
        </button>
        {summaryOpen ? <div className="border-t border-blue-100 bg-white p-5">
          {summaryEntry?.status === "loading" ? <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500"><LoaderCircle className="h-5 w-5 animate-spin" />공지 내용을 요약하고 있어요</div> : null}
          {summaryEntry?.status === "error" ? <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{summaryEntry.error}</div> : null}
          {summaryEntry?.status === "success" && summaryEntry.data ? <div className="space-y-4">
            <p className="text-sm leading-7 text-slate-800">{summaryEntry.data.summary}</p>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 px-4">
              <div className="grid gap-2 py-3 sm:grid-cols-[105px_1fr]"><span className="flex items-center gap-2 text-sm font-semibold text-slate-500"><UserRound className="h-4 w-4" />대상</span><span className="text-sm leading-6 text-slate-800">{summaryEntry.data.targetAudience}</span></div>
              <div className="grid gap-2 py-3 sm:grid-cols-[105px_1fr]"><span className="flex items-center gap-2 text-sm font-semibold text-slate-500"><CalendarDays className="h-4 w-4" />마감</span><span className="text-sm leading-6 text-slate-800">{summaryEntry.data.deadline}</span></div>
              <div className="grid gap-2 py-3 sm:grid-cols-[105px_1fr]"><span className="flex items-center gap-2 text-sm font-semibold text-slate-500"><Check className="h-4 w-4" />해야 할 일</span><div className="space-y-1 text-sm leading-6 text-slate-800">{summaryEntry.data.actionItems.length ? summaryEntry.data.actionItems.map((item) => <p key={item}>• {item}</p>) : <p>별도로 안내된 행동 항목이 없습니다.</p>}</div></div>
            </div>
            {summaryEntry.data.attachmentAnalysisState === "pending" ? <button type="button" onClick={() => void loadSummary(true)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">첨부파일까지 자세히 분석</button> : null}
          </div> : null}
        </div> : null}
      </section>

      <div className="mt-7 flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <h3 className="text-sm font-bold text-slate-950">공지 원문</h3>
        <a href={notice.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800">원문 사이트에서 보기 <ExternalLink className="h-3.5 w-3.5" /></a>
      </div>

      {contentEntry?.status === "loading" || !contentEntry ? <div className="space-y-3 py-6" aria-label="원문을 불러오는 중"><div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" /><div className="h-4 w-full animate-pulse rounded bg-slate-100" /><div className="h-4 w-11/12 animate-pulse rounded bg-slate-100" /><div className="mt-6 h-36 animate-pulse rounded-xl bg-slate-100" /></div> : null}
      {contentEntry?.status === "error" ? <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm leading-6 text-rose-700"><p>{contentEntry.error}</p><a href={notice.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 font-bold">원문 사이트에서 확인 <ExternalLink className="h-4 w-4" /></a></div> : null}
      {contentEntry?.status === "success" && contentEntry.data ? <>
        <article className="notice-reader-content py-6" dangerouslySetInnerHTML={{ __html: contentEntry.data.html }} />
        {contentEntry.data.attachments.length ? <section className="border-t border-slate-200 pt-5"><h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Paperclip className="h-4 w-4" />첨부파일</h3><div className="mt-3 grid gap-2">{contentEntry.data.attachments.map((item) => <a key={item.url} href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300"><FileText className="h-4 w-4 text-blue-600" /><span className="min-w-0 flex-1 truncate">{item.label}</span><span className="text-xs text-slate-400">{item.note}</span><ExternalLink className="h-4 w-4" /></a>)}</div></section> : null}
      </> : null}
    </div>
  );
}

export function NoticeSplitShell({ list, detail, mobileDetailOpen = false }: { list: React.ReactNode; detail: React.ReactNode; mobileDetailOpen?: boolean }) {
  return (
    <section className="grid min-h-[calc(100vh-220px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)] xl:grid-cols-[minmax(420px,0.9fr)_minmax(520px,1.1fr)]">
      <div className="min-w-0 border-b border-slate-200 xl:border-b-0 xl:border-r">{list}</div>
      <div className={`min-w-0 bg-[#FCFCFD] ${mobileDetailOpen ? "fixed inset-0 z-50 xl:static xl:z-auto" : "hidden xl:block"}`}>{detail}</div>
    </section>
  );
}
