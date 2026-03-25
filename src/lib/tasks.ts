// Task types and API utilities for PROJ-3

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type TaskSortField = "due_date" | "priority" | "created_at";
export type TaskSortDirection = "asc" | "desc";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  due_date: string | null; // ISO date string
  priority: TaskPriority;
  status: TaskStatus;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

export interface TaskFilters {
  status: TaskStatus | "all";
  priority: TaskPriority | "all";
  sort: TaskSortField;
  sortDirection: TaskSortDirection;
  page: number;
}

export const TASKS_PER_PAGE = 50;

// Priority sort order for client-side sorting (used in the hook for stats)
const PRIORITY_ORDER: Record<TaskPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Fetch tasks from the API with filters, sorting, and pagination.
 */
export async function fetchTasks(
  filters: TaskFilters
): Promise<{ tasks: Task[]; total: number }> {
  const params = new URLSearchParams();
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.priority !== "all") params.set("priority", filters.priority);
  params.set("sort", filters.sort);
  params.set("sortDirection", filters.sortDirection);
  params.set("page", String(filters.page));

  const res = await fetch(`/api/tasks?${params.toString()}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to load tasks.");
  }
  return res.json();
}

export interface TaskStats {
  open: number;
  completed: number;
  recent: Pick<Task, "id" | "title" | "status" | "updated_at">[];
}

/**
 * Fetch task stats (counts + recent tasks) from the server-side stats endpoint.
 * Accurate for any number of tasks — no client-side pagination cap.
 */
export async function fetchTaskStats(): Promise<TaskStats> {
  const res = await fetch("/api/tasks/stats");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to load task stats.");
  }
  return res.json();
}

/**
 * Create a new task via the API.
 */
export async function createTask(
  data: Pick<Task, "title" | "description" | "due_date" | "priority" | "status">
): Promise<Task> {
  const res = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: data.title.trim(),
      description: data.description,
      due_date: data.due_date,
      priority: data.priority,
      status: data.status,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to create task.");
  }
  const { task } = await res.json();
  return task;
}

/**
 * Update a task via the API.
 */
export async function updateTask(
  id: string,
  data: Partial<Pick<Task, "title" | "description" | "due_date" | "priority" | "status">>
): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to update task.");
  }
  const { task } = await res.json();
  return task;
}

/**
 * Delete a task via the API.
 */
export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to delete task.");
  }
}

/**
 * Client-side priority sort helper (used for sorting recent tasks in stats).
 */
export function comparePriority(a: TaskPriority, b: TaskPriority): number {
  return PRIORITY_ORDER[b] - PRIORITY_ORDER[a];
}
