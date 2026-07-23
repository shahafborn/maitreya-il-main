/**
 * Uma Zub Tri (Hebrew / Zoom)
 * ===========================
 *
 * Online 6-week Mahamudra teaching series with Lama Glenn Mullin.
 * Weekly Saturday sessions, Aug 1 - Sep 5, 2026, 16:00 Israel time, live on Zoom.
 *
 * Language: Hebrew (RTL).
 * Attendance: Zoom only (no physical venue).
 * Payment: dana/participation fee - recommended ₪350 + open amount, via a
 *   static Cardcom Easy-App page. The registration modal posts the lead to the
 *   `UmaZubTri_Register` n8n webhook (Sheets logging), then redirects to the
 *   static Cardcom page via `staticPaymentUrl`.
 *
 * Content source (vault): the-system/W-work/ventures/maitreya-sangha/projects/
 *   uma-zub-tri-course/marketing/landing-page-content.md
 * Follows the modular pattern of EinGediHealingRetreatEN.tsx.
 */

import { useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { RetreatLayout } from "@/components/retreat/RetreatLayout";
import { RetreatHero } from "@/components/retreat/RetreatHero";
import { TeacherCard } from "@/components/retreat/TeacherCard";
import { WhatsIncluded } from "@/components/retreat/WhatsIncluded";
import { PricingGrid } from "@/components/retreat/PricingGrid";
import { GalleryCarousel } from "@/components/retreat/GalleryCarousel";
import { VideoSection } from "@/components/retreat/VideoSection";
import { FinalCTA } from "@/components/retreat/FinalCTA";
import { InfoFooter } from "@/components/retreat/InfoFooter";
import { MailingListSignup } from "@/components/retreat/MailingListSignup";
import { RegistrationModal } from "@/components/retreat/RegistrationModal";
import { PaymentStatusModal } from "@/components/retreat/PaymentStatusModal";
import { SectionFrame, SectionTitle } from "@/components/retreat/SectionFrame";
import { RETREAT_THEME, RETREAT_FONTS } from "@/components/retreat/theme";
import type { RegistrationConfig, SEOConfig } from "@/components/retreat/types";
import {
  umaHero,
  umaManjushri,
  umaPrayerFlagsBg,
  lamaGlennPhoto,
  umaGalleryImages,
} from "@/assets/uma-zub-tri";

/* ── Constants ── */

const N8N_WEBHOOK_URL = "https://tknstk.app.n8n.cloud/webhook/UmaZubTri_Register";
const CONTACT_EMAIL = "maitreyasanghaisrael@gmail.com";

const seo: SEOConfig = {
  title:
    "UMA ZUB TRI: סדרת לימוד אונליין עם לאמה גלן | החל מ-1 באוגוסט 2026 | מאיטרייה סנגהה ישראל",
  description:
    "סדרת לימוד ותרגול בת שישה שבועות בנושא המהמודרה - ההצבעה הישירה אל טבע התודעה, עם לאמה גלן מולין. מפגש שבועי בזום, בשבתות בשעה 16:00 (שעון ישראל), החל מ-1 באוגוסט 2026.",
  keywords:
    "מהמודרה, אומה זוב טרי, בודהיזם, טנטרה, לאמה גלן, מדיטציה, ריקות, טבע התודעה, אונליין, זום, מאיטרייה סנגהה",
  url: "https://maitreya.org.il/p/events/uma-zub-tri",
  ogImage: "https://maitreya.org.il/p/og-uma-zub-tri.png",
  locale: "he_IL",
};

const registrationConfig: RegistrationConfig = {
  title: "הרשמה לסדרה",
  subtitle: "UMA ZUB TRI | 6 מפגשים שבועיים | החל מ-1 באוגוסט 2026",
  webhookUrl: N8N_WEBHOOK_URL,
  contentName: "Uma Zub Tri",
  currency: "ILS",
  lang: "he",
  dir: "rtl",
  tiers: [
    {
      id: "2026_08_UmaZubTri",
      title: "השתתפות בסדרה",
      priceDisplay: "350",
      priceValue: 350,
      currencySymbol: "₪",
      note: "דמי השתתפות מומלצים - ניתן לבחור סכום אחר",
    },
  ],
  showTierSelect: false,
  termsUrl: "https://maitreya.org.il/",
  askGender: false,
  askFoodPref: false,
  askPrevExp: true,
  askCity: false,
  askRideShare: false,
  askPhone: true,
  phoneInternational: false,
  askCountry: false,
  storagePrefix: "uzt",
  extraPayload: { source: "uma-zub-tri" },
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
  submitLabel: "שליחה ומעבר לתשלום",
  submittingLabel: "שולח...",
  submitFootnote:
    "לאחר מילוי הטופס תועברו לדף תשלום מאובטח. תוכלו לבחור את הסכום המומלץ או סכום אחר. ההרשמה תושלם עם ביצוע התשלום.",
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
  errConfirmed: "יש לאשר את התנאים",
  errServer: "שגיאה בשרת, נסו שוב",
  errNoPaymentUrl: "לא התקבל קישור לתשלום",
  errGeneric: "שגיאה בשליחת הטופס",
};

const sessionDates = [
  { n: "מפגש 1", date: "שבת, 1 באוגוסט" },
  { n: "מפגש 2", date: "שבת, 8 באוגוסט" },
  { n: "מפגש 3", date: "שבת, 15 באוגוסט" },
  { n: "מפגש 4", date: "שבת, 22 באוגוסט" },
  { n: "מפגש 5", date: "שבת, 29 באוגוסט" },
  { n: "מפגש 6", date: "שבת, 5 בספטמבר" },
];

const timezones = [
  { place: "ישראל", time: "שבת, 16:00" },
  { place: "ניו יורק", time: "שבת, 09:00" },
  { place: "קוריאה", time: "שבת, 22:00" },
  { place: "ברזיל וארגנטינה", time: "שבת, 10:00" },
];

const whatsIncluded = [
  "שישה מפגשי לימוד ותרגול בשידור חי עם לאמה גלן מולין",
  "לימוד מעמיק של מסורת המהמודרה והדרכה מעשית לתרגול",
  "תרגום לעברית לאורך כל המפגשים",
  "הקלטות המפגשים לצפייה חוזרת",
];

/* ── Component ── */

const UmaZubTri = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paymentStatus = searchParams.get("payment") as "success" | "failed" | null;
  const [modalOpen, setModalOpen] = useState(false);
  const ctaSectionRef = useRef<HTMLDivElement>(null);

  const open = () => {
    window.gtag?.("event", "registration_modal_open", { page: "uma-zub-tri" });
    setModalOpen(true);
  };

  const closePaymentStatus = () => setSearchParams({}, { replace: true });

  const goldBtn = {
    borderColor: RETREAT_THEME.GOLD_DARK,
    color: RETREAT_THEME.GOLD_DARK,
    backgroundColor: "transparent",
    fontFamily: RETREAT_FONTS.sans,
  } as const;

  return (
    <RetreatLayout
      lang="he"
      dir="rtl"
      seo={seo}
      navCtaLabel="להרשמה"
      onNavCtaClick={open}
      footerText={`© ${new Date().getFullYear()} מאיטרייה סנגהה ישראל. כל הזכויות שמורות.`}
    >
      {/* ── Hero ── */}
      <RetreatHero
        image={umaHero}
        imageAlt="UMA ZUB TRI - מהמודרה עם לאמה גלן מולין"
        title="UMA ZUB TRI"
        subtitle="מדריך לחיים רוחניים מאוזנים ומרוכזים בשלמות"
        accent="עם לאמה גלן מולין"
        dateLine="6 מפגשים שבועיים | החל מ-1 באוגוסט 2026 | בשידור חי בזום"
      />

      {/* ── Key info strip ── */}
      <SectionFrame tone="cream" maxWidth="md" size="md">
        <p
          className="text-sm font-semibold uppercase tracking-wide text-center mb-4"
          style={{ color: RETREAT_THEME.GOLD_DARK }}
        >
          סדרת לימוד חדשה בנושא המהמודרה - הצבעה ישירה אל טבע התודעה
        </p>
        <p
          className="text-lg md:text-xl leading-[1.9] text-center mb-8"
          style={{ color: RETREAT_THEME.BODY }}
        >
          המסורת הבודהיסטית הטיבטית מציעה דרך ישירה להכיר את הטבע הבהיר, הפתוח והער של התודעה שלנו. בסדרה זו נלמד עם לאמה גלן מולין את מסורת המהמודרה, ונתרגל את כוחם של ההקשבה, ההתבוננות והמדיטציה, שמאפשרים לנו לחוות את האיזון המושלם שבין הריקות ובין השמחה של עצם ההוויה.
        </p>
        <div className="text-center">
          <button
            type="button"
            onClick={open}
            className="px-8 py-3 text-base font-bold rounded-full border-2 transition-all duration-200 hover:scale-105 hover:shadow-md"
            style={goldBtn}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = RETREAT_THEME.GOLD_DARK;
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = RETREAT_THEME.GOLD_DARK;
            }}
          >
            להרשמה לסדרה
          </button>
        </div>
      </SectionFrame>

      {/* ── About ── */}
      <SectionFrame tone="stone" maxWidth="lg">
        <div className="max-w-[240px] md:max-w-[280px] mx-auto mb-12">
          <img
            src={umaManjushri}
            alt="מנג׳ושרי - בודהה החוכמה"
            className="w-full rounded-lg shadow-md"
          />
        </div>
        <SectionTitle className="text-center mb-10">אודות הסדרה</SectionTitle>
        <div
          className="max-w-3xl mx-auto space-y-6 text-lg leading-[1.9]"
          style={{ color: RETREAT_THEME.BODY, fontFamily: RETREAT_FONTS.sans }}
        >
          <p>
            המונח הטיבטי "אומה" (Uma) פירושו "המרכז". הבודהה השתמש בו כדי לתאר את החיפוש אחר הדרך לגלות בתוכנו איזון מושלם בין המציאות היחסית למציאות המוחלטת, בין האשליה לאינסוף, בין טבע ה"אני" ובין מה שמעבר לו. החלק השני בשם המסורת, "Zub Tri", פירושו "הצבעה ישירה" (מילולית: "הצבעה עם האצבע").
          </p>
          <p>
            סדרת תרגול זו, בת שישה שבועות, תעמיק בכוחם של ההקשבה, ההתבוננות והמדיטציה - לחשוף את הזוהר של ה"ריקות" ואת השמחה של ה"יש", ולעורר בכל אחת ואחד מאיתנו חוויה ישירה של דברי הבודהה: "הצורה היא ריקות, והריקות היא צורה". הלימוד ישאב ממקורות שונים של השושלות הטיבטיות, בדגש מיוחד על ההוראות של הדלאי לאמות הראשונים.
          </p>
          <p>הסדרה מתאימה למתרגלים מתחילים ומתקדמים, ותלווה בתרגום לעברית.</p>
        </div>
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={open}
            className="px-10 py-4 text-lg font-semibold rounded-full border-2 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.03]"
            style={goldBtn}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = RETREAT_THEME.GOLD_DARK;
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = RETREAT_THEME.GOLD_DARK;
            }}
          >
            להרשמה לסדרה
          </button>
        </div>
      </SectionFrame>

      {/* ── Teacher ── */}
      <SectionFrame tone="none" maxWidth="xl">
        <SectionTitle className="text-center mb-16">המורה</SectionTitle>
        <TeacherCard
          name="לאמה גלן מולין"
          photo={lamaGlennPhoto}
          bio="לאמה גלן מולין הינו מורה וותיק ואהוב של טנטרה בודהיסטית וטומו. הוא תלמידם הישיר של הוד קדושתו הדלאי לאמה ה-14, ומורי השורש שלו הם לינג רינפוצ׳ה השישי וטריג׳נג רינפוצ׳ה - מורי השורש האישיים של הדלאי לאמה ה-14. לאמה גלן מלמד בודהיזם טיבטי מעל שלושים שנה לאלפי תלמידים בכל רחבי העולם. הוא חוקר, סופר, ומתרגם ידוע - שכתב מעל 30 ספרים בנושאי בודהיזם טיבטי וטנטרה בודהיסטית שפורסמו בכל רחבי העולם."
          size="lg"
        />
      </SectionFrame>

      {/* ── Schedule ── */}
      <SectionFrame tone="cream" maxWidth="lg">
        <SectionTitle className="text-center mb-6">מבנה הסדרה</SectionTitle>
        <p
          className="text-lg text-center leading-[1.9] max-w-2xl mx-auto mb-10"
          style={{ color: RETREAT_THEME.BODY }}
        >
          מפגש אחד בשבוע, במשך שישה שבועות, בשידור חי בזום. כל מפגש נמשך כשעה עד שעה וחצי.
        </p>

        {/* Session dates */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-10">
          {sessionDates.map((s) => (
            <div
              key={s.n}
              className="text-center rounded-xl py-5 px-3"
              style={{ backgroundColor: "rgba(201,169,97,0.08)" }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-1"
                style={{ color: "#C9A961" }}
              >
                {s.n}
              </p>
              <p className="font-bold text-sm">{s.date}</p>
            </div>
          ))}
        </div>

        {/* Timezone strip */}
        <div className="max-w-lg mx-auto rounded-xl p-5 mb-8" style={{ backgroundColor: RETREAT_THEME.STONE }}>
          <p className="font-semibold text-center mb-3" style={{ color: RETREAT_THEME.DARK }}>
            שעת המפגש לפי אזורי זמן
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-center">
            {timezones.map((t) => (
              <p key={t.place} className="text-base" style={{ color: RETREAT_THEME.BODY }}>
                <span className="font-semibold">{t.place}</span> | {t.time}
              </p>
            ))}
          </div>
        </div>

        <p className="text-base text-center" style={{ color: RETREAT_THEME.WARM_GRAY }}>
          קישור הזום יישלח לנרשמים לאחר ההרשמה. המפגשים יוקלטו ויהיו זמינים לצפייה חוזרת.
        </p>
      </SectionFrame>

      {/* ── What's Included ── */}
      <WhatsIncluded eyebrow="מה כוללת הסדרה" items={whatsIncluded} />

      {/* ── Registration ── */}
      <div ref={ctaSectionRef}>
        <PricingGrid
          title="הרשמה והשתתפות"
          subtitle="הצטרפו לסדרה בזום מכל מקום בעולם"
          tiers={registrationConfig.tiers}
          ctaLabel="להרשמה"
          onSelect={() => open()}
          notes={[
            "התשלום מתבצע באופן מאובטח דרך Cardcom. בדף התשלום ניתן לבחור את הסכום המומלץ או להזין סכום אחר.",
            "רצוננו לאפשר לכל המעוניין להשתתף וללמוד. אם דמי ההשתתפות מהווים קושי בשל נסיבות החיים, כתבו לנו: maitreyasanghaisrael@gmail.com",
          ]}
        />
      </div>

      {/* ── Gallery ── */}
      <GalleryCarousel
        title="מהאירועים שלנו"
        images={umaGalleryImages}
        alt="מאירועים קודמים של מאיטרייה סנגהה"
      />

      {/* ── Video ── */}
      <VideoSection
        title="הכירו את לאמה גלן מולין"
        subtitle="לאמה גלן מולין על טנטרה בודהיסטית בחיי היומיום"
        embedUrl="https://www.youtube.com/embed/r6IniYsqRcw?start=1"
        iframeTitle="לאמה גלן מולין - טנטרה בודהיסטית"
      />

      {/* ── Final CTA ── */}
      <FinalCTA
        bgImage={umaPrayerFlagsBg}
        title="הצטרפו לסדרה"
        body="שישה שבועות של לימוד ותרגול מסורת המהמודרה, בהדרכת לאמה גלן מולין, בשידור חי בזום מכל מקום בעולם"
        ctaLabel="להרשמה לסדרה"
        onCtaClick={open}
        footnote="מספר המקומות מוגבל"
      />

      {/* ── Contact ── */}
      <InfoFooter
        contact={{
          heading: "צרו קשר",
          label: "לשאלות, בירורים והרשמה:",
          email: CONTACT_EMAIL,
        }}
      />

      {/* ── Mailing List ── */}
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

      {/* ── Registration Modal ── */}
      <RegistrationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        config={registrationConfig}
        copy={registrationCopy}
      />

      {/* ── Payment Status ── */}
      {paymentStatus && (
        <PaymentStatusModal
          status={paymentStatus}
          dir="rtl"
          successTitle="ההרשמה בוצעה בהצלחה!"
          successBody="תודה שנרשמתם לסדרת UMA ZUB TRI. אישור הרשמה וקישור הזום יישלחו אליכם במייל."
          successDetails={{
            heading: "פרטי הסדרה",
            lines: ["6 מפגשים שבועיים, החל מ-1 באוגוסט 2026", "בשבתות בשעה 16:00 (שעון ישראל), בזום"],
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

export default UmaZubTri;
