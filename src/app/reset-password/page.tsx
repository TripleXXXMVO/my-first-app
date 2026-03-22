"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/lib/validations/auth";
import { AuthLayout } from "@/components/auth/AuthLayout";
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

export default function ResetPasswordPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setServerError(null);
    setLoading(true);

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: values.password }),
    });
    const data = await response.json();

    setLoading(false);

    if (!response.ok) {
      setServerError(data.error ?? "Something went wrong. Please try again or request a new reset link.");
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <AuthLayout
        title="Password updated"
        description="Your password has been reset successfully."
      >
        <div className="space-y-4 text-center">
          <Button
            className="w-full bg-[#B580FF] font-body text-sm font-semibold text-white hover:bg-[#5b57a2]"
            onClick={() => {
              router.push("/dashboard");
              router.refresh();
            }}
          >
            Go to dashboard
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set a new password"
      description="Enter your new password below"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-body text-sm text-[#222222]">
                  New password
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="At least 8 characters"
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
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-body text-sm text-[#222222]">
                  Confirm new password
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Re-enter your new password"
                    autoComplete="new-password"
                    className="focus-visible:ring-[#B580FF]"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-700" />
              </FormItem>
            )}
          />

          {serverError && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-700" role="alert">
                {serverError}
              </p>
              {serverError.includes("expired") && (
                <Link
                  href="/forgot-password"
                  className="block text-sm font-medium text-[#5b57a2] underline hover:text-[#292673]"
                >
                  Request a new reset link
                </Link>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#B580FF] font-body text-sm font-semibold text-white hover:bg-[#5b57a2]"
          >
            {loading ? "Updating..." : "Update password"}
          </Button>
        </form>
      </Form>

      <p className="mt-6 text-center font-body text-sm text-[#6b6b6b]">
        <Link
          href="/login"
          className="font-medium text-[#5b57a2] underline hover:text-[#292673]"
        >
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
