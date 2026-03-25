"use client";

import type { TaskFilters, TaskStatus, TaskPriority, TaskSortField, TaskSortDirection } from "@/lib/tasks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, X } from "lucide-react";

interface TaskFilterBarProps {
  filters: TaskFilters;
  onFilterChange: (partial: Partial<TaskFilters>) => void;
  total: number;
}

export function TaskFilterBar({ filters, onFilterChange, total }: TaskFilterBarProps) {
  const hasActiveFilters = filters.status !== "all" || filters.priority !== "all";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
        {/* Status filter */}
        <Select
          value={filters.status}
          onValueChange={(v) => onFilterChange({ status: v as TaskStatus | "all" })}
        >
          <SelectTrigger className="w-[120px] sm:w-[140px] font-body text-sm" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>

        {/* Priority filter */}
        <Select
          value={filters.priority}
          onValueChange={(v) => onFilterChange({ priority: v as TaskPriority | "all" })}
        >
          <SelectTrigger className="w-[120px] sm:w-[140px] font-body text-sm" aria-label="Filter by priority">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort control */}
        <Select
          value={filters.sort}
          onValueChange={(v) => onFilterChange({ sort: v as TaskSortField })}
        >
          <SelectTrigger className="w-[130px] sm:w-[160px] font-body text-sm" aria-label="Sort by">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Created Date</SelectItem>
            <SelectItem value="due_date">Due Date</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort direction toggle */}
        <Button
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={() =>
            onFilterChange({
              sortDirection: filters.sortDirection === "asc" ? "desc" : "asc",
            })
          }
          aria-label={`Sort ${filters.sortDirection === "asc" ? "descending" : "ascending"}`}
        >
          <ArrowUpDown className="size-4" />
        </Button>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="font-body text-sm text-[#5b57a2] hover:text-[#292673]"
            onClick={() => onFilterChange({ status: "all", priority: "all" })}
          >
            <X className="mr-1 size-3" />
            Clear filters
          </Button>
        )}
      </div>

      <p className="font-body text-sm text-[#6b6b6b]">
        {total} {total === 1 ? "task" : "tasks"}
      </p>
    </div>
  );
}
