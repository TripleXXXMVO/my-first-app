"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTasks } from "@/hooks/use-tasks";
import { useSubscription } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TaskFilterBar } from "@/components/tasks/TaskFilterBar";
import { TaskTable } from "@/components/tasks/TaskTable";
import { TaskEmptyState } from "@/components/tasks/TaskEmptyState";
import { TaskPagination } from "@/components/tasks/TaskPagination";
import { UpgradePrompt } from "@/components/billing/UpgradePrompt";
import { FREE_TASK_LIMIT } from "@/lib/constants";

export function TaskListPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "anonymous";
  const { isPro } = useSubscription(user?.id);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const {
    tasks,
    total,
    totalUnfiltered,
    filters,
    loading,
    editTask,
    removeTask,
    updateFilters,
  } = useTasks(userId);

  const hasActiveFilters = filters.status !== "all" || filters.priority !== "all";
  const hasAnyTasks = totalUnfiltered > 0;
  const atLimit = !isPro && totalUnfiltered >= FREE_TASK_LIMIT;
  const nearLimit = !isPro && totalUnfiltered >= FREE_TASK_LIMIT - 5 && !atLimit;

  const handleToggleDone = async (id: string, currentStatus: string) => {
    try {
      await editTask(id, { status: currentStatus === "done" ? "todo" : "done" });
    } catch (err) {
      console.error("Failed to toggle task status:", err);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-[140px]" />
          <Skeleton className="h-9 w-[140px]" />
          <Skeleton className="h-9 w-[160px]" />
        </div>
        <TaskTable tasks={[]} loading={true} onToggleDone={() => {}} onDelete={() => {}} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-[#222222]">
          Your Tasks
        </h2>
        {atLimit ? (
          <Button
            className="bg-[#B580FF] font-body text-sm font-semibold text-white hover:bg-[#5b57a2]"
            onClick={() => setShowUpgrade(true)}
          >
            <Plus className="mr-1.5 size-4" />
            New Task
          </Button>
        ) : (
          <Button
            className="bg-[#B580FF] font-body text-sm font-semibold text-white hover:bg-[#5b57a2]"
            asChild
          >
            <Link href="/tasks/new">
              <Plus className="mr-1.5 size-4" />
              New Task
            </Link>
          </Button>
        )}
      </div>

      {/* Task limit indicator for free users */}
      {!isPro && hasAnyTasks && (
        <div className="flex items-center gap-3 rounded-lg border border-[#DAC0FF]/30 bg-white p-3">
          <div className="flex-1">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-body text-xs text-[#6b6b6b]">
                {totalUnfiltered} / {FREE_TASK_LIMIT} tasks used
              </span>
              {atLimit && (
                <Badge
                  variant="outline"
                  className="border-amber-300 text-xs text-amber-600"
                >
                  Limit reached
                </Badge>
              )}
              {nearLimit && (
                <Badge
                  variant="outline"
                  className="border-amber-200 text-xs text-amber-500"
                >
                  Almost full
                </Badge>
              )}
            </div>
            <Progress
              value={(totalUnfiltered / FREE_TASK_LIMIT) * 100}
              className="h-1.5"
              aria-label={`${totalUnfiltered} of ${FREE_TASK_LIMIT} tasks used`}
            />
          </div>
          {(atLimit || nearLimit) && (
            <Link href="/pricing">
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 border-[#DAC0FF] font-body text-xs text-[#5b57a2] hover:bg-[#F6F0FF]"
              >
                Upgrade
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Only show filters if user has tasks */}
      {hasAnyTasks && (
        <TaskFilterBar
          filters={filters}
          onFilterChange={updateFilters}
          total={total}
        />
      )}

      {/* Content */}
      {tasks.length === 0 ? (
        <TaskEmptyState
          isFilteredEmpty={hasActiveFilters}
          onClearFilters={
            hasActiveFilters
              ? () => updateFilters({ status: "all", priority: "all" })
              : undefined
          }
        />
      ) : (
        <>
          <TaskTable
            tasks={tasks}
            onToggleDone={handleToggleDone}
            onDelete={removeTask}
          />
          <TaskPagination
            total={total}
            currentPage={filters.page}
            onPageChange={(page) => updateFilters({ page })}
          />
        </>
      )}

      <UpgradePrompt open={showUpgrade} onOpenChange={setShowUpgrade} />
    </div>
  );
}
