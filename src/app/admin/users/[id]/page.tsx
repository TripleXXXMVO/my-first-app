import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { AdminUserDetailPage } from "@/components/admin/AdminUserDetailPage";

interface AdminUserDetailRouteProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailRoute({
  params,
}: AdminUserDetailRouteProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard?error=unauthorized");
  }

  return (
    <AppShell title="User Details">
      <AdminUserDetailPage userId={id} />
    </AppShell>
  );
}
