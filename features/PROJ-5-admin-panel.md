# PROJ-5: Admin Panel

## Status: In Review
**Created:** 2026-03-20
**Last Updated:** 2026-03-27

## Dependencies
- Requires: PROJ-1 (User Authentication) — admin must be authenticated
- Requires: PROJ-2 (User Profile & Dashboard) — user data to display
- Requires: PROJ-4 (Subscription & Payment) — plan data to display per user

## User Stories
- As an admin, I want to see a list of all registered users so that I can monitor the user base.
- As an admin, I want to see each user's plan (Free/Pro) and registration date so that I can track growth.
- As an admin, I want to search and filter users by email, plan, or join date so that I can quickly find specific accounts.
- As an admin, I want to manually change a user's plan (e.g., grant Pro access) so that I can handle support cases.
- As an admin, I want to deactivate or delete a user account so that I can handle abuse or GDPR deletion requests.
- As an admin, I want to see high-level platform stats (total users, active users, conversions) so that I can track business health.

## Acceptance Criteria
- [ ] Admin panel is only accessible to users with the `admin` role
- [ ] Non-admin users who access /admin are redirected to /dashboard with an error message
- [ ] Admin dashboard (/admin) shows: total users, new signups (last 7 days), free vs. paid user counts
- [ ] User list (/admin/users) shows: email, display name, plan, join date, last login
- [ ] User list supports search by email and filter by plan (Free/Pro)
- [ ] User list is paginated (50 per page)
- [ ] Admin can click a user to see their detail page (/admin/users/[id])
- [ ] Admin can manually change a user's plan (Free ↔ Pro) from the detail page
- [ ] Admin can deactivate a user (disables login without deleting data)
- [ ] Admin can permanently delete a user with a confirmation dialog
- [ ] All admin actions are logged (audit log stored in DB with: action, admin_id, target_user_id, timestamp)
- [ ] Admin role is assigned directly in the database (not self-assignable via UI)

## Edge Cases
- What if an admin tries to delete their own account? → Block the action with an error: "You cannot delete your own admin account."
- What if an admin tries to change the plan of a user with an active Stripe subscription? → Show a warning: "This user has an active Stripe subscription. Cancel it in Stripe first."
- What if the search query returns no results? → Show an empty state with a "clear search" option.
- What if there are thousands of users? → Paginate the user list; use database-side filtering (not client-side).
- What if a non-admin discovers the /admin route? → Server-side role check; return 403 / redirect.

## Technical Requirements
- **Authorization:** Role-based access control — `role` column on `users` table (`user` | `admin`)
- **RLS:** Admin routes must check role server-side (not just client-side) to prevent privilege escalation
- **Audit Log:** `admin_audit_log` table: (id, admin_id, action, target_user_id, metadata, created_at)
- **Routes:**
  - `/admin` — Admin overview / stats (protected, admin only)
  - `/admin/users` — User list (protected, admin only)
  - `/admin/users/[id]` — User detail & actions (protected, admin only)
- **Security:** All admin API routes must verify `admin` role server-side before processing

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Component Structure

```
/admin layout (AdminShell — wraps AppShell, adds admin sidebar nav)
|
+-- /admin (AdminDashboardPage)
|   +-- StatsGrid (4 cards: Total Users, New This Week, Free, Pro)
|   +-- RecentActivityFeed (last 10 audit log entries)
|
+-- /admin/users (AdminUsersPage)
|   +-- AdminUserFilterBar (search by email, filter by plan)
|   +-- AdminUserTable (email, name, plan badge, join date, last login)
|   |   +-- PlanBadge (reuses existing Badge component)
|   +-- TaskPagination (reuse existing Pagination component)
|
+-- /admin/users/[id] (AdminUserDetailPage)
    +-- UserInfoCard (avatar, email, name, join date)
    +-- PlanSection (current plan + Change Plan selector)
    +-- AccountStatusSection (Active/Deactivated toggle)
    +-- DangerZone (Delete User button + confirmation dialog)
    +-- AuditLogSection (actions taken on this user)
```

### Data Model

**Existing tables — extended:**
- `profiles` table: add `role` column (`user` | `admin`). Set directly in DB only — not changeable via UI.
- `subscriptions` table (from PROJ-4): reused as-is for plan data.

**New table — `admin_audit_log`:**
- `id` — unique identifier
- `admin_id` — which admin performed the action
- `action` — what happened (e.g. "changed_plan", "deactivated_user", "deleted_user")
- `target_user_id` — which user was affected
- `metadata` — extra details (e.g. old/new plan values)
- `created_at` — timestamp

