/**
 * Support the December 2026 visit (Hebrew / RTL)
 * ==============================================
 *
 * One page, two asks: hands and money. The visit is run entirely by
 * volunteers, so this is where people offer help, and where the community
 * gives towards the costs the retreats' own prices do not cover.
 *
 * Language: Hebrew only (Shahaf, 2026-09-16).
 * Content source (vault): the-system/W-work/ventures/maitreya-sangha/projects/
 *   teachers-visit-nov-dec-2026/marketing/support-page-content.md
 *
 * Volunteering: `VisitVolunteerForm` -> n8n `Visit_Volunteer` -> Google Sheet
 *   + an email to the sangha inbox.
 * Dana: the shared `RegistrationModal` in donation mode - fixed amounts plus a
 *   free one - -> n8n `Visit_Dana` -> Cardcom.
 *
 * Deliberately NOT mentioning section 46 / tax relief: the עמותה does not have
 * that approval (Shahaf, 2026-09-16), so the page must not imply it.
 *
 * This page is about THIS visit, not a standing appeal. The permanent page
 * about dana as a practice is /dana, and it stays as it is.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { HandHeart, HeartHandshake } from "lucide-react";
import { SiteLayout } from "@/site/SiteLayout";
import { VisitVolunteerForm } from "@/components/VisitVolunteerForm";
import { RegistrationModal } from "@/components/retreat/RegistrationModal";
import type { RegistrationConfig } from "@/components/retreat/types";

const SEO = {
  title: "תמכו בביקור לאמה גלן בישראל - דצמבר 2026 | מאיטרייה סנגהה ישראל",
  description:
    "הביקור של לאמה גלן מולין ודרופון צ׳ונגוואל-לה בדצמבר 2026 מאורגן בהתנדבות מלאה. כאן אפשר להציע עזרה בהכנות ובאירועים, ולתרום לקיום הביקור.",
};

const DANA_WEBHOOK = "https://tknstk.app.n8n.cloud/webhook/Visit_Dana";

/**
 * Donation form. Amounts are Shahaf's (50 / 100 / 180 / 250 / 500), plus an
 * open field for anything else. Tier ids are the codes n8n charges by.
 */
const danaConfig: RegistrationConfig = {
  title: "תרומה לביקור",
  subtitle: "ביקור לאמה גלן בישראל | דצמבר 2026",
  webhookUrl: DANA_WEBHOOK,
  contentName: "Visit Dana December 2026",
  currency: "ILS",
  lang: "he",
  dir: "rtl",
  // The modal renders each option as "title - price", and the payment step the
  // same way, so the title must NOT be the amount or it reads "50 ₪ - 50₪".
  tiers: [
    { id: "VISIT_DANA_50", title: "תרומה", priceDisplay: "50", priceValue: 50, currencySymbol: "₪" },
    { id: "VISIT_DANA_100", title: "תרומה", priceDisplay: "100", priceValue: 100, currencySymbol: "₪" },
    { id: "VISIT_DANA_180", title: "תרומה", priceDisplay: "180", priceValue: 180, currencySymbol: "₪" },
    { id: "VISIT_DANA_250", title: "תרומה", priceDisplay: "250", priceValue: 250, currencySymbol: "₪" },
    { id: "VISIT_DANA_500", title: "תרומה", priceDisplay: "500", priceValue: 500, currencySymbol: "₪" },
    {
      id: "VISIT_DANA_OPEN",
      title: "סכום אחר",
      note: "כל סכום, כפי יכולתכם",
      openAmount: true,
      openAmountMin: 1,
      openAmountMax: 50000,
      openAmountLabel: "סכום התרומה",
      priceDisplay: "",
      priceValue: 0,
      currencySymbol: "₪",
    },
  ],
  showTierSelect: true,
  tierSelectLabel: "סכום התרומה",
  // Nothing links to it any more (the consent line is plain text), but the
  // shared config requires a value.
  termsUrl: "https://maitreya.org.il/dana",
  askPhone: true,
  storagePrefix: "visitdana26",
  extraPayload: { source: "support-visit-dec-2026" },
  embedPayment: true,
};

