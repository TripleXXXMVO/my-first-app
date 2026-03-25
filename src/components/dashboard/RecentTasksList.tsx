"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export interface RecentTask {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "in_review" | "done";
  updatedAt: string;
}

interface RecentTasksListProps {
  tasks: RecentTask[];
  loading?: boolean;
}

const statusConfig: Record<
  RecentTask["status"],
  { label: string; className: string }
> = {
  todo: {
    label: "To Do",
    className: "border-[#DAC0FF] bg-[#F6F0FF] text-[#5b57a2]",
  },
  in_progress: {
    label: "In Progress",
    className: "border-amber-300 bg-amber-50 text-amber-700",
  },
  in_review: {
    label: "In Review",
    className: "border-blue-300 bg-blue-50 text-blue-700",
  },
  done: {
    label: "Done",
    className: "border-emerald-300 bg-emerald-50 text-emerald-700",
  },
};

export function RecentTasksList({ tasks, loading }: RecentTasksListProps) {
  if (loading) {
    return (
      <Card className="border-[#DAC0FF]/30 shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-base font-semibold text-[#222222]">
            Recent Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return null;
  }

  return (
    <Card className="border-[#DAC0FF]/30 shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-base font-semibold text-[#222222]">
          Recent Tasks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-[#DAC0FF]/20" aria-label="Recent tasks">
          {tasks.map((task) => {
            const status = statusConfig[task.status];
            return (
              <li
                key={task.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-sm font-medium text-[#222222]">
                    {task.title}
                  </p>
                  <p className="font-body text-xs text-[#767676]">
                    Updated {task.updatedAt}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`ml-3 shrink-0 font-body text-xs ${status.className}`}
                >
                  {status.label}
                </Badge>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
