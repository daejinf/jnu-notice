import { auth } from "@/auth";
import { AuthLanding } from "@/features/auth/components/AuthLanding";
import { HotNoticeSection } from "@/features/notices/components/HotNoticeSection";

export default async function HotPage() {
  const session = await auth();

  if (!session) {
    return <AuthLanding />;
  }

  const storageScope = session.user?.email ?? session.user?.name ?? "default";

  return <HotNoticeSection storageScope={storageScope} />;
}
