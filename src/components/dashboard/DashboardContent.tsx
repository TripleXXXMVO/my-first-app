"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTasks } from "@/hooks/use-tasks";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { RecentTasksList, type RecentTask } from "@/components/dashboard/RecentTasksList";
import { EmptyState } from "@/components/dashboard/EmptyState";

interface DashboardContentProps {
  displayName: string;
}

export function DashboardContent({ displayName }: DashboardContentProps) {
  const { user } = useAuth();
  const userId = user?.id ?? "anonymous";
  const { openTasks, completedTasks, recentTasks, loading } = useTasks(userId);

  const hasTasks = recentTasks.length > 0;

  // Map task data to the RecentTasksList format
  const formattedTasks: RecentTask[] = recentTasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    updatedAt: formatDistanceToNow(new Date(t.updated_at), { addSuffix: true }),
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <WelcomeBanner displayName={displayName} />
      <StatsRow openTasks={openTasks} completedTasks={completedTasks} loading={loading} />
      {loading ? null : hasTasks ? (
        <RecentTasksList tasks={formattedTasks} />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
