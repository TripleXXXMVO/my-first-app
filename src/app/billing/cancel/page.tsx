"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { CancelBanner } from "@/components/billing/CancelBanner";
import { Button } from "@/components/ui/button";

export default function BillingCancelPage() {
  return (
    <AppShell title="Checkout Canceled">
      <div className="mx-auto max-w-xl space-y-6 py-8">
        <CancelBanner />

        <div className="flex justify-center gap-3">
          <Link href="/pricing">
            <Button className="bg-[#B580FF] font-body text-sm font-semibold text-white hover:bg-[#5b57a2]">
              Back to pricing
              <ArrowRight className="ml-2 size-4" aria-hidden="true" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button
              variant="outline"
              className="border-[#DAC0FF] font-body text-sm text-[#5b57a2] hover:bg-[#F6F0FF]"
            >
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
