/**
 * Death, Dying and Enlightenment (Hebrew / Zoom)
 * ==============================================
 *
 * Six-week online course with Lama Glenn Mullin, clarifications and guided
 * practice by Drupon Chongwol-la. Sundays 13 Sep - 18 Oct 2026, 16:00 Israel
 * (09:00 New York), live on Zoom.
 *
 * Language: Hebrew (RTL).
 * Content source (vault): the-system/W-work/ventures/maitreya-sangha/projects/
 *   death-dying-enlightenment-2026/marketing/landing-page-content.md
 *   (Shahaf-edited copy, 2026-09-06)
 *
 * Registration and payment follow the Yamantaka page: the form posts to n8n
 * `DDE_Register`, which writes the sheet row and asks Cardcom for a payment
 * page carrying this person's amount; the page opens inside the dialog
 * (config.embedPayment). Cardcom reports the payment to `DDE_Register_Paid`,
 * which verifies it, completes the row, tags the person in Mailchimp and sends
 * the confirmation email through Resend.
 *
 * Two ways to give: the suggested 350 or an amount the person types. Both are
 * offered openly (unlike the Yamantaka page, whose open amount is unlisted).
 */

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { RetreatLayout } from "@/components/retreat/RetreatLayout";
import { RetreatHero } from "@/components/retreat/RetreatHero";
import { TeacherCard } from "@/components/retreat/TeacherCard";
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
import type { RegistrationConfig, SEOConfig } from "@/components/retreat/types";
import { ddeHero, ddeHeroMobile, ddeLampsBg, lamaGlennPhoto, druponPhoto, ddeGalleryImages } from "@/assets/death-dying-2026";

/* ── Constants ── */

const N8N_WEBHOOK_URL = "https://tknstk.app.n8n.cloud/webhook/DDE_Register";
/**
 * Test payments: `?test=k3v9tq` opens the form on a hidden option that takes any
 * amount from 0.10 to 5 shekels, so the paid branch (sheet, Mailchimp, email)
 * can be proved with a real card for a few agorot and refunded from Cardcom.
 * The key is deliberately not a word; the option never appears in the select,
 * and every such row lands in the sheet as "בדיקת תשלום".
 */
const TEST_KEY = "k3v9tq";
const TEST_TIER_ID = "DDE_2026_Test";
const DEFAULT_TIER_ID = "DDE_2026_Suggested";

const CONTACT_EMAIL = "maitreyasanghaisrael@gmail.com";
const CONTACT_PHONE = "054-4905031";

const seo: SEOConfig = {
  title:
    "מוות, לחיות לנוכח המוות, והארה: סדרת לימוד אונליין עם לאמה גלן מולין | החל מ-13 בספטמבר 2026 | מאיטרייה סנגהה ישראל",
  description:
    "שישה מפגשים של לימוד ותרגול על המוות, על הארעיות ועל ההארה במסורת הבודהיסטית הטיבטית, עם לאמה גלן מולין ודרופון צ׳ונגוואל-לה. בימי ראשון בשעה 16:00 (שעון ישראל), בזום, החל מ-13 בספטמבר 2026.",
  keywords:
    "מוות, ארעיות, הארה, בארדו, ספר המתים הטיבטי, לאמה גלן מולין, דרופון צ׳ונגוואל-לה, בודהיזם טיבטי, מדיטציה, פווה, אונליין, זום, מאיטרייה סנגהה",
  url: "https://maitreya.org.il/events/death-dying-enlightenment",
  // JPEG: WhatsApp drops og:images over 600KB.
  ogImage: "https://maitreya.org.il/og-death-dying-enlightenment.jpg",
  locale: "he_IL",
};

