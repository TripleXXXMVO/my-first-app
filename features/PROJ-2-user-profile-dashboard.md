# PROJ-2: User Profile & Dashboard

## Status: Planned
**Created:** 2026-03-20
**Last Updated:** 2026-03-20

## Dependencies
- Requires: PROJ-1 (User Authentication) — user must be logged in

## User Stories
- As a logged-in user, I want to see a dashboard overview so that I can quickly understand my current workload.
- As a user, I want to view and edit my profile (name, avatar) so that my account reflects my identity.
- As a user, I want to update my email address so that I can keep my account information current.
- As a user, I want to change my password so that I can keep my account secure.
- As a user, I want to delete my account so that I can exercise my GDPR right to erasure.
- As a user, I want to see my account's current plan (free / paid) on my profile so that I know what features I have access to.

## Acceptance Criteria
- [ ] Authenticated users are redirected to /dashboard after login
- [ ] Dashboard shows a summary: number of open tasks, recently updated tasks, and a welcome message
- [ ] User can navigate to their profile page (/profile)
- [ ] Profile page shows: display name, email, avatar, current plan
- [ ] User can update their display name (required, min. 2 chars)
- [ ] User can upload a profile avatar (JPG/PNG, max 2MB)
- [ ] User can change their email (requires re-authentication / confirmation email to new address)
- [ ] User can change their password (requires current password confirmation)
- [ ] User can delete their account with a confirmation dialog ("Type DELETE to confirm")
- [ ] Account deletion removes all user data (GDPR compliance)
- [ ] Profile changes are saved with a success toast notification
- [ ] Unsaved changes prompt a "discard changes?" confirmation before navigation

## Edge Cases
- What if the user uploads an avatar larger than 2MB? → Show an inline error, do not upload.
- What if the new email is already used by another account? → Show a clear error message.
- What if the user changes their email but never confirms? → Old email remains active; new email pending confirmation.
- What if the user deletes their account while tasks are assigned to them? → Tasks are unassigned or deleted (define in PROJ-3).
- What if a Google OAuth user tries to change their password? → Show info: "Your account uses Google Sign-In. Manage your password in Google settings."
- What if the dashboard is accessed with no tasks yet? → Show an empty state with a CTA to create the first task.

## Technical Requirements
- **Storage:** Supabase Storage for avatar images (public bucket, user-scoped path)
- **GDPR:** Account deletion must cascade-delete all user-owned data
- **Routes:**
  - `/dashboard` — Main dashboard (protected)
  - `/profile` — User profile & settings (protected)
- **Performance:** Dashboard loads in < 1s (use SSR or SWR for task counts)

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
