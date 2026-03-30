import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { isAdminRateLimited, getClientIp } from "@/lib/rate-limit";
import { adminUserListQuerySchema } from "@/lib/validations/admin";
import { ADMIN_USERS_PER_PAGE } from "@/lib/admin";

/**
 * GET /api/admin/users — Paginated, filterable user list for admin panel.
 * Supports: ?search=email&plan=free|pro&page=1
 */
export async function GET(request: NextRequest) {
  if (isAdminRateLimited(getClientIp(request), "GET /api/admin/users")) {
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

  // Build query — select profiles with optional subscription join
  // We use a left join to subscriptions to get the user's plan
  let query = supabase
    .from("profiles")
    .select(
      "id, email, display_name, avatar_url, role, is_active, created_at",
      { count: "exact" }
    );

  // Search by email (case-insensitive partial match)
  if (search) {
    query = query.ilike("email", `%${search}%`);
  }

  // Sort by created_at descending (newest first)
  query = query.order("created_at", { ascending: false });

  // Pagination
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

  // Fetch active subscriptions for these users to determine plan
  const userIds = profiles.map((p) => p.id);
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("user_id, plan, status")
    .in("user_id", userIds)
    .eq("status", "active");

  // Build a map of user_id -> plan
  const planMap = new Map<string, string>();
  if (subscriptions) {
    for (const sub of subscriptions) {
      planMap.set(sub.user_id, sub.plan);
    }
  }

  // Fetch last_sign_in_at from auth.users via admin API is not possible with anon key,
  // so we'll use the profiles data we have. If last_sign_in_at isn't in profiles,
  // we'll return null. The admin client could be used but it's heavy for a list query.
  // For now, we include it as null and it can be populated if the profiles table stores it.

  // Assemble user objects
  let users = profiles.map((p) => ({
    id: p.id,
    email: p.email,
    display_name: p.display_name,
    avatar_url: p.avatar_url,
    role: p.role,
    plan: (planMap.get(p.id) as "free" | "pro") ?? "free",
    is_active: p.is_active,
    created_at: p.created_at,
    last_sign_in_at: null as string | null,
  }));

  // Filter by plan (post-query since plan comes from subscriptions table)
  if (plan) {
    users = users.filter((u) => u.plan === plan);
  }

  return NextResponse.json({
    users,
    total: plan ? users.length : (count ?? 0),
  });
}
