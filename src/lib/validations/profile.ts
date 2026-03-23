import { z } from "zod";

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must be 50 characters or less")
    .refine((v) => !/[<>&"']/.test(v), "Display name cannot contain special characters (< > & \" ')."),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const changeEmailSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .email({ error: "Please enter a valid email address" }),
});

export type ChangeEmailFormValues = z.infer<typeof changeEmailSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmNewPassword: z
      .string()
      .min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
