import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Redis } from "@upstash/redis";
import { getStripe, getWebhookSecret } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { isWebhookRateLimited, getClientIp } from "@/lib/rate-limit";

/**
 * POST /api/stripe/webhook — Handle Stripe webhook events.
 * Verifies signature, then processes:
 *   - checkout.session.completed       → create/update subscription to pro+active
 *   - customer.subscription.updated    → handle cancel_at_period_end scheduling or re-activation
 *   - invoice.payment_failed           → mark subscription as past_due
 *   - customer.subscription.deleted    → mark subscription as canceled, downgrade to free
 *
 * Uses the service role client because webhook requests have no user session.
 * Rate-limited and idempotent (deduplicates by Stripe event ID via Redis when available).
 */
export async function POST(request: NextRequest) {
  // BUG-6: Rate limit webhook endpoint
  if (await isWebhookRateLimited(getClientIp(request))) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429 }
    );
  }

  const stripe = getStripe();
  const webhookSecret = getWebhookSecret();

  // Read raw body for signature verification
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 400 }
    );
  }

  // BUG-4: Idempotency — skip already-processed events using Redis (when available)
  const redis = getIdempotencyRedis();
  if (redis) {
    const alreadyProcessed = await redis.get(`stripe_event:${event.id}`);
    if (alreadyProcessed) {
      return NextResponse.json({ received: true });
    }
  }

  // Use admin client (service role) — no user session in webhook context
  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabase, session);
        break;
      }

      // BUG-3: Handle subscription updates — cancel_at_period_end scheduling and re-activation
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(supabase, subscription);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(supabase, invoice);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabase, subscription);
        break;
      }

      default:
        // Ignore unhandled event types
        break;
    }
  } catch (err) {
    console.error(`Error processing Stripe event ${event.type}:`, err);
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 }
    );
  }

  // BUG-4: Mark event as processed (7-day TTL covers any Stripe retry window)
  if (redis) {
    await redis.set(`stripe_event:${event.id}`, "1", { ex: 7 * 24 * 60 * 60 });
  }

  return NextResponse.json({ received: true });
}

/**
 * Returns an Upstash Redis client for idempotency deduplication, or null in local dev.
 */
function getIdempotencyRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/**
 * checkout.session.completed — User completed Stripe Checkout.
 * Creates or updates the subscription row to pro + active.
 */
async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.user_id;
  if (!userId) {
    console.error("checkout.session.completed: missing user_id in metadata");
    return;
  }

  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;
  const stripeSubscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  // Fetch subscription details from Stripe to get current_period_end
  let currentPeriodEnd: string | null = null;
  if (stripeSubscriptionId) {
    const stripe = getStripe();
    const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    // In Stripe SDK v21+, current_period_end is on SubscriptionItem, not Subscription
    const periodEnd = sub.items.data[0]?.current_period_end;
    if (periodEnd) {
      currentPeriodEnd = new Date(periodEnd * 1000).toISOString();
    }
  }

  // Upsert: create subscription row or update existing one
  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      plan: "pro",
      status: "active",
      cancel_at_period_end: false,
      current_period_end: currentPeriodEnd,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("Failed to upsert subscription after checkout:", error);
    throw error;
  }
}

/**
 * customer.subscription.updated — Subscription was modified.
 * Handles two cases:
 *   - cancel_at_period_end=true: user scheduled a cancellation via Billing Portal.
 *     Keep plan=pro and status=active; set cancel_at_period_end=true so UI shows
 *     "Cancels at period end". Access is maintained until current_period_end.
 *   - cancel_at_period_end=false + status=active: user reversed a cancellation.
 *     Clear the cancellation flag.
 */
async function handleSubscriptionUpdated(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const periodEnd = subscription.items.data[0]?.current_period_end;
  const currentPeriodEnd = periodEnd
    ? new Date(periodEnd * 1000).toISOString()
    : null;

  if (subscription.cancel_at_period_end) {
    // Scheduled cancellation — keep pro access, flag as canceling
    const updates: Record<string, unknown> = { cancel_at_period_end: true };
    if (currentPeriodEnd) updates.current_period_end = currentPeriodEnd;

    const { error } = await supabase
      .from("subscriptions")
      .update(updates)
      .eq("stripe_subscription_id", subscription.id);

    if (error) {
      console.error("Failed to update subscription for cancel_at_period_end:", error);
      throw error;
    }
  } else if (subscription.status === "active") {
    // Re-activation (user reversed cancellation or renewed)
    const updates: Record<string, unknown> = {
      cancel_at_period_end: false,
      status: "active",
    };
    if (currentPeriodEnd) updates.current_period_end = currentPeriodEnd;

    const { error } = await supabase
      .from("subscriptions")
      .update(updates)
      .eq("stripe_subscription_id", subscription.id);

    if (error) {
      console.error("Failed to update subscription on re-activation:", error);
      throw error;
    }
  }
  // Other status transitions (e.g., past_due) are handled by invoice.payment_failed
}

/**
 * invoice.payment_failed — A recurring payment failed.
 * Marks the subscription as past_due so the UI can prompt the user.
 */
async function handlePaymentFailed(
  supabase: ReturnType<typeof createAdminClient>,
  invoice: Stripe.Invoice
) {
  // In Stripe SDK v21+, subscription is at invoice.parent.subscription_details.subscription
  const subRef = invoice.parent?.subscription_details?.subscription;
  const stripeSubscriptionId =
    typeof subRef === "string" ? subRef : subRef?.id ?? null;

  if (!stripeSubscriptionId) {
    console.error("invoice.payment_failed: missing subscription ID");
    return;
  }

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "past_due" })
    .eq("stripe_subscription_id", stripeSubscriptionId);

  if (error) {
    console.error("Failed to update subscription to past_due:", error);
    throw error;
  }
}

/**
 * customer.subscription.deleted — Subscription reached its end (period ended after
 * cancellation, or was deleted immediately). Downgrades the user to free plan.
 */
async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const { error } = await supabase
    .from("subscriptions")
    .update({
      plan: "free",
      status: "canceled",
      stripe_subscription_id: null,
      cancel_at_period_end: false,
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Failed to update subscription on deletion:", error);
    throw error;
  }
}
