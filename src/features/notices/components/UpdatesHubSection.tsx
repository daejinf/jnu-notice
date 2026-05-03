"use client";

import { useState } from "react";
import {
  AppEmptyState,
  AppHeroSection,
  AppInlineNote,
  AppPageContainer,
  AppPanel,
  AppSelectorCard,
  AppSelectorSection,
} from "@/components/ui/AppSurfaces";
import { MyNoticeAlertsSection } from "@/features/notices/components/MyNoticeAlertsSection";
import { formatNoticeDate, formatViewsLabel } from "@/features/notices/utils/format";
import type { MyAlertsSnapshot, NoticeUpdateSnapshot } from "@/types/notice";

type HistoryTab = "updates" | "alerts";

const TEXT = {
  badge: "히스토리",
  title: "내 알림과 새 공지",
  description: "놓치기 아쉬운 것부터 바로 봅니다.",
  updatedUntil: "최근 반영",
  latestCheck: "최근 수집",
  noNewNoticesThisRun: "이번 회차에는 새 공지가 없었습니다.",
  alertsLabel: "내 알림",
  alertsTitle: "내가 켜둔 공지",
  alertsDescription: "오늘 올라온 것만 바로 모아봅니다.",
  alertsEmptyCta: "지금 보기",
  updatesLabel: "새 공지",
  updatesTitle: "방금 올라온 공지",
  updatesDescription: "실제로 새로 올라온 것만 남깁니다.",
  checkedAt: "수집 시각",
  newNotices: "새 공지",
  totalChecked: "전체 확인",
  empty: "아직 쌓인 새 공지가 없습니다.",
  author: "작성자",
  date: "게시일",
  unsupported: "미지원",
};

function formatCheckedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(date);
}

function getStatusTone(label?: string) {
  if (!label) return "bg-slate-100 text-slate-600";
  if (label === "D-DAY") return "bg-rose-600 text-white";
  if (label === TEXT.unsupported) return "border border-slate-300 bg-slate-50 text-slate-500";
  return "border border-emerald-500 bg-white text-emerald-600";
}

function UpdatesHistoryList({
  history,
  latestCheckedAt,
}: {
  history: NoticeUpdateSnapshot[];
  latestCheckedAt: string | null;
}) {
  const latestHistoryCheckedAt = history[0]?.checkedAt ?? null;
  const showLatestCheckNote = Boolean(latestCheckedAt && latestCheckedAt !== latestHistoryCheckedAt);

  if (history.length === 0) {
    return (
      <div className="grid min-w-0 gap-4">
        {showLatestCheckNote ? (
          <AppInlineNote
            title={`${TEXT.latestCheck} ${formatCheckedAt(latestCheckedAt ?? "")}`}
            description={TEXT.noNewNoticesThisRun}
          />
        ) : null}
        <AppEmptyState>{TEXT.empty}</AppEmptyState>
      </div>
    );
  }

  return (
    <div className="grid min-w-0 gap-5">
      {showLatestCheckNote ? (
        <AppInlineNote
          title={`${TEXT.latestCheck} ${formatCheckedAt(latestCheckedAt ?? "")}`}
          description={TEXT.noNewNoticesThisRun}
        />
      ) : null}

      {history.map((snapshot) => {
        const newNoticeCount = snapshot.newNoticeCount ?? snapshot.notices.length;
        const totalNoticeCount = snapshot.totalNoticeCount ?? 0;

        return (
          <AppPanel key={snapshot.checkedAt} className="p-4 sm:rounded-[36px] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{TEXT.checkedAt}</p>
                <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                  {formatCheckedAt(snapshot.checkedAt)}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                  {`${TEXT.newNotices} ${newNoticeCount}건`}
                </span>
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                  {`${TEXT.totalChecked} ${totalNoticeCount}건`}
                </span>
              </div>
            </div>

            <div className="mt-5 grid min-w-0 gap-4">
              {snapshot.notices.map((notice) => (
                <article key={`${snapshot.checkedAt}-${notice.url}`} className="min-w-0 rounded-[28px] border border-slate-200 bg-[#FBFCFD] p-4 sm:p-5">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="max-w-full rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 [overflow-wrap:anywhere]">
                      {notice.sourceName}
                    </span>
                    <span className="max-w-full rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 [overflow-wrap:anywhere]">
                      {notice.category}
                    </span>
                    {notice.statusLabel ? (
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(notice.statusLabel)}`}>
                        {notice.statusLabel}
                      </span>
                    ) : null}
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
                    <span className="max-w-full [overflow-wrap:anywhere]">{`${TEXT.author} ${notice.author}`}</span>
                    <span className="max-w-full [overflow-wrap:anywhere]">{`${TEXT.date} ${formatNoticeDate(notice.date)}`}</span>
                    <span>{formatViewsLabel(notice)}</span>
                  </div>
                </article>
              ))}
            </div>
          </AppPanel>
        );
      })}
    </div>
  );
}

export function UpdatesHubSection({
  history,
  latestCheckedAt,
  myAlerts,
  initialTab = "alerts",
}: {
  history: NoticeUpdateSnapshot[];
  latestCheckedAt: string | null;
  myAlerts: MyAlertsSnapshot;
  initialTab?: HistoryTab;
}) {
  const [tab, setTab] = useState<HistoryTab>(initialTab);

  return (
    <main className="min-h-screen bg-transparent">
      <AppPageContainer>
        <AppHeroSection
          badge={TEXT.badge}
          title={TEXT.title}
          description={TEXT.description}
        />

        <AppSelectorSection>
          <AppSelectorCard
            active={tab === "alerts"}
            label={TEXT.alertsLabel}
            title={TEXT.alertsTitle}
            description={TEXT.alertsDescription}
            meta={myAlerts.fetchedAt ? `${TEXT.updatedUntil} ${formatCheckedAt(myAlerts.fetchedAt)}` : null}
            badge={myAlerts.hasPreferences ? `${myAlerts.totalCount}건` : TEXT.alertsEmptyCta}
            onClick={() => setTab("alerts")}
          />
          <AppSelectorCard
            active={tab === "updates"}
            label={TEXT.updatesLabel}
            title={TEXT.updatesTitle}
            description={TEXT.updatesDescription}
            meta={latestCheckedAt ? `${TEXT.updatedUntil} ${formatCheckedAt(latestCheckedAt)}` : null}
            badge={`${history.length}회`}
            onClick={() => setTab("updates")}
          />
        </AppSelectorSection>

        {tab === "updates" ? (
          <UpdatesHistoryList history={history} latestCheckedAt={latestCheckedAt} />
        ) : (
          <MyNoticeAlertsSection embedded initialData={myAlerts} />
        )}
      </AppPageContainer>
    </main>
  );
}
