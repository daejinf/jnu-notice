import { auth } from "@/auth";
import { AuthLanding } from "@/features/auth/components/AuthLanding";
import { loadNoticeUpdateHistory } from "@/features/notices/server/noticeUpdateHistory";
import { formatNoticeDate, formatViewsLabel } from "@/features/notices/utils/format";

function formatCheckedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusTone(label?: string) {
  if (!label) return "bg-slate-100 text-slate-600";
  if (label === "D-DAY") return "bg-rose-600 text-white";
  if (label === "마감") return "border border-slate-300 bg-slate-50 text-slate-500";
  return "border border-emerald-500 bg-white text-emerald-600";
}

export default async function UpdatesPage() {
  const session = await auth();
  if (!session) return <AuthLanding />;

  const history = await loadNoticeUpdateHistory();

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[32px] border border-white/70 bg-white/92 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur sm:p-7">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">알림 기록</span>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">30분마다 쌓이는 새 공지 기록</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            매시 00분과 30분마다 수집한 새 공지를 시간순으로 모아둔 페이지입니다.
            어떤 시점에 어떤 공지가 새로 올라왔는지 한눈에 확인할 수 있습니다.
          </p>
        </section>

        {history.length === 0 ? (
          <section className="rounded-[32px] border border-dashed border-slate-300 bg-white/90 px-6 py-16 text-center text-sm text-slate-500 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
            아직 저장된 새 공지 기록이 없습니다. 다음 수집 주기부터 차곡차곡 쌓입니다.
          </section>
        ) : (
          <div className="grid gap-5">
            {history.map((snapshot) => (
              <section key={snapshot.checkedAt} className="rounded-[32px] border border-slate-200 bg-white/92 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] backdrop-blur sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Checked at</p>
                    <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">{formatCheckedAt(snapshot.checkedAt)}</h2>
                  </div>
                  <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">새 공지 {snapshot.notices.length}건</span>
                </div>

                <div className="mt-5 grid gap-4">
                  {snapshot.notices.map((notice) => (
                    <article key={`${snapshot.checkedAt}-${notice.url}`} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{notice.sourceName}</span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">{notice.category}</span>
                        {notice.statusLabel ? <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(notice.statusLabel)}`}>{notice.statusLabel}</span> : null}
                      </div>

                      <a href={notice.url} target="_blank" rel="noreferrer" className="mt-4 block text-lg font-bold leading-8 tracking-tight text-slate-950 hover:text-[#1B64DA]">
                        {notice.title}
                      </a>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                        <span>작성자 {notice.author}</span>
                        <span>작성일 {formatNoticeDate(notice.date)}</span>
                        <span>{formatViewsLabel(notice)}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}