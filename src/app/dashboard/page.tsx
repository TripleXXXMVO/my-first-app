"use client";

import React from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F0FF]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#DAC0FF] border-t-[#B580FF]" />
          <p className="mt-4 font-body text-sm text-[#222222]/60">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F0FF]">
      {/* Top bar */}
      <header className="border-b border-[#DAC0FF]/30 bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              width="32"
              height="32"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle cx="20" cy="20" r="20" fill="#292673" />
              <circle cx="20" cy="20" r="10" fill="#F6F0FF" />
              <rect x="20" y="10" width="12" height="20" fill="#292673" />
            </svg>
            <span className="font-heading text-lg font-semibold text-[#292673]">
              hr works
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden font-body text-sm text-[#222222]/60 sm:inline">
              {user?.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="border-[#DAC0FF]/60 font-body text-sm text-[#5b57a2] hover:bg-[#F6F0FF]"
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="rounded-xl border border-[#DAC0FF]/30 bg-white p-8 text-center shadow-sm">
          <h1 className="font-heading text-2xl font-bold text-[#222222]">
            Welcome to your dashboard
          </h1>
          <p className="mt-2 font-body text-sm text-[#222222]/60">
            {user?.email
              ? `Signed in as ${user.email}`
              : "Your workspace is ready."}
          </p>
          <p className="mt-6 font-body text-sm text-[#767676]">
            Task management features are coming soon.
          </p>
        </div>
      </main>
    </div>
  );
}
