"use client";

import type { TaskPriority } from "@/lib/tasks";
import { Badge } from "@/components/ui/badge";

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  high: {
    label: "High",
    className: "border-orange-300 bg-orange-50 text-orange-700",
  },
  medium: {
    label: "Medium",
    className: "border-amber-300 bg-amber-50 text-amber-700",
  },
  low: {
    label: "Low",
    className: "border-emerald-300 bg-emerald-50 text-emerald-700",
  },
};

interface PriorityBadgeProps {
  priority: TaskPriority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  return (
    <Badge variant="outline" className={`font-body text-xs ${config.className}`}>
      {config.label}
    </Badge>
  );
}
