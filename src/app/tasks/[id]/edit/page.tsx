import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { TaskEditPage } from "@/components/tasks/TaskEditPage";

export default async function EditTaskPage({
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
    <AppShell title="Edit Task">
      <TaskEditPage taskId={id} />
    </AppShell>
  );
}
