import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isProfileRateLimited, getClientIp } from "@/lib/rate-limit";
import { avatarStorageKey } from "@/lib/utils";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png"];

/**
 * POST /api/profile/avatar — Upload or replace the user's avatar image
 */
export async function POST(request: NextRequest) {
  if (await isProfileRateLimited(getClientIp(request), "POST /api/profile/avatar")) {
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
      { error: "You must be logged in to upload an avatar." },
      { status: 401 }
    );
  }

  // Parse multipart form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data." },
      { status: 400 }
    );
  }

  const file = formData.get("avatar");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "No avatar file provided." },
      { status: 400 }
    );
  }

  // Server-side validation (never trust client alone)
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPG and PNG images are accepted." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Image must be smaller than 2MB." },
      { status: 400 }
    );
  }

  // Determine file extension from MIME type
  const ext = file.type === "image/png" ? "png" : "jpg";
  const storageKey = avatarStorageKey(user.id);
  const filePath = `${storageKey}/avatar.${ext}`;

  // Upload to Supabase Storage (upsert replaces previous avatar)
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: "Failed to upload avatar. Please try again." },
      { status: 500 }
    );
  }

  // Remove the other format to avoid orphaned files (e.g. old avatar.png when new upload is .jpg)
  const otherExt = ext === "png" ? "jpg" : "png";
  await supabase.storage.from("avatars").remove([`${storageKey}/avatar.${otherExt}`]);
  // (ignore errors — the other format may simply not exist)

  // Get public URL for the uploaded avatar
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(filePath);

  // Update the profile record with the avatar URL
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (profileError) {
    console.error("Failed to save avatar URL to profile:", profileError);
    // Non-critical: the file was uploaded, URL update can be retried
  }

  // Also sync avatar_url to auth user metadata
  const { error: metaError } = await supabase.auth.updateUser({
    data: { avatar_url: publicUrl },
  });

  if (metaError) {
    console.error("Failed to sync avatar_url to user metadata:", metaError);
  }

  return NextResponse.json({ success: true, avatarUrl: publicUrl });
}
