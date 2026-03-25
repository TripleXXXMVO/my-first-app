"use client";

import Link from "next/link";
import { ClipboardList, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface TaskEmptyStateProps {
  /** true when empty is due to active filters, false when user has no tasks at all */
  isFilteredEmpty: boolean;
  onClearFilters?: () => void;
}

export function TaskEmptyState({ isFilteredEmpty, onClearFilters }: TaskEmptyStateProps) {
  if (isFilteredEmpty) {
    return (
      <Card className="border-[#DAC0FF]/30 shadow-sm">
        <CardContent className="flex flex-col items-center px-6 py-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-[#F6F0FF]">
            <SearchX className="size-8 text-[#B580FF]" aria-hidden="true" />
          </div>
          <h3 className="mt-4 font-heading text-lg font-semibold text-[#222222]">
            No matching tasks
          </h3>
          <p className="mt-2 max-w-sm font-body text-sm text-[#6b6b6b]">
            No tasks match your current filters. Try adjusting the filters or clear them to see all tasks.
          </p>
          {onClearFilters && (
            <Button
              variant="outline"
              className="mt-6 font-body text-sm text-[#5b57a2] hover:bg-[#F6F0FF]"
              onClick={onClearFilters}
            >
              Clear filters
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[#DAC0FF]/30 shadow-sm">
      <CardContent className="flex flex-col items-center px-6 py-12 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-[#F6F0FF]">
          <ClipboardList className="size-8 text-[#B580FF]" aria-hidden="true" />
        </div>
        <h3 className="mt-4 font-heading text-lg font-semibold text-[#222222]">
          No tasks yet
        </h3>
        <p className="mt-2 max-w-sm font-body text-sm text-[#6b6b6b]">
          Get started by creating your first task. Track your work and stay organized.
        </p>
        <Button
          className="mt-6 bg-[#B580FF] font-body text-sm font-semibold text-white hover:bg-[#5b57a2]"
          asChild
        >
          <Link href="/tasks/new">Create your first task</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
