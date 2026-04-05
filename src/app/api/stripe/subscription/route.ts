import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isStripeRateLimited, getClientIp } from "@/lib/rate-limit";

/**
 * GET /api/stripe/subscription — Get the current user's subscription details.
 * Returns the subscription row or 404 if none exists (treated as free plan by frontend).
 */
export async function GET(request: NextRequest) {
  if (await isStripeRateLimited(getClientIp(request), "GET /api/stripe/subscription")) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "You must be logged in to view subscription." },
      { status: 401 }
    );
  }

  // RLS ensures only the user's own subscription row is returned.
  // stripe_customer_id and stripe_subscription_id are intentionally excluded
  // to avoid leaking internal Stripe IDs to the browser.
  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end, cancel_at_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subError) {
    return NextResponse.json(
      { error: "Failed to load subscription." },
      { status: 500 }
    );
  }

  if (!subscription) {
    return NextResponse.json(
      { error: "No subscription found." },
      { status: 404 }
    );
  }

  return NextResponse.json(subscription);
}
