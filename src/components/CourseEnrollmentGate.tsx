import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCourse } from "@/hooks/useCourse";
import { useCourseEnrollment } from "@/hooks/useCourseEnrollment";
import CoursePage from "@/pages/CoursePage";

/**
 * Gate component for course pages:
 * - Not logged in → redirect to /courses/:slug/register
 * - Logged in but not enrolled → redirect to /courses/:slug/register
 * - Enrolled → render CoursePage
 */
const CourseEnrollmentGate = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();
  const { data: course, isLoading: courseLoading } = useCourse(slug);
  const { isEnrolled, isLoading: enrollmentLoading } = useCourseEnrollment(
    course?.id
  );

  const loading = authLoading || courseLoading || (user && enrollmentLoading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground font-body">
          Loading...
        </div>
      </div>
    );
  }

  // Course not found or not published
  if (!course) {
    return <Navigate to="/" replace />;
  }

  // Not authenticated or not enrolled → register page
  if (!user || !isEnrolled) {
    return <Navigate to={`/courses/${slug}/register`} replace />;
  }

  return <CoursePage course={course} />;
};

export default CourseEnrollmentGate;
