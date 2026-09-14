/**
 * Tantric Meditations and Kundalini Practices for Healing - retreat (English / Zoom)
 * =========================================================================
 * English twin of HealingKundaliniRetreat.tsx: the 3-day Antakarana retreat
 * (Tel Aviv, Wed-Fri 2-4 Dec 2026) streamed live on Zoom for people abroad.
 * Fixed $180 USD, single tier, recordings of every session included.
 *
 * Language: English (LTR). Same shared components as the Hebrew page; the venue
 * block is replaced by a Zoom block (time zones, recordings, link by email), and
 * the "On the practice" block was dropped by Shahaf on 2026-09-15.
 * Content source (vault): teachers-visit-nov-dec-2026/marketing/tel-aviv-landing-page-content.md
 *
 * Registration: RegistrationModal (embedPayment) posts to n8n HKR_EN_Register,
 * which mints a USD Cardcom page per person (HKR pattern, ISOCoinId 2).
 * Hidden test tier ($1) via ?test=<TEST_KEY>.
 */

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MonitorPlay } from "lucide-react";
import { RetreatLayout } from "@/components/retreat/RetreatLayout";
import { RetreatHero } from "@/components/retreat/RetreatHero";
import { AboutSection } from "@/components/retreat/AboutSection";
import { TeacherCard } from "@/components/retreat/TeacherCard";
import { ScheduleBlock } from "@/components/retreat/ScheduleBlock";
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
import { SectionFrame, SectionTitle } from "@/components/retreat/SectionFrame";
import { RETREAT_THEME, RETREAT_FONTS } from "@/components/retreat/theme";
import { useRetreatSEO } from "@/components/retreat/hooks/useRetreatSEO";
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
/** Test payments: `?test=p2n7vc` preselects a hidden $1 option (refund from Cardcom). */
const TEST_KEY = "p2n7vc";
const TEST_TIER_ID = "HKR_EN_2026_Test";
const ZOOM_TIER_ID = "HKR_EN_2026_Zoom";

const CONTACT_EMAIL = "maitreyasanghaisrael@gmail.com";

const seo: SEOConfig = {
  title:
    "Tantric Meditations and Kundalini Practices for Healing with Lama Glenn | December 2-4, 2026 | Maitreya Sangha Israel",
  description:
    "Three days of teaching and practice of the healing methods of Tantric Buddhism with Lama Glenn Mullin, including the Palden Lhamo empowerment. Live on Zoom from Tel Aviv, December 2-4, 2026.",
  keywords:
    "retreat, healing, kundalini, tummo, Buddhism, tantra, Lama Glenn, Palden Lhamo, meditation, Zoom, Maitreya Sangha",
  url: "https://maitreya.org.il/events/en/healing-kundalini-retreat",
  ogImage: "https://maitreya.org.il/og-healing-kundalini-retreat.jpg", // the Hebrew card is visual only
  locale: "en_US",
};

const registrationConfig: RegistrationConfig = {
  title: "Registration for the Online Retreat",
  subtitle: "Tantric Meditations and Kundalini Practices for Healing | December 2-4, 2026 | Zoom",
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
      id: TEST_TIER_ID,
      title: "Payment test",
      note: "$1",
      hidden: true,
      priceDisplay: "1",
      priceValue: 1,
      currencySymbol: "$",
    },
  ],
  showTierSelect: false,
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

// Hours follow the Hebrew page (Israel time); the final timetable is sent to participants.
const scheduleDays = [
  {
    label: "Wednesday, December 2, 2026",
    time: "09:30 AM-6:00 PM Israel time",
    description: "Morning: 09:30-12:00 | Lunch break: 12:00-14:00 | Afternoon: 14:00-18:00",
  },
  {
    label: "Thursday, December 3, 2026",
    time: "09:30 AM-6:00 PM Israel time",
    description: "Morning: 09:30-12:00 | Lunch break: 12:00-14:00 | Afternoon: 14:00-18:00",
  },
  {
    label: "Friday, December 4, 2026",
    time: "09:30 AM-2:00 PM Israel time",
    description: "Morning: 09:30-12:00 | Closing: 14:00, before Shabbat",
  },
];

