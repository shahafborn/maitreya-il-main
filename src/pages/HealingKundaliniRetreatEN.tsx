/**
 * Tantric Meditations and Kundalini Practices for Healing - retreat (English)
 * =========================================================================
 * English twin of HealingKundaliniRetreat.tsx: the 3-day Antakarana retreat
 * (Tel Aviv, Wed-Fri 2-4 Dec 2026), live on Zoom for people abroad ($180 USD,
 * recordings of every session included) or in person in the hall in Tel Aviv
 * ($250 USD, added 2026-09-21 by Shahaf). The Hebrew page is dana-based; the
 * English in-person seat is a fixed price like everything else on this page.
 *
 * Language: English (LTR). Same shared components as the Hebrew page; the venue
 * block is replaced by a schedule block (in-person hours + time zones, recordings,
 * link by email), and the "On the practice" block was dropped by Shahaf on 2026-09-15.
 * Content source (vault): teachers-visit-nov-dec-2026/marketing/tel-aviv-landing-page-content.md
 *
 * Registration: RegistrationModal (embedPayment) posts to n8n HKR_EN_Register,
 * which mints a USD Cardcom page per person (HKR pattern, ISOCoinId 2).
 * Hidden test tiers (any amount, one cent by default):
 *   `?test=<TEST_KEY>`          -> Zoom route (Zoom confirmation)
 *   `?test=<TEST_KEY>-inperson` -> in-person route (in-person confirmation)
 * Hidden scholarship options (Zoom by dana: $108 / $54 / any amount) via
 * `?ticket=<SCHOLARSHIP_KEY>`.
 */

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MapPin, MonitorPlay } from "lucide-react";
import { RetreatLayout } from "@/components/retreat/RetreatLayout";
import { RetreatHero } from "@/components/retreat/RetreatHero";
import { AboutSection } from "@/components/retreat/AboutSection";
import { TeacherCard } from "@/components/retreat/TeacherCard";
import { WhatsIncluded } from "@/components/retreat/WhatsIncluded";
import { PricingGrid } from "@/components/retreat/PricingGrid";
import { GalleryCarousel } from "@/components/retreat/GalleryCarousel";
import { VideoSection } from "@/components/retreat/VideoSection";
import { FinalCTA } from "@/components/retreat/FinalCTA";
import { InfoFooter } from "@/components/retreat/InfoFooter";
import { MailingListSignup } from "@/components/retreat/MailingListSignup";
import { UpcomingEvents } from "@/components/retreat/UpcomingEvents";
import { hasEnded } from "@/site/today";
import { RegistrationModal } from "@/components/retreat/RegistrationModal";
import { PaymentStatusModal } from "@/components/retreat/PaymentStatusModal";
import { SectionFrame, SectionTitle, SectionEyebrow } from "@/components/retreat/SectionFrame";
import { RETREAT_THEME, RETREAT_FONTS } from "@/components/retreat/theme";
import { useRetreatSEO } from "@/components/retreat/hooks/useRetreatSEO";
import { useEventJsonLd, type EventJsonLdConfig } from "@/components/retreat/hooks/useEventJsonLd";
import { useRetreatPurchaseTracking } from "@/components/retreat/hooks/useMetaPixelRetreat";
import type { RegistrationConfig, SEOConfig } from "@/components/retreat/types";
import {
  hkrHero,
  hkrHeroMobile,
  lamaGlennPhoto,
  druponPhoto,
  cloudsBg,
  lhamoLatso,
  prayerFlagsBg,
  hkrGalleryImages,
} from "@/assets/healing-kundalini-2026";

/* ── Constants ── */

