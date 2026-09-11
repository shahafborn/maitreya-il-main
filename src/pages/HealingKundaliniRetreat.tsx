/**
 * Meditation and Kundalini for Healing - retreat (Hebrew)
 * =======================================================
 *
 * Urban, dana-based, 3-day retreat at Antakarana Center, Tel Aviv.
 * Wed-Fri 2-4 December 2026. Teacher: Lama Glenn Mullin (with Drupon Chongwol-la).
 *
 * Language: Hebrew (RTL).
 * Content source (vault): the-system/W-work/ventures/maitreya-sangha/projects/
 *   teachers-visit-nov-dec-2026/marketing/tel-aviv-landing-page-content.md
 * Assets: src/assets/healing-kundalini-2026/
 *
 * Composition mirrors HeartOfWisdomRetreat (the previous Antakarana retreat):
 *   RetreatHero > AboutSection > "על התרגול" > jenang block (text only until a
 *   Palden Lhamo image exists) > TeacherCard x2 > ScheduleBlock > VenueSection >
 *   WhatsIncluded > DanaSection + RegistrationModal > GalleryCarousel >
 *   VideoSection > FinalCTA > InfoFooter > MailingListSignup
 *
 * Registration flow is the DDE one (in-page Cardcom payment minted per person):
 *   form -> n8n HKR_Register (Cardcom LowProfile/Create, sheet append) ->
 *   payment inside the modal -> Cardcom WebHookUrl -> n8n HKR_Register_Paid
 *   (verify, mark sheet, Resend confirmation, Mailchimp tag 2026_12_HealingKundalini).
 *   Tier ids are the codes n8n charges by; the page never sends an amount
 *   (see retreat-registration-flow-skill).
 */

import { useState, useRef, useEffect } from "react";
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
import { RegistrationModal } from "@/components/retreat/RegistrationModal";
import { PaymentStatusModal } from "@/components/retreat/PaymentStatusModal";
import { SectionFrame, SectionTitle } from "@/components/retreat/SectionFrame";
import { RETREAT_THEME, RETREAT_FONTS } from "@/components/retreat/theme";
import { useRetreatSEO } from "@/components/retreat/hooks/useRetreatSEO";
import type { RegistrationConfig, SEOConfig } from "@/components/retreat/types";
import {
  hkrHero,
  hkrHeroMobile,
  lamaGlennPhoto,
  druponPhoto,
  cloudsBg,
  cosmicManChakras,
  lhamoLatso,
  prayerFlagsBg,
  venuePhoto,
  hkrGalleryImages,
} from "@/assets/healing-kundalini-2026";

/* ── Constants ── */

const N8N_WEBHOOK_URL = "https://tknstk.app.n8n.cloud/webhook/HKR_Register";
/**
 * Test payments: `?test=m7q2xd` opens the form on a hidden option that takes any
 * amount from 0.10 to 5 shekels, so the paid branch (sheet, Mailchimp, email)
 * can be proved with a real card for a few agorot and refunded from Cardcom.
 */
const TEST_KEY = "m7q2xd";
const TEST_TIER_ID = "HKR_2026_Test";
const DEFAULT_TIER_ID = "HKR_2026_Suggested";

const CONTACT_EMAIL = "maitreyasanghaisrael@gmail.com";
const CONTACT_PHONE = "054-4905031";

const seo: SEOConfig = {
  title: "תרגולי מדיטציה וקונדליני לריפוי עם לאמה גלן | 2-4 בדצמבר 2026 | מאיטרייה סנגהה ישראל",
  description:
    "ריטריט עירוני של שלושה ימי לימוד ותרגול של שיטות הריפוי של הבודהיזם הטנטרי עם לאמה גלן, כולל חניכה לפאלדן להמו. תל אביב, 2-4 בדצמבר 2026.",
  keywords:
    "ריטריט, ריפוי, קונדליני, טומו, בודהיזם, טנטרה, לאמה גלן, פאלדן להמו, תל אביב, מדיטציה, מאיטרייה סנגהה",
  url: "https://maitreya.org.il/events/healing-kundalini-retreat",
  // JPEG: WhatsApp drops og:images over 600KB.
  ogImage: "https://maitreya.org.il/og-healing-kundalini-retreat.jpg",
  locale: "he_IL",
};

