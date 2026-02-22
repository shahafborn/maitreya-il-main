import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { CourseResource } from "@/hooks/useCourseContent";
import { triggerDownload } from "@/lib/storage";
import { trackResourceDownload } from "@/lib/analytics";
import { friendlyTitle, looksLikeRawFilename } from "@/lib/utils";

interface CourseFilesProps {
  files: CourseResource[];
  courseId: string;
}

const CourseFiles = ({ files, courseId }: CourseFilesProps) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (file: CourseResource) => {
    setDownloadingId(file.id);
    try {
      trackResourceDownload(file.id, courseId);
      const filename =
        file.title || file.storage_path.split("/").pop() || "file.pdf";
      await triggerDownload(file.storage_path, filename);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container mx-auto px-6 max-w-3xl">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary text-center mb-8">
          Resources
        </h2>

        <div className="space-y-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between bg-card border border-border rounded-lg p-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {file.title && looksLikeRawFilename(file.title)
                    ? friendlyTitle(file.title)
                    : file.title}
                </p>
                {file.description && (
                  <p className="text-sm text-muted-foreground truncate">
                    {file.description}
                  </p>
                )}
                {file.file_size && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {(file.file_size / 1024 / 1024).toFixed(1)} MB
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={downloadingId === file.id}
                onClick={() => handleDownload(file)}
                className="ml-4 shrink-0"
              >
                {downloadingId === file.id ? "..." : "Download"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CourseFiles;
