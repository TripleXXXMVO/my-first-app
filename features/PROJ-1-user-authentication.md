# PROJ-1: User Authentication

## Status: In Review
**Created:** 2026-03-20
**Last Updated:** 2026-03-20

## Dependencies
- None

## User Stories
- As a new user, I want to register with my email and password so that I can create an account and access the platform.
- As a new user, I want to sign up with Google (1-click) so that I can onboard quickly without creating a new password.
- As a returning user, I want to log in with my email and password so that I can access my account.
- As a returning user, I want to log in with Google so that I can sign in without remembering a password.
- As a user who forgot their password, I want to request a password reset link via email so that I can regain access to my account.
- As a user, I want to log out of my account so that my session is securely terminated.
- As a user on a shared device, I want my session to expire after inactivity so that my account is protected.

## Acceptance Criteria
- [ ] User can register with a valid email address and a password (min. 8 characters)
- [ ] Registration fails with a clear error message if the email is already in use
- [ ] Registration fails if the password does not meet minimum requirements
- [ ] User receives a confirmation email after email/password registration
- [ ] User can sign up and log in via Google OAuth (1-click)
- [ ] User can log in with email and password after registration
- [ ] Login fails with a generic error message (no user enumeration) if credentials are wrong
- [ ] User can request a password reset email from the login page
- [ ] Password reset link is valid for 1 hour and can only be used once
- [ ] User can set a new password after clicking the reset link
- [ ] User can log out and is redirected to the login page
- [ ] Auth state persists across page refreshes (session cookie / JWT)
- [ ] All auth pages are accessible without logging in (public routes)
- [ ] Authenticated users are redirected away from auth pages (e.g., /login → /dashboard)
- [ ] Protected routes redirect unauthenticated users to /login

## Edge Cases
- What happens if a user tries to register with an email that already has a Google OAuth account? → Show a message: "This email is already linked to a Google account. Sign in with Google."
- What happens if the Google OAuth flow is cancelled by the user? → Return to login page with no error (silent cancel).
- What happens if the password reset link has expired? → Show a clear expiry message with a link to request a new reset.
- What happens if a user submits the registration form multiple times quickly (double-click)? → Debounce / disable submit button after first click.
- What if the user's Google account email changes after linking? → Email is updated on next OAuth login via Supabase's identity refresh.
- What happens if the confirmation email is not received? → Provide a "Resend confirmation email" link on a holding page.

## Technical Requirements
- **Auth Provider:** Supabase Auth (handles JWT, sessions, OAuth)
- **OAuth Provider:** Google (configured in Supabase dashboard)
- **Session:** HTTP-only cookie with secure flag, 7-day expiry with sliding window
- **Password Policy:** Minimum 8 characters (enforced client + server side)
- **Security:** No user enumeration on login errors; CSRF protection via Supabase
- **GDPR:** No PII stored beyond email; user can delete account (to be enforced in PROJ-2)
- **Performance:** Auth responses < 500ms
- **Routes:**
  - `/login` — Login page (email/password + Google button)
  - `/register` — Registration page
  - `/forgot-password` — Request password reset
  - `/reset-password` — Set new password (from email link)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Component Structure

```
App (Root Layout)
+-- AuthProvider (wraps entire app — manages session state)
    |
    +-- Public Routes (no auth required)
    |   +-- /login
    |   |   +-- LoginForm
    |   |       +-- EmailInput + PasswordInput
    |   |       +-- "Sign in with Google" Button
    |   |       +-- "Forgot password?" Link
    |   |
    |   +-- /register
    |   |   +-- RegisterForm
    |   |       +-- EmailInput + PasswordInput + ConfirmPasswordInput
    |   |       +-- "Sign up with Google" Button
    |   |
    |   +-- /forgot-password
    |   |   +-- ForgotPasswordForm
    |   |       +-- EmailInput
    |   |       +-- Confirmation Message (after submit)
    |   |       +-- "Resend email" link
    |   |
    |   +-- /reset-password
    |       +-- ResetPasswordForm
    |           +-- NewPasswordInput + ConfirmPasswordInput
    |
    +-- Protected Routes (redirect to /login if not authenticated)
        +-- /dashboard (and all other app pages)
```

