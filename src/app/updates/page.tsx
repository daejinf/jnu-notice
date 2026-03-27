import { auth } from "@/auth";
import { AuthLanding } from "@/features/auth/components/AuthLanding";
import { UpdatesHubSection } from "@/features/notices/components/UpdatesHubSection";
import { buildMyAlertsSnapshot } from "@/features/notices/server/myAlerts";
import { loadMyAlertsSnapshot } from "@/features/notices/server/myAlertsSnapshots";
import { loadNoticeCheckSnapshot } from "@/features/notices/server/noticeCheckSnapshot";
import { readNoticePreferencesFromCookieStore } from "@/features/notices/server/noticePreferenceCookies";
import { loadNoticePreferences } from "@/features/notices/server/noticePreferences";
import { loadNoticeUpdateHistory } from "@/features/notices/server/noticeUpdateHistory";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  const myAlerts =
    (preferences ? await loadMyAlertsSnapshot(sessionScope) : null) ??
    (await buildMyAlertsSnapshot(preferences));
  const latestCheck = await loadNoticeCheckSnapshot();

  return (
    <UpdatesHubSection
      history={history}
      initialTab={initialTab}
      latestCheckedAt={latestCheck?.checkedAt ?? myAlerts.fetchedAt}
      myAlerts={myAlerts}
    />
  );
}
