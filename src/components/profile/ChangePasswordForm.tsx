"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from "@/lib/validations/profile";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function ChangePasswordForm() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  // OAuth users (Google, etc.) don't have a password — hide the form
  if (user && user.app_metadata?.provider !== "email") {
    return (
      <Card className="border-[#DAC0FF]/30 shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-base font-semibold text-[#222222]">
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-body text-sm text-[#6b6b6b]">
            Your account uses{" "}
            <span className="font-medium capitalize text-[#222222]">
              {user.app_metadata.provider}
            </span>{" "}
            to sign in. Password changes are managed through your provider.
          </p>
        </CardContent>
      </Card>
    );
  }

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  async function onSubmit(values: ChangePasswordFormValues) {
    setSaving(true);
    try {
      const supabase = createClient();

      // Verify current password by re-authenticating
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("User not found");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: values.currentPassword,
      });

      if (signInError) {
        form.setError("currentPassword", {
          message: "Current password is incorrect.",
        });
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (error) throw error;

      toast.success("Password changed successfully");
      form.reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to change password"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-[#DAC0FF]/30 shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-base font-semibold text-[#222222]">
          Change Password
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-body text-sm text-[#222222]">
                    Current Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter current password"
                      autoComplete="current-password"
                      className="focus-visible:ring-[#B580FF]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-700" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-body text-sm text-[#222222]">
                    New Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter new password"
                      autoComplete="new-password"
                      className="focus-visible:ring-[#B580FF]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-700" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmNewPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-body text-sm text-[#222222]">
                    Confirm New Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      className="focus-visible:ring-[#B580FF]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-700" />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!form.formState.isDirty || saving}
                className="bg-[#B580FF] font-body text-sm font-semibold text-white hover:bg-[#5b57a2] disabled:opacity-50"
              >
                {saving ? "Updating..." : "Change password"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
