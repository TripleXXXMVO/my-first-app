import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { RecentTasksList } from "@/components/dashboard/RecentTasksList";
import { EmptyState } from "@/components/dashboard/EmptyState";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // PROJ-3 is not yet built, so we show the empty state.
  // When PROJ-3 is implemented, these will come from the API.
  const hasTasks = false;
  const openTasks = 0;
  const completedTasks = 0;
  const recentTasks: [] = [];

  const displayName = (user.user_metadata?.display_name as string | undefined) ?? "there";

  return (
    <AppShell title="Dashboard">
      <div className="mx-auto max-w-4xl space-y-6">
        <WelcomeBanner displayName={displayName} />
        <StatsRow openTasks={openTasks} completedTasks={completedTasks} />
        {hasTasks ? (
          <RecentTasksList tasks={recentTasks} />
        ) : (
          <EmptyState />
        )}
      </div>
    </AppShell>
  );
}
