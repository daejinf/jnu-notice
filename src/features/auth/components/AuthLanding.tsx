import { signIn } from "@/auth";

const features = [
  "\uB85C\uADF8\uC778 \uC774\uD6C4\uC5D0\uB9CC \uACF5\uC9C0\uB97C \uBD88\uB7EC\uC640\uC11C \uCCAB \uD654\uBA74\uBD80\uD130 \uD6E8\uC52C \uAC00\uBCBC\uC6CC\uC9D1\uB2C8\uB2E4.",
  "\uBCF8\uBD80, \uB2E8\uACFC\uB300, \uD559\uACFC, \uAE30\uAD00, \uC0AC\uC5C5\uB2E8 \uACF5\uC9C0\uB97C \uD55C \uD654\uBA74 \uD750\uB984\uC73C\uB85C \uBB36\uC5C8\uC2B5\uB2C8\uB2E4.",
  "\uC77D\uC74C\uACFC \uBD81\uB9C8\uD06C \uC0C1\uD0DC, \uACF5\uC9C0 \uC124\uC815\uC774 \uACC4\uC815 \uAE30\uC900\uC73C\uB85C \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uC720\uC9C0\uB429\uB2C8\uB2E4.",
];

export function AuthLanding() {
  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-[calc(100vh-104px)] w-full max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid w-full gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-hidden rounded-[36px] border border-slate-200 bg-white px-7 py-8 shadow-[0_20px_48px_rgba(15,23,42,0.06)] sm:px-10 sm:py-10">
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold tracking-[0.16em] text-blue-700">
              JNU NOTICE HUB
            </span>
            <h1 className="mt-5 text-3xl font-black tracking-tight text-[#191F28] sm:text-5xl sm:leading-[1.14]">
              {"\uD544\uC694\uD55C \uACF5\uC9C0\uB9CC"}
              <br />
              {"\uBE60\uB974\uAC8C \uBAA8\uC544\uBCF4\uB294"}
              <br />
              {"\uC804\uB0A8\uB300 \uACF5\uC9C0 \uD5C8\uBE0C"}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              {"\uD1A0\uC2A4\uCC98\uB7FC \uAC00\uBCBD\uACE0, \uCE74\uCE74\uC624 \uC11C\uBE44\uC2A4\uCC98\uB7FC \uC775\uC219\uD55C \uD750\uB984\uC73C\uB85C \uACF5\uC9C0\uB97C \uC815\uB9AC\uD588\uC2B5\uB2C8\uB2E4."}
              {" \uB85C\uADF8\uC778\uD558\uBA74 \uB0B4\uAC00 \uACE0\uB978 \uACF5\uC9C0\uB9CC \uBC14\uB85C \uBCF4\uC774\uB294 \uAC1C\uC778\uD615 \uACF5\uC9C0 \uD654\uBA74\uC73C\uB85C \uC774\uC5B4\uC9D1\uB2C8\uB2E4."}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[28px] bg-[#F8FAFC] p-5">
                <p className="text-xs font-semibold text-slate-500">{"\uD55C\uACF3\uC5D0 \uBAA8\uC544\uBCF4\uAE30"}</p>
                <p className="mt-2 text-2xl font-black tracking-tight text-[#191F28]">All-in-one</p>
              </div>
              <div className="rounded-[28px] bg-blue-50 p-5">
                <p className="text-xs font-semibold text-blue-700">{"\uAC1C\uC778 \uB9DE\uCDA4"}</p>
                <p className="mt-2 text-2xl font-black tracking-tight text-[#1B64DA]">My Feed</p>
              </div>
              <div className="rounded-[28px] bg-[#F8FAFC] p-5">
                <p className="text-xs font-semibold text-slate-500">{"\uAE30\uB85D \uD655\uC778"}</p>
                <p className="mt-2 text-2xl font-black tracking-tight text-[#191F28]">30m</p>
              </div>
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
          </div>

          <div className="flex items-stretch">
            <div className="w-full rounded-[36px] border border-slate-200 bg-white p-7 shadow-[0_20px_48px_rgba(15,23,42,0.06)] sm:p-8">
              <div className="rounded-[28px] bg-[#F7F9FB] p-6">
                <p className="text-sm font-semibold text-slate-500">{"\uB85C\uADF8\uC778"}</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                  {"Google \uACC4\uC815\uC73C\uB85C \uC2DC\uC791\uD558\uAE30"}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {"\uACF5\uC9C0, HOT \uC54C\uB9BC, \uC54C\uB9BC \uAE30\uB85D, \uC124\uC815 \uD654\uBA74\uC744 \uAC19\uC740 \uACC4\uC815 \uAE30\uC900\uC73C\uB85C \uC774\uC5B4\uC11C \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."}
                  {" \uBE0C\uB77C\uC6B0\uC800\uB97C \uB2E4\uC2DC \uC5F4\uC5B4\uB3C4 \uC120\uD0DD\uD55C \uACF5\uC9C0 \uAD6C\uC131\uC740 \uC720\uC9C0\uB429\uB2C8\uB2E4."}
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
                    {"Google\uB85C \uB85C\uADF8\uC778"}
                  </button>
                </form>

                <div className="mt-6 rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                  <p className="text-sm font-semibold text-slate-800">{"\uB85C\uADF8\uC778 \uD6C4 \uAC00\uB2A5\uD574\uC694"}</p>
                  <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
                    <li>{"\uD559\uAD50 \uBCF8\uBD80, \uB2E8\uACFC\uB300, \uD559\uACFC, \uAE30\uAD00, \uC0AC\uC5C5\uB2E8 \uACF5\uC9C0 \uC120\uD0DD"}</li>
                    <li>{"\uC77D\uC74C\uACFC \uBD81\uB9C8\uD06C \uC0C1\uD0DC \uC800\uC7A5"}</li>
                    <li>{"30\uBD84 \uB2E8\uC704 \uACF5\uC9C0 \uAE30\uB85D \uD655\uC778"}</li>
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
