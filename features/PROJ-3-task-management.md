# PROJ-3: Task Management (CRUD)

## Status: In Review
**Created:** 2026-03-20
**Last Updated:** 2026-03-24

## Dependencies
- Requires: PROJ-1 (User Authentication) — tasks are owned by logged-in users
- Requires: PROJ-2 (User Profile & Dashboard) — tasks are surfaced on the dashboard

## User Stories
- As a user, I want to create a task with a title and description so that I can track my work.
- As a user, I want to set a due date and priority on a task so that I can manage my time.
- As a user, I want to assign a status to a task (To Do / In Progress / Done) so that I can track progress.
- As a user, I want to see a list of all my tasks so that I have an overview of my work.
- As a user, I want to filter and sort my task list so that I can focus on what matters most.
- As a user, I want to edit a task so that I can update details as work evolves.
- As a user, I want to delete a task so that I can remove completed or irrelevant items.
- As a user, I want to mark a task as done quickly so that I can track completion without opening the full editor.

## Acceptance Criteria
- [ ] User can create a task with: title (required), description (optional), due date (optional), priority (Low / Medium / High), status (To Do / In Progress / Done)
- [ ] Task title is required and must be between 1–200 characters
- [ ] New tasks default to status "To Do" and priority "Medium"
- [ ] Task list page (/tasks) shows all tasks for the logged-in user
- [ ] Task list can be filtered by: status, priority
- [ ] Task list can be sorted by: due date (asc/desc), priority, created date
- [ ] User can open a task detail view to see all fields
- [ ] User can edit any field of a task they own
- [ ] User can delete a task with a confirmation prompt
- [ ] User can toggle a task as Done directly from the list view (checkbox or button)
- [ ] Tasks are paginated or virtualized (max 50 per page)
- [ ] Empty state shown when no tasks exist, with a CTA to create the first task

## Edge Cases
- What if the user submits a task with only whitespace as the title? → Trim and validate; show an error if empty after trim.
- What if the due date is set in the past? → Allow it (useful for logging past work) but show a visual warning indicator.
- What if the user deletes their account? → All their tasks are deleted (cascade delete, per PROJ-2).
- What if a filter returns no results? → Show an empty state with a "clear filters" button.
- What if the user has hundreds of tasks? → Paginate with 50 tasks per page; show total count.

## Technical Requirements
- **Database:** Supabase PostgreSQL — `tasks` table with RLS (users can only access their own tasks)
- **RLS Policy:** `auth.uid() = user_id` on all CRUD operations
- **Routes:**
  - `/tasks` — Task list (protected)
  - `/tasks/new` — Create task form (protected)
  - `/tasks/[id]` — Task detail / edit (protected)
- **Performance:** Task list loads in < 500ms for up to 200 tasks

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Komponentenstruktur

```
/tasks  (Task-Liste)
├── TaskListHeader (Titel + "Neue Aufgabe"-Button)
├── TaskFilterBar
│   ├── StatusFilter (Alle / To Do / In Progress / Done)
│   ├── PriorityFilter (Alle / Niedrig / Mittel / Hoch)
│   └── SortControl (Fälligkeitsdatum / Priorität / Erstellt)
├── TaskTable
│   └── TaskRow (wiederkehrend)
│       ├── Checkbox (schnell als "Done" markieren)
│       ├── Titel + Beschreibung (gekürzt)
│       ├── PriorityBadge (farbcodiert)
│       ├── StatusBadge
│       ├── DueDateLabel (mit Warnung wenn überfällig)
│       └── Aktionen (Bearbeiten / Löschen)
├── Pagination (max. 50 pro Seite)
└── EmptyState (keine Aufgaben / keine Filterergebnisse)

/tasks/new  (Aufgabe erstellen)
└── TaskForm
    ├── Titel (Pflichtfeld, max. 200 Zeichen)
    ├── Beschreibung (optional, Textarea)
    ├── Fälligkeitsdatum (optional, Datepicker)
    ├── Priorität (Low / Medium / High)
    ├── Status (To Do / In Progress / Done)
    └── Speichern / Abbrechen

/tasks/[id]  (Aufgabe bearbeiten)
└── TaskForm (vorausgefüllt, gleiche Komponente wie "neu")
    └── Löschen-Button → Bestätigungsdialog
```

