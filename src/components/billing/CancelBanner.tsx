"use client";

import { XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function CancelBanner() {
  return (
    <Card className="border-amber-200 bg-amber-50 shadow-sm">
      <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-amber-100">
          <XCircle
            className="size-8 text-amber-600"
            aria-hidden="true"
          />
        </div>
        <h1 className="font-heading text-2xl font-bold text-[#292673]">
          Checkout canceled
        </h1>
        <p className="max-w-md font-body text-base text-[#6b6b6b]">
          No worries! You were not charged. You can upgrade anytime from the
          pricing page.
        </p>
      </CardContent>
    </Card>
  );
}
