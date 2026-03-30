import { z } from "zod";

/**
 * Validation schema for PATCH /api/admin/users/[id]
 * Allows changing plan and/or is_active status.
 */
export const updateUserSchema = z
  .object({
    plan: z.enum(["free", "pro"], {
      message: "Plan must be 'free' or 'pro'.",
    }),
    is_active: z.boolean({
      message: "is_active must be a boolean.",
    }),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field (plan or is_active) must be provided.",
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/**
 * Validation schema for PATCH /api/admin/users/[id]/role
 * Allows changing a user's role.
 */
export const updateUserRoleSchema = z.object({
  role: z.enum(["user", "admin"], {
    message: "Role must be 'user' or 'admin'.",
  }),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

/**
 * Validation for user ID path parameter.
 */
export const userIdSchema = z.string().uuid("Invalid user ID format.");

/**
 * Validation for admin user list query parameters.
 */
export const adminUserListQuerySchema = z.object({
  search: z.string().max(200, "Search query too long.").optional(),
  plan: z.enum(["free", "pro"]).optional(),
  page: z.coerce
    .number()
    .int()
    .min(1, "Page must be at least 1.")
    .default(1),
});

export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>;
