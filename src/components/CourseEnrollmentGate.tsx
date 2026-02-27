import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useCourse } from "@/hooks/useCourse";
import { useCourseEnrollment } from "@/hooks/useCourseEnrollment";
import CoursePage from "@/pages/CoursePage";
import CourseRegister from "@/pages/CourseRegister";

/**
 * Gate component for course pages:
 * - Not logged in → show auth/register form (inline, no redirect)
 * - Logged in but not enrolled (and not admin) → show auth/register form
 * - Enrolled OR admin → render CoursePage
 */
const CourseEnrollmentGate = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { data: course, isLoading: courseLoading } = useCourse(slug);
  const { isEnrolled, isLoading: enrollmentLoading } = useCourseEnrollment(
    course?.id
  );

  const loading = authLoading || courseLoading || (user && (enrollmentLoading || adminLoading));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground font-body">
          Loading...
        </div>
      </div>
    );
  }

  // Course not found or not published (unless admin)
  if (!course && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (!course) {
    return <Navigate to="/" replace />;
  }

  // Not authenticated or (not enrolled and not admin) → show register/login inline
  if (!user || (!isEnrolled && !isAdmin)) {
    return <CourseRegister />;
  }

  return <CoursePage course={course} />;
};

export default CourseEnrollmentGate;
