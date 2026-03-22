import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";

const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

// Routes rate-limited to 10 POST requests per IP per 15 minutes
// NOTE: in-memory store — for multi-instance deployments replace with Redis
const AUTH_POST_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/resend",
  "/api/auth/reset-password",
];

export async function proxy(request: NextRequest) {
  // Rate limit auth POST routes
  if (
    request.method === "POST" &&
    AUTH_POST_ROUTES.some((route) => request.nextUrl.pathname.startsWith(route))
  ) {
    const ip = getClientIp(request);
    if (isRateLimited(ip)) {
      return new NextResponse("Too many requests. Please try again later.", {
        status: 429,
        headers: { "Retry-After": "900" },
      });
    }
  }

  // Skip auth check if Supabase env vars are not configured (e.g., during build)
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // If user is authenticated and tries to access a public auth route, redirect to dashboard
  if (user && publicRoutes.some((route) => pathname.startsWith(route))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // If user is NOT authenticated and tries to access a protected route, redirect to login
  if (
    !user &&
    !publicRoutes.some((route) => pathname.startsWith(route)) &&
    !pathname.startsWith("/api/auth") &&
    pathname !== "/"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
