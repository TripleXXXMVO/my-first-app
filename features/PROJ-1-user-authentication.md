# PROJ-1: User Authentication

## Status: Deployed
**Created:** 2026-03-20
**Last Updated:** 2026-04-05

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

## Architecture Change: Remove Google OAuth (2026-03-22) — IMPLEMENTED

**Status:** Complete. Build passes, lint passes.

### Motivation
Google OAuth is being removed to simplify the authentication surface. Email/password + password reset is sufficient for the MVP.

### What Gets Deleted
- `src/components/auth/GoogleOAuthButton.tsx` — entire file
- `src/app/api/auth/google/route.ts` — entire file

### What Gets Updated
- `/login` page — remove `GoogleOAuthButton` and "OR" divider
- `/register` page — remove `GoogleOAuthButton` and "OR" divider
- Rate limiter config (`src/lib/rate-limit.ts` or `src/proxy.ts`) — remove `/api/auth/google` from protected routes list

### What Stays Unchanged
- Email/password login and registration
- Password reset flow
- Auth callback route (still needed for email confirmation links)
- Session management, route protection, rate limiting on remaining routes

### Simplified Auth Structure (After)
```
/login
+-- LoginForm
|   +-- EmailInput + PasswordInput
|   +-- "Forgot password?" Link

/register
+-- RegisterForm
|   +-- EmailInput + PasswordInput + ConfirmPasswordInput
```

### Bugs Closed by This Change
- BUG-EC1 (Google OAuth email distinction) — no longer relevant
- BUG-12 (Google OAuth bypasses rate limiting) — no longer relevant (route deleted)

---

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

## QA Test Results (Re-Test #6 -- Post Bug Fix Commit b8bfb85)

**Tested:** 2026-03-22
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)
**Build Status:** PASS (Next.js 16, compiled successfully, no TypeScript errors)
**Lint Status:** PASS (ESLint -- no errors)
**Scope:** Full re-test after bug fix commit b8bfb85 (BUG-25, BUG-19, BUG-21, BUG-26) and uncommitted Google OAuth removal

---

### Previous Bug Fix Verification

All bugs from previous QA runs (BUG-1 through BUG-26 and BUG-EC1) have been re-verified against the current working tree.

| Bug | Description | Previous Severity | Status |
|-----|-------------|-------------------|--------|
| BUG-1 | Open Redirect in Auth Callback | Critical | FIXED -- `getSafeRedirectPath()` validates `next` param |
| BUG-2 | No Security Headers | High | FIXED -- `next.config.ts` sets all required headers |
| BUG-3 | Missing .env.local.example | Medium | FIXED -- `.env.local.example` exists with dummy values |
| BUG-4 | Missing Resend Confirmation Email | Medium | FIXED -- "Resend confirmation email" button present |
| BUG-5 | No Rate Limiting on Auth Endpoints | High | FIXED -- Proxy rate limiter covers all auth POST routes |
| BUG-5b | Rate Limiting Ineffective (client-side calls) | High | FIXED -- All auth forms use server API routes |
| BUG-6 | Server-Side Non-Null Assertion | Medium | FIXED -- Descriptive error on missing env vars |
| BUG-7 | Password Reset User Enumeration | Medium | FIXED -- Always returns success |
| BUG-8 | Home Page Shows Default Template | Low | FIXED -- `/` redirects to `/login` |
| BUG-9 | Spec Documents middleware.ts | Low | FIXED -- Spec references `proxy.ts` |
| BUG-10 | Login Password Min Length | Low | FIXED -- `loginSchema` enforces `min(8)` |
| BUG-11 | Auth Callback Non-Null Assertion | Low | FIXED -- Runtime guard with graceful redirect |
| BUG-12 | Google OAuth Bypasses Rate Limiting | Medium | N/A -- Google OAuth removed entirely |
| BUG-13 | Duplicate Rate Limiter / In-Memory Store | Medium | PARTIALLY FIXED -- Acceptable for MVP single-instance |
| BUG-14 | Rate Limiter IP Spoofing | Low | FIXED -- Uses `request.ip` first |
| BUG-15 | Dead Code -- Placeholder supabase.ts | Low | FIXED -- File deleted |
| BUG-16 | WCAG Color Contrast Issue (40% opacity) | Low | PARTIALLY FIXED -- Changed to `/60`, see BUG-19 |
| BUG-17 | Resend Bypasses Rate Limiting | Medium | FIXED -- POSTs to server route |
| BUG-18 | Reset Password Bypasses Rate Limiting | Low | FIXED -- POSTs to server route |
| BUG-19 | WCAG Color Contrast Below AA | Low | PARTIALLY FIXED -- Auth pages now use `#6b6b6b`; dashboard still uses `#222222/60` (see BUG-19 updated below) |
| BUG-20 | Server-Side Password Length Not Validated | Medium | FIXED -- `password.length < 8` check in register and reset-password routes |
| BUG-21 | Unvalidated redirectTo Parameter | Low | PARTIALLY FIXED -- Pathname validation added, but hostname not validated (see BUG-27) |
| BUG-25 | Register Error References Google | Low | FIXED -- Now says "Try signing in instead." |
| BUG-26 | Empty google directory remains | Low | FIXED -- `src/app/api/auth/google/` directory no longer exists |
| BUG-EC1 | Google OAuth Email Distinction | Low | N/A -- Google OAuth removed |

