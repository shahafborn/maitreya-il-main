import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CourseResource } from "@/hooks/useCourseContent";
import { getSignedUrl, triggerDownload } from "@/lib/storage";
import { trackResourceDownload } from "@/lib/analytics";
import { friendlyTitle, looksLikeRawFilename } from "@/lib/utils";

interface CourseGalleryProps {
  photos: CourseResource[];
  courseId: string;
}

/** Fetch signed URLs for all photos (short TTL, refreshes via React Query). */
function usePhotoUrls(photos: CourseResource[]) {
  return useQuery({
    queryKey: ["photo-urls", photos.map((p) => p.id).join(",")],
    queryFn: async () => {
      const entries = await Promise.all(
        photos.map(async (photo) => {
          const url = await getSignedUrl(photo.storage_path, 600);
          return { id: photo.id, url };
        })
      );
      return Object.fromEntries(entries.map((e) => [e.id, e.url]));
    },
    enabled: photos.length > 0,
    staleTime: 5 * 60 * 1000, // refresh every 5 min
  });
}

const CourseGallery = ({ photos, courseId }: CourseGalleryProps) => {
  const { data: urlMap = {} } = usePhotoUrls(photos);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (photo: CourseResource) => {
    setDownloading(true);
    try {
      trackResourceDownload(photo.id, courseId);
      const filename = photo.title || photo.storage_path.split("/").pop() || "photo";
      await triggerDownload(photo.storage_path, filename);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-6 max-w-4xl">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary text-center mb-8">
          Photo Gallery
        </h2>

        <Carousel className="w-full max-w-3xl mx-auto">
          <CarouselContent>
            {photos.map((photo, index) => (
              <CarouselItem key={photo.id} className="md:basis-1/2 lg:basis-1/3">
                <div
                  className="p-1 cursor-pointer"
                  onClick={() => setLightboxIndex(index)}
                >
                  <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                    {urlMap[photo.id] ? (
                      <img
                        src={urlMap[photo.id]}
                        alt={photo.title || "Gallery image"}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full animate-pulse bg-muted" />
                    )}
                  </div>
                  {photo.title && (
                    <p className="text-xs text-muted-foreground text-center mt-1 truncate">
                      {looksLikeRawFilename(photo.title)
                        ? friendlyTitle(photo.title)
                        : photo.title}
                    </p>
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>

        {/* Lightbox */}
        <Dialog
          open={lightboxIndex !== null}
          onOpenChange={() => setLightboxIndex(null)}
        >
          <DialogContent className="max-w-4xl p-2 bg-black/95 border-none">
            {lightboxIndex !== null && (
              <div className="flex flex-col items-center gap-4">
                <img
                  src={urlMap[photos[lightboxIndex].id] ?? ""}
                  alt={photos[lightboxIndex].title || "Gallery image"}
                  className="max-h-[80vh] w-auto object-contain rounded"
                />
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/70 hover:text-white"
                    disabled={lightboxIndex <= 0}
                    onClick={() => setLightboxIndex((i) => (i ?? 1) - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/70 hover:text-white"
                    disabled={downloading}
                    onClick={() => handleDownload(photos[lightboxIndex])}
                  >
                    {downloading ? "Downloading..." : "Download"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/70 hover:text-white"
                    disabled={lightboxIndex >= photos.length - 1}
                    onClick={() => setLightboxIndex((i) => (i ?? 0) + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default CourseGallery;
