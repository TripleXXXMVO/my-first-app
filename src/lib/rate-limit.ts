import { type NextRequest } from "next/server";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

const profileRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const PROFILE_RATE_LIMIT_MAX = 30;

export function isProfileRateLimited(ip: string, endpoint: string): boolean {
  const now = Date.now();
  for (const [key, val] of profileRateLimitMap) {
    if (now > val.resetAt) profileRateLimitMap.delete(key);
  }
  const key = `${ip}:${endpoint}`;
  const entry = profileRateLimitMap.get(key);
  if (!entry) {
    profileRateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > PROFILE_RATE_LIMIT_MAX;
}

export function isRateLimited(ip: string): boolean {
  const now = Date.now();

  // Purge all expired entries to prevent unbounded memory growth
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }

  const entry = rateLimitMap.get(ip);
  if (!entry) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

export function getClientIp(request: NextRequest): string {
  // request.ip is set by Next.js/Vercel to the verified real client IP
  const reqIp = (request as NextRequest & { ip?: string }).ip;
  if (reqIp) return reqIp;
  // Fallback: take the last IP in x-forwarded-for (rightmost = added by the outermost trusted proxy)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((s) => s.trim()).filter(Boolean);
    return ips[ips.length - 1] ?? "unknown";
  }
  return "unknown";
}
