/**
 * Support the December 2026 visit (English / LTR) - donations only
 * ================================================================
 *
 * The English twin of SupportVisitDec2026.tsx, cut down to the one ask that
 * makes sense from abroad: a donation in US dollars towards the costs of the
 * visit. The volunteering form stays Hebrew-only - the hands are needed in
 * Israel (Shahaf, 2026-09-21).
 *
 * Dana: the shared `RegistrationModal` in donation mode - fixed dollar amounts
 *   plus a free one - -> n8n `Visit_Dana_EN` -> Cardcom (USD, English payment
 *   page and receipt) -> `Visit_Dana_EN_Paid` -> the `visit_dana_usd` tab +
 *   an email to the sangha inbox.
 *
 * Deliberately NOT mentioning tax relief / section 46: the עמותה does not have
 * that approval (Shahaf, 2026-09-16), so the page must not imply it.
 *
 * Linked from the English December newsletter. Tied to this visit, not a
 * standing appeal; the permanent English dana page is /en/dana.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { HeartHandshake } from "lucide-react";
import { SiteLayout } from "@/site/SiteLayout";
import { RegistrationModal } from "@/components/retreat/RegistrationModal";
import type { RegistrationConfig } from "@/components/retreat/types";

const SEO = {
  title: "Support Lama Glenn's Visit to Israel - December 2026 | Maitreya Sangha Israel",
  description:
    "Lama Glenn Mullin and Drupon Chongwol-la's visit to Israel in December 2026 is organised entirely by volunteers. Your donation helps make the visit possible.",
};

const DANA_WEBHOOK = "https://tknstk.app.n8n.cloud/webhook/Visit_Dana_EN";

/**
 * Donation form, in US dollars. Tier ids are the codes n8n charges by; the
 * amounts live in `Visit_Dana_EN` as well - change both.
 */
const danaConfig: RegistrationConfig = {
  title: "Donate to the Visit",
  subtitle: "Lama Glenn's visit to Israel | December 2026",
  webhookUrl: DANA_WEBHOOK,
  contentName: "Visit Dana December 2026 EN",
  currency: "USD",
  lang: "en",
  dir: "ltr",
  // The modal renders each option as "title - price", so the title is the word,
  // not the number (or it reads "$50 - $50").
  tiers: [
    { id: "VISIT_DANA_USD_25", title: "Donation", priceDisplay: "25", priceValue: 25, currencySymbol: "$" },
    { id: "VISIT_DANA_USD_50", title: "Donation", priceDisplay: "50", priceValue: 50, currencySymbol: "$" },
    { id: "VISIT_DANA_USD_100", title: "Donation", priceDisplay: "100", priceValue: 100, currencySymbol: "$" },
    { id: "VISIT_DANA_USD_180", title: "Donation", priceDisplay: "180", priceValue: 180, currencySymbol: "$" },
    { id: "VISIT_DANA_USD_250", title: "Donation", priceDisplay: "250", priceValue: 250, currencySymbol: "$" },
    { id: "VISIT_DANA_USD_500", title: "Donation", priceDisplay: "500", priceValue: 500, currencySymbol: "$" },
    {
      id: "VISIT_DANA_USD_OPEN",
      title: "Other amount",
      note: "Any amount, as you are able",
      openAmount: true,
      openAmountMin: 1,
      openAmountMax: 20000,
      openAmountLabel: "Donation amount (USD)",
      priceDisplay: "",
      priceValue: 0,
      currencySymbol: "$",
    },
  ],
  showTierSelect: true,
  tierSelectLabel: "Donation amount",
  // Nothing links to it (the consent line is plain text), but the shared
  // config requires a value.
  termsUrl: "https://maitreya.org.il/en/dana",
  askPhone: true,
  phoneInternational: true,
  storagePrefix: "visitdana26en",
  extraPayload: { source: "support-visit-dec-2026-en" },
  embedPayment: true,
};

