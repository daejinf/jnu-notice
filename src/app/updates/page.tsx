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
  if (label === "??") return "border border-slate-300 bg-slate-50 text-slate-500";
  return "border border-emerald-500 bg-white text-emerald-600";
}

export default async function UpdatesPage() {
  const session = await auth();
  if (!session) return <AuthLanding />;

  const history = await loadNoticeUpdateHistory();

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-[0_20px_48px_rgba(15,23,42,0.06)] sm:p-7">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">?? ??</span>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">10??? ?? ?? ?? ?? ??</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            ?? ??, ???, ??, ??, ??? ?? ??? ???? 10??? ??? ??? ????? ??? ??????. ? ??? ??? ?? ??? ??, ? ??? ??? ? ??? ?? ??? ?? ???? ?? ??? ?? ???? ?????.
          </p>
        </section>

        {history.length === 0 ? (
          <section className="rounded-[36px] border border-dashed border-slate-300 bg-[#FBFCFD] px-6 py-16 text-center text-sm text-slate-500">
            ?? ??? ?? ??? ????. ?? ?? ???? ???? ????.
          </section>
        ) : (
          <div className="grid gap-5">
            {history.map((snapshot) => {
              const newNoticeCount = snapshot.newNoticeCount ?? snapshot.notices.length;
              const totalNoticeCount = snapshot.totalNoticeCount ?? 0;

              return (
                <section key={snapshot.checkedAt} className="rounded-[36px] border border-slate-200 bg-white p-5 shadow-[0_20px_48px_rgba(15,23,42,0.06)] sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Checked at</p>
                      <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">{formatCheckedAt(snapshot.checkedAt)}</h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">{`? ?? ${newNoticeCount}?`}</span>
                      <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">{`?? ?? ${totalNoticeCount}?`}</span>
                    </div>
                  </div>

                  {snapshot.notices.length === 0 ? (
                    <div className="mt-5 rounded-[28px] border border-dashed border-slate-200 bg-[#FBFCFD] px-5 py-10 text-center text-sm text-slate-500">
                      ?? ????? ?? ??? ??? ?????.
                    </div>
                  ) : (
                    <div className="mt-5 grid gap-4">
                      {snapshot.notices.map((notice) => (
                        <article key={`${snapshot.checkedAt}-${notice.url}`} className="rounded-[28px] border border-slate-200 bg-[#FBFCFD] p-5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{notice.sourceName}</span>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">{notice.category}</span>
                            {notice.statusLabel ? (
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(notice.statusLabel)}`}>
                                {notice.statusLabel}
                              </span>
                            ) : null}
                          </div>

                          <a href={notice.url} target="_blank" rel="noreferrer" className="mt-4 block text-lg font-bold leading-8 tracking-tight text-slate-950 hover:text-[#1B64DA]">
                            {notice.title}
                          </a>

                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                            <span>{`??? ${notice.author}`}</span>
                            <span>{`??? ${formatNoticeDate(notice.date)}`}</span>
                            <span>{formatViewsLabel(notice)}</span>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
