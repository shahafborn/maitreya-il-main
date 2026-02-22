import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// ---- Types ----

export interface CourseMeeting {
  id: string;
  course_id: string;
  weekday: string;
  label: string;
  start_time_local: string;
  duration_minutes: number;
  timezone: string;
  zoom_join_url: string | null;
  zoom_meeting_id: string | null;
  zoom_passcode: string | null;
  note: string | null;
  sort_order: number;
}

export interface CourseContentBlock {
  id: string;
  course_id: string;
  section: string;
  title: string | null;
  body: string;
  dir: "ltr" | "rtl";
  sort_order: number;
}

export interface CourseResource {
  id: string;
  course_id: string;
  resource_type: "photo" | "pdf";
  title: string;
  description: string | null;
  storage_path: string;
  mime_type: string | null;
  file_size: number | null;
  sort_order: number;
}

export interface CourseRecording {
  id: string;
  course_id: string;
  week_number: number | null;
  session_type: "main" | "clarification" | null;
  title: string;
  embed_type: "bunny" | "youtube" | "iframe";
  embed_url: string;
  sort_order: number;
}

// ---- Hooks ----

export function useCourseMeetings(courseId: string | undefined) {
  return useQuery<CourseMeeting[]>({
    queryKey: ["course-meetings", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_meetings")
        .select("*")
        .eq("course_id", courseId!)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as CourseMeeting[];
    },
    enabled: !!courseId,
  });
}

export function useCourseContentBlocks(courseId: string | undefined) {
  return useQuery<CourseContentBlock[]>({
    queryKey: ["course-content-blocks", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_content_blocks")
        .select("*")
        .eq("course_id", courseId!)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as CourseContentBlock[];
    },
    enabled: !!courseId,
  });
}

export function useCourseResources(courseId: string | undefined) {
  return useQuery<CourseResource[]>({
    queryKey: ["course-resources", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_resources")
        .select("*")
        .eq("course_id", courseId!)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as CourseResource[];
    },
    enabled: !!courseId,
  });
}

export function useCourseRecordings(courseId: string | undefined) {
  return useQuery<CourseRecording[]>({
    queryKey: ["course-recordings", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_recordings")
        .select("*")
        .eq("course_id", courseId!)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as CourseRecording[];
    },
    enabled: !!courseId,
  });
}
