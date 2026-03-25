import { auth } from "@/auth";
import { AuthLanding } from "@/features/auth/components/AuthLanding";
import { NoticeFeedSection } from "@/features/notices/components/NoticeFeedSection";

export default async function HomePage() {
  const session = await auth();

  if (!session) {
    return <AuthLanding />;
  }

  const storageScope = session.user?.email ?? session.user?.name ?? "default";

  return (
    <main className="min-h-screen bg-transparent">
      <NoticeFeedSection storageScope={storageScope} />
    </main>
  );
}
