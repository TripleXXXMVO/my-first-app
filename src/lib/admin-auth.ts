import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

interface AdminAuthResult {
  adminId: string;
  supabase: SupabaseClient;
}

/**
 * Verify the current user is authenticated AND has the admin role.
 * Returns { adminId, supabase } on success, or a NextResponse error on failure.
 */
export async function requireAdmin(): Promise<AdminAuthResult | NextResponse> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  // Check admin role from profiles table (defence in depth — not trusting JWT claims)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden. Admin access required." },
      { status: 403 }
    );
  }

  return { adminId: user.id, supabase };
}
