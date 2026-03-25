"use client";

import Link from "next/link";
import { format, isPast, isToday } from "date-fns";
import type { Task } from "@/lib/tasks";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PriorityBadge } from "@/components/tasks/PriorityBadge";
import { StatusBadge } from "@/components/tasks/StatusBadge";
import { Pencil, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface TaskTableProps {
  tasks: Task[];
  loading?: boolean;
  onToggleDone: (id: string, currentStatus: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

export function TaskTable({ tasks, loading, onToggleDone, onDelete }: TaskTableProps) {
  if (loading) {
    return <TaskTableSkeleton />;
  }

  return (
    <div className="rounded-lg border border-[#DAC0FF]/30 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-b-[#DAC0FF]/20 hover:bg-transparent">
            <TableHead className="w-[40px]">
              <span className="sr-only">Done</span>
            </TableHead>
            <TableHead className="font-body text-xs font-medium uppercase tracking-wider text-[#6b6b6b]">
              Task
            </TableHead>
            <TableHead className="hidden font-body text-xs font-medium uppercase tracking-wider text-[#6b6b6b] md:table-cell">
              Priority
            </TableHead>
            <TableHead className="hidden font-body text-xs font-medium uppercase tracking-wider text-[#6b6b6b] sm:table-cell">
              Status
            </TableHead>
            <TableHead className="hidden font-body text-xs font-medium uppercase tracking-wider text-[#6b6b6b] lg:table-cell">
              Due Date
            </TableHead>
            <TableHead className="w-[100px] text-right font-body text-xs font-medium uppercase tracking-wider text-[#6b6b6b]">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggleDone={onToggleDone}
              onDelete={onDelete}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TaskRow({
  task,
  onToggleDone,
  onDelete,
}: {
  task: Task;
  onToggleDone: (id: string, currentStatus: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}) {
  const isDone = task.status === "done";
  const isOverdue =
    task.due_date && !isDone && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));

  return (
    <TableRow className="border-b-[#DAC0FF]/10 hover:bg-[#F6F0FF]/40">
      {/* Checkbox */}
      <TableCell className="pl-4">
        <Checkbox
          checked={isDone}
          onCheckedChange={() => onToggleDone(task.id, task.status)}
          aria-label={`Mark "${task.title}" as ${isDone ? "not done" : "done"}`}
          className="border-[#DAC0FF] data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
        />
      </TableCell>

      {/* Title + Description */}
      <TableCell>
        <Link
          href={`/tasks/${task.id}`}
          className="group block"
        >
          <p
            className={`font-body text-sm font-medium text-[#222222] group-hover:text-[#5b57a2] ${
              isDone ? "line-through text-[#767676]" : ""
            }`}
          >
            {task.title}
          </p>
          {task.description && (
            <p className="mt-0.5 line-clamp-1 font-body text-xs text-[#767676]">
              {task.description}
            </p>
          )}
          {/* Mobile-only badges */}
          <div className="mt-1.5 flex flex-wrap gap-1.5 sm:hidden">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>
          {/* Mobile due date */}
          {task.due_date && (
            <p className="mt-1 flex items-center gap-1 font-body text-xs text-[#767676] lg:hidden">
              {isOverdue && (
                <AlertTriangle className="size-3 text-red-500" aria-label="Overdue" />
              )}
              <span className={isOverdue ? "text-red-500" : ""}>
                {format(new Date(task.due_date), "MMM d, yyyy")}
              </span>
            </p>
          )}
        </Link>
      </TableCell>

      {/* Priority - hidden on mobile */}
      <TableCell className="hidden md:table-cell">
        <PriorityBadge priority={task.priority} />
      </TableCell>

      {/* Status - hidden on mobile */}
      <TableCell className="hidden sm:table-cell">
        <StatusBadge status={task.status} />
      </TableCell>

      {/* Due Date - hidden on mobile/tablet */}
      <TableCell className="hidden lg:table-cell">
        {task.due_date ? (
          <span
            className={`flex items-center gap-1 font-body text-sm ${
              isOverdue ? "font-medium text-red-500" : "text-[#6b6b6b]"
            }`}
          >
            {isOverdue && (
              <AlertTriangle className="size-3.5" aria-label="Overdue" />
            )}
            {format(new Date(task.due_date), "MMM d, yyyy")}
          </span>
        ) : (
          <span className="font-body text-sm text-[#b0b0b0]">--</span>
        )}
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-[#5b57a2] hover:bg-[#F6F0FF] hover:text-[#292673]"
            asChild
          >
            <Link href={`/tasks/${task.id}/edit`} aria-label={`Edit "${task.title}"`}>
              <Pencil className="size-4" />
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-[#6b6b6b] hover:bg-red-50 hover:text-red-600"
                aria-label={`Delete "${task.title}"`}
              >
                <Trash2 className="size-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-heading">
                  Delete this task?
                </AlertDialogTitle>
                <AlertDialogDescription className="font-body">
                  &quot;{task.title}&quot; will be permanently removed. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="font-body">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 font-body hover:bg-red-700"
                  onClick={async () => {
                    try {
                      await onDelete(task.id);
                      toast.success("Task deleted");
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Failed to delete task.");
                    }
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}

function TaskTableSkeleton() {
  return (
    <div className="rounded-lg border border-[#DAC0FF]/30 bg-white p-4 shadow-sm">
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="size-5 rounded" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
            <Skeleton className="hidden h-5 w-16 rounded-full md:block" />
            <Skeleton className="hidden h-5 w-16 rounded-full sm:block" />
            <Skeleton className="hidden h-4 w-24 lg:block" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