const N8N_WEBHOOK_URL = "https://tknstk.app.n8n.cloud/webhook/HKR_EN_Register";
/** Test payments: `?test=p2n7vc` preselects a hidden one-cent option (refund from Cardcom). */
const TEST_KEY = "p2n7vc";
const TEST_INPERSON_KEY = "p2n7vc-inperson";
const TEST_TIER_ID = "HKR_EN_2026_Test";
const TEST_INPERSON_TIER_ID = "HKR_EN_2026_TestInPerson";
const ZOOM_TIER_ID = "HKR_EN_2026_Zoom";
const INPERSON_TIER_ID = "HKR_EN_2026_InPerson";
/**
 * Private scholarship link (Shahaf, 2026-09-22): a Zoom place by dana - $108,
 * $54 or any amount. `?ticket=<SCHOLARSHIP_KEY>` opens the form offering the
 * three among themselves; sent to whoever asks for a scholarship.
 */
const SCHOLARSHIP_KEY = "dana-h3w6";
const SCHOLARSHIP_GROUP = "scholarship";

const CONTACT_EMAIL = "maitreyasanghaisrael@gmail.com";

const seo: SEOConfig = {
  title:
    "Tantric Meditations and Kundalini Practices for Healing with Lama Glenn | December 2-4, 2026 | Maitreya Sangha Israel",
  description:
    "Three days of teaching and practice of the healing methods of Tantric Buddhism with Lama Glenn Mullin, including the Palden Lhamo empowerment. In person in Tel Aviv or live on Zoom, December 2-4, 2026.",
  keywords:
    "retreat, healing, kundalini, tummo, Buddhism, tantra, Lama Glenn, Palden Lhamo, meditation, Zoom, Maitreya Sangha",
  url: "https://maitreya.org.il/events/en/healing-kundalini-retreat",
  ogImage: "https://maitreya.org.il/og-healing-kundalini-retreat.jpg", // the Hebrew card is visual only
  locale: "en_US",
};

/**
 * The machine-readable twin of the page. Since 2026-09-21 this page sells BOTH
 * a seat in the hall in Tel Aviv and a Zoom seat, so the attendance mode is
 * mixed and the location carries the venue and the virtual room together.
 * Hours from the Hebrew page's daily schedule.
 */
const eventJsonLd: EventJsonLdConfig = {
  name: "Tantric Meditations and Kundalini Practices for Healing",
  description: seo.description,
  url: seo.url,
  image: seo.ogImage,
  startDate: "2026-12-02T09:30:00+02:00",
  endDate: "2026-12-04T18:00:00+02:00",
  place: {
    kind: "mixed",
    url: seo.url,
    name: "Antakarana Center",
    street: "29 Yitzhak Sadeh St",
    locality: "Tel Aviv",
  },
  performers: ["Lama Glenn Mullin", "Drupon Chongwol-la"],
  currency: "USD",
  // validFrom = the day each option went live with its registration open.
  offers: [
    { name: "Zoom Participation", price: 180, validFrom: "2026-09-11" },
    { name: "In Person, Tel Aviv", price: 250, validFrom: "2026-09-21" },
  ],
  inLanguage: "en",
};

