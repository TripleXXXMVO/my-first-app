"use client";

import { ClipboardList, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsRowProps {
  openTasks: number;
  completedTasks: number;
  loading?: boolean;
}

export function StatsRow({ openTasks, completedTasks, loading }: StatsRowProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card className="border-[#DAC0FF]/30 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="font-body text-sm font-medium text-[#6b6b6b]">
            Open Tasks
          </CardTitle>
          <ClipboardList className="size-5 text-[#B580FF]" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <p className="font-heading text-3xl font-bold text-[#222222]">
            {openTasks}
          </p>
          <p className="mt-1 font-body text-xs text-[#767676]">
            tasks awaiting completion
          </p>
        </CardContent>
      </Card>

      <Card className="border-[#DAC0FF]/30 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="font-body text-sm font-medium text-[#6b6b6b]">
            Completed
          </CardTitle>
          <CheckCircle2 className="size-5 text-emerald-500" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <p className="font-heading text-3xl font-bold text-[#222222]">
            {completedTasks}
          </p>
          <p className="mt-1 font-body text-xs text-[#767676]">
            tasks finished
          </p>
        </CardContent>
      </Card>
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