const registrationConfig: RegistrationConfig = {
  title: "הרשמה לריטריט",
  subtitle: "תרגולי מדיטציה וקונדליני לריפוי | 2-4 בדצמבר 2026",
  webhookUrl: N8N_WEBHOOK_URL,
  contentName: "Healing Kundalini Retreat 2026",
  currency: "ILS",
  lang: "he",
  dir: "rtl",
  tiers: [
    {
      id: DEFAULT_TIER_ID,
      title: "דאנא מומלצת",
      note: "הסכום המומלץ להשתתפות בהוצאות הריטריט",
      priceDisplay: "650",
      priceValue: 650,
      currencySymbol: "₪",
    },
    {
      id: "HKR_2026_Open",
      title: "דאנא בסכום שתבחרו",
      note: "כל סכום, כפי יכולתכם",
      openAmount: true,
      openAmountMin: 1,
      openAmountMax: 20000,
      priceDisplay: "",
      priceValue: 0,
      currencySymbol: "₪",
    },
    {
      id: TEST_TIER_ID,
      title: "בדיקת תשלום",
      note: "סכום בדיקה, בין 0.10 ל-5 ש״ח",
      hidden: true,
      openAmount: true,
      openAmountMin: 0.1,
      openAmountMax: 5,
      priceDisplay: "",
      priceValue: 0,
      currencySymbol: "₪",
    },
  ],
  showTierSelect: true,
  tierSelectLabel: "אופן ההשתתפות בדאנא",
  termsUrl: "https://maitreya.org.il/events/online-terms",
  askPrevExp: true,
  askCity: true,
  askRideShare: true,
  storagePrefix: "hkr26",
  extraPayload: { source: "healing-kundalini-retreat" },
  embedPayment: true,
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
  submitFootnote: "התשלום מתבצע כאן בעמוד, בעמוד סליקה מאובטח. ההרשמה תסתיים רק לאחר התשלום.",
  amountNote: "כל סכום, כפי יכולתכם.",
  paymentTitle: "תשלום דאנא",
  paymentNote:
    "התשלום נגבה על ידי מאיטרייה סנגהה ישראל (ע״ר) באמצעות קארדקום. אפשר לשלם בכרטיס אשראי או בביט. הקבלה תישלח לאימייל שמילאתם.",
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

// Hours follow the May 2026 Antakarana retreat; the final timetable is sent to
// participants (see the note under the block).
const scheduleDays = [
  {
    label: "יום רביעי, 2 בדצמבר 2026",
    time: "09:30-18:00",
    description: "בוקר: 09:30-12:00 | הפסקת צהריים: 12:00-14:00 | אחה״צ: 14:00-18:00",
  },
  {
    label: "יום חמישי, 3 בדצמבר 2026",
    time: "09:30-18:00",
    description: "בוקר: 09:30-12:00 | הפסקת צהריים: 12:00-14:00 | אחה״צ: 14:00-18:00",
  },
  {
    label: "יום שישי, 4 בדצמבר 2026",
    time: "09:30-14:00",
    description: "בוקר: 09:30-12:00 | סיום: 14:00, לקראת שבת",
  },
];

const whatsIncluded = [
  "שלושה ימי לימוד ותרגול עם לאמה גלן מולין",
  "חניכה לפאלדן להמו",
  "הדרכה מעשית לתרגולי הריפוי והקונדליני (טומו)",
  "תרגום לעברית לאורך כל הריטריט",
  "אפשרות להמשך תרגול עם דרופון צ׳ונגוואל-לה בקבוצת תרגול שבועית",
];

/* ── Component ── */

const HealingKundaliniRetreat = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paymentStatus = searchParams.get("payment") as "success" | "failed" | null;
  const testMode = searchParams.get("test") === TEST_KEY;
  const [modalOpen, setModalOpen] = useState(false);
  const ctaSectionRef = useRef<HTMLDivElement>(null);

  useRetreatSEO(seo);

  // The test link opens the form straight away, on the hidden test option.
  useEffect(() => {
    if (testMode && !paymentStatus) setModalOpen(true);
  }, [testMode, paymentStatus]);

  // The payment happens inside an iframe on this same page, so Cardcom's
  // redirect back lands inside that frame. Same origin, so we climb out and
  // show the result on the whole page.
  useEffect(() => {
    if (!paymentStatus) return;
    if (window.top && window.top !== window.self) {
      window.top.location.href = window.location.href;
    }
  }, [paymentStatus]);

  const open = () => {
    window.gtag?.("event", "registration_modal_open", { page: "healing-kundalini-retreat" });
    setModalOpen(true);
  };

  const closePaymentStatus = () => setSearchParams({}, { replace: true });

  const goldBtn = {
    borderColor: RETREAT_THEME.GOLD_DARK,
    color: RETREAT_THEME.GOLD_DARK,
    backgroundColor: "transparent",
    fontFamily: RETREAT_FONTS.sans,
  } as const;
  const hoverIn = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = RETREAT_THEME.GOLD_DARK;
    e.currentTarget.style.color = "#fff";
  };
  const hoverOut = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = "transparent";
    e.currentTarget.style.color = RETREAT_THEME.GOLD_DARK;
  };

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
        image={hkrHero}
        mobileImage={hkrHeroMobile}
        imageAlt="ציור קיר טיבטי של יוגים במדיטציה"
        title="תרגולי מדיטציה וקונדליני לריפוי"
        subtitle="שלושה ימי לימוד ותרגול של שיטות הריפוי של הבודהיזם הטנטרי, בליווי חניכה לפאלדן להמו"
        accent="עם לאמה גלן"
        dateLine="2-4 בדצמבר 2026 | מרכז אנטאקראנה, תל אביב"
        objectPosition="62% 40%"
      />

      <AboutSection
        eyebrow="ריפוי הגוף והתודעה"
        softBgImage={cloudsBg}
        ctaLabel="להרשמה לריטריט"
        onCtaClick={open}
        paragraphs={[
          "המסורת הבודהיסטית מלאה בידע רב ובתרגולי מדיטציה מעמיקים לריפוי הגוף והתודעה. הבודהיזם מכיר בקשר העמוק בין הגוף לתודעה, ובקשר בין האדם לסביבתו, ובדרכים שבהן הקשרים האלה תורמים לבריאות או למחלה.",
          "במשך הדורות השתמשו מתרגלים, רופאים והילרים בשיטות הריפוי הבודהיסטיות לריפוי עצמי ולריפוי אחרים: ריפוי התודעה מרגשות שליליים ומנטיות מזיקות, וריפוי הגוף דרך עבודה יוגית מעמיקה עם הנשימה ועם המערכות הפנימיות והאנרגטיות של הגוף.",
          "בבודהיזם הטיבטי חיות עד היום מסורות רבות של התרגולים היוגיים האלה, הידועים כעבודה עם הקונדליני - צ׳אנדלי בסנסקריט, טומו בטיבטית. בתרגולים האלה לומדים לעבוד ישירות עם האנרגיות של הגוף (הפראנה, או הצ׳י) ועם התמציות שלו (הבינדו, או האוג׳ה): לאזן ולטהר את מערכת העצבים ואת המערכת ההורמונלית, לשחרר דפוסים והחזקות שאינם מיטיבים, ולהגיע למצבי תודעה עמוקים ומרפאים.",
          "בריטריט זה ילמד לאמה גלן את התרגולים היוגיים והמדיטטיביים של הריפוי הבודהיסטי, כפי שהם נלמדים יותר מאלף שנה במסורת הטיבטית ובמיוחד במסורת הדלאי לאמות. שלושת הימים יכללו לימוד, הדרכה מעשית, תרגול מודרך, וחניכה לפאלדן להמו.",
          "הריטריט מתאים למתרגלים מתחילים ומתקדמים, ויתקיים בליווי תרגום לעברית.",
        ]}
      />

      {/* "On the practice": same editorial layout as Heart of Wisdom - a large
          photo leads, centred title, prose below. */}
      <SectionFrame tone="cream" maxWidth="xl">
        {/* A portrait thangka, so it sits at text width rather than full-bleed. */}
        <figure className="max-w-sm mx-auto mb-12 md:mb-16">
          <img
            src={cosmicManChakras}
            alt="האדם הקוסמי: ציור מסורתי של הגוף העדין ושש הצ׳אקרות"
            className="w-full block rounded-lg shadow-xl"
          />
          <figcaption
            className="mt-4 text-sm text-center leading-relaxed"
            style={{ color: RETREAT_THEME.WARM_GRAY, fontFamily: RETREAT_FONTS.sans }}
          >
            הגוף העדין ושש הצ׳אקרות - ציור מסורתי של מפת האנרגיה שעליה נעשית עבודת הקונדליני
          </figcaption>
        </figure>
        <div className="max-w-3xl mx-auto">
          <SectionTitle className="text-center mb-10">על התרגול</SectionTitle>
          <div
            className="space-y-6 text-lg leading-[1.9]"
            style={{ color: RETREAT_THEME.BODY, fontFamily: RETREAT_FONTS.sans }}
          >
            <p>הרפואה הטיבטית מלמדת שהמחלה אינה מתחילה רק בגוף. היא נגרמת מפעולה הדדית של הגוף, הסביבה והתודעה. כשהמערכת שלנו פועלת תחת דפוסים לא מיטיבים נוצר חוסר איזון, וחוסר האיזון פותח את הדלת למחלה.</p>
            <p>מכאן גם הריפוי. אם תנאים ודפוסים לא מיטיבים פותחים את הדרך למחלה - שינוי מודע יכול גם לפתוח את הדרך לריפוי, ולהיות בעצמו מקור לאנרגיה מיטיבה. על העיקרון הזה בנויים תרגולי הריפוי הבודהיסטיים.</p>
            <p>התרגול עובד בשני רבדים. הראשון הוא דמיון יוצר: אור, צבע ומנטרה, שדרכם מרפאים את מערכות הגוף, המיוצגות בצורה סמלית על ידי ארבעת היסודות (אדמה, מים, אש ואוויר), ומחזירים אותן לאיזון. הרובד השני הוא העבודה הישירה עם הערוצים ומרכזי האנרגיה - זו העבודה הפנימית של הקונדליני (צ׳אנדלי או טומו), שהמסורת הטיבטית שמרה כמסורת חיה ומדויקת.</p>
          </div>
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={open}
              className="px-10 py-4 text-lg font-semibold rounded-full border-2 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.03] cursor-pointer"
              style={goldBtn}
              onMouseEnter={hoverIn}
              onMouseLeave={hoverOut}
            >
              להרשמה לריטריט
            </button>
          </div>
        </div>
      </SectionFrame>

      {/* Palden Lhamo jenang. Her oracle lake leads the block (no image of the
          deity herself exists in the Sangha's material). */}
      <SectionFrame tone="stone" size="md" maxWidth="lg">
        <div className="max-w-3xl mx-auto">
          <figure className="mb-10">
            <img
              src={lhamoLatso}
              alt="אגם להמו לה-צו בטיבט"
              className="w-full block rounded-lg shadow-xl"
            />
            <figcaption
              className="mt-4 text-sm text-center leading-relaxed"
              style={{ color: RETREAT_THEME.WARM_GRAY, fontFamily: RETREAT_FONTS.sans }}
            >
              אגם להמו לה-צו - האגם הקדוש של פאלדן להמו בטיבט, הידוע בחזיונות הנבואיים הנשקפים במימיו
            </figcaption>
          </figure>
          <h2
            className="text-xl md:text-2xl font-bold mb-2"
            style={{ fontFamily: RETREAT_FONTS.serif }}
          >
            תרגול וחניכת פאלדן להמו
          </h2>
          <p className="text-lg font-semibold mb-6" style={{ color: RETREAT_THEME.GOLD_DARK }}>
            תרגול לפיתוח ביטחון ויציבות בחיי היום יום
          </p>
          <div
            className="space-y-5 text-lg leading-[1.9]"
            style={{ color: RETREAT_THEME.BODY, fontFamily: RETREAT_FONTS.sans }}
          >
            <p>בריטריט ילמד לאמה גלן את תרגול פאלדן להמו - תרגול של שימוש באנרגיה ובחוכמה הנשית ליצירת ביטחון ויציבות בחיי היום יום.</p>
            <p>בעולם הבודהיזם הטנטרי, השימוש באנרגיה הנשית להשגת יציבות וביטחון בעולם החולין נחשב לתנאי לתרגול מדיטטיבי שנושא פרי. בעולמנו, המלא במורכבויות ובאתגרים, היכולת לפגוש את המציאות היומיומית בפתיחות ובנינוחות היא חלק חשוב שמאפשר למדיטציה להבשיל. פאלדן להמו היא אחת משומרות הדהרמה המרכזיות של שושלת הדלאי לאמות, ותרגולה עובר בשושלת מימיו של הדלאי לאמה הראשון.</p>
            <p>במהלך הריטריט יעביר לאמה גלן את חניכת פאלדן להמו.</p>
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
          bio="דרופון צ׳ונגוואל-לה הוא מדריך הריטריטים של לאמה גלן ומורה מיומן לטנטרה בודהיסטית וטומו. הוא נולד בדרום קוריאה וגדל בארה״ב, ושימש כנזיר במסורת הזן במשך 16 שנה. מאז 2007 הוא מתרגל טנטרה מהאיאנה בהדרכת מורה השורש שלו, לאמה גלן. דרופון צ׳ונגוואל-לה ילווה את המשך התרגול לאחר הריטריט, ולמעוניינים תתאפשר הצטרפות לקבוצת התרגול השבועית."
          size="md"
          reversed
        />
      </SectionFrame>

      <ScheduleBlock
        eyebrow="מבנה הריטריט"
        intro="ריטריט עירוני, ללא לינה. המשתתפים מגיעים בבוקר וחוזרים לביתם בערב. כל יום יכלול לימוד, תרגול מודרך והדרכה מעשית, עם הפסקת צהריים ארוכה והפסקות קצרות במהלך השיעורים. חניכת פאלדן להמו תתקיים במהלך הריטריט."
        days={scheduleDays}
        notes={[
          "הריטריט ילווה בתרגום לעברית ומתאים למתרגלים מתחילים ומתקדמים.",
          "* לוח הזמנים המוצג הוא משוער. לוח הזמנים הסופי יישלח למשתתפים לפני הריטריט.",
        ]}
      />

      <VenueSection
        bgImage={venuePhoto}
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
        images={hkrGalleryImages}
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
        body="שלושה ימי עומק של לימוד ותרגול שיטות הריפוי של הבודהיזם הטנטרי, עם חניכה לפאלדן להמו, בלב תל אביב"
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
        // The recommended dana is chosen in advance; the person only changes it if they want to.
        preselectedTierId={testMode ? TEST_TIER_ID : DEFAULT_TIER_ID}
        config={registrationConfig}
        copy={registrationCopy}
      />

      {paymentStatus && (
        <PaymentStatusModal
          status={paymentStatus}
          dir="rtl"
          successTitle="ההרשמה בוצעה בהצלחה!"
          successBody="תודה שנרשמתם לריטריט תרגולי מדיטציה וקונדליני לריפוי. אישור הרשמה ופרטים נוספים יישלחו אליכם במייל."
          successDetails={{
            heading: "פרטי הריטריט",
            lines: ["2-4 בדצמבר 2026", "מרכז אנטאקראנה, רחוב יצחק שדה 29, תל אביב"],
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

export default HealingKundaliniRetreat;
