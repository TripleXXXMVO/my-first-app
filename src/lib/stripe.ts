import Stripe from "stripe";
export { FREE_TASK_LIMIT } from "@/lib/constants";

/**
 * Server-side Stripe client. Never import this on the client side.
 * Requires STRIPE_SECRET_KEY environment variable.
 */
export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "Missing STRIPE_SECRET_KEY environment variable. Set it in .env.local."
    );
  }

  return new Stripe(secretKey, {
    typescript: true,
  });
}

/**
 * Get the Pro plan price ID from environment.
 */
export function getProPriceId(): string {
  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    throw new Error(
      "Missing STRIPE_PRO_PRICE_ID environment variable. Set it in .env.local."
    );
  }
  return priceId;
}

/**
 * Get the webhook signing secret from environment.
 */
export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      "Missing STRIPE_WEBHOOK_SECRET environment variable. Set it in .env.local."
    );
  }
  return secret;
}

