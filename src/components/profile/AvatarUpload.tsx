"use client";

import React, { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AvatarUploadProps {
  currentUrl?: string;
  displayName: string;
  email: string;
  onFileSelect: (file: File) => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png"];

export function AvatarUpload({
  currentUrl,
  displayName,
  email,
  onFileSelect,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initials = displayName
    ? displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : email?.[0]?.toUpperCase() ?? "U";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Only JPG and PNG images are accepted.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Image must be smaller than 2MB.");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onFileSelect(file);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="group relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B580FF] focus-visible:ring-offset-2"
        aria-label="Upload profile photo"
      >
        <Avatar className="size-20 border-2 border-[#DAC0FF]/40">
          <AvatarImage src={previewUrl ?? currentUrl} alt={displayName} />
          <AvatarFallback className="bg-[#DAC0FF] text-lg font-semibold text-[#292673]">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="size-6 text-white" aria-hidden="true" />
        </div>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Choose avatar image"
      />
      <p className="font-body text-xs text-[#767676]">
        Click to upload (JPG or PNG, max 2MB)
      </p>
      {error && (
        <p className="font-body text-xs font-medium text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