/** Donation wording. Same modal as the retreats, but nobody is registering for anything. */
const danaCopy = {
  tierSelectPlaceholder: "Choose an amount",
  firstNameLabel: "First Name",
  firstNamePlaceholder: "First name",
  lastNameLabel: "Last Name",
  lastNamePlaceholder: "Last name",
  emailLabel: "Email",
  phoneLabel: "Phone (digits only, including country code)",
  phonePlaceholder: "15551234567",
  messageLabel: "Message (optional)",
  messagePlaceholder: "Anything you'd like to share with us?",
  // One plain sentence, no link - an empty termsLinkLabel skips the link.
  termsPrefix: "I agree to receive updates from Maitreya Sangha Israel",
  termsLinkLabel: "",
  termsSuffix: "",
  submitLabel: "Proceed to Donate",
  submittingLabel: "Submitting...",
  submitFootnote: "Payment is completed here on the page, on a secure checkout.",
  amountLabel: "Donation amount (USD)",
  amountNote: "Any amount, as you are able.",
  errAmount: "Please enter an amount",
  errAmountRange: "Please enter a whole number between 1 and 20,000",
  paymentTitle: "Donate to the Visit",
  paymentNote:
    "Donations are collected by Maitreya Sangha Israel (a registered non-profit) through Cardcom, in US dollars, by credit card. A receipt is sent to the email you entered.",
  errTier: "Please choose an amount",
  errFname: "First name is required",
  errLname: "Last name is required",
  errEmail: "Email is required",
  errEmailInvalid: "Please enter a valid email address",
  errEmailTooLong: "That address is too long for our payment provider - please use a shorter one",
  errPhone: "Phone is required",
  errPhoneInvalid: "Please enter a valid phone number",
  errConfirmed: "Please confirm",
  errServer: "Server error, please try again",
  errNoPaymentUrl: "No payment link received",
  // Fields the donation form never shows. The shared copy type wants them all,
  // so they carry the standard strings and simply never render.
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
  cityLabel: "City",
  cityPlaceholder: "Where do you live?",
  rideShareLabel: "I can offer a ride",
  countryLabel: "Country",
  countryPlaceholder: "Your country of residence",
  errGender: "Please select gender",
  errFood: "Please select food preference",
  errPrevExp: "Please select your experience level",
  errCity: "City is required",
  errCountry: "Country is required",
  errGeneric: "Error submitting the form",
};

const SupportVisitDec2026EN = () => {
  const [danaOpen, setDanaOpen] = useState(false);

  return (
    <SiteLayout
      lang="en"
      title={SEO.title}
      description={SEO.description}
      path="/en/support-visit-dec-2026"
    >
      <article className="container max-w-3xl py-16">
        <h1 className="font-heading text-4xl font-bold text-primary mb-10">
          Support Lama Glenn's Visit to Israel - December 2026
        </h1>

        <div className="prose prose-lg max-w-none font-body prose-headings:font-heading prose-headings:text-primary prose-a:text-accent hover:prose-a:text-secondary">
          <p>
            The visit of Lama Glenn Mullin and Drupon Chongwol-la to Israel is a large
            undertaking: two retreats, participants from across the country and from
            abroad, flights and accommodation, venues, equipment, translation, sound,
            insurance, and everything else it takes for the teachings to happen.
          </p>
          <p>
            All of it is done by volunteers, with love - members of the community who give
            their time so that the Dharma can reach here.
          </p>
          <p>
            Every contribution, large or small, is needed and appreciated - a direct
            offering to the Dharma and to work dedicated to all living beings.
          </p>
        </div>

        {/* ── Dana ── */}
        <section id="dana" className="mt-12 scroll-mt-24">
          <h2 className="font-heading text-3xl font-bold text-primary mb-4 flex items-center gap-3">
            <HeartHandshake className="h-7 w-7" aria-hidden />
            Dana - Donate to the Visit
          </h2>
          <div className="prose prose-lg max-w-none font-body prose-headings:font-heading prose-headings:text-primary prose-a:text-accent hover:prose-a:text-secondary">
            <p>
              A visit like this carries many costs: the teachers' flights and lodging,
              insurance, venue rental, translation, equipment, refreshments and food, and
              more.
            </p>
            <p>
              We try to hold everything on dana, and where that is not possible, at cost -
              and sometimes below cost - so that the teachings stay accessible to everyone
              who wishes to learn and practice.
            </p>
            <p>
              Your donation is what makes this visit possible in practice. Any amount, as
              you are able.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDanaOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg px-8 py-3 font-body text-lg text-white"
            style={{ background: "#b51a00" }}
          >
            Donate
          </button>
          <p className="mt-3 text-sm opacity-75 font-body">
            Secure payment in US dollars by credit card. A receipt is emailed to you.
          </p>
        </section>

        <div className="prose prose-lg max-w-none font-body prose-headings:font-heading prose-headings:text-primary prose-a:text-accent hover:prose-a:text-secondary mt-14">
          <p>
            Thank you for every gift. It is what allows the Dharma to reach here and to keep
            flourishing.
          </p>
          <p className="text-base opacity-75">
            The visit is organised entirely by volunteers, with love, by Maitreya Sangha
            Israel - the Israeli student community of Lama Glenn Mullin.
          </p>
          <p className="text-base">
            <Link to="/en/events" className="underline underline-offset-4">
              The full programme of the visit
            </Link>
          </p>
        </div>
      </article>

      <RegistrationModal open={danaOpen} onOpenChange={setDanaOpen} config={danaConfig} copy={danaCopy} />
    </SiteLayout>
  );
};

export default SupportVisitDec2026EN;
