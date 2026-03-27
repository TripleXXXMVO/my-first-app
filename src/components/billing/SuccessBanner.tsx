"use client";

import { CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function SuccessBanner() {
  return (
    <Card className="border-green-200 bg-green-50 shadow-sm">
      <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle
            className="size-8 text-green-600"
            aria-hidden="true"
          />
        </div>
        <h1 className="font-heading text-2xl font-bold text-[#292673]">
          Payment successful!
        </h1>
        <p className="max-w-md font-body text-base text-[#6b6b6b]">
          Your Pro plan is now active. You have access to unlimited tasks and
          all premium features.
        </p>
      </CardContent>
    </Card>
  );
}
