import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function truncatePath(path: string, maxLen = 40): string {
  if (path.length <= maxLen) return path;
  const parts = path.replace(/\\/g, "/").split("/");
  if (parts.length <= 2) return "..." + path.slice(-maxLen);
  return ".../" + parts.slice(-2).join("/");
}

export function getRepoNameFromPath(path: string): string {
  return path.replace(/\\/g, "/").split("/").filter(Boolean).pop() ?? path;
}

export function sanitizeRepoName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/^-+|-+$/g, "");
}

export function validateRepoName(name: string): string | null {
  if (!name) return "Repository name is required";
  if (name.length > 100) return "Name must be under 100 characters";
  if (!/^[a-zA-Z0-9._-]+$/.test(name))
    return "Only letters, numbers, hyphens, underscores, and dots allowed";
  return null;
}
