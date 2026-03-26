import { auth } from "@/auth";
import { AuthLanding } from "@/features/auth/components/AuthLanding";
import { HotNoticeSection } from "@/features/notices/components/HotNoticeSection";
import { fetchRecentHotNotices } from "@/features/notices/server/fetchTodayHotNotices";

export default async function HotPage() {
  const session = await auth();

  if (!session) {
    return <AuthLanding />;
  }

  const storageScope = session.user?.email ?? session.user?.name ?? "default";
  const globalHotNotices = await fetchRecentHotNotices();

  return <HotNoticeSection storageScope={storageScope} globalHotNotices={globalHotNotices} />;
}
