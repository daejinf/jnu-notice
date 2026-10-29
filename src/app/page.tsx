import { auth } from "@/auth";
import { NoticeWorkspace } from "@/features/notices/components/NoticeWorkspace";
import { GUEST_STORAGE_SCOPE } from "@/features/notices/utils/guestState";

export default async function HomePage() {
  const session = await auth();

  const authenticated = Boolean(session?.user);
  const storageScope = session?.user?.email ?? session?.user?.name ?? GUEST_STORAGE_SCOPE;

  return (
    <main className="min-h-screen bg-transparent">
      <NoticeWorkspace viewer={{ authenticated, storageScope }} />
    </main>
  );
}
