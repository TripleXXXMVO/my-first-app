"use client";

import { Users, UserPlus, CreditCard, Gift } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminStats } from "@/lib/admin";

interface AdminStatsGridProps {
  stats: AdminStats | null;
  loading?: boolean;
}

const statCards = [
  {
    key: "totalUsers" as const,
    label: "Total Users",
    subtitle: "registered accounts",
    icon: Users,
    iconColor: "text-[#B580FF]",
  },
  {
    key: "newThisWeek" as const,
    label: "New This Week",
    subtitle: "signups in the last 7 days",
    icon: UserPlus,
    iconColor: "text-emerald-500",
  },
  {
    key: "freeUsers" as const,
    label: "Free Plan",
    subtitle: "users on free tier",
    icon: Gift,
    iconColor: "text-blue-500",
  },
  {
    key: "proUsers" as const,
    label: "Pro Plan",
    subtitle: "paying subscribers",
    icon: CreditCard,
    iconColor: "text-amber-500",
  },
];

export function AdminStatsGrid({ stats, loading }: AdminStatsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <StatsCardSkeleton key={card.key} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card) => (
        <Card key={card.key} className="border-[#DAC0FF]/30 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-body text-sm font-medium text-[#6b6b6b]">
              {card.label}
            </CardTitle>
            <card.icon className={`size-5 ${card.iconColor}`} aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-bold text-[#222222]">
              {stats?.[card.key] ?? 0}
            </p>
            <p className="mt-1 font-body text-xs text-[#767676]">
              {card.subtitle}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatsCardSkeleton() {
  return (
    <Card className="border-[#DAC0FF]/30 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-5 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-9 w-16" />
        <Skeleton className="mt-1 h-3 w-32" />
      </CardContent>
    </Card>
  );
}
