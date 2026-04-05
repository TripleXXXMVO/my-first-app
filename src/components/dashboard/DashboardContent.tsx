"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTasks } from "@/hooks/use-tasks";
import { useSubscription } from "@/hooks/use-subscription";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { RecentTasksList, type RecentTask } from "@/components/dashboard/RecentTasksList";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { FREE_TASK_LIMIT } from "@/lib/constants";

interface DashboardContentProps {
  displayName: string;
}

export function DashboardContent({ displayName }: DashboardContentProps) {
  const { user } = useAuth();
  const userId = user?.id ?? "anonymous";
  const { openTasks, completedTasks, recentTasks, loading, totalUnfiltered } = useTasks(userId);
  const { isPro, loading: subLoading } = useSubscription(user?.id);

  const hasTasks = recentTasks.length > 0;

  // Map task data to the RecentTasksList format
  const formattedTasks: RecentTask[] = recentTasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    updatedAt: formatDistanceToNow(new Date(t.updated_at), { addSuffix: true }),
  }));

  const taskUsagePercent = Math.min(
    (totalUnfiltered / FREE_TASK_LIMIT) * 100,
    100
  );
  const atLimit = !isPro && totalUnfiltered >= FREE_TASK_LIMIT;
  const nearLimit = !isPro && totalUnfiltered >= FREE_TASK_LIMIT - 5 && !atLimit;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <WelcomeBanner displayName={displayName} />
      <StatsRow openTasks={openTasks} completedTasks={completedTasks} loading={loading} />

      {/* Plan usage card for free users */}
      {!subLoading && !isPro && hasTasks && (
        <Card
          className={`border shadow-sm ${
            atLimit
              ? "border-amber-200 bg-amber-50/50"
              : "border-[#DAC0FF]/30"
          }`}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex-1">
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-body text-sm font-medium text-[#222222]">
                    Free Plan
                  </span>
                  <Badge
                    variant="outline"
                    className="border-[#DAC0FF] text-xs text-[#5b57a2]"
                  >
                    {totalUnfiltered} / {FREE_TASK_LIMIT} tasks
                  </Badge>
                </div>
                {atLimit && (
                  <span className="font-body text-xs font-medium text-amber-600">
                    Limit reached
                  </span>
                )}
                {nearLimit && (
                  <span className="font-body text-xs text-amber-500">
                    Almost full
                  </span>
                )}
              </div>
              <Progress
                value={taskUsagePercent}
                className="h-2"
                aria-label={`${totalUnfiltered} of ${FREE_TASK_LIMIT} tasks used`}
              />
            </div>
            <Link href="/pricing">
              <Button
                size="sm"
                className="shrink-0 bg-[#B580FF] font-body text-xs font-semibold text-white hover:bg-[#5b57a2]"
              >
                <Sparkles className="mr-1.5 size-3" aria-hidden="true" />
                Upgrade
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {loading ? null : hasTasks ? (
        <RecentTasksList tasks={formattedTasks} />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
