// Admin types and API utilities for PROJ-5

export type UserRole = "user" | "admin";
export type UserPlan = "free" | "pro";

export interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  plan: UserPlan;
  is_active: boolean;
  created_at: string;
  last_sign_in_at: string | null;
}

export interface AdminStats {
  totalUsers: number;
  newThisWeek: number;
  freeUsers: number;
  proUsers: number;
}

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  admin_email?: string;
  action: string;
  target_user_id: string;
  target_user_email?: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminUserFilters {
  search: string;
  plan: UserPlan | "all";
  page: number;
}

export const ADMIN_USERS_PER_PAGE = 50;

/**
 * Fetch admin dashboard stats.
 */
export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await fetch("/api/admin/stats");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to load admin stats.");
  }
  return res.json();
}

/**
 * Fetch paginated + filtered user list.
 */
export async function fetchAdminUsers(
  filters: AdminUserFilters
): Promise<{ users: AdminUser[]; total: number }> {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.plan !== "all") params.set("plan", filters.plan);
  params.set("page", String(filters.page));

  const res = await fetch(`/api/admin/users?${params.toString()}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to load users.");
  }
  return res.json();
}

/**
 * Fetch a single user by ID.
 */
export async function fetchAdminUser(
  id: string
): Promise<AdminUser & { audit_log: AuditLogEntry[] }> {
  const res = await fetch(`/api/admin/users/${id}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to load user.");
  }
  return res.json();
}

/**
 * Update a user (change plan or deactivate).
 */
export async function updateAdminUser(
  id: string,
  data: { plan?: UserPlan; is_active?: boolean }
): Promise<AdminUser> {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to update user.");
  }
  return res.json();
}

/**
 * Permanently delete a user.
 */
export async function deleteAdminUser(id: string): Promise<void> {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to delete user.");
  }
}

/**
 * Fetch recent audit log entries (for the admin dashboard).
 */
export async function fetchRecentAuditLog(): Promise<AuditLogEntry[]> {
  const res = await fetch("/api/admin/stats?include=audit_log");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to load audit log.");
  }
  const json = await res.json();
  return json.auditLog ?? [];
}

/**
 * Format an audit log action into a human-readable string.
 */
export function formatAuditAction(action: string): string {
  const map: Record<string, string> = {
    changed_plan: "Changed plan",
    deactivated_user: "Deactivated user",
    activated_user: "Activated user",
    deleted_user: "Deleted user",
    changed_role: "Changed role",
  };
  return map[action] ?? action;
}

/**
 * Change a user's role (admin endpoint).
 */
export async function updateAdminUserRole(
  id: string,
  role: UserRole
): Promise<{ role: UserRole; message: string }> {
  const res = await fetch(`/api/admin/users/${id}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to update user role.");
  }
  return res.json();
}