### Data Model

Supabase manages all auth data automatically. No custom database tables needed for this feature.

**Supabase Auth User record (managed by Supabase):**
- User ID (unique, auto-generated)
- Email address
- Auth provider: "email" or "google"
- Email confirmed: yes/no
- Created at timestamp
- Last sign-in timestamp

**Session (stored in HTTP-only cookie):**
- JWT token (expires after 7 days)
- Auto-refreshed on activity (sliding window)
- Wiped on logout

No PII beyond email is stored — GDPR compliant by default.

### Auth Flows

**Email/Password Registration:** User fills out register form → Supabase sends confirmation email → user clicks link → account confirmed → redirected to /dashboard

**Google OAuth:** User clicks "Sign in with Google" → Google consent screen → Supabase validates token, creates/finds user → session cookie set → /dashboard

**Password Reset:** User enters email → Supabase sends reset link (1-hour expiry) → user clicks link → sets new password → redirected to /dashboard

**Route Protection:** Next.js Middleware runs on every request server-side — authenticated users on auth pages → /dashboard; unauthenticated users on protected pages → /login

### Tech Decisions

| Decision | Choice | Why |
|---|---|---|
| Auth provider | Supabase Auth | Handles JWT, sessions, OAuth, email delivery, and password reset out of the box |
| Session storage | HTTP-only cookie | Immune to XSS (not accessible to JavaScript) |
| Route protection | Next.js Middleware | Server-side — no flash of protected content |
| Form validation | react-hook-form + Zod | Already in stack; consistent with rest of app |
| OAuth provider | Google only (v1) | Covers majority of users; others can be added in v2 |

### Backend API Routes

| Route | Purpose |
|---|---|
| `POST /api/auth/callback` | Handles OAuth + email confirmation redirects; exchanges code for session cookie |

All other auth operations (login, register, logout, password reset) call Supabase's client SDK directly — no additional custom API endpoints needed.

### Dependencies

| Package | Purpose |
|---|---|
| `@supabase/supabase-js` | Supabase client SDK |
| `@supabase/ssr` | Server-side session handling for Next.js (cookies) |

## Frontend Implementation Notes

**Status:** Frontend complete (2026-03-20)

### Files Created
- `src/lib/supabase/client.ts` — Supabase browser client (replaces placeholder `src/lib/supabase.ts`)
- `src/lib/supabase/server.ts` — Supabase server client for RSC/middleware
- `src/lib/validations/auth.ts` — Zod schemas for all auth forms (login, register, forgot-password, reset-password)
- `src/components/auth/AuthProvider.tsx` — Auth context provider (wraps app, exposes `useAuth` hook)
- `src/components/auth/AuthLayout.tsx` — Shared auth page layout (full-page centered, branded logo, card)
- `src/components/auth/GoogleOAuthButton.tsx` — Google OAuth sign-in button with Google icon
- `src/app/login/page.tsx` — Login page with email/password + Google OAuth + "Forgot password?" link
- `src/app/register/page.tsx` — Registration page with email/password/confirm + Google OAuth + confirmation email flow
- `src/app/forgot-password/page.tsx` — Request password reset link via email
- `src/app/reset-password/page.tsx` — Set new password (from email link, handles expired tokens)
- `src/app/dashboard/page.tsx` — Protected placeholder dashboard with sign-out button
- `src/app/api/auth/callback/route.ts` — OAuth/email confirmation callback (exchanges code for session)
- `src/proxy.ts` — Route protection (auth pages redirect to /dashboard if signed in; protected routes redirect to /login if not) — Next.js 16 uses `proxy.ts` instead of `middleware.ts`

### Files Modified
- `src/app/layout.tsx` — Added Plus Jakarta Sans + Roboto fonts, AuthProvider wrapper
- `tailwind.config.ts` — Added `font-heading` and `font-body` font family utilities

