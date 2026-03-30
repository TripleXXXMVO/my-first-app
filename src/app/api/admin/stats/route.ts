import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { isAdminRateLimited, getClientIp } from "@/lib/rate-limit";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * GET /api/admin/stats — Platform statistics for the admin dashboard.
 * Optionally includes recent audit log entries when ?include=audit_log.
 */
export async function GET(request: NextRequest) {
  if (isAdminRateLimited(getClientIp(request), "GET /api/admin/stats")) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;

  // Total users count
  const { count: totalUsers, error: totalErr } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  if (totalErr) {
    return NextResponse.json(
      { error: "Failed to load stats." },
      { status: 500 }
    );
  }

  // New signups in the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { count: newThisWeek, error: newErr } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo.toISOString());

  if (newErr) {
    return NextResponse.json(
      { error: "Failed to load stats." },
      { status: 500 }
    );
  }

  // Free vs Pro user counts — count active Pro subscriptions
  const { count: proUsers, error: proErr } = await supabase
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .eq("plan", "pro");

  const total = totalUsers ?? 0;
  // If subscriptions table query fails, treat all as free
  const pro = proErr ? 0 : (proUsers ?? 0);
  const free = Math.max(0, total - pro);

  const response: Record<string, unknown> = {
    totalUsers: total,
    newThisWeek: newThisWeek ?? 0,
    freeUsers: free,
    proUsers: pro,
  };

  // Include audit log if requested
  const includeAuditLog =
    request.nextUrl.searchParams.get("include") === "audit_log";
  if (includeAuditLog) {
    response.auditLog = await getRecentAuditLog(supabase);
  }

  return NextResponse.json(response);
}

/**
 * Fetch the 10 most recent audit log entries with admin and target user emails.
 * Uses a single batch query to resolve emails (avoids N+1).
 */
async function getRecentAuditLog(supabase: SupabaseClient) {
  const { data: logs, error: logError } = await supabase
    .from("admin_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (logError || !logs || logs.length === 0) return [];

  // Collect unique user IDs to resolve emails in one query
  const userIds = new Set<string>();
  for (const log of logs) {
    if (log.admin_id) userIds.add(log.admin_id);
    if (log.target_user_id) userIds.add(log.target_user_id);
  }

  const emailMap = new Map<string, string>();

  if (userIds.size > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", Array.from(userIds));

    if (profiles) {
      for (const p of profiles) {
        emailMap.set(p.id, p.email);
      }
    }
  }

  return logs.map((log) => ({
    ...log,
    admin_email: emailMap.get(log.admin_id) ?? null,
    target_user_email: emailMap.get(log.target_user_id) ?? null,
  }));
}