### Route & API Design

| Route | Purpose | Protection |
|---|---|---|
| `/admin` | Stats dashboard | Admin role, server-checked |
| `/admin/users` | Paginated user list | Admin role, server-checked |
| `/admin/users/[id]` | User detail + actions | Admin role, server-checked |
| `GET /api/admin/stats` | Fetch platform stats | Server verifies admin role |
| `GET /api/admin/users` | Paginated + filtered user list | Server verifies admin role |
| `GET /api/admin/users/[id]` | Single user detail | Server verifies admin role |
| `PATCH /api/admin/users/[id]` | Change plan or deactivate user | Server verifies admin role |
| `DELETE /api/admin/users/[id]` | Permanently delete user | Server verifies admin role |

**Security is layered:**
1. Next.js Middleware — checks `admin` role on every `/admin/*` request, redirects non-admins to `/dashboard`
2. API Routes — independently verify admin role before any DB write (defence in depth)

### Tech Decisions

| Decision | Choice | Why |
|---|---|---|
| Layout | Extend existing `AppShell` + `AppSidebar` | Consistent app chrome, no duplicate code |
| Data fetching | Server Components | Admin data never exposed in browser network tab |
| User table | Reuse `Table` + `Pagination` shadcn components | Already installed, same pattern as Task list |
| Search/Filter | Database-side filtering via API query params | Handles large user counts without loading all data |
| Confirmation dialogs | Reuse `AlertDialog` shadcn component | Already installed, consistent UX |
| Plan change | `Select` dropdown + server PATCH | Simple manual override, no Stripe call needed |

### New Components to Build

| Component | Location |
|---|---|
| `AdminShell` (admin nav wrapper) | `src/components/admin/AdminShell.tsx` |
| `AdminStatsGrid` | `src/components/admin/AdminStatsGrid.tsx` |
| `AdminUserTable` | `src/components/admin/AdminUserTable.tsx` |
| `AdminUserFilterBar` | `src/components/admin/AdminUserFilterBar.tsx` |
| `AdminUserDetailPage` | `src/components/admin/AdminUserDetailPage.tsx` |
| `AdminAuditLog` | `src/components/admin/AdminAuditLog.tsx` |

### Dependencies
No new packages required — all needed UI components and Supabase are already installed.

## Frontend Implementation Notes
**Implemented:** 2026-03-30

### Files Created
- `src/lib/admin.ts` — Admin types, API utilities, and audit log formatter
- `src/hooks/use-admin.ts` — Three hooks: `useAdminStats`, `useAdminUsers`, `useAdminUserDetail`
- `src/components/admin/AdminStatsGrid.tsx` — 4-card stats grid (Total Users, New This Week, Free, Pro)
- `src/components/admin/AdminAuditLog.tsx` — Scrollable audit log with action badges
- `src/components/admin/AdminUserFilterBar.tsx` — Search by email + plan filter with debounce
- `src/components/admin/AdminUserTable.tsx` — Paginated user table with avatar, plan badge, status dot
- `src/components/admin/AdminUserDetailPage.tsx` — User info, plan change, activate/deactivate, delete with confirmation
- `src/components/admin/AdminDashboardContent.tsx` — Dashboard page client component
- `src/components/admin/AdminUsersContent.tsx` — Users list page client component
- `src/app/admin/page.tsx` — Admin dashboard route (server-side role check)
- `src/app/admin/users/page.tsx` — User management route (server-side role check)
- `src/app/admin/users/[id]/page.tsx` — User detail route (server-side role check)

### Files Modified
- `src/components/layout/AppSidebar.tsx` — Added conditional admin nav section (visible only to admin role)

### Design Decisions
- All three admin pages perform server-side role checks before rendering (redirect non-admins to /dashboard)
- Sidebar admin section loads role via client-side Supabase query (defence in depth — server check is primary)
- Reused existing shadcn/ui Table, Pagination, Badge, AlertDialog, Select, Switch components
- Search input uses 400ms debounce to avoid excessive API calls
- User detail page shows plan change via Select dropdown, account toggle via Switch, and delete via AlertDialog

## Backend Implementation Notes
**Implemented:** 2026-03-30

