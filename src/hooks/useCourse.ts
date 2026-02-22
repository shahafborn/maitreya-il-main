import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  hero_image_url: string | null;
  course_start_date: string | null;
  is_published: boolean;
  access_code: string | null;
  default_dir: "ltr" | "rtl";
  created_at: string;
  updated_at: string;
}

/** Fetch a single published course by its URL slug. */
export function useCourse(slug: string | undefined) {
  return useQuery<Course | null>({
    queryKey: ["course", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data as Course;
    },
    enabled: !!slug,
  });
}

/** Fetch all courses (admin — RLS returns all for admins). */
export function useAllCourses() {
  return useQuery<Course[]>({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Course[];
    },
  });
}
