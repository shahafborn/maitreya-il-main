import { supabase } from "@/lib/supabase";

/** localStorage key holding where a person was headed before signing in. */
export const OAUTH_REDIRECT_KEY = "oauth_redirect";

/** Where people go when we have no idea where they were headed. */
export const DEFAULT_DESTINATION = "/";

/** How long we wait for the enrollment lookup before giving up on it. */
export const ENROLLMENT_LOOKUP_TIMEOUT_MS = 3000;

/**
 * True only for a destination inside this site, e.g. "/courses/uma-zub-tri".
 *
 * Rejects anything that could send a person somewhere else - "//evil.example.com"
 * (protocol-relative), "https://evil.example.com" and "javascript:..." - because
 * the value can arrive from the query string, where anyone can put anything.
 */
export function isSafeInternalPath(value: string | null | undefined): value is string {
  if (!value) return false;
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  if (value.includes("\\")) return false;
  if (value.includes(":")) return false;
  return true;
}

/**
 * The address Google returns people to, carrying the destination with it.
 *
 * The destination also goes into localStorage (see signInWithGoogle), but that
 * is lost when the sign-in starts in one browser and finishes in another - the
 * normal case when a link is opened inside WhatsApp or Gmail on a phone. In the
 * address it travels with the person.
 */
export function buildCallbackUrl(next?: string): string {
  const base = window.location.origin + import.meta.env.BASE_URL + "auth/callback";
  return isSafeInternalPath(next) ? `${base}?next=${encodeURIComponent(next)}` : base;
}

/**
 * The course page of the most recently joined course, or null when the person
 * is in no course, the lookup fails, or it takes too long. Never throws: a
 * person signing in should always end up somewhere sensible.
 */
export async function mostRecentCoursePath(userId: string): Promise<string | null> {
  const lookup = supabase
    .from("course_enrollments")
    .select("enrolled_at, courses(slug)")
    .eq("user_id", userId)
    .order("enrolled_at", { ascending: false })
    .limit(1);

  const timeout = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), ENROLLMENT_LOOKUP_TIMEOUT_MS),
  );

  try {
    const result = await Promise.race([lookup, timeout]);
    if (!result || result.error) return null;
    const row = result.data?.[0] as { courses?: { slug?: string } | { slug?: string }[] } | undefined;
    // PostgREST returns the joined row as an object, or an array on some versions.
    const course = Array.isArray(row?.courses) ? row?.courses[0] : row?.courses;
    return course?.slug ? `/courses/${course.slug}` : null;
  } catch {
    return null;
  }
}
