import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { isAdminRateLimited, getClientIp } from "@/lib/rate-limit";
import { userIdSchema, updateUserRoleSchema } from "@/lib/validations/admin";

/**
 * PATCH /api/admin/users/[id]/role — Change a user's role (user <-> admin).
 * Only admins can promote or demote other users.
 * An admin cannot change their own role (to prevent accidental lockout).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (isAdminRateLimited(getClientIp(request), "PATCH /api/admin/users/[id]/role")) {
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

  // Block self-role-change to prevent accidental lockout
  if (adminId === id) {
    return NextResponse.json(
      { error: "You cannot change your own role. Ask another admin." },
      { status: 400 }
    );
  }

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

  const validation = updateUserRoleSchema.safeParse(body);
  if (!validation.success) {
    const firstError =
      validation.error.issues[0]?.message ?? "Invalid input.";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { role } = validation.data;

  // Verify target user exists
  const { data: targetProfile, error: targetErr } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", id)
    .single();

  if (targetErr || !targetProfile) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  // Skip if role is already the same
  if (targetProfile.role === role) {
    return NextResponse.json({
      message: `User already has the '${role}' role.`,
      role,
    });
  }

  // Update the role
  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json(
      { error: "Failed to update user role." },
      { status: 500 }
    );
  }

  // Log the role change
  await supabase.from("admin_audit_log").insert({
    admin_id: adminId,
    action: "changed_role",
    target_user_id: id,
    metadata: {
      old_role: targetProfile.role,
      new_role: role,
    },
  });

  return NextResponse.json({
    message: `Role changed to '${role}'.`,
    role,
  });
}
