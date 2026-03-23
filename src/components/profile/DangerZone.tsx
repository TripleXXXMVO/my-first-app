"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function DangerZone() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  const canDelete = confirmText === "DELETE" && password.length > 0;

  async function handleDelete() {
    if (!canDelete) return;

    setDeleting(true);
    try {
      const response = await fetch("/api/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete account");
      }

      toast.success("Your account has been deleted.");
      // Redirect to login after short delay for toast to show
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete account"
      );
      setPassword("");
      setDeleting(false);
    }
  }

  return (
    <Card className="border-red-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-heading text-base font-semibold text-red-700">
          <AlertTriangle className="size-5" aria-hidden="true" />
          Danger Zone
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 font-body text-sm text-[#6b6b6b]">
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </p>

        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setConfirmText("");
            setPassword("");
          }
        }}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="border-red-300 font-body text-sm font-medium text-red-700 hover:bg-red-50 hover:text-red-800"
            >
              Delete my account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading text-lg font-semibold text-[#222222]">
                Delete Account
              </DialogTitle>
              <DialogDescription className="font-body text-sm text-[#6b6b6b]">
                This will permanently delete your account and all your data,
                including tasks, profile information, and uploaded files. This
                action is irreversible.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label
                  htmlFor="delete-password"
                  className="font-body text-sm font-medium text-[#222222]"
                >
                  Enter your password to confirm
                </label>
                <Input
                  id="delete-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your current password"
                  className="focus-visible:ring-red-400"
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="confirm-delete"
                  className="font-body text-sm font-medium text-[#222222]"
                >
                  Type <span className="font-bold">DELETE</span> to confirm
                </label>
                <Input
                  id="confirm-delete"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="focus-visible:ring-red-400"
                  autoComplete="off"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="font-body text-sm"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={!canDelete || deleting}
                onClick={handleDelete}
                className="font-body text-sm font-semibold"
              >
                {deleting ? "Deleting..." : "Delete my account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
