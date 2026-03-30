import { type NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Shared window: 15 minutes
const WINDOW_MS = 15 * 60 * 1000;
const WINDOW = "15 m" as const;

// ─── Upstash Redis (persistent across restarts & instances) ─────────────────
// Activated when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set.
// Falls back to in-memory when not configured (local dev / single-instance).

function buildLimiter(maxRequests: number, prefix: string): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(maxRequests, WINDOW),
    prefix: `rl:${prefix}`,
  });
}

// Lazily initialised so process.env is read at request time, not module load
let _authLimiter: Ratelimit | null | undefined;
let _profileLimiter: Ratelimit | null | undefined;
let _taskLimiter: Ratelimit | null | undefined;
let _adminLimiter: Ratelimit | null | undefined;

const getAuthLimiter = () => (_authLimiter ??= buildLimiter(10, "auth"));
const getProfileLimiter = () => (_profileLimiter ??= buildLimiter(30, "profile"));
const getTaskLimiter = () => (_taskLimiter ??= buildLimiter(60, "task"));
const getAdminLimiter = () => (_adminLimiter ??= buildLimiter(60, "admin"));

// ─── In-memory fallback ──────────────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const profileRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const taskRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const adminRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkInMemory(
  map: Map<string, { count: number; resetAt: number }>,
  key: string,
  max: number
): boolean {
  const now = Date.now();
  for (const [k, v] of map) {
    if (now > v.resetAt) map.delete(k);
  }
  const entry = map.get(key);
  if (!entry) {
    map.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > max;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function isRateLimited(ip: string): Promise<boolean> {
  const limiter = getAuthLimiter();
  if (limiter) {
    const { success } = await limiter.limit(ip);
    return !success;
  }
  return checkInMemory(rateLimitMap, ip, 10);
}

export async function isProfileRateLimited(
  ip: string,
  endpoint: string
): Promise<boolean> {
  const limiter = getProfileLimiter();
  const key = `${ip}:${endpoint}`;
  if (limiter) {
    const { success } = await limiter.limit(key);
    return !success;
  }
  return checkInMemory(profileRateLimitMap, key, 30);
}

export async function isTaskRateLimited(
  ip: string,
  endpoint: string
): Promise<boolean> {
  const limiter = getTaskLimiter();
  const key = `${ip}:${endpoint}`;
  if (limiter) {
    const { success } = await limiter.limit(key);
    return !success;
  }
  return checkInMemory(taskRateLimitMap, key, 60);
}

export async function isAdminRateLimited(
  ip: string,
  endpoint: string
): Promise<boolean> {
  const limiter = getAdminLimiter();
  const key = `${ip}:${endpoint}`;
  if (limiter) {
    const { success } = await limiter.limit(key);
    return !success;
  }
  return checkInMemory(adminRateLimitMap, key, 60);
}

export function getClientIp(request: NextRequest): string {
  const reqIp = (request as NextRequest & { ip?: string }).ip;
  if (reqIp) return reqIp;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((s) => s.trim()).filter(Boolean);
    return ips[ips.length - 1] ?? "unknown";
  }
  return "unknown";
}
