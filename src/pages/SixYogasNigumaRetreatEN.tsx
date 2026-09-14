/**
 * The Six Yogas of Niguma - Ein Gedi retreat (English)
 * ====================================================
 * English twin of SixYogasNigumaRetreat.tsx (6-12 Dec 2026, Hanukkah), for
 * people abroad. Two ways in: a bed in a shared 4-person room at Ein Gedi Field
 * School with full board ($1,200), or live on Zoom ($360). Both include the
 * Vajrayogini empowerment and recordings of every session.
 *
 * Language: English (LTR). Composed from the shared retreat components, the way
 * the June 2026 English page (EinGediHealingRetreatEN) was; the Hebrew page is a
 * self-contained clone and could not be translated in place.
 * Content source (vault): teachers-visit-nov-dec-2026/marketing/ein-gedi-landing-page-content.md
 *
 * Registration: RegistrationModal (embedPayment) posts to n8n EGN_EN_Register,
 * which mints a USD Cardcom page per person (EGN pattern, ISOCoinId 2). Tier ids
 * are the codes n8n charges by - the page never sends an amount. Gender and food
 * preference are asked only on the room tier (residentialTierIds).
 * Hidden test tier ($1) via ?test=<TEST_KEY>.
 */

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MonitorPlay } from "lucide-react";
import { RetreatLayout } from "@/components/retreat/RetreatLayout";
import { RetreatHero } from "@/components/retreat/RetreatHero";
import { AboutSection } from "@/components/retreat/AboutSection";
import { TeacherCard } from "@/components/retreat/TeacherCard";
import { VenueSection } from "@/components/retreat/VenueSection";
import { WhatsIncluded } from "@/components/retreat/WhatsIncluded";
import { PricingGrid } from "@/components/retreat/PricingGrid";
import { GalleryCarousel } from "@/components/retreat/GalleryCarousel";
import { VideoSection } from "@/components/retreat/VideoSection";
import { FinalCTA } from "@/components/retreat/FinalCTA";
import { InfoFooter } from "@/components/retreat/InfoFooter";
import { MailingListSignup } from "@/components/retreat/MailingListSignup";
import { OtherEvents } from "@/components/retreat/OtherEvents";
import { RegistrationModal } from "@/components/retreat/RegistrationModal";
import { PaymentStatusModal } from "@/components/retreat/PaymentStatusModal";
import { SectionFrame, SectionTitle, SectionEyebrow } from "@/components/retreat/SectionFrame";
import { RETREAT_THEME, RETREAT_FONTS } from "@/components/retreat/theme";
import { useRetreatSEO } from "@/components/retreat/hooks/useRetreatSEO";
import { useRetreatPurchaseTracking } from "@/components/retreat/hooks/useMetaPixelRetreat";
import type { RegistrationConfig, SEOConfig } from "@/components/retreat/types";
import {
  heroNiguma,
  heroNigumaMobile,
  nigumaMural,
  vajrayoginiThangka,
  lamaGlennPhoto,
  druponPhoto,
} from "@/assets/healing-kundalini-2026";
import {
  venuePhoto1,
  venuePhoto2,
  venuePhoto3,
  venuePhoto4,
  einGediGalleryImages,
} from "@/assets/ein-gedi-retreat";

/* ── Constants ── */

const N8N_WEBHOOK_URL = "https://tknstk.app.n8n.cloud/webhook/EGN_EN_Register";
/** Test payments: `?test=k4t9wz` preselects a hidden $1 option (refund from Cardcom). */
const TEST_KEY = "k4t9wz";
const TEST_TIER_ID = "EGN_EN_2026_Test";
const ROOM_TIER_ID = "EGN_EN_2026_Room";
const ZOOM_TIER_ID = "EGN_EN_2026_Zoom";

const CONTACT_EMAIL = "maitreyasanghaisrael@gmail.com";

