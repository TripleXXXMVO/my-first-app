import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { TaskDetailPage } from "@/components/tasks/TaskDetailPage";

export default async function ViewTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { id } = await params;

  return (
    <AppShell title="Task Detail">
      <TaskDetailPage taskId={id} />
    </AppShell>
  );
}