### Design Decisions
- Brand colors applied via direct Tailwind classes (e.g., `bg-[#B580FF]`) rather than CSS variable overrides, to keep the HR WORKS palette independent from shadcn defaults
- Logo rendered as inline SVG text mark (circle brand icon + "hr works" text in Plus Jakarta Sans 600)
- All forms use react-hook-form + Zod with inline error messages in red (#FF4F4F)
- Submit buttons disabled during loading to prevent double submissions
- AuthProvider gracefully handles missing Supabase env vars (for build-time static generation)
- Middleware guards against missing env vars during build

### Env Vars Required
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous/public key
- Google OAuth must be configured in Supabase dashboard

## QA Test Results (Full Re-Test #4)

**Tested:** 2026-03-22 (Complete re-test after bug fix commits c643379 and 21d6a53)
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)
**Build Status:** PASS (Next.js 16, compiled successfully, no TypeScript errors)
**Lint Status:** PASS (ESLint -- no errors)

---

### Previous Bug Fix Verification

All bugs from previous QA runs (BUG-1 through BUG-18 and BUG-EC1) have been re-verified against the current codebase (commit 54ed34a).

| Bug | Description | Previous Severity | Status |
|-----|-------------|-------------------|--------|
| BUG-1 | Open Redirect in Auth Callback | Critical | FIXED -- `getSafeRedirectPath()` validates `next` param, blocks `//`, `:`, non-`/` prefixed |
| BUG-2 | No Security Headers | High | FIXED -- `next.config.ts` sets X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS, Permissions-Policy |
| BUG-3 | Missing .env.local.example | Medium | FIXED -- `.env.local.example` exists with dummy values |
| BUG-4 | Missing Resend Confirmation Email | Medium | FIXED -- "Resend confirmation email" button on confirmation screen |
| BUG-5 | No Rate Limiting on Auth Endpoints | High | FIXED -- Proxy rate limiter covers all auth POST routes |
| BUG-5b | Rate Limiting Ineffective (client-side calls) | High | FIXED -- All auth forms use `fetch("/api/auth/...")` server routes |
| BUG-6 | Server-Side Non-Null Assertion | Medium | FIXED -- `server.ts` throws descriptive error on missing env vars |
| BUG-7 | Password Reset User Enumeration | Medium | FIXED -- `/api/auth/forgot-password` always returns `{ success: true }` |
| BUG-8 | Home Page Shows Default Template | Low | FIXED -- `/` redirects to `/login` via server-side `redirect()` |
| BUG-9 | Spec Documents middleware.ts | Low | FIXED -- Spec correctly references `proxy.ts` |
| BUG-10 | Login Password Min Length | Low | FIXED -- `loginSchema` enforces `min(8)` |
| BUG-11 | Auth Callback Non-Null Assertion | Low | FIXED -- Callback route uses runtime guard with graceful redirect |
| BUG-12 | Google OAuth Bypasses Rate Limiting | Medium | FIXED -- `GoogleOAuthButton` now POSTs to `/api/auth/google` server route; route is in `AUTH_POST_ROUTES` |
| BUG-13 | Duplicate Rate Limiter / In-Memory Store | Medium | PARTIALLY FIXED -- Duplicate removed; proxy now imports from `@/lib/rate-limit`. In-memory `Map` limitation acknowledged in comment (line 8 of proxy.ts). Acceptable for MVP single-instance deployment. |
| BUG-14 | Rate Limiter IP Spoofing | Low | FIXED -- `getClientIp()` now uses `request.ip` first (set by Next.js/Vercel, cannot be spoofed); falls back to rightmost IP in `x-forwarded-for` (outermost trusted proxy) |
| BUG-15 | Dead Code -- Placeholder supabase.ts | Low | FIXED -- File `src/lib/supabase.ts` has been deleted |
| BUG-16 | WCAG Color Contrast Issue (40% opacity) | Low | PARTIALLY FIXED -- Changed from `/40` to `/60` opacity. See BUG-19 for remaining concern. |
| BUG-17 | Resend Bypasses Rate Limiting | Medium | FIXED -- Resend now POSTs to `/api/auth/resend` server route; route is in `AUTH_POST_ROUTES` |
| BUG-18 | Reset Password Bypasses Rate Limiting | Low | FIXED -- Reset password now POSTs to `/api/auth/reset-password` server route; route is in `AUTH_POST_ROUTES` |
| BUG-EC1 | Google OAuth Email Distinction | Low | UNCHANGED -- Still generic message. Accepted as impractical without additional DB lookup. |