### Database Migration
- File: `supabase/migrations/20260330_admin_panel.sql`
- Extended `profiles` table with `role` (user|admin) and `is_active` (boolean) columns
- Created `admin_audit_log` table with RLS (admin-only read/insert, no update/delete — immutable)
- Added indexes on: `profiles.role`, `profiles.is_active`, `admin_audit_log.admin_id`, `admin_audit_log.target_user_id`, `admin_audit_log.created_at`, `admin_audit_log.action`
- RLS policies: admins can read/update/delete all profiles; admins can read/insert audit logs

### API Routes Created
- `GET /api/admin/stats` — Platform stats (total users, new this week, free/pro counts) + optional audit log
- `GET /api/admin/users` — Paginated user list with search (email) and plan filter, Zod-validated query params
- `GET /api/admin/users/[id]` — Single user detail with audit log entries (emails resolved via batch query)
- `PATCH /api/admin/users/[id]` — Change plan or activate/deactivate user; checks for active Stripe subscription before plan change (returns 409 with warning)
- `DELETE /api/admin/users/[id]` — Hard-delete from auth.users (service role key) + cascade to profiles; blocks self-deletion
- `PATCH /api/admin/users/[id]/role` — Change user role (user <-> admin); blocks self-role-change

### Supporting Files Created/Modified
- `src/lib/admin-auth.ts` — Shared admin auth helper (verifies session + admin role from profiles)
- `src/lib/validations/admin.ts` — Zod schemas for all admin endpoints (updateUserSchema, updateUserRoleSchema, userIdSchema, adminUserListQuerySchema)
- `src/lib/rate-limit.ts` — Added `isAdminRateLimited()` with 60 requests / 15 min window
- `src/lib/admin.ts` — Added `updateAdminUserRole()` fetch helper + "changed_role" to audit action formatter
- `.env.local.example` — Updated comment for SUPABASE_SERVICE_ROLE_KEY usage

### Security Design
- All admin API routes verify admin role server-side via `requireAdmin()` (defence in depth with RLS)
- Rate limiting: 60 requests per 15 minutes for admin endpoints (more generous than regular users)
- Zod validation on all write endpoints (PATCH plan/status, PATCH role)
- UUID validation on all path parameters
- Self-deletion and self-role-change blocked with explicit error messages
- Active Stripe subscription check returns 409 warning before manual plan override
- Audit log entries are immutable (no UPDATE/DELETE RLS policies)
- Hard-delete uses service role key (never exposed to browser)

## QA Test Results

**Tested:** 2026-03-30
**App URL:** http://localhost:3000
**Tester:** QA Engineer (AI)
**Build Status:** PASS (compiles with zero TypeScript errors)

### Acceptance Criteria Status

#### AC-1: Admin panel is only accessible to users with the `admin` role
- [x] Server-side role check on `/admin` page (redirects non-admins to `/dashboard?error=unauthorized`)
- [x] Server-side role check on `/admin/users` page
- [x] Server-side role check on `/admin/users/[id]` page
- [x] All API routes verify admin role via `requireAdmin()` before processing
- [x] RLS policies restrict database access to admin role only

#### AC-2: Non-admin users who access /admin are redirected to /dashboard with error message
- [x] All three admin pages redirect to `/dashboard?error=unauthorized`
- [x] BUG-1: **FIXED** Middleware now checks admin role on `/admin/*` routes (redirects to `/dashboard?error=unauthorized`)

#### AC-3: Admin dashboard shows stats (total users, new signups, free vs. paid)
- [x] `GET /api/admin/stats` returns totalUsers, newThisWeek, freeUsers, proUsers
- [x] StatsGrid renders 4 cards with correct labels and icons
- [x] Loading skeleton displayed while fetching
- [x] Error state displayed on failure

#### AC-4: User list shows email, display name, plan, join date, last login
- [x] Table renders email, display_name, plan badge, join date columns
- [x] Last login column is present
- [x] BUG-2: **FIXED** `last_sign_in_at` now fetched from `auth.users` via admin client

#### AC-5: User list supports search by email and filter by plan
- [x] Search by email uses `ilike` (case-insensitive partial match) with 400ms debounce
- [x] Plan filter via Select dropdown (All/Free/Pro)
- [x] BUG-3: **FIXED** Plan filter now applied at DB level before pagination

#### AC-6: User list is paginated (50 per page)
- [x] `ADMIN_USERS_PER_PAGE = 50` used for pagination
- [x] Pagination component renders page numbers, previous/next buttons
- [x] `aria-disabled` set on boundary pages
- [x] Page counter shows "Page X of Y"

