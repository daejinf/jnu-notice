import { signIn } from "@/auth";
import { AppPageContainer, AppPanel } from "@/components/ui/AppSurfaces";

const features = [
  "로그인 후에만 필요한 공지를 불러와서 크게 버벅이지 않고 바로 시작합니다.",
  "본부, 단과대, 학과, 기관, 사업단 공지를 소스 기준으로 하나의 흐름에서 보여줍니다.",
  "읽음, 저장, 소스관리 설정이 계정 기준으로 그대로 유지됩니다.",
];

const highlightCards = [
  { label: "한눈에 정리", value: "필요한 공지", tone: "default" },
  { label: "개인 기준", value: "내 피드", tone: "blue" },
  { label: "수집 주기", value: "30분 단위", tone: "default" },
] as const;

export function AuthLanding() {
  return (
    <main className="min-h-screen bg-transparent">
      <AppPageContainer>
        <div className="flex min-h-[calc(100vh-104px)] items-center">
          <section className="grid w-full gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <AppPanel className="overflow-hidden px-7 py-8 sm:rounded-[36px] sm:px-10 sm:py-10">
              <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-blue-700">
                JNU NOTICE HUB
              </span>

              <h1 className="mt-5 text-3xl font-black tracking-tight text-[#191F28] sm:text-5xl sm:leading-[1.14]">
                필요한 공지만
                <br />
                빠르게 모아보는
                <br />
                전남대 공지 허브
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                공지 위치가 제각각이어도 찾는 시간은 줄이고, 보는 흐름은 가볍게 맞추었습니다.
                {" "}
                로그인하면 내가 켜둔 소스를 기준으로 피드, 랭킹, 히스토리가 자연스럽게 이어집니다.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {highlightCards.map((card) => (
                  <div
                    key={card.label}
                    className={`rounded-[28px] p-5 ${
                      card.tone === "blue" ? "bg-blue-50" : "bg-[#F8FAFC]"
                    }`}
                  >
                    <p
                      className={`text-xs font-semibold ${
                        card.tone === "blue" ? "text-blue-700" : "text-slate-500"
                      }`}
                    >
                      {card.label}
                    </p>
                    <p
                      className={`mt-2 text-2xl font-black tracking-tight ${
                        card.tone === "blue" ? "text-[#1B64DA]" : "text-[#191F28]"
                      }`}
                    >
                      {card.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-3">
                {features.map((feature) => (
                  <div
                    key={feature}
                    className="rounded-[24px] border border-slate-200 bg-[#FBFCFD] px-4 py-4 text-sm leading-6 text-slate-700"
                  >
                    {feature}
                  </div>
                ))}
              </div>
            </AppPanel>

            <div className="flex items-stretch">
              <AppPanel className="w-full p-7 sm:rounded-[36px] sm:p-8">
                <div className="rounded-[28px] bg-[#F7F9FB] p-6">
                  <p className="text-sm font-semibold text-slate-500">로그인</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                    Google 계정으로 시작하기
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    피드, 랭킹, 히스토리, 소스관리를 같은 계정 기준으로 연결해 사용합니다.
                    {" "}
                    브라우저를 다시 열어도 켜둔 소스 구성과 본 흐름이 그대로 이어집니다.
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
                      className="inline-flex h-14 w-full items-center justify-center rounded-[20px] bg-[#3182F6] px-5 text-base font-bold text-white shadow-[0_14px_30px_rgba(49,130,246,0.24)] transition hover:bg-[#1B64DA]"
                    >
                      Google로 로그인
                    </button>
                  </form>

                  <div className="mt-6 rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                    <p className="text-sm font-semibold text-slate-800">로그인 후 가능해요</p>
                    <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
                      <li>학교 본부, 단과대, 학과, 기관, 사업단 공지 선택</li>
                      <li>읽음과 저장 상태 유지</li>
                      <li>30분 단위 수집 기록 확인</li>
                    </ul>
                  </div>
                </div>
              </AppPanel>
            </div>
          </section>
        </div>
      </AppPageContainer>
    </main>
  );
}
