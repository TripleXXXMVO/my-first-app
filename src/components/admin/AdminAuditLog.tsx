"use client";

import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList } from "lucide-react";
import { type AuditLogEntry, formatAuditAction } from "@/lib/admin";

interface AdminAuditLogProps {
  entries: AuditLogEntry[];
  loading?: boolean;
  title?: string;
  maxHeight?: string;
}

const actionColors: Record<string, string> = {
  changed_plan: "bg-blue-100 text-blue-700",
  changed_role: "bg-violet-100 text-violet-700",
  deactivated_user: "bg-amber-100 text-amber-700",
  activated_user: "bg-emerald-100 text-emerald-700",
  deleted_user: "bg-red-100 text-red-700",
};

export function AdminAuditLog({
  entries,
  loading,
  title = "Recent Activity",
  maxHeight = "h-[400px]",
}: AdminAuditLogProps) {
  if (loading) {
    return (
      <Card className="border-[#DAC0FF]/30 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-base font-semibold text-[#292673]">
            <ClipboardList className="size-5" aria-hidden="true" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-5 w-24 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[#DAC0FF]/30 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-heading text-base font-semibold text-[#292673]">
          <ClipboardList className="size-5" aria-hidden="true" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="py-8 text-center font-body text-sm text-[#767676]">
            No activity recorded yet.
          </p>
        ) : (
          <ScrollArea className={maxHeight}>
            <div className="space-y-4 pr-4">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col gap-1 border-b border-[#DAC0FF]/10 pb-3 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`font-body text-xs ${actionColors[entry.action] ?? "bg-gray-100 text-gray-700"}`}
                    >
                      {formatAuditAction(entry.action)}
                    </Badge>
                    <span className="font-body text-xs text-[#767676]">
                      {format(new Date(entry.created_at), "MMM d, yyyy HH:mm")}
                    </span>
                  </div>
                  <p className="font-body text-sm text-[#222222]">
                    {entry.target_user_email && (
                      <span className="font-medium">{entry.target_user_email}</span>
                    )}
                    {entry.metadata && (entry.metadata as Record<string, string>).old_plan && (
                      <span className="text-[#6b6b6b]">
                        {" "}
                        &mdash; {(entry.metadata as Record<string, string>).old_plan} &rarr;{" "}
                        {(entry.metadata as Record<string, string>).new_plan}
                      </span>
                    )}
                  </p>
                  {entry.admin_email && (
                    <p className="font-body text-xs text-[#767676]">
                      by {entry.admin_email}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
