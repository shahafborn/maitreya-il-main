import { useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RETREAT_THEME, RETREAT_FONTS } from "./theme";
import { fireInitiateCheckout } from "./hooks/useMetaPixelRetreat";
import type { RegistrationConfig } from "./types";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

interface RegistrationModalCopy {
  /** Dialog eyebrow under the title (optional; defaults to config.subtitle). */
  tierSelectPlaceholder: string;
  firstNameLabel: string;
  firstNamePlaceholder: string;
  lastNameLabel: string;
  lastNamePlaceholder: string;
  emailLabel: string;
  phoneLabel: string;
  phonePlaceholder: string;
  /** Gender field (optional). */
  genderLabel: string;
  genderMale: string;
  genderFemale: string;
  foodLabel: string;
  foodRegular: string;
  foodVegetarian: string;
  foodVegan: string;
  foodPlaceholder: string;
  prevExpLabel: string;
  prevExpPlaceholder: string;
  prevExpExtensive: string;
  prevExpIntermediate: string;
  prevExpLimited: string;
  prevExpNone: string;
  messageLabel: string;
  messagePlaceholder: string;
  /** City field (optional). */
  cityLabel?: string;
  cityPlaceholder?: string;
  /** Country field (optional). */
  countryLabel?: string;
  countryPlaceholder?: string;
  /** Ride-share checkbox label (optional). */
  rideShareLabel?: string;
  /** Confirmation checkbox body text (can include <a> via dangerouslySetInnerHTML-safe pattern). */
  termsPrefix: string;
  termsLinkLabel: string;
  termsSuffix: string;
  submitLabel: string;
  submittingLabel: string;
  submitFootnote: string;
  /** Error messages. */
  errTier: string;
  errFname: string;
  errLname: string;
  errEmail: string;
  errEmailInvalid: string;
  errPhone: string;
  errPhoneInvalid: string;
  errGender: string;
  errFood: string;
  errPrevExp: string;
  errCity?: string;
  errCountry?: string;
  errConfirmed: string;
  /** Error for the follow-up select (falls back to errTier). */
  errVariant?: string;
  /** Label for the open-amount field (e.g. "סכום הדאנה"). */
  amountLabel?: string;
  /** Helper line under it (e.g. "כל סכום, כפי יכולתכם"). */
  amountNote?: string;
  errAmount?: string;
  errAmountRange?: string;
  errServer: string;
  errNoPaymentUrl: string;
  errGeneric: string;
  /** Embedded payment view (only used when config.embedPayment is on). */
  paymentTitle?: string;
  paymentNote?: string;
}

/**
 * Visible height of the embedded Cardcom frame. Tall enough to hold their whole
 * form including the pay button, so nothing is stranded out of reach; the dialog
 * itself scrolls.
 */
const PAYMENT_FRAME_HEIGHT = 900;
/**
 * How much of the top of Cardcom's page to hide: their white band plus the
 * repeat of the business name, which duplicates our own heading above it.
 * Measured against the live page - re-check if Cardcom changes their layout.
 */
const PAYMENT_FRAME_CROP_TOP = 205;

interface RegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional pre-selected tier id. */
  preselectedTierId?: string;
  config: RegistrationConfig;
  copy: RegistrationModalCopy;
}

/**
 * Generic registration + payment handoff modal.
 *
 * Flow:
 *   validate → fire InitiateCheckout pixel → POST to n8n webhook →
 *   receive { cardcom_url } → redirect user to Cardcom payment page.
 *
 * All copy is passed via the `copy` prop so this modal is language-agnostic.
 * Config controls which fields are shown, which tiers are offered, and where
 * the webhook lives.
 *
 * @see PaymentStatusModal for the return-side dialog after Cardcom redirects back.
 */
