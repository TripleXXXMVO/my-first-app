import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createTaskSchema } from "@/lib/validations/task";
import { isTaskRateLimited, getClientIp, isValidOrigin } from "@/lib/rate-limit";

/**
 * GET /api/tasks — List authenticated user's tasks with optional filters, sorting, and pagination.
 * RLS ensures only the user's own tasks are returned.
 */
export async function GET(request: NextRequest) {
  if (await isTaskRateLimited(getClientIp(request), "GET /api/tasks")) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "You must be logged in to view tasks." }, { status: 401 });
  }

  // Parse and validate query parameters
  const { searchParams } = request.nextUrl;
  const VALID_STATUSES = ["todo", "in_progress", "done"] as const;
  const VALID_PRIORITIES = ["low", "medium", "high"] as const;

  const rawStatus = searchParams.get("status");
  const rawPriority = searchParams.get("priority");
  const sort = searchParams.get("sort") ?? "created_at";
  const sortDirection = searchParams.get("sortDirection") ?? "desc";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const perPage = 50;

  // Only pass validated enum values to Supabase — reject unknown strings
  const status = rawStatus && VALID_STATUSES.includes(rawStatus as (typeof VALID_STATUSES)[number]) ? rawStatus : null;
  const priority = rawPriority && VALID_PRIORITIES.includes(rawPriority as (typeof VALID_PRIORITIES)[number]) ? rawPriority : null;

  // Validate sort field — priority maps to priority_order for correct high > medium > low ordering
  const validSortFields = ["created_at", "due_date", "priority"];
  const rawSortField = validSortFields.includes(sort) ? sort : "created_at";
  const sortField = rawSortField === "priority" ? "priority_order" : rawSortField;
  const ascending = sortDirection === "asc";

  // Build query — RLS automatically scopes to user_id = auth.uid()
  let query = supabase.from("tasks").select("*", { count: "exact" });

  if (status) {
    query = query.eq("status", status);
  }
  if (priority) {
    query = query.eq("priority", priority);
  }

  // Handle sorting — priority_order column ensures high(3) > medium(2) > low(1). Nulls last for due_date.
  if (sortField === "due_date") {
    query = query.order("due_date", { ascending, nullsFirst: false });
  } else {
    query = query.order(sortField, { ascending });
  }

  // Pagination
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  query = query.range(from, to);

  const { data: tasks, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Failed to load tasks." }, { status: 500 });
  }

  return NextResponse.json({ tasks: tasks ?? [], total: count ?? 0 });
}

/**
 * POST /api/tasks — Create a new task for the authenticated user.
 */
export async function POST(request: NextRequest) {
  if (!isValidOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (await isTaskRateLimited(getClientIp(request), "POST /api/tasks")) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "You must be logged in to create tasks." }, { status: 401 });
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const validation = createTaskSchema.safeParse(body);
  if (!validation.success) {
    const firstError = validation.error.issues[0]?.message ?? "Invalid input.";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { title, description, status, priority, due_date } = validation.data;

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      title: title.trim(),
      description,
      status,
      priority,
      due_date,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create task." }, { status: 500 });
  }

  return NextResponse.json({ task }, { status: 201 });
}
