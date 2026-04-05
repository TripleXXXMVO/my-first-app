"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth/AuthProvider";

const FREE_FEATURES = [
  "Up to 20 tasks",
  "Basic task management",
  "Dashboard overview",
  "Email support",
];

const PRO_FEATURES = [
  "Unlimited tasks",
  "All free features included",
  "Priority support",
  "Advanced reporting (coming soon)",
  "Team collaboration (coming soon)",
];

interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  buttonLabel: string;
  onAction: () => void;
  loading?: boolean;
  highlighted?: boolean;
  badge?: string;
  currentPlan?: boolean;
}

function PricingCard({
  name,
  price,
  period,
  description,
  features,
  buttonLabel,
  onAction,
  loading = false,
  highlighted = false,
  badge,
  currentPlan = false,
}: PricingCardProps) {
  return (
    <Card
      className={`relative flex flex-col ${
        highlighted
          ? "border-2 border-[#B580FF] shadow-lg shadow-[#B580FF]/20"
          : "border-[#DAC0FF]/40 shadow-sm"
      }`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-[#B580FF] px-3 py-1 font-body text-xs font-semibold text-white hover:bg-[#B580FF]">
            {badge}
          </Badge>
        </div>
      )}
      <CardHeader className="pb-2 pt-6 text-center">
        <h3 className="font-heading text-xl font-bold text-[#292673]">
          {name}
        </h3>
        <p className="mt-1 font-body text-sm text-[#6b6b6b]">{description}</p>
        <div className="mt-4 flex items-baseline justify-center gap-1">
          <span className="font-heading text-4xl font-bold text-[#292673]">
            {price}
          </span>
          {period && (
            <span className="font-body text-sm text-[#6b6b6b]">
              /{period}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col px-6 pb-6">
        <ul className="mt-4 flex-1 space-y-3" role="list">
          {features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2 font-body text-sm text-[#222222]"
            >
              <Check
                className="mt-0.5 size-4 shrink-0 text-[#B580FF]"
                aria-hidden="true"
              />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button
          onClick={onAction}
          disabled={loading || currentPlan}
          className={`mt-6 w-full font-body text-sm font-semibold ${
            highlighted
              ? "bg-[#B580FF] text-white hover:bg-[#5b57a2]"
              : "border border-[#DAC0FF] bg-white text-[#5b57a2] hover:bg-[#F6F0FF]"
          }`}
          aria-label={currentPlan ? `Current plan: ${name}` : `Choose ${name} plan`}
        >
          {currentPlan ? "Current plan" : loading ? "Loading..." : buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

interface PricingCardsProps {
  currentPlan?: "free" | "pro";
}

export function PricingCards({ currentPlan }: PricingCardsProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleFreePlan = () => {
    if (!user) {
      router.push("/register");
    } else {
      router.push("/dashboard");
    }
  };

  const handleProPlan = async () => {
    if (!user) {
      router.push("/register");
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create checkout session");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setCheckoutError(
        err instanceof Error ? err.message : "Failed to start checkout. Please try again."
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {checkoutError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-center font-body text-sm text-red-700" role="alert">
          {checkoutError}
        </p>
      )}
    <div className="grid gap-6 sm:grid-cols-2">
      <PricingCard
        name="Free"
        price="$0"
        description="Perfect for getting started"
        features={FREE_FEATURES}
        buttonLabel={user ? "Go to Dashboard" : "Get started free"}
        onAction={handleFreePlan}
        currentPlan={currentPlan === "free"}
      />
      <PricingCard
        name="Pro"
        price="$9"
        period="month"
        description="For teams that need more"
        features={PRO_FEATURES}
        buttonLabel={user ? "Upgrade to Pro" : "Start free trial"}
        onAction={handleProPlan}
        loading={checkoutLoading}
        highlighted
        badge="Most Popular"
        currentPlan={currentPlan === "pro"}
      />
    </div>
    </div>
  );
}
