import { auth } from "@/auth";
import { AuthLanding } from "@/features/auth/components/AuthLanding";
import { HotNoticeSection } from "@/features/notices/components/HotNoticeSection";
import { fetchRecentHotNoticeRankings } from "@/features/notices/server/fetchTodayHotNotices";

export default async function HotPage() {
  const session = await auth();

  if (!session) {
    return <AuthLanding />;
  }

  const storageScope = session.user?.email ?? session.user?.name ?? "default";
  const globalHotRankings = await fetchRecentHotNoticeRankings();

  return <HotNoticeSection storageScope={storageScope} globalHotRankings={globalHotRankings} />;
}
