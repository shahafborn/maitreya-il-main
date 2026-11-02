/**
 * White Dakini Chulen practice - a teaching session with Drupon Chongwol-la (Hebrew / Zoom)
 * ======================================================================================
 *
 * One session: Sat 7 Nov 2026, 13:00 Israel (20:00 Korea), on the Korean sangha's
 * Zoom, with Hebrew interpretation in a dedicated Zoom channel. A practice, not an
 * initiation - open to everyone. Shahaf (2.11): a TEACHING session, in which
 * Chongwol-la teaches the practice and gives the instructions for practising it. Recording available to registrants.
 *
 * Shahaf's calls (2.11.2026): free donation with 108 NIS suggested - one open-amount
 * option, prefilled with 108; every registration goes through payment.
 *
 * Registration and payment follow the LG initiations page (LgInitiations2026): the
 * form posts to n8n `WDC_Register` (sheet row + a Cardcom page for this person's
 * amount, opened inside the dialog); Cardcom reports to `WDC_Register_Paid` (verify,
 * mark the row, Mailchimp tags 2026_11_WhiteDakiniChulen + Hebrew, Resend confirmation).
 * `?test=<TEST_KEY>` opens a hidden 0.10-5 NIS test option.
 *
 * The option closes when the session starts (Israel time); n8n refuses it then too.
 */

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { usePaymentReturn } from "@/components/retreat/hooks/usePaymentReturn";
import { RetreatLayout } from "@/components/retreat/RetreatLayout";
import type { EventJsonLdConfig } from "@/components/retreat/hooks/useEventJsonLd";
import { RetreatHero } from "@/components/retreat/RetreatHero";
import { TeacherCard } from "@/components/retreat/TeacherCard";
import { FinalCTA } from "@/components/retreat/FinalCTA";
import { InfoFooter } from "@/components/retreat/InfoFooter";
import { MailingListSignup } from "@/components/retreat/MailingListSignup";
import { UpcomingEvents } from "@/components/retreat/UpcomingEvents";
import { RegistrationModal } from "@/components/retreat/RegistrationModal";
import { PaymentStatusModal } from "@/components/retreat/PaymentStatusModal";
import { SectionFrame, SectionTitle } from "@/components/retreat/SectionFrame";
import { RETREAT_THEME, RETREAT_FONTS } from "@/components/retreat/theme";
import type { PricingTier, RegistrationConfig, SEOConfig } from "@/components/retreat/types";
import { hasEnded } from "@/site/today";
import { whiteDakiniHero, whiteDakiniHeroMobile, whiteDakiniPainting, druponPhoto } from "@/assets/white-dakini-chulen-2026";

/* ── Constants ── */

const N8N_WEBHOOK_URL = "https://tknstk.app.n8n.cloud/webhook/WDC_Register";
const PAGE_PATH = "/events/white-dakini-chulen-practice";
const PAGE_URL = "https://maitreya.org.il" + PAGE_PATH;
/** Test payments: `?test=c3v8tn` opens the hidden 0.10-5 NIS option (refund it from Cardcom). */
const TEST_KEY = "c3v8tn";
const TEST_TIER_ID = "WDC_2026_Test";
const DANA_TIER_ID = "WDC_2026_Dana";

const CONTACT_EMAIL = "maitreyasanghaisrael@gmail.com";
const CONTACT_PHONE = "054-4905031";

/** Registration closes when the session starts, Israel time. */
const CLOSES = "2026-11-07 13:00";
const israelNow = () =>
  new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jerusalem" }).slice(0, 16);
const isOpen = () => israelNow() < CLOSES;

const seo: SEOConfig = {
  title: "תרגול הצ׳ולן של הדאקיני הלבנה עם דרופון צ׳ונגוואל-לה | שבת 7.11.2026 | מאיטרייה סנגהה ישראל",
  description:
    "מפגש לימוד אונליין עם דרופון צ׳ונגוואל-לה, שבו ילמד את תרגול הצ׳ולן של הדאקיני הלבנה וייתן הנחיות איך לתרגל אותו. שבת 7 בנובמבר 2026, 13:00 שעון ישראל, כולל תרגום עברי בערוץ ייעודי בזום. פתוח לכולם, בדאנא.",
  keywords:
    "צ׳ולן, הדאקיני הלבנה, דרופון צ׳ונגוואל-לה, תרגול, מיצוי התמצית, טנטרת היוגה העליונה, בודהיזם טיבטי, אונליין, זום, מאיטרייה סנגהה",
  url: PAGE_URL,
  ogImage: "https://maitreya.org.il/og-white-dakini-chulen-practice.jpg",
  locale: "he_IL",
};

