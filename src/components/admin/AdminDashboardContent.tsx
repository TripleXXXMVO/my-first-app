"use client";

import { useAdminStats } from "@/hooks/use-admin";
import { AdminStatsGrid } from "@/components/admin/AdminStatsGrid";
import { AdminAuditLog } from "@/components/admin/AdminAuditLog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export function AdminDashboardContent() {
  const { stats, auditLog, loading, error } = useAdminStats();

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertDescription className="font-body">{error}</AlertDescription>
        </Alert>
      )}

      <AdminStatsGrid stats={stats} loading={loading} />

      <AdminAuditLog
        entries={auditLog}
        loading={loading}
        title="Recent Activity"
        maxHeight="h-[500px]"
      />
    </div>
  );
}