#### AC-7: Admin can click a user to see their detail page
- [x] Each row links to `/admin/users/[id]`
- [x] ChevronRight icon indicates clickability
- [x] Detail page loads user info, plan, status, and audit log

#### AC-8: Admin can manually change a user's plan (Free <-> Pro)
- [x] Select dropdown with Free/Pro options on detail page
- [x] PATCH endpoint creates/updates subscription record
- [x] Audit log entry created for plan change
- [x] "Saving..." indicator while processing

#### AC-9: Admin can deactivate a user (disables login without deleting data)
- [x] Switch toggle on detail page for is_active
- [x] PATCH endpoint updates `is_active` column
- [x] Audit log entry created (activated_user / deactivated_user)
- [x] BUG-4: **FIXED** Login route blocks deactivated users; middleware signs them out and redirects

#### AC-10: Admin can permanently delete a user with confirmation dialog
- [x] AlertDialog with confirmation text showing user email
- [x] DELETE endpoint uses service role key for `auth.admin.deleteUser()`
- [x] Audit log entry created BEFORE deletion (preserves reference)
- [x] Redirects to `/admin/users` after successful deletion

#### AC-11: All admin actions are logged (audit log)
- [x] `admin_audit_log` table with: action, admin_id, target_user_id, metadata, created_at
- [x] Plan changes, status changes, deletions, and role changes all logged
- [x] Audit log displayed on dashboard (recent 10) and user detail page (recent 50)
- [x] Admin and target user emails resolved via batch query (avoids N+1)

#### AC-12: Admin role is assigned directly in the database (not self-assignable via UI)
- [x] `role` column defaults to 'user', no UI to change own role
- [x] Migration includes commented-out SQL for manual admin assignment
- [x] Role change endpoint blocks self-role-change

### Edge Cases Status

#### EC-1: Admin tries to delete their own account
- [x] Blocked with error: "You cannot delete your own admin account." (HTTP 400)

#### EC-2: Admin tries to change plan of user with active Stripe subscription
- [x] Returns HTTP 409 with warning: "This user has an active Stripe subscription. Cancel it in Stripe first."
- [x] Includes `stripe_subscription_id` in response for reference

#### EC-3: Search query returns no results
- [x] Empty state: "No users found matching your filters."
- [x] Clear filters button visible when filters active

#### EC-4: Thousands of users
- [x] Database-side pagination with `.range(from, to)` and `count: "exact"`
- [x] BUG-3 **FIXED** -- plan filter now applied at DB level before `.range()`

#### EC-5: Non-admin discovers /admin route
- [x] Server-side role check returns redirect
- [x] API routes return 403 Forbidden
- [ ] BUG-1 impacts first-line defense (middleware missing admin check)

### Security Audit Results

#### Authentication
- [x] All admin pages require authenticated user via `supabase.auth.getUser()`
- [x] All API routes verify authentication before admin role check
- [x] Unauthenticated requests return 401

#### Authorization
- [x] Admin role verified from `profiles` table (not JWT claims -- defence in depth)
- [x] RLS policies enforce admin-only access at database level
- [x] BUG-1: **FIXED** - `proxy.ts` now checks `role` alongside `is_active` in a single DB query; non-admins accessing `/admin/*` are redirected to `/dashboard?error=unauthorized`.
- [x] BUG-5: **FIXED** - Introduced `is_admin()` SECURITY DEFINER function; all admin RLS policies on `profiles` and `admin_audit_log` now call `is_admin()` instead of embedding the self-referencing subquery. Migration: `20260330_fix_admin_rls_recursion.sql`.

