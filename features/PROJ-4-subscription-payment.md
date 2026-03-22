# PROJ-4: Subscription & Payment (Freemium)

## Status: Planned
**Created:** 2026-03-20
**Last Updated:** 2026-03-20

## Dependencies
- Requires: PROJ-1 (User Authentication) — only logged-in users can subscribe
- Requires: PROJ-2 (User Profile & Dashboard) — plan status shown on profile

## User Stories
- As a free user, I want to see what features are included in the paid plan so that I can decide if upgrading is worth it.
- As a free user, I want to upgrade to a paid plan via a checkout flow so that I can unlock premium features.
- As a paid user, I want to manage my subscription (view, cancel) from my account settings so that I have control over billing.
- As a paid user, I want to receive an email receipt after each billing cycle so that I have records for accounting.
- As a user whose payment fails, I want to be notified and given a way to update my payment method so that my account is not unexpectedly downgraded.
- As an admin, I want to see which users are on which plan so that I can manage the user base.

## Acceptance Criteria
- [ ] A pricing page (/pricing) is accessible to all users (logged in or not)
- [ ] Pricing page clearly shows Free vs. Pro plan features and price
- [ ] Logged-in users can start a Stripe Checkout session from the pricing page or profile
- [ ] After successful payment, user's plan is updated to "Pro" in the database
- [ ] User is redirected to a success page (/billing/success) after checkout
- [ ] Pro plan features are unlocked immediately after payment confirmation
- [ ] Free users who hit plan limits see an upgrade prompt (not a hard error)
- [ ] Paid users can view their current plan and next billing date in /profile
- [ ] Paid users can cancel their subscription (takes effect at end of billing period)
- [ ] Stripe webhooks handle: checkout.session.completed, invoice.payment_failed, customer.subscription.deleted
- [ ] On subscription cancellation, access remains until period end, then downgrades to Free
- [ ] Payment failure triggers an email notification (handled by Stripe)

## Edge Cases
- What if the Stripe webhook is delayed? → Use webhook idempotency keys; UI polls or shows "processing" state.
- What if a user tries to subscribe twice? → Check for existing active subscription before creating a new checkout session.
- What if a user cancels and then re-subscribes? → New Stripe subscription is created; reuse existing customer ID.
- What if the checkout session expires (user leaves the tab)? → User returns to pricing page; no charge made.
- What if the user is in a country where the currency differs? → Use Stripe's automatic currency detection; display price in USD by default.
- What happens to data when the user downgrades to Free? → Data is retained but access to Pro features is locked (soft limit, not deleted).

## Technical Requirements
- **Payment Provider:** Stripe (Checkout + Billing Portal + Webhooks)
- **Plan Limits (example):**
  - Free: up to 20 tasks
  - Pro: unlimited tasks + future premium features
- **Database:** `subscriptions` table linked to `users`, synced via Stripe webhooks
- **Webhook Secret:** Stored as environment variable, verified on every webhook call
- **Routes:**
  - `/pricing` — Public pricing page
  - `/billing/success` — Post-checkout success page (protected)
  - `/billing/cancel` — Post-checkout cancel page (protected)
  - `/api/stripe/checkout` — Create checkout session (API route)
  - `/api/stripe/webhook` — Stripe webhook handler (API route)
- **Security:** Webhook endpoint must verify Stripe signature; never trust client-side plan data

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
