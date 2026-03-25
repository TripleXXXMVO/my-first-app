"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTasks } from "@/hooks/use-tasks";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Task } from "@/lib/tasks";

interface TaskEditPageProps {
  taskId: string;
}

export function TaskEditPage({ taskId }: TaskEditPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id ?? "anonymous";
  const { getTask, editTask, removeTask } = useTasks(userId);
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
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
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
    <div className="mx-auto max-w-2xl">
      <TaskForm
        mode="edit"
        initialData={task}
        onSubmit={async (data) => {
          await editTask(taskId, data);
        }}
        onDelete={async () => {
          await removeTask(taskId);
        }}
      />
    </div>
  );
}
