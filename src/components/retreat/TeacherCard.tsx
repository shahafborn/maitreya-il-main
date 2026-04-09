import { RETREAT_THEME, RETREAT_FONTS } from "./theme";
import type { Teacher } from "./types";

/**
 * Teacher block: photo + name + gold divider + bio.
 *
 * `reversed` flips the flex direction so consecutive cards can alternate sides.
 * `size="md"` renders a slightly smaller photo (used for secondary teachers).
 */
export const TeacherCard = ({ name, photo, bio, reversed, size = "lg" }: Teacher) => {
  const dims =
    size === "lg"
      ? "w-64 h-72 md:w-80 md:h-96"
      : "w-52 h-60 md:w-64 md:h-80";
  const nameClass =
    size === "lg" ? "text-2xl md:text-3xl" : "text-xl md:text-2xl";
  const rowDir = reversed ? "md:flex-row" : "md:flex-row-reverse";
  return (
    <div className={`flex flex-col ${rowDir} items-center gap-8 md:gap-12 mb-20 last:mb-0`}>
      <div className="flex-shrink-0">
        <img src={photo} alt={name} className={`${dims} rounded-lg object-cover shadow-xl`} />
      </div>
      <div className="text-center md:text-start flex-1">
        <h3 className={`${nameClass} font-bold mb-2`} style={{ fontFamily: RETREAT_FONTS.serif }}>
          {name}
        </h3>
        <div
          className="w-12 h-[2px] mb-5 mx-auto md:mx-0 md:ms-0"
          style={{ backgroundColor: RETREAT_THEME.GOLD }}
        />
        <p className="text-lg leading-[1.9]" style={{ color: RETREAT_THEME.WARM_GRAY }}>
          {bio}
        </p>
      </div>
    </div>
  );
};