export const RegistrationModal = ({
  open,
  onOpenChange,
  preselectedTierId,
  config,
  copy,
}: RegistrationModalProps) => {
  // Tiers marked `variantOf` are follow-up choices, not top-level ones, and
  // `hidden` ones are not offered at all - they arrive preselected from a link.
  const topTiers = config.tiers.filter((t) => !t.variantOf && !t.hidden);
  const singleTier = topTiers.length === 1;
  const [tierId, setTierId] = useState<string>(preselectedTierId ?? (singleTier ? topTiers[0].id : ""));
  const [variantId, setVariantId] = useState("");
  /** Only used by tiers marked openAmount: the sum the payer types. */
  const [amount, setAmount] = useState("");
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [foodPref, setFoodPref] = useState("");
  const [prevExp, setPrevExp] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [canOfferRide, setCanOfferRide] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  /** Set only when config.embedPayment is on: the Cardcom page shown in-place. */
  const [paymentUrl, setPaymentUrl] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const paymentScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      // Closing the dialog drops the payment page, so reopening starts clean.
      setPaymentUrl("");
      return;
    }
    setTierId(preselectedTierId ?? (singleTier ? topTiers[0].id : ""));
    setVariantId("");
    setAmount("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preselectedTierId, singleTier, config.tiers]);

  // The payment step must open at the top. The Cardcom frame focuses its card
  // field a moment after it loads, and the browser scrolls to that - so reset
  // once now and once after the frame has settled.
  useEffect(() => {
    if (!paymentUrl) return;
    const toTop = () => paymentScrollRef.current?.scrollTo({ top: 0 });
    toTop();
    const t = window.setTimeout(toTop, 800);
    return () => window.clearTimeout(t);
  }, [paymentUrl]);

  /** The follow-up options for whatever is chosen in the first select. */
  const variants = config.tiers.filter((t) => t.variantOf === tierId);
  /** The tier chosen in the first select, whether or not it is offered there. */
  const parentTier = config.tiers.find((t) => t.id === tierId);
  /**
   * A hidden tier reached by link. The first select is replaced by a plain
   * line naming it, since it is not one choice among several - it is the only
   * thing this link does.
   */
  const lockedTier = parentTier?.hidden ? parentTier : undefined;
  /** Variants inherit openAmount from their parent rather than repeating it. */
  const openAmount = Boolean(parentTier?.openAmount);
  const amountMin = parentTier?.openAmountMin ?? 1;
  const amountMax = parentTier?.openAmountMax ?? 100000;
  /** What actually gets submitted: the follow-up choice when there is one. */
  const effectiveTier =
    (variants.length > 0
      ? config.tiers.find((t) => t.id === variantId)
      : config.tiers.find((t) => t.id === tierId)) ?? config.tiers[0];

  const scrollToField = (el: HTMLElement | null) => {
    if (!el) return;
    const container = scrollContainerRef.current;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const offset = elRect.top - containerRect.top + container.scrollTop - containerRect.height / 3;
      container.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
    }
    setTimeout(() => {
      if (el instanceof HTMLSelectElement || el instanceof HTMLInputElement) el.focus();
    }, 350);
  };

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isValidPhone = (v: string) =>
    config.phoneInternational
      ? /^\d{7,15}$/.test(v)
      : /^0[2-9]\d{7,8}$/.test(v.replace(/[-\s]/g, ""));

  const validateAndScroll = (): boolean => {
    const errors: Record<string, string> = {};
    if (config.showTierSelect && !tierId) errors.tierId = copy.errTier;
    if (variants.length > 0 && !variantId) errors.variantId = copy.errVariant ?? copy.errTier;
    if (openAmount) {
      const n = Number(amount);
      if (!amount.trim()) errors.amount = copy.errAmount ?? "";
      else if (!Number.isFinite(n) || !Number.isInteger(n) || n < amountMin || n > amountMax)
        errors.amount = copy.errAmountRange ?? "";
    }
    if (!fname.trim()) errors.fname = copy.errFname;
    if (!lname.trim()) errors.lname = copy.errLname;
    if (!email.trim()) errors.email = copy.errEmail;
    else if (!isValidEmail(email)) errors.email = copy.errEmailInvalid;
    if (config.askPhone !== false) {
      if (!phone.trim()) errors.phone = copy.errPhone;
      else if (!isValidPhone(phone)) errors.phone = copy.errPhoneInvalid;
    }
    if (config.askGender && !gender) errors.gender = copy.errGender;
    if (config.askFoodPref && !foodPref) errors.foodPref = copy.errFood;
    if (config.askPrevExp && !prevExp) errors.prevExp = copy.errPrevExp;
    if (config.askCity && !city.trim()) errors.city = copy.errCity ?? "";
    if (config.askCountry && !country.trim()) errors.country = copy.errCountry ?? "";
    if (!confirmed) errors.confirmed = copy.errConfirmed;

    setFieldErrors(errors);
    setError("");

    if (Object.keys(errors).length > 0) {
      const fieldOrder = ["tierId", "amount", "fname", "lname", "email", "phone", "gender", "foodPref", "prevExp", "city", "country", "confirmed"];
      const firstErrorKey = fieldOrder.find((k) => errors[k]);
      if (firstErrorKey) {
        const el = formRef.current?.querySelector(`[data-field='${firstErrorKey}']`) as HTMLElement;
        scrollToField(el);
      }
      return false;
    }
    return true;
  };

  const fieldErrorClass = (field: string) =>
    fieldErrors[field] ? "border-red-400 ring-1 ring-red-400" : "";
  const FieldError = ({ field }: { field: string }) =>
    fieldErrors[field] ? <p className="text-xs text-red-500 mt-1">{fieldErrors[field]}</p> : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    if (!validateAndScroll()) return;

    const selectedTier = effectiveTier;
    window.gtag?.("event", "registration_submitted", { tier: selectedTier.id });

    const regToken = crypto.randomUUID();
    fireInitiateCheckout({
      regToken,
      // For an open amount the tier carries no price, so the typed sum is what
      // the pixel should report as the value of this checkout.
      value: openAmount ? Number(amount) : selectedTier.priceValue,
      tierId: selectedTier.id,
      contentName: config.contentName,
      storagePrefix: config.storagePrefix,
    });

    setSubmitting(true);
    try {
      const res = await fetch(config.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reg_token: regToken,
          field_event: selectedTier.id,
          // n8n charges this number when the option's table entry has no fixed
          // amount. It re-checks the range there: this value is client-supplied.
          ...(openAmount && { amount: Number(amount) }),
          full_name: `${fname} ${lname}`.trim(),
          email,
          ...(config.askPhone !== false && { phone }),
          ...(config.askCountry && { country }),
          ...(config.askGender && { gender }),
          ...(config.askFoodPref && { food_pref: foodPref }),
          ...(config.askPrevExp && { prev_exp: prevExp }),
          ...(config.askCity && { city }),
          ...(config.askRideShare && { can_offer_ride: canOfferRide }),
          message,
          ...(config.extraPayload ?? {}),
        }),
      });
      if (!res.ok) throw new Error(copy.errServer);
      // If the page provides a static Cardcom URL, skip the dynamic cardcom_url
      // from n8n and redirect directly. Otherwise expect cardcom_url in the response.
      if (config.staticPaymentUrl) {
        window.gtag?.("event", "payment_redirect", { tier: selectedTier.id });
        window.location.href = config.staticPaymentUrl;
      } else {
        const data = await res.json();
        if (data.cardcom_url) {
          window.gtag?.("event", "payment_redirect", { tier: selectedTier.id });
          if (config.embedPayment) {
            // Stay on our page: the Cardcom fields open inside the dialog.
            setPaymentUrl(data.cardcom_url);
          } else {
            window.location.href = data.cardcom_url;
          }
        } else {
          throw new Error(copy.errNoPaymentUrl);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.errGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-lg border border-stone-300 bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#C9A961] focus:border-transparent transition-shadow";
  const selectClass = `${inputClass} appearance-none pr-10`;
  const labelClass = "block text-sm font-semibold mb-1.5 text-stone-700";

  const SelectWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="relative">
      {children}
      <ChevronDown
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
        style={{ color: RETREAT_THEME.WARM_GRAY }}
      />
    </div>
  );

  const selectedTier = effectiveTier;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={config.dir}
        className="max-w-lg md:max-w-2xl max-h-[90vh] p-0 gap-0 rounded-xl border-0 overflow-hidden"
        style={{ fontFamily: RETREAT_FONTS.sans }}
      >
        {paymentUrl ? (
          <div ref={paymentScrollRef} className="max-h-[90vh] overflow-y-auto">
            {/*
              Sticky, because the Cardcom frame puts the cursor in the card field
              as it loads and the browser scrolls to it - which on a phone pushed
              what you are paying for off the top of the screen. Sticky keeps the
              amount in sight however far down the form you are.
              The close button is pinned to the physical right, which in an RTL
              dialog is where the heading starts - hence the extra start padding.
            */}
            <div
              className="px-6 ps-12 pt-6 pb-5 sticky top-0 z-10 border-b border-stone-200"
              style={{ backgroundColor: RETREAT_THEME.CREAM }}
            >
              <DialogHeader className="sr-only">
                <DialogTitle>{copy.paymentTitle ?? config.title}</DialogTitle>
                <DialogDescription>{config.subtitle}</DialogDescription>
              </DialogHeader>

              {/* What they are paying for, in our own words and at full size -
                  on Cardcom's own page this is a small line in a side panel. */}
              <p
                className="text-xs font-semibold tracking-wide mb-2"
                style={{ color: RETREAT_THEME.GOLD_DARK }}
              >
                {copy.paymentTitle ?? config.title}
              </p>
              <div className="flex items-baseline justify-between gap-4">
                <h2
                  className="text-2xl md:text-[1.75rem] font-bold leading-tight"
                  style={{ fontFamily: RETREAT_FONTS.serif, color: RETREAT_THEME.DARK }}
                >
                  {selectedTier.title}
                </h2>
                <p
                  className="text-2xl font-bold whitespace-nowrap"
                  style={{ fontFamily: RETREAT_FONTS.serif, color: RETREAT_THEME.GOLD_DARK }}
                >
                  {selectedTier.priceDisplay}
                  {selectedTier.currencySymbol ?? ""}
                </p>
              </div>
              {selectedTier.note && (
                <p className="text-sm mt-1.5" style={{ color: RETREAT_THEME.WARM_GRAY }}>
                  {selectedTier.note}
                </p>
              )}
            </div>

            {/*
              Cardcom's page opens with a band of white space and a repeat of the
              business name, which reads as a gap under our own heading. We cannot
              restyle a page on their domain, so the frame is made taller than its
              window and pulled up by the same amount, hiding that band. The frame's
              own footer (total + pay button) sits at the bottom of its window, so it
              stays exactly where it was.
            */}
            <div className="overflow-hidden" style={{ height: PAYMENT_FRAME_HEIGHT }}>
              <iframe
                src={paymentUrl}
                title={copy.paymentTitle ?? config.title}
                className="w-full border-0 block"
                style={{
                  height: PAYMENT_FRAME_HEIGHT + PAYMENT_FRAME_CROP_TOP,
                  marginTop: -PAYMENT_FRAME_CROP_TOP,
                }}
                /* Lets the Google Pay / Apple Pay buttons run inside the frame. */
                allow="payment"
              />
            </div>

            {copy.paymentNote && (
              <p className="px-6 pb-5 text-xs text-center" style={{ color: RETREAT_THEME.WARM_GRAY }}>
                {copy.paymentNote}
              </p>
            )}
          </div>
        ) : (
        <div ref={scrollContainerRef} className="max-h-[90vh] overflow-y-auto">
          <div className="px-6 pt-6 pb-4 border-b border-stone-200 sticky top-0 bg-white z-10 rounded-t-xl">
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle
                className="text-2xl font-bold"
                style={{ fontFamily: RETREAT_FONTS.serif, color: RETREAT_THEME.DARK }}
              >
                {config.title}
              </DialogTitle>
              <DialogDescription className="text-sm mt-1" style={{ color: RETREAT_THEME.WARM_GRAY }}>
                {config.subtitle}
              </DialogDescription>
            </DialogHeader>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} noValidate className="px-6 py-5 space-y-4">
            {config.showTierSelect && (
              <div data-field="tierId">
                <label className={labelClass}>{config.tierSelectLabel} *</label>
                {/* A hidden tier arrives preselected from a link, so there is
                    nothing to choose between - name it and move on. */}
                {lockedTier ? (
                  <p
                    className="text-sm py-2"
                    style={{ color: RETREAT_THEME.MAROON }}
                  >
                    {lockedTier.title}
                  </p>
                ) : (
                  <SelectWrapper>
                    <select
                      value={tierId}
                      onChange={(e) => {
                        setTierId(e.target.value);
                        setVariantId("");
                        setFieldErrors((p) => ({ ...p, tierId: "", variantId: "" }));
                      }}
                      className={`${selectClass} ${fieldErrorClass("tierId")}`}
                    >
                      <option value="">{copy.tierSelectPlaceholder}</option>
                      {topTiers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                          {t.priceDisplay ? ` - ${t.priceDisplay}${t.currencySymbol ?? ""}` : ""}
                        </option>
                      ))}
                    </select>
                  </SelectWrapper>
                )}
                <FieldError field="tierId" />
                {/* Whatever the chosen option still needs answering - for the
                    three-month dana, how many payments to split it into. */}
                {variants.length > 0 && (
                  <div data-field="variantId" className="mt-4">
                    <label className={labelClass}>{config.variantSelectLabel} *</label>
                    <SelectWrapper>
                      <select
                        value={variantId}
                        onChange={(e) => {
                          setVariantId(e.target.value);
                          setFieldErrors((p) => ({ ...p, variantId: "" }));
                        }}
                        className={`${selectClass} ${fieldErrorClass("variantId")}`}
                      >
                        <option value="">{copy.tierSelectPlaceholder}</option>
                        {variants.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.variantLabel ?? v.title}
                          </option>
                        ))}
                      </select>
                    </SelectWrapper>
                    <FieldError field="variantId" />
                  </div>
                )}
                {openAmount && (
                  <div data-field="amount" className="mt-4">
                    <label className={labelClass}>{copy.amountLabel} *</label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={amount}
                        onChange={(e) => {
                          // Digits only: a stray character here becomes a
                          // rejected charge two steps later.
                          setAmount(e.target.value.replace(/[^\d]/g, ""));
                          setFieldErrors((p) => ({ ...p, amount: "" }));
                        }}
                        className={`${inputClass} ${fieldErrorClass("amount")}`}
                        placeholder={String(amountMin)}
                      />
                      {parentTier?.currencySymbol && (
                        <span
                          className="absolute inset-y-0 left-3 flex items-center text-sm pointer-events-none"
                          style={{ color: RETREAT_THEME.WARM_GRAY }}
                        >
                          {parentTier.currencySymbol}
                        </span>
                      )}
                    </div>
                    <FieldError field="amount" />
                    {copy.amountNote && (
                      <p className="text-xs mt-1" style={{ color: RETREAT_THEME.WARM_GRAY }}>
                        {copy.amountNote}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div data-field="fname">
                <label className={labelClass}>{copy.firstNameLabel} *</label>
                <input
                  type="text"
                  value={fname}
                  onChange={(e) => {
                    setFname(e.target.value);
                    setFieldErrors((p) => ({ ...p, fname: "" }));
                  }}
                  className={`${inputClass} ${fieldErrorClass("fname")}`}
                  placeholder={copy.firstNamePlaceholder}
                />
                <FieldError field="fname" />
              </div>
              <div data-field="lname">
                <label className={labelClass}>{copy.lastNameLabel} *</label>
                <input
                  type="text"
                  value={lname}
                  onChange={(e) => {
                    setLname(e.target.value);
                    setFieldErrors((p) => ({ ...p, lname: "" }));
                  }}
                  className={`${inputClass} ${fieldErrorClass("lname")}`}
                  placeholder={copy.lastNamePlaceholder}
                />
                <FieldError field="lname" />
              </div>
            </div>

            <div data-field="email">
              <label className={labelClass}>{copy.emailLabel} *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFieldErrors((p) => ({ ...p, email: "" }));
                }}
                className={`${inputClass} ${fieldErrorClass("email")}`}
                placeholder="your@email.com"
                dir="ltr"
                style={{ textAlign: "left" }}
              />
              <FieldError field="email" />
            </div>

            {config.askPhone !== false && (
              <div data-field="phone">
                <label className={labelClass}>{copy.phoneLabel} *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    const val = config.phoneInternational
                      ? e.target.value.replace(/\D/g, "")
                      : e.target.value;
                    setPhone(val);
                    setFieldErrors((p) => ({ ...p, phone: "" }));
                  }}
                  className={`${inputClass} ${fieldErrorClass("phone")}`}
                  placeholder={copy.phonePlaceholder}
                  dir="ltr"
                  style={{ textAlign: "left" }}
                />
                <FieldError field="phone" />
              </div>
            )}

            {(config.askGender || config.askFoodPref) && (
              <div className="grid grid-cols-2 gap-3">
                {config.askGender && (
                  <div data-field="gender">
                    <label className={labelClass}>{copy.genderLabel} *</label>
                    <div
                      className={`flex gap-4 mt-2 p-2 rounded-lg ${fieldErrors.gender ? "ring-1 ring-red-400" : ""}`}
                    >
                      {[
                        { value: "male", label: copy.genderMale },
                        { value: "female", label: copy.genderFemale },
                      ].map((opt) => (
                        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="gender"
                            value={opt.value}
                            checked={gender === opt.value}
                            onChange={(e) => {
                              setGender(e.target.value);
                              setFieldErrors((p) => ({ ...p, gender: "" }));
                            }}
                            className="h-4 w-4 accent-[#C9A961]"
                          />
                          <span className="text-sm">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                    <FieldError field="gender" />
                  </div>
                )}
                {config.askFoodPref && (
                  <div data-field="foodPref">
                    <label className={labelClass}>{copy.foodLabel} *</label>
                    <SelectWrapper>
                      <select
                        value={foodPref}
                        onChange={(e) => {
                          setFoodPref(e.target.value);
                          setFieldErrors((p) => ({ ...p, foodPref: "" }));
                        }}
                        className={`${selectClass} ${fieldErrorClass("foodPref")}`}
                      >
                        <option value="">{copy.foodPlaceholder}</option>
                        <option value="regular">{copy.foodRegular}</option>
                        <option value="vegetarian">{copy.foodVegetarian}</option>
                        <option value="vegan">{copy.foodVegan}</option>
                      </select>
                    </SelectWrapper>
                    <FieldError field="foodPref" />
                  </div>
                )}
              </div>
            )}

            {config.askPrevExp && (
              <div data-field="prevExp">
                <label className={labelClass}>{copy.prevExpLabel} *</label>
                <SelectWrapper>
                  <select
                    value={prevExp}
                    onChange={(e) => {
                      setPrevExp(e.target.value);
                      setFieldErrors((p) => ({ ...p, prevExp: "" }));
                    }}
                    className={`${selectClass} ${fieldErrorClass("prevExp")}`}
                  >
                    <option value="">{copy.prevExpPlaceholder}</option>
                    <option value="extensive">{copy.prevExpExtensive}</option>
                    <option value="intermediate">{copy.prevExpIntermediate}</option>
                    <option value="limited">{copy.prevExpLimited}</option>
                    <option value="none">{copy.prevExpNone}</option>
                  </select>
                </SelectWrapper>
                <FieldError field="prevExp" />
              </div>
            )}

            {config.askCity && (
              <div data-field="city">
                <label className={labelClass}>
                  {copy.cityLabel} *
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setFieldErrors((p) => ({ ...p, city: "" }));
                  }}
                  className={`${inputClass} ${fieldErrorClass("city")}`}
                  placeholder={copy.cityPlaceholder}
                />
                <FieldError field="city" />
              </div>
            )}

            {config.askCountry && (
              <div data-field="country">
                <label className={labelClass}>
                  {copy.countryLabel} *
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    setFieldErrors((p) => ({ ...p, country: "" }));
                  }}
                  className={`${inputClass} ${fieldErrorClass("country")}`}
                  placeholder={copy.countryPlaceholder}
                />
                <FieldError field="country" />
              </div>
            )}

            {config.askRideShare && (
              <label className="flex items-start gap-3 cursor-pointer p-3 -mx-3 rounded-lg hover:bg-stone-50 transition-colors">
                <input
                  type="checkbox"
                  checked={canOfferRide}
                  onChange={(e) => setCanOfferRide(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-stone-300 accent-[#C9A961]"
                />
                <span className="text-sm" style={{ color: RETREAT_THEME.BODY }}>
                  {copy.rideShareLabel}
                </span>
              </label>
            )}

            <div>
              <label className={labelClass}>{copy.messageLabel}</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={`${inputClass} resize-none`}
                rows={3}
                placeholder={copy.messagePlaceholder}
              />
            </div>

            <div data-field="confirmed">
              <label
                className={`flex items-start gap-3 cursor-pointer p-3 -mx-3 rounded-lg hover:bg-stone-50 transition-colors ${
                  fieldErrors.confirmed ? "ring-1 ring-red-400 rounded-lg" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => {
                    setConfirmed(e.target.checked);
                    setFieldErrors((p) => ({ ...p, confirmed: "" }));
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-stone-300 accent-[#C9A961]"
                />
                <span
                  className="text-xs leading-relaxed"
                  style={{ color: RETREAT_THEME.WARM_GRAY }}
                >
                  {copy.termsPrefix}{" "}
                  <a
                    href={config.termsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-1 underline-offset-2 hover:text-[#C9A961]"
                  >
                    {copy.termsLinkLabel}
                  </a>{" "}
                  {copy.termsSuffix}
                </span>
              </label>
              <FieldError field="confirmed" />
            </div>

            {error && !Object.values(fieldErrors).some(Boolean) && (
              <p className="text-sm text-red-600 text-center font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 text-lg font-bold text-white rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2"
              style={{ backgroundColor: RETREAT_THEME.GOLD }}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {copy.submittingLabel}
                </>
              ) : (
                copy.submitLabel
              )}
            </button>

            <p className="text-xs text-center" style={{ color: RETREAT_THEME.WARM_GRAY }}>
              {copy.submitFootnote}
            </p>
          </form>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
