import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getStripe, getProPriceId } from "@/lib/stripe";
import { isStripeRateLimited, getClientIp, isValidOrigin } from "@/lib/rate-limit";

// Checkout takes no request body — reject any unexpected fields for consistency.
const checkoutBodySchema = z.object({}).strict();

/**
 * POST /api/stripe/checkout — Create a Stripe Checkout session for Pro plan upgrade.
 * Returns { url } for the frontend to redirect the user to Stripe Checkout.
 */
export async function POST(request: NextRequest) {
  if (!isValidOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (await isStripeRateLimited(getClientIp(request), "POST /api/stripe/checkout")) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  // Validate request body — checkout requires no parameters
  let body: unknown = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const bodyValidation = checkoutBodySchema.safeParse(body);
  if (!bodyValidation.success) {
    return NextResponse.json({ error: "Unexpected request body fields." }, { status: 400 });
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "You must be logged in to subscribe." },
      { status: 401 }
    );
  }

  // Check for existing active subscription — prevent double-subscribe
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("id, plan, status, stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingSub?.plan === "pro" && existingSub?.status === "active") {
    return NextResponse.json(
      { error: "You already have an active Pro subscription." },
      { status: 409 }
    );
  }

  const stripe = getStripe();
  const priceId = getProPriceId();

  // Determine the app's base URL for success/cancel redirects
  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Reuse existing Stripe customer ID if available (e.g., user re-subscribing after cancellation)
  const customerOptions: Record<string, string> = {};
  if (existingSub?.stripe_customer_id) {
    customerOptions.customer = existingSub.stripe_customer_id;
  } else {
    customerOptions.customer_email = user.email ?? "";
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      ...customerOptions,
      success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing/cancel`,
      metadata: {
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout session creation failed:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session. Please try again." },
      { status: 500 }
    );
  }
}
