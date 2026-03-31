import { z } from "zod";

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .refine((v) => v.trim().length > 0, "Title cannot be only whitespace"),
  description: z.string().max(5000, "Description must be 5000 characters or less").default(""),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "due_date must be a valid date in YYYY-MM-DD format")
    .refine((v) => !isNaN(Date.parse(v)), "due_date must be a valid date")
    .nullable()
    .default(null),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .refine((v) => v.trim().length > 0, "Title cannot be only whitespace")
    .optional(),
  description: z.string().max(5000, "Description must be 5000 characters or less").optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "due_date must be a valid date in YYYY-MM-DD format")
    .refine((v) => !isNaN(Date.parse(v)), "due_date must be a valid date")
    .nullable()
    .optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
