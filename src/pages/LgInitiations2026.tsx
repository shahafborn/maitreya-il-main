/**
 * Online initiations with Lama Glenn Mullin - White Dakini + Yamantaka (Hebrew / Zoom)
 * ===================================================================================
 *
 * White Dakini: Fri 2 Oct 2026. Yamantaka: two sessions, Sat 3 + Sun 4 Oct 2026.
 * All 13:00-15:00 Israel, on the Korean sangha's Zoom, with simultaneous Hebrew
 * interpretation. Payment is ours (Cardcom), one payment per registration.
 *
 * Content source (vault): the-system/W-work/ventures/maitreya-sangha/projects/
 *   lama-glenn-initiations-oct-2026/event-spec-and-copy.md (Shahaf's prices, 25.9.2026)
 *
 * Registration and payment follow the Death, Dying and Enlightenment page: the form
 * posts to n8n `LGI_Register` (sheet row + a Cardcom page for this person's amount,
 * opened inside the dialog); Cardcom reports to `LGI_Register_Paid` (verify, mark
 * the row, Mailchimp tags 2026_10_LG_Initiations + tier, Resend confirmation).
 *
 * Three public options (150 / 150 / 250). Yamantaka-retreat participants get their
 * own three (108 / 108 / 150) through a private link, `?ticket=<YAM_KEY>` - never
 * shown on the page. `?test=<TEST_KEY>` opens a hidden 0.10-5 NIS test option.
 *
 * Each option closes an hour before its first session (Israel time); n8n refuses
 * a closed option too, so the page hiding it is a courtesy, not the guard.
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
import { yamantakaHero, yamantakaHeroMobile, yamantakaThangka } from "@/assets/yamantaka-online-2026";
import { lamaGlennPhoto, druponPhoto } from "@/assets/death-dying-2026";

/* ── Constants ── */

const N8N_WEBHOOK_URL = "https://tknstk.app.n8n.cloud/webhook/LGI_Register";
const PAGE_URL = "https://maitreya.org.il/events/white-dakini-yamantaka-initiations";
/** Private link for the Yamantaka three-month retreat's participants. Not a word, on purpose. */
const YAM_KEY = "yam-q7t4";
const YAM_GROUP = "yamantaka";
/** Test payments: `?test=w5n8rk` opens the hidden 0.10-5 NIS option (refund it from Cardcom). */
const TEST_KEY = "w5n8rk";
const TEST_TIER_ID = "LGI_2026_Test";

const CONTACT_EMAIL = "maitreyasanghaisrael@gmail.com";
const CONTACT_PHONE = "054-4905031";

/** Last moment each option can be bought, Israel time: an hour before its first session. */
const CLOSES: Record<string, string> = {
  LGI_2026_WD: "2026-10-02 12:00", LGI_2026_Both: "2026-10-02 12:00",
  LGI_2026_WD_Y: "2026-10-02 12:00", LGI_2026_Both_Y: "2026-10-02 12:00",
  LGI_2026_YAM: "2026-10-03 12:00", LGI_2026_YAM_Y: "2026-10-03 12:00",
};
const israelNow = () =>
  new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jerusalem" }).slice(0, 16);
const isOpen = (id: string) => !CLOSES[id] || israelNow() < CLOSES[id];

const seo: SEOConfig = {
  title: "חניכות אונליין עם לאמה גלן מולין - הדאקיני הלבנה ויאמנטקה | 2-4 באוקטובר 2026 | מאיטרייה סנגהה ישראל",
  description:
    "שתי חניכות של טנטרת היוגה העליונה עם לאמה גלן מולין, אונליין, כולל תרגום עברי בערוץ ייעודי בזום: חניכת הדאקיני הלבנה (שישי 2.10) וחניכת יאמנטקה (שבת-ראשון 3-4.10), 13:00-15:00 שעון ישראל.",
  keywords:
    "חניכה, חניכת יאמנטקה, הדאקיני הלבנה, צ׳ולן, לאמה גלן מולין, דרופון צ׳ונגוואל-לה, טנטרת היוגה העליונה, בודהיזם טיבטי, אונליין, זום, מאיטרייה סנגהה",
  url: PAGE_URL,
  ogImage: "https://maitreya.org.il/og-white-dakini-yamantaka-initiations.jpg",
  locale: "he_IL",
};

