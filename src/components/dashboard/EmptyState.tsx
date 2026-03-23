"use client";

import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState() {
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
          Get started by creating your first task. Track your work and stay
          organized.
        </p>
        <Button
          className="mt-6 bg-[#B580FF] font-body text-sm font-semibold text-white hover:bg-[#5b57a2]"
          disabled
          aria-label="Create your first task (coming soon)"
        >
          Create your first task
        </Button>
        <p className="mt-2 font-body text-xs text-[#767676]">
          Task management is coming soon
        </p>
      </CardContent>
    </Card>
  );
}
