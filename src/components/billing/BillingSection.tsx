"use client";

import { useState } from "react";
import Link from "next/link";
import { CreditCard, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSubscription } from "@/hooks/use-subscription";

export function BillingSection() {
  const { user } = useAuth();
  const { subscription, loading, error, isPro, isCanceled, isPastDue } =
    useSubscription(user?.id);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error("Failed to create billing portal session");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error("Billing portal error:", err);
      setPortalError("Failed to open billing portal. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-[#DAC0FF]/30 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-lg font-semibold text-[#292673]">
            <CreditCard className="size-5" aria-hidden="true" />
            Billing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-9 w-40" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-[#DAC0FF]/30 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-lg font-semibold text-[#292673]">
            <CreditCard className="size-5" aria-hidden="true" />
            Billing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-body text-sm text-red-600" role="alert">
            {error}
          </p>
          <Link href="/pricing" className="mt-3 inline-block">
            <Button
              variant="outline"
              className="border-[#DAC0FF] font-body text-sm text-[#5b57a2] hover:bg-[#F6F0FF]"
            >
              View plans
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const formattedDate = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <Card className="border-[#DAC0FF]/30 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-heading text-lg font-semibold text-[#292673]">
          <CreditCard className="size-5" aria-hidden="true" />
          Billing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current plan badge */}
        <div className="flex items-center gap-3">
          <span className="font-body text-sm text-[#6b6b6b]">
            Current plan:
          </span>
          <Badge
            className={
              isPro
                ? "bg-[#B580FF] text-white hover:bg-[#B580FF]"
                : "border-[#DAC0FF] bg-[#F6F0FF] text-[#5b57a2] hover:bg-[#F6F0FF]"
            }
          >
            {subscription.plan === "pro" ? "Pro" : "Free"}
          </Badge>
          {isCanceled && (
            <Badge
              variant="outline"
              className="border-amber-300 text-amber-600"
            >
              Cancels at period end
            </Badge>
          )}
          {isPastDue && (
            <Badge variant="destructive">Payment past due</Badge>
          )}
        </div>

        {/* Next billing date */}
        {formattedDate && isPro && (
          <p className="font-body text-sm text-[#6b6b6b]">
            {isCanceled
              ? `Access until ${formattedDate}`
              : `Next billing date: ${formattedDate}`}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-1">
          {isPro || isCanceled ? (
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleManageBilling}
                disabled={portalLoading}
                variant="outline"
                className="border-[#DAC0FF] font-body text-sm text-[#5b57a2] hover:bg-[#F6F0FF]"
              >
                <ExternalLink className="mr-2 size-4" aria-hidden="true" />
                {portalLoading ? "Loading..." : "Manage subscription"}
              </Button>
              {portalError && (
                <p className="font-body text-sm text-red-600" role="alert">
                  {portalError}
                </p>
              )}
            </div>
          ) : (
            <Link href="/pricing">
              <Button className="bg-[#B580FF] font-body text-sm font-semibold text-white hover:bg-[#5b57a2]">
                Upgrade to Pro
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
