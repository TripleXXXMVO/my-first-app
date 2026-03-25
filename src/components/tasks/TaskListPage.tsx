"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTasks } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskFilterBar } from "@/components/tasks/TaskFilterBar";
import { TaskTable } from "@/components/tasks/TaskTable";
import { TaskEmptyState } from "@/components/tasks/TaskEmptyState";
import { TaskPagination } from "@/components/tasks/TaskPagination";

export function TaskListPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "anonymous";

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
        <Button
          className="bg-[#B580FF] font-body text-sm font-semibold text-white hover:bg-[#5b57a2]"
          asChild
        >
          <Link href="/tasks/new">
            <Plus className="mr-1.5 size-4" />
            New Task
          </Link>
        </Button>
      </div>

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
    </div>
  );
}
