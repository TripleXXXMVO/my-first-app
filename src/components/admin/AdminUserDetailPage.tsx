"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft,
  AlertTriangle,
  Shield,
  Mail,
  Calendar,
  Clock,
} from "lucide-react";
import { useAdminUserDetail } from "@/hooks/use-admin";
import type { UserPlan } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AdminAuditLog } from "@/components/admin/AdminAuditLog";
import Link from "next/link";

interface AdminUserDetailPageProps {
  userId: string;
}

export function AdminUserDetailPage({ userId }: AdminUserDetailPageProps) {
  const router = useRouter();
  const { user, auditLog, loading, error, changePlan, toggleActive, removeUser } =
    useAdminUserDetail(userId);
  const [planChanging, setPlanChanging] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="mb-4 size-10 text-red-400" />
        <p className="font-body text-sm text-red-600">
          {error ?? "User not found."}
        </p>
        <Button variant="outline" className="mt-4 font-body" asChild>
          <Link href="/admin/users">Back to Users</Link>
        </Button>
      </div>
    );
  }

  const initials = user.display_name
    ? user.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email[0]?.toUpperCase() ?? "U";

  async function handlePlanChange(newPlan: string) {
    setPlanChanging(true);
    try {
      await changePlan(newPlan as UserPlan);
      toast.success(`Plan changed to ${newPlan}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change plan.");
    } finally {
      setPlanChanging(false);
    }
  }

  async function handleToggleActive(checked: boolean) {
    setStatusChanging(true);
    try {
      await toggleActive(checked);
      toast.success(checked ? "User activated." : "User deactivated.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update status."
      );
    } finally {
      setStatusChanging(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await removeUser();
      toast.success("User permanently deleted.");
      router.push("/admin/users");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete user."
      );
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Button variant="ghost" size="sm" className="font-body text-[#5b57a2]" asChild>
        <Link href="/admin/users">
          <ArrowLeft className="mr-1 size-4" />
          Back to Users
        </Link>
      </Button>

      {/* User Info Card */}
      <Card className="border-[#DAC0FF]/30 shadow-sm">
        <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
          <Avatar className="size-16 shrink-0">
            <AvatarImage
              src={user.avatar_url ?? undefined}
              alt={user.display_name ?? user.email}
            />
            <AvatarFallback className="bg-[#DAC0FF] text-lg font-semibold text-[#292673]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-xl font-bold text-[#222222]">
                {user.display_name ?? "No display name"}
              </h2>
              {user.role === "admin" && (
                <Badge className="bg-[#292673] font-body text-xs text-white">
                  <Shield className="mr-1 size-3" />
                  Admin
                </Badge>
              )}
              {!user.is_active && (
                <Badge variant="destructive" className="font-body text-xs">
                  Deactivated
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 font-body text-sm text-[#6b6b6b]">
              <span className="flex items-center gap-1">
                <Mail className="size-3.5" aria-hidden="true" />
                {user.email}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5" aria-hidden="true" />
                Joined {format(new Date(user.created_at), "MMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" aria-hidden="true" />
                Last login:{" "}
                {user.last_sign_in_at
                  ? format(new Date(user.last_sign_in_at), "MMM d, yyyy")
                  : "Never"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Plan Section */}
        <Card className="border-[#DAC0FF]/30 shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-base font-semibold text-[#292673]">
              Subscription Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="font-body text-sm text-[#6b6b6b]">Current plan:</span>
              <Badge
                variant="secondary"
                className={
                  user.plan === "pro"
                    ? "bg-amber-100 font-body text-xs text-amber-700"
                    : "bg-gray-100 font-body text-xs text-gray-600"
                }
              >
                {user.plan === "pro" ? "Pro" : "Free"}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="plan-select" className="font-body text-sm text-[#6b6b6b]">
                Change to:
              </Label>
              <Select
                value={user.plan}
                onValueChange={handlePlanChange}
                disabled={planChanging}
              >
                <SelectTrigger id="plan-select" className="w-[120px] font-body text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                </SelectContent>
              </Select>
              {planChanging && (
                <span className="font-body text-xs text-[#767676]">Saving...</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Status Section */}
        <Card className="border-[#DAC0FF]/30 shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-base font-semibold text-[#292673]">
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="active-toggle" className="font-body text-sm font-medium text-[#222222]">
                  Account active
                </Label>
                <p className="font-body text-xs text-[#767676]">
                  {user.is_active
                    ? "User can sign in normally."
                    : "User cannot sign in. Login is blocked."}
                </p>
              </div>
              <Switch
                id="active-toggle"
                checked={user.is_active}
                onCheckedChange={handleToggleActive}
                disabled={statusChanging}
                aria-label="Toggle account active status"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log */}
      <AdminAuditLog
        entries={auditLog}
        title="Actions on This User"
        maxHeight="h-[300px]"
      />

      {/* Danger Zone */}
      <Card className="border-red-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-base font-semibold text-red-700">
            <AlertTriangle className="size-5" aria-hidden="true" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 font-body text-sm text-[#6b6b6b]">
            Permanently delete this user and all their data. This action cannot be undone.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="border-red-300 font-body text-sm font-medium text-red-700 hover:bg-red-50 hover:text-red-800"
              >
                Delete user permanently
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-heading">
                  Delete this user?
                </AlertDialogTitle>
                <AlertDialogDescription className="font-body">
                  This will permanently remove{" "}
                  <span className="font-semibold">{user.email}</span> and all
                  their data (tasks, profile, subscription). This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="font-body">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 font-body hover:bg-red-700"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete permanently"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <Card className="border-[#DAC0FF]/30 shadow-sm">
        <CardContent className="flex items-center gap-4 p-6">
          <Skeleton className="size-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-[#DAC0FF]/30 shadow-sm">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-9 w-32" />
          </CardContent>
        </Card>
        <Card className="border-[#DAC0FF]/30 shadow-sm">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-6 w-12" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
