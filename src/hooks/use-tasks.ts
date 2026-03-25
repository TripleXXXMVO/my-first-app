"use client";

import { useState, useEffect, useCallback } from "react";
import {
  type Task,
  type TaskFilters,
  type TaskStats,
  fetchTasks,
  fetchTaskStats,
  createTask,
  updateTask,
  deleteTask,
} from "@/lib/tasks";

const DEFAULT_FILTERS: TaskFilters = {
  status: "all",
  priority: "all",
  sort: "created_at",
  sortDirection: "asc",
  page: 1,
};

export function useTasks(userId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<TaskStats>({ open: 0, completed: 0, recent: [] });
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);

  // Fetch filtered/sorted/paginated tasks whenever filters change
  const loadTasks = useCallback(async () => {
    if (userId === "anonymous") return;
    try {
      const result = await fetchTasks(filters);
      setTasks(result.tasks);
      setTotal(result.total);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    }
  }, [filters, userId]);

  // Fetch stats (counts + recent) — server-side, no pagination cap
  const loadStats = useCallback(async () => {
    if (userId === "anonymous") return;
    try {
      const s = await fetchTaskStats();
      setStats(s);
    } catch (err) {
      console.error("Failed to load task stats:", err);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    if (userId === "anonymous") {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([loadTasks(), loadStats()]).finally(() => setLoading(false));
  }, [loadTasks, loadStats, userId]);

  const addTask = useCallback(
    async (data: Pick<Task, "title" | "description" | "due_date" | "priority" | "status">) => {
      const newTask = await createTask(data);
      await Promise.all([loadTasks(), loadStats()]);
      return newTask;
    },
    [loadTasks, loadStats]
  );

  const editTask = useCallback(
    async (id: string, data: Partial<Pick<Task, "title" | "description" | "due_date" | "priority" | "status">>) => {
      await updateTask(id, data);
      await Promise.all([loadTasks(), loadStats()]);
    },
    [loadTasks, loadStats]
  );

  const removeTask = useCallback(
    async (id: string) => {
      await deleteTask(id);
      await Promise.all([loadTasks(), loadStats()]);
    },
    [loadTasks, loadStats]
  );

  const getTask = useCallback(
    async (id: string): Promise<Task | undefined> => {
      const res = await fetch(`/api/tasks/${id}`);
      if (!res.ok) return undefined;
      const { task } = await res.json();
      return task;
    },
    []
  );

  const updateFilters = useCallback(
    (partial: Partial<TaskFilters>) => {
      setFilters((prev) => ({ ...prev, ...partial, page: partial.page ?? 1 }));
    },
    []
  );

  return {
    tasks,
    total,
    totalUnfiltered: stats.open + stats.completed,
    filters,
    loading,
    addTask,
    editTask,
    removeTask,
    getTask,
    updateFilters,
    openTasks: stats.open,
    completedTasks: stats.completed,
    recentTasks: stats.recent,
  };
}
