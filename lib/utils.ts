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

export function getStageBadgeStyles(stage: string): string {
  const s = stage?.toLowerCase() || "";
  if (s.includes("prelim") || s.includes("qualifier")) {
    return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
  }
  if (s.includes("one-eighth") || s.includes("1/8") || s.includes("eighth")) {
    return "bg-teal-500/10 text-teal-400 border border-teal-500/20";
  }
  if (s.includes("quarter")) {
    return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.05)]";
  }
  if (s.includes("semi")) {
    return "bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.05)]";
  }
  if (s.includes("final") || s.includes("grand")) {
    return "bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)] animate-pulse";
  }
  if (s.includes("regional") || s.includes("zone")) {
    return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
  }
  return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
}
