"use client";

import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
}

export function UpgradePrompt({
  open,
  onOpenChange,
  message = "You've reached the limit of 20 tasks on the Free plan.",
}: UpgradePromptProps) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-[#F6F0FF]">
            <Sparkles className="size-6 text-[#B580FF]" aria-hidden="true" />
          </div>
          <DialogTitle className="font-heading text-lg font-bold text-[#292673]">
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription className="font-body text-sm text-[#6b6b6b]">
            {message} Upgrade to unlock unlimited tasks and premium features.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            onClick={() => {
              onOpenChange(false);
              router.push("/pricing");
            }}
            className="bg-[#B580FF] font-body text-sm font-semibold text-white hover:bg-[#5b57a2]"
          >
            View plans
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#DAC0FF] font-body text-sm text-[#5b57a2] hover:bg-[#F6F0FF]"
          >
            Maybe later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
