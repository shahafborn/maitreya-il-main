import type { CourseContentBlock as ContentBlockType } from "@/hooks/useCourseContent";

interface CourseContentBlockProps {
  block: ContentBlockType;
}

const CourseContentBlock = ({ block }: CourseContentBlockProps) => (
  <section className="py-10 md:py-14">
    <div
      className="container mx-auto px-6 max-w-3xl"
      dir={block.dir}
    >
      {block.title && (
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary mb-4">
          {block.title}
        </h2>
      )}
      <div className="prose prose-neutral max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
        {block.body}
      </div>
    </div>
  </section>
);

export default CourseContentBlock;
