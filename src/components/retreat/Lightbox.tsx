import { useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface LightboxProps {
  images: string[];
  /** Currently displayed image index, or null when closed. */
  index: number | null;
  onClose: () => void;
  onChange: (next: number) => void;
  alt: string;
}

/**
 * Fullscreen image viewer with swipe and prev/next buttons.
 * Rendered unconditionally by the parent; returns null when `index` is null.
 */
export const Lightbox = ({ images, index, onClose, onChange, alt }: LightboxProps) => {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  if (index === null) return null;

  const prev = () => onChange((index - 1 + images.length) % images.length);
  const next = () => onChange((index + 1) % images.length);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null || touchStartY.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        const dy = e.changedTouches[0].clientY - touchStartY.current;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
          e.stopPropagation();
          if (dx < 0) next();
          else prev();
        }
        touchStartX.current = null;
        touchStartY.current = null;
      }}
    >
      <button className="absolute top-4 left-4 text-white/80 hover:text-white p-2" onClick={onClose}>
        <X className="h-8 w-8" />
      </button>
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2"
        onClick={(e) => {
          e.stopPropagation();
          prev();
        }}
      >
        <ChevronRight className="h-10 w-10" />
      </button>
      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2"
        onClick={(e) => {
          e.stopPropagation();
          next();
        }}
      >
        <ChevronLeft className="h-10 w-10" />
      </button>
      <img
        src={images[index]}
        alt={alt}
        className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};
