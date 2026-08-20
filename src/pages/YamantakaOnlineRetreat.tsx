/**
 * Yamantaka Three-Month Online Retreat (Hebrew)
 * =============================================
 *
 * A full three-month retreat led by Drupon Chongwol-la himself, online,
 * Monday to Friday, 1 September - 20 November 2026.
 *
 * Language: Hebrew (RTL).
 * Content source (vault): the-system/W-work/ventures/maitreya-sangha/projects/
 *   yamantaka-3month-2026/program-copy-he.md  (Shahaf-approved copy)
 *
 * Registration flow - this is the first page where payment happens IN the page:
 *   form → n8n `Yamantaka_Register` → the workflow asks Cardcom for a payment
 *   page carrying that person's amount and number of installments → the address
 *   comes back and opens inside the dialog in an iframe (config.embedPayment).
 *   Cardcom then reports the payment to `Yamantaka_Register_Paid`, which checks
 *   it back against Cardcom, completes the sheet row and tags the person in
 *   Mailchimp.
 *   Background: the-system/B-brain/05-research-hub/cardcom-embedding-assessment.md
 *
 * The four payment options are the tier list below; each tier id is the code
 * used by n8n, by the sheet and as the Mailchimp tag.
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { RetreatLayout } from "@/components/retreat/RetreatLayout";
import { RetreatHero } from "@/components/retreat/RetreatHero";
import { AboutSection } from "@/components/retreat/AboutSection";
import { TeacherCard } from "@/components/retreat/TeacherCard";
import { ScheduleBlock } from "@/components/retreat/ScheduleBlock";
import { DanaSection } from "@/components/retreat/DanaSection";
import { FinalCTA } from "@/components/retreat/FinalCTA";
import { InfoFooter } from "@/components/retreat/InfoFooter";
import { RegistrationModal } from "@/components/retreat/RegistrationModal";
import { PaymentStatusModal } from "@/components/retreat/PaymentStatusModal";
import { SectionFrame, SectionTitle } from "@/components/retreat/SectionFrame";
import { GoldDot } from "@/components/retreat/GoldDot";
import { RETREAT_THEME, RETREAT_FONTS } from "@/components/retreat/theme";
import { useRetreatSEO } from "@/components/retreat/hooks/useRetreatSEO";
import type { RegistrationConfig, SEOConfig } from "@/components/retreat/types";
import { yamantakaHero, druponPhoto } from "@/assets/yamantaka-online-2026";

const N8N_WEBHOOK_URL = "https://tknstk.app.n8n.cloud/webhook/Yamantaka_Register";

const CONTACT_EMAIL = "maitreyasanghaisrael@gmail.com";
const CONTACT_PHONE = "054-4905031";

const seo: SEOConfig = {
  title: "ריטריט יאמנטקה עם דרופון צ׳ונגוואל-לה | 1 בספטמבר עד 20 בנובמבר 2026 | מאיטרייה סנגהה ישראל",
  description:
    "ריטריט מלא בן שלושה חודשים בהנחיית דרופון צ׳ונגוואל-לה. התהוות כיאמנטקה, דקלום מנטרות, תרגול טומו ויוגת החלום. מפגשים מקוונים בימים שני עד שישי, 1 בספטמבר עד 20 בנובמבר 2026.",
  keywords:
    "ריטריט יאמנטקה, דרופון צ׳ונגוואל-לה, טנטרה בודהיסטית, טומו, יוגת החלום, מנטרות, ריטריט אונליין, מאיטרייה סנגהה",
  url: "https://maitreya.org.il/p/events/yamantaka-online-2026",
  ogImage: "https://maitreya.org.il/p/og-yamantaka-online-2026.png",
  locale: "he_IL",
};

const registrationConfig: RegistrationConfig = {
  title: "הרשמה לריטריט יאמנטקה",
  subtitle: "1 בספטמבר עד 20 בנובמבר 2026",
  webhookUrl: N8N_WEBHOOK_URL,
  contentName: "Yamantaka Online Retreat",
  currency: "ILS",
  lang: "he",
  dir: "rtl",
  // Two choices. How many installments the three-month option is split into is
  // chosen on the Cardcom page itself, which offers 1, 2 or 3 - so there is no
  // second field here for it.
  tiers: [
    {
      id: "Yamantaka_Online_Monthly",
      title: "דאנה לחודש אחד",
      note: "תשלום עבור החודש הקרוב. לקראת כל חודש נשלח קישור חדש.",
      priceDisplay: "300",
      priceValue: 300,
      currencySymbol: "₪",
    },
    {
      id: "Yamantaka_Online_Full",
      title: "דאנה לשלושת החודשים - מחיר מיוחד",
      note: "750 ש״ח במקום 900. אפשר לפרוס עד 3 תשלומים בעמוד התשלום.",
      priceDisplay: "750",
      priceValue: 750,
      currencySymbol: "₪",
    },
  ],
  showTierSelect: true,
  tierSelectLabel: "אופן ההשתתפות בדאנה",
  termsUrl: "https://maitreya.org.il/",
  askPrevExp: true,
  storagePrefix: "yamantaka26",
  extraPayload: { source: "yamantaka-online-2026" },
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
  termsLinkLabel: "תנאי הריטריט וההרשמה",
  termsSuffix: "ומסכים/ה לקבל עדכונים מאיטרייה סנגהה ישראל.",
  submitLabel: "המשך לתשלום",
  submittingLabel: "שולח...",
  submitFootnote: "התשלום מתבצע כאן בעמוד, בעמוד סליקה מאובטח. ההרשמה תסתיים רק לאחר התשלום.",
  errTier: "יש לבחור אופן השתתפות",
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

const scheduleDays = [
  {
    label: "מפגש ראשון",
    time: "01:30-03:00",
    description: "עליה כיאמנטקה.",
  },
  {
    label: "מפגש שני",
    time: "03:30-05:00",
    description: "דקלום מנטרות - לימוד והתנסות בכ-20 אופנים שונים של דקלום מנטרה.",
  },
  {
    label: "מפגש שלישי",
    time: "07:00-09:00",
    description:
      "תרגול יאמנטקה ו-Bardo Jangcho או Shinin Donduk (תרגול לנפטרים ותרגול טיהור המארות).",
  },
  {
    label: "מפגש רביעי",
    time: "09:30-11:00",
    description: "יאמנטקה - צבירת מנטרות וסיום התרגול.",
  },
  {
    label: "מפגש חמישי",
    time: "13:00-14:30",
    description:
      "טומו / Tsewang, או קריאת טקסט / יוגת החלום. המפגש הזה מתקיים כמה פעמים בשבוע, לא בכל יום.",
  },
];

const scheduleNotes = [
  "השעות הן לפי שעון ישראל, לפני המעבר לשעון חורף. החל מהמעבר לשעון חורף בסוף אוקטובר, שעות המפגשים בישראל יוקדמו בשעה.",
];

const YamantakaOnlineRetreat = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paymentStatus = searchParams.get("payment") as "success" | "failed" | null;
  const [modalOpen, setModalOpen] = useState(false);

  useRetreatSEO(seo);

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
    window.gtag?.("event", "registration_modal_open", { page: "yamantaka-online-2026" });
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
        image={yamantakaHero}
        imageAlt="ריטריט יאמנטקה עם דרופון צ׳ונגוואל-לה"
        title="ריטריט יאמנטקה"
        subtitle="ריטריט און ליין מלא בן שלושה חודשים"
        accent="עם דרופון צ׳ונגוואל-לה"
        dateLine="1 בספטמבר עד 20 בנובמבר 2026 | בימים שני עד שישי | 4 מפגשים מקוונים בכל יום"
      />

      <AboutSection
        eyebrow="על הריטריט"
        paragraphs={[
          "ריטריט מלא בן שלושה חודשים בהובלת דרופון צ׳ונגוואל-לה. הריטריט יעמיק בתרגול מעשי ולימוד של טנטרת היוגה העליונה של יאמנטקה ותרגולים הקשורים למחזור יאמנטקה.",
          "מ-1 בספטמבר 2026 עד 20 בנובמבר 2026.",
        ]}
        ctaLabel="להרשמה לריטריט"
        onCtaClick={open}
      />

      <SectionFrame tone="stone" maxWidth="md">
        <SectionTitle className="text-center mb-10">המורה</SectionTitle>
        <TeacherCard
          name="דרופון צ׳ונגוואל-לה"
          photo={druponPhoto}
          bio="דרופון צ׳ונגוואל-לה הוא מדריך הריטריטים של לאמה גלן ומורה מיומן לטנטרה בודהיסטית וטומו. הוא נולד בדרום קוריאה וגדל בארה״ב, ושימש כנזיר במסורת הזן במשך 16 שנה. מאז 2007 הוא מתרגל טנטרה מהאיאנה בהדרכת מורה השורש שלו, לאמה גלן."
          size="lg"
        />
      </SectionFrame>

      <ScheduleBlock
        eyebrow="סדר המפגשים"
        intro="הריטריט מתקיים בימים שני עד שישי. בכל יום ארבעה מפגשים, ולצידם מפגש חמישי שמתקיים כמה פעמים בשבוע."
        days={scheduleDays}
        notes={scheduleNotes}
      />

      <SectionFrame tone="cream" maxWidth="md">
        <SectionTitle className="text-center mb-8">הנחיות למשתתפים בריטריט</SectionTitle>
        <ul className="max-w-2xl mx-auto space-y-4 text-lg" style={{ color: RETREAT_THEME.BODY }}>
          <li className="flex gap-3">
            <GoldDot />
            <span>
              משתתפים מישראל - יש להשתתף לפחות בשניים עד שלושה מפגשים בשבוע (אפשר גם בהקלטה),
              ולתרגל גם בבית.
            </span>
          </li>
          <li className="flex gap-3">
            <GoldDot />
            <span>דיווח קבוע על מספר המנטרות שנצברו.</span>
          </li>
        </ul>
      </SectionFrame>

      <DanaSection
        title="דאנה"
        paragraphs={[
          "ההשתתפות בריטריט היא בדאנה - מסורת הנתינה שמאפשרת ללימוד להמשיך ולהתקיים.",
          "אפשר לתת דאנה לחודש אחד, ואז לקראת כל חודש נשלח קישור חדש, או לתרום מראש עבור שלושת החודשים - בתשלום אחד או בשלושה תשלומים.",
        ]}
        suggestedLine="300 ש״ח לחודש · או 750 ש״ח לשלושת החודשים"
        ctaLabel="להרשמה ולתשלום"
        onCtaClick={open}
      />

      <FinalCTA
        bgImage={yamantakaHero}
        title="מצטרפים לריטריט"
        body="שלושה חודשים של תרגול יאמנטקה בהנחיית דרופון צ׳ונגוואל-לה, מ-1 בספטמבר עד 20 בנובמבר 2026."
        ctaLabel="להרשמה"
        onCtaClick={open}
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
          successBody="תודה שנרשמתם לריטריט יאמנטקה. אישור הרשמה ופרטים נוספים יישלחו אליכם במייל."
          successDetails={{
            heading: "פרטי הריטריט",
            lines: [
              "1 בספטמבר עד 20 בנובמבר 2026",
              "מפגשים מקוונים, בימים שני עד שישי",
            ],
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

export default YamantakaOnlineRetreat;
