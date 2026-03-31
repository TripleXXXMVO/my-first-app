import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateTaskSchema } from "@/lib/validations/task";
import { isTaskRateLimited, getClientIp, isValidOrigin } from "@/lib/rate-limit";
import { z } from "zod";

const uuidSchema = z.string().uuid("Invalid task ID.");

/**
 * GET /api/tasks/[id] — Fetch a single task by ID.
 * RLS ensures the user can only read their own tasks.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (await isTaskRateLimited(getClientIp(request), "GET /api/tasks/[id]")) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const idValidation = uuidSchema.safeParse(id);
  if (!idValidation.success) {
    return NextResponse.json({ error: "Invalid task ID." }, { status: 400 });
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "You must be logged in to view tasks." }, { status: 401 });
  }

  const { data: task, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to load task." }, { status: 500 });
  }

  return NextResponse.json({ task });
}

/**
 * PATCH /api/tasks/[id] — Update an existing task.
 * RLS ensures the user can only update their own tasks.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isValidOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (await isTaskRateLimited(getClientIp(request), "PATCH /api/tasks/[id]")) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  // Validate task ID format
  const idValidation = uuidSchema.safeParse(id);
  if (!idValidation.success) {
    return NextResponse.json({ error: "Invalid task ID." }, { status: 400 });
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "You must be logged in to update tasks." }, { status: 401 });
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const validation = updateTaskSchema.safeParse(body);
  if (!validation.success) {
    const firstError = validation.error.issues[0]?.message ?? "Invalid input.";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const updates = validation.data;

  // Trim title if provided
  if (updates.title !== undefined) {
    updates.title = updates.title.trim();
  }

  // Ensure at least one field is being updated
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  // RLS ensures user_id = auth.uid(), so we don't need an explicit user_id filter,
  // but we add it for defense-in-depth.
  const { data: task, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    // PGRST116 = no rows returned (not found or not owned by user)
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update task." }, { status: 500 });
  }

  return NextResponse.json({ task });
}

/**
 * DELETE /api/tasks/[id] — Delete a task.
 * RLS ensures the user can only delete their own tasks.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isValidOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (await isTaskRateLimited(getClientIp(request), "DELETE /api/tasks/[id]")) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  // Validate task ID format
  const idValidation = uuidSchema.safeParse(id);
  if (!idValidation.success) {
    return NextResponse.json({ error: "Invalid task ID." }, { status: 400 });
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "You must be logged in to delete tasks." }, { status: 401 });
  }

  // RLS scopes to user's own tasks; defense-in-depth with user_id filter.
  // Use .select() to detect whether a row was actually deleted.
  const { data: deleted, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    return NextResponse.json({ error: "Failed to delete task." }, { status: 500 });
  }

  if (!deleted || deleted.length === 0) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
