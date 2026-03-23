import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { profileSchema } from "@/lib/validations/profile";
import { isProfileRateLimited, getClientIp } from "@/lib/rate-limit";

/**
 * PATCH /api/profile — Update user display name
 */
export async function PATCH(request: NextRequest) {
  if (isProfileRateLimited(getClientIp(request))) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "You must be logged in to update your profile." },
      { status: 401 }
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

  const validation = profileSchema.safeParse(body);
  if (!validation.success) {
    const firstError = validation.error.issues[0]?.message ?? "Invalid input.";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  const { displayName } = validation.data;

  // Update the profiles table
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json(
      { error: "Failed to update profile. Please try again." },
      { status: 500 }
    );
  }

  // Also update auth user metadata so the display name is available
  // immediately in the session without re-fetching profiles
  const { error: metaError } = await supabase.auth.updateUser({
    data: { display_name: displayName },
  });

  if (metaError) {
    // Non-critical — profile table was updated, metadata sync failed
    console.error("Failed to sync display_name to user metadata:", metaError);
  }

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/profile — Delete user account and all associated data (GDPR)
 */
export async function DELETE(request: NextRequest) {
  if (isProfileRateLimited(getClientIp(request))) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "You must be logged in to delete your account." },
      { status: 401 }
    );
  }

  const userId = user.id;

  // 1. Delete avatar files from storage (best-effort cleanup)
  try {
    const { data: avatarFiles } = await supabase.storage
      .from("avatars")
      .list(userId);

    if (avatarFiles && avatarFiles.length > 0) {
      const filePaths = avatarFiles.map((f) => `${userId}/${f.name}`);
      await supabase.storage.from("avatars").remove(filePaths);
    }
  } catch {
    // Storage cleanup is best-effort; user deletion will proceed
    console.error("Failed to clean up avatar storage for user:", userId);
  }

  // 2. Delete the user from auth.users using the service role key.
  //    The ON DELETE CASCADE on profiles.id will automatically remove
  //    the profile row and any future foreign-keyed data (GDPR compliance).
  const adminClient = createAdminClient();
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(
    userId
  );

  if (deleteError) {
    return NextResponse.json(
      { error: "Failed to delete account. Please try again or contact support." },
      { status: 500 }
    );
  }

  // 3. Sign out the current session (clear cookies)
  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
