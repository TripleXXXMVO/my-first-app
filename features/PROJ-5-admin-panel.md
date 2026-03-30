# PROJ-5: Admin Panel

## Status: In Progress
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
_To be added by /qa_

## Deployment
_To be added by /deploy_