// Exported for src/test/en-scholarship-link.test.tsx.
export const registrationConfig: RegistrationConfig = {
  title: "Retreat Registration",
  subtitle: "Tantric Meditations and Kundalini Practices for Healing | December 2-4, 2026",
  webhookUrl: N8N_WEBHOOK_URL,
  contentName: "Healing Kundalini Retreat 2026 EN",
  currency: "USD",
  lang: "en",
  dir: "ltr",
  // Tier ids are the codes n8n charges by; amounts live in HKR_EN_Register.
  tiers: [
    {
      id: ZOOM_TIER_ID,
      title: "Zoom Participation",
      note: "All three days live, plus the recordings",
      priceDisplay: "180",
      priceValue: 180,
      currencySymbol: "$",
      perPersonLabel: "per person",
    },
    {
      id: INPERSON_TIER_ID,
      title: "In Person, Tel Aviv",
      note: "All three days in the hall at the Antakarana Center, plus the recordings",
      priceDisplay: "250",
      priceValue: 250,
      currencySymbol: "$",
      badge: "In Person in Tel Aviv",
      perPersonLabel: "per person",
    },
    // The scholarship link's three options (Zoom). Charged by HKR_EN_Register;
    // the paid flow treats them as Zoom places.
    {
      id: "HKR_EN_2026_Dana108",
      title: "Dana",
      note: "Scholarship place | all three days live on Zoom, plus the recordings",
      hidden: true,
      group: SCHOLARSHIP_GROUP,
      priceDisplay: "108",
      priceValue: 108,
      currencySymbol: "$",
    },
    {
      id: "HKR_EN_2026_Dana54",
      title: "Dana",
      note: "Scholarship place | all three days live on Zoom, plus the recordings",
      hidden: true,
      group: SCHOLARSHIP_GROUP,
      priceDisplay: "54",
      priceValue: 54,
      currencySymbol: "$",
    },
    {
      id: "HKR_EN_2026_DanaOpen",
      title: "Dana of any amount you choose",
      note: "Scholarship place | all three days live on Zoom, plus the recordings",
      hidden: true,
      group: SCHOLARSHIP_GROUP,
      priceDisplay: "",
      priceValue: 0,
      currencySymbol: "$",
      openAmount: true,
      openAmountMin: 1,
      openAmountMax: 20000,
      openAmountLabel: "Amount (USD)",
      openAmountNote: "Any amount from $1.",
      openAmountError: "Enter an amount between $1 and $20,000",
    },
    {
      id: TEST_TIER_ID,
      title: "Payment test",
      note: "Any amount, pre-filled with $0.01",
      hidden: true,
      priceDisplay: "0.01",
      priceValue: 0.01,
      currencySymbol: "$",
      // Testers abroad prove the real card path on their own card, so the charge has
      // to be trivial and refundable. openAmountMin below 1 also switches the field to
      // decimals (wholeAmounts = amountMin >= 1), which whole-shekel dana tiers rely on.
      openAmount: true,
      openAmountMin: 0.01,
      openAmountMax: 100,
      openAmountDefault: 0.01,
      openAmountLabel: "Test amount (USD)",
      openAmountNote: "Anything from $0.01. Refund it from Cardcom afterwards.",
      openAmountError: "Enter an amount between $0.01 and $100",
    },
    {
      // The in-person twin of the test ticket: same open amount, but n8n treats it
      // as an in-person seat so the paid flow sends the in-person confirmation.
      id: TEST_INPERSON_TIER_ID,
      title: "Payment test (in person)",
      note: "Any amount, pre-filled with $0.01",
      hidden: true,
      priceDisplay: "0.01",
      priceValue: 0.01,
      currencySymbol: "$",
      openAmount: true,
      openAmountMin: 0.01,
      openAmountMax: 100,
      openAmountDefault: 0.01,
      openAmountLabel: "Test amount (USD)",
      openAmountNote: "Anything from $0.01. Refund it from Cardcom afterwards.",
      openAmountError: "Enter an amount between $0.01 and $100",
    },
  ],
  showTierSelect: true,
  tierSelectLabel: "How will you join?",
  tierGroups: {
    [SCHOLARSHIP_GROUP]: {
      selectLabel: "Your dana",
      heading: "Scholarship place - live on Zoom",
      note: "We never want the cost to keep anyone from the teachings. This place includes all three days live on Zoom and all the recordings. Give what feels right for you.",
    },
  },
  termsUrl: "https://maitreya.org.il/events/online-terms",
  askGender: false,
  askFoodPref: false,
  askPrevExp: true,
  askCity: false,
  askRideShare: false,
  askPhone: true,
  phoneInternational: true,
  askCountry: true,
  storagePrefix: "hkr26-en",
  extraPayload: { source: "healing-kundalini-retreat-en" },
  embedPayment: true,
};

