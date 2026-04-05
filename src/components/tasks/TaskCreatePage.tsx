"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTasks } from "@/hooks/use-tasks";
import { useSubscription } from "@/hooks/use-subscription";
import { TaskForm } from "@/components/tasks/TaskForm";
import { UpgradePrompt } from "@/components/billing/UpgradePrompt";
import { FREE_TASK_LIMIT } from "@/lib/constants";

export function TaskCreatePage() {
  const { user } = useAuth();
  const userId = user?.id ?? "anonymous";
  const { addTask, totalUnfiltered } = useTasks(userId);
  const { isPro } = useSubscription(user?.id);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const atLimit = !isPro && totalUnfiltered >= FREE_TASK_LIMIT;

  return (
    <div className="mx-auto max-w-2xl">
      {atLimit && (
        <div
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-center"
          role="alert"
        >
          <p className="font-body text-sm text-amber-800">
            You have reached the limit of {FREE_TASK_LIMIT} tasks on the Free
            plan. Upgrade to Pro for unlimited tasks.
          </p>
        </div>
      )}

      <TaskForm
        mode="create"
        onSubmit={async (data) => {
          try {
            await addTask(data);
          } catch (err) {
            // If the server returns a 402 (plan limit), show the upgrade prompt
            if (
              err instanceof Error &&
              err.message.toLowerCase().includes("limit")
            ) {
              setShowUpgrade(true);
              return;
            }
            throw err;
          }
        }}
      />

      <UpgradePrompt open={showUpgrade} onOpenChange={setShowUpgrade} />
    </div>
  );
}
