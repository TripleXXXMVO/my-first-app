# Product Requirements Document

## Vision
A B2B SaaS platform that helps teams coordinate projects and tasks efficiently. Teams can manage their work, track progress, and collaborate — accessible from anywhere with a clean, fast web interface.

## Target Users
**Primary:** Small to mid-size teams and companies (5–50 people) who need lightweight project and task management without the complexity of enterprise tools.

**Pain points:**
- Existing tools are too complex or too expensive for small teams
- Context-switching between communication and task management
- Lack of visibility into team progress and priorities

## Core Features (Roadmap)

| Priority | Feature | Status |
|----------|---------|--------|
| P0 (MVP) | User Authentication (Email + Google OAuth + Password Reset) | Planned |
| P0 (MVP) | User Profile & Dashboard | Planned |
| P0 (MVP) | Task / Data Management (CRUD) | Planned |
| P1 | Subscription & Payment (Stripe / Freemium) | Planned |
| P1 | Admin Panel (User & Content Management) | Planned |

## Success Metrics
- User signups per week (target: 20+ in first month)
- Activation rate: % of users who create their first task within 24h
- Retention: 30-day returning user rate
- Conversion rate: Free → Paid plan upgrades

## Constraints
- **Team:** Solo developer
- **Budget:** Low infrastructure costs required (Supabase free tier, Vercel hobby)
- **Timeline:** Fast MVP — core features live within a few weeks
- **Compliance:** GDPR / EU data protection must be respected (data stored in EU, right to deletion)

## Non-Goals
- Mobile native apps (web-first only)
- Real-time collaboration / multiplayer editing (v2)
- Enterprise SSO / SAML (v2)
- Offline mode

---

Use `/requirements` to create detailed feature specifications for each item in the roadmap above.
