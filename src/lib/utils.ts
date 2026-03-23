import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { createHash } from "crypto"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns a stable, opaque storage key derived from a user ID.
 * Prevents the user's UUID from being exposed in public storage URLs.
 */
export function avatarStorageKey(userId: string): string {
  return createHash("sha256").update(userId).digest("hex").slice(0, 24);
}
