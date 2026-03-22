"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
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

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setLoading(true);

    try {
      // Always show success — never reveal whether an email is registered
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          redirectTo: `${window.location.origin}/reset-password`,
        }),
      });
      setSentEmail(values.email);
      setEmailSent(true);
    } catch {
      setSentEmail(values.email);
      setEmailSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <AuthLayout
        title="Check your email"
        description={`We sent a password reset link to ${sentEmail}`}
      >
        <div className="space-y-4 text-center">
          <p className="font-body text-sm text-[#6b6b6b]">
            Click the link in the email to reset your password. The link expires
            in 1 hour.
          </p>
          <Button
            variant="outline"
            className="w-full border-[#DAC0FF]/60 font-body text-sm text-[#5b57a2] hover:bg-[#F6F0FF]"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: sentEmail,
                  redirectTo: `${window.location.origin}/reset-password`,
                }),
              });
              setLoading(false);
            }}
          >
            {loading ? "Sending..." : "Resend email"}
          </Button>
          <Link
            href="/login"
            className="mt-2 block font-body text-sm font-medium text-[#5b57a2] underline hover:text-[#292673]"
          >
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      description="Enter your email and we'll send you a reset link"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-body text-sm text-[#222222]">
                  Email
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="focus-visible:ring-[#B580FF]"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-[#FF4F4F]" />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#B580FF] font-body text-sm font-semibold text-white hover:bg-[#5b57a2]"
          >
            {loading ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      </Form>

      <p className="mt-6 text-center font-body text-sm text-[#6b6b6b]">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-medium text-[#5b57a2] underline hover:text-[#292673]"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
