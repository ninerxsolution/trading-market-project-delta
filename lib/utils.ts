import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get display name for a user (merchantName if available, otherwise username)
 */
export function getDisplayName(user: { username: string; merchantName?: string | null } | null | undefined): string {
  if (!user) return '';
  return user.merchantName || user.username;
}

