import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isTaskRateLimited, getClientIp } from "@/lib/rate-limit";

/**
 * GET /api/tasks/stats — Returns task counts for the authenticated user.
 * Uses server-side COUNT queries so stats are always accurate regardless of total task count.
 */
export async function GET(request: NextRequest) {
  if (isTaskRateLimited(getClientIp(request), "GET /api/tasks/stats")) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "You must be logged in to view stats." }, { status: 401 });
  }

  // Count open tasks (todo + in_progress) and done tasks via RLS-scoped queries
  const [openResult, completedResult, recentResult] = await Promise.all([
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .neq("status", "done"),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "done"),
    supabase
      .from("tasks")
      .select("id, title, status, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);

  if (openResult.error || completedResult.error || recentResult.error) {
    return NextResponse.json({ error: "Failed to load stats." }, { status: 500 });
  }

  return NextResponse.json({
    open: openResult.count ?? 0,
    completed: completedResult.count ?? 0,
    recent: recentResult.data ?? [],
  });
}
