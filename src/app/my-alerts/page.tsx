import { auth } from "@/auth";
import { AuthLanding } from "@/features/auth/components/AuthLanding";
import { MyNoticeAlertsSection } from "@/features/notices/components/MyNoticeAlertsSection";

export default async function MyAlertsPage() {
  const session = await auth();

  if (!session) {
    return <AuthLanding />;
  }

  const storageScope = session.user?.email ?? session.user?.name ?? "default";

  return <MyNoticeAlertsSection storageScope={storageScope} />;
}
