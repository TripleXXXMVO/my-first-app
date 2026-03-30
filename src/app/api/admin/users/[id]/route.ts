import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminRateLimited, getClientIp } from "@/lib/rate-limit";
import { userIdSchema, updateUserSchema } from "@/lib/validations/admin";

/**
 * GET /api/admin/users/[id] — Fetch a single user's details + their audit log.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (isAdminRateLimited(getClientIp(request), "GET /api/admin/users/[id]")) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  // Validate user ID format
  const idValidation = userIdSchema.safeParse(id);
  if (!idValidation.success) {
    return NextResponse.json({ error: "Invalid user ID." }, { status: 400 });
  }

  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { supabase } = auth;

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, display_name, avatar_url, role, is_active, created_at")
    .eq("id", id)
    .single();

  if (profileError) {
    if (profileError.code === "PGRST116") {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to load user." },
      { status: 500 }
    );
  }

  // Fetch active subscription to determine plan
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  const plan = subscription?.plan ?? "free";

  // Fetch audit log entries for this user
  const { data: auditLogs } = await supabase
    .from("admin_audit_log")
    .select("*")
    .eq("target_user_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Resolve admin emails for audit log entries
  const adminIds = new Set<string>();
  if (auditLogs) {
    for (const log of auditLogs) {
      if (log.admin_id) adminIds.add(log.admin_id);
    }
  }

  const emailMap = new Map<string, string>();
  if (adminIds.size > 0) {
    const { data: adminProfiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", Array.from(adminIds));

    if (adminProfiles) {
      for (const p of adminProfiles) {
        emailMap.set(p.id, p.email);
      }
    }
  }

  const enrichedAuditLog = (auditLogs ?? []).map((log) => ({
    ...log,
    admin_email: emailMap.get(log.admin_id) ?? null,
    target_user_email: profile.email,
  }));

  return NextResponse.json({
    id: profile.id,
    email: profile.email,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    role: profile.role,
    plan,
    is_active: profile.is_active,
    created_at: profile.created_at,
    last_sign_in_at: null,
    audit_log: enrichedAuditLog,
  });
}

/**
 * PATCH /api/admin/users/[id] — Update a user's plan or active status.
 * Checks for active Stripe subscription before plan change and returns a warning.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (isAdminRateLimited(getClientIp(request), "PATCH /api/admin/users/[id]")) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  // Validate user ID
  const idValidation = userIdSchema.safeParse(id);
  if (!idValidation.success) {
    return NextResponse.json({ error: "Invalid user ID." }, { status: 400 });
  }

  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { adminId, supabase } = auth;

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const validation = updateUserSchema.safeParse(body);
  if (!validation.success) {
    const firstError =
      validation.error.issues[0]?.message ?? "Invalid input.";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const updates = validation.data;

  // Verify target user exists
  const { data: targetProfile, error: targetErr } = await supabase
    .from("profiles")
    .select("id, email, is_active")
    .eq("id", id)
    .single();

  if (targetErr || !targetProfile) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  // If changing plan, check for active Stripe subscription
  if (updates.plan !== undefined) {
    const { data: activeSub } = await supabase
      .from("subscriptions")
      .select("id, plan, status, stripe_subscription_id")
      .eq("user_id", id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (activeSub && activeSub.stripe_subscription_id) {
      return NextResponse.json(
        {
          error:
            "This user has an active Stripe subscription. Cancel it in Stripe first before manually changing the plan.",
          warning: true,
          stripe_subscription_id: activeSub.stripe_subscription_id,
        },
        { status: 409 }
      );
    }

    // If no active Stripe subscription, update the subscription record or create one
    if (activeSub) {
      // Update existing subscription plan
      await supabase
        .from("subscriptions")
        .update({ plan: updates.plan })
        .eq("id", activeSub.id);
    } else {
      // Create a new subscription record (manual override by admin)
      await supabase.from("subscriptions").insert({
        user_id: id,
        plan: updates.plan,
        status: "active",
      });
    }

    // Log the plan change
    await supabase.from("admin_audit_log").insert({
      admin_id: adminId,
      action: "changed_plan",
      target_user_id: id,
      metadata: {
        new_plan: updates.plan,
      },
    });
  }

  // If changing active status
  if (updates.is_active !== undefined) {
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ is_active: updates.is_active })
      .eq("id", id);

    if (updateErr) {
      return NextResponse.json(
        { error: "Failed to update user status." },
        { status: 500 }
      );
    }

    // Log the status change
    const action = updates.is_active ? "activated_user" : "deactivated_user";
    await supabase.from("admin_audit_log").insert({
      admin_id: adminId,
      action,
      target_user_id: id,
      metadata: {
        is_active: updates.is_active,
      },
    });
  }

  // Fetch updated user to return
  const { data: updatedProfile } = await supabase
    .from("profiles")
    .select("id, email, display_name, avatar_url, role, is_active, created_at")
    .eq("id", id)
    .single();

  const { data: updatedSub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    id: updatedProfile?.id,
    email: updatedProfile?.email,
    display_name: updatedProfile?.display_name,
    avatar_url: updatedProfile?.avatar_url,
    role: updatedProfile?.role,
    plan: updatedSub?.plan ?? "free",
    is_active: updatedProfile?.is_active,
    created_at: updatedProfile?.created_at,
    last_sign_in_at: null,
  });
}

/**
 * DELETE /api/admin/users/[id] — Permanently delete a user.
 * Removes from both auth.users (via admin client) and profiles (cascade).
 * Blocks admins from deleting their own account.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (isAdminRateLimited(getClientIp(request), "DELETE /api/admin/users/[id]")) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  // Validate user ID
  const idValidation = userIdSchema.safeParse(id);
  if (!idValidation.success) {
    return NextResponse.json({ error: "Invalid user ID." }, { status: 400 });
  }

  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { adminId, supabase } = auth;

  // Block self-deletion
  if (adminId === id) {
    return NextResponse.json(
      { error: "You cannot delete your own admin account." },
      { status: 400 }
    );
  }

  // Verify target user exists and capture email for audit log
  const { data: targetProfile, error: targetErr } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("id", id)
    .single();

  if (targetErr || !targetProfile) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  // Log the deletion BEFORE deleting (so we have the target_user_id reference)
  await supabase.from("admin_audit_log").insert({
    admin_id: adminId,
    action: "deleted_user",
    target_user_id: id,
    metadata: {
      deleted_email: targetProfile.email,
    },
  });

  // Hard delete: remove from auth.users using service role key.
  // ON DELETE CASCADE on profiles will remove the profile row automatically.
  const adminClient = createAdminClient();
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(id);

  if (deleteError) {
    return NextResponse.json(
      { error: "Failed to delete user. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
