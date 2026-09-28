/**
 * The Heart Sutra with Lama Glenn Mullin (Hebrew / Zoom)
 * =====================================================
 *
 * Five weekly sessions, Sundays 4 Oct - 1 Nov 2026, 10:00 Korea time on
 * Maitreya Sangha Korea's Zoom, with the worldwide sangha. In Israel that is
 * 04:00 for the first three sessions and 03:00 for the last two (Israel moves
 * to winter time on 25 Oct; Korea has no daylight saving). All sessions are
 * recorded and the recordings go on the course page for registrants - that is
 * the real offer at that hour.
 *
 * Content source (vault): the-system/W-work/ventures/maitreya-sangha/projects/
 *   heart-sutra-2026/event-spec-and-copy.md (built 28.9.2026, not yet approved;
 *   the open questions there - price, translation, recordings - are Shahaf's)
 *
 * Registration and payment follow the Death, Dying and Enlightenment page: the
 * form posts to n8n `HSU_Register` (sheet row + a Cardcom page for this
 * person's amount, opened inside the dialog); Cardcom reports to
 * `HSU_Register_Paid` (verify, mark the row, Mailchimp tag 2026_10_HeartSutra,
 * Resend confirmation).
 *
 * Two ways to give: the suggested 180 or an amount the person types.
 * `?test=<TEST_KEY>` opens a hidden 0.10-5 NIS test option.
 */

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { usePaymentReturn } from "@/components/retreat/hooks/usePaymentReturn";
import { RetreatLayout } from "@/components/retreat/RetreatLayout";
import type { EventJsonLdConfig } from "@/components/retreat/hooks/useEventJsonLd";
import { RetreatHero } from "@/components/retreat/RetreatHero";
import { TeacherCard } from "@/components/retreat/TeacherCard";
import { WhatsIncluded } from "@/components/retreat/WhatsIncluded";
import { DanaSection } from "@/components/retreat/DanaSection";
import { VideoSection } from "@/components/retreat/VideoSection";
import { FinalCTA } from "@/components/retreat/FinalCTA";
import { InfoFooter } from "@/components/retreat/InfoFooter";
import { MailingListSignup } from "@/components/retreat/MailingListSignup";
import { UpcomingEvents } from "@/components/retreat/UpcomingEvents";
import { RegistrationModal } from "@/components/retreat/RegistrationModal";
import { PaymentStatusModal } from "@/components/retreat/PaymentStatusModal";
import { SectionFrame, SectionTitle } from "@/components/retreat/SectionFrame";
import { RETREAT_THEME, RETREAT_FONTS } from "@/components/retreat/theme";
import type { RegistrationConfig, SEOConfig } from "@/components/retreat/types";
import { hasEnded } from "@/site/today";
import {
  heartSutraHero,
  heartSutraHeroMobile,
  prajnaparamitaThangka,
  lamaGlennPhoto,
} from "@/assets/heart-sutra-2026";

/* ── Constants ── */

const N8N_WEBHOOK_URL = "https://tknstk.app.n8n.cloud/webhook/HSU_Register";
const PAGE_PATH = "/events/heart-sutra";
/** Test payments: `?test=h7s2qv` opens the hidden 0.10-5 NIS option (refund it from Cardcom). */
const TEST_KEY = "h7s2qv";
const TEST_TIER_ID = "HSU_2026_Test";
const SUGGESTED = 180;

const CONTACT_EMAIL = "maitreyasanghaisrael@gmail.com";
const CONTACT_PHONE = "054-4905031";

const seo: SEOConfig = {
  title: "סוטרת הלב: סדרת לימוד אונליין עם לאמה גלן מולין | החל מ-4 באוקטובר 2026 | מאיטרייה סנגהה ישראל",
  description:
    "חמישה מפגשים על סוטרת הלב, תמצית תורת הבודהה על הריקות ועל טבעה האמיתי של המציאות, עם לאמה גלן מולין. בזום, בימי ראשון החל מ-4 באוקטובר 2026. כל המפגשים מוקלטים.",
  keywords:
    "סוטרת הלב, פרג׳נאפרמיטה, שלמות החוכמה, ריקות, לאמה גלן מולין, בודהיזם טיבטי, מהאיאנה, אונליין, זום, מאיטרייה סנגהה",
  url: `https://maitreya.org.il${PAGE_PATH}`,
  // JPEG: WhatsApp drops og:images over 600KB.
  ogImage: "https://maitreya.org.il/og-heart-sutra.jpg",
  locale: "he_IL",
};