### Datenmodell

Jede Aufgabe enthält:
- Eindeutige ID
- Benutzer-ID (verknüpft mit dem eingeloggten User)
- Titel (1–200 Zeichen, Pflichtfeld)
- Beschreibung (optional)
- Fälligkeitsdatum (optional)
- Priorität: `low` / `medium` / `high` (Standard: medium)
- Status: `todo` / `in_progress` / `done` (Standard: todo)
- Erstellt am / Geändert am (automatisch)

Gespeichert in: Supabase PostgreSQL (`tasks`-Tabelle)
Zugriffskontrolle: RLS-Policy `auth.uid() = user_id` auf allen CRUD-Operationen

### API-Routen

| Route | Zweck |
|-------|-------|
| `GET /api/tasks` | Liste laden (mit Filter, Sortierung, Pagination) |
| `POST /api/tasks` | Neue Aufgabe erstellen |
| `GET /api/tasks/[id]` | Einzelne Aufgabe laden |
| `PATCH /api/tasks/[id]` | Aufgabe bearbeiten (inkl. Quick-Toggle) |
| `DELETE /api/tasks/[id]` | Aufgabe löschen |

### Tech-Entscheidungen

- **Supabase** für Datenbank — bereits in PROJ-1/2 im Einsatz
- **RLS-Policies** auf DB-Ebene — Sicherheit direkt in der Datenbank
- **Gleiche `TaskForm`-Komponente** für Erstellen + Bearbeiten — weniger Code
- **Server-seitige Filterung** — Performance bei vielen Aufgaben
- **shadcn/ui** Table, Badge, Dialog, Select, Checkbox — bereits installiert
- **AppSidebar** bekommt neuen "Aufgaben"-Eintrag mit Link zu `/tasks`

### Neue Abhängigkeiten

- `date-fns` — Datumsformatierung und Überfällig-Logik

## QA Test Results

**Tested:** 2026-03-24 | **Fixed:** 2026-03-25

### Bugs Fixed (10/10)

| Bug | Severity | Fix |
|-----|----------|-----|
| BUG-1 | LOW | Removed "In Review" status — only To Do / In Progress / Done remain. Migration converts existing data. |
| BUG-2 | MEDIUM | Added `priority_order` generated column (high=3, medium=2, low=1) + migration. API uses it for sort. |
| BUG-3 | LOW | Added read-only `TaskDetailPage` at `/tasks/[id]`. Edit moved to `/tasks/[id]/edit`. |
| BUG-4 | LOW | DELETE uses `.select("id")` to detect missing rows and returns 404 accordingly. |
| BUG-5 | HIGH | Replaced `fetchAllTasks()` with new `GET /api/tasks/stats` endpoint (server-side COUNT). |
| BUG-6 | MEDIUM | `GET /api/tasks` validates `status` and `priority` params against allowed enums before querying. |
| BUG-7 | MEDIUM | Added `.max(5000)` to description field in `createTaskSchema` and `updateTaskSchema`. |
| BUG-8 | HIGH | Added `GET /api/tasks/[id]` handler. `TaskEditPage` and `TaskDetailPage` fetch task via API. |
| BUG-9 | LOW | Sidebar uses `startsWith(item.href)` so `/tasks/new` and `/tasks/[id]` highlight the Tasks nav item. |
| BUG-10 | HIGH | Dashboard stats use `GET /api/tasks/stats` — accurate for any number of tasks. |

### Production Ready: YES (pending migration deployment)

## Deployment
_To be added by /deploy_
