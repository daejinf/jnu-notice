"use client";

import { useEffect, useMemo, useState } from "react";
import { AppEmptyState, AppHeroSection, AppPageContainer } from "@/components/ui/AppSurfaces";
import { NoticeDetailReader, NoticeRow, NoticeSplitShell, useResolvedNoticeTitles, useScopedNoticeState } from "@/features/notices/components/NoticeExplorer";
import { getNoticeClientId } from "@/features/notices/utils/noticeClientState";
import type { MyAlertsSnapshot, Notice, NoticeUpdateSnapshot } from "@/types/notice";

type HistoryTab = "updates" | "alerts";
type UpdateListItem = { notice: Notice; collectedAt: string };
const PAGE_SIZE = 30;

function formatCheckedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function flattenUpdateHistory(history: NoticeUpdateSnapshot[]) {
  const deduped = new Map<string, UpdateListItem>();
  history.forEach((snapshot) => {
    snapshot.notices.forEach((notice) => {
      const id = getNoticeClientId(notice);
      if (!deduped.has(id)) deduped.set(id, { notice, collectedAt: snapshot.checkedAt });
    });
  });
  return Array.from(deduped.values()).sort((left, right) => new Date(right.collectedAt).getTime() - new Date(left.collectedAt).getTime());
}

export function UnifiedUpdatesHubSection({
  authenticated,
  storageScope,
  history,
  latestCheckedAt,
  myAlerts,
  initialTab = "alerts",
}: {
  authenticated: boolean;
  storageScope: string;
  history: NoticeUpdateSnapshot[];
  latestCheckedAt: string | null;
  myAlerts: MyAlertsSnapshot;
  initialTab?: HistoryTab;
}) {
  const [tab, setTab] = useState<HistoryTab>(initialTab);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const noticeState = useScopedNoticeState({ authenticated, storageScope });
  const updateItems = useMemo(() => flattenUpdateHistory(history), [history]);
  const activeItems = useMemo<UpdateListItem[]>(() => tab === "updates"
    ? updateItems
    : myAlerts.notices.map((notice) => ({ notice, collectedAt: myAlerts.fetchedAt })), [myAlerts.fetchedAt, myAlerts.notices, tab, updateItems]);
  const totalPages = Math.max(1, Math.ceil(activeItems.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleItems = activeItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const visibleNotices = visibleItems.map((item) => item.notice);
  const getDisplayTitle = useResolvedNoticeTitles(visibleNotices);
  const selectedItem = visibleItems.find((item) => getNoticeClientId(item.notice) === selectedId) ?? null;
  const selectedNotice = selectedItem?.notice ?? null;

  useEffect(() => { setPage(1); }, [tab]);
  useEffect(() => {
    if (!visibleItems.length) { setSelectedId(null); return; }
    if (!selectedId || !visibleItems.some((item) => getNoticeClientId(item.notice) === selectedId)) setSelectedId(getNoticeClientId(visibleItems[0].notice));
  }, [selectedId, visibleItems]);

  const tabControl = (
    <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
      <button type="button" onClick={() => setTab("alerts")} className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${tab === "alerts" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}>내 알림 · {myAlerts.totalCount}</button>
      <button type="button" onClick={() => setTab("updates")} className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${tab === "updates" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}>새 공지 · {updateItems.length}</button>
    </div>
  );

  return (
    <main className="min-h-screen bg-transparent">
      <AppPageContainer>
        <AppHeroSection badge="히스토리" title="내 알림과 새 공지" description="관심 소스와 방금 수집된 공지를 같은 방식으로 바로 읽어보세요." />

        {activeItems.length === 0 ? <><div className="rounded-2xl border border-slate-200 bg-white p-2">{tabControl}</div><AppEmptyState>{tab === "alerts" ? (myAlerts.hasPreferences ? "오늘은 관심 소스에 새 공지가 없습니다." : "아직 켜둔 관심 소스가 없습니다.") : "아직 쌓인 새 공지가 없습니다."}</AppEmptyState></> : <NoticeSplitShell
          mobileDetailOpen={mobileDetailOpen}
          list={<>
            <div className="border-b border-slate-200 p-4 sm:p-5">
              {tabControl}
              <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500"><span>{tab === "alerts" ? "관심 소스 기준" : "최근 수집순 · 중복 제거"}</span><span className="text-right">{latestCheckedAt ? `최근 수집 ${formatCheckedAt(latestCheckedAt)}` : "수집 기록 없음"}</span></div>
            </div>
            <div className="max-h-[calc(100vh-360px)] min-h-[520px] overflow-y-auto">
              {visibleItems.map(({ notice, collectedAt }) => {
                const id = getNoticeClientId(notice);
                return <NoticeRow key={id} notice={notice} title={getDisplayTitle(notice)} collectedAt={formatCheckedAt(collectedAt)} selected={id === selectedId} read={noticeState.readSet.has(id)} bookmarked={noticeState.bookmarkSet.has(id)} onSelect={() => { setSelectedId(id); setMobileDetailOpen(true); noticeState.markRead(notice); }} onToggleBookmark={() => noticeState.toggleBookmark(notice)} />;
              })}
            </div>
            {totalPages > 1 ? <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3"><button type="button" disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-30">이전</button><span className="text-xs font-semibold text-slate-500">{safePage} / {totalPages}</span><button type="button" disabled={safePage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-30">다음</button></div> : null}
          </>}
          detail={<NoticeDetailReader notice={selectedNotice} title={selectedNotice ? getDisplayTitle(selectedNotice) : undefined} bookmarked={selectedNotice ? noticeState.bookmarkSet.has(getNoticeClientId(selectedNotice)) : false} onToggleBookmark={selectedNotice ? () => noticeState.toggleBookmark(selectedNotice) : undefined} onClose={() => setMobileDetailOpen(false)} />}
        />}
      </AppPageContainer>
    </main>
  );
}