const registrationCopy = {
  tierSelectPlaceholder: "Choose",
  firstNameLabel: "First Name",
  firstNamePlaceholder: "First name",
  lastNameLabel: "Last Name",
  lastNamePlaceholder: "Last name",
  emailLabel: "Email",
  phoneLabel: "Phone (digits only, including country code)",
  phonePlaceholder: "15551234567",
  genderLabel: "Gender",
  genderMale: "Male",
  genderFemale: "Female",
  foodLabel: "Food Preference",
  foodRegular: "Regular",
  foodVegetarian: "Vegetarian",
  foodVegan: "Vegan",
  foodPlaceholder: "Choose",
  prevExpLabel: "Previous experience with Buddhist studies",
  prevExpPlaceholder: "Choose",
  prevExpExtensive: "Extensive",
  prevExpIntermediate: "Intermediate",
  prevExpLimited: "Limited",
  prevExpNone: "None",
  messageLabel: "Message to organizers",
  messagePlaceholder: "Anything you'd like to share with us?",
  countryLabel: "Country",
  countryPlaceholder: "Your country of residence",
  termsPrefix: "I agree to the",
  termsLinkLabel: "retreat terms and conditions",
  termsSuffix: "and consent to receive updates from Maitreya Sangha Israel.",
  submitLabel: "Register & Proceed to Payment",
  submittingLabel: "Submitting...",
  submitFootnote:
    "Payment is completed here on the page, on a secure checkout. Registration is confirmed upon payment.",
  paymentTitle: "Payment",
  paymentNote:
    "Payment is collected by Maitreya Sangha Israel (a registered non-profit) through Cardcom, in US dollars, by credit card. A receipt is sent to the email you entered.",
  errTier: "Please select an option",
  errFname: "First name is required",
  errLname: "Last name is required",
  errEmail: "Email is required",
  errEmailInvalid: "Please enter a valid email address",
  errEmailTooLong: "That address is too long for our payment provider - please use a shorter one",
  errPhone: "Phone is required",
  errPhoneInvalid: "Please enter a valid phone number",
  errGender: "Please select gender",
  errFood: "Please select food preference",
  errPrevExp: "Please select your experience level",
  errCountry: "Country is required",
  errConfirmed: "You must agree to the terms",
  errServer: "Server error, please try again",
  errNoPaymentUrl: "No payment link received",
  errGeneric: "Error submitting the form",
};

// Same hours on all three days (Shahaf, 2026-09-15): two sessions a day, shown per
// time zone because most participants are abroad. Israel is UTC+2 in December.
const sessionRows = [
  { zone: "New York (EST)", morning: "2:30-5:00 AM", afternoon: "7:00-11:00 AM" },
  { zone: "London (GMT)", morning: "7:30-10:00 AM", afternoon: "12:00-4:00 PM" },
  { zone: "Israel (IST)", morning: "9:30 AM-12:00 PM", afternoon: "2:00-6:00 PM" },
  { zone: "Korea (KST)", morning: "4:30-7:00 PM", afternoon: "9:00 PM-1:00 AM" },
];

const whatsIncluded = [
  "Three days of teaching and practice with Lama Glenn Mullin, in person in Tel Aviv or live on Zoom",
  "The Palden Lhamo empowerment",
  "Practical guidance for the healing and kundalini (tummo) practices",
  "Recordings of all sessions, to watch or review in your own time",
  "Live translation on Zoom into Russian, Spanish and Portuguese",
  "Opportunity to continue practicing in a weekly practice group after the retreat",
];

/* ── Component ── */