const eventJsonLd: EventJsonLdConfig = {
  name: "חניכות אונליין עם לאמה גלן מולין - הדאקיני הלבנה ויאמנטקה",
  description: seo.description,
  url: seo.url,
  image: seo.ogImage,
  startDate: "2026-10-02T13:00:00+03:00",
  endDate: "2026-10-04T15:00:00+03:00",
  place: { kind: "online", url: seo.url },
  performers: ["לאמה גלן מולין"],
  offers: [
    { name: "חניכה אחת", price: 150, validFrom: "2026-09-27" },
    { name: "שתי החניכות", price: 250, validFrom: "2026-09-27" },
  ],
};

const tier = (id: string, title: string, note: string, price: number, extra: Partial<PricingTier> = {}): PricingTier => ({
  id, title, note, priceDisplay: String(price), priceValue: price, currencySymbol: "₪", ...extra,
});

const WD_NOTE = "שישי 2.10 | 13:00-15:00";
const YAM_NOTE = "שבת 3.10 וראשון 4.10 | 13:00-15:00";
const BOTH_NOTE = "שלושת המפגשים, 2-4.10";

const ALL_TIERS: PricingTier[] = [
  tier("LGI_2026_WD", "חניכת הדאקיני הלבנה", WD_NOTE, 150),
  tier("LGI_2026_YAM", "חניכת יאמנטקה (שני מפגשים)", YAM_NOTE, 150),
  tier("LGI_2026_Both", "שתי החניכות", BOTH_NOTE, 250),
  // The Yamantaka-retreat price - only through the private link.
  tier("LGI_2026_WD_Y", "חניכת הדאקיני הלבנה", WD_NOTE, 108, { hidden: true, group: YAM_GROUP }),
  tier("LGI_2026_YAM_Y", "חניכת יאמנטקה (שני מפגשים)", YAM_NOTE, 108, { hidden: true, group: YAM_GROUP }),
  tier("LGI_2026_Both_Y", "שתי החניכות", BOTH_NOTE, 150, { hidden: true, group: YAM_GROUP }),
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
  title: "הרשמה לחניכות",
  subtitle: "חניכות אונליין עם לאמה גלן מולין | 2-4 באוקטובר 2026",
  webhookUrl: N8N_WEBHOOK_URL,
  contentName: "LG Online Initiations Oct 2026",
  currency: "ILS",
  lang: "he",
  dir: "rtl",
  // Tier ids are the codes n8n charges by (LGI_Register); a closed option drops out.
  tiers: ALL_TIERS.filter((t) => isOpen(t.id)),
  showTierSelect: true,
  tierSelectLabel: "לאיזו חניכה להירשם?",
  tierGroups: {
    [YAM_GROUP]: {
      selectLabel: "לאיזו חניכה להירשם?",
      heading: "מחיר מיוחד למשתתפי ריטריט יאמנטקה",
      note: "108 ש״ח לחניכה, או 150 ש״ח לשתי החניכות.",
    },
  },
  termsUrl: "https://maitreya.org.il/events/online-terms",
  askPrevExp: true,
  storagePrefix: "lgi26",
  extraPayload: { source: "white-dakini-yamantaka-initiations" },
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
  errTier: "יש לבחור חניכה",
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

const initiations = [
  {
    title: "חניכת הדאקיני הלבנה",
    when: "יום שישי, 2 באוקטובר | 13:00-15:00",
    body:
      "תרגול הדאקיני הלבנה הוא תרגול של טנטרת היוגה העליונה - דרך מלאה להארה, שמחזקת גם את הבריאות ואת אריכות הימים. במסורת הדאלאי לאמות תרגול הדאקיני הלבנה מאפשר את תרגול הצ׳ולן - תרגול מיצוי התמצית האנרגטית - ולמי שרוצה לתרגל צ׳ולן, זו ההזדמנות לקבל את החניכה.",
    tierId: "LGI_2026_WD",
  },
  {
    title: "חניכת יאמנטקה",
    when: "שבת, 3 באוקטובר, ויום ראשון, 4 באוקטובר | 13:00-15:00",
    body:
      "יאמנטקה, ההיבט הזועם של מנג׳ושרי, בודהה החוכמה, הוא אחד משלושת היידאמים המרכזיים של שושלת הגלוג. החניכה ניתנת בשני מפגשים. למי שמתרגל יאמנטקה (או רוצה לתרגל) ועדיין לא קיבל את החניכה - זה הזמן.",
    tierId: "LGI_2026_YAM",
  },
];

/** `yam` = the Yamantaka-retreat price, shown only when the page is opened through the private link. */
const prices = [
  { tierId: "LGI_2026_WD", title: "חניכת הדאקיני הלבנה", note: "שישי 2.10", price: "150", yam: "108" },
  { tierId: "LGI_2026_YAM", title: "חניכת יאמנטקה", note: "שני מפגשים, 3-4.10", price: "150", yam: "108" },
  { tierId: "LGI_2026_Both", title: "שתי החניכות", note: "שלושת המפגשים", price: "250", yam: "150" },
];

/* ── Component ── */

const LgInitiations2026 = () => {
  const [searchParams] = useSearchParams();
  const { paymentStatus, closePaymentStatus } = usePaymentReturn();
  const testMode = searchParams.get("test") === TEST_KEY;
  const yamLink = searchParams.get("ticket") === YAM_KEY;
  const [modalOpen, setModalOpen] = useState(false);
  const [preselectedTier, setPreselectedTier] = useState<string | undefined>(undefined);
  const [tierGroup, setTierGroup] = useState<string | undefined>(undefined);
  const navigate = useNavigate();
  const config = buildConfig();

  const concluded = hasEnded(eventJsonLd.endDate);

  // A test link opens the form straight away on the hidden test option.
  useEffect(() => {
    if (testMode && !paymentStatus) {
      setPreselectedTier(TEST_TIER_ID);
      setModalOpen(true);
    }
  }, [testMode, paymentStatus]);

  // The Yamantaka-retreat link opens the form on its three options.
  useEffect(() => {
    if (yamLink && !testMode && !paymentStatus) {
      setTierGroup(YAM_GROUP);
      setPreselectedTier(undefined);
      setModalOpen(true);
    }
  }, [yamLink, testMode, paymentStatus]);

  const open = (tierId?: string) => {
    window.gtag?.("event", "registration_modal_open", { page: "white-dakini-yamantaka-initiations" });
    // The private link keeps offering its own prices from every button on the page.
    if (yamLink && !testMode) {
      setTierGroup(YAM_GROUP);
      setPreselectedTier(tierId ? tierId + "_Y" : undefined);
    } else {
      setTierGroup(undefined);
      setPreselectedTier(testMode ? TEST_TIER_ID : tierId && isOpen(tierId) ? tierId : undefined);
    }
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
      onNavCtaClick={concluded ? () => navigate("/events") : () => open()}
      footerText={`© ${new Date().getFullYear()} מאיטרייה סנגהה ישראל. כל הזכויות שמורות.`}
    >
      {/* ── Hero ── */}
      <RetreatHero
        image={yamantakaHero}
        mobileImage={yamantakaHeroMobile}
        imageAlt="תנקה של יאמנטקה אקאווירה"
        title="חניכות עם לאמה גלן מולין"
        subtitle="הדאקיני הלבנה ויאמנטקה"
        accent="אונליין | כולל תרגום עברי בערוץ ייעודי בזום"
        dateLine="2-4 באוקטובר 2026 | 13:00-15:00 שעון ישראל"
        objectPosition="center 30%"
      />

      {concluded && (
        <UpcomingEvents
          lang="he"
          currentUrl="/events/white-dakini-yamantaka-initiations"
          ended={{ eyebrow: "החניכות התקיימו", line: "החניכות התקיימו ב-2-4 באוקטובר 2026 וההרשמה סגורה." }}
        />
      )}

      {/* ── Opening ── */}
      <SectionFrame tone="cream" maxWidth="md" size="md">
        <p className="text-lg md:text-xl leading-[1.9] text-center mb-8" style={{ color: RETREAT_THEME.BODY }}>
          לאמה גלן מולין ייתן בסוף השבוע הנוכחי (2-4 לאוקטובר) שתי חניכות אונליין לחברי מאיטרייה סנגהה ברחבי
          העולם - הזדמנות נדירה לקבל, מהבית, שתי חניכות של טנטרת היוגה העליונה.
        </p>
        {!concluded && (
          <div className="text-center">
            <button type="button" onClick={() => open()} onMouseEnter={hoverIn} onMouseLeave={hoverOut}
              className="px-8 py-3 text-base font-bold rounded-full border-2 transition-all duration-200 hover:scale-105 hover:shadow-md"
              style={goldBtn}>
              להרשמה
            </button>
          </div>
        )}
      </SectionFrame>

      {/* ── The two initiations ── */}
      <SectionFrame tone="stone" maxWidth="xl">
        <SectionTitle className="text-center mb-12">שתי החניכות</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {initiations.map((it) => (
            <article key={it.title} className="rounded-2xl p-7 md:p-9 border shadow-sm flex flex-col"
              style={{ backgroundColor: RETREAT_THEME.CREAM, borderColor: "rgba(201,169,97,0.35)" }}>
              <h3 className="text-2xl md:text-3xl font-bold mb-2"
                style={{ fontFamily: RETREAT_FONTS.serif, color: RETREAT_THEME.DARK }}>
                {it.title}
              </h3>
              <p className="text-base font-semibold mb-5" style={{ color: RETREAT_THEME.GOLD_DARK }}>{it.when}</p>
              <p className="text-base md:text-lg leading-[1.85] flex-1" style={{ color: RETREAT_THEME.BODY }}>{it.body}</p>
            </article>
          ))}
        </div>
        <img src={yamantakaThangka} alt="יאמנטקה אקאווירה" loading="lazy"
          className="mx-auto mt-14 rounded-xl shadow-md w-full max-w-sm" />
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
            bio="דרופון צ׳ונגוואל-לה הוא מדריך הריטריטים של לאמה גלן ומורה מיומן לטנטרה בודהיסטית וטומו. הוא נולד בדרום קוריאה וגדל בארה״ב, ושימש כנזיר במסורת הזן במשך 16 שנה. מאז 2007 הוא מתרגל טנטרה מהאיאנה בהדרכת מורה השורש שלו, לאמה גלן. החניכות מתקיימות בזום של הסנגהה שלו."
            size="md"
            reversed
          />
        </div>
      </SectionFrame>

      {/* ── Prices ── */}
      {!concluded && (
        <SectionFrame tone="stone" maxWidth="lg">
          <SectionTitle className="text-center mb-4">
            {yamLink ? "הרשמה במחיר משתתפי ריטריט יאמנטקה" : "הרשמה ומחירים"}
          </SectionTitle>
          {yamLink ? (
            <div className="max-w-2xl mx-auto mb-10 rounded-2xl px-6 py-4 text-center"
              style={{ backgroundColor: "rgba(201,169,97,0.16)", border: `1px solid ${RETREAT_THEME.GOLD_DARK}` }}>
              <p className="text-lg font-bold" style={{ color: RETREAT_THEME.DARK }}>
                🌺 מחיר מיוחד למשתתפי ריטריט יאמנטקה
              </p>
              <p className="text-base mt-1" style={{ color: RETREAT_THEME.BODY }}>
                108 ש״ח לחניכה, או 150 ש״ח לשתי החניכות - דרך הקישור הזה בלבד.
              </p>
            </div>
          ) : (
            <div className="mb-6" />
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
            {prices.map((p) => {
              const closed = !isOpen(p.tierId);
              return (
                <div key={p.tierId} className="rounded-2xl p-7 text-center bg-white/80 shadow-sm flex flex-col"
                  style={yamLink ? { boxShadow: `0 0 0 2px ${RETREAT_THEME.GOLD_DARK}` } : undefined}>
                  <p className="text-xl font-bold mb-1" style={{ color: RETREAT_THEME.DARK }}>{p.title}</p>
                  <p className="text-sm mb-4" style={{ color: RETREAT_THEME.WARM_GRAY }}>{p.note}</p>
                  {yamLink && (
                    <p className="text-lg line-through mb-0" style={{ color: RETREAT_THEME.WARM_GRAY }}>
                      {p.price} ₪
                    </p>
                  )}
                  <p className="text-4xl font-bold mb-6" style={{ color: RETREAT_THEME.GOLD_DARK }}>
                    {yamLink ? p.yam : p.price} <span className="text-2xl">₪</span>
                  </p>
                  <button type="button" disabled={closed} onClick={() => open(p.tierId)}
                    onMouseEnter={closed ? undefined : hoverIn} onMouseLeave={closed ? undefined : hoverOut}
                    className="mt-auto px-6 py-2.5 text-base font-bold rounded-full border-2 transition-all duration-200 disabled:opacity-40"
                    style={goldBtn}>
                    {closed ? "ההרשמה נסגרה" : "להרשמה"}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="max-w-2xl mx-auto space-y-2 text-center text-base" style={{ color: RETREAT_THEME.WARM_GRAY }}>
            <p>🌸 כולל תרגום עברי בערוץ ייעודי בזום | ההקלטה תהיה זמינה לנרשמים אחרי המפגשים לזמן מוגבל (עד 24 שעות)</p>
            <p>קישור הזום יישלח לנרשמים לפני החניכה הראשונה.</p>
            <p>ההרשמה נפתחת לכל חניכה עד שעה לפני תחילתה. התשלום מתבצע כאן בעמוד, בעמוד סליקה מאובטח.</p>
          </div>
        </SectionFrame>
      )}

      {/* ── Final CTA ── */}
      {!concluded && (
        <FinalCTA
          bgImage={yamantakaHero}
          title="הצטרפו לחניכות"
          body="שתי חניכות של טנטרת היוגה העליונה עם לאמה גלן מולין, 2-4 באוקטובר, 13:00-15:00, אונליין, כולל תרגום עברי בערוץ ייעודי בזום."
          ctaLabel="להרשמה"
          onCtaClick={() => open()}
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

      {!concluded && <UpcomingEvents lang="he" currentUrl="/events/white-dakini-yamantaka-initiations" />}

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
          tierGroup={tierGroup}
          config={config}
          copy={registrationCopy}
        />
      )}

      {!concluded && paymentStatus && (
        <PaymentStatusModal
          status={paymentStatus}
          dir="rtl"
          successTitle="ההרשמה בוצעה בהצלחה!"
          successBody="תודה שנרשמתם לחניכות עם לאמה גלן מולין. אישור הרשמה יישלח אליכם במייל, וקישור הזום לפני החניכה הראשונה."
          successDetails={{
            heading: "פרטי החניכות",
            lines: [
              "הדאקיני הלבנה: שישי 2.10 | יאמנטקה: שבת-ראשון 3-4.10",
              "13:00-15:00 שעון ישראל, בזום, בתרגום לעברית",
            ],
          }}
          failedTitle="אירעה שגיאה בתשלום"
          failedBody="התשלום לא הושלם. ניתן לנסות שוב או ליצור קשר איתנו."
          closeLabel="סגור"
          failedReturnLabel="חזרה לדף החניכות"
          contactEmail={CONTACT_EMAIL}
          onClose={closePaymentStatus}
        />
      )}
    </RetreatLayout>
  );
};

export default LgInitiations2026;
