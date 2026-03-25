"use client";

import type { TaskStatus } from "@/lib/tasks";
import { Badge } from "@/components/ui/badge";

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  todo: {
    label: "To Do",
    className: "border-gray-300 bg-gray-50 text-gray-700",
  },
  in_progress: {
    label: "In Progress",
    className: "border-blue-300 bg-blue-50 text-blue-700",
  },
  done: {
    label: "Done",
    className: "border-emerald-300 bg-emerald-50 text-emerald-700",
  },
};

interface StatusBadgeProps {
  status: TaskStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={`font-body text-xs ${config.className}`}>
      {config.label}
    </Badge>
  );
}
