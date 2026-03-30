"use client";

import { useState, useEffect, useCallback } from "react";
import {
  type AdminUser,
  type AdminStats,
  type AdminUserFilters,
  type AuditLogEntry,
  fetchAdminStats,
  fetchAdminUsers,
  fetchAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from "@/lib/admin";

const DEFAULT_FILTERS: AdminUserFilters = {
  search: "",
  plan: "all",
  page: 1,
};

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/admin/stats?include=audit_log");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to load admin stats.");
      }
      const data = await res.json();
      setStats({
        totalUsers: data.totalUsers,
        newThisWeek: data.newThisWeek,
        freeUsers: data.freeUsers,
        proUsers: data.proUsers,
      });
      setAuditLog(data.auditLog ?? []);
    } catch (err) {
      console.error("Failed to load admin stats:", err);
      setError(err instanceof Error ? err.message : "Failed to load stats.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { stats, auditLog, loading, error, refresh: loadStats };
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<AdminUserFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const result = await fetchAdminUsers(filters);
      setUsers(result.users);
      setTotal(result.total);
    } catch (err) {
      console.error("Failed to load users:", err);
      setError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const updateFilters = useCallback((partial: Partial<AdminUserFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...partial,
      page: partial.page ?? 1,
    }));
  }, []);

  return { users, total, filters, loading, error, updateFilters, refresh: loadUsers };
}

export function useAdminUserDetail(userId: string) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await fetchAdminUser(userId);
      const { audit_log, ...userData } = data;
      setUser(userData);
      setAuditLog(audit_log ?? []);
    } catch (err) {
      console.error("Failed to load user:", err);
      setError(err instanceof Error ? err.message : "Failed to load user.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const changePlan = useCallback(
    async (plan: "free" | "pro") => {
      const updated = await updateAdminUser(userId, { plan });
      setUser(updated);
      await loadUser();
    },
    [userId, loadUser]
  );

  const toggleActive = useCallback(
    async (is_active: boolean) => {
      const updated = await updateAdminUser(userId, { is_active });
      setUser(updated);
      await loadUser();
    },
    [userId, loadUser]
  );

  const removeUser = useCallback(async () => {
    await deleteAdminUser(userId);
  }, [userId]);

  return {
    user,
    auditLog,
    loading,
    error,
    changePlan,
    toggleActive,
    removeUser,
    refresh: loadUser,
  };
}
