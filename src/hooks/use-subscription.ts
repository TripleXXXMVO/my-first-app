"use client";

import { useState, useEffect, useCallback } from "react";

export type SubscriptionPlan = "free" | "pro";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "none";

export interface Subscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

const DEFAULT_SUBSCRIPTION: Subscription = {
  plan: "free",
  status: "none",
  currentPeriodEnd: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
};

export function useSubscription(userId: string | undefined) {
  const [subscription, setSubscription] =
    useState<Subscription>(DEFAULT_SUBSCRIPTION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubscription = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const res = await fetch("/api/stripe/subscription");
      if (!res.ok) {
        // If 404, user has no subscription — that is fine (free plan)
        if (res.status === 404) {
          setSubscription(DEFAULT_SUBSCRIPTION);
          return;
        }
        throw new Error("Failed to load subscription");
      }
      const data = await res.json();
      setSubscription({
        plan: data.plan ?? "free",
        status: data.status ?? "none",
        currentPeriodEnd: data.current_period_end ?? null,
        stripeCustomerId: data.stripe_customer_id ?? null,
        stripeSubscriptionId: data.stripe_subscription_id ?? null,
      });
    } catch (err) {
      console.error("Failed to load subscription:", err);
      setError("Could not load subscription details.");
      setSubscription(DEFAULT_SUBSCRIPTION);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const isPro = subscription.plan === "pro" && subscription.status === "active";
  const isCanceled = subscription.status === "canceled";
  const isPastDue = subscription.status === "past_due";

  return {
    subscription,
    loading,
    error,
    isPro,
    isCanceled,
    isPastDue,
    refresh: loadSubscription,
  };
}
