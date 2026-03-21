"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
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

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    setLoading(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: values.email, password: values.password }),
    });
    const data = await response.json();

    if (!response.ok) {
      setServerError(data.error ?? "Invalid email or password. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to your HR WORKS account"
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
                <div className="flex items-center justify-between">
                  <FormLabel className="font-body text-sm text-[#222222]">
                    Password
                  </FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-[#5b57a2] underline hover:text-[#292673]"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
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
            {loading ? "Signing in..." : "Sign in"}
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
      <GoogleOAuthButton label="Sign in with Google" />

      {/* Register link */}
      <p className="mt-6 text-center font-body text-sm text-[#222222]/60">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-[#5b57a2] underline hover:text-[#292673]"
        >
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