const whatsIncluded = [
  "Three days of teaching and practice with Lama Glenn Mullin, live on Zoom",
  "The Palden Lhamo empowerment",
  "Practical guidance for the healing and kundalini (tummo) practices",
  "Recordings of all sessions, to watch or review in your own time",
  "Opportunity to continue practicing with Drupon Chongwol-la in a weekly practice group",
];

/* ── Component ── */

const HealingKundaliniRetreatEN = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paymentStatus = searchParams.get("payment") as "success" | "failed" | null;
  const testMode = searchParams.get("test") === TEST_KEY;
  const [modalOpen, setModalOpen] = useState(false);
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
    if (testMode && !paymentStatus) setModalOpen(true);
  }, [testMode, paymentStatus]);

  // The payment happens inside an iframe on this page, so Cardcom's redirect
  // back lands inside that frame. Same origin, so we climb out.
  useEffect(() => {
    if (!paymentStatus) return;
    if (window.top && window.top !== window.self) {
      window.top.location.href = window.location.href;
    }
  }, [paymentStatus]);

  const open = () => {
    window.gtag?.("event", "registration_modal_open", { page: "healing-kundalini-retreat-en" });
    setModalOpen(true);
  };

  const closePaymentStatus = () => setSearchParams({}, { replace: true });

  return (
    <RetreatLayout
      lang="en"
      dir="ltr"
      seo={seo}
      navCtaLabel="Register"
      onNavCtaClick={open}
      footerText={`© ${new Date().getFullYear()} Maitreya Sangha Israel. All rights reserved.`}
    >
      <RetreatHero
        image={hkrHero}
        mobileImage={hkrHeroMobile}
        imageAlt="Tibetan mural of yogis in meditation"
        title="Tantric Meditations and Kundalini Practices for Healing"
        subtitle="Three days of teaching and practice of the healing methods of Tantric Buddhism, including the Palden Lhamo empowerment"
        accent="with Lama Glenn"
        dateLine="December 2-4, 2026 | Live on Zoom from Tel Aviv"
        objectPosition="62% 40%"
      />

      <AboutSection
        eyebrow="Healing Body and Mind"
        softBgImage={cloudsBg}
        ctaLabel="Register for the Online Retreat"
        onCtaClick={open}
        paragraphs={[
          "The Buddhist tradition is rich in knowledge and in profound meditation practices for healing body and mind. Buddhism recognizes the deep relationship between body and mind, and between a person and their environment - and the ways these inter-relations contribute to health or to illness.",
          "Over the generations in Asia, practitioners, physicians and healers have used the Buddhist healing methods to heal themselves and others: healing the mind of negative emotions and harmful tendencies, and healing the body through deep yogic work with the body's inner energetic systems.",
          "In Tibetan Buddhism, many traditions of these yogic practices are still taught today. They are known as Tummo or Chandali. In these practices one learns to work directly with the energies of the body (the prana, or chi) and with its essences (the bindu, or ojas): to balance and purify the nervous system and the hormonal system, to release patterns that do not serve us, and to reach deep, healing states of mind.",
          "In this retreat Lama Glenn will teach the yogic and meditative practices of Buddhist healing, as they have been taught for more than a thousand years in the Tibetan tradition and especially in the tradition of the Dalai Lamas. The three days will include teaching, practical guidance, guided practice, and the Palden Lhamo empowerment.",
          "The retreat is suitable for beginners and advanced practitioners alike, and is taught in English.",
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

      <ScheduleBlock
        eyebrow="Retreat Schedule"
        intro="Three days of teaching, guided practice and practical guidance, streamed live from Tel Aviv, with a long lunch break and short breaks during the sessions. The Palden Lhamo empowerment takes place during the retreat."
        days={scheduleDays}
        notes={[
          "The retreat is taught in English and is suitable for beginners and advanced practitioners alike.",
          "* The schedule shown is approximate. The final schedule will be sent to participants before the retreat.",
        ]}
      />

      {/* ── Zoom block ── */}
      <SectionFrame tone="none" maxWidth="md">
        <div className="max-w-lg mx-auto space-y-8 text-center" style={{ color: RETREAT_THEME.BODY }}>
          <div>
            <h3 className="font-semibold text-lg mb-3">Joining on Zoom</h3>
            <p className="text-lg leading-relaxed">
              Every session is streamed live from the retreat hall at the
              Antakarana Center in Tel Aviv. Zoom participants take part in the
              teachings, the guided practices and the Palden Lhamo empowerment
              together with the group in the room.
            </p>
          </div>

          <div className="bg-stone-50 rounded-xl p-5 text-base" style={{ color: "#8C8279" }}>
            <p className="font-semibold mb-1" style={{ color: "#5C5549" }}>
              Session Start Times by Time Zone
            </p>
            <p className="mb-2">
              Morning: 09:30 IST (Israel) / 07:30 GMT (London) / 02:30 EST (New
              York) / 18:30 AEDT (Sydney)
            </p>
            <p>
              Afternoon: 14:00 IST (Israel) / 12:00 GMT (London) / 07:00 EST
              (New York) / 23:00 AEDT (Sydney)
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
        </div>
      </SectionFrame>

      <WhatsIncluded eyebrow="What's Included" items={whatsIncluded} />

      <div ref={ctaSectionRef}>
        <PricingGrid
          title="Registration"
          subtitle="Join the retreat via Zoom from anywhere in the world"
          tiers={registrationConfig.tiers.filter((t) => !t.hidden)}
          ctaLabel="Register Now"
          onSelect={() => open()}
          notes={[
            "Secure payment in US dollars, processed via Cardcom.",
            "We want everyone who is interested to be able to participate and benefit from the Dharma. If you would like to join but cannot afford the registration fee due to life circumstances, please contact us at maitreyasanghaisrael@gmail.com",
          ]}
        />
      </div>

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

      <FinalCTA
        bgImage={prayerFlagsBg}
        title="Join the Retreat"
        body="Three days of deep teaching and practice of the healing methods of Tantric Buddhism, with the Palden Lhamo empowerment, live on Zoom"
        ctaLabel="Register for the Online Retreat"
        onCtaClick={open}
        footnote="Recordings included"
      />

      <InfoFooter
        contact={{
          heading: "Contact Us",
          label: "For questions and inquiries:",
          email: CONTACT_EMAIL,
        }}
      />

      <OtherEvents
        heading="Upcoming Events"
        events={[
          {
            image: "/og-six-yogas-niguma.jpg",
            imageAlt: "The Six Yogas of Niguma",
            title: "The Six Yogas of Niguma",
            dateLabel: "December 6-12, 2026 | Ein Gedi, Dead Sea, or live on Zoom",
            endDate: "2026-12-12",
            description:
              "A six-day retreat with Lama Glenn Mullin on the Six Yogas of Niguma, including the Vajrayogini empowerment - in person at Ein Gedi or on Zoom",
            ctaLabel: "Learn More",
            href: "/events/en/six-yogas-niguma-retreat",
          },
        ]}
      />

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

      <RegistrationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        preselectedTierId={testMode ? TEST_TIER_ID : ZOOM_TIER_ID}
        config={registrationConfig}
        copy={registrationCopy}
      />

      {paymentStatus && (
        <PaymentStatusModal
          status={paymentStatus}
          dir="ltr"
          successTitle="Registration Successful!"
          successBody="Thank you for registering for the Tantric Meditations and Kundalini Practices for Healing retreat. A confirmation email with details will be sent to you shortly."
          successDetails={{
            heading: "Retreat Details",
            lines: ["December 2-4, 2026", "Live on Zoom"],
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
