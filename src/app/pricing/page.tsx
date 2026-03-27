"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSubscription } from "@/hooks/use-subscription";
import { PricingHero } from "@/components/billing/PricingHero";
import { PricingCards } from "@/components/billing/PricingCards";
import { FeatureComparisonTable } from "@/components/billing/FeatureComparisonTable";
import { Skeleton } from "@/components/ui/skeleton";

export default function PricingPage() {
  const { user, loading: authLoading } = useAuth();
  const { subscription, loading: subLoading } = useSubscription(user?.id);

  const loading = authLoading || (user && subLoading);

  return (
    <main className="min-h-screen bg-[#F6F0FF]">
      {/* Navigation bar */}
      <nav className="border-b border-[#DAC0FF]/30 bg-white" aria-label="Pricing page navigation">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 lg:px-6">
          <Link href={user ? "/dashboard" : "/login"} className="flex items-center gap-2">
            <Image
              src="/hrworks-logo.png"
              alt="HR WORKS"
              width={120}
              height={28}
              className="h-7 w-auto"
              priority
            />
          </Link>
          <Link
            href={user ? "/dashboard" : "/login"}
            className="flex items-center gap-1 font-body text-sm text-[#5b57a2] hover:text-[#292673]"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {user ? "Back to Dashboard" : "Sign in"}
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-12 lg:px-6 lg:py-16">
        <PricingHero />

        {loading ? (
          <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
            <Skeleton className="h-96 rounded-lg" />
            <Skeleton className="h-96 rounded-lg" />
          </div>
        ) : (
          <PricingCards
            currentPlan={
              user ? subscription.plan : undefined
            }
          />
        )}

        <FeatureComparisonTable />

        {/* FAQ / Support link */}
        <div className="text-center">
          <p className="font-body text-sm text-[#6b6b6b]">
            Have questions?{" "}
            <a
              href="mailto:support@hrworks.example.com"
              className="font-medium text-[#5b57a2] underline hover:text-[#292673]"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
