import { auth } from "@/auth";
import { NoticeSettingsForm } from "@/features/notices/components/NoticeSettingsForm";
import { GUEST_STORAGE_SCOPE } from "@/features/notices/utils/guestState";

export default async function SettingsPage() {
  const session = await auth();

  const authenticated = Boolean(session?.user);
  const storageScope = session?.user?.email ?? session?.user?.name ?? GUEST_STORAGE_SCOPE;

  return (
    <main className="min-h-screen bg-transparent">
      <NoticeSettingsForm storageScope={storageScope} authenticated={authenticated} />
    </main>
  );
}
