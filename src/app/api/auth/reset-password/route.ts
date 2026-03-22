import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { password } = body;
  if (!password) {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
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

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("expired") || msg.includes("invalid") || msg.includes("token")) {
      return NextResponse.json(
        { error: "This reset link has expired or is invalid. Please request a new one." },
        { status: 401 }
      );
    }
    if (msg.includes("same password") || msg.includes("different")) {
      return NextResponse.json(
        { error: "Your new password must be different from your current password." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Something went wrong. Please try again or request a new reset link." },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
