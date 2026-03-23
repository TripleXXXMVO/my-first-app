"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  profileSchema,
  type ProfileFormValues,
} from "@/lib/validations/profile";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

export function ProfileForm() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.user_metadata?.display_name ?? "",
    },
  });

  const isDirty = form.formState.isDirty || avatarFile !== null;

  useUnsavedChanges(isDirty);

  async function onSubmit(values: ProfileFormValues) {
    setSaving(true);
    try {
      // Save display name via API
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: values.displayName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      // Upload avatar if changed
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);

        const avatarResponse = await fetch("/api/profile/avatar", {
          method: "POST",
          body: formData,
        });

        if (!avatarResponse.ok) {
          const data = await avatarResponse.json();
          throw new Error(data.error || "Failed to upload avatar");
        }
      }

      toast.success("Profile updated successfully");
      setAvatarFile(null);
      form.reset({ displayName: values.displayName });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  }

  const plan = user?.user_metadata?.plan ?? "free";

  return (
    <Card className="border-[#DAC0FF]/30 shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-base font-semibold text-[#222222]">
          Profile Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar */}
            <div className="flex justify-center">
              <AvatarUpload
                currentUrl={user?.user_metadata?.avatar_url}
                displayName={user?.user_metadata?.display_name ?? ""}
                email={user?.email ?? ""}
                onFileSelect={setAvatarFile}
              />
            </div>

            {/* Display Name */}
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-body text-sm text-[#222222]">
                    Display Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Your name"
                      className="focus-visible:ring-[#B580FF]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-700" />
                </FormItem>
              )}
            />

            {/* Email (read-only) */}
            <div className="space-y-2">
              <label className="font-body text-sm text-[#222222]">Email</label>
              <Input
                value={user?.email ?? ""}
                disabled
                className="bg-[#F6F0FF]/50"
              />
              <p className="font-body text-xs text-[#767676]">
                To change your email, go to the Security tab.
              </p>
            </div>

            {/* Current Plan */}
            <div className="space-y-2">
              <label className="font-body text-sm text-[#222222]">
                Current Plan
              </label>
              <div>
                <Badge
                  variant="outline"
                  className={
                    plan === "pro"
                      ? "border-[#B580FF] bg-[#F6F0FF] font-body text-sm text-[#5b57a2]"
                      : "border-[#DAC0FF]/60 bg-white font-body text-sm text-[#6b6b6b]"
                  }
                >
                  {plan === "pro" ? "Pro" : "Free"}
                </Badge>
              </div>
            </div>

            {/* Save button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!isDirty || saving}
                className="bg-[#B580FF] font-body text-sm font-semibold text-white hover:bg-[#5b57a2] disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
