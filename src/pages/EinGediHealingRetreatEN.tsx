/**
 * Ein Gedi Healing Retreat (English / Zoom)
 * ==========================================
 *
 * English version of the Ein Gedi Healing Retreat landing page, targeting
 * global audiences joining via Zoom. June 1-6, 2026.
 * Teachers: Lama Glenn Mullin & Drupon Chongwol-la.
 *
 * Language: English (LTR).
 * Attendance: Zoom only (no physical venue).
 * Pricing: Fixed $180 USD (single tier).
 *
 * Follows the modular pattern established by HeartOfWisdomRetreatEN.tsx.
 */

import { useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
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
import { RegistrationModal } from "@/components/retreat/RegistrationModal";
import { PaymentStatusModal } from "@/components/retreat/PaymentStatusModal";
import { SectionFrame, SectionTitle } from "@/components/retreat/SectionFrame";
import { MonitorPlay } from "lucide-react";
import { useRetreatPurchaseTracking } from "@/components/retreat/hooks/useMetaPixelRetreat";
import { useRetreatSEO } from "@/components/retreat/hooks/useRetreatSEO";
import type { RegistrationConfig, SEOConfig } from "@/components/retreat/types";
import {
  heroImage,
  lamaGlennPhoto,
  druponPhoto,
  threeDeities,
  medicineBuddha,
  venuePhoto1,
  prayerFlagsBg,
  einGediGalleryImages,
} from "@/assets/ein-gedi-retreat";

/* ── Constants ── */

const N8N_WEBHOOK_URL = "https://tknstk.app.n8n.cloud/webhook/EinGedi_EN_Register";
const CONTACT_EMAIL = "maitreyasanghaisrael@gmail.com";

const seo: SEOConfig = {
  title:
    "The Path of Tantric Healing with Lama Glenn | June 1-6, 2026 | Maitreya Sangha Israel",
  description:
    "Six days of deep healing and longevity practices from Tibetan Buddhist Tantra with Lama Glenn Mullin and Drupon Chongwol-la. Live on Zoom, June 1-6, 2026.",
  keywords:
    "retreat, healing, Buddhism, tantra, Lama Glenn, Ein Gedi, meditation, White Tara, Medicine Buddha, Maitreya Sangha, Zoom",
  url: "https://maitreya.org.il/p/events/en/ein-gedi-healing-retreat",
  ogImage: "https://maitreya.org.il/p/og-ein-gedi-healing-retreat-en.png",
  locale: "en_US",
};

const registrationConfig: RegistrationConfig = {
  title: "Registration for the Online Retreat",
  subtitle: "The Path of Tantric Healing | June 1-6, 2026 | Zoom",
  webhookUrl: N8N_WEBHOOK_URL,
  contentName: "The Path of Tantric Healing EN",
  currency: "USD",
  lang: "en",
  dir: "ltr",
  tiers: [
    {
      id: "2026_06_EinGedi_EN",
      title: "Zoom Participation",
      priceDisplay: "180",
      priceValue: 180,
      currencySymbol: "$",
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
  phoneInternational: true,
  askCountry: true,
  storagePrefix: "ein-gedi-en",
  extraPayload: { source: "ein-gedi-en" },
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
  termsSuffix:
    "and consent to receive updates from Maitreya Sangha Israel.",
  submitLabel: "Register & Proceed to Payment",
  submittingLabel: "Submitting...",
  submitFootnote:
    "After submitting you will be redirected to a secure payment page. Registration is confirmed upon payment.",
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
  "Six days of teaching and practice with Lama Glenn Mullin",
  "Three initiations (White Tara, Medicine Buddha, White Chakrasamvara)",
  "Guided healing and longevity meditations",
  "Recordings of all sessions available for up to one month after the retreat",
  "Opportunity to continue practice with Drupon Chongwol-la in a weekly practice group",
];

/* ── Three Practices data ── */

const practices = [
  {
    title: "White Tara",
    subtitle: "The Wish-Fulfilling Wheel",
    description:
      "White Tara is a female Buddha embodying the five enlightened activities of awakened consciousness: pacifying, magnetizing, enriching, wrathful action, and protection. Her practice is especially powerful for longevity, healing, and removing inner and outer obstacles.",
  },
  {
    title: "Medicine Buddha",
    subtitle: "The Buddha of Healing",
    description:
      "Medicine Buddha, often called the First Physician, is a central figure in Buddhist healing traditions. This practice enables practitioners to activate and strengthen their innate healing powers, and to empower the protective forces of the human energy field.",
  },
  {
    title: "White Chakrasamvara",
    subtitle: "Longevity Energy",
    description:
      "A highest yoga tantra practice that, in addition to being a complete path to enlightenment, includes unique methods for longevity. The practice involves special inner energy work (tummo), working directly with the energy channels and chakras - for healing, releasing energy blockages, strengthening vitality, and extending life.",
  },
];

/* ── Component ── */

const EinGediHealingRetreatEN = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paymentStatus = searchParams.get("payment") as
    | "success"
    | "failed"
    | null;
  const [modalOpen, setModalOpen] = useState(false);
  const ctaSectionRef = useRef<HTMLDivElement>(null);

  useRetreatSEO(seo);

  // Purchase pixel disabled - only Ein Gedi HE fires Purchase to keep
  // campaign optimization signal clean. Re-enable when this page gets its
  // own campaign with a Custom Conversion filter.

  const open = () => {
    window.gtag?.("event", "registration_modal_open", {
      page: "ein-gedi-en",
    });
    setModalOpen(true);
  };

  const closePaymentStatus = () =>
    setSearchParams({}, { replace: true });

  return (
    <RetreatLayout
      lang="en"
      dir="ltr"
      seo={seo}
      navCtaLabel="Register"
      onNavCtaClick={open}
      footerText={`\u00A9 ${new Date().getFullYear()} Maitreya Sangha Israel. All rights reserved.`}
    >
      {/* ── Hero ── */}
      <RetreatHero
        image={threeDeities}
        imageAlt="The three healing deities - The Path of Tantric Healing"
        title="The Path of Tantric Healing"
        subtitle="Six days of deep healing and longevity practices from the Tibetan Buddhist Tantric tradition"
        accent="with Lama Glenn Mullin"
        dateLine="June 1-6, 2026 | Live on Zoom"
        objectPosition="center 30%"
        mobileImage={medicineBuddha}
      />

      {/* ── Key info strip ── */}
      <SectionFrame tone="cream" maxWidth="md" size="md">
        <p
          className="text-lg md:text-xl leading-[1.8] text-center mb-8"
          style={{ color: "#3D3830" }}
        >
          The ancient Buddhist tradition offers powerful means for healing and
          enlightenment. In this special retreat we will study with Lama Glenn
          Mullin, a direct student of His Holiness the Dalai Lama, what healing
          means according to Buddhist Tantra, and practice three of the core
          healing practices of the tantric tradition - ancient and powerful
          practices for healing, balance, longevity, and deepening the spiritual
          path.
        </p>
        <div className="text-center">
          <button
            className="py-3 px-8 text-base font-bold rounded-full border-2 transition-all duration-200 hover:scale-105 hover:shadow-md"
            style={{
              borderColor: "#B8860B",
              color: "#B8860B",
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#B8860B";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#B8860B";
            }}
            onClick={open}
          >
            Register for the Online Retreat
          </button>
        </div>
      </SectionFrame>

      {/* ── About ── */}
      <AboutSection
        eyebrow="About the Retreat"
        bgImage={heroImage}
        ctaLabel="Register for the Online Retreat"
        onCtaClick={open}
        paragraphs={[
          <>
            In this retreat, we will learn what healing means according to
            Buddhist Tantra and practice three core healing practices -{" "}
            <strong>
              Medicine Buddha, White Tara, and White Chakrasamvara
            </strong>
            .
          </>,
          "These practices originate from the heart of the Tantric Buddhist tradition, transmitted in unbroken lineages for over a thousand years by tantric masters in India, Tibet, and across Asia. They have been used for generations by healers, physicians, spiritual practitioners, and ordinary people - for self-healing, healing others, and advancing on the spiritual path.",
          <>
            The practices work with consciousness, breath, body, and sound
            (mantra) to access the deepest levels of our being, and to directly
            touch everything that needs healing. This powerful approach works on
            the root of imbalance as it manifests in illness and difficulty,
            transmuting it into health, joy, and ultimately -{" "}
            <strong>full enlightenment</strong>.
          </>,
          "The retreat is suitable for both beginners and advanced practitioners.",
        ]}
      />

      {/* ── Teachers ── */}
      <SectionFrame tone="stone" maxWidth="xl">
        <div
          className="h-px w-64 md:w-80 mx-auto -mt-16 md:-mt-24 mb-16 md:mb-24"
          style={{ backgroundColor: "#C9A961" }}
          aria-hidden
        />
        <SectionTitle className="text-center mb-16">
          The Teachers
        </SectionTitle>
        <TeacherCard
          name="Lama Glenn Mullin"
          photo={lamaGlennPhoto}
          bio="Lama Glenn is an experienced and beloved teacher of Buddhist Tantra and Tummo. He is a direct student of His Holiness the 14th Dalai Lama, and his root teachers are Ling Rinpoche VI and Trijang Rinpoche - the personal root teachers of the 14th Dalai Lama. Lama Glenn has been teaching Tibetan Buddhism for over thirty years to thousands of students worldwide. He is a renowned scholar, author, and translator - having written over 30 books on Tibetan Buddhism and Buddhist Tantra published around the world."
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

      {/* ── Three Practices ── */}
      <SectionFrame tone="none" maxWidth="lg">
        <SectionTitle className="text-center mb-4">
          The Three Practices
        </SectionTitle>
        <p
          className="text-lg text-center mb-12"
          style={{ color: "#6B635A" }}
        >
          Three core practices from the Tibetan Buddhist Tantric tradition,
          including initiations
        </p>

        <div className="max-w-2xl mx-auto mb-12">
          <img
            src={threeDeities}
            alt="The three healing deities"
            className="w-full rounded-lg shadow-md"
          />
        </div>

        <div className="space-y-8 max-w-2xl mx-auto">
          {practices.map((practice) => (
            <div key={practice.title} className="flex gap-4">
              <span
                className="mt-2 block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: "#C9A961" }}
                aria-hidden
              />
              <div>
                <h3
                  className="text-xl font-bold mb-1"
                  style={{
                    fontFamily:
                      "'Playfair Display', 'Frank Ruhl Libre', serif",
                  }}
                >
                  {practice.title}
                </h3>
                <p
                  className="text-base font-medium mb-2"
                  style={{ color: "#C9A961" }}
                >
                  {practice.subtitle}
                </p>
                <p
                  className="text-lg leading-[1.8]"
                  style={{ color: "#6B635A" }}
                >
                  {practice.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </SectionFrame>

      {/* ── Schedule ── */}
      <SectionFrame tone="cream" maxWidth="lg">
        <SectionTitle className="text-center mb-10">
          Retreat Schedule
        </SectionTitle>

        {/* Day cards - 3x2 grid grouped by practice pair */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-10">
          {[
            { days: "Days 1-2", dates: "Mon-Tue, Jun 1-2", practice: "White Tara" },
            { days: "Days 3-4", dates: "Wed-Thu, Jun 3-4", practice: "Medicine Buddha" },
            { days: "Days 5-6", dates: "Fri-Sat, Jun 5-6", practice: "White Chakrasamvara" },
          ].map((block, i) => (
            <div
              key={i}
              className="text-center rounded-xl py-5 px-3"
              style={{ backgroundColor: "rgba(201,169,97,0.08)" }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-1"
                style={{ color: "#C9A961" }}
              >
                {block.days}
              </p>
              <p className="font-bold text-sm mb-1">{block.dates}</p>
              <p
                className="text-xs font-medium"
                style={{ color: "#C9A961" }}
              >
                {block.practice}
              </p>
            </div>
          ))}
        </div>

        {/* Daily structure */}
        <div
          className="max-w-lg mx-auto space-y-8 text-center"
          style={{ color: "#5C5549" }}
        >
          <div>
            <h3 className="font-semibold text-lg mb-3">Daily Structure</h3>
            <p className="text-lg leading-relaxed">
              Four sessions each day, with breaks in between. Each two-day
              block focuses on one practice, including teaching, initiation,
              and guided practice.
            </p>
          </div>

          <div
            className="bg-stone-50 rounded-xl p-5 text-base"
            style={{ color: "#8C8279" }}
          >
            <p
              className="font-semibold mb-1"
              style={{ color: "#5C5549" }}
            >
              Starting Time by Timezone
            </p>
            <p>
              09:30 IDT (Israel) / 07:30 BST (London) / 02:30 EDT (New
              York) / 16:30 AEST (Sydney)
            </p>
          </div>

          <div>
            <MonitorPlay
              className="mx-auto mb-3 h-8 w-8"
              style={{ color: "#C9A961" }}
            />
            <p className="text-lg leading-relaxed">
              All sessions are recorded and available on a dedicated course
              platform for up to one month after the retreat, so you can
              watch or review them in your own time.
            </p>
          </div>

          <p className="text-sm" style={{ color: "#8C8279" }}>
            Day 1 begins at 2:00 PM Israel Time. Day 6 ends at 3:00 PM Israel
            Time. Each day includes teaching, initiation, guided practice, yoga,
            and meditation.
          </p>

          <p className="text-base" style={{ color: "#8C8279" }}>
            A Zoom link will be sent after registration. A detailed schedule
            will be sent before the retreat.
          </p>
        </div>
      </SectionFrame>

      {/* ── What's Included ── */}
      <WhatsIncluded
        eyebrow="What's Included"
        items={whatsIncluded}
      />

      {/* ── Pricing ── */}
      <div ref={ctaSectionRef}>
        <PricingGrid
          title="Registration"
          subtitle="Join the retreat via Zoom from anywhere in the world"
          tiers={registrationConfig.tiers}
          ctaLabel="Register Now"
          onSelect={() => open()}
          notes={[
            "Secure payment processed via Cardcom.",
            "We want everyone who is interested to be able to participate and benefit from the Dharma. If you would like to join but cannot afford the registration fee due to life circumstances, please contact us at maitreyasanghaisrael@gmail.com",
          ]}
        />
      </div>

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
        bgImage={venuePhoto1}
        title="Join the Healing Retreat"
        body="Six days of deep healing and longevity practices from Tibetan Buddhist Tantra, with three initiations, live on Zoom"
        ctaLabel="Register for the Online Retreat"
        onCtaClick={open}
        footnote="Limited spots available"
      />

      {/* ── Contact ── */}
      <InfoFooter
        contact={{
          heading: "Contact Us",
          label: "For questions and inquiries:",
          email: CONTACT_EMAIL,
        }}
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
        config={registrationConfig}
        copy={registrationCopy}
      />

      {/* ── Payment Status ── */}
      {paymentStatus && (
        <PaymentStatusModal
          status={paymentStatus}
          dir="ltr"
          successTitle="Registration Successful!"
          successBody="Thank you for registering for The Path of Tantric Healing retreat. A confirmation email with details will be sent to you shortly."
          successDetails={{
            heading: "Retreat Details",
            lines: ["June 1-6, 2026", "Live on Zoom"],
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

export default EinGediHealingRetreatEN;