/** Donation wording. Same modal as the retreats, but nobody is registering for anything. */
const danaCopy = {
  tierSelectPlaceholder: "בחרו סכום",
  firstNameLabel: "שם פרטי",
  firstNamePlaceholder: "שם פרטי",
  lastNameLabel: "שם משפחה",
  lastNamePlaceholder: "שם משפחה",
  emailLabel: "אימייל",
  phoneLabel: "טלפון",
  phonePlaceholder: "050-1234567",
  messageLabel: "הודעה (לא חובה)",
  messagePlaceholder: "רוצים לשתף אותנו במשהו?",
  // Shahaf's wording, 2026-09-16: one plain sentence, no link. An empty
  // termsLinkLabel is what tells the modal to skip the link entirely.
  termsPrefix: "אני מסכים/ה לקבל עדכונים ממאיטרייה סנגהה ישראל",
  termsLinkLabel: "",
  termsSuffix: "",
  submitLabel: "מעבר לתרומה",
  submittingLabel: "שולח...",
  submitFootnote: "התשלום מתבצע כאן בעמוד, בעמוד סליקה מאובטח.",
  amountLabel: "סכום התרומה",
  amountNote: "כל סכום, כפי יכולתכם.",
  errAmount: "יש למלא סכום",
  errAmountRange: "יש למלא סכום במספרים שלמים, בין 1 ל-50,000",
  paymentTitle: "תרומה לביקור",
  paymentNote:
    "התרומה נגבית על ידי מאיטרייה סנגהה ישראל (ע״ר) באמצעות קארדקום. אפשר לתרום בכרטיס אשראי או בביט. הקבלה תישלח לאימייל שמילאתם.",
  errTier: "יש לבחור סכום",
  errFname: "יש למלא שם פרטי",
  errLname: "יש למלא שם משפחה",
  errEmail: "יש למלא אימייל",
  errEmailInvalid: "כתובת אימייל לא תקינה",
  errPhone: "יש למלא טלפון",
  errPhoneInvalid: "מספר טלפון לא תקין (למשל 0501234567)",
  errConfirmed: "יש לאשר",
  errServer: "שגיאה בשרת, נסו שוב",
  errNoPaymentUrl: "לא התקבל קישור לתשלום",
  // Fields the donation form never shows (no gender, food, experience or city
  // is asked of a donor). The shared copy type wants them all, so they carry
  // the standard strings and simply never render.
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
  cityLabel: "עיר מגורים",
  cityPlaceholder: "באיזו עיר אתם גרים?",
  rideShareLabel: "אשמח להציע טרמפ",
  errGender: "יש לבחור מגדר",
  errFood: "יש לבחור העדפת אוכל",
  errPrevExp: "יש לבחור ניסיון קודם",
  errCity: "יש למלא עיר מגורים",
  errGeneric: "שגיאה בשליחת הטופס",
};

