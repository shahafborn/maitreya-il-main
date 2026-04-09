import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Encapsulates the infinite auto-scrolling + touch + pause logic used by
 * GalleryCarousel. Keeps a middle-anchored index into an extended array
 * (images repeated `REPEATS` times) so the user never reaches an edge; silently
 * resets back to the middle when drifting too far.
 *
 * Gotcha: when resetting, we toggle `transition: none` for one frame on the
 * ref the caller passes in, so the jump is invisible. If you forget to pass
 * the ref the reset still works but produces a visible slide.
 */
export function useRetreatCarousel(imageCount: number) {
  const REPEATS = 7;
  const MID_START = Math.floor(REPEATS / 2) * imageCount;
  const [carouselIndex, setCarouselIndex] = useState(MID_START);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const extendedLength = REPEATS * imageCount;
  const realIndex = ((carouselIndex % imageCount) + imageCount) % imageCount;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const resetIfNeeded = useCallback(
    (idx: number) => {
      const lowerBound = imageCount;
      const upperBound = (REPEATS - 1) * imageCount;
      if (idx < lowerBound || idx >= upperBound) {
        const real = ((idx % imageCount) + imageCount) % imageCount;
        const resetIdx = MID_START + real;
        requestAnimationFrame(() => {
          if (carouselRef.current) carouselRef.current.style.transition = "none";
          setCarouselIndex(resetIdx);
          requestAnimationFrame(() => {
            if (carouselRef.current) carouselRef.current.style.transition = "";
          });
        });
      }
    },
    [imageCount, MID_START],
  );

  const nextSlide = useCallback(() => {
    setCarouselIndex((prev) => {
      const next = prev + 1;
      resetIfNeeded(next);
      return next;
    });
  }, [resetIfNeeded]);

  const prevSlide = useCallback(() => {
    setCarouselIndex((prev) => {
      const next = prev - 1;
      resetIfNeeded(next);
      return next;
    });
  }, [resetIfNeeded]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) nextSlide();
      else prevSlide();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  /** Auto-advance every 5s unless paused. Callers can pass additional pause flags. */
  const useAutoAdvance = (additionalPause: boolean) => {
    useEffect(() => {
      if (isPaused || additionalPause) return;
      const timer = setInterval(nextSlide, 5000);
      return () => clearInterval(timer);
    }, [additionalPause]);
  };

  const goTo = (real: number) => setCarouselIndex(MID_START + real);

  return {
    carouselIndex,
    realIndex,
    extendedLength,
    REPEATS,
    MID_START,
    isMobile,
    isPaused,
    setIsPaused,
    carouselRef,
    nextSlide,
    prevSlide,
    handleTouchStart,
    handleTouchEnd,
    useAutoAdvance,
    goTo,
  };
}