/**
 * The machine-readable twin of the page. The page states no session length,
 * so endDate is the last session's date alone. Online, so the location is the
 * page itself - never the Zoom link, which is not public.
 */
const eventJsonLd: EventJsonLdConfig = {
  name: "סוטרת הלב - סדרת לימוד אונליין עם לאמה גלן מולין",
  description: seo.description,
  url: seo.url,
  image: seo.ogImage,
  startDate: "2026-10-04T04:00:00+03:00",
  endDate: "2026-11-01",
  place: { kind: "online", url: seo.url },
  performers: ["לאמה גלן מולין"],
  // validFrom = the day registration opens. Update on deploy.
  offers: [{ name: "דאנה מומלצת", price: SUGGESTED, validFrom: "2026-09-29" }],
};

const registrationConfig: RegistrationConfig = {
  title: "הרשמה לסדרה",
  subtitle: "סוטרת הלב עם לאמה גלן מולין | 5 מפגשים | החל מ-4 באוקטובר 2026",
  webhookUrl: N8N_WEBHOOK_URL,
  contentName: "Heart Sutra Oct 2026",
  currency: "ILS",
  lang: "he",
  dir: "rtl",
  // Each tier id is the code n8n charges by (HSU_Register) - the page never
  // sends a fixed price. To change an amount, change the n8n workflow too.
  tiers: [
    {
      id: "HSU_2026_Suggested",
      title: "דאנה מומלצת",
      note: "הסכום המומלץ להשתתפות בסדרה",
      priceDisplay: String(SUGGESTED),
      priceValue: SUGGESTED,
      currencySymbol: "₪",
    },
    {
      id: "HSU_2026_Open",
      title: "דאנה בסכום שתבחרו",
      note: "כל סכום, כפי יכולתכם",
      openAmount: true,
      openAmountMin: 1,
      openAmountMax: 20000,
      priceDisplay: "",
      priceValue: 0,
      currencySymbol: "₪",
    },
    // Hidden: reached only through the ?test= link (see TEST_KEY above).
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
  tierSelectLabel: "אופן ההשתתפות בדאנה",
  termsUrl: "https://maitreya.org.il/events/online-terms",
  askPrevExp: true,
  storagePrefix: "hsu26",
  extraPayload: { source: "heart-sutra" },
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
  termsPrefix: "אני מאשר/ת את",
  termsLinkLabel: "תנאי ההשתתפות וההרשמה",
  termsSuffix: "ומסכים/ה לקבל עדכונים מאיטרייה סנגהה ישראל.",
  submitLabel: "המשך לתשלום",
  submittingLabel: "שולח...",
  submitFootnote: "התשלום מתבצע כאן בעמוד, בעמוד סליקה מאובטח. ההרשמה תסתיים רק לאחר התשלום.",
  amountLabel: "סכום הדאנה",
  amountNote: "כל סכום, כפי יכולתכם.",
  errTier: "יש לבחור אופן השתתפות",
  errVariant: "יש לבחור אפשרות",
  errAmount: "יש למלא סכום",
  errAmountRange: "יש למלא סכום במספרים שלמים, בין 1 ל-20,000",
  errFname: "יש למלא שם פרטי",
  errLname: "יש למלא שם משפחה",
  errEmail: "יש למלא אימייל",
  errEmailInvalid: "כתובת אימייל לא תקינה",
  errPhone: "יש למלא טלפון",
  errPhoneInvalid: "מספר טלפון לא תקין (למשל 0501234567)",
  errGender: "יש לבחור מגדר",
  errFood: "יש לבחור העדפת אוכל",
  errPrevExp: "יש לבחור ניסיון קודם",
  errConfirmed: "יש לאשר את התנאים",
  errServer: "שגיאה בשרת, נסו שוב",
  errNoPaymentUrl: "לא התקבל קישור לתשלום",
  errGeneric: "שגיאה בשליחת הטופס",
  paymentTitle: "תשלום דאנה",
  paymentNote:
    "התשלום נגבה על ידי מאיטרייה סנגהה ישראל (ע״ר) באמצעות קארדקום. אפשר לשלם בכרטיס אשראי או בביט. הקבלה תישלח לאימייל שמילאתם.",
};

/** Israel time: 04:00 until winter time starts on 25.10, then 03:00. */
const sessionDates = [
  { n: "מפגש 1", date: "ראשון, 4 באוקטובר", time: "04:00" },
  { n: "מפגש 2", date: "ראשון, 11 באוקטובר", time: "04:00" },
  { n: "מפגש 3", date: "ראשון, 18 באוקטובר", time: "04:00" },
  { n: "מפגש 4", date: "ראשון, 25 באוקטובר", time: "03:00" },
  { n: "מפגש 5", date: "ראשון, 1 בנובמבר", time: "03:00" },
];

const whatsIncluded = [
  "חמישה מפגשי לימוד בשידור חי עם לאמה גלן מולין, יחד עם הסנגהה העולמית",
  "הקלטות של כל המפגשים בדף הקורס, לצפייה בשעה שנוחה לכם",
];

/* ── Component ── */

const HeartSutra2026 = () => {
  const [searchParams] = useSearchParams();
  const { paymentStatus, closePaymentStatus } = usePaymentReturn();
  const testMode = searchParams.get("test") === TEST_KEY;
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const concluded = hasEnded(eventJsonLd.endDate);

  // The test link opens the form straight away, on the hidden test option.
  useEffect(() => {
    if (testMode && !paymentStatus) setModalOpen(true);
  }, [testMode, paymentStatus]);

  const open = () => {
    window.gtag?.("event", "registration_modal_open", { page: "heart-sutra" });
    setModalOpen(true);
  };

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
      eventJsonLd={eventJsonLd}
      navCtaLabel={concluded ? "לאירועים" : "להרשמה"}
      onNavCtaClick={concluded ? () => navigate("/events") : open}
      footerText={`© ${new Date().getFullYear()} מאיטרייה סנגהה ישראל. כל הזכויות שמורות.`}
    >
      {/* ── Hero ── */}
      <RetreatHero
        image={heartSutraHero}
        mobileImage={heartSutraHeroMobile}
        imageAlt="תנקה של פרג׳נאפרמיטה, אם הבודהות, יושבת על לוטוס ואוחזת בספר הסוטרה"
        title="סוטרת הלב"
        subtitle="סדרת לימוד אונליין עם לאמה גלן מולין"
        accent="פרג׳נאפרמיטה - שלמות החוכמה"
        dateLine="5 מפגשים בימי ראשון, החל מ-4 באוקטובר 2026 | בזום, מוקלט"
        objectPosition="center 30%"
      />

      {concluded && (
        <UpcomingEvents
          lang="he"
          currentUrl={PAGE_PATH}
          ended={{
            eyebrow: "הסדרה הסתיימה",
            line: "סדרת הלימוד התקיימה באוקטובר 2026 וההרשמה סגורה.",
          }}
        />
      )}

      {/* ── Opening ── */}
      <SectionFrame tone="cream" maxWidth="md" size="md">
        <p
          className="text-sm font-semibold uppercase tracking-wide text-center mb-4"
          style={{ color: RETREAT_THEME.GOLD_DARK }}
        >
          סדרת לימוד חדשה | <span dir="ltr">Discussions on the Heart Sutra</span>
        </p>
        <p className="text-lg md:text-xl leading-[1.9] text-center mb-8" style={{ color: RETREAT_THEME.BODY }}>
          סוטרת הלב היא תמצית תורתו של הבודהה על הריקות ועל טבעה האמיתי של המציאות. בכמה עשרות שורות בלבד
          היא מכילה את לב החוכמה של המהאיאנה, והיא מדוקלמת עד היום במנזרים בכל העולם הבודהיסטי. לאמה גלן מולין
          ילמד את הסוטרה בחמישה מפגשים שבועיים, בהמשך לסדרת הלימוד הקודמת שלו, יחד עם מאיטרייה סנגהה ברחבי העולם.
        </p>
        {!concluded && (
          <div className="text-center">
            <button type="button" onClick={open} onMouseEnter={hoverIn} onMouseLeave={hoverOut}
              className="px-8 py-3 text-base font-bold rounded-full border-2 transition-all duration-200 hover:scale-105 hover:shadow-md"
              style={goldBtn}>
              להרשמה לסדרה
            </button>
          </div>
        )}
      </SectionFrame>

      {/* ── About ── */}
      <SectionFrame tone="stone" maxWidth="lg">
        <SectionTitle className="text-center mb-10">על סוטרת הלב</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 items-center max-w-5xl mx-auto">
          <div
            className="md:col-span-3 space-y-6 text-lg leading-[1.9]"
            style={{ color: RETREAT_THEME.BODY, fontFamily: RETREAT_FONTS.sans }}
          >
            <p>
              סוטרת הלב, בשמה המלא "סוטרת לב שלמות החוכמה", היא אחד הטקסטים הקצרים והמוכרים ביותר בבודהיזם.
              היא מתמצתת את משנת שלמות החוכמה - פרג׳נאפרמיטה - ואת ההבנה שכל התופעות ריקות מקיום עצמי ונפרד.
            </p>
            <p>
              "צורה היא ריקות, ריקות היא צורה" - המשפט המפורסם שלה מלווה מתרגלים לאורך הדורות, ובהבנתו,
              כך מלמדת המסורת, טמון המפתח לשחרור.
            </p>
            <p>
              בסדרה זו לאמה גלן מולין ילמד ויפרש את הסוטרה, שורה אחר שורה, בשיחות פתוחות עם הסנגהה.
            </p>
          </div>
          <img
            src={prajnaparamitaThangka}
            alt="פרג׳נאפרמיטה, אם הבודהות, התגלמות שלמות החוכמה"
            loading="lazy"
            className="md:col-span-2 mx-auto rounded-xl shadow-md w-full max-w-xs"
          />
        </div>
      </SectionFrame>

      {/* ── Teacher ── */}
      <SectionFrame tone="cream" maxWidth="xl">
        <SectionTitle className="text-center mb-16">המורה</SectionTitle>
        <TeacherCard
          name="לאמה גלן מולין"
          photo={lamaGlennPhoto}
          bio="לאמה גלן מולין הינו מורה וותיק ואהוב של טנטרה בודהיסטית וטומו. הוא תלמידם הישיר של הוד קדושתו הדלאי לאמה ה-14, ומורי השורש שלו הם לינג רינפוצ׳ה השישי וטריג׳נג רינפוצ׳ה - מורי השורש האישיים של הדלאי לאמה ה-14. לאמה גלן מלמד בודהיזם טיבטי מעל שלושים שנה לאלפי תלמידים בכל רחבי העולם. הוא חוקר, סופר, ומתרגם ידוע - שכתב מעל 30 ספרים בנושאי בודהיזם טיבטי וטנטרה בודהיסטית שפורסמו בכל רחבי העולם."
          size="lg"
        />
      </SectionFrame>

      {/* ── Schedule ── */}
      <SectionFrame tone="stone" maxWidth="lg">
        <SectionTitle className="text-center mb-6">מועדי המפגשים</SectionTitle>
        <p className="text-lg text-center leading-[1.9] max-w-3xl mx-auto mb-10" style={{ color: RETREAT_THEME.BODY }}>
          המפגשים מתקיימים בימי ראשון בשעה 10:00 בבוקר בקוריאה, יחד עם הסנגהה העולמית - ולכן בשעות הבוקר המוקדמות
          בישראל.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-3xl mx-auto mb-10">
          {sessionDates.map((s) => (
            <div key={s.n} className="text-center rounded-xl py-5 px-3" style={{ backgroundColor: "rgba(201,169,97,0.10)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#C9A961" }}>
                {s.n}
              </p>
              <p className="font-bold text-sm">{s.date}</p>
              <p className="text-sm mt-1" style={{ color: RETREAT_THEME.GOLD_DARK }}>{s.time}</p>
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto space-y-3 text-center">
          <p className="text-base" style={{ color: RETREAT_THEME.WARM_GRAY }}>
            השעות לפי שעון ישראל. מ-25 באוקטובר, עם המעבר לשעון חורף, המפגשים מתחילים ב-03:00.
          </p>
          <p className="text-base" style={{ color: RETREAT_THEME.WARM_GRAY }}>
            <strong style={{ color: RETREAT_THEME.DARK }}>כל המפגשים מוקלטים</strong>, וההקלטות עולות לדף הקורס
            לנרשמים - אפשר להצטרף בשידור החי, או לצפות בהקלטה בשעה שנוחה לכם.
          </p>
          <p className="text-base" style={{ color: RETREAT_THEME.WARM_GRAY }}>
            קישור הזום וקישור דף ההקלטות יישלחו לנרשמים לפני המפגש הראשון.
          </p>
        </div>
      </SectionFrame>

      {/* ── What's Included ── */}
      <WhatsIncluded eyebrow="מה כוללת הסדרה" items={whatsIncluded} />

      {/* ── Dana / registration ── */}
      {!concluded && (
        <DanaSection
          title="הרשמה והשתתפות"
          paragraphs={[
            "ההשתתפות בסדרה היא בדאנה - מסורת הנתינה שמאפשרת ללימוד להמשיך ולהתקיים. בטופס ההרשמה תוכלו לבחור את הסכום המומלץ או להזין סכום אחר.",
            "התשלום מתבצע כאן בעמוד, בעמוד סליקה מאובטח של Cardcom, וההרשמה תושלם עם ביצוע התשלום.",
          ]}
          suggestedLine={`דאנה מומלצת לסדרה: ${SUGGESTED} ש״ח`}
          footerNote={`רצוננו לאפשר לכל המעוניין להשתתף וללמוד. אם הדאנה המומלצת מהווה קושי בשל נסיבות החיים, כתבו לנו ונשמח לסייע: ${CONTACT_EMAIL}`}
          ctaLabel="להרשמה ולתשלום"
          onCtaClick={open}
        />
      )}

      {/* ── Video ── */}
      <VideoSection
        title="הכירו את לאמה גלן מולין"
        subtitle="לאמה גלן מולין על טנטרה בודהיסטית בחיי היומיום"
        embedUrl="https://www.youtube.com/embed/r6IniYsqRcw?start=1"
        iframeTitle="לאמה גלן מולין - טנטרה בודהיסטית"
      />

      {/* ── Final CTA ── */}
      {!concluded && (
        <FinalCTA
          bgImage={heartSutraHero}
          title="הצטרפו לסדרה"
          body="חמישה מפגשים על סוטרת הלב עם לאמה גלן מולין, בזום, יחד עם הסנגהה העולמית. כל המפגשים מוקלטים לצפייה בשעה שנוחה לכם."
          ctaLabel="להרשמה לסדרה"
          onCtaClick={open}
        />
      )}

      {/* ── Contact ── */}
      <InfoFooter
        contact={{
          heading: "צרו קשר",
          label: concluded ? "לשאלות ובירורים:" : "לשאלות, בירורים והרשמה:",
          email: CONTACT_EMAIL,
          phone: CONTACT_PHONE,
          phoneLabel: "טלפון:",
        }}
      />

      {!concluded && <UpcomingEvents lang="he" currentUrl={PAGE_PATH} />}

      <MailingListSignup
        heading="הישארו מעודכנים"
        subheading="הירשמו לרשימת התפוצה שלנו וקבלו עדכונים על סדרות לימוד, ריטריטים ואירועים נוספים"
        placeholder="כתובת אימייל"
        ctaLabel="הרשמה"
        successMessage="תודה! נרשמת בהצלחה"
        errorMessage="שגיאה בהרשמה, נסו שוב"
        language="he"
        tag="Hebrew"
      />

      {!concluded && (
        <RegistrationModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          preselectedTierId={testMode ? TEST_TIER_ID : undefined}
          config={registrationConfig}
          copy={registrationCopy}
        />
      )}

      {!concluded && paymentStatus && (
        <PaymentStatusModal
          status={paymentStatus}
          dir="rtl"
          successTitle="ההרשמה בוצעה בהצלחה!"
          successBody="תודה שנרשמתם לסדרת הלימוד על סוטרת הלב עם לאמה גלן מולין. אישור הרשמה יישלח אליכם במייל, וקישור הזום וקישור דף ההקלטות לפני המפגש הראשון."
          successDetails={{
            heading: "מועדי המפגשים",
            lines: [
              "ימי ראשון 4.10, 11.10, 18.10 בשעה 04:00",
              "ימי ראשון 25.10, 1.11 בשעה 03:00 (שעון ישראל)",
            ],
          }}
          failedTitle="אירעה שגיאה בתשלום"
          failedBody="התשלום לא הושלם. ניתן לנסות שוב או ליצור קשר איתנו."
          closeLabel="סגור"
          failedReturnLabel="חזרה לדף הסדרה"
          contactEmail={CONTACT_EMAIL}
          onClose={closePaymentStatus}
        />
      )}
    </RetreatLayout>
  );
};

export default HeartSutra2026;
