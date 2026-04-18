/**
 * Heart of Wisdom Retreat (Hebrew)
 * ================================
 *
 * Urban, dana-based, 3-day retreat at Antakarana Center, Tel Aviv.
 * May 28-30, 2026. Teacher: Lama Glenn Mullin.
 *
 * Language: Hebrew (RTL).
 * Content source (vault): the-system/W-work/ventures/maitreya-sangha/projects/
 *   teachers-visit-may-jun-2026/heart-of-wisdom-retreat/marketing/landing-page-content.md
 * Assets: src/assets/heart-of-wisdom-retreat/ (currently placeholders - see Phase B.2)
 *
 * Composition:
 *   RetreatLayout
 *     RetreatHero
 *     AboutSection
 *     "על התרגול" (inline - SectionFrame + large ngakpa photo + prose)
 *     Empowerment (inline - SectionFrame side-by-side, Manjushri image right / text left)
 *     TeacherCard × 2 (Lama Glenn + Drupon Chongwol-la)
 *     ScheduleBlock (3 days)
 *     VenueSection (Antakarana, accessibility list)
 *     WhatsIncluded
 *     DanaSection + RegistrationModal (single tier, dana)
 *     GalleryCarousel
 *     VideoSection (Lama Glenn YouTube)
 *     FinalCTA
 *     InfoFooter (contact only - no cancellation for dana)
 *     MailingListSignup (Hebrew tag)
 *
 * Registration flow:
 *   Single "dana" tier → n8n webhook (reused Ein Gedi endpoint) with
 *   `field_event: "2026_05_HeartOfWisdom"` and `extraPayload.source: "heart-of-wisdom"` →
 *   Cardcom payment page configured to show both a fixed 650₪ option and an
 *   open-amount option on the same page (Cardcom feature, not our concern).
 *   Meta pixel events deduped via useRetreatPurchaseTracking with
 *   storagePrefix "how".
 */

import { useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { RetreatLayout } from "@/components/retreat/RetreatLayout";
import { RetreatHero } from "@/components/retreat/RetreatHero";
import { AboutSection } from "@/components/retreat/AboutSection";
import { TeacherCard } from "@/components/retreat/TeacherCard";
import { ScheduleBlock } from "@/components/retreat/ScheduleBlock";
import { VenueSection } from "@/components/retreat/VenueSection";
import { WhatsIncluded } from "@/components/retreat/WhatsIncluded";
import { DanaSection } from "@/components/retreat/DanaSection";
import { GalleryCarousel } from "@/components/retreat/GalleryCarousel";
import { VideoSection } from "@/components/retreat/VideoSection";
import { FinalCTA } from "@/components/retreat/FinalCTA";
import { InfoFooter } from "@/components/retreat/InfoFooter";
import { MailingListSignup } from "@/components/retreat/MailingListSignup";
import { OtherEvents } from "@/components/retreat/OtherEvents";
import { einGediPromoCard } from "@/assets/ein-gedi-retreat";
import { RegistrationModal } from "@/components/retreat/RegistrationModal";
import { PaymentStatusModal } from "@/components/retreat/PaymentStatusModal";
import { SectionFrame, SectionTitle } from "@/components/retreat/SectionFrame";
import { RETREAT_THEME, RETREAT_FONTS } from "@/components/retreat/theme";
import { useRetreatPurchaseTracking } from "@/components/retreat/hooks/useMetaPixelRetreat";
import { useRetreatSEO } from "@/components/retreat/hooks/useRetreatSEO";
import type { RegistrationConfig, SEOConfig } from "@/components/retreat/types";
import {
  howHero,
  lamaGlennPhoto,
  druponPhoto,
  manjushriImage,
  cloudsBg,
  ngakpaMeadow,
  prayerFlagsBg,
  venuePhoto1,
  venuePhoto2,
  howGalleryImages,
} from "@/assets/heart-of-wisdom-retreat";

// Dedicated n8n workflow for Heart of Wisdom registration.
// Appends row to Google Sheets and returns a prefilled Cardcom Low-Profile URL
// with the customer's name/email/phone baked into the query string.
const N8N_WEBHOOK_URL = "https://tknstk.app.n8n.cloud/webhook/HeartOfWisdom_Register";

const CONTACT_EMAIL = "maitreyasanghaisrael@gmail.com";
const CONTACT_PHONE = "054-4905031";

const seo: SEOConfig = {
  title: "ריטריט מהמודרה: לב החוכמה עם לאמה גלן | 28-30 במאי 2026 | מאיטרייה סנגהה ישראל",
  description:
    "ריטריט עירוני של שלושה ימי לימוד ותרגול של שיטות החוכמה הייחודיות של הבודהיזם הטנטרי עם לאמה גלן, כולל העצמה למנג׳ושרי הלבן. תל אביב, 28-30 במאי 2026.",
  keywords:
    "ריטריט, מהמודרה, בודהיזם, טנטרה, לאמה גלן, מנג׳ושרי, תל אביב, מדיטציה, חוכמה, מאיטרייה סנגהה",
  url: "https://maitreya.org.il/p/events/heart-of-wisdom-retreat",
  ogImage: "https://maitreya.org.il/p/og-heart-of-wisdom-retreat.png",
  locale: "he_IL",
};

const registrationConfig: RegistrationConfig = {
  title: "הרשמה לריטריט",
  subtitle: "ריטריט מהמודרה: לב החוכמה | 28-30 במאי 2026",
  webhookUrl: N8N_WEBHOOK_URL,
  contentName: "Heart of Wisdom Retreat",
  currency: "ILS",
  lang: "he",
  dir: "rtl",
  tiers: [
    {
      id: "2026_05_HeartOfWisdom",
      title: "השתתפות בדאנא",
      priceDisplay: "650",
      priceValue: 650,
      currencySymbol: "₪",
      note: "תרומה מומלצת - כל סכום יתקבל בברכה",
    },
  ],
  showTierSelect: false,
  termsUrl: "https://maitreya.org.il/",
  askGender: false,
  askFoodPref: false,
  askPrevExp: true,
  askCity: true,
  askRideShare: true,
  storagePrefix: "how",
  extraPayload: { source: "heart-of-wisdom" },
};

const registrationCopy = {
  tierSelectPlaceholder: "בחרו",
  firstNameLabel: "שם פרטי",
  firstNamePlaceholder: "שם פרטי",
  lastNameLabel: "שם משפחה",
  lastNamePlaceholder: "שם משפחה",
  emailLabel: "אימייל",
  phoneLabel: "טלפון",
  phonePlaceholder: "050-1234567",
  genderLabel: "מגדר",
  genderMale: "גבר",
  genderFemale: "אישה",
  foodLabel: "העדפת אוכל",
  foodRegular: "רגיל",
  foodVegetarian: "צמחוני",
  foodVegan: "טבעוני",
  foodPlaceholder: "בחרו",
  prevExpLabel: "ניסיון קודם בלימודים בודהיסטים",
  prevExpPlaceholder: "בחרו",
  prevExpExtensive: "רב",
  prevExpIntermediate: "בינוני",
  prevExpLimited: "מועט",
  prevExpNone: "ללא",
  messageLabel: "הודעה למארגנים",
  messagePlaceholder: "רוצים לשתף אותנו במשהו?",
  cityLabel: "עיר מגורים",
  cityPlaceholder: "באיזו עיר אתם גרים?",
  rideShareLabel: "אשמח להציע טרמפ למשתתפים אחרים מהאזור שלי",
  termsPrefix: "אני מאשר/ת את",
  termsLinkLabel: "תנאי הריטריט וההרשמה",
  termsSuffix: "ומסכים/ה לקבל עדכונים מאיטרייה סנגהה ישראל.",
  submitLabel: "שליחה ומעבר לתרומה",
  submittingLabel: "שולח...",
  submitFootnote: "לאחר מילוי הטופס תועברו לדף תשלום מאובטח. תוכלו לבחור סכום קבוע או סכום פתוח. ההרשמה תסתיים רק לאחר התרומה.",
  errTier: "יש לבחור אפשרות",
  errFname: "יש למלא שם פרטי",
  errLname: "יש למלא שם משפחה",
  errEmail: "יש למלא אימייל",
  errEmailInvalid: "כתובת אימייל לא תקינה",
  errPhone: "יש למלא טלפון",
  errPhoneInvalid: "מספר טלפון לא תקין (למשל 0501234567)",
  errGender: "יש לבחור מגדר",
  errFood: "יש לבחור העדפת אוכל",
  errPrevExp: "יש לבחור ניסיון קודם",
  errCity: "יש למלא עיר מגורים",
  errConfirmed: "יש לאשר את התנאים",
  errServer: "שגיאה בשרת, נסו שוב",
  errNoPaymentUrl: "לא התקבל קישור לתשלום",
  errGeneric: "שגיאה בשליחת הטופס",
};

const scheduleDays = [
  {
    label: "יום חמישי, 28 במאי 2026",
    time: "09:30-18:00",
    description: "בוקר: 09:30-12:00 | הפסקת צהריים: 12:00-14:00 | אחה״צ: 14:00-18:00",
  },
  {
    label: "יום שישי, 29 במאי 2026",
    time: "09:30-18:00",
    description: "בוקר: 09:30-12:00 | הפסקת צהריים: 12:00-14:00 | אחה״צ: 14:00-18:00",
  },
  {
    label: "יום שבת, 30 במאי 2026",
    time: "09:30-16:00",
    description: "בוקר: 09:30-12:00 | הפסקת צהריים: 12:00-14:00 | אחה״צ: 14:00-16:00",
  },
];

const whatsIncluded = [
  "שלושה ימי לימוד ותרגול עם לאמה גלן מולין",
  "העצמה למנג׳ושרי הלבן",
  "הדרכה מעשית לתרגול מהמודרה",
  "תרגום לעברית לאורך כל הריטריט",
  "אפשרות להמשך תרגול עם דרופון צ׳ונגוואל-לה בקבוצת תרגול שבועית",
];

const HeartOfWisdomRetreat = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paymentStatus = searchParams.get("payment") as "success" | "failed" | null;
  const [modalOpen, setModalOpen] = useState(false);
  const ctaSectionRef = useRef<HTMLDivElement>(null);

  useRetreatSEO(seo);

  // Purchase pixel disabled - only Ein Gedi HE fires Purchase to keep
  // campaign optimization signal clean. Re-enable when this page gets its
  // own campaign with a Custom Conversion filter.

  const open = () => {
    window.gtag?.("event", "registration_modal_open", { page: "heart-of-wisdom" });
    setModalOpen(true);
  };

  const closePaymentStatus = () => setSearchParams({}, { replace: true });

  return (
    <RetreatLayout
      lang="he"
      dir="rtl"
      seo={seo}
      navCtaLabel="להרשמה"
      onNavCtaClick={open}
      footerText={`© ${new Date().getFullYear()} מאיטרייה סנגהה ישראל. כל הזכויות שמורות.`}
    >
      <RetreatHero
        image={howHero}
        imageAlt="מהמודרה - לב החוכמה"
        title="מהמודרה - לב החוכמה"
        subtitle="שלושה ימי לימוד ותרגול של שיטות החוכמה הייחודיות של הבודהיזם הטנטרי, בליווי העצמה למנג׳ושרי הלבן"
        accent="עם לאמה גלן"
        dateLine="28-30 במאי 2026 | מרכז אנטאקראנה, תל אביב"
      />

      {/* Opening framing paragraphs from the 7th Dalai Lama / root-of-suffering intro. */}
      <AboutSection
        eyebrow="הדרך הישירה לחופש"
        softBgImage={cloudsBg}
        ctaLabel="להרשמה לריטריט"
        onCtaClick={open}
        paragraphs={[
          "הבודהיזם מלמד שהשורש לסבל בחיינו נובע מכך שאנו מזהים את עצמנו עם הדברים הלא נכונים - גופינו, מחשבותינו, רגשותינו, וכל תנאי החיים המשתנים תדיר. הזהות המוטעה הזאת, הנתפסת כ״אני האמיתי״, מונעת מאיתנו לזהות את הטבע האינסופי של התודעה שלנו, ושומרת אותנו במעגלי הסבל.",
          "הטנטרה הבודהיסטית מאפשרת לנו להשתחרר מההזדהויות המוטעות האלו באמצעות שיטות מיומנות, המאפשרות לנו לזהות ולהתחבר ישירות אל האושר, הזוהר והמרחב שבטבע התודעה שלנו. כך אנחנו יכולים להשתחרר מהסבל, ולפעול בעולם מתוך בסיס של חמלה, אושר וחוכמה.",
          <>
            בריטריט זה ילמד לאמה גלן את שיטות החוכמה הייחודיות של הבודהיזם הטנטרי, על בסיס השיר מהמאה ה-18 של הדלאי לאמה ה-7 - <strong>״כניסה לריקות מכל ארבעת הכיוונים״</strong>. שיר הארה שהוא מפת דרכים מעשית לתרגול מהמודרה - המבט הישיר בטבע התודעה.
          </>,
          "הריטריט יכלול לימוד מעמיק של הטקסט, הדרכה מעשית לתרגול, העצמה למנג׳ושרי הלבן - בודהה החוכמה - ותרגול מודרך לאורך שלושת הימים.",
          "הריטריט מתאים למתרגלים מתחילים ומתקדמים, ויתקיים בליווי תרגום לעברית.",
        ]}
      />

      {/* "About the practice" section: introduces Mahamudra meditation for a reader
          who has never encountered the practice. Editorial layout — ngakpa photo
          leads, centered title + caption-style prose below. */}
      <SectionFrame tone="cream" maxWidth="xl">
        <img
          src={ngakpaMeadow}
          alt="נגקפה במדיטציה מול רכס הרים"
          className="w-full rounded-lg shadow-xl mb-12 md:mb-16"
        />
        <div className="max-w-3xl mx-auto">
          <SectionTitle className="text-center mb-10">על התרגול</SectionTitle>
          <div
            className="space-y-6 text-lg leading-[1.9]"
            style={{ color: RETREAT_THEME.BODY, fontFamily: RETREAT_FONTS.sans }}
          >
            <p>תרגול המהמודרה פשוט בעיקרו: הנחת התודעה במצבה הטבעי, ללא מאמץ להשיג דבר. ללא ניסיון לעצור את המחשבות וללא ריכוז באובייקט, אלא מנוחה באיכות הבהירה, הפתוחה והערה שמתחת לכל תנועה של התודעה.</p>
            <p>התרגול מלמד אותנו כיצד להתמודד עם המכשולים למדיטציה ולחיי היומיום - עייפות, מחשבות טורדניות, רגשות עזים - וכיצד לשוב שוב ושוב אל המרחב הפתוח שנמצא תמיד מתחתם - ודרכו להגיע בסופו של דבר להארה שלמה.</p>
            <p>המסורת מתארת את האיכות הטבעית הזאת של התודעה בדימויים שונים: רחבה כשמיים, יציבה כהר, בהירה כלהבה, שקופה כגביש. מחשבות ורגשות עולים ונעלמים כעננים חולפים או כגלים על פני הים, ומתגלים כחלק מאותה מודעות עצמה - בלי צורך לתפוס אותם ובלי צורך לדחות אותם.</p>
            <p>תרגול המהמודרה נחשב לתרגול הגבוה ביותר במסורת הבודהיסטית - והוא מתורגל ע״י מודטים ויוגים באסיה זה אלפי שנים כמסורת חיה ורבת עוצמה.</p>
          </div>
          <div className="mt-10 flex justify-center">
            {/* Outline gold button matching the About section's CTA style. */}
            <button
              type="button"
              onClick={open}
              className="px-10 py-4 text-lg font-semibold rounded-full border-2 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.03] cursor-pointer"
              style={{
                borderColor: RETREAT_THEME.GOLD_DARK,
                color: RETREAT_THEME.GOLD_DARK,
                backgroundColor: "transparent",
                fontFamily: RETREAT_FONTS.sans,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = RETREAT_THEME.GOLD_DARK;
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = RETREAT_THEME.GOLD_DARK;
              }}
            >
              להרשמה לריטריט
            </button>
          </div>
        </div>
      </SectionFrame>

      {/* Empowerment section: side-by-side compact layout. Image on the right
          (RTL: first DOM child), text on the left. Smaller than the shared
          EmpowermentSection component, which centers a small image above text. */}
      <SectionFrame tone="stone" size="md" maxWidth="lg">
        <div className="grid md:grid-cols-[auto_1fr] gap-8 md:gap-12 items-center">
          <div className="mx-auto md:mx-0 w-[220px] md:w-[240px] shrink-0">
            <img
              src={manjushriImage}
              alt="מנג׳ושרי הלבן - בודהה החוכמה"
              className="w-full rounded-lg shadow-md"
            />
          </div>
          <div>
            <h2
              className="text-xl md:text-2xl font-bold mb-6"
              style={{ fontFamily: RETREAT_FONTS.serif }}
            >
              העצמה למנג׳ושרי הלבן
            </h2>
            <div
              className="space-y-5 text-lg leading-[1.9]"
              style={{ color: RETREAT_THEME.BODY, fontFamily: RETREAT_FONTS.sans }}
            >
              <p>הריטריט כולל העצמה למנג׳ושרי הלבן - בודהה החוכמה הנעלה, המגלם את חוכמת כל הבודהות. תרגול מנג׳ושרי הלבן מתאים במיוחד לתרגולי החוכמה, ומסייע בפיתוח מהיר במיוחד של בהירות והבנה של טבע המציאות.</p>
              <p>ההעצמה פותחת את השער לתרגול ומעניקה חיבור ישיר לשושלת ולברכותיה.</p>
            </div>
          </div>
        </div>
      </SectionFrame>

      <SectionFrame tone="stone" maxWidth="xl">
        <div
          className="h-px w-64 md:w-80 mx-auto -mt-16 md:-mt-24 mb-16 md:mb-24"
          style={{ backgroundColor: "#C9A961" }}
          aria-hidden
        />
        <SectionTitle className="text-center mb-16">המורים</SectionTitle>
        <TeacherCard
          name="לאמה גלן מולין"
          photo={lamaGlennPhoto}
          bio="לאמה גלן הוא מורה וותיק ואהוב של טנטרה בודהיסטית וטומו. הוא תלמידם הישיר של הוד קדושתו הדלאי לאמה ה-14, ומורי השורש שלו הם לינג רינפוצ׳ה השישי וטריג׳נג רינפוצ׳ה - מורי השורש האישיים של הדלאי לאמה ה-14. לאמה גלן מלמד בודהיזם טיבטי מעל שלושים שנה לאלפי תלמידים בכל רחבי העולם. הוא חוקר, סופר, ומתרגם ידוע - שכתב מעל 30 ספרים בנושאי בודהיזם טיבטי וטנטרה בודהיסטית שפורסמו בכל רחבי העולם."
          size="lg"
        />
        <TeacherCard
          name="דרופון צ׳ונגוואל-לה"
          photo={druponPhoto}
          bio="דרופון צ׳ונגוואל-לה הוא מדריך הריטריטים של לאמה גלן ומורה מיומן לטנטרה בודהיסטית וטומו. הוא נולד בדרום קוריאה וגדל בארה״ב, ושימש כנזיר במסורת הזן במשך 16 שנה. מאז 2007 הוא מתרגל טנטרה מהאיאנה בהדרכת מורה השורש שלו, לאמה גלן. דרופון צ׳ונגוואל-לה ילווה את המשך התרגול לאחר הריטריט ויעביר שיעורי העמקה, ולמעוניינים תתאפשר הצטרפות לקבוצת תרגול שבועית להמשך הדרך."
          size="md"
          reversed
        />
      </SectionFrame>

      <ScheduleBlock
        eyebrow="מבנה הריטריט"
        intro="ריטריט עירוני, ללא לינה. המשתתפים מגיעים בבוקר וחוזרים לביתם בערב. כל יום יכלול לימוד, תרגול מודרך, והדרכה מעשית, עם הפסקת צהריים ארוכה והפסקות קצרות במהלך השיעורים. העצמת מנג׳ושרי הלבן תתקיים במהלך הריטריט."
        days={scheduleDays}
        notes={[
          "הריטריט ילווה בתרגום לעברית ומתאים למתרגלים מתחילים ומתקדמים.",
          "* לוח הזמנים המוצג הוא משוער. לוח הזמנים הסופי יישלח למשתתפים לפני הריטריט.",
        ]}
      />

      <VenueSection
        bgImage={venuePhoto2}
        eyebrow="המקום - מרכז אנטאקראנה"
        paragraphs={[
          "הריטריט יתקיים במרכז אנטאקראנה, רחוב יצחק שדה 29, תל אביב. מיקום מרכזי ונגיש בלב תל אביב, קרוב לצירי התחבורה הראשיים.",
          "המרכז הוא מרחב פשוט ושקט, מתאים ללימוד ולתרגול.",
        ]}
        accessItems={[
          <><strong>ברכב:</strong> יציאה מאיילון - מרחק דקות ספורות מצומת השלום</>,
          <><strong>ברכבת:</strong> תחנת רכבת השלום - כ-10 דקות הליכה</>,
          <><strong>באוטובוס:</strong> קווים רבים עוברים ברחוב יצחק שדה ובסביבה הקרובה</>,
          <><strong>חניה:</strong> חניונים ציבוריים בסביבה</>,
        ]}
      />

      <WhatsIncluded eyebrow="מה כולל הריטריט" items={whatsIncluded} />

      <div ref={ctaSectionRef}>
        <DanaSection
          title="השתתפות בדאנא"
          paragraphs={[
            "🪷 ההשתתפות בלימוד היא בדאנא - תרומה מתוך נדיבות הלב.",
            "במסורת הבודהיסטית, הלימודים עוברים בדאנא - נדיבות הדדית בין המורה לתלמיד. התלמיד מקבל את הלימוד, והמורה מקבל את התמיכה שמאפשרת לו להמשיך ללמד. תרומתכם מאפשרת את קיום הלימוד ואת המשך הפעילות של הסנגהה. תרומת הדאנא תתבצע בזמן ההרשמה לריטריט באתר.",
          ]}
          suggestedLine="תרומה מומלצת להשתתפות בהוצאות הריטריט: 650 ש״ח"
          footerNote="🪷 כל סכום תרומה יתקבל בברכה, כדי לאפשר לכל המעוניין להשתתף. מספר המקומות מוגבל - מומלץ להירשם בהקדם."
          ctaLabel="להרשמה לריטריט"
          onCtaClick={open}
        />
      </div>

      <GalleryCarousel
        title="מהריטריטים שלנו"
        images={howGalleryImages}
        alt="מריטריטים קודמים של מאיטרייה סנגהה"
      />

      <VideoSection
        title="הכירו את לאמה גלן מולין"
        subtitle="לאמה גלן על טנטרה בודהיסטית בחיי היומיום"
        embedUrl="https://www.youtube.com/embed/r6IniYsqRcw?start=1"
        iframeTitle="לאמה גלן מולין - טנטרה בודהיסטית"
      />

      <FinalCTA
        bgImage={prayerFlagsBg}
        title="הצטרפו לריטריט"
        body="שלושה ימי עומק של לימוד ותרגול שיטות החוכמה של הבודהיזם הטנטרי, עם העצמה למנג׳ושרי הלבן, בלב תל אביב"
        ctaLabel="להרשמה לריטריט"
        onCtaClick={open}
        footnote="מספר המקומות מוגבל"
      />

      <InfoFooter
        contact={{
          heading: "צרו קשר",
          label: "לשאלות, בירורים והרשמה:",
          email: CONTACT_EMAIL,
          phone: CONTACT_PHONE,
          phoneLabel: "טלפון:",
        }}
      />

      <OtherEvents
        heading="אירועים קרובים"
        events={[
          {
            image: einGediPromoCard,
            imageAlt: "ריטריט ריפוי בודהיסטי בים המלח",
            title: "דרך הריפוי וההילינג הבודהיסטי",
            dateLabel: "1-6 ביוני 2026",
            endDate: "2026-06-06",
            description: "שישה ימי עומק של תרגולי ריפוי והארכת חיים ממסורת הבודהיזם הטנטרי הטיבטי - בים המלח",
            ctaLabel: "לפרטים נוספים",
            href: "/events/ein-gedi-healing-retreat",
          },
        ]}
      />

      <MailingListSignup
        heading="הישארו מעודכנים"
        subheading="הירשמו לרשימת התפוצה שלנו וקבלו עדכונים על ריטריטים, סדנאות ואירועים נוספים"
        placeholder="כתובת אימייל"
        ctaLabel="הרשמה"
        successMessage="תודה! נרשמת בהצלחה"
        errorMessage="שגיאה בהרשמה, נסו שוב"
        language="he"
        tag="Hebrew"
      />

      <RegistrationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        config={registrationConfig}
        copy={registrationCopy}
      />

      {paymentStatus && (
        <PaymentStatusModal
          status={paymentStatus}
          dir="rtl"
          successTitle="ההרשמה בוצעה בהצלחה!"
          successBody="תודה שנרשמתם לריטריט מהמודרה: לב החוכמה. אישור הרשמה ופרטים נוספים יישלחו אליכם במייל."
          successDetails={{
            heading: "פרטי הריטריט",
            lines: ["28-30 במאי 2026", "מרכז אנטאקראנה, רחוב יצחק שדה 29, תל אביב"],
          }}
          failedTitle="אירעה שגיאה בתשלום"
          failedBody="התשלום לא הושלם. ניתן לנסות שוב או ליצור קשר איתנו."
          closeLabel="סגור"
          failedReturnLabel="חזרה לדף הריטריט"
          contactEmail={CONTACT_EMAIL}
          onClose={closePaymentStatus}
        />
      )}
    </RetreatLayout>
  );
};

export default HeartOfWisdomRetreat;
