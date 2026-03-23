"use client";

import React from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AppShell } from "@/components/layout/AppShell";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ChangeEmailForm } from "@/components/profile/ChangeEmailForm";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { DangerZone } from "@/components/profile/DangerZone";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function ProfilePage() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <AppShell title="Profile">
        <div className="mx-auto max-w-2xl space-y-6">
          <Card className="border-[#DAC0FF]/30 shadow-sm">
            <CardContent className="space-y-4 p-6">
              <Skeleton className="mx-auto size-20 rounded-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Profile">
      <div className="mx-auto max-w-2xl">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6 w-full justify-start border-b border-[#DAC0FF]/30 bg-transparent p-0">
            <TabsTrigger
              value="profile"
              className="rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-body text-sm font-medium text-[#6b6b6b] data-[state=active]:border-[#B580FF] data-[state=active]:text-[#292673] data-[state=active]:shadow-none"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-body text-sm font-medium text-[#6b6b6b] data-[state=active]:border-[#B580FF] data-[state=active]:text-[#292673] data-[state=active]:shadow-none"
            >
              Security
            </TabsTrigger>
            <TabsTrigger
              value="account"
              className="rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-body text-sm font-medium text-[#6b6b6b] data-[state=active]:border-[#B580FF] data-[state=active]:text-[#292673] data-[state=active]:shadow-none"
            >
              Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-0">
            <ProfileForm />
          </TabsContent>

          <TabsContent value="security" className="mt-0 space-y-6">
            <ChangeEmailForm />
            <ChangePasswordForm />
          </TabsContent>

          <TabsContent value="account" className="mt-0">
            <DangerZone />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
