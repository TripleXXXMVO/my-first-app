"use client";

import React from "react";
import Image from "next/image";

function HrWorksLogo() {
  return (
    <Image
      src="/hrworks-logo.png"
      alt="HR WORKS"
      width={180}
      height={32}
      priority
    />
  );
}

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F6F0FF] px-4 py-8 sm:px-6">
      {/* Logo */}
      <div className="mb-8">
        <HrWorksLogo />
      </div>

      {/* Card */}
      <div className="w-full max-w-[420px] rounded-xl border border-[#DAC0FF]/40 bg-white p-6 shadow-lg sm:p-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-bold text-[#222222]">
            {title}
          </h1>
          {description && (
            <p className="mt-2 font-body text-sm text-[#6b6b6b]">
              {description}
            </p>
          )}
        </div>

        {/* Form content */}
        {children}
      </div>
    </main>
  );
}
