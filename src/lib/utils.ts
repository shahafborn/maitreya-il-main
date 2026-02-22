import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Turn a raw filename into a human-friendly title.
 * Strips extension, removes leading timestamp prefix (e.g. `1740234567890_`),
 * replaces `_`/`-` with spaces, and title-cases each word.
 */
export function friendlyTitle(filename: string): string {
  // Remove extension
  let name = filename.replace(/\.[^.]+$/, "");
  // Remove leading numeric timestamp prefix (unix ms followed by _)
  name = name.replace(/^\d{10,}_/, "");
  // Replace underscores and hyphens with spaces
  name = name.replace(/[_-]/g, " ");
  // Title case
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Returns true if the string looks like a raw filename (has extension + underscores/digits). */
export function looksLikeRawFilename(title: string): boolean {
  return /\.\w{2,5}$/.test(title) && /[_]/.test(title);
}