const eventJsonLd: EventJsonLdConfig = {
  name: "תרגול הצ׳ולן של הדאקיני הלבנה עם דרופון צ׳ונגוואל-לה",
  description: seo.description,
  url: seo.url,
  image: seo.ogImage,
  // Only the start time is known; the end is left at the start rather than guessed.
  startDate: "2026-11-07T13:00:00+02:00",
  endDate: "2026-11-07T13:00:00+02:00",
  place: { kind: "online", url: seo.url },
  performers: ["דרופון צ׳ונגוואל-לה"],
  offers: [{ name: "דאנא - הסכום המומלץ", price: 108, validFrom: "2026-11-02" }],
};

const ALL_TIERS: PricingTier[] = [
  {
    id: DANA_TIER_ID,
    title: "השתתפות בדאנא",
    note: "תרומה חופשית - הסכום המומלץ 108 ש״ח",
    openAmount: true,
    openAmountMin: 1,
    openAmountMax: 20000,
    openAmountDefault: 108,
    openAmountLabel: "סכום הדאנא",
    openAmountNote: "הסכום המומלץ הוא 108 ש״ח. אפשר לבחור כל סכום, כפי יכולתכם.",
    priceDisplay: "",
    priceValue: 108,
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
    openAmountDefault: 0.1,
    openAmountLabel: "סכום הבדיקה",
    openAmountNote: "בין 0.10 ל-5 ש״ח. אפשר לשנות.",
    openAmountError: "יש למלא סכום בין 0.10 ל-5 ש״ח",
    priceDisplay: "",
    priceValue: 0,
    currencySymbol: "₪",
  },
];

const buildConfig = (): RegistrationConfig => ({
  title: "הרשמה למפגש הלימוד",
  subtitle: "תרגול הצ׳ולן של הדאקיני הלבנה | שבת 7.11.2026",
  webhookUrl: N8N_WEBHOOK_URL,
  contentName: "White Dakini Chulen Practice Nov 2026",
  currency: "ILS",
  lang: "he",
  dir: "rtl",
  // Tier ids are the codes n8n charges by (WDC_Register).
  tiers: ALL_TIERS,
  // On, because the amount field lives inside the option block. One option, so nothing to choose.
  showTierSelect: true,
  tierSelectLabel: "אופן ההשתתפות",
  termsUrl: "https://maitreya.org.il/events/online-terms",
  askPrevExp: true,
  storagePrefix: "wdc26",
  extraPayload: { source: "white-dakini-chulen-practice" },
  embedPayment: true,
});

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
  amountLabel: "סכום",
  amountNote: "",
  errTier: "יש לבחור אפשרות",
  errVariant: "יש לבחור אפשרות",
  errAmount: "יש למלא סכום",
  errAmountRange: "יש למלא סכום תקין",
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
  paymentTitle: "תשלום",
  paymentNote:
    "התשלום נגבה על ידי מאיטרייה סנגהה ישראל (ע״ר) באמצעות קארדקום. אפשר לשלם בכרטיס אשראי או בביט. הקבלה תישלח לאימייל שמילאתם.",
};

/* ── Component ── */