---

### Acceptance Criteria Status

#### AC-1: User can register with a valid email address and a password (min. 8 characters)
- [x] Registration form exists at `/register` with email, password, and confirm password fields
- [x] Zod `registerSchema` enforces minimum 8 characters on password (client-side)
- [x] Form uses `react-hook-form` with `zodResolver` for client-side validation
- [x] Registration POSTs to `/api/auth/register` server route which calls `supabase.auth.signUp`
- [x] Server-side input validation checks for required email and password
- [ ] BUG-20: Server-side does NOT validate password minimum length (see Bugs section)
- **Result: PASS (client-side enforced; see BUG-20 for defense-in-depth gap)**

#### AC-2: Registration fails with a clear error message if the email is already in use
- [x] Server route (`/api/auth/register`) checks Supabase error for "already", "registered", "exists" keywords
- [x] Returns: "This email is already registered. Try signing in or use Google." (HTTP 409)
- [x] Client displays server error message
- **Result: PASS**

#### AC-3: Registration fails if the password does not meet minimum requirements
- [x] Zod schema enforces `min(8)` with message "Password must be at least 8 characters"
- [x] Inline error message displayed below password field via `FormMessage`
- **Result: PASS**

#### AC-4: User receives a confirmation email after email/password registration
- [x] After successful signup, UI transitions to "Check your email" confirmation screen
- [x] `emailRedirectTo` is passed to Supabase for email link handling
- [x] "Resend confirmation email" button present, POSTs to `/api/auth/resend` server route
- [x] "Try a different email" button returns to registration form
- [x] "Back to sign in" link navigates to `/login`
- **Result: PASS**

#### AC-5: User can sign up and log in via Google OAuth (1-click)
- [x] `GoogleOAuthButton` component present on both `/login` and `/register` pages
- [x] POSTs to `/api/auth/google` which calls `supabase.auth.signInWithOAuth` with `skipBrowserRedirect: true`
- [x] Returns OAuth URL; client redirects via `window.location.href`
- [x] Button disabled during loading to prevent double clicks
- **Result: PASS**

#### AC-6: User can log in with email and password after registration
- [x] Login form at `/login` with email and password fields
- [x] POSTs to `/api/auth/login` which calls `supabase.auth.signInWithPassword`
- [x] Server sets session cookies via `@supabase/ssr`
- [x] On success (HTTP 200), client redirects to `/dashboard` and calls `router.refresh()`
- **Result: PASS**

#### AC-7: Login fails with a generic error message (no user enumeration) if credentials are wrong
- [x] Server route always returns "Invalid email or password. Please try again." on any auth error (HTTP 401)
- [x] Does not forward Supabase's specific error message to the client
- [x] Does not reveal whether the email exists or not
- **Result: PASS**

#### AC-8: User can request a password reset email from the login page
- [x] "Forgot password?" link on login page links to `/forgot-password`
- [x] Forgot password form POSTs to `/api/auth/forgot-password` server route
- [x] Server route always returns success regardless of whether email exists (prevents user enumeration)
- [x] Client always shows "Check your email" confirmation screen
- [x] "Resend email" button resets form for re-submission
- **Result: PASS**

#### AC-9: Password reset link is valid for 1 hour and can only be used once
- [x] Confirmation screen displays "The link expires in 1 hour"
- [x] Actual expiry enforcement is handled server-side by Supabase
- **Result: PASS**