const registrationConfig: RegistrationConfig = {
  title: "הרשמה לסדרה",
  subtitle: "מוות, לחיות לנוכח המוות, והארה | 6 מפגשים שבועיים | החל מ-13 בספטמבר 2026",
  webhookUrl: N8N_WEBHOOK_URL,
  contentName: "Death Dying and Enlightenment",
  currency: "ILS",
  lang: "he",
  dir: "rtl",
  // Each tier id is the code n8n charges by, the sheet's ticket_type source and
  // the Mailchimp tag. To change an amount, change the n8n workflow - the page
  // never sends a fixed price (see retreat-registration-flow-skill).
  tiers: [
    {
      id: "DDE_2026_Suggested",
      title: "דאנה מומלצת",
      note: "הסכום המומלץ להשתתפות בסדרה",
      priceDisplay: "350",
      priceValue: 350,
      currencySymbol: "₪",
    },
    {
      id: "DDE_2026_Open",
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
  storagePrefix: "dde26",
  extraPayload: { source: "death-dying-enlightenment" },
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

const sessionDates = [
  { n: "מפגש 1", date: "יום ראשון, 13 בספטמבר" },
  { n: "מפגש 2", date: "יום ראשון, 20 בספטמבר" },
  { n: "מפגש 3", date: "יום ראשון, 27 בספטמבר" },
  { n: "מפגש 4", date: "יום ראשון, 4 באוקטובר" },
  { n: "מפגש 5", date: "יום ראשון, 11 באוקטובר" },
  { n: "מפגש 6", date: "יום ראשון, 18 באוקטובר" },
];

const whatsIncluded = [
  "שישה מפגשי לימוד בשידור חי עם לאמה גלן מולין",
  "מפגש הבהרות ותרגול מודרך שבועי עם דרופון צ׳ונגוואל-לה",
  "תרגום לעברית לאורך כל המפגשים",
  "הקלטות המפגשים לצפייה חוזרת",
];

const books = [
  {
    title: "Living in the Face of Death: The Tibetan Tradition",
    hebrew: "לחיות לנוכח המוות: המסורת הטיבטית",
    publisher: "Snow Lion / Shambhala, 1998",
    body:
      "הספר מקבץ תשעה טקסטים טיבטיים קצרים, בתרגומו ובליוויו של לאמה גלן, ובהם כתבים של הדלאי לאמה השני, השביעי והשלושה-עשר, ושל קרמה לינגפה, מגלה \"ספר המתים הטיבטי\". הטקסטים פורשים את מלוא רוחבה של המסורת: מדיטציות על הארעיות ועל דרכי המוות, אימון התודעה לקראת רגע המוות, סימני המוות המתקרב, יוגות אריכות החיים, יוגת העברת התודעה (פווה), טקס לטיפול במתים, ותיאורים מעוררי השראה של מותם של יוגים וקדושים. מתוך הטקסטים האלה ילמד לאמה גלן לאורך הסדרה.",
  },
  {
    title: "The Tibetan Book of the Dead: An Illustrated Edition",
    hebrew: "ספר המתים הטיבטי: מהדורה מאוירת",
    publisher: "Roli Books, 2009",
    body:
      "\"ספר המתים הטיבטי\", הבארדו טודול - \"שחרור באמצעות שמיעה במצב הביניים\" - הוא הטקסט הטיבטי המוכר ביותר במערב. הוא מלווה את התודעה לאורך שלבי המעבר: רגע המוות והאור הבהיר, הופעתן של הדמויות השלוות והזועמות, והדרך אל הלידה מחדש. במהדורה זו הביא לאמה גלן תרגום מקוצר של הטקסט לצד הסבר והקשר, ולצידם צילומיו של הצלם תומאס קלי מהעולם ההימלאי. הספר מציג את הבארדו טודול לא רק כמדריך לרגע המוות, אלא גם כהדרכה לחיים עצמם.",
  },
];

/* ── Component ── */

const DeathDyingEnlightenment = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paymentStatus = searchParams.get("payment") as "success" | "failed" | null;
  const testMode = searchParams.get("test") === TEST_KEY;
  const [modalOpen, setModalOpen] = useState(false);
  const ctaSectionRef = useRef<HTMLDivElement>(null);

  // The test link opens the form straight away, on the hidden test option.
  useEffect(() => {
    if (testMode && !paymentStatus) setModalOpen(true);
  }, [testMode, paymentStatus]);

  // The payment happens inside an iframe on this same page, so Cardcom's
  // redirect back lands *inside* that frame. Same origin, so we can climb out
  // and show the result on the whole page instead of inside a small box.
  useEffect(() => {
    if (!paymentStatus) return;
    if (window.top && window.top !== window.self) {
      window.top.location.href = window.location.href;
    }
  }, [paymentStatus]);

  const open = () => {
    window.gtag?.("event", "registration_modal_open", { page: "death-dying-enlightenment" });
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
      {/* ── Hero ── */}
      <RetreatHero
        image={ddeHero}
        mobileImage={ddeHeroMobile}
        imageAlt="גלגל החיים: יאמה, אדון המוות, אוחז בגלגל, ומעליו חמישה בודהות על עננים"
        title="מוות, לחיות לנוכח המוות, והארה"
        subtitle="מדיטציות בודהיסטיות על המוות, על הארעיות ועל ההארה"
        accent={"עם לאמה גלן מולין ודרופון צ׳ונגוואל‑לה"}
        dateLine="6 מפגשים שבועיים | בימי ראשון, החל מ-13 בספטמבר 2026 | בשידור חי בזום"
        objectPosition="center 35%"
      />

      {/* ── Key info strip ── */}
      <SectionFrame tone="cream" maxWidth="md" size="md">
        <p
          className="text-sm font-semibold uppercase tracking-wide text-center mb-4"
          style={{ color: RETREAT_THEME.GOLD_DARK }}
        >
          סדרת לימוד ותרגול חדשה | <span dir="ltr">Death, Dying and Enlightenment</span>
        </p>
        <p
          className="text-lg md:text-xl leading-[1.9] text-center mb-8"
          style={{ color: RETREAT_THEME.BODY }}
        >
          בעוד שהתרבות המערבית רואה במוות את הטאבו האחרון, המסורת הטיבטית משלבת את ההתבוננות במוות בחיי היומיום. מודעות ערה לארעיות של חיינו, כך מלמדת המסורת, אינה מקור לפחד אלא המפתח לחיים מלאים, שמחים ומשמעותיים. בסדרה זו נלמד עם לאמה גלן מולין את המדיטציות הבודהיסטיות על המוות, על הארעיות ועל ההארה, ונתרגל אותן יחד בהדרכת דרופון צ׳ונגוואל-לה.
        </p>
        <div className="text-center">
          <button
            type="button"
            onClick={open}
            className="px-8 py-3 text-base font-bold rounded-full border-2 transition-all duration-200 hover:scale-105 hover:shadow-md"
            style={goldBtn}
            onMouseEnter={hoverIn}
            onMouseLeave={hoverOut}
          >
            להרשמה לסדרה
          </button>
        </div>
      </SectionFrame>

      {/* ── About ── */}
      <SectionFrame tone="stone" maxWidth="lg">
        <SectionTitle className="text-center mb-10">אודות הסדרה</SectionTitle>
        <div
          className="max-w-3xl mx-auto space-y-6 text-lg leading-[1.9]"
          style={{ color: RETREAT_THEME.BODY, fontFamily: RETREAT_FONTS.sans }}
        >
          <p>
            המוות הוא הוודאות היחידה בחיינו, ובכל זאת הוא הדבר שאנו הכי ממעטים להתבונן בו. הבודהה לימד שההתבוננות בארעיות היא מהמדיטציות החשובות ביותר: מי שמכיר את המוות מקרוב חי אחרת - בבהירות רבה יותר, בנדיבות רבה יותר ובפחות היאחזות. לאורך הדורות פותחו במסורת הטיבטית תרגולים רבי עוצמה להכרות עם תהליך המוות, לשימוש באמת המוות לחיים מלאים, ואף במינוף המוות עצמו כהזדמנות להגיע להארה. הבודהיזם הטיבטי מלא בלימוד, הדרכות מעשיות ותיאורים של מותם של יוגים וקדושים, וכולם מכוונים לדבר אחד: להפוך את המוות ממקור של פחד לשער אל ההארה.
          </p>
          <p>
            לאורך שישה מפגשים שבועיים ילמד לאמה גלן מולין את המדיטציות הבודהיסטיות על המוות, על הארעיות ועל ההארה, מתוך שני ספריו בנושא. בכל שבוע ייוחד המפגש לנושא אחד, ודרופון צ׳ונגוואל-לה, מדריך הריטריטים של לאמה גלן, יוסיף מפגש הבהרות על הלימוד ויוביל תרגול מודרך של המדיטציות של אותו שבוע.
          </p>
          <p>הסדרה מתאימה למתרגלים מתחילים ומתקדמים, ותלווה בתרגום לעברית.</p>
        </div>
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={open}
            className="px-10 py-4 text-lg font-semibold rounded-full border-2 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.03]"
            style={goldBtn}
            onMouseEnter={hoverIn}
            onMouseLeave={hoverOut}
          >
            להרשמה לסדרה
          </button>
        </div>
      </SectionFrame>

      {/* ── The two books ── */}
      <SectionFrame tone="none" maxWidth="xl">
        <SectionTitle className="text-center mb-6">הספרים שילוו את הסדרה</SectionTitle>
        <p
          className="text-lg text-center leading-[1.9] max-w-3xl mx-auto mb-12"
          style={{ color: RETREAT_THEME.BODY }}
        >
          לאמה גלן מולין הוא מהמתרגמים והחוקרים הבולטים של הספרות הטיבטית, ומחבר של יותר משלושים ספרים. הלימוד בסדרה יישען על שניים מספריו, ושניהם עוסקים במוות ובמה שמעבר לו.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {books.map((b) => (
            <article
              key={b.title}
              className="rounded-2xl p-7 md:p-9 border shadow-sm"
              style={{ backgroundColor: RETREAT_THEME.CREAM, borderColor: "rgba(201,169,97,0.35)" }}
            >
              <h3
                className="text-xl md:text-2xl font-bold leading-snug mb-1"
                dir="ltr"
                style={{ fontFamily: RETREAT_FONTS.serif, color: RETREAT_THEME.DARK, textAlign: "start" }}
              >
                {b.title}
              </h3>
              <p className="text-base font-semibold mb-1" style={{ color: RETREAT_THEME.GOLD_DARK }}>
                {b.hebrew}
              </p>
              <p className="text-sm mb-5" style={{ color: RETREAT_THEME.WARM_GRAY }}>
                <span dir="ltr">{b.publisher}</span>
              </p>
              <p className="text-base md:text-lg leading-[1.85]" style={{ color: RETREAT_THEME.BODY }}>
                {b.body}
              </p>
            </article>
          ))}
        </div>
      </SectionFrame>

      {/* ── Teachers ── */}
      <SectionFrame tone="cream" maxWidth="xl">
        <SectionTitle className="text-center mb-16">המורים</SectionTitle>
        <div className="space-y-16">
          <TeacherCard
            name="לאמה גלן מולין"
            photo={lamaGlennPhoto}
            bio="לאמה גלן מולין הינו מורה וותיק ואהוב של טנטרה בודהיסטית וטומו. הוא תלמידם הישיר של הוד קדושתו הדלאי לאמה ה-14, ומורי השורש שלו הם לינג רינפוצ׳ה השישי וטריג׳נג רינפוצ׳ה - מורי השורש האישיים של הדלאי לאמה ה-14. לאמה גלן מלמד בודהיזם טיבטי מעל שלושים שנה לאלפי תלמידים בכל רחבי העולם. הוא חוקר, סופר, ומתרגם ידוע - שכתב מעל 30 ספרים בנושאי בודהיזם טיבטי וטנטרה בודהיסטית שפורסמו בכל רחבי העולם."
            size="lg"
          />
          <TeacherCard
            name="דרופון צ׳ונגוואל-לה"
            photo={druponPhoto}
            bio="דרופון צ׳ונגוואל-לה הוא מדריך הריטריטים של לאמה גלן ומורה מיומן לטנטרה בודהיסטית וטומו. הוא נולד בדרום קוריאה וגדל בארה״ב, ושימש כנזיר במסורת הזן במשך 16 שנה. מאז 2007 הוא מתרגל טנטרה מהאיאנה בהדרכת מורה השורש שלו, לאמה גלן."
            size="md"
            reversed
          />
        </div>
        <p
          className="text-lg text-center leading-[1.9] max-w-2xl mx-auto mt-14"
          style={{ color: RETREAT_THEME.BODY }}
        >
          בסדרה זו לאמה גלן מלמד, ודרופון צ׳ונגוואל-לה מוסיף לכל מפגש הבהרות ומוביל את התרגול.
        </p>
      </SectionFrame>

      {/* ── Schedule ── */}
      <SectionFrame tone="stone" maxWidth="lg">
        <SectionTitle className="text-center mb-6">מבנה הסדרה</SectionTitle>
        <p
          className="text-lg text-center leading-[1.9] max-w-3xl mx-auto mb-10"
          style={{ color: RETREAT_THEME.BODY }}
        >
          מפגש אחד בשבוע, במשך שישה שבועות, בימי ראשון, בשידור חי בזום. בכל מפגש לאמה גלן מלמד נושא אחד מתוך המדיטציות על המוות, על הארעיות ועל ההארה. בנוסף, בכל שבוע דרופון צ׳ונגוואל-לה יקיים מפגש הבהרות ותרגול מודרך נוסף של המדיטציות של אותו נושא. מועדי מפגשי ההבהרות יימסרו לנרשמים.
        </p>

        {/* Session dates */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-10">
          {sessionDates.map((s) => (
            <div
              key={s.n}
              className="text-center rounded-xl py-5 px-3"
              style={{ backgroundColor: "rgba(201,169,97,0.10)" }}
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

        {/* Session time */}
        <div className="max-w-lg mx-auto rounded-xl p-5 mb-8 bg-white/70 text-center">
          <p className="font-semibold mb-2" style={{ color: RETREAT_THEME.DARK }}>
            שעת המפגש
          </p>
          <p className="text-lg" style={{ color: RETREAT_THEME.BODY }}>
            <span className="font-semibold">ישראל</span> | יום ראשון, 16:00
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-3 text-center">
          <p className="text-base" style={{ color: RETREAT_THEME.WARM_GRAY }}>
            קישור הזום יישלח לנרשמים לאחר ההרשמה.{" "}
            <strong style={{ color: RETREAT_THEME.DARK }}>המפגשים יוקלטו ויהיו זמינים לצפייה חוזרת.</strong>
          </p>
          <p className="text-base" style={{ color: RETREAT_THEME.WARM_GRAY }}>
            שימו לב: המפגש הראשון חל במוצאי ראש השנה. מי שלא יוכל להצטרף בשידור החי יוכל לצפות בהקלטה.
          </p>
        </div>
      </SectionFrame>

      {/* ── What's Included ── */}
      <WhatsIncluded eyebrow="מה כוללת הסדרה" items={whatsIncluded} />

      {/* ── Dana / registration ── */}
      <div ref={ctaSectionRef}>
        <DanaSection
          title="הרשמה והשתתפות"
          paragraphs={[
            "ההשתתפות בסדרה היא בדאנה - מסורת הנתינה שמאפשרת ללימוד להמשיך ולהתקיים. בטופס ההרשמה תוכלו לבחור את הסכום המומלץ או להזין סכום אחר.",
            "התשלום מתבצע כאן בעמוד, בעמוד סליקה מאובטח של Cardcom, וההרשמה תושלם עם ביצוע התשלום.",
          ]}
          suggestedLine="דאנה מומלצת לסדרה: 350 ש״ח"
          footerNote={`רצוננו לאפשר לכל המעוניין להשתתף וללמוד. אם הדאנה המומלצת מהווה קושי בשל נסיבות החיים, כתבו לנו ונשמח לסייע: ${CONTACT_EMAIL}`}
          ctaLabel="להרשמה ולתשלום"
          onCtaClick={open}
        />
      </div>

      {/* ── Gallery ── */}
      <GalleryCarousel
        title="מהאירועים שלנו"
        images={ddeGalleryImages}
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
        bgImage={ddeLampsBg}
        title="הצטרפו לסדרה"
        body="שישה שבועות של לימוד ותרגול על המוות, על הארעיות ועל ההארה, בהדרכת לאמה גלן מולין ודרופון צ׳ונגוואל-לה, בשידור חי בזום מכל מקום בעולם. המפגשים מוקלטים לצפייה חוזרת."
        ctaLabel="להרשמה לסדרה"
        onCtaClick={open}
      />

      {/* ── Contact ── */}
      <InfoFooter
        contact={{
          heading: "צרו קשר",
          label: "לשאלות, בירורים והרשמה:",
          email: CONTACT_EMAIL,
          phone: CONTACT_PHONE,
          phoneLabel: "טלפון:",
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
        // The recommended dana is chosen in advance; the person only changes it if they want to.
        preselectedTierId={testMode ? TEST_TIER_ID : DEFAULT_TIER_ID}
        config={registrationConfig}
        copy={registrationCopy}
      />

      {/* ── Payment Status ── */}
      {paymentStatus && (
        <PaymentStatusModal
          status={paymentStatus}
          dir="rtl"
          successTitle="ההרשמה בוצעה בהצלחה!"
          successBody='תודה שנרשמתם לסדרה "מוות, לחיות לנוכח המוות, והארה". אישור הרשמה יישלח אליכם במייל, וקישור הזום לפני המפגש הראשון.'
          successDetails={{
            heading: "פרטי הסדרה",
            lines: [
              "6 מפגשים שבועיים, החל מ-13 בספטמבר 2026",
              "בימי ראשון בשעה 16:00 (שעון ישראל), בזום",
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

export default DeathDyingEnlightenment;
