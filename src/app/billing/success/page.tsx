import Link from "next/link";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { SuccessBanner } from "@/components/billing/SuccessBanner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  // No session_id means the user navigated here directly — show a warning.
  // The webhook is the authoritative source of truth for plan activation,
  // so this is cosmetic only and does not affect access control.
  if (!session_id) {
    return (
      <AppShell title="Billing">
        <div className="mx-auto max-w-xl space-y-6 py-8">
          <Card className="border-amber-200 bg-amber-50 shadow-sm">
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <AlertTriangle className="size-8 text-amber-500" aria-hidden="true" />
              <h1 className="font-heading text-xl font-bold text-[#292673]">
                No payment session found
              </h1>
              <p className="font-body text-sm text-[#6b6b6b]">
                This page is only accessible after completing a checkout. If you
                just subscribed, your Pro access will activate shortly.
              </p>
              <Link href="/dashboard">
                <Button className="mt-2 bg-[#B580FF] font-body text-sm font-semibold text-white hover:bg-[#5b57a2]">
                  Go to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Payment Successful">
      <div className="mx-auto max-w-xl space-y-6 py-8">
        <SuccessBanner />

        <Card className="border-[#DAC0FF]/30 shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
            <h2 className="font-heading text-lg font-semibold text-[#292673]">
              What&apos;s next?
            </h2>
            <p className="font-body text-sm text-[#6b6b6b]">
              Head back to your dashboard and start creating unlimited tasks.
              You can manage your subscription from your profile at any time.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard">
                <Button className="bg-[#B580FF] font-body text-sm font-semibold text-white hover:bg-[#5b57a2]">
                  Go to Dashboard
                  <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="/profile">
                <Button
                  variant="outline"
                  className="border-[#DAC0FF] font-body text-sm text-[#5b57a2] hover:bg-[#F6F0FF]"
                >
                  View subscription
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
