"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTasks } from "@/hooks/use-tasks";
import { StatusBadge } from "@/components/tasks/StatusBadge";
import { PriorityBadge } from "@/components/tasks/PriorityBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Pencil, ArrowLeft } from "lucide-react";
import type { Task } from "@/lib/tasks";

interface TaskDetailPageProps {
  taskId: string;
}

export function TaskDetailPage({ taskId }: TaskDetailPageProps) {
  const { user } = useAuth();
  const userId = user?.id ?? "anonymous";
  const { getTask } = useTasks(userId);
  const [task, setTask] = useState<Task | undefined>(undefined);
  const [notFound, setNotFound] = useState(false);
  const [taskLoading, setTaskLoading] = useState(true);

  useEffect(() => {
    setTaskLoading(true);
    getTask(taskId).then((found) => {
      if (found) {
        setTask(found);
      } else {
        setNotFound(true);
      }
    }).finally(() => setTaskLoading(false));
  }, [taskId, getTask]);

  if (taskLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="border-[#DAC0FF]/30 shadow-sm">
          <CardContent className="flex flex-col items-center px-6 py-12 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-amber-50">
              <AlertTriangle className="size-8 text-amber-500" aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-heading text-lg font-semibold text-[#222222]">
              Task not found
            </h3>
            <p className="mt-2 max-w-sm font-body text-sm text-[#6b6b6b]">
              This task may have been deleted or does not exist.
            </p>
            <Button
              className="mt-6 bg-[#B580FF] font-body text-sm font-semibold text-white hover:bg-[#5b57a2]"
              asChild
            >
              <Link href="/tasks">Back to Tasks</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="font-body text-[#5b57a2]" asChild>
          <Link href="/tasks">
            <ArrowLeft className="mr-1 size-4" />
            Back to Tasks
          </Link>
        </Button>
        <Button
          className="bg-[#B580FF] font-body text-sm font-semibold text-white hover:bg-[#5b57a2]"
          asChild
        >
          <Link href={`/tasks/${taskId}/edit`}>
            <Pencil className="mr-2 size-4" />
            Edit Task
          </Link>
        </Button>
      </div>

      <Card className="border-[#DAC0FF]/30 shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-xl font-semibold text-[#222222]">
            {task.title}
          </CardTitle>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {task.description && (
            <div>
              <p className="font-body text-xs font-medium uppercase tracking-wider text-[#6b6b6b]">
                Description
              </p>
              <p className="mt-1 whitespace-pre-wrap font-body text-sm text-[#222222]">
                {task.description}
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-body text-xs font-medium uppercase tracking-wider text-[#6b6b6b]">
                Due Date
              </p>
              <p className="mt-1 font-body text-sm text-[#222222]">
                {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "—"}
              </p>
            </div>
            <div>
              <p className="font-body text-xs font-medium uppercase tracking-wider text-[#6b6b6b]">
                Created
              </p>
              <p className="mt-1 font-body text-sm text-[#222222]">
                {format(new Date(task.created_at), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