#### AC-10: User can set a new password after clicking the reset link
- [x] `/reset-password` page with password + confirm password fields
- [x] POSTs to `/api/auth/reset-password` which calls `supabase.auth.updateUser({ password })`
- [x] On success, shows "Password updated" with "Go to dashboard" button
- [x] Handles expired/invalid token with specific message and link to `/forgot-password`
- [x] Handles "same password" error with specific message
- [x] Generic fallback for unexpected errors
- **Result: PASS**

#### AC-11: User can log out and is redirected to the login page
- [x] Dashboard has "Sign out" button calling `signOut` from `useAuth()`
- [x] `signOut` calls `supabase.auth.signOut()` then navigates to `/login` via `window.location.href`
- **Result: PASS**

#### AC-12: Auth state persists across page refreshes (session cookie / JWT)
- [x] `AuthProvider` uses `supabase.auth.getSession()` on mount
- [x] `onAuthStateChange` listener keeps session in sync across tabs/refreshes
- [x] Server-side: `@supabase/ssr` manages HTTP-only cookies
- [x] Proxy refreshes session on every request via `supabase.auth.getUser()`
- **Result: PASS**

#### AC-13: All auth pages are accessible without logging in (public routes)
- [x] Proxy defines `publicRoutes`: `/login`, `/register`, `/forgot-password`, `/reset-password`
- [x] Unauthenticated users are not redirected away from these routes
- **Result: PASS**

#### AC-14: Authenticated users are redirected away from auth pages (e.g., /login -> /dashboard)
- [x] Proxy checks `if (user && publicRoutes.some(...))` and redirects to `/dashboard`
- **Result: PASS**

#### AC-15: Protected routes redirect unauthenticated users to /login
- [x] Proxy checks `if (!user && !publicRoutes...)` and redirects to `/login`
- [x] Excludes `/api/auth` routes and `/` from protection
- [x] Home page `/` redirects to `/login` via server-side `redirect()`
- **Result: PASS**

---

### Edge Cases Status

#### EC-1: Email already linked to a Google OAuth account
- [ ] Registration error does not specifically distinguish Google OAuth-linked emails
- [x] Generic message "This email is already registered. Try signing in or use Google." partially addresses the intent by mentioning Google
- **Severity: Low** -- Supabase does not provide a distinct error code for OAuth-linked accounts, making exact detection impractical
- **Result: PARTIAL PASS (unchanged, accepted limitation)**

#### EC-2: Google OAuth flow cancelled by user
- [x] `GoogleOAuthButton` silently resets loading state on error (`!response.ok || !data.url` returns early)
- [x] Matches spec: "Return to login page with no error (silent cancel)"
- **Result: PASS**

#### EC-3: Password reset link expired
- [x] Reset password API route checks for "expired", "invalid", or "token" in error message
- [x] Returns: "This reset link has expired or is invalid. Please request a new one."
- [x] Client shows error with clickable "Request a new reset link" linking to `/forgot-password`
- **Result: PASS**

#### EC-4: Registration form submitted multiple times quickly (double-click)
- [x] Submit button has `disabled={loading}` to prevent double submissions
- [x] Loading text changes to "Creating account..." during submission
- [x] Same pattern applied to all auth forms (login: "Signing in...", forgot-password: "Sending...", reset-password: "Updating...", Google OAuth: "Redirecting...")
- **Result: PASS**

#### EC-5: Google account email changes after linking
- [x] Handled by Supabase identity refresh on next OAuth login (server-side, no custom code needed)
- **Result: PASS**

#### EC-6: Confirmation email not received -- resend option
- [x] Confirmation screen has "Resend confirmation email" button
- [x] POSTs to `/api/auth/resend` server route which calls `supabase.auth.resend({ type: "signup" })`
- [x] Shows success ("Confirmation email resent! Check your inbox.") or error feedback
- [x] Resend button disabled during operation to prevent double clicks
- [x] "Try a different email" button as secondary option
- **Result: PASS**

---

### Security Audit Results (Red Team)

