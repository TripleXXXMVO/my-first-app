"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  changeEmailSchema,
  type ChangeEmailFormValues,
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

export function ChangeEmailForm() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const form = useForm<ChangeEmailFormValues>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: {
      currentPassword: "",
      email: "",
    },
  });

  async function onSubmit(values: ChangeEmailFormValues) {
    if (values.email === user?.email) {
      form.setError("email", {
        message: "This is already your current email address.",
      });
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();

      // Re-authenticate before allowing email change
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password: values.currentPassword,
      });
      if (authError) {
        form.setError("currentPassword", { message: "Incorrect password." });
        return;
      }

      const { error } = await supabase.auth.updateUser({
        email: values.email,
      });

      if (error) {
        if (error.message.toLowerCase().includes("already")) {
          form.setError("email", {
            message: "This email is already in use by another account.",
          });
        } else {
          throw error;
        }
        return;
      }

      toast.success(
        "Confirmation email sent. Please check your new email address to confirm the change."
      );
      form.reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update email"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-[#DAC0FF]/30 shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-base font-semibold text-[#222222]">
          Change Email
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 font-body text-sm text-[#6b6b6b]">
          Current email: <span className="font-medium text-[#222222]">{user?.email}</span>
        </p>
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
                      placeholder="Enter your current password"
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-body text-sm text-[#222222]">
                    New Email Address
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="new@example.com"
                      autoComplete="email"
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
                {saving ? "Sending..." : "Update email"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