const HealingKundaliniRetreatEN = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paymentStatus = searchParams.get("payment") as "success" | "failed" | null;
  const testParam = searchParams.get("test");
  const testTierId =
    testParam === TEST_KEY ? TEST_TIER_ID : testParam === TEST_INPERSON_KEY ? TEST_INPERSON_TIER_ID : undefined;
  const testMode = testTierId !== undefined;
  const scholarshipLink = searchParams.get("ticket") === SCHOLARSHIP_KEY;
  /** Set while the form offers the scholarship options instead of the public ones. */
  const [tierGroup, setTierGroup] = useState<string | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [preselectedTier, setPreselectedTier] = useState<string | undefined>(undefined);
  const ctaSectionRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  /* The retreat's own end date, the one already declared to Google above,
     decides whether this page still sells. Nothing to switch off by hand. */
  const concluded = hasEnded(eventJsonLd.endDate);

  useRetreatSEO(seo);
  useEventJsonLd(eventJsonLd);
  // Purchase pixel: same purchase-<reg_token> id as the server-side event from n8n (deduped).
  useRetreatPurchaseTracking({
    paymentStatus,
    contentName: registrationConfig.contentName,
    storagePrefix: registrationConfig.storagePrefix,
  });

  // A test link opens the form straight away, locked on its hidden test option.
  useEffect(() => {
    if (testTierId && !paymentStatus) {
      setPreselectedTier(testTierId);
      setModalOpen(true);
    }
  }, [testTierId, paymentStatus]);

  // The scholarship link opens the form on its three dana options.
  useEffect(() => {
    if (scholarshipLink && !testMode && !paymentStatus) {
      setTierGroup(SCHOLARSHIP_GROUP);
      setPreselectedTier(undefined);
      setModalOpen(true);
    }
  }, [scholarshipLink, testMode, paymentStatus]);

  // The payment happens inside an iframe on this page, so Cardcom's redirect
  // back lands inside that frame. Same origin, so we climb out.
  useEffect(() => {
    if (!paymentStatus) return;
    if (window.top && window.top !== window.self) {
      window.top.location.href = window.location.href;
    }
  }, [paymentStatus]);

  const open = (tierId?: string) => {
    window.gtag?.("event", "registration_modal_open", { page: "healing-kundalini-retreat-en" });
    // Test links always lock on their test ticket. A click on a pricing card
    // preselects that option; the generic buttons open on "Choose".
    setPreselectedTier(testMode ? testTierId : tierId);
    // The scholarship link's generic buttons reopen its dana options; a
    // pricing card still opens that card's option.
    setTierGroup(scholarshipLink && !testMode && !tierId ? SCHOLARSHIP_GROUP : undefined);
    setModalOpen(true);
  };

  const closePaymentStatus = () => setSearchParams({}, { replace: true });

  return (
    <RetreatLayout
      lang="en"
      dir="ltr"
      seo={seo}
      navCtaLabel={concluded ? "Events" : "Register"}
      onNavCtaClick={concluded ? () => navigate("/en/events") : () => open()}
      footerText={`© ${new Date().getFullYear()} Maitreya Sangha Israel. All rights reserved.`}
    >
      <RetreatHero
        image={hkrHero}
        mobileImage={hkrHeroMobile}
        imageAlt="Tibetan mural of yogis in meditation"
        title="Tantric Meditations and Kundalini Practices for Healing"
        subtitle="Three days of teaching and practice of the healing methods of Tantric Buddhism, including the Palden Lhamo empowerment"
        accent="with Lama Glenn"
        dateLine="December 2-4, 2026 | Antakarana Center, Tel Aviv | In Person or Live on Zoom"
        objectPosition="62% 40%"
      />

      {concluded && (
        <UpcomingEvents
          lang="en"
          currentUrl="/events/en/healing-kundalini-retreat"
          ended={{
            eyebrow: "This retreat has ended",
            line: "It took place in December 2026 and registration is closed.",
          }}
        />
      )}

      <AboutSection
        eyebrow="Healing Body and Mind"
        softBgImage={cloudsBg}
        ctaLabel={concluded ? undefined : "Register for the Retreat"}
        onCtaClick={concluded ? undefined : () => open()}
        paragraphs={[
          "The Buddhist tradition is rich in knowledge and in profound meditation practices for healing body and mind. Buddhism recognizes the deep relationship between body and mind, and between a person and their environment - and the ways these inter-relations contribute to health or to illness.",
          "Over the generations in Asia, practitioners, physicians and healers have used the Buddhist healing methods to heal themselves and others: healing the mind of negative emotions and harmful tendencies, and healing the body through deep yogic work with the body's inner energetic systems.",
          "In Tibetan Buddhism, many traditions of these yogic practices are still taught today. They are known as Tummo or Chandali. In these practices one learns to work directly with the energies of the body (the prana, or chi) and with its essences (the bindu, or ojas): to balance and purify the nervous system and the hormonal system, to release patterns that do not serve us, and to reach deep, healing states of mind.",
          "In this retreat Lama Glenn will teach the yogic and meditative practices of Buddhist healing, as they have been taught for more than a thousand years in the Tibetan tradition and especially in the tradition of the Dalai Lamas. The three days will include teaching, practical guidance, guided practice, and the Palden Lhamo empowerment.",
          "The retreat is suitable for beginners and advanced practitioners alike, and is taught in English. You can join in person at the Antakarana Center in Tel Aviv, or live on Zoom from anywhere in the world.",
        ]}
      />

      {/* Palden Lhamo empowerment. Her oracle lake leads the block. */}
      <SectionFrame tone="stone" size="md" maxWidth="lg">
        <div className="max-w-3xl mx-auto">
          <figure className="mb-10">
            <img
              src={lhamoLatso}
              alt="Lhamo Latso lake in Tibet"
              className="w-full block rounded-lg shadow-xl"
            />
            <figcaption
              className="mt-4 text-sm text-center leading-relaxed"
              style={{ color: RETREAT_THEME.WARM_GRAY, fontFamily: RETREAT_FONTS.sans }}
            >
              Lhamo Latso - the sacred lake of Palden Lhamo in Tibet, known for
              the prophetic visions seen in its waters
            </figcaption>
          </figure>
          <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ fontFamily: RETREAT_FONTS.serif }}>
            Palden Lhamo Empowerment and Practice
          </h2>
          <p className="text-lg font-semibold mb-6" style={{ color: RETREAT_THEME.GOLD_DARK }}>
            A practice for developing confidence and stability in everyday life
          </p>
          <div
            className="space-y-5 text-lg leading-[1.9]"
            style={{ color: RETREAT_THEME.BODY, fontFamily: RETREAT_FONTS.sans }}
          >
            <p>
              In the retreat Lama Glenn will teach the practice of Palden Lhamo -
              a practice of using feminine energy and wisdom to create confidence
              and stability in everyday life.
            </p>
            <p>
              In the world of Tantric Buddhism, using the feminine energy to
              attain stability and confidence in the mundane world is considered
              a condition for meditation practice that bears fruit. In our world,
              full of complexity and challenge, the ability to meet everyday
              reality with openness and ease is an important part of what allows
              meditation to ripen. Palden Lhamo is one of the principal Dharma
              protectors of the lineage of the Dalai Lamas, and her practice has
              been passed down in the lineage since the days of the First Dalai
              Lama.
            </p>
            <p>
              The mantra of Palden Lhamo, known as "the Seven Jo", is especially
              powerful for attaining health, abundance and happiness while
              progressing on the path to enlightenment.
            </p>
            <p>During the retreat Lama Glenn will give the Palden Lhamo empowerment.</p>
          </div>
        </div>
      </SectionFrame>

      <SectionFrame tone="stone" maxWidth="xl">
        <div
          className="h-px w-64 md:w-80 mx-auto -mt-16 md:-mt-24 mb-16 md:mb-24"
          style={{ backgroundColor: RETREAT_THEME.GOLD }}
          aria-hidden
        />
        <SectionTitle className="text-center mb-16">The Teachers</SectionTitle>
        <TeacherCard
          name="Lama Glenn Mullin"
          photo={lamaGlennPhoto}
          bio="Lama Glenn is an experienced and beloved teacher of Buddhist Tantra and Tummo. He is a direct student of His Holiness the 14th Dalai Lama, and his root teachers are Ling Rinpoche VI and Trijang Rinpoche - the personal root teachers of the 14th Dalai Lama. Lama Glenn has been teaching Tibetan Buddhism for over thirty years to thousands of students worldwide. He is a renowned scholar, author, and translator - having written over 30 books on Tibetan Buddhism and Buddhist Tantra published around the world."
          size="lg"
        />
        <TeacherCard
          name="Drupon Chongwol-la"
          photo={druponPhoto}
          bio="Drupon Chongwol-la is Lama Glenn's retreat guide and a skilled teacher of Buddhist Tantra and Tummo. Born in South Korea and raised in the USA, he served as a Zen monk for 16 years. Since 2007, he has been practicing Mahayana Tantra under the guidance of his root teacher, Lama Glenn. Drupon Chongwol-la will accompany the continued practice after the retreat, and those interested may join the weekly practice group."
          size="md"
          reversed
        />
      </SectionFrame>

      {/* ── Schedule: in person in Tel Aviv, or one timetable read in your own time zone ── */}
      <SectionFrame tone="cream" maxWidth="md">
        <SectionEyebrow className="text-center block mb-10">Retreat Schedule</SectionEyebrow>
        <p className="text-center text-lg mb-6 leading-[1.8]" style={{ color: RETREAT_THEME.BODY }}>
          Three days of teaching, guided practice and practical guidance, in the
          hall in Tel Aviv and streamed live on Zoom, with a long break between
          the two daily sessions and short breaks during them. The Palden Lhamo
          empowerment takes place during the retreat.
        </p>
        <p className="text-center text-lg font-semibold mb-8" style={{ fontFamily: RETREAT_FONTS.serif }}>
          Wednesday to Friday, December 2-4, 2026 - the same schedule on all three days
        </p>

        <div className="max-w-lg mx-auto text-center mb-10" style={{ color: RETREAT_THEME.BODY }}>
          <MapPin className="mx-auto mb-3 h-8 w-8" style={{ color: RETREAT_THEME.GOLD }} />
          <h3 className="font-semibold text-lg mb-2" style={{ fontFamily: RETREAT_FONTS.serif }}>
            In person in Tel Aviv
          </h3>
          <p className="text-lg leading-relaxed">
            Antakarana Center, 29 Yitzhak Sadeh St, Tel Aviv - central and easy
            to reach. Sessions run 9:30 AM-12:00 PM and 2:00-6:00 PM Israel time,
            with a two-hour lunch break; Friday ends at 5:00 PM. An urban
            retreat, without lodging: you arrive in the morning and go home in
            the evening.
          </p>
        </div>

        <h3 className="font-semibold text-lg mb-4 text-center" style={{ fontFamily: RETREAT_FONTS.serif }}>
          On Zoom, in your time zone
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full max-w-2xl mx-auto text-base border-collapse">
            <thead>
              <tr style={{ color: RETREAT_THEME.GOLD_DARK }}>
                <th className="text-left py-2 pr-4 font-semibold">Your time zone</th>
                <th className="text-left py-2 pr-4 font-semibold">Morning session</th>
                <th className="text-left py-2 font-semibold">Afternoon session</th>
              </tr>
            </thead>
            <tbody style={{ color: RETREAT_THEME.BODY }}>
              {sessionRows.map((r) => (
                <tr key={r.zone} className="border-t" style={{ borderColor: "rgba(201,169,97,0.35)" }}>
                  <td className="py-3 pr-4 font-semibold whitespace-nowrap">{r.zone}</td>
                  <td className="py-3 pr-4 whitespace-nowrap">{r.morning}</td>
                  <td className="py-3 whitespace-nowrap">{r.afternoon}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-center mt-3" style={{ color: RETREAT_THEME.WARM_GRAY }}>
          Korea: the afternoon session runs into the early hours of the next day.
        </p>

        <div className="max-w-lg mx-auto space-y-6 text-center mt-12" style={{ color: RETREAT_THEME.BODY }}>
          <div>
            <MonitorPlay className="mx-auto mb-3 h-8 w-8" style={{ color: RETREAT_THEME.GOLD }} />
            <p className="text-lg leading-relaxed">
              All sessions are recorded and made available to registered
              participants, so you can watch or review them in your own time -
              and catch up on sessions that fall at night where you are.
            </p>
          </div>
          <p className="text-base" style={{ color: RETREAT_THEME.WARM_GRAY }}>
            The retreat is taught in English, with live translation on Zoom
            into Russian, Spanish and Portuguese. It is suitable for beginners
            and advanced practitioners alike.
          </p>
          <p className="text-base" style={{ color: RETREAT_THEME.WARM_GRAY }}>
            A detailed schedule will be sent before the retreat, with the Zoom
            link for online participants and directions for those joining in
            Tel Aviv.
          </p>
          <p className="text-sm" style={{ color: RETREAT_THEME.WARM_GRAY }}>
            * The schedule shown is approximate. The final schedule will be sent
            to participants before the retreat.
          </p>
        </div>
      </SectionFrame>

      <WhatsIncluded eyebrow="What's Included" items={whatsIncluded} />

      {/* A price for something nobody can join any more is noise on the page. */}
      {!concluded && (
      <div ref={ctaSectionRef}>
        <PricingGrid
          title="Registration"
          subtitle="Join us in Tel Aviv, or via Zoom from anywhere in the world"
          tiers={registrationConfig.tiers.filter((t) => !t.hidden)}
          ctaLabel="Register Now"
          onSelect={(tierId) => open(tierId)}
          notes={[
            "The in-person seat covers all sessions in the hall at the Antakarana Center and the recordings. No meals are served: there is a two-hour lunch break, a kitchenette on site, and a coffee and tea corner throughout the retreat.",
            "Secure payment in US dollars, processed via Cardcom.",
            "We want everyone who is interested to be able to participate and benefit from the Dharma. If you would like to join but cannot afford the registration fee due to life circumstances, please contact us at maitreyasanghaisrael@gmail.com",
          ]}
        />
      </div>
      )}

      <GalleryCarousel
        title="From Our Retreats"
        images={hkrGalleryImages}
        alt="From previous Maitreya Sangha retreats"
      />

      <VideoSection
        title="Meet Lama Glenn Mullin"
        subtitle="Lama Glenn on Buddhist Tantra in everyday life"
        embedUrl="https://www.youtube.com/embed/r6IniYsqRcw?start=1"
        iframeTitle="Lama Glenn Mullin - Buddhist Tantra"
      />

      {!concluded && (
      <FinalCTA
        bgImage={prayerFlagsBg}
        title="Join the Retreat"
        body="Three days of deep teaching and practice of the healing methods of Tantric Buddhism, with the Palden Lhamo empowerment - in person in Tel Aviv or live on Zoom"
        ctaLabel="Register for the Retreat"
        onCtaClick={() => open()}
        footnote="Recordings included"
      />
      )}

      <InfoFooter
        contact={{
          heading: "Contact Us",
          label: "For questions and inquiries:",
          email: CONTACT_EMAIL,
        }}
      />

      {/* ── Other Events ── from content/en/events, so it can never point at
           a retreat that has already happened. ── */}
      {!concluded && <UpcomingEvents lang="en" currentUrl="/events/en/healing-kundalini-retreat" />}

      <MailingListSignup
        heading="Stay Updated"
        subheading="Sign up for our mailing list to receive updates about retreats, workshops, and events"
        placeholder="Email address"
        ctaLabel="Subscribe"
        successMessage="Thank you! You've been subscribed successfully"
        errorMessage="Error subscribing, please try again"
        language="en"
        tag="English"
      />

      {/* Not rendered at all once the retreat is over, so no deep link or
          stale payment return can open the form. */}
      {!concluded && (
        <RegistrationModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          preselectedTierId={preselectedTier}
          tierGroup={tierGroup}
          config={registrationConfig}
          copy={registrationCopy}
        />
      )}

      {!concluded && paymentStatus && (
        <PaymentStatusModal
          status={paymentStatus}
          dir="ltr"
          successTitle="Registration Successful!"
          successBody="Thank you for registering for the Tantric Meditations and Kundalini Practices for Healing retreat. A confirmation email with details will be sent to you shortly."
          successDetails={{
            heading: "Retreat Details",
            lines: ["December 2-4, 2026", "Antakarana Center, Tel Aviv, or live on Zoom"],
          }}
          failedTitle="Payment Error"
          failedBody="The payment was not completed. You can try again or contact us."
          closeLabel="Close"
          failedReturnLabel="Back to Retreat Page"
          contactEmail={CONTACT_EMAIL}
          onClose={closePaymentStatus}
        />
      )}
    </RetreatLayout>
  );
};

export default HealingKundaliniRetreatEN;
