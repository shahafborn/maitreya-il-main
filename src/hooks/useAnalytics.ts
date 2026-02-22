import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type DateRange = "7d" | "30d" | "90d" | "all";

function getStartDate(range: DateRange): string | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/** Total user count */
export function useTotalUsers() {
  return useQuery({
    queryKey: ["analytics-total-users"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
}

/** Total enrollments */
export function useTotalEnrollments() {
  return useQuery({
    queryKey: ["analytics-total-enrollments"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("course_enrollments")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
}

/** Total recording views in date range */
export function useTotalViews(range: DateRange) {
  const start = getStartDate(range);
  return useQuery({
    queryKey: ["analytics-total-views", range],
    queryFn: async () => {
      let q = supabase.from("daily_recording_views").select("view_count");
      if (start) q = q.gte("date", start);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).reduce((sum, r) => sum + (r.view_count ?? 0), 0);
    },
  });
}

/** Total resource downloads in date range */
export function useTotalDownloads(range: DateRange) {
  const start = getStartDate(range);
  return useQuery({
    queryKey: ["analytics-total-downloads", range],
    queryFn: async () => {
      let q = supabase.from("daily_resource_downloads").select("download_count");
      if (start) q = q.gte("date", start);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).reduce((sum, r) => sum + (r.download_count ?? 0), 0);
    },
  });
}

/** Signup trend (profiles created per day) */
export function useSignupTrend(range: DateRange) {
  const start = getStartDate(range);
  return useQuery({
    queryKey: ["analytics-signup-trend", range],
    queryFn: async () => {
      let q = supabase.from("profiles").select("created_at").order("created_at");
      if (start) q = q.gte("created_at", start);
      const { data, error } = await q;
      if (error) throw error;

      // Group by date
      const byDay = new Map<string, number>();
      for (const row of data ?? []) {
        const day = row.created_at.slice(0, 10);
        byDay.set(day, (byDay.get(day) ?? 0) + 1);
      }
      return [...byDay.entries()]
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
  });
}

/** Enrollments per course */
export function useEnrollmentsPerCourse() {
  return useQuery({
    queryKey: ["analytics-enrollments-per-course"],
    queryFn: async () => {
      const { data: enrollments, error: eErr } = await supabase
        .from("course_enrollments")
        .select("course_id");
      if (eErr) throw eErr;

      const { data: courses, error: cErr } = await supabase
        .from("courses")
        .select("id, title");
      if (cErr) throw cErr;

      const courseMap = new Map((courses ?? []).map((c) => [c.id, c.title]));
      const counts = new Map<string, number>();
      for (const e of enrollments ?? []) {
        counts.set(e.course_id, (counts.get(e.course_id) ?? 0) + 1);
      }

      return [...counts.entries()].map(([courseId, count]) => ({
        name: courseMap.get(courseId) ?? courseId.slice(0, 8),
        count,
      }));
    },
  });
}

/** Video views per recording (top 20) */
export function useViewsPerRecording(range: DateRange) {
  const start = getStartDate(range);
  return useQuery({
    queryKey: ["analytics-views-per-recording", range],
    queryFn: async () => {
      let q = supabase.from("daily_recording_views").select("recording_id, view_count");
      if (start) q = q.gte("date", start);
      const { data, error } = await q;
      if (error) throw error;

      // Aggregate by recording_id
      const counts = new Map<string, number>();
      for (const r of data ?? []) {
        counts.set(r.recording_id, (counts.get(r.recording_id) ?? 0) + r.view_count);
      }

      // Get recording titles
      const ids = [...counts.keys()];
      if (ids.length === 0) return [];
      const { data: recordings } = await supabase
        .from("course_recordings")
        .select("id, title")
        .in("id", ids);
      const titleMap = new Map((recordings ?? []).map((r) => [r.id, r.title]));

      return [...counts.entries()]
        .map(([id, count]) => ({
          name: titleMap.get(id) ?? id.slice(0, 8),
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
    },
  });
}

/** Downloads per resource (top 20) */
export function useDownloadsPerResource(range: DateRange) {
  const start = getStartDate(range);
  return useQuery({
    queryKey: ["analytics-downloads-per-resource", range],
    queryFn: async () => {
      let q = supabase.from("daily_resource_downloads").select("resource_id, download_count");
      if (start) q = q.gte("date", start);
      const { data, error } = await q;
      if (error) throw error;

      const counts = new Map<string, number>();
      for (const r of data ?? []) {
        counts.set(r.resource_id, (counts.get(r.resource_id) ?? 0) + r.download_count);
      }

      const ids = [...counts.keys()];
      if (ids.length === 0) return [];
      const { data: resources } = await supabase
        .from("course_resources")
        .select("id, title")
        .in("id", ids);
      const titleMap = new Map((resources ?? []).map((r) => [r.id, r.title]));

      return [...counts.entries()]
        .map(([id, count]) => ({
          name: titleMap.get(id) ?? id.slice(0, 8),
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
    },
  });
}
