import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminRateLimited, getClientIp } from "@/lib/rate-limit";
import { adminUserListQuerySchema } from "@/lib/validations/admin";
import { ADMIN_USERS_PER_PAGE } from "@/lib/admin";

/**
 * GET /api/admin/users — Paginated, filterable user list for admin panel.
 * Supports: ?search=email&plan=free|pro&page=1
 */
export async function GET(request: NextRequest) {
  if (await isAdminRateLimited(getClientIp(request), "GET /api/admin/users")) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;

  // Parse and validate query parameters
  const { searchParams } = request.nextUrl;
  const rawQuery = {
    search: searchParams.get("search") || undefined,
    plan: searchParams.get("plan") || undefined,
    page: searchParams.get("page") || undefined,
  };

  const validation = adminUserListQuerySchema.safeParse(rawQuery);
  if (!validation.success) {
    const firstError = validation.error.issues[0]?.message ?? "Invalid query parameters.";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { search, plan, page } = validation.data;
  const perPage = ADMIN_USERS_PER_PAGE;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  // If plan filter is requested, pre-fetch the relevant user IDs from subscriptions
  // so we can apply the filter at the DB level before pagination (not client-side).
  let planFilterIds: string[] | null = null;
  if (plan) {
    if (plan === "pro") {
      // Pro users: have an active "pro" subscription
      const { data: proSubs } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("plan", "pro")
        .eq("status", "active");
      planFilterIds = proSubs?.map((s) => s.user_id) ?? [];
      if (planFilterIds.length === 0) {
        return NextResponse.json({ users: [], total: 0 });
      }
    } else {
      // Free users: do NOT have an active "pro" subscription
      const { data: proSubs } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("plan", "pro")
        .eq("status", "active");
      const proIds = proSubs?.map((s) => s.user_id) ?? [];
      // planFilterIds = null means "no exclusion needed" (all users are free)
      planFilterIds = proIds.length > 0 ? proIds : null;
    }
  }

  // Build query — select profiles with optional subscription join
  let query = supabase
    .from("profiles")
    .select(
      "id, email, display_name, avatar_url, role, is_active, created_at",
      { count: "exact" }
    );

  // Search by email (case-insensitive partial match).
  // Escape SQL LIKE special characters so they are treated as literals:
  //   \  →  \\   (must be first to avoid double-escaping)
  //   %  →  \%
  //   _  →  \_
  if (search) {
    const escaped = search.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
    query = query.ilike("email", `%${escaped}%`);
  }

  // Apply plan filter at DB level before pagination
  if (plan === "pro" && planFilterIds) {
    query = query.in("id", planFilterIds);
  } else if (plan === "free" && planFilterIds) {
    // Exclude users who have a pro subscription
    query = query.not("id", "in", `(${planFilterIds.join(",")})`);
  }

  // Sort by created_at descending (newest first)
  query = query.order("created_at", { ascending: false });

  // Pagination — applied after all filters so count and results are correct
  query = query.range(from, to);

  const { data: profiles, count, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Failed to load users." },
      { status: 500 }
    );
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ users: [], total: count ?? 0 });
  }

  const userIds = profiles.map((p) => p.id);

  // Fetch active subscriptions and last_sign_in_at in parallel
  const adminClient = createAdminClient();
  const [subscriptionsResult, lastSignInResult] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("user_id, plan, status")
      .in("user_id", userIds)
      .eq("status", "active"),
    adminClient.rpc("get_users_last_sign_in", { user_ids: userIds }),
  ]);

  // Build a map of user_id -> plan
  const planMap = new Map<string, string>();
  if (subscriptionsResult.data) {
    for (const sub of subscriptionsResult.data) {
      planMap.set(sub.user_id, sub.plan);
    }
  }

  // Build a map of user_id -> last_sign_in_at
  const lastSignInMap = new Map<string, string | null>();
  if (lastSignInResult.data) {
    for (const row of lastSignInResult.data as {
      id: string;
      last_sign_in_at: string | null;
    }[]) {
      lastSignInMap.set(row.id, row.last_sign_in_at);
    }
  }

  const users = profiles.map((p) => ({
    id: p.id,
    email: p.email,
    display_name: p.display_name,
    avatar_url: p.avatar_url,
    role: p.role,
    plan: (planMap.get(p.id) as "free" | "pro") ?? "free",
    is_active: p.is_active,
    created_at: p.created_at,
    last_sign_in_at: lastSignInMap.get(p.id) ?? null,
  }));

  return NextResponse.json({
    users,
    total: count ?? 0,
  });
}
