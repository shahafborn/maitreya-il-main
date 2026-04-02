/**
 * Parses the retreat content MD file into structured data.
 * The MD uses ## for sections, ### for sub-items, key: value for metadata,
 * and * for list items.
 */

export interface HeroContent {
  title: string;
  subtitle: string;
  date: string;
}

export interface TeacherContent {
  name: string;
  bio: string;
}

export interface PracticeContent {
  title: string;
  subtitle: string;
  description: string;
}

export interface ScheduleBlock {
  days: string;
  practice: string;
  times: string;
}

export interface ScheduleContent {
  arrival: string;
  meals: { breakfast: string; lunch: string; dinner: string };
  blocks: ScheduleBlock[];
  firstDay: string;
  dailyIncludes: string;
  optional: string;
  suitable: string;
  disclaimer: string;
}

export interface PricingOption {
  type: string;
  price: string;
  note: string;
  featured: boolean;
}

export interface CTAContent {
  title: string;
  subtitle: string;
  note: string;
}

export interface RetreatContent {
  hero: HeroContent;
  badges: string[];
  intro: string;
  about: string[];
  teachers: TeacherContent[];
  practicesSubtitle: string;
  practices: PracticeContent[];
  schedule: ScheduleContent;
  included: string[];
  pricingNote: string;
  pricing: PricingOption[];
  venue: string[];
  cta: CTAContent;
  cancellation: string[];
  scholarships: string;
  contact: string;
}

function extractSection(raw: string, name: string): string {
  const regex = new RegExp(`^## ${name}\\s*\\n([\\s\\S]*?)(?=^## |$)`, "m");
  const match = raw.match(regex);
  return match ? match[1].trim() : "";
}

function getKeyValue(text: string, key: string): string {
  const regex = new RegExp(`^${key}:\\s*(.+)$`, "m");
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

function getListItems(text: string): string[] {
  return text
    .split("\n")
    .filter((l) => l.startsWith("* "))
    .map((l) => l.slice(2).trim());
}

function getParagraphs(text: string): string[] {
  return text
    .split("\n\n")
    .map((p) => p.trim())
    .filter((p) => p && !p.startsWith("subtitle:") && !p.startsWith("###"));
}

function getSubSections(text: string): { heading: string; body: string }[] {
  const parts = text.split(/^### /m).filter(Boolean);
  return parts
    .filter((p) => p.includes("\n"))
    .map((p) => {
      const [heading, ...rest] = p.split("\n");
      return { heading: heading.trim(), body: rest.join("\n").trim() };
    });
}

export function parseRetreatContent(raw: string): RetreatContent {
  // Hero
  const heroRaw = extractSection(raw, "hero");
  const hero: HeroContent = {
    title: getKeyValue(heroRaw, "title"),
    subtitle: getKeyValue(heroRaw, "subtitle"),
    date: getKeyValue(heroRaw, "date"),
  };

  // Badges
  const badges = getListItems(extractSection(raw, "badges"));

  // Intro
  const intro = extractSection(raw, "intro");

  // About
  const aboutRaw = extractSection(raw, "about");
  const about = aboutRaw
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean);

  // Teachers
  const teachersRaw = extractSection(raw, "teachers");
  const teacherSubs = getSubSections(teachersRaw);
  const teachers: TeacherContent[] = teacherSubs.map((t) => ({
    name: t.heading,
    bio: t.body,
  }));

  // Practices
  const practicesRaw = extractSection(raw, "practices");
  const practicesSubtitle = getKeyValue(practicesRaw, "subtitle");
  const practiceSubs = getSubSections(practicesRaw);
  const practices: PracticeContent[] = practiceSubs.map((p) => {
    const [title, subtitle] = p.heading.split(" | ");
    return { title: title.trim(), subtitle: (subtitle || "").trim(), description: p.body };
  });

  // Schedule
  const scheduleRaw = extractSection(raw, "schedule");
  const scheduleSubs = getSubSections(scheduleRaw);
  const scheduleBlocks: ScheduleBlock[] = scheduleSubs.map((s) => {
    const [days, practice] = s.heading.split(" | ");
    return { days: days.trim(), practice: (practice || "").trim(), times: s.body };
  });
  const schedule: ScheduleContent = {
    arrival: getKeyValue(scheduleRaw, "arrival"),
    meals: {
      breakfast: getKeyValue(scheduleRaw, "meals_breakfast"),
      lunch: getKeyValue(scheduleRaw, "meals_lunch"),
      dinner: getKeyValue(scheduleRaw, "meals_dinner"),
    },
    blocks: scheduleBlocks,
    firstDay: getKeyValue(scheduleRaw, "first_day"),
    dailyIncludes: getKeyValue(scheduleRaw, "daily_includes"),
    optional: getKeyValue(scheduleRaw, "optional"),
    suitable: getKeyValue(scheduleRaw, "suitable"),
    disclaimer: getKeyValue(scheduleRaw, "disclaimer"),
  };

  // Included
  const included = getListItems(extractSection(raw, "included"));

  // Pricing
  const pricingRaw = extractSection(raw, "pricing");
  const pricingNote = getKeyValue(pricingRaw, "note");
  const pricingLines = pricingRaw
    .split("\n")
    .filter((l) => l.startsWith("### "));
  const pricing: PricingOption[] = pricingLines.map((l) => {
    const parts = l.replace("### ", "").split(" | ");
    return {
      type: parts[0]?.trim() || "",
      price: parts[1]?.trim() || "",
      note: parts[2]?.trim() || "",
      featured: parts.includes("featured") || (parts[3]?.trim() === "featured"),
    };
  });

  // Venue
  const venueRaw = extractSection(raw, "venue");
  const venue = venueRaw
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean);

  // CTA
  const ctaRaw = extractSection(raw, "cta");
  const cta: CTAContent = {
    title: getKeyValue(ctaRaw, "title"),
    subtitle: getKeyValue(ctaRaw, "subtitle"),
    note: getKeyValue(ctaRaw, "note"),
  };

  // Cancellation
  const cancellation = getListItems(extractSection(raw, "cancellation"));

  // Scholarships
  const scholarships = extractSection(raw, "scholarships");

  // Contact
  const contact = extractSection(raw, "contact");

  return {
    hero,
    badges,
    intro,
    about,
    teachers,
    practicesSubtitle,
    practices,
    schedule,
    included,
    pricingNote,
    pricing,
    venue,
    cta,
    cancellation,
    scholarships,
    contact,
  };
}
