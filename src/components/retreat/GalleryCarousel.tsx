import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RETREAT_THEME, RETREAT_FONTS } from "./theme";
import { useRetreatCarousel } from "./hooks/useRetreatCarousel";
import { Lightbox } from "./Lightbox";

interface GalleryCarouselProps {
  title: string;
  images: string[];
  alt: string;
}

/**
 * Infinite auto-scrolling gallery carousel with touch support, prev/next
 * buttons, clickable dots, and a coupled lightbox.
 *
 * Gotcha: the transform uses a fixed 75% width on mobile / 33.33% on desktop.
 * The overflow is clipped by a rounded container with small negative margins
 * so the rounded corners don't cut image edges.
 */
export const GalleryCarousel = ({ title, images, alt }: GalleryCarouselProps) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const {
    carouselIndex,
    realIndex,
    isMobile,
    setIsPaused,
    carouselRef,
    nextSlide,
    prevSlide,
    handleTouchStart,
    handleTouchEnd,
    useAutoAdvance,
    goTo,
    REPEATS,
  } = useRetreatCarousel(images.length);

  useAutoAdvance(lightboxIndex !== null);

  const extendedImages = Array.from({ length: REPEATS }, () => images).flat();

  return (
    <section className="py-16 md:py-24" style={{ backgroundColor: RETREAT_THEME.STONE }}>
      <div className="max-w-4xl mx-auto px-6">
        <h2
          className="text-2xl md:text-3xl font-bold text-center mb-12"
          style={{ fontFamily: RETREAT_FONTS.serif }}
        >
          {title}
        </h2>
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            className="overflow-hidden rounded-lg"
            style={{ margin: isMobile ? "0 -6px" : "0 -10px" }}
            dir="ltr"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              ref={carouselRef}
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: isMobile
                  ? `translateX(calc(${carouselIndex * -75}% + 12.5%))`
                  : `translateX(${carouselIndex * (-100 / 3)}%)`,
              }}
            >
              {extendedImages.map((src, i) => (
                <div
                  key={i}
                  className="shrink-0"
                  style={{
                    width: isMobile ? "75%" : `${100 / 3}%`,
                    padding: isMobile ? "0 6px" : "0 10px",
                  }}
                >
                  <div
                    onClick={() => setLightboxIndex(i % images.length)}
                    className="cursor-pointer rounded-lg overflow-hidden"
                    role="button"
                    tabIndex={0}
                  >
                    <img
                      src={src}
                      alt={alt}
                      className="w-full aspect-[3/4] md:aspect-square object-cover transition-all duration-300 hover:scale-105"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={prevSlide}
            className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur shadow-md hover:bg-white rounded-full p-2 transition-colors"
          >
            <ChevronRight className="h-5 w-5" style={{ color: RETREAT_THEME.DARK }} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute -left-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur shadow-md hover:bg-white rounded-full p-2 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" style={{ color: RETREAT_THEME.DARK }} />
          </button>

          <div className="flex justify-center gap-1.5 mt-8">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="w-2 h-2 rounded-full transition-colors"
                style={{ backgroundColor: i === realIndex ? RETREAT_THEME.GOLD : "#D4CFC7" }}
              />
            ))}
          </div>
        </div>
      </div>

      <Lightbox images={images} index={lightboxIndex} onChange={setLightboxIndex} onClose={() => setLightboxIndex(null)} alt={alt} />
    </section>
  );
};