const seo: SEOConfig = {
  title:
    "The Six Yogas of Niguma: Retreat with Lama Glenn in Ein Gedi | December 6-12, 2026 | Maitreya Sangha Israel",
  description:
    "Six days of teaching and practice of the Six Yogas of Niguma - the sublime path to enlightenment of the wisdom dakini - with Lama Glenn Mullin, including the Vajrayogini empowerment. Ein Gedi, Dead Sea, or live on Zoom. December 6-12, 2026.",
  keywords:
    "Six Yogas of Niguma, Niguma, tummo, Vajrayogini, retreat, Ein Gedi, Dead Sea, Hanukkah, Lama Glenn, Tibetan Buddhism, tantra, Zoom, Maitreya Sangha",
  url: "https://maitreya.org.il/events/en/six-yogas-niguma-retreat",
  ogImage: "https://maitreya.org.il/og-six-yogas-niguma.jpg", // the Hebrew card is visual only
  locale: "en_US",
};

const registrationConfig: RegistrationConfig = {
  title: "Retreat Registration",
  subtitle: "The Six Yogas of Niguma | December 6-12, 2026",
  webhookUrl: N8N_WEBHOOK_URL,
  contentName: "Six Yogas of Niguma Retreat EN",
  currency: "USD",
  lang: "en",
  dir: "ltr",
  // Tier ids are the codes n8n charges by; amounts live in EGN_EN_Register.
  tiers: [
    {
      id: ROOM_TIER_ID,
      title: "Shared Room (4 beds), Full Board",
      note: "One bed per person | 6 nights, all meals and all sessions",
      priceDisplay: "1,200",
      priceValue: 1200,
      currencySymbol: "$",
      badge: "In Person at Ein Gedi",
      perPersonLabel: "per person | all inclusive",
      footnote: "Very few beds available",
    },
    {
      id: ZOOM_TIER_ID,
      title: "Zoom Participation",
      note: "Every session live from Ein Gedi, plus the recordings",
      priceDisplay: "360",
      priceValue: 360,
      currencySymbol: "$",
      perPersonLabel: "per person",
    },
    {
      id: TEST_TIER_ID,
      title: "Payment test",
      note: "$1",
      hidden: true,
      priceDisplay: "1",
      priceValue: 1,
      currencySymbol: "$",
    },
  ],
  showTierSelect: true,
  tierSelectLabel: "How will you join?",
  termsUrl: "https://maitreya.org.il/events/ein-gedi-healing-retreat/terms",
  askGender: true,
  askFoodPref: true,
  residentialTierIds: [ROOM_TIER_ID],
  askPrevExp: true,
  askCity: false,
  askRideShare: false,
  askPhone: true,
  phoneInternational: true,
  askCountry: true,
  storagePrefix: "egn26-en",
  extraPayload: { source: "six-yogas-niguma-retreat-en" },
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
  genderLabel: "Gender (rooms are shared by gender)",
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

const whatsIncluded = [
  "Six days of teaching and practice with Lama Glenn Mullin, in Ein Gedi or live on Zoom",
  "The Vajrayogini empowerment",
  "Recordings of all sessions, to watch or review in your own time",
  "Yoga and meditation sessions",
  "Teaching in English (with Hebrew translation for local participants)",
  "For guests at Ein Gedi: 6 nights in a shared 4-bed room and full board - breakfast, lunch and dinner",
];

const sixYogas = [
  {
    title: "The Yoga of Inner Heat - Tummo",
    description:
      "Reaching deep, healing states of mind through the fire energy of the kundalini.",
  },
  {
    title: "The Yogas of the Illusory Body and Clear Light",
    description:
      "Meeting the deep nature of the body and the physical world, and the deepest levels of the mind.",
  },
  {
    title: "The Yoga of Dream",
    description: "Using the process of lucid dreaming to develop the mind.",
  },
  {
    title: "The Yogas of Transference (Phowa) and the Intermediate State (Bardo)",
    description:
      "Meeting the process of death and rebirth as a path to liberation and enlightenment.",
  },
];

const scheduleBlocks = [
  {
    days: "Sunday, December 6",
    practice: "Arrival, settling in, and the start of the Six Yogas teachings",
    times: "Arrival: 2:00 PM | Afternoon session: 2:30-6:15 PM",
  },
  {
    days: "Monday to Friday, December 7-11",
    practice: "The Six Yogas of Niguma",
    times: "Morning: 9:30 AM-12:30 PM | Afternoon: 2:30-6:15 PM",
  },
  {
    days: "Saturday, December 12",
    practice: "Closing",
    times: "Morning: 9:30 AM-12:30 PM | Retreat ends: 3:00 PM",
  },
];

/* ── Component ── */

const SixYogasNigumaRetreatEN = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paymentStatus = searchParams.get("payment") as "success" | "failed" | null;
  const testMode = searchParams.get("test") === TEST_KEY;
  const [modalOpen, setModalOpen] = useState(false);
  const [preselectedTier, setPreselectedTier] = useState<string | undefined>(undefined);
  const ctaSectionRef = useRef<HTMLDivElement>(null);

  useRetreatSEO(seo);
  // Purchase pixel: same purchase-<reg_token> id as the server-side event from n8n (deduped).
  useRetreatPurchaseTracking({
    paymentStatus,
    contentName: registrationConfig.contentName,
    storagePrefix: registrationConfig.storagePrefix,
  });

  // The test link opens the form straight away, on the hidden test option.
  useEffect(() => {
    if (testMode && !paymentStatus) {
      setPreselectedTier(TEST_TIER_ID);
      setModalOpen(true);
    }
  }, [testMode, paymentStatus]);

  // The payment happens inside an iframe on this page, so Cardcom's redirect
  // back lands inside that frame. Same origin, so we climb out.
  useEffect(() => {
    if (!paymentStatus) return;
    if (window.top && window.top !== window.self) {
      window.top.location.href = window.location.href;
    }
  }, [paymentStatus]);

  const open = (tierId?: string) => {
    window.gtag?.("event", "registration_modal_open", { page: "six-yogas-niguma-retreat-en" });
    setPreselectedTier(testMode ? TEST_TIER_ID : tierId);
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
      lang="en"
      dir="ltr"
      seo={seo}
      navCtaLabel="Register"
      onNavCtaClick={() => open()}
      footerText={`© ${new Date().getFullYear()} Maitreya Sangha Israel. All rights reserved.`}
    >
      {/* ── Hero ── */}
      <RetreatHero
        image={heroNiguma}
        mobileImage={heroNigumaMobile}
        imageAlt="Niguma - Tibetan painting"
        title="The Six Yogas of Niguma"
        subtitle="The sublime path to enlightenment of the wisdom dakini | Includes the Vajrayogini empowerment"
        accent="with Lama Glenn Mullin"
        dateLine="December 6-12, 2026, during Hanukkah | Ein Gedi Field School, Dead Sea | In person or live on Zoom"
        objectPosition="center 32%"
      />

      {/* ── Key info strip ── */}
      <SectionFrame tone="cream" maxWidth="md" size="md">
        <p
          className="text-lg md:text-xl leading-[1.8] text-center mb-6"
          style={{ color: RETREAT_THEME.BODY }}
        >
          The Buddhist practice tradition of the Six Yogas of Niguma, which
          originates with the 10th-century Indian mystic Niguma, is one of the
          most effective and powerful systems in the Vajrayana tradition
          (Tantric Buddhism). The Six Yogas allow us to use body, energy and
          mind in extraordinary ways, producing deep states of purification,
          insight and bliss - and ultimately bringing us to full enlightenment.
        </p>
        <p
          className="text-lg md:text-xl leading-[1.8] text-center mb-8"
          style={{ color: RETREAT_THEME.BODY }}
        >
          <strong>Lama Glenn Mullin,</strong> a student of the Dalai Lama and an
          international teacher of Tibetan Buddhism, will teach us the path of
          the Six Yogas in depth in this special retreat by the Dead Sea - and
          you can join from anywhere in the world.
        </p>
        <div className="text-center">
          <button
            className="py-3 px-8 text-base font-bold rounded-full border-2 transition-all duration-200 hover:scale-105 hover:shadow-md"
            style={goldBtn}
            onMouseEnter={hoverIn}
            onMouseLeave={hoverOut}
            onClick={() => open()}
          >
            Register
          </button>
        </div>
      </SectionFrame>

      {/* ── About ── */}
      <AboutSection
        eyebrow="About the Retreat"
        bgImage={venuePhoto1}
        ctaLabel="Register for the Retreat"
        onCtaClick={() => open()}
        paragraphs={[
          "Tantric Buddhism teaches powerful meditation techniques that lead to a deep understanding of human existence, to freedom from suffering, and to the development of love and wisdom. The special means of Tantric Buddhism let us use the deep processes of body and mind to reach unique states of consciousness. These states free us from the ordinary, limiting ways of perceiving, and let us act from a mind that benefits ourselves and others - and ultimately reach full enlightenment in a single lifetime.",
          "The Six Yogas of Niguma are among the most important practices of the yogis and practitioners of the Tantric Buddhist traditions of Asia, and have been practiced continuously for over a thousand years - including in the lineage of the Dalai Lamas of Tibet. Only in recent years have they begun to be taught in the West. This is a rare opportunity to learn this powerful system of inner transformation directly from the heart of the lineage.",
          "In the retreat, Lama Glenn Mullin - a personal student of the Dalai Lama and an international teacher of Tibetan Buddhism - will teach the Six Yogas step by step: teaching, practical guidance and guided practice.",
          "We are especially glad to hold this retreat in the Dead Sea region - a place of great power, which has served as a site of spiritual practice for saints and practitioners since the dawn of history. And this time during Hanukkah, the festival of light and fire - a time especially suited to the practices of inner fire.",
          "The retreat is suitable for beginners and advanced practitioners alike. It is taught in English, in person at Ein Gedi and live on Zoom.",
        ]}
      />

      {/* ── The Six Yogas ── */}
      <SectionFrame tone="none" maxWidth="md">
        <SectionTitle className="text-center mb-4">What are the Six Yogas of Niguma?</SectionTitle>
        <p className="text-lg text-center mb-12" style={{ color: RETREAT_THEME.WARM_GRAY }}>
          The 10th-century mystic taught the tantric system of the Six Yogas -
          the roadmap of inner techniques for reaching enlightenment swiftly.
          The Six Yogas are:
        </p>

        <div className="max-w-2xl mx-auto mb-12">
          <img
            src={nigumaMural}
            alt="Tibetan mural: two yogis in meditation beside a lotus"
            className="w-full rounded-lg shadow-md"
          />
        </div>

        <div className="space-y-8 max-w-2xl mx-auto">
          {sixYogas.map((yoga) => (
            <div key={yoga.title} className="flex gap-4">
              <span
                className="mt-2 block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: RETREAT_THEME.GOLD }}
                aria-hidden
              />
              <div>
                <h3 className="text-xl font-bold mb-1" style={{ fontFamily: RETREAT_FONTS.serif }}>
                  {yoga.title}
                </h3>
                <p className="text-lg leading-[1.8]" style={{ color: RETREAT_THEME.WARM_GRAY }}>
                  {yoga.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-lg leading-[1.8] max-w-2xl mx-auto mt-12" style={{ color: RETREAT_THEME.BODY }}>
          The Six Yogas let us transform every state of life - waking and sleep,
          meditation and daily life, the life of love and even the process of
          death - into the path of spiritual awakening.
        </p>
      </SectionFrame>

      {/* ── Vajrayogini empowerment (image beside text) ── */}
      <SectionFrame tone="stone" maxWidth="lg">
        <div className="grid md:grid-cols-[auto_1fr] gap-8 md:gap-12 items-center">
          <div className="mx-auto md:mx-0 w-[220px] md:w-[260px] shrink-0">
            <img
              src={vajrayoginiThangka}
              alt="Vajrayogini - Tibetan thangka"
              className="w-full rounded-lg shadow-md"
            />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ fontFamily: RETREAT_FONTS.serif }}>
              The Practice and Empowerment of Vajrayogini
            </h2>
            <p className="text-base font-medium mb-6" style={{ color: RETREAT_THEME.GOLD }}>
              The female Buddha of transforming desire into wisdom
            </p>
            <div className="space-y-5 text-lg leading-[1.8]" style={{ color: RETREAT_THEME.BODY }}>
              <p>
                We will learn the Six Yogas of Niguma in the context of the
                tantric practice of Vajrayogini, which lets us take the fire of
                desire and attachment and transform it into supreme wisdom. The
                Vajrayogini practice is known as an especially swift and
                powerful one, and it is a principal practice in every school of
                Tibetan Buddhism - including the lineage of the Dalai Lamas.
              </p>
              <p>
                During the retreat Lama Glenn will give the Vajrayogini
                empowerment to the participants, and teach a short sadhana of
                the Eleven Yogas of Vajrayogini - the daily practice that
                accompanies the practitioner after the retreat.
              </p>
            </div>
          </div>
        </div>
      </SectionFrame>

      {/* ── Teachers ── */}
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
          bio="Lama Glenn Mullin is an experienced and beloved teacher of Buddhist Tantra and Tummo. He is a direct student of His Holiness the 14th Dalai Lama, and his root teachers are Ling Rinpoche VI and Trijang Rinpoche - the personal root teachers of the 14th Dalai Lama. Lama Glenn has been teaching Tibetan Buddhism for over thirty years to thousands of students worldwide. He is a renowned scholar, author, and translator - having written over 30 books on Tibetan Buddhism and Buddhist Tantra published around the world."
          size="lg"
        />
        <TeacherCard
          name="Drupon Chongwol-la"
          photo={druponPhoto}
          bio="Drupon Chongwol-la is Lama Glenn's retreat guide and a skilled teacher of Buddhist Tantra and Tummo. Born in South Korea and raised in the USA, he served as a Zen monk for 16 years. Since 2007, he has been practicing Mahayana Tantra under the guidance of his root teacher, Lama Glenn. Drupon Chongwol-la teaches students around the world - in Korea, the USA, Russia, Israel, South America, and more."
          size="md"
          reversed
        />
      </SectionFrame>

      {/* ── Schedule: in person and on Zoom ── */}
      <SectionFrame tone="cream" maxWidth="xl">
        <SectionEyebrow className="text-center block mb-16">Retreat Schedule</SectionEyebrow>

        {/* Arrival & meals (for guests at Ein Gedi) */}
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center mb-20">
          <div>
            <h3
              className="text-sm font-bold tracking-[0.15em] uppercase mb-4"
              style={{ color: RETREAT_THEME.WARM_GRAY }}
            >
              Arrival and Logistics
            </h3>
            <div className="space-y-4 text-lg leading-[1.8]" style={{ color: RETREAT_THEME.BODY }}>
              <p>
                The retreat begins on Sunday, December 6, at 2:00 PM and ends on
                Saturday, December 12, 2026, at 3:00 PM (Israel time).
              </p>
              <p>
                Teaching starts on Sunday afternoon, right after arrival and
                settling in.
              </p>
            </div>
            <h3
              className="text-sm font-bold tracking-[0.15em] uppercase mt-8 mb-4"
              style={{ color: RETREAT_THEME.WARM_GRAY }}
            >
              Meals (guests at Ein Gedi)
            </h3>
            <div className="text-lg leading-[1.8]" style={{ color: RETREAT_THEME.BODY }}>
              <p>Breakfast: 8:00-9:15 AM</p>
              <p>Lunch: 12:30-1:30 PM</p>
              <p>Dinner: 6:30-7:30 PM</p>
            </div>
          </div>
          <img
            src={venuePhoto4}
            alt="Ein Gedi Field School"
            className="w-full h-64 md:h-80 object-cover rounded-lg shadow-md"
          />
        </div>

        {/* Session hours */}
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center mb-16">
          <img
            src={einGediGalleryImages[13]}
            alt="From a previous retreat"
            className="w-full h-64 md:h-80 object-cover rounded-lg shadow-md order-2 md:order-1"
          />
          <div className="order-1 md:order-2">
            <h3
              className="text-sm font-bold tracking-[0.15em] uppercase mb-6"
              style={{ color: RETREAT_THEME.WARM_GRAY }}
            >
              Session Hours (Israel time)
            </h3>
            <div className="space-y-6">
              {scheduleBlocks.map((block) => (
                <div key={block.days} className="border-l-2 pl-4" style={{ borderColor: RETREAT_THEME.GOLD }}>
                  <p className="font-bold text-base mb-0.5">{block.days}</p>
                  <p className="font-bold text-lg" style={{ color: RETREAT_THEME.GOLD }}>
                    {block.practice}
                  </p>
                  <p className="text-base mt-1" style={{ color: RETREAT_THEME.WARM_GRAY }}>
                    {block.times}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-base mt-6" style={{ color: RETREAT_THEME.WARM_GRAY }}>
              Each day includes teaching, guided practice, yoga and meditation.
              The whole retreat falls within Hanukkah - from the third candle on
              Sunday to the eighth day on Saturday - with candle lighting every
              evening.
            </p>
            <p className="text-base mt-2" style={{ color: RETREAT_THEME.WARM_GRAY }}>
              Optional: early-morning meditation and evening activities.
            </p>
          </div>
        </div>

        {/* Zoom block */}
        <div className="max-w-lg mx-auto space-y-8 text-center" style={{ color: RETREAT_THEME.BODY }}>
          <div>
            <h3 className="font-semibold text-lg mb-3">Joining on Zoom</h3>
            <p className="text-lg leading-relaxed">
              Every session is streamed live from the retreat hall. Zoom
              participants take part in the teachings, the guided practices and
              the Vajrayogini empowerment together with the group at Ein Gedi.
            </p>
          </div>

          <div
            className="bg-stone-50 rounded-xl p-5 text-base"
            style={{ color: "#8C8279" }}
          >
            <p className="font-semibold mb-1" style={{ color: "#5C5549" }}>
              Session Start Times by Time Zone
            </p>
            <p className="mb-2">
              Morning: 09:30 IST (Israel) / 07:30 GMT (London) / 02:30 EST (New
              York) / 18:30 AEDT (Sydney)
            </p>
            <p>
              Afternoon: 14:30 IST (Israel) / 12:30 GMT (London) / 07:30 EST
              (New York) / 23:30 AEDT (Sydney)
            </p>
          </div>

          <div>
            <MonitorPlay className="mx-auto mb-3 h-8 w-8" style={{ color: RETREAT_THEME.GOLD }} />
            <p className="text-lg leading-relaxed">
              All sessions are recorded and made available to registered
              participants, so you can watch or review them in your own time -
              and catch up on sessions that fall at night where you are.
            </p>
          </div>

          <p className="text-base" style={{ color: "#8C8279" }}>
            A Zoom link will be sent after registration. A detailed schedule
            will be sent before the retreat.
          </p>
          <p className="text-sm" style={{ color: "#8C8279" }}>
            * The schedule shown is approximate. The final schedule will be sent
            to participants before the retreat.
          </p>
        </div>
      </SectionFrame>

      {/* ── What's Included ── */}
      <WhatsIncluded eyebrow="What's Included" bgImage={venuePhoto3} items={whatsIncluded} />

      {/* ── Pricing ── */}
      <div ref={ctaSectionRef}>
        <PricingGrid
          title="Registration"
          subtitle="Join us at Ein Gedi, or via Zoom from anywhere in the world"
          tiers={registrationConfig.tiers.filter((t) => !t.hidden)}
          ctaLabel="Register Now"
          onSelect={(tierId) => open(tierId)}
          notes={[
            "The room price covers a bed in a shared 4-person room for 6 nights (Sunday to Saturday), all meals, and every session. Rooms are shared by gender.",
            "Secure payment in US dollars, processed via Cardcom.",
            "We want everyone who is interested to be able to participate and benefit from the Dharma. If you would like to join but cannot afford the registration fee due to life circumstances, please contact us at maitreyasanghaisrael@gmail.com",
          ]}
        />
      </div>

      {/* ── Venue ── */}
      <VenueSection
        bgImage={venuePhoto2}
        eyebrow="Ein Gedi Field School"
        paragraphs={[
          "A quiet, beautiful campus facing the Dead Sea, with a direct view of the sea and the mountains of Moab. Five minutes' drive from Kibbutz Ein Gedi, close to the nature reserve and the Dragot cliffs.",
          "The rooms were renovated in recent years - simple, pleasant and comfortable. Each room has a bathroom and shower, air conditioning and a coffee corner. The campus has air-conditioned halls, a dining room with full board, and green, pleasant outdoor spaces.",
          "In December the Dead Sea is at its best: mild days, clear nights, and a quiet desert.",
        ]}
        photoGrid={[
          { src: venuePhoto1, alt: "The view at Ein Gedi" },
          { src: venuePhoto4, alt: "Palm trees and lawns" },
          { src: venuePhoto3, alt: "The outdoor spaces" },
        ]}
      />

      {/* ── Gallery ── */}
      <GalleryCarousel
        title="From Our Retreats"
        images={einGediGalleryImages}
        alt="From previous Maitreya Sangha retreats"
      />

      {/* ── Video ── */}
      <VideoSection
        title="Meet Lama Glenn Mullin"
        subtitle="Lama Glenn on Buddhist Tantra in everyday life"
        embedUrl="https://www.youtube.com/embed/r6IniYsqRcw?start=1"
        iframeTitle="Lama Glenn Mullin - Buddhist Tantra"
      />

      {/* ── Final CTA ── */}
      <FinalCTA
        bgImage={venuePhoto4}
        title="Join the Retreat"
        body="Six days of the Six Yogas of Niguma, with the Vajrayogini empowerment, on the shore of the Dead Sea during Hanukkah - in person or live on Zoom"
        ctaLabel="Register for the Retreat"
        onCtaClick={() => open()}
        footnote="Very few beds available"
      />

      {/* ── Cancellation + Contact ── */}
      <InfoFooter
        policy={{
          heading: "Cancellation Policy",
          bullets: [
            "Cancellation up to 30 days before the retreat - full refund",
            "Cancellation 14-30 days before - 50% refund",
            "Cancellation less than 14 days before - no refund",
          ],
        }}
        contact={{
          heading: "Contact Us",
          label: "For questions and inquiries:",
          email: CONTACT_EMAIL,
        }}
      />

      {/* ── Other Events ── */}
      <OtherEvents
        heading="Upcoming Events"
        events={[
          {
            image: "/og-healing-kundalini-retreat.jpg",
            imageAlt: "Meditation and Kundalini Practices for Healing",
            title: "Meditation and Kundalini Practices for Healing",
            dateLabel: "December 2-4, 2026 | Live on Zoom from Tel Aviv",
            endDate: "2026-12-04",
            description:
              "Three days of teaching and practice of the healing methods of Tantric Buddhism with Lama Glenn, including the Palden Lhamo initiation",
            ctaLabel: "Learn More",
            href: "/events/en/healing-kundalini-retreat",
          },
        ]}
      />

      {/* ── Mailing List ── */}
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

      {/* ── Registration Modal ── */}
      <RegistrationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        preselectedTierId={preselectedTier}
        config={registrationConfig}
        copy={registrationCopy}
      />

      {/* ── Payment Status ── */}
      {paymentStatus && (
        <PaymentStatusModal
          status={paymentStatus}
          dir="ltr"
          successTitle="Registration Successful!"
          successBody="Thank you for registering for The Six Yogas of Niguma retreat. A confirmation email with details will be sent to you shortly."
          successDetails={{
            heading: "Retreat Details",
            lines: ["December 6-12, 2026", "Ein Gedi Field School, Dead Sea, or live on Zoom"],
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

export default SixYogasNigumaRetreatEN;
