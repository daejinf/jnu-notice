import { auth } from "@/auth";
import { AuthLanding } from "@/features/auth/components/AuthLanding";
import { NoticeSettingsForm } from "@/features/notices/components/NoticeSettingsForm";

export default async function SettingsPage() {
  const session = await auth();

  if (!session) {
    return <AuthLanding />;
  }

  const storageScope = session.user?.email ?? session.user?.name ?? "default";

  return (
    <main className="min-h-screen bg-transparent">
      <NoticeSettingsForm storageScope={storageScope} />
    </main>
  );
}