---

### Acceptance Criteria Status

#### AC-1: User can register with a valid email address and a password (min. 8 characters)
- [x] Registration form exists at `/register` with email, password, and confirm password fields
- [x] Zod `registerSchema` enforces minimum 8 characters on password (client-side)
- [x] Form uses `react-hook-form` with `zodResolver` for client-side validation
- [x] Registration POSTs to `/api/auth/register` server route which calls `supabase.auth.signUp`
- [x] Server-side validates required email and password
- [x] Server-side enforces `password.length < 8` (BUG-20 fixed)
- **Result: PASS**

#### AC-2: Registration fails with a clear error message if the email is already in use
- [x] Server route checks Supabase error for "already", "registered", "exists" keywords
- [x] Returns "This email is already registered. Try signing in instead." (BUG-25 FIXED)
- [x] Client displays server error message via `serverError` state
- **Result: PASS**

#### AC-3: Registration fails if the password does not meet minimum requirements
- [x] Zod schema enforces `min(8)` with message "Password must be at least 8 characters"
- [x] Server-side also enforces `password.length < 8` with HTTP 400 response
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
- [x] REMOVED by architecture decision (2026-03-22). Google OAuth descoped from MVP.
- [x] `GoogleOAuthButton.tsx` file deleted -- verified no file on disk
- [x] `/api/auth/google/route.ts` file deleted -- verified no file on disk
- [x] `src/app/api/auth/google/` directory deleted -- verified no directory on disk (BUG-26 FIXED)
- [x] Login and register pages no longer show Google button or "OR" divider
- [x] `/api/auth/google` removed from `AUTH_POST_ROUTES` in proxy.ts
- [x] No remaining imports of `GoogleOAuthButton` in any source file (verified via grep)
- **Result: N/A (removed per architecture change)**

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
- [x] "Resend email" button calls the same endpoint again
- **Result: PASS**

#### AC-9: Password reset link is valid for 1 hour and can only be used once
- [x] Confirmation screen displays "The link expires in 1 hour"
- [x] Actual expiry enforcement is handled server-side by Supabase
- **Result: PASS**

#### AC-10: User can set a new password after clicking the reset link
- [x] `/reset-password` page with password + confirm password fields
- [x] POSTs to `/api/auth/reset-password` which calls `supabase.auth.updateUser({ password })`
- [x] Server-side enforces `password.length < 8` (BUG-20 fixed)
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
- [x] N/A -- Google OAuth has been removed from the MVP.
- **Result: N/A (removed per architecture change)**

#### EC-2: Google OAuth flow cancelled by user
- [x] N/A -- Google OAuth has been removed from the MVP.
- **Result: N/A (removed per architecture change)**

#### EC-3: Password reset link expired
- [x] Reset password API route checks for "expired", "invalid", or "token" in error message
- [x] Returns: "This reset link has expired or is invalid. Please request a new one."
- [x] Client shows error with clickable "Request a new reset link" linking to `/forgot-password`
- **Result: PASS**

#### EC-4: Registration form submitted multiple times quickly (double-click)
- [x] Submit button has `disabled={loading}` to prevent double submissions
- [x] Loading text changes to "Creating account..." during submission
- [x] Same pattern applied to all auth forms (login: "Signing in...", forgot-password: "Sending...", reset-password: "Updating...")
- **Result: PASS**

#### EC-5: Google account email changes after linking
- [x] N/A -- Google OAuth has been removed from the MVP.
- **Result: N/A (removed per architecture change)**

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
- [x] Server-side: Register and reset-password routes enforce `password.length < 8` (BUG-20 fixed)
- [x] No `dangerouslySetInnerHTML`, `eval()`, `new Function()`, or `innerHTML` usage found anywhere in the codebase
- [x] React/JSX auto-escapes all rendered output