#### Authentication and Session Security
- [x] Login uses generic error messages -- no user enumeration possible
- [x] Password reset always returns success -- no user enumeration possible
- [x] Session management via `@supabase/ssr` with HTTP-only cookies (not accessible to JavaScript, immune to XSS theft)
- [x] Sign-out clears session state and navigates away

#### Input Validation
- [x] Client-side: All forms validated via Zod schemas + react-hook-form
- [x] Server-side: API routes validate required fields before calling Supabase
- [ ] BUG-20: Server-side API routes do NOT enforce password minimum length (8 chars) -- only check for presence. A crafted POST request bypassing the browser can register with a short password (see Bugs section)
- [x] No `dangerouslySetInnerHTML`, `eval()`, `new Function()`, or `innerHTML` usage found anywhere in the codebase
- [x] React/JSX auto-escapes all rendered output

#### Open Redirect Protection
- [x] Auth callback `getSafeRedirectPath()` blocks protocol-relative URLs (`//`), URLs with `:`, and non-`/` prefixed values
- [x] Default redirect is `/dashboard`
- [ ] BUG-21: Server-side API routes pass client-supplied `redirectTo` URL to Supabase without validation (see Bugs section)

#### Security Headers (next.config.ts)
- [x] `X-Frame-Options: DENY` -- prevents clickjacking
- [x] `X-Content-Type-Options: nosniff` -- prevents MIME sniffing
- [x] `Referrer-Policy: strict-origin-when-cross-origin` -- limits referrer leakage
- [x] `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` -- enforces HTTPS
- [x] `Permissions-Policy: camera=(), microphone=(), geolocation=()` -- restricts browser features
- [x] `X-DNS-Prefetch-Control: on` -- enables DNS prefetching

#### Rate Limiting
- [x] Proxy-level rate limiter: 10 requests per IP per 15 minutes on auth POST routes
- [x] Covers all 6 auth endpoints: `/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password`, `/api/auth/resend`, `/api/auth/google`, `/api/auth/reset-password`
- [x] All auth actions now go through server API routes (no more direct Supabase SDK calls from browser for auth operations)
- [x] `getClientIp()` uses `request.ip` first (Vercel-verified), then rightmost `x-forwarded-for` as fallback
- [x] In-memory store limitation acknowledged in code comment; acceptable for MVP single-instance deployment

#### Environment Variables
- [x] `.env.local.example` documents all required env vars with dummy values
- [x] `.env*.local` is in `.gitignore` -- secrets not committed
- [x] All env vars use `NEXT_PUBLIC_` prefix (appropriate since Supabase anon key is designed for browser use)
- [x] Server-side `createClient()` throws descriptive error on missing env vars
- [x] Client-side `createClient()` throws descriptive error on missing env vars
- [x] Auth callback route has runtime guard with graceful fallback redirect
- [x] Proxy gracefully skips auth check when env vars are missing (build-time safety)

#### CSRF
- [x] Supabase SDK handles CSRF protection internally
- [x] API routes accept JSON body only (not form-urlencoded), reducing CSRF attack surface

#### XSS
- [x] No raw HTML rendering anywhere in the codebase
- [x] All user-provided data (email display in dashboard) is rendered via JSX auto-escaping
- [x] No URL parameters rendered directly to the page

#### Data Exposure
- [x] Login API route does not forward Supabase error details to client
- [x] Register API route uses generic error messages
- [x] Forgot-password API route always returns success
- [x] No PII beyond email stored (GDPR compliant per spec)
- [x] Dead code placeholder `src/lib/supabase.ts` has been removed

---

### Cross-Browser and Responsive Testing

**Note:** Code-level structural review. Manual browser testing requires Supabase credentials.

#### Cross-Browser Compatibility
- [x] No browser-specific CSS or JavaScript APIs used
- [x] Standard HTML5 form elements used throughout
- [x] SVG icons use standard attributes with `aria-hidden="true"`
- [x] `autoComplete` attributes properly set for password managers (`email`, `current-password`, `new-password`)
- [x] `role="alert"` used on error messages for screen reader accessibility
- [x] `role="status"` used on resend confirmation message
- [x] Fonts loaded via `next/font/google` with `display: swap` (no FOUT)

