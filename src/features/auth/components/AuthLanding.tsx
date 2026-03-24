import { signIn } from "@/auth";

const features = [
  "로그인 전에는 공지를 불러오지 않아 첫 화면이 훨씬 가볍습니다.",
  "학교 본부, 단과대, 학과, 기관, 사업단 공지를 내 관심 기준으로만 모아볼 수 있습니다.",
  "읽음과 북마크, 공지 설정은 로그인한 계정 기준으로 따로 저장됩니다.",
];

export function AuthLanding() {
  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid w-full gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-hidden rounded-[36px] bg-[#191F28] px-7 py-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:px-10 sm:py-10">
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-white/70">
              JNU NOTICE HUB
            </span>
            <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl sm:leading-[1.14]">
              필요한 공지만
              <br />
              빠르게 모아보는
              <br />
              전남대 공지 허브
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/78 sm:text-base">
              복잡한 첫 화면 대신, 로그인 후에만 내 공지를 불러오도록 구성했습니다.
              무겁지 않고 정돈된 흐름으로, 내가 고른 공지만 바로 확인할 수 있습니다.
            </p>
            <div className="mt-8 grid gap-3">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="rounded-2xl border border-white/10 bg-white/6 px-4 py-4 text-sm leading-6 text-white/88"
                >
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-stretch">
            <div className="w-full rounded-[36px] border border-slate-200 bg-white p-7 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-8">
              <div className="rounded-[28px] bg-[#F7F9FB] p-6">
                <p className="text-sm font-semibold text-slate-500">로그인</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                  Google 계정으로 시작하기
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  로그인하면 공지, HOT 알림, 알림 기록, 설정 페이지를 모두 사용할 수 있습니다.
                  같은 브라우저에서는 계정마다 공지 설정이 따로 저장됩니다.
                </p>

                <form
                  action={async () => {
                    "use server";
                    await signIn("google", { redirectTo: "/" });
                  }}
                  className="mt-6"
                >
                  <button
                    type="submit"
                    className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-[#3182F6] px-5 text-base font-bold text-white shadow-[0_12px_28px_rgba(49,130,246,0.28)] transition hover:bg-[#1B64DA]"
                  >
                    Google로 로그인
                  </button>
                </form>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <p className="text-sm font-semibold text-slate-800">로그인 후 가능해요</p>
                  <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
                    <li>학교 본부, 단과대, 학과, 기관, 사업단 공지 선택</li>
                    <li>읽음과 북마크 상태 저장</li>
                    <li>30분마다 쌓이는 알림 기록 확인</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}