#### Open Redirect Protection
- [x] Auth callback `getSafeRedirectPath()` blocks protocol-relative URLs (`//`), URLs with `:`, and non-`/` prefixed values
- [x] Default redirect is `/dashboard`
- [x] `redirectTo` validation added to register, forgot-password, and resend routes (BUG-21 fix)
- [ ] BUG-27: `redirectTo` validation checks pathname only, not hostname -- allows external domains with matching pathname (see Bugs section)

#### Security Headers (next.config.ts)
- [x] `X-Frame-Options: DENY` -- prevents clickjacking
- [x] `X-Content-Type-Options: nosniff` -- prevents MIME sniffing
- [x] `Referrer-Policy: strict-origin-when-cross-origin` -- limits referrer leakage
- [x] `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` -- enforces HTTPS
- [x] `Permissions-Policy: camera=(), microphone=(), geolocation=()` -- restricts browser features
- [x] `X-DNS-Prefetch-Control: on` -- enables DNS prefetching

#### Rate Limiting
- [x] Proxy-level rate limiter: 10 requests per IP per 15 minutes on auth POST routes
- [x] Covers all 5 auth endpoints: `/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password`, `/api/auth/resend`, `/api/auth/reset-password`
- [x] Google OAuth route correctly removed from `AUTH_POST_ROUTES`
- [x] All auth actions go through server API routes (no direct Supabase SDK calls from browser for auth operations)
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

#### Google OAuth Removal Verification
- [x] `GoogleOAuthButton.tsx` deleted -- no file on disk
- [x] `/api/auth/google/route.ts` deleted -- no file on disk
- [x] `src/app/api/auth/google/` directory deleted -- no directory on disk (BUG-26 FIXED)
- [x] No imports of `GoogleOAuthButton` in any remaining source file (verified via grep)
- [x] `/api/auth/google` removed from `AUTH_POST_ROUTES` in proxy.ts
- [x] Login page no longer renders Google button or "OR" divider
- [x] Register page no longer renders Google button or "OR" divider
- [x] Register error message no longer references Google (BUG-25 FIXED)

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
- [ ] BUG-19: Color contrast on dashboard still below WCAG AA threshold (see Bugs section)

---

### Bugs Found (New in Re-Test #6)

#### BUG-27: redirectTo Validation Checks Pathname But Not Hostname (Incomplete Fix for BUG-21)
- **Severity:** Low
- **Files:** `src/app/api/auth/register/route.ts` (lines 27-34), `src/app/api/auth/forgot-password/route.ts` (lines 24-31), `src/app/api/auth/resend/route.ts` (lines 24-31)
- **Steps to Reproduce:**
  1. Send a POST request to `/api/auth/register` with body `{ "email": "test@example.com", "password": "12345678", "redirectTo": "https://evil.com/api/auth/callback" }`.
  2. The server parses the URL, checks `parsed.pathname.startsWith("/api/auth/callback")`, and this check PASSES because the pathname is `/api/auth/callback` regardless of the hostname.
  3. Expected: The server should reject `redirectTo` URLs pointing to external domains.
  4. Actual: The URL passes validation and is forwarded to Supabase's `emailRedirectTo`.
  5. Same vulnerability exists in `/api/auth/forgot-password` (checks `/reset-password` pathname) and `/api/auth/resend` (checks `/api/auth/callback` pathname).
- **Mitigation:** Supabase's server-side Redirect URLs allowlist is the primary defense. If the allowlist is configured correctly (specific origins only, no wildcards), Supabase will reject external redirect URLs. This is a defense-in-depth concern.
- **Fix:** Add `parsed.origin === new URL(request.url).origin` check alongside the pathname check, or construct the redirect URL server-side rather than accepting it from the client.
- **Impact:** If Supabase's allowlist is misconfigured, an attacker could craft registration/reset emails that redirect users to a phishing site after clicking the confirmation link.
- **Priority:** Fix in next sprint (mitigated by Supabase allowlist)

#### BUG-28: No Error Handling for Network Failures in Client-Side Form Submissions
- **Severity:** Medium
- **Files:** `src/app/login/page.tsx` (lines 34-53), `src/app/register/page.tsx` (lines 38-61, 63-80), `src/app/forgot-password/page.tsx` (lines 35-51), `src/app/reset-password/page.tsx` (lines 38-57)
- **Steps to Reproduce:**
  1. Open any auth page (e.g., `/login`).
  2. Disconnect from the network (e.g., enable airplane mode, or stop the dev server).
  3. Submit the form.
  4. Expected: A user-friendly error message like "Network error. Please check your connection and try again." The submit button should return to its enabled state.
  5. Actual: The `fetch()` call throws an unhandled exception. The `loading` state remains `true` because `setLoading(false)` is never reached. The submit button stays permanently disabled with loading text (e.g., "Signing in..."). The user must refresh the page to try again. On the login page specifically, `response.json()` on a failed fetch will also throw.
