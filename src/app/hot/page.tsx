import { auth } from "@/auth";
import { HotNoticeSection } from "@/features/notices/components/HotNoticeSection";
import { fetchRecentHotNoticeRankings } from "@/features/notices/server/fetchTodayHotNotices";
import { GUEST_STORAGE_SCOPE } from "@/features/notices/utils/guestState";

export default async function HotPage() {
  const session = await auth();

  const authenticated = Boolean(session?.user);
  const storageScope = session?.user?.email ?? session?.user?.name ?? GUEST_STORAGE_SCOPE;
  const globalHotRankings = await fetchRecentHotNoticeRankings();

  return <HotNoticeSection storageScope={storageScope} authenticated={authenticated} globalHotRankings={globalHotRankings} />;
}