const WhiteDakiniChulen2026 = () => {
  const [searchParams] = useSearchParams();
  const { paymentStatus, closePaymentStatus } = usePaymentReturn();
  const testMode = searchParams.get("test") === TEST_KEY;
  const [modalOpen, setModalOpen] = useState(false);
  const [preselectedTier, setPreselectedTier] = useState<string | undefined>(DANA_TIER_ID);
  const navigate = useNavigate();
  const config = buildConfig();

  const concluded = hasEnded(eventJsonLd.endDate);
  const open = isOpen();

  // A test link opens the form straight away on the hidden test option.
  useEffect(() => {
    if (testMode && !paymentStatus) {
      setPreselectedTier(TEST_TIER_ID);
      setModalOpen(true);
    }
  }, [testMode, paymentStatus]);

  const openForm = () => {
    window.gtag?.("event", "registration_modal_open", { page: "white-dakini-chulen-practice" });
    setPreselectedTier(testMode ? TEST_TIER_ID : DANA_TIER_ID);
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

  const registerButton = (label: string) => (
    <button type="button" disabled={!open} onClick={openForm}
      onMouseEnter={open ? hoverIn : undefined} onMouseLeave={open ? hoverOut : undefined}
      className="px-8 py-3 text-base font-bold rounded-full border-2 transition-all duration-200 hover:scale-105 hover:shadow-md disabled:opacity-40 disabled:hover:scale-100"
      style={goldBtn}>
      {open ? label : "ההרשמה נסגרה"}
    </button>
  );

  return (
    <RetreatLayout
      lang="he"
      dir="rtl"
      seo={seo}
      eventJsonLd={eventJsonLd}
      navCtaLabel={concluded || !open ? "לאירועים" : "להרשמה"}
      onNavCtaClick={concluded || !open ? () => navigate("/events") : openForm}
      footerText={`© ${new Date().getFullYear()} מאיטרייה סנגהה ישראל. כל הזכויות שמורות.`}
    >
      {/* ── Hero ── */}
      <RetreatHero
        image={whiteDakiniHero}
        mobileImage={whiteDakiniHeroMobile}
        imageAlt="הדאקיני הלבנה"
        title="תרגול הצ׳ולן של הדאקיני הלבנה"
        subtitle="מפגש לימוד עם דרופון צ׳ונגוואל-לה"
        accent="אונליין | כולל תרגום עברי בערוץ ייעודי בזום"
        dateLine="שבת, 7 בנובמבר 2026 | 13:00 שעון ישראל"
        objectPosition="center 12%"
      />

      {concluded && (
        <UpcomingEvents
          lang="he"
          currentUrl={PAGE_PATH}
          ended={{ eyebrow: "המפגש התקיים", line: "מפגש הלימוד התקיים בשבת, 7 בנובמבר 2026, וההרשמה סגורה." }}
        />
      )}

      {/* ── Opening ── */}
      <SectionFrame tone="cream" maxWidth="md" size="md">
        <p className="text-lg md:text-xl leading-[1.9] text-center mb-8" style={{ color: RETREAT_THEME.BODY }}>
          דרופון צ׳ונגוואל-לה מזמין את חברי מאיטרייה סנגהה ברחבי העולם למפגש לימוד של הצ׳ולן של הדאקיני הלבנה,
          שבו ילמד את התרגול וייתן הנחיות איך לתרגל אותו - אונליין, בזום של הסנגהה שלו, עם תרגום לעברית.
        </p>
        {!concluded && <div className="text-center">{registerButton("להרשמה")}</div>}
      </SectionFrame>

      {/* ── The practice ── */}
      <SectionFrame tone="stone" maxWidth="lg">
        <SectionTitle className="text-center mb-10">הלימוד</SectionTitle>
        <article className="rounded-2xl p-7 md:p-10 border shadow-sm max-w-3xl mx-auto"
          style={{ backgroundColor: RETREAT_THEME.CREAM, borderColor: "rgba(201,169,97,0.35)" }}>
          <h3 className="text-2xl md:text-3xl font-bold mb-2"
            style={{ fontFamily: RETREAT_FONTS.serif, color: RETREAT_THEME.DARK }}>
            הצ׳ולן של הדאקיני הלבנה
          </h3>
          <p className="text-base font-semibold mb-5" style={{ color: RETREAT_THEME.GOLD_DARK }}>
            שבת, 7 בנובמבר | 13:00 שעון ישראל
          </p>
          <p className="text-base md:text-lg leading-[1.85] mb-4" style={{ color: RETREAT_THEME.BODY }}>
            תרגול הדאקיני הלבנה הוא תרגול של טנטרת היוגה העליונה - דרך מלאה להארה, שמחזקת גם את הבריאות ואת אריכות
            הימים. במסורת הדאלאי לאמות, תרגול הדאקיני הלבנה מאפשר את תרגול הצ׳ולן - תרגול מיצוי התמצית האנרגטית.
          </p>
          <p className="text-base md:text-lg leading-[1.85] mb-8" style={{ color: RETREAT_THEME.BODY }}>
            זהו מפגש לימוד, לא חניכה, והוא פתוח לכולם: דרופון צ׳ונגוואל-לה ילמד את תרגול הצ׳ולן של הדאקיני הלבנה וייתן
            הנחיות מעשיות איך לתרגל אותו בעצמכם.
          </p>
          {/* What Chulen is - drawn from Lama Glenn's Chulen article on the site, linked below. */}
          <h4 className="text-xl md:text-2xl font-bold mb-3"
            style={{ fontFamily: RETREAT_FONTS.serif, color: RETREAT_THEME.DARK }}>
            מהו צ׳ולן?
          </h4>
          <p className="text-base md:text-lg leading-[1.85] mb-4" style={{ color: RETREAT_THEME.BODY }}>
            צ׳ולן, בטיבטית ״מיצוי המהות״, הוא אחת הטכניקות העמוקות במסורת הטיבטית. הרעיון הבסיסי הוא שהאנרגיה היא
            אוניברסלית, ומזון הוא רק מקור אחד, גס, מבין מקורות האנרגיה הרבים ביקום. בעזרת מדיטציה, ויזואליזציה ומנטרות,
            המתרגלים לומדים לספוג את התמצית האנרגטית של היסודות. התרגול התפתח אצל יוגים שנכנסו להתבודדויות ארוכות בהרים,
            ומאז הפך לפופולרי בכל מסורות הבודהיזם הטיבטי.
          </p>
          <a href="/articles/chulen-extracting-the-essence-lama-glenn"
            className="inline-block text-base md:text-lg font-bold underline underline-offset-4"
            style={{ color: RETREAT_THEME.GOLD_DARK }}>
            לקריאת המאמר של לאמה גלן על הצ׳ולן ←
          </a>
        </article>
        <img src={whiteDakiniPainting} alt="הדאקיני הלבנה" loading="lazy"
          className="mx-auto mt-14 rounded-xl shadow-md w-full max-w-sm" />
      </SectionFrame>

      {/* ── Teacher ── */}
      <SectionFrame tone="cream" maxWidth="xl">
        <SectionTitle className="text-center mb-16">המורה</SectionTitle>
        <TeacherCard
          name="דרופון צ׳ונגוואל-לה"
          photo={druponPhoto}
          bio="דרופון צ׳ונגוואל-לה הוא מדריך הריטריטים של לאמה גלן ומורה מיומן לטנטרה בודהיסטית וטומו. הוא נולד בדרום קוריאה וגדל בארה״ב, ושימש כנזיר במסורת הזן במשך 16 שנה. מאז 2007 הוא מתרגל טנטרה מהאיאנה בהדרכת מורה השורש שלו, לאמה גלן. הלימוד מתקיים בזום של הסנגהה שלו."
          size="lg"
        />
      </SectionFrame>

      {/* ── Registration ── */}
      {!concluded && (
        <SectionFrame tone="stone" maxWidth="lg">
          <SectionTitle className="text-center mb-10">הרשמה ודאנא</SectionTitle>
          <div className="rounded-2xl p-7 md:p-9 text-center bg-white/80 shadow-sm max-w-md mx-auto mb-10">
            <p className="text-xl font-bold mb-1" style={{ color: RETREAT_THEME.DARK }}>השתתפות בדאנא</p>
            <p className="text-sm mb-4" style={{ color: RETREAT_THEME.WARM_GRAY }}>תרומה חופשית, כפי יכולתכם</p>
            <p className="text-sm mb-1" style={{ color: RETREAT_THEME.WARM_GRAY }}>הסכום המומלץ</p>
            <p className="text-4xl font-bold mb-6" style={{ color: RETREAT_THEME.GOLD_DARK }}>
              108 <span className="text-2xl">₪</span>
            </p>
            {registerButton("להרשמה")}
          </div>
          <div className="max-w-2xl mx-auto space-y-2 text-center text-base" style={{ color: RETREAT_THEME.WARM_GRAY }}>
            <p>🌸 כולל תרגום עברי בערוץ ייעודי בזום | ההקלטה תהיה זמינה לנרשמים אחרי המפגש</p>
            <p>קישור הזום יישלח לנרשמים לפני המפגש.</p>
            <p>ההרשמה פתוחה עד תחילת המפגש. התשלום מתבצע כאן בעמוד, בעמוד סליקה מאובטח.</p>
          </div>
        </SectionFrame>
      )}

      {/* ── Final CTA ── */}
      {!concluded && open && (
        <FinalCTA
          bgImage={whiteDakiniHero}
          title="הצטרפו למפגש הלימוד"
          body="מפגש לימוד עם דרופון צ׳ונגוואל-לה - תרגול הצ׳ולן של הדאקיני הלבנה והנחיות איך לתרגל אותו. שבת 7 בנובמבר, 13:00 שעון ישראל, אונליין, כולל תרגום עברי בערוץ ייעודי בזום."
          ctaLabel="להרשמה"
          onCtaClick={openForm}
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
          preselectedTierId={preselectedTier}
          config={config}
          copy={registrationCopy}
        />
      )}

      {!concluded && paymentStatus && (
        <PaymentStatusModal
          status={paymentStatus}
          dir="rtl"
          successTitle="ההרשמה בוצעה בהצלחה!"
          successBody="תודה שנרשמתם למפגש הלימוד של תרגול הצ׳ולן של הדאקיני הלבנה. אישור הרשמה יישלח אליכם במייל, וקישור הזום לפני המפגש."
          successDetails={{
            heading: "פרטי המפגש",
            lines: [
              "שבת, 7 בנובמבר 2026 | 13:00 שעון ישראל",
              "בזום, בתרגום לעברית",
            ],
          }}
          failedTitle="אירעה שגיאה בתשלום"
          failedBody="התשלום לא הושלם. ניתן לנסות שוב או ליצור קשר איתנו."
          closeLabel="סגור"
          failedReturnLabel="חזרה לדף המפגש"
          contactEmail={CONTACT_EMAIL}
          onClose={closePaymentStatus}
        />
      )}
    </RetreatLayout>
  );
};

export default WhiteDakiniChulen2026;
