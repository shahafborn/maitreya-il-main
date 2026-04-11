/**
 * Shared types for the retreat component library.
 * Keep all page-level config shapes here so a new page has a single place
 * to look for "what do I need to fill in".
 */

export type RetreatLang = "he" | "en";
export type RetreatDir = "rtl" | "ltr";

export interface Teacher {
  name: string;
  photo: string;
  bio: string;
  /** When true, the photo flips to the other side (for alternating layouts). */
  reversed?: boolean;
  /** Optional smaller photo (used for secondary teachers). */
  size?: "lg" | "md";
}

export interface ScheduleDay {
  /** e.g. "יום חמישי, 28 במאי 2026" */
  label: string;
  /** e.g. "09:30-18:00" */
  time: string;
  /** Optional per-day description. */
  description?: string;
}

export interface PricingTier {
  /** Unique key, also sent as `field_event` to n8n. */
  id: string;
  /** Display title (e.g. "חדר ליחיד"). */
  title: string;
  /** Short note below the title. */
  note?: string;
  /** Display price string (e.g. "3,350"). */
  priceDisplay: string;
  /** Numeric price for analytics (ILS). */
  priceValue: number;
  /** Currency symbol suffix (e.g. "₪"). */
  currencySymbol?: string;
  /** Whether to visually highlight this tier. */
  featured?: boolean;
  /** Optional badge label (e.g. "הנבחר ביותר"). */
  badge?: string;
  /** Optional footnote shown only on this card (e.g. "5 חדרים בלבד"). */
  footnote?: string;
  /** Per-person label (e.g. "לאדם | הכל כלול"). */
  perPersonLabel?: string;
}

export interface SEOConfig {
  title: string;
  description: string;
  keywords: string;
  url: string;
  /** Absolute or public-relative image URL for og:image. */
  ogImage: string;
  /** e.g. "he_IL" or "en_US". */
  locale: string;
}

/**
 * Configuration for the generic RegistrationModal.
 * Supports fixed-tier pricing (Ein Gedi) or a single-tier dana flow (Heart of Wisdom).
 */
export interface RegistrationConfig {
  /** Dialog title and subtitle strings. */
  title: string;
  subtitle: string;
  /** n8n webhook URL. */
  webhookUrl: string;
  /** Content name reported to Meta pixel. */
  contentName: string;
  /** Currency code (e.g. "ILS"). */
  currency: string;
  /** Language/direction. */
  lang: RetreatLang;
  dir: RetreatDir;
  /**
   * Pricing tiers. If more than one, the modal shows a select.
   * If exactly one, it's sent silently as field_event on submit.
   */
  tiers: PricingTier[];
  /** When true, the tier <select> is shown with a "choose" placeholder. */
  showTierSelect?: boolean;
  /** Label for the tier <select> (e.g. "סוג חדר"). */
  tierSelectLabel?: string;
  /** Link to T&C page. */
  termsUrl: string;
  /** Extra fields to collect. When omitted, minimal: first/last/email/phone. */
  askGender?: boolean;
  askFoodPref?: boolean;
  askPrevExp?: boolean;
  /** City text input (used by urban / commuter retreats for ride-sharing). */
  askCity?: boolean;
  /** "Can offer a ride to others" checkbox (pairs with askCity). */
  askRideShare?: boolean;
  /** When false, the phone field is hidden and not required. Defaults to true. */
  askPhone?: boolean;
  /** When true, phone accepts international format (digits only, no dashes/spaces). */
  phoneInternational?: boolean;
  /** Country text input (used for Zoom / international registrations). */
  askCountry?: boolean;
  /** sessionStorage prefix to isolate pending-purchase keys per page. */
  storagePrefix: string;
  /**
   * Optional extra field sent on every submission (e.g. { source: "how" }).
   * Merged into the webhook payload.
   */
  extraPayload?: Record<string, string>;
  /**
   * Optional static Cardcom Low-Profile payment URL. When set, the modal
   * submits the lead to n8n and then redirects the user to this URL instead
   * of expecting n8n to return a dynamic `cardcom_url`. Use for retreats
   * with a pre-configured Cardcom payment page (e.g. Heart of Wisdom dana).
   */
  staticPaymentUrl?: string;
}
