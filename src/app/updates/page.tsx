import { auth } from "@/auth";
import { AuthLanding } from "@/features/auth/components/AuthLanding";
import { loadNoticeUpdateHistory } from "@/features/notices/server/noticeUpdateHistory";
import { formatNoticeDate, formatViewsLabel } from "@/features/notices/utils/format";

const TEXT = {
  badge: "\uC54C\uB9BC \uAE30\uB85D",
  title: "10\uBD84\uB9C8\uB2E4 \uC313\uC774\uB294 \uC804\uCCB4 \uC218\uC9D1 \uAE30\uB85D",
  description: "\uD559\uAD50 \uBCF8\uBD80, \uB2E8\uACFC\uB300, \uD559\uACFC, \uAE30\uAD00, \uC0AC\uC5C5\uB2E8 \uACF5\uC9C0\uB97C \uBC31\uC5D4\uB4DC\uAC00 10\uBD84\uB9C8\uB2E4 \uD655\uC778\uD55C \uACB0\uACFC\uB97C \uBAA8\uC544\uB461 \uD398\uC774\uC9C0\uC785\uB2C8\uB2E4. \uC0C8 \uACF5\uC9C0\uAC00 \uC5C6\uC5B4\uB3C4 \uC2E4\uD589 \uAE30\uB85D\uC740 \uB0A8\uACE0, \uC0C8 \uACF5\uC9C0\uAC00 \uBC1C\uC0DD\uD558\uBA74 \uADF8 \uC2DC\uAC04\uACFC \uBAA9\uB85D\uC774 \uD568\uAED8 \uAE30\uB85D\uB429\uB2C8\uB2E4.",
  empty: "\uC544\uC9C1 \uC800\uC7A5\uB41C \uC218\uC9D1 \uAE30\uB85D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uB2E4\uC74C \uC218\uC9D1 \uC8FC\uAE30\uBD80\uD130 \uD45C\uC2DC\uB429\uB2C8\uB2E4.",
  checkedAt: "Checked at",
  newNotices: "\uC0C8 \uACF5\uC9C0",
  totalChecked: "\uC804\uCCB4 \uD655\uC778",
  noNewNotices: "\uC774\uBC88 \uC2E4\uD589\uC5D0\uC11C\uB294 \uC0C8\uB85C \uCD94\uAC00\uB41C \uACF5\uC9C0\uAC00 \uC5C6\uC5C8\uC2B5\uB2C8\uB2E4.",
  author: "\uC791\uC131\uC790",
  date: "\uAC8C\uC2DC\uC77C",
  unsupported: "\uBBF8\uC9C0\uC6D0",
};

function formatCheckedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function getStatusTone(label?: string) {
  if (!label) return "bg-slate-100 text-slate-600";
  if (label === "D-DAY") return "bg-rose-600 text-white";
  if (label === TEXT.unsupported) return "border border-slate-300 bg-slate-50 text-slate-500";
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
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{TEXT.badge}</span>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{TEXT.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{TEXT.description}</p>
        </section>

        {history.length === 0 ? (
          <section className="rounded-[36px] border border-dashed border-slate-300 bg-[#FBFCFD] px-6 py-16 text-center text-sm text-slate-500">{TEXT.empty}</section>
        ) : (
          <div className="grid gap-5">
            {history.map((snapshot) => {
              const newNoticeCount = snapshot.newNoticeCount ?? snapshot.notices.length;
              const totalNoticeCount = snapshot.totalNoticeCount ?? 0;
              return (
                <section key={snapshot.checkedAt} className="rounded-[36px] border border-slate-200 bg-white p-5 shadow-[0_20px_48px_rgba(15,23,42,0.06)] sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{TEXT.checkedAt}</p>
                      <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">{formatCheckedAt(snapshot.checkedAt)}</h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">{`${TEXT.newNotices} ${newNoticeCount}?`}</span>
                      <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">{`${TEXT.totalChecked} ${totalNoticeCount}?`}</span>
                    </div>
                  </div>

                  {snapshot.notices.length === 0 ? (
                    <div className="mt-5 rounded-[28px] border border-dashed border-slate-200 bg-[#FBFCFD] px-5 py-10 text-center text-sm text-slate-500">{TEXT.noNewNotices}</div>
                  ) : (
                    <div className="mt-5 grid gap-4">
                      {snapshot.notices.map((notice) => (
                        <article key={`${snapshot.checkedAt}-${notice.url}`} className="rounded-[28px] border border-slate-200 bg-[#FBFCFD] p-5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{notice.sourceName}</span>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">{notice.category}</span>
                            {notice.statusLabel ? <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(notice.statusLabel)}`}>{notice.statusLabel}</span> : null}
                          </div>
                          <a href={notice.url} target="_blank" rel="noreferrer" className="mt-4 block text-lg font-bold leading-8 tracking-tight text-slate-950 hover:text-[#1B64DA]">{notice.title}</a>
                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                            <span>{`${TEXT.author} ${notice.author}`}</span>
                            <span>{`${TEXT.date} ${formatNoticeDate(notice.date)}`}</span>
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
