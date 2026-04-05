-- PROJ-4: Add cancel_at_period_end column to subscriptions table
-- Tracks whether a subscription is scheduled to cancel at the current billing period end.
-- When true, the user retains Pro access until current_period_end, then Stripe fires
-- customer.subscription.deleted and the webhook downgrades them to free.

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE;
