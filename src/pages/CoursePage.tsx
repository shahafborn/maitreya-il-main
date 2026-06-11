import type { Course } from "@/hooks/useCourse";
import {
  useCourseMeetings,
  useCourseContentBlocks,
  useCourseResources,
  useCourseRecordings,
} from "@/hooks/useCourseContent";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import CourseHeader from "@/components/course/CourseHeader";
import CourseSchedule from "@/components/course/CourseSchedule";
import CourseContentBlock from "@/components/course/CourseContentBlock";
import CourseGallery from "@/components/course/CourseGallery";
import CourseFiles from "@/components/course/CourseFiles";
import CourseRecordings from "@/components/course/CourseRecordings";
import CoursePromoSection from "@/components/course/CoursePromoSection";
import { useActivePromotions } from "@/hooks/usePromotions";
import maitreyaLogo from "@/assets/maitreya-logo.png";

interface CoursePageProps {
  course: Course;
}

const CoursePage = ({ course }: CoursePageProps) => {
  useDocumentTitle(`${course.title} | Maitreya Sangha Israel`);
  const { signOut } = useAuth();
  const { data: meetings = [] } = useCourseMeetings(course.id);
  const { data: contentBlocks = [] } = useCourseContentBlocks(course.id);
  const { data: resources = [] } = useCourseResources(course.id);
  const { data: recordings = [] } = useCourseRecordings(course.id);
  const { data: promotions = [] } = useActivePromotions();

  const photos = resources.filter((r) => r.resource_type === "photo");
  const files = resources.filter((r) => r.resource_type === "pdf");

  // Content blocks the admin has toggled off are hidden from the public page.
  const visibleBlocks = contentBlocks.filter((b) => b.is_visible);

  return (
    <div dir={course.default_dir} className="min-h-screen bg-background font-body overflow-x-hidden">
      {/* Header */}
      <header className="py-4 px-6 flex items-center justify-between border-b border-border bg-card">
        <a href="https://maitreya.org.il/">
          <img
            src={maitreyaLogo}
            alt="Maitreya Sangha Israel"
            className="h-10 md:h-14 object-contain"
          />
        </a>
        <button
          onClick={() => signOut()}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign Out
        </button>
      </header>

      {/* Hero */}
      <CourseHeader course={course} />

      {/* Content blocks (about section) */}
      {visibleBlocks
        .filter((b) => b.section === "about")
        .map((block) => (
          <CourseContentBlock key={block.id} block={block} />
        ))}

      {/* Schedule: either recurring meetings (weekly courses) or free-form schedule blocks (one-shot retreats) */}
      {meetings.length > 0 && <CourseSchedule meetings={meetings} />}
      {visibleBlocks
        .filter((b) => b.section === "schedule")
        .map((block) => (
          <CourseContentBlock key={block.id} block={block} />
        ))}

      {/* Promotions */}
      <CoursePromoSection promotions={promotions} />

      {/* Content blocks (practice section) */}
      {visibleBlocks
        .filter((b) => b.section === "practice")
        .map((block) => (
          <CourseContentBlock key={block.id} block={block} />
        ))}

      {/* Photo Gallery (always rendered; component shows an empty state when no photos) */}
      <CourseGallery photos={photos} courseId={course.id} />

      {/* PDF Downloads (always rendered; component shows an empty state when no files) */}
      <CourseFiles files={files} courseId={course.id} />

      {/* Recordings (always rendered; component shows an empty state when no recordings) */}
      <CourseRecordings recordings={recordings} courseId={course.id} />

      {/* Footer content blocks (anything that isn't about / schedule / practice) */}
      {visibleBlocks
        .filter(
          (b) =>
            b.section !== "about" &&
            b.section !== "practice" &&
            b.section !== "schedule"
        )
        .map((block) => (
          <CourseContentBlock key={block.id} block={block} />
        ))}

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border">
        <p>
          &copy; {new Date().getFullYear()} Maitreya Sangha Israel. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
};

export default CoursePage;
