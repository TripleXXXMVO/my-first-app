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

### Component Structure

**`/dashboard` — Main Dashboard**
```
DashboardPage (Server-rendered for speed)
+-- AppShell
    +-- TopNav (logo, user menu)
    +-- Sidebar (navigation links)
    +-- Main Content
        +-- WelcomeBanner ("Good morning, [Name]")
        +-- StatsRow
        |   +-- OpenTasksCard (count of open tasks)
        |   +-- CompletedTasksCard (count completed)
        +-- RecentTasksList (last 5 updated tasks)
        +-- EmptyState (shown when user has no tasks yet)
            +-- CTA Button → "Create your first task"
```

**`/profile` — Profile & Settings**
```
ProfilePage
+-- AppShell
    +-- Tabs ("Profile" | "Security" | "Account")
        +-- Profile Tab
        |   +-- AvatarUpload (click to replace, shows preview)
        |   +-- ProfileForm
        |       +-- DisplayNameField
        |       +-- EmailField (read-only, links to Security tab)
        |       +-- CurrentPlanBadge (Free / Pro)
        |       +-- SaveButton
        +-- Security Tab
        |   +-- ChangeEmailForm
        |   +-- ChangePasswordForm
        +-- Account Tab
            +-- DangerZone
                +-- DeleteAccountButton → ConfirmDeleteDialog
                    +-- "Type DELETE to confirm" input
```

### Data Model

**User Profile** (`profiles` table in Supabase)
- User ID — links to the logged-in user (auth.users)
- Display Name — shown across the app (min. 2 characters)
- Avatar URL — link to the uploaded image in Supabase Storage
- Plan — "free" or "pro" (default: free)
- Created at / Updated at — timestamps

**Avatar Images** (Supabase Storage)
- Bucket: `avatars` (publicly readable)
- Path pattern: `avatars/{user-id}/avatar.jpg`
- One file per user; uploading replaces the previous one
- Accepted: JPG, PNG — Max: 2MB (enforced client-side before upload)

**Dashboard Stats** (derived from tasks table — PROJ-3)
- Count of open tasks
- Count of completed tasks
- Last 5 tasks sorted by most recently updated
- When PROJ-3 is not yet built → show empty state

### Tech Decisions

| Decision | Choice | Why |
|---|---|---|
| Dashboard rendering | SSR (Server-Side Rendering) | Data loads before page is sent to browser — meets <1s requirement |
| Profile form | React Hook Form + Zod | Already used in PROJ-1 — consistent validation, no new dependencies |
| Avatar upload | Supabase Storage | Already in stack; provides public CDN URL automatically |
| Email & password changes | Supabase Auth built-in | Handles confirmation emails and security — no custom logic needed |
| Account deletion | Supabase cascade delete | One DB rule removes all user data — simplest GDPR compliance path |
| Unsaved changes warning | Browser `beforeunload` event | Native browser prompt, zero extra code |
| Toast notifications | Sonner (already installed) | Already wired up in PROJ-1 |

### API Routes

| Route | Purpose |
|---|---|
| `PATCH /api/profile` | Save display name |
| `POST /api/profile/avatar` | Upload avatar to Supabase Storage |
| `DELETE /api/profile` | Delete account + all user data (GDPR) |

Email and password changes use Supabase Auth directly — no custom API route needed.

### Existing shadcn/ui Components (no new installs)
`Card`, `Button`, `Input`, `Label`, `Form`, `Avatar`, `Badge`, `Dialog`, `Tabs`, `Separator`, `Sonner`, `Skeleton`

### New Packages
None — all requirements met by the existing stack.

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