- **Impact:** Users who experience any network interruption during form submission will see a frozen form with no feedback. They must manually refresh the page to recover.
- **Priority:** Fix before deployment

---

### Previously Open Bugs (Carried Forward)

#### BUG-19: WCAG Color Contrast Below AA Threshold on Dashboard (PARTIALLY FIXED)
- **Severity:** Low
- **Files:** `src/app/dashboard/page.tsx` (lines 15, 45, 66 -- `text-[#222222]/60`), `src/app/dashboard/page.tsx` (line 71 -- `text-[#767676]`)
- **Summary:** Auth pages have been updated to use `text-[#6b6b6b]` which is an improvement. However, the dashboard still uses `text-[#222222]/60` on `bg-[#F6F0FF]` (~3.5-3.8:1 contrast) and `text-[#767676]` on white (~4.54:1, borderline). The `text-[#222222]/60` on white backgrounds in the dashboard header is approximately 4.5:1 (borderline pass). Overall, the issue is now limited to the dashboard page only.
- **Priority:** Nice to have

#### BUG-13: In-Memory Rate Limit Store (Accepted for MVP)
- **Severity:** Low (downgraded from Medium)
- **Summary:** Rate limiter uses in-memory Map, which resets on process restart and does not work across multiple instances. Acknowledged in code comment. Acceptable for MVP single-instance deployment on Vercel.
- **Priority:** Fix when scaling to multi-instance

---

### Regression Testing

No other features are currently in "Deployed" status per `features/INDEX.md`. All other features (PROJ-2 through PROJ-5) are "Planned" status and have no implementation to regress against.

- [x] Home page (`/`) correctly redirects to `/login`
- [x] Build compiles without errors (`npm run build` -- PASS)
- [x] No TypeScript errors
- [x] ESLint passes with no errors (`npx eslint src/` -- PASS)
- [x] All routes render correctly in build output
- [x] Google OAuth removal did not break any remaining pages or routes
- [x] Auth callback route still handles email confirmation and PKCE flows correctly
- [x] No remaining references to Google OAuth in application code (only `next/font/google` import, which is unrelated)

---

### Summary

- **Acceptance Criteria:** 14/14 PASSED (AC-5 Google OAuth marked N/A -- removed by architecture decision)
- **Edge Cases:** 3/3 applicable passed (EC-1, EC-2, EC-5 marked N/A -- related to removed Google OAuth)
- **Previously Reported Bugs (BUG-1 through BUG-26, BUG-EC1):**
  - 19 FIXED (BUG-1 through BUG-11, BUG-14 through BUG-18, BUG-20, BUG-25, BUG-26)
  - 2 PARTIALLY FIXED (BUG-13 in-memory store, BUG-19 color contrast -- dashboard only, BUG-21 redirectTo -- pathname checked but not hostname)
  - 2 N/A (BUG-12, BUG-EC1 -- Google OAuth removed)
  - 1 SUPERSEDED (BUG-16 -- replaced by BUG-19)
- **New Bugs Found:** 2
  - Medium: 1 (BUG-28: no error handling for network failures in form submissions)
  - Low: 1 (BUG-27: redirectTo hostname not validated)
- **Total Open Bugs:** 4 (0 critical, 0 high, 1 medium, 3 low)
  - BUG-28 (Medium): Network failure leaves forms frozen -- fix before deployment
  - BUG-27 (Low): redirectTo hostname not validated -- fix in next sprint (mitigated by Supabase allowlist)
  - BUG-19 (Low): Dashboard color contrast below WCAG AA -- nice to have
  - BUG-13 (Low): In-memory rate limit store -- fix when scaling
- **Security:** Strong. All previous critical, high, and medium security issues are resolved. The new BUG-27 is a defense-in-depth concern mitigated by Supabase's Redirect URLs allowlist. Rate limiting covers all auth endpoints. Open redirect is protected on the callback route. User enumeration is prevented on all relevant endpoints. No XSS vectors found. CSRF is handled by JSON-only API routes and Supabase SDK.
- **Build:** PASS
- **Lint:** PASS
- **Production Ready:** NO -- BUG-28 (medium) must be fixed first
- **Recommendation:** Fix BUG-28 by wrapping all client-side `fetch()` calls in try/catch blocks with appropriate error messaging and `setLoading(false)` in a finally clause. This affects 5 form handlers across 4 pages. After fixing BUG-28, the feature will be production-ready. BUG-27, BUG-19, and BUG-13 can be addressed in subsequent sprints.

## Deployment
_To be added by /deploy_