const SupportVisitDec2026 = () => {
  const [danaOpen, setDanaOpen] = useState(false);

  return (
    <SiteLayout
      lang="he"
      title={SEO.title}
      description={SEO.description}
      path="/support-visit-dec-2026"
    >
      <article className="container max-w-3xl py-16">
        <h1 className="font-heading text-4xl font-bold text-primary mb-10">
          תמכו בביקור לאמה גלן בישראל - דצמבר 2026
        </h1>

        <div className="prose prose-lg max-w-none font-body prose-headings:font-heading prose-headings:text-primary prose-a:text-accent hover:prose-a:text-secondary">
          <p>
            הביקור של לאמה גלן מולין ודרופון צ׳ונגוואל-לה בישראל הוא פרויקט גדול. שני ריטריטים,
            משתתפים רבים מכל רחבי הארץ, טיסות ואירוח, מקומות, ציוד, תרגום, הגברה, ביטוח וכל מה
            שנדרש כדי שהלימוד יוכל להתרחש.
          </p>
          <p>
            הכול נעשה בהתנדבות מלאה ובאהבה, על ידי חברי הקהילה - אנשים שנותנים מזמנם כדי שהדהרמה
            תגיע לכאן.
          </p>
          <p>
            כל עזרה, גדולה כקטנה, נחוצה ומוערכת - והיא תרומה ישירה לדהרמה ולעשייה שמוקדשת לכל
            היצורים החיים.
          </p>
        </div>

        {/* ── Volunteering ── */}
        <section id="volunteer" className="mt-12 scroll-mt-24">
          <h2 className="font-heading text-3xl font-bold text-primary mb-4 flex items-center gap-3">
            <HandHeart className="h-7 w-7" aria-hidden />
            בואו להתנדב בביקור
          </h2>
          <div className="prose prose-lg max-w-none font-body prose-headings:font-heading prose-headings:text-primary prose-a:text-accent hover:prose-a:text-secondary mb-6">
            <p>
              נשמח מאוד לעזרתכם - גם בהכנות לקראת הביקור וגם במהלך האירועים עצמם. יש הרבה תחומים
              שניתן לסייע בהם: לוגיסטיקה, פרסום, קבלת אורחים, הסעות, ציוד, הסעדה ועוד.
            </p>
            <p>לא צריך ניסיון ולא צריך להתחייב להרבה - גם עזרה קטנה תורמת הרבה.</p>
          </div>
          <VisitVolunteerForm />
        </section>

        {/* ── Dana ── */}
        <section id="dana" className="mt-14 scroll-mt-24">
          <h2 className="font-heading text-3xl font-bold text-primary mb-4 flex items-center gap-3">
            <HeartHandshake className="h-7 w-7" aria-hidden />
            דאנה - תרומה לביקור
          </h2>
          <div className="prose prose-lg max-w-none font-body prose-headings:font-heading prose-headings:text-primary prose-a:text-accent hover:prose-a:text-secondary">
            <p>
              לביקור כזה יש הוצאות רבות: טיסות ולינה של המורים, ביטוח, שכירת המקומות, תרגום, ציוד,
              כיבוד ואוכל ועוד.
            </p>
            <p>
              אנחנו משתדלים שהכול יתקיים בדאנה, ואם לא ניתן אז במחיר העלות, ולעיתים אף מתחת לעלות -
              כדי שהלימוד יישאר נגיש לכל מי שרוצה ללמוד ולתרגל.
            </p>
            <p>התרומה שלכם היא מה שמאפשר לביקור הזה לקרות בפועל. כל סכום, כפי יכולתכם.</p>
          </div>
          <button
            type="button"
            onClick={() => setDanaOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg px-8 py-3 font-body text-lg text-white"
            style={{ background: "#b51a00" }}
          >
            לתרומה
          </button>
        </section>

        <div className="prose prose-lg max-w-none font-body prose-headings:font-heading prose-headings:text-primary prose-a:text-accent hover:prose-a:text-secondary mt-14">
          <p>תודה על כל עזרה ועל כל נתינה. הן מה שמאפשר לדהרמה להגיע לכאן ולהמשיך ולפרוח.</p>
          <p className="text-base opacity-75">
            הביקור מאורגן בהתנדבות מלאה ובאהבה על ידי מאיטרייה סנגהה ישראל, קהילת התלמידים הישראלית
            של לאמה גלן מולין.
          </p>
          <p className="text-base">
            <Link to="/events" className="underline underline-offset-4">
              לתוכנית הביקור המלאה
            </Link>
          </p>
        </div>
      </article>

      <RegistrationModal open={danaOpen} onOpenChange={setDanaOpen} config={danaConfig} copy={danaCopy} />
    </SiteLayout>
  );
};

export default SupportVisitDec2026;
