"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useTasks } from "@/hooks/use-tasks";
import { TaskForm } from "@/components/tasks/TaskForm";

export function TaskCreatePage() {
  const { user } = useAuth();
  const userId = user?.id ?? "anonymous";
  const { addTask } = useTasks(userId);

  return (
    <div className="mx-auto max-w-2xl">
      <TaskForm
        mode="create"
        onSubmit={async (data) => {
          await addTask(data);
        }}
      />
    </div>
  );
}