#### Input Validation
- [x] Zod schemas validate all write endpoints (plan, is_active, role)
- [x] UUID validation on all path parameters via `userIdSchema`
- [x] Query params validated with `adminUserListQuerySchema` (max search length 200)
- [x] BUG-6: **FIXED** Search input escapes `\`, `%`, `_` before the ILIKE pattern.

#### Rate Limiting
- [x] `isAdminRateLimited()` with 60 requests / 15 minutes per IP+endpoint
- [x] Applied to all admin API endpoints (GET, PATCH, DELETE)
- [x] Rate limit is per-endpoint (different counters for stats vs users)
- [x] BUG-7: **FIXED** Rate limiting now uses Upstash Redis (persistent, multi-instance) when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set; falls back to in-memory for local dev.

#### Data Exposure
- [x] Server Components used for admin pages (data not in browser network tab via SSR)
- [x] Service role key only used server-side in `admin.ts` (never exposed to browser)
- [x] `SUPABASE_SERVICE_ROLE_KEY` documented in `.env.local.example` without `NEXT_PUBLIC_` prefix
- [x] BUG-8: **FIXED** - `stripe_subscription_id` removed from 409 response body.

#### Audit Log Integrity
- [x] No UPDATE/DELETE RLS policies on `admin_audit_log` (immutable)
- [x] Audit log created BEFORE user deletion (preserves data)
- [x] BUG-9: **FIXED** - Audit log INSERT moved to after confirmed `deleteUser()`. `target_user_id` set to `null` (user no longer exists); deleted user's ID and email preserved in `metadata.deleted_user_id`.

#### CSRF Protection
- [x] Next.js App Router uses SameSite cookies by default
- [x] API routes only accept JSON body (no form submissions)

#### Privilege Escalation
- [x] Self-role-change blocked ("You cannot change your own role")
- [x] Self-deletion blocked ("You cannot delete your own admin account")
- [x] Role column has CHECK constraint (`role IN ('user', 'admin')`)

### Cross-Browser Testing Notes
- Build compiles successfully; responsive breakpoints used in table columns (sm/md/lg)
- Mobile: Plan and Status columns hidden below `sm` and `md` breakpoints, shown inline per-row
- Tablet: Plan visible, Status visible, Joined/Last Login hidden
- Desktop: All columns visible
- Filter bar stacks vertically on mobile via `flex-col` / `sm:flex-row`
- User detail page uses `sm:flex-row` for avatar layout, `lg:grid-cols-2` for plan/status cards

### Bugs Found

#### BUG-1: ~~Middleware does not enforce admin role on /admin routes~~ **FIXED**
- **Severity:** Medium — **Status: Fixed 2026-03-30**
- **Fix:** `proxy.ts` now selects `is_active, role` in a single DB query for all authenticated page requests. Non-admins accessing `/admin/*` are redirected to `/dashboard?error=unauthorized` at the middleware layer before any page renders.

#### BUG-2: ~~last_sign_in_at is always null for all users~~ **FIXED**
- **Severity:** Medium — **Status: Fixed 2026-03-30**
- **Fix:** Both list and detail API routes now use `createAdminClient().auth.admin.getUserById()` to fetch the real `last_sign_in_at` from `auth.users`. List route fetches all page users in parallel via `Promise.all`.

#### BUG-3: ~~Plan filter applied client-side after pagination causes incorrect results~~ **FIXED**
- **Severity:** High — **Status: Fixed 2026-03-30**
- **Fix:** Pre-fetch plan-filtered user IDs from `subscriptions` before pagination; apply `.in()` / `.not()` filter at DB level. `total` now uses the correct `count` from the DB query.
- **Steps to Reproduce:**
  1. Go to /admin/users with many users
  2. Filter by plan "Pro"
  3. API returns page 1 (50 users from profiles), then filters by plan in JS
  4. Expected: Database-side filtering returns only Pro users, paginated correctly
  5. Actual: Returns up to 50 profiles, then filters to only Pro among them. Total count is wrong (`plan ? users.length : count`). If Pro users are sparse, some pages may return 0-3 results instead of 50.
- **Impact:** Pagination breaks when filtering by plan. Users with specific plans may be invisible. The spec explicitly requires "database-side filtering (not client-side)."
- **Priority:** Fix before deployment

#### BUG-4: ~~Deactivated users can still log in~~ **FIXED**
- **Severity:** High — **Status: Fixed 2026-03-30**
- **Fix:** (1) `src/app/api/auth/login/route.ts` now checks `is_active` after successful `signInWithPassword` and immediately signs the user out + returns 403 if deactivated. (2) `src/proxy.ts` (middleware) now checks `is_active` on every page request for authenticated users and redirects to `/login?error=deactivated` if deactivated.
- **Steps to Reproduce:**
  1. Admin deactivates a user (sets `is_active = false`)
  2. Deactivated user visits /login and signs in
  3. Expected: Login blocked with error message
  4. Actual: User can sign in normally because no middleware or auth check verifies `is_active`
- **Impact:** The deactivation feature is effectively non-functional. The AC says "disables login without deleting data" but login is never actually blocked.
- **Priority:** Fix before deployment

#### BUG-5: ~~Self-referencing RLS policy on profiles table may cause recursion~~ **FIXED**
- **Severity:** Medium — **Status: Fixed 2026-03-30**
- **Fix:** Migration `20260330_fix_admin_rls_recursion.sql` introduces `is_admin()` — a `SECURITY DEFINER` SQL function that bypasses RLS to check the caller's role. All admin policies on `profiles` and `admin_audit_log` now call `is_admin()`, eliminating the self-referencing subquery anti-pattern.

#### BUG-6: ~~LIKE wildcard characters not escaped in search input~~ **FIXED**
- **Severity:** Low — **Status: Fixed 2026-03-30**
- **Fix:** `src/app/api/admin/users/route.ts` now escapes `\` → `\\`, `%` → `\%`, `_` → `\_` before building the ILIKE pattern. PostgreSQL's default backslash escape character handles these as literals.

#### BUG-7: ~~In-memory rate limiting does not persist across restarts or scale~~ **FIXED**
- **Severity:** Low — **Status: Fixed 2026-03-30**
- **Fix:** `src/lib/rate-limit.ts` refactored — all four rate-limit functions are now `async` and use `@upstash/ratelimit` with sliding-window algorithm when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` env vars are set. Falls back to the original in-memory Map for local dev. All call sites updated with `await`. New env vars documented in `.env.local.example`.

#### BUG-8: ~~Stripe subscription ID leaked in API response~~ **FIXED**
- **Severity:** Medium — **Status: Fixed 2026-03-30**
- **Fix:** `stripe_subscription_id` field removed from the 409 response body in the PATCH handler.

#### BUG-9: ~~Phantom audit log entry on failed user deletion~~ **FIXED**
- **Severity:** Medium — **Status: Fixed 2026-03-30**
- **Fix:** Audit log INSERT moved to after confirmed `deleteUser()`. `target_user_id` set to `null` (user no longer exists in `auth.users`, FK would fail); deleted user's UUID and email preserved in `metadata.deleted_user_id` and `metadata.deleted_email`.

#### BUG-10: ~~Plan change audit log does not record the old plan value~~ **FIXED**
- **Severity:** Low — **Status: Fixed 2026-03-30**
- **Fix:** PATCH handler now captures `oldPlan = activeSub?.plan ?? "free"` before updating; audit log metadata includes `{ old_plan, new_plan }`.
- **Severity:** Low
- **Steps to Reproduce:**
  1. Admin changes a user's plan from Free to Pro
  2. Check audit log metadata: `{ new_plan: "pro" }` only
  3. Expected: Both old and new plan recorded (`{ old_plan: "free", new_plan: "pro" }`)
  4. Actual: Only `new_plan` is recorded
- **Impact:** Cannot reconstruct plan change history from audit logs. The audit log UI tries to display `old_plan -> new_plan` but `old_plan` will be undefined.
- **Priority:** Fix before deployment

### Regression Testing

#### PROJ-1 (Authentication)
- [x] Build compiles -- no import/type regressions
- [x] Auth flow unchanged -- middleware (`proxy.ts`) only received non-breaking additions
- [x] Login/register routes unaffected

#### PROJ-2 (User Profile & Dashboard)
- [x] Profile page route unchanged
- [x] Dashboard route unchanged
- [x] AppSidebar updated -- admin section conditionally shown, regular nav items unchanged

#### PROJ-3 (Task Management)
- [x] Task routes unaffected
- [x] Task API routes unaffected
- [x] No shared component regressions

#### PROJ-4 (Subscription & Payment)
- [x] Pricing page unchanged
- [x] Billing routes unchanged
- [x] Subscriptions table read by admin APIs but not modified destructively

### Summary
- **Acceptance Criteria:** 10/12 passed (AC-4, AC-5, AC-9 have functional bugs)
- **Edge Cases:** 4/5 passed (EC-4 impacted by BUG-3)
- **Bugs Found:** 10 total (0 critical, 2 high, 4 medium, 4 low)
  - High: BUG-3 (client-side plan filter breaks pagination), BUG-4 (deactivated users can still log in)
  - Medium: BUG-1 (no middleware admin check), BUG-2 (last_sign_in_at always null), BUG-5 (RLS recursion risk), BUG-8 (Stripe ID leak), BUG-9 (phantom audit entry)
  - Low: BUG-6 (LIKE wildcards), BUG-7 (in-memory rate limit), BUG-10 (missing old_plan in audit)
- **Security:** 3 issues found (BUG-1 middleware gap, BUG-6 LIKE wildcards, BUG-8 Stripe ID leak)
- **Build:** PASS (zero TypeScript errors, zero compile errors)
- **Production Ready:** NO -- 2 high-severity bugs and 3 medium bugs should be fixed first

## Deployment
_To be added by /deploy_
