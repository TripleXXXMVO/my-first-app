# PROJ-4: Subscription & Payment (Freemium)

## Status: Deployed
**Created:** 2026-03-20
**Last Updated:** 2026-04-05

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

### Komponentenstruktur

```
/pricing (öffentlich)
+-- PricingHero (Überschrift + Tagline)
+-- PricingCards
|   +-- FreePlanCard (Features, Limits, "Kostenlos starten")
|   +-- ProPlanCard (Features, Preis, "Upgrade" Button)
+-- FeatureComparisonTable

/billing/success (geschützt)
+-- SuccessBanner
+-- NextStepsCard (zurück zum Dashboard)

/billing/cancel (geschützt)
+-- CancelBanner
+-- ReturnToPricingButton

/profile (bestehend – Erweiterung)
+-- BillingSection (NEU)
    +-- CurrentPlanBadge (Free / Pro)
    +-- NextBillingDate
    +-- ManageSubscriptionButton → Stripe Billing Portal

UpgradePrompt (Modal – überall einsetzbar)
+-- PlanLimitMessage ("Limit von 20 Tasks erreicht")
+-- UpgradeButton → /pricing
```

### Datenmodell

**Neue Tabelle: `subscriptions`**
- Stripe Customer ID (eindeutige Stripe-Kennung)
- Stripe Subscription ID (aktives Abo bei Stripe)
- Plan (free oder pro)
- Status (active / canceled / past_due)
- Aktuelle Periode endet am (Datum für "Zugang bis...")
- Verknüpft mit: users-Tabelle (1:1)

**Bestehende Tabellen:** keine Änderung nötig
- Task-Limit (20 für Free) wird serverseitig beim Erstellen geprüft

### API-Routen

| Route | Zweck |
|---|---|
| `POST /api/stripe/checkout` | Erstellt Stripe Checkout Session |
| `POST /api/stripe/webhook` | Empfängt Stripe-Events (Zahlung, Kündigung, Fehlschlag) |
| `POST /api/stripe/portal` | Erstellt Billing Portal Session |

### Datenfluss

1. **Upgrade:** User → Checkout API → Stripe → Webhook → DB aktualisiert → /billing/success
2. **Verwaltung/Kündigung:** User → Portal API → Stripe Billing Portal → Webhook → DB aktualisiert
3. **Fehlgeschlagene Zahlung:** Stripe Webhook → status = "past_due" + E-Mail durch Stripe
4. **Freemium-Limit:** Task #21 → Server prüft Plan → Free: 402 → Frontend zeigt UpgradePrompt

### Tech-Entscheidungen

| Entscheidung | Warum |
|---|---|
| Stripe Hosted Checkout | PCI-Compliance bei Stripe – keine Kartendaten im eigenen System |
| Stripe Billing Portal | Kein eigenes Kündigungs-UI nötig |
| Webhook-Validierung serverseitig | Plan-Status nur über verifizierte Stripe-Signatur aktualisierbar |
| Soft Limits bei Downgrade | Tasks bleiben erhalten – nur neue Erstellung wird blockiert |
| Supabase RLS | Nur eigener Subscription-Eintrag lesbar |

### Abhängigkeiten

| Paket | Zweck |
|---|---|
| `stripe` | Stripe Node.js SDK |

## QA Test Results

**Tested:** 2026-04-05 | **Build:** PASS

### Bugs Fixed (2026-04-05)

| Bug | Severity | Fix |
|-----|----------|-----|
| BUG-1 | Medium | Added user-visible error banner in `PricingCards.tsx` for checkout failures |
| BUG-2 | Low | Converted success page to server component; shows warning when `session_id` is absent |
| BUG-3 | High | Added `customer.subscription.updated` webhook handler; `cancel_at_period_end=true` now keeps plan=pro with `cancelAtPeriodEnd` flag; access maintained until period end |
| BUG-4 | Medium | Added Redis-based idempotency dedup (`stripe_event:{id}`, 7-day TTL) in webhook handler |
| BUG-5 | Low | Added `z.object({}).strict()` Zod validation on checkout POST body |
| BUG-6 | Medium | Added `isWebhookRateLimited` (200 req/15min) to webhook endpoint |
| BUG-7 | Medium | Removed `stripe_customer_id` and `stripe_subscription_id` from subscription API response and `useSubscription` hook |
| BUG-8 | Medium | Added `portalError` state and error message UI in `BillingSection.tsx` |
| BUG-9 | Low | Extracted `FREE_TASK_LIMIT` to `src/lib/constants.ts`; removed 3 local duplicates in `TaskCreatePage`, `DashboardContent`, `TaskListPage` |

### Schema Change
- Added `cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE` column to `subscriptions` table (migration: `20260404_fix_subscriptions_cancel_at_period_end.sql`)
- `useSubscription` hook updated: removed `stripeCustomerId`/`stripeSubscriptionId`, added `cancelAtPeriodEnd`; `isCanceled` now reflects the new field

## Deployment

**Deployed:** 2026-04-05
**Production URL:** https://my-first-app-lac-ten.vercel.app
**Platform:** Vercel (auto-deploy from `main` branch)
**Supabase Migrations applied:**
- `create_subscriptions` — subscriptions table with RLS
- `fix_subscriptions_cancel_at_period_end` — cancel_at_period_end column
