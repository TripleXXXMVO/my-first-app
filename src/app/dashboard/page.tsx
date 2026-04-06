import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { EmailVerifiedBanner } from "@/components/dashboard/EmailVerifiedBanner";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { verified } = await searchParams;
  const displayName = (user.user_metadata?.display_name as string | undefined) ?? "there";

  return (
    <AppShell title="Dashboard">
      {verified === "1" && <EmailVerifiedBanner />}
      <DashboardContent displayName={displayName} />
    </AppShell>
  );
}
