# PROJ-5: Admin Panel

## Status: Planned
**Created:** 2026-03-20
**Last Updated:** 2026-03-20

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
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
