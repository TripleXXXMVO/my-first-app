import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }

  let body: { email?: string; redirectTo?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { email, redirectTo } = body;
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }
  if (redirectTo) {
    try {
      const parsed = new URL(redirectTo);
      if (!parsed.pathname.startsWith("/api/auth/callback")) {
        return NextResponse.json({ error: "Invalid redirect URL." }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid redirect URL." }, { status: 400 });
    }
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, key, {
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

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    return NextResponse.json(
      { error: "Could not resend the email. Please try again." },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
