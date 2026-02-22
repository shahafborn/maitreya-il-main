import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
}

/** Check if the current user is enrolled in a course. */
export function useCourseEnrollment(courseId: string | undefined) {
  const { user } = useAuth();

  const query = useQuery<Enrollment | null>({
    queryKey: ["enrollment", courseId, user?.id],
    queryFn: async () => {
      if (!courseId || !user) return null;
      const { data, error } = await supabase
        .from("course_enrollments")
        .select("*")
        .eq("course_id", courseId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as Enrollment | null;
    },
    enabled: !!courseId && !!user,
  });

  return {
    ...query,
    isEnrolled: !!query.data,
  };
}

/** Enroll the current user in a course via the secure RPC. */
export function useEnrollInCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      accessCode,
    }: {
      courseId: string;
      accessCode?: string;
    }) => {
      const { data, error } = await supabase.rpc("enroll_in_course", {
        _course_id: courseId,
        _access_code: accessCode ?? null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      // Invalidate enrollment queries so gates re-check
      queryClient.invalidateQueries({ queryKey: ["enrollment"] });
    },
  });
}
