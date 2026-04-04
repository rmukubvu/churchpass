import { cn } from "@sanctuary/ui";
import { type ClassValue } from "clsx";

export { cn };

export function formatDate(date: Date, timezone = "UTC"): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  }).format(date);
}

export function formatShortDate(date: Date, timezone = "UTC"): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: timezone,
  }).format(date);
}

// Re-export cn with correct signature for convenience
export type { ClassValue };