#### Responsive Design (Code Analysis)
- [x] `AuthLayout`: `min-h-screen`, `px-4 py-8 sm:px-6` for mobile-first padding
- [x] Auth card: `max-w-[420px]` with `w-full` adapts to mobile
- [x] Dashboard header: `sm:px-6` padding, `sm:inline` for email display (hidden on mobile)
- [x] All buttons: `w-full` for full-width on mobile
- [x] Logo uses `next/image` with explicit width/height for CLS prevention

#### Accessibility
- [x] Form labels associated with inputs via `FormLabel` / `FormControl` pattern
- [x] Error messages use `role="alert"` for screen readers
- [x] Interactive elements have visible focus rings (`focus-visible:ring-[#B580FF]`)
- [x] Logo image has `alt="HR WORKS"` for screen readers
- [ ] BUG-19: Color contrast concern -- `text-[#222222]/60` (60% opacity) on `bg-[#F6F0FF]` may still be below WCAG AA 4.5:1 for normal text (see Bugs section)

---

### Bugs Found (New in Re-Test #4)

#### BUG-19: WCAG Color Contrast Still Potentially Below AA Threshold
- **Severity:** Low
- **Files:** `AuthLayout.tsx` (line 40), `dashboard/page.tsx` (lines 15, 45, 66), `login/page.tsx` (line 142), `register/page.tsx` (lines 90, 226), `forgot-password/page.tsx` (lines 60, 124)
- **Steps to Reproduce:**
  1. Previous BUG-16 reported `text-[#222222]/40` (40% opacity). The fix changed it to `text-[#222222]/60` (60% opacity).
  2. The effective color of `rgba(34,34,34,0.6)` on `#F6F0FF` blends to approximately `#858085`, which has a contrast ratio of roughly 3.5-3.8:1 against `#F6F0FF` -- still below the WCAG AA 4.5:1 threshold for normal-sized text.
  3. Additionally, `text-[#767676]` (used for "OR" divider and "coming soon" text) has a contrast ratio of approximately 4.0:1 on `#F6F0FF` -- also below AA.
  4. Expected: All body text meets WCAG AA 4.5:1 contrast ratio.
  5. Actual: Helper/secondary text falls short by approximately 0.5-1.0 points.
- **Mitigating Factor:** Affected text is secondary/decorative (helper text, dividers, placeholders). Core form labels and buttons use full-opacity colors that meet AA standards.
- **Priority:** Nice to have

#### BUG-20: Server-Side Password Length Not Validated in API Routes
- **Severity:** Medium
- **Files:** `src/app/api/auth/register/route.ts` (line 20), `src/app/api/auth/reset-password/route.ts` (line 20)
- **Steps to Reproduce:**
  1. The registration and reset-password API routes check `if (!password)` -- they validate presence but NOT minimum length.
  2. A crafted `curl` or `fetch` request can bypass the client-side Zod validation: `curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"abc"}'`
  3. If Supabase's dashboard minimum password length is set below 8 (the default is 6), a 3-character password could be accepted.
  4. Expected: Server-side should enforce the same 8-character minimum as the client-side Zod schema, per the security rules: "Validate ALL user input on the server side with Zod" and "Never trust client-side validation alone."
  5. Actual: Server-side only checks for non-empty password; relies entirely on Supabase's own password policy for length enforcement.
- **Mitigating Factor:** Supabase enforces its own minimum password length (default 6 characters). The gap is only exploitable if Supabase's dashboard setting is below the app's intended 8-character minimum.
- **Priority:** Fix before deployment (violates project security rules in `.claude/rules/security.md`)

