/**
 * Heart of Wisdom Retreat (English / Zoom)
 * =========================================
 *
 * English version of the Heart of Wisdom Retreat landing page, targeting
 * global audiences joining via Zoom. May 28-30, 2026.
 * Teacher: Lama Glenn Mullin.
 *
 * Language: English (LTR).
 * Attendance: Zoom only (no physical venue).
 * Pricing: Fixed $108 USD (single tier).
 *
 * Composition mirrors the Hebrew page but replaces:
 *   - VenueSection with inline Zoom logistics section
 *   - DanaSection with PricingGrid (single tier)
 *   - All Hebrew copy with English
 *   - Registration fields: no phone/city/rideShare, adds country
 */

import { useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { RetreatLayout } from "@/components/retreat/RetreatLayout";
import { RetreatHero } from "@/components/retreat/RetreatHero";
import { AboutSection } from "@/components/retreat/AboutSection";
import { EmpowermentSection } from "@/components/retreat/EmpowermentSection";
import { TeacherCard } from "@/components/retreat/TeacherCard";
import { WhatsIncluded } from "@/components/retreat/WhatsIncluded";
import { PricingGrid } from "@/components/retreat/PricingGrid";
import { GalleryCarousel } from "@/components/retreat/GalleryCarousel";
import { VideoSection } from "@/components/retreat/VideoSection";
import { FinalCTA } from "@/components/retreat/FinalCTA";
import { InfoFooter } from "@/components/retreat/InfoFooter";
import { MailingListSignup } from "@/components/retreat/MailingListSignup";
import { OtherEvents } from "@/components/retreat/OtherEvents";
import { einGediPromoCard } from "@/assets/ein-gedi-retreat";
import { RegistrationModal } from "@/components/retreat/RegistrationModal";
import { PaymentStatusModal } from "@/components/retreat/PaymentStatusModal";
import { SectionFrame, SectionTitle } from "@/components/retreat/SectionFrame";
import { MonitorPlay } from "lucide-react";
import { useRetreatPurchaseTracking } from "@/components/retreat/hooks/useMetaPixelRetreat";
import { useRetreatSEO } from "@/components/retreat/hooks/useRetreatSEO";
import type { RegistrationConfig, SEOConfig } from "@/components/retreat/types";
import {
  howHero,
  lamaGlennPhoto,
  druponPhoto,
  manjushriImage,
  cloudsBg,
  prayerFlagsBg,
  howGalleryImages,
} from "@/assets/heart-of-wisdom-retreat";

const N8N_WEBHOOK_URL = "https://tknstk.app.n8n.cloud/webhook/HeartOfWisdom_EN_Register";

const CONTACT_EMAIL = "maitreyasanghaisrael@gmail.com";

const seo: SEOConfig = {
  title: "Mahamudra: Heart of Wisdom Retreat with Lama Glenn | May 28-30, 2026 | Maitreya Sangha Israel",
  description:
    "A three-day online retreat exploring the unique wisdom methods of Buddhist Tantra with Lama Glenn Mullin, including a White Manjushri empowerment. Live on Zoom, May 28-30, 2026.",
  keywords:
    "retreat, mahamudra, Buddhism, tantra, Lama Glenn, Manjushri, meditation, wisdom, Maitreya Sangha, Zoom",
  url: "https://maitreya.org.il/p/events/en/heart-of-wisdom-retreat",
  ogImage: "https://maitreya.org.il/p/og-heart-of-wisdom-retreat-en.png",
  locale: "en_US",
};

const registrationConfig: RegistrationConfig = {
  title: "Registration for the Online Retreat",
  subtitle: "Mahamudra: Heart of Wisdom | May 28-30, 2026 | Zoom",
  webhookUrl: N8N_WEBHOOK_URL,
  contentName: "Heart of Wisdom Retreat EN",
  currency: "USD",
  lang: "en",
  dir: "ltr",
  tiers: [
    {
      id: "2026_05_HeartOfWisdom_EN",
      title: "Zoom Participation",
      priceDisplay: "108",
      priceValue: 108,
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
  storagePrefix: "how-en",
  extraPayload: { source: "heart-of-wisdom-en" },
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
  submitFootnote: "After submitting you will be redirected to a secure payment page. Registration is confirmed upon payment.",
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
  "Three days of teaching and practice with Lama Glenn Mullin",
  "White Manjushri empowerment",
  "Practical guidance for Mahamudra meditation",
  "Recordings of all sessions available for up to one month after the retreat",
  "Opportunity to continue practice with Drupon Chongwol-la in a weekly practice group",
];

const HeartOfWisdomRetreatEN = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paymentStatus = searchParams.get("payment") as "success" | "failed" | null;
  const [modalOpen, setModalOpen] = useState(false);
  const ctaSectionRef = useRef<HTMLDivElement>(null);

  useRetreatSEO(seo);

  // Purchase pixel disabled - only Ein Gedi HE fires Purchase to keep
  // campaign optimization signal clean. Re-enable when this page gets its
  // own campaign with a Custom Conversion filter.

  const open = () => {
    window.gtag?.("event", "registration_modal_open", { page: "heart-of-wisdom-en" });
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
      footerText={`\u00A9 ${new Date().getFullYear()} Maitreya Sangha Israel. All rights reserved.`}
    >
      <RetreatHero
        image={howHero}
        imageAlt="Mahamudra - Heart of Wisdom"
        title="Mahamudra - Heart of Wisdom"
        subtitle="Three days of teaching and practice of the unique wisdom methods of Buddhist Tantra, including a White Manjushri empowerment"
        accent="with Lama Glenn"
        dateLine="May 28-30, 2026 | Live on Zoom"
      />

      <AboutSection
        eyebrow="The Direct Path to Freedom"
        softBgImage={cloudsBg}
        ctaLabel="Register for the Online Retreat"
        onCtaClick={open}
        paragraphs={[
          "Buddhism teaches that the root of suffering in our lives comes from identifying with the wrong things - our bodies, thoughts, emotions, and all the ever-changing conditions of life. This mistaken identity, perceived as our \"true self,\" prevents us from recognizing the infinite nature of our consciousness and keeps us in cycles of suffering.",
          "Buddhist Tantra enables us to free ourselves from these mistaken identifications through skillful methods, allowing us to directly recognize and connect with the bliss, luminosity, and spaciousness that are the nature of our mind. In this way we can free ourselves from suffering and act in the world from a basis of compassion, joy, and wisdom.",
          <>
            In this retreat, Lama Glenn will teach the unique wisdom methods of Buddhist Tantra, based on the 18th-century song by the 7th Dalai Lama - <strong>"Entering Emptiness from All Four Directions"</strong>. This song of realization is a practical roadmap for Mahamudra practice - the direct gaze into the nature of mind.
          </>,
          "The retreat will include deep study of the text, practical guidance for meditation, a White Manjushri empowerment - the Buddha of Wisdom - and guided practice throughout the three days.",
          "The retreat is suitable for both beginners and advanced practitioners.",
        ]}
      />

      <EmpowermentSection
        title="White Manjushri Empowerment"
        image={manjushriImage}
        imageAlt="White Manjushri - Buddha of Wisdom"
        paragraphs={[
          "The retreat includes an empowerment of White Manjushri - the supreme Buddha of Wisdom, embodying the wisdom of all Buddhas. The practice of White Manjushri is especially suited for wisdom practices, and assists in the rapid development of clarity and understanding of the nature of reality.",
          "The empowerment opens the gateway to the practice and grants a direct connection to the lineage and its blessings.",
        ]}
      />

      <SectionFrame tone="stone" maxWidth="xl">
        <div
          className="h-px w-64 md:w-80 mx-auto -mt-16 md:-mt-24 mb-16 md:mb-24"
          style={{ backgroundColor: "#C9A961" }}
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
          bio="Drupon Chongwol-la is Lama Glenn's retreat guide and a skilled teacher of Buddhist Tantra and Tummo. Born in South Korea and raised in the USA, he served as a Zen monk for 16 years. Since 2007, he has been practicing Mahayana Tantra under the guidance of his root teacher, Lama Glenn. Drupon Chongwol-la will guide continued practice after the retreat and lead deepening sessions, with the option to join a weekly practice group."
          size="md"
          reversed
        />
      </SectionFrame>

      <SectionFrame tone="cream" maxWidth="lg">
        <SectionTitle className="text-center mb-10">Retreat Schedule</SectionTitle>

        {/* Day cards */}
        <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto mb-10">
          {["Thu, May 28", "Fri, May 29", "Sat, May 30"].map((day, i) => (
            <div
              key={i}
              className="text-center rounded-xl py-5 px-3"
              style={{ backgroundColor: "rgba(201,169,97,0.08)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#C9A961" }}>
                Day {i + 1}
              </p>
              <p className="font-bold text-sm">{day}</p>
            </div>
          ))}
        </div>

        {/* Daily structure */}
        <div className="max-w-lg mx-auto space-y-8 text-center" style={{ color: "#5C5549" }}>
          <div>
            <h3 className="font-semibold text-lg mb-3">Daily Structure</h3>
            <p className="text-lg leading-relaxed">
              Four sessions each day - two in the morning and two in the afternoon, with a lunch break and short breaks in between. The White Manjushri empowerment will take place during the retreat.
            </p>
          </div>

          <div className="bg-stone-50 rounded-xl p-5 text-base" style={{ color: "#8C8279" }}>
            <p className="font-semibold mb-1" style={{ color: "#5C5549" }}>Starting Time by Timezone</p>
            <p>09:30 IDT (Israel) / 07:30 BST (London) / 02:30 EDT (New York) / 16:30 AEST (Sydney)</p>
          </div>

          <div>
            <MonitorPlay className="mx-auto mb-3 h-8 w-8" style={{ color: "#C9A961" }} />
            <p className="text-lg leading-relaxed">
              All sessions are recorded and available on a dedicated course platform for up to one month after the retreat, so you can watch or review them in your own time.
            </p>
          </div>

          <p className="text-base" style={{ color: "#8C8279" }}>
            A Zoom link will be sent after registration. A detailed schedule will be sent before the retreat.
          </p>
        </div>
      </SectionFrame>

      <WhatsIncluded eyebrow="What's Included" items={whatsIncluded} />

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

      <GalleryCarousel
        title="From Our Retreats"
        images={howGalleryImages}
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
        body="Three days of in-depth teaching and practice of the wisdom methods of Buddhist Tantra, with a White Manjushri empowerment, live on Zoom"
        ctaLabel="Register for the Online Retreat"
        onCtaClick={open}
        footnote="Limited spots available"
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
            image: einGediPromoCard,
            imageAlt: "The Path of Tantric Healing",
            title: "The Path of Tantric Healing",
            dateLabel: "June 1-6, 2026",
            endDate: "2026-06-06",
            description: "Six days of deep healing and longevity practices from the Tibetan Buddhist Tantric tradition",
            ctaLabel: "Learn More",
            href: "/events/en/ein-gedi-healing-retreat",
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
        config={registrationConfig}
        copy={registrationCopy}
      />

      {paymentStatus && (
        <PaymentStatusModal
          status={paymentStatus}
          dir="ltr"
          successTitle="Registration Successful!"
          successBody="Thank you for registering for the Mahamudra: Heart of Wisdom retreat. A confirmation email with details will be sent to you shortly."
          successDetails={{
            heading: "Retreat Details",
            lines: ["May 28-30, 2026", "Live on Zoom"],
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

export default HeartOfWisdomRetreatEN;
