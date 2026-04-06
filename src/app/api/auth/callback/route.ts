import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function getSafeRedirectPath(next: string | null): string {
  if (!next) return "/dashboard";
  // Only allow relative paths starting with / and no protocol
  if (next.startsWith("/") && !next.startsWith("//") && !next.includes(":")) {
    return next;
  }
  return "/dashboard";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = getSafeRedirectPath(searchParams.get("next"));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  // Email confirmation / magic link (token_hash + type)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as EmailOtpType,
    });
    if (!error) {
      // Add ?verified=1 so the dashboard can show a success message
      const redirectPath = type === "signup" ? `${next}?verified=1` : next;
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  // OAuth / PKCE flow (code)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Fallback: redirect to login with error indicator
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
