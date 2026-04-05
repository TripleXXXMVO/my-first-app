import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { isStripeRateLimited, getClientIp, isValidOrigin } from "@/lib/rate-limit";

/**
 * POST /api/stripe/portal — Create a Stripe Billing Portal session.
 * Returns { url } for the frontend to redirect the user to manage their subscription.
 */
export async function POST(request: NextRequest) {
  if (!isValidOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (await isStripeRateLimited(getClientIp(request), "POST /api/stripe/portal")) {
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
      { error: "You must be logged in to manage billing." },
      { status: 401 }
    );
  }

  // Look up the user's Stripe customer ID
  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subError) {
    return NextResponse.json(
      { error: "Failed to load subscription." },
      { status: 500 }
    );
  }

  if (!subscription?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No billing account found. Subscribe to a plan first." },
      { status: 404 }
    );
  }

  const stripe = getStripe();
  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${origin}/profile`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("Stripe billing portal session creation failed:", err);
    return NextResponse.json(
      { error: "Failed to create billing portal session. Please try again." },
      { status: 500 }
    );
  }
}
