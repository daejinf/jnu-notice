import { auth } from "@/auth";
import { AuthLanding } from "@/features/auth/components/AuthLanding";
import { UpdatesHubSection } from "@/features/notices/components/UpdatesHubSection";
import { loadNoticeUpdateHistory } from "@/features/notices/server/noticeUpdateHistory";

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

  return <UpdatesHubSection history={history} initialTab={initialTab} />;
}
