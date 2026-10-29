import { auth } from "@/auth";
import { UnifiedUpdatesHubSection } from "@/features/notices/components/UnifiedUpdatesHubSection";
import { buildMyAlertsSnapshot } from "@/features/notices/server/myAlerts";
import { loadMyAlertsSnapshot } from "@/features/notices/server/myAlertsSnapshots";
import { loadNoticeCheckSnapshot } from "@/features/notices/server/noticeCheckSnapshot";
import { readNoticePreferencesFromCookieStore } from "@/features/notices/server/noticePreferenceCookies";
import { loadNoticePreferences } from "@/features/notices/server/noticePreferences";
import { loadNoticeUpdateHistory } from "@/features/notices/server/noticeUpdateHistory";
import { GUEST_STORAGE_SCOPE } from "@/features/notices/utils/guestState";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UpdatesPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  const params = (await searchParams) ?? {};
  const authenticated = Boolean(session?.user);
  const initialTab = params.tab === "updates" || !authenticated ? "updates" : "alerts";
  const history = (await loadNoticeUpdateHistory()).filter(
    (snapshot) => (snapshot.newNoticeCount ?? snapshot.notices.length) > 0,
  );
  const sessionScope = session?.user?.email ?? session?.user?.name ?? "guest";
  const storageScope = authenticated ? sessionScope : GUEST_STORAGE_SCOPE;
  const cookieStore = await cookies();
  const latestCheck = await loadNoticeCheckSnapshot();
  const preferences = authenticated
    ? (await loadNoticePreferences(sessionScope)) ?? readNoticePreferencesFromCookieStore(cookieStore)
    : null;
  const myAlerts = authenticated
    ? (preferences ? await loadMyAlertsSnapshot(sessionScope) : null) ?? (await buildMyAlertsSnapshot(preferences))
    : { notices: [], fetchedAt: latestCheck?.checkedAt ?? new Date().toISOString(), totalCount: 0, hasPreferences: false };

  return (
    <UnifiedUpdatesHubSection
      authenticated={authenticated}
      storageScope={storageScope}
      history={history}
      initialTab={initialTab}
      latestCheckedAt={latestCheck?.checkedAt ?? myAlerts.fetchedAt}
      myAlerts={myAlerts}
    />
  );
}
