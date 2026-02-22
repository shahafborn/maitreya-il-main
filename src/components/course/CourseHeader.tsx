import type { Course } from "@/hooks/useCourse";

interface CourseHeaderProps {
  course: Course;
}

const CourseHeader = ({ course }: CourseHeaderProps) => (
  <section
    className="relative overflow-hidden py-16 md:py-20"
    style={{ background: "var(--spiritual-gradient)" }}
  >
    <div
      className="absolute inset-0 opacity-10"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 50%, hsl(38 70% 50% / 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, hsl(260 30% 50% / 0.2) 0%, transparent 50%)",
      }}
    />
    <div className="container mx-auto px-6 text-center relative z-10">
      <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4 leading-tight">
        {course.title}
      </h1>
      {course.description && (
        <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed">
          {course.description}
        </p>
      )}
      {course.course_start_date && (
        <p className="text-sm text-primary-foreground/60 mt-4">
          Starting{" "}
          {new Date(course.course_start_date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      )}
      <div className="w-16 h-1 bg-accent mx-auto mt-6 rounded-full" />
    </div>
  </section>
);

export default CourseHeader;
