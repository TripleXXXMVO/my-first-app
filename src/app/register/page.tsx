"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { registerSchema, type RegisterFormValues } from "@/lib/validations/auth";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
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

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    setLoading(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: values.email,
        password: values.password,
        redirectTo: `${window.location.origin}/api/auth/callback`,
      }),
    });
    const data = await response.json();

    setLoading(false);

    if (!response.ok) {
      setServerError(data.error ?? "Registration failed. Please try again.");
      return;
    }

    setEmailSent(true);
  };

  const handleResend = async () => {
    setResending(true);
    setResendMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: form.getValues("email"),
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    setResending(false);
    if (error) {
      setResendMessage("Could not resend the email. Please try again.");
    } else {
      setResendMessage("Confirmation email resent! Check your inbox.");
    }
  };

  if (emailSent) {
    return (
      <AuthLayout
        title="Check your email"
        description="We sent a confirmation link to your email address. Click the link to activate your account."
      >
        <div className="space-y-4 text-center">
          <p className="font-body text-sm text-[#222222]/60">
            Didn&apos;t receive the email? Check your spam folder or resend below.
          </p>
          {resendMessage && (
            <p
              className={`text-sm font-medium ${resendMessage.startsWith("Could") ? "text-[#FF4F4F]" : "text-[#5b57a2]"}`}
              role="status"
            >
              {resendMessage}
            </p>
          )}
          <Button
            className="w-full bg-[#B580FF] font-body text-sm font-semibold text-white hover:bg-[#5b57a2]"
            disabled={resending}
            onClick={handleResend}
          >
            {resending ? "Resending..." : "Resend confirmation email"}
          </Button>
          <Button
            variant="outline"
            className="w-full border-[#DAC0FF]/60 font-body text-sm text-[#5b57a2] hover:bg-[#F6F0FF]"
            onClick={() => setEmailSent(false)}
          >
            Try a different email
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
      title="Create your account"
      description="Get started with HR WORKS for free"
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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-body text-sm text-[#222222]">
                  Password
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
                <FormMessage className="text-[#FF4F4F]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-body text-sm text-[#222222]">
                  Confirm password
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    className="focus-visible:ring-[#B580FF]"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-[#FF4F4F]" />
              </FormItem>
            )}
          />

          {serverError && (
            <p className="text-sm font-medium text-[#FF4F4F]" role="alert">
              {serverError}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#B580FF] font-body text-sm font-semibold text-white hover:bg-[#5b57a2]"
          >
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </Form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#DAC0FF]/40" />
        <span className="font-body text-xs text-[#222222]/40">OR</span>
        <div className="h-px flex-1 bg-[#DAC0FF]/40" />
      </div>

      {/* Google OAuth */}
      <GoogleOAuthButton label="Sign up with Google" />

      {/* Login link */}
      <p className="mt-6 text-center font-body text-sm text-[#222222]/60">
        Already have an account?{" "}
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