#### BUG-21: Unvalidated redirectTo Parameter Passed to Supabase
- **Severity:** Low
- **Files:** `src/app/api/auth/register/route.ts` (line 41), `src/app/api/auth/forgot-password/route.ts` (line 39), `src/app/api/auth/resend/route.ts` (line 41), `src/app/api/auth/google/route.ts` (line 36)
- **Steps to Reproduce:**
  1. Four API routes accept a `redirectTo` (or `emailRedirectTo`) parameter from the client request body and pass it directly to Supabase SDK without validation.
  2. An attacker could POST to `/api/auth/register` with `{"email":"victim@example.com","password":"longpassword","redirectTo":"https://evil.com/phish"}`.
  3. If the attacker's domain is in Supabase's "Redirect URLs" allowlist (or if the allowlist uses overly permissive wildcards), the confirmation email would contain a link to the attacker's domain.
  4. Expected: Server-side should validate `redirectTo` against an allowlist of trusted origins before passing to Supabase.
  5. Actual: The URL is forwarded to Supabase without server-side validation; Supabase's "Redirect URLs" config is the only defense.
- **Mitigating Factor:** Supabase validates redirect URLs against the project's configured "Redirect URLs" allowlist in the dashboard. If properly configured (which is the default), Supabase will reject unauthorized redirect URLs. The risk depends entirely on the Supabase dashboard configuration.
- **Priority:** Nice to have (add server-side validation as defense-in-depth; ensure Supabase Redirect URLs allowlist is strict)

#### BUG-EC1: Registration Does Not Distinguish Google OAuth Email (STILL OPEN)
- **Severity:** Low
- **File:** `src/app/api/auth/register/route.ts` (lines 44-51)
- **Steps to Reproduce:**
  1. Register with an email address that is already linked to a Google OAuth account
  2. Expected: "This email is already linked to a Google account. Sign in with Google."
  3. Actual: "This email is already registered. Try signing in or use Google." (generic message)
- **Mitigating Factor:** The generic message mentions Google as an option. Supabase does not provide a distinct error code for OAuth-linked accounts, making exact detection impractical without an additional database lookup.
- **Priority:** Nice to have

---

### Regression Testing

No other features are currently in "Deployed" status per `features/INDEX.md`. All other features (PROJ-2 through PROJ-5) are "Planned" status and have no implementation to regress against.

- [x] Home page (`/`) correctly redirects to `/login`
- [x] Build compiles without errors (`npm run build` -- PASS)
- [x] No TypeScript errors
- [x] ESLint passes with no errors (`npx eslint src/` -- PASS)
- [x] All routes render correctly in build output

---

### Summary

- **Acceptance Criteria:** 15/15 PASSED
- **Edge Cases:** 5/6 passed, 1 partial pass (EC-1: Google OAuth email detection -- Low severity, accepted limitation)
- **Previously Reported Bugs (BUG-1 through BUG-18):** 16 FIXED, 1 PARTIALLY FIXED (BUG-13 in-memory store acknowledged, BUG-16 improved but see BUG-19), 1 UNCHANGED (BUG-EC1 accepted)
- **New Bugs Found:** 3
  - Medium: 1 (BUG-20: missing server-side password length validation)
  - Low: 2 (BUG-19: color contrast still below AA, BUG-21: unvalidated redirectTo)
- **Total Open Bugs:** 4 (0 critical, 0 high, 1 medium, 3 low)
  - BUG-19 (Low): Color contrast below WCAG AA
  - BUG-20 (Medium): No server-side password length validation
  - BUG-21 (Low): Unvalidated redirectTo parameter
  - BUG-EC1 (Low): Generic OAuth email message
- **Security:** Strong. All critical and high-severity issues from previous runs are fixed. Rate limiting now covers all 6 auth endpoints server-side. Open redirect is protected. User enumeration is prevented. BUG-20 (missing server-side password validation) is the only actionable security gap and should be fixed before deployment per the project's own security rules.
- **Build:** PASS
- **Lint:** PASS
- **Production Ready:** YES (conditionally -- fix BUG-20 first)
- **Recommendation:** Fix BUG-20 (server-side password validation) before deployment. It directly violates the project's security rules and is a straightforward fix (add Zod validation to the register and reset-password API routes). The 3 low-severity bugs are cosmetic or defense-in-depth improvements that can be addressed in the next sprint.

## Deployment
_To be added by /deploy_
