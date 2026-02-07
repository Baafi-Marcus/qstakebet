import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeMarketName(name: string): string {
  if (!name) return "";

  // Handle snake_case and camelCase
  const normalized = name
    .replace(/([A-Z])/g, ' $1') // Split camelCase
    .replace(/_/g, ' ')         // Replace underscores with spaces
    .trim();

  // Convert to Title Case
  return normalized
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
