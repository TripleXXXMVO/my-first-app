"use client";

import Link from "next/link";
import { format } from "date-fns";
import type { AdminUser } from "@/lib/admin";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";

interface AdminUserTableProps {
  users: AdminUser[];
  loading?: boolean;
}

function PlanBadge({ plan }: { plan: string }) {
  return (
    <Badge
      variant="secondary"
      className={
        plan === "pro"
          ? "bg-amber-100 font-body text-xs font-medium text-amber-700"
          : "bg-gray-100 font-body text-xs font-medium text-gray-600"
      }
    >
      {plan === "pro" ? "Pro" : "Free"}
    </Badge>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block size-2 rounded-full ${active ? "bg-emerald-500" : "bg-red-400"}`}
      aria-label={active ? "Active" : "Deactivated"}
    />
  );
}

export function AdminUserTable({ users, loading }: AdminUserTableProps) {
  if (loading) {
    return <AdminUserTableSkeleton />;
  }

  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-[#DAC0FF]/30 bg-white px-6 py-16 text-center shadow-sm">
        <p className="font-body text-sm text-[#767676]">
          No users found matching your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#DAC0FF]/30 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-b-[#DAC0FF]/20 hover:bg-transparent">
            <TableHead className="font-body text-xs font-medium uppercase tracking-wider text-[#6b6b6b]">
              User
            </TableHead>
            <TableHead className="hidden font-body text-xs font-medium uppercase tracking-wider text-[#6b6b6b] sm:table-cell">
              Plan
            </TableHead>
            <TableHead className="hidden font-body text-xs font-medium uppercase tracking-wider text-[#6b6b6b] md:table-cell">
              Status
            </TableHead>
            <TableHead className="hidden font-body text-xs font-medium uppercase tracking-wider text-[#6b6b6b] lg:table-cell">
              Joined
            </TableHead>
            <TableHead className="hidden font-body text-xs font-medium uppercase tracking-wider text-[#6b6b6b] lg:table-cell">
              Last Login
            </TableHead>
            <TableHead className="w-[40px]">
              <span className="sr-only">View</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function UserRow({ user }: { user: AdminUser }) {
  const initials = user.display_name
    ? user.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email[0]?.toUpperCase() ?? "U";

  return (
    <TableRow className="border-b-[#DAC0FF]/10 hover:bg-[#F6F0FF]/40">
      <TableCell>
        <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3">
          <Avatar className="size-8 shrink-0">
            <AvatarImage src={user.avatar_url ?? undefined} alt={user.display_name ?? user.email} />
            <AvatarFallback className="bg-[#DAC0FF] text-xs font-medium text-[#292673]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-body text-sm font-medium text-[#222222]">
              {user.display_name ?? "No name"}
            </p>
            <p className="truncate font-body text-xs text-[#767676]">
              {user.email}
            </p>
            {/* Mobile-only info */}
            <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:hidden">
              <PlanBadge plan={user.plan} />
              <StatusDot active={user.is_active} />
            </div>
          </div>
        </Link>
      </TableCell>

      <TableCell className="hidden sm:table-cell">
        <PlanBadge plan={user.plan} />
      </TableCell>

      <TableCell className="hidden md:table-cell">
        <div className="flex items-center gap-2">
          <StatusDot active={user.is_active} />
          <span className="font-body text-sm text-[#6b6b6b]">
            {user.is_active ? "Active" : "Deactivated"}
          </span>
        </div>
      </TableCell>

      <TableCell className="hidden lg:table-cell">
        <span className="font-body text-sm text-[#6b6b6b]">
          {format(new Date(user.created_at), "MMM d, yyyy")}
        </span>
      </TableCell>

      <TableCell className="hidden lg:table-cell">
        <span className="font-body text-sm text-[#6b6b6b]">
          {user.last_sign_in_at
            ? format(new Date(user.last_sign_in_at), "MMM d, yyyy")
            : "Never"}
        </span>
      </TableCell>

      <TableCell>
        <Link
          href={`/admin/users/${user.id}`}
          className="text-[#5b57a2] hover:text-[#292673]"
          aria-label={`View details for ${user.display_name ?? user.email}`}
        >
          <ChevronRight className="size-4" />
        </Link>
      </TableCell>
    </TableRow>
  );
}

function AdminUserTableSkeleton() {
  return (
    <div className="rounded-lg border border-[#DAC0FF]/30 bg-white p-4 shadow-sm">
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="hidden h-5 w-14 rounded-full sm:block" />
            <Skeleton className="hidden h-4 w-16 md:block" />
            <Skeleton className="hidden h-4 w-24 lg:block" />
            <Skeleton className="hidden h-4 w-24 lg:block" />
            <Skeleton className="size-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
