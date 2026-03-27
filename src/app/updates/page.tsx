import { auth } from "@/auth";
import { AuthLanding } from "@/features/auth/components/AuthLanding";
import { UpdatesHubSection } from "@/features/notices/components/UpdatesHubSection";
import { readNoticePreferencesFromCookieStore } from "@/features/notices/server/noticePreferenceCookies";
import { loadNoticePreferences } from "@/features/notices/server/noticePreferences";
import { loadNoticeUpdateHistory } from "@/features/notices/server/noticeUpdateHistory";
import { buildMyAlertsSnapshot } from "@/features/notices/server/myAlerts";
import { cookies } from "next/headers";

export default async function UpdatesPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session) return <AuthLanding />;

  const params = (await searchParams) ?? {};
  const initialTab = params.tab === "updates" ? "updates" : "alerts";
  const history = (await loadNoticeUpdateHistory()).filter(
    (snapshot) => (snapshot.newNoticeCount ?? snapshot.notices.length) > 0,
  );
  const sessionScope = session.user?.email ?? session.user?.name ?? "default";
  const cookieStore = await cookies();
  const preferences =
    (await loadNoticePreferences(sessionScope)) ??
    readNoticePreferencesFromCookieStore(cookieStore);
  const myAlerts = await buildMyAlertsSnapshot(preferences);

  return <UpdatesHubSection history={history} initialTab={initialTab} myAlerts={myAlerts} />;
}
