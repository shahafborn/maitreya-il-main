import type { Course } from "@/hooks/useCourse";
import {
  useCourseMeetings,
  useCourseContentBlocks,
  useCourseResources,
  useCourseRecordings,
} from "@/hooks/useCourseContent";
import { useAuth } from "@/hooks/useAuth";
import CourseHeader from "@/components/course/CourseHeader";
import CourseSchedule from "@/components/course/CourseSchedule";
import CourseContentBlock from "@/components/course/CourseContentBlock";
import CourseGallery from "@/components/course/CourseGallery";
import CourseFiles from "@/components/course/CourseFiles";
import CourseRecordings from "@/components/course/CourseRecordings";
import maitreyaLogo from "@/assets/maitreya-logo.png";

interface CoursePageProps {
  course: Course;
}

const CoursePage = ({ course }: CoursePageProps) => {
  const { signOut } = useAuth();
  const { data: meetings = [] } = useCourseMeetings(course.id);
  const { data: contentBlocks = [] } = useCourseContentBlocks(course.id);
  const { data: resources = [] } = useCourseResources(course.id);
  const { data: recordings = [] } = useCourseRecordings(course.id);

  const photos = resources.filter((r) => r.resource_type === "photo");
  const files = resources.filter((r) => r.resource_type === "pdf");

  return (
    <div dir={course.default_dir} className="min-h-screen bg-background font-body">
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
      {contentBlocks
        .filter((b) => b.section === "about")
        .map((block) => (
          <CourseContentBlock key={block.id} block={block} />
        ))}

      {/* Schedule */}
      {meetings.length > 0 && <CourseSchedule meetings={meetings} />}

      {/* Content blocks (practice section) */}
      {contentBlocks
        .filter((b) => b.section === "practice")
        .map((block) => (
          <CourseContentBlock key={block.id} block={block} />
        ))}

      {/* Photo Gallery */}
      {photos.length > 0 && <CourseGallery photos={photos} courseId={course.id} />}

      {/* PDF Downloads */}
      {files.length > 0 && <CourseFiles files={files} courseId={course.id} />}

      {/* Recordings */}
      {recordings.length > 0 && <CourseRecordings recordings={recordings} courseId={course.id} />}

      {/* Footer content blocks */}
      {contentBlocks
        .filter((b) => b.section !== "about" && b.section !== "practice")
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
