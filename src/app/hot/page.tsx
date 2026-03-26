import { auth } from "@/auth";
import { AuthLanding } from "@/features/auth/components/AuthLanding";
import { fetchRecentHotNotices } from "@/features/notices/server/fetchTodayHotNotices";
import { formatNoticeDate, formatViewsLabel } from "@/features/notices/utils/format";
import type { Notice } from "@/types/notice";

const PROJECT_CENTER_NAMES = [
  "그린바이오혁신융합대학사업단",
  "이차전지특성화대학사업단",
  "인공지능혁신융합대학사업단",
  "인공지능혁신융합대학사업단 교육신청",
  "소프트웨어중심사업단",
  "반도체특성화대학사업단",
  "차세대통신혁신융합대학사업단",
];

function getSourceBadgeClass(notice: Notice) {
  if (notice.sourceType === "school") return "bg-sky-100 text-sky-700";
  if (notice.sourceType === "college") return "bg-emerald-100 text-emerald-700";
  if (notice.sourceType === "department") return "bg-violet-100 text-violet-700";
  return PROJECT_CENTER_NAMES.includes(notice.sourceName)
    ? "bg-orange-100 text-orange-700"
    : "bg-amber-100 text-amber-700";
}

export default async function HotPage() {
  const session = await auth();
  if (!session) return <AuthLanding />;

  const hotNotices = await fetchRecentHotNotices();

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-[0_20px_48px_rgba(15,23,42,0.06)] sm:p-7">
          <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-700">
            {"HOT 알림"}
          </span>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {"최근 7일 공지 조회수 랭킹"}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            {
              "새로 올라온 공지만 따로 추리는 공간이 아니라, 현재 저장된 공지 가운데 최근 7일 내 게시물을 조회수 기준으로 정렬해 보여주는 페이지입니다. 이미 올라와 있던 공지도 최근 7일 안이면 계속 HOT 알림에 포함됩니다."
            }
          </p>
        </section>

        {hotNotices.length === 0 ? (
          <section className="rounded-[32px] border border-dashed border-slate-300 bg-white/90 px-6 py-16 text-center text-sm text-slate-500 shadow-[0_16px_40px_rgba(15,23,42,0.04)]">
            {"최근 7일 기준으로 집계된 HOT 공지가 아직 없습니다."}
          </section>
        ) : (
          <section className="rounded-[36px] border border-slate-200 bg-white p-5 shadow-[0_20px_48px_rgba(15,23,42,0.06)] sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold tracking-tight text-slate-950">
                {"최근 7일 조회수 TOP 공지"}
              </h2>
              <span className="rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">
                {`총 ${hotNotices.length}건`}
              </span>
            </div>

            <div className="mt-5 grid gap-4">
              {hotNotices.map((notice, index) => (
                <article
                  key={`${notice.sourceType}-${notice.sourceName}-${notice.id}-${notice.date}`}
                  className="rounded-[28px] border border-slate-200 bg-[#FBFCFD] p-5 transition hover:border-slate-300 hover:bg-white hover:shadow-[0_12px_28px_rgba(15,23,42,0.06)]"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
                      #{index + 1}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getSourceBadgeClass(notice)}`}
                    >
                      {notice.sourceName}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {notice.category}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {formatViewsLabel(notice)}
                    </span>
                  </div>

                  <a
                    href={notice.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 block text-lg font-bold leading-8 tracking-tight text-slate-950 hover:text-[#1B64DA]"
                  >
                    {notice.title}
                  </a>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                    <span>{`작성자 ${notice.author}`}</span>
                    <span>{`작성일 ${formatNoticeDate(notice.date)}`}</span>
                    <span>{formatViewsLabel(notice)}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
