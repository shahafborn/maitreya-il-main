# Retreat component library

Shared UI building blocks for retreat landing pages (Heart of Wisdom, Ein Gedi English, future retreats).

## Purpose

`src/pages/EinGediRetreatV2.tsx` is a 1,358-line monolith that ships payment, pixel tracking, Mailchimp, a custom carousel and an Esalen-inspired design. It's production-frozen. Instead of copy-pasting it for every new retreat (Hebrew + English × multiple retreats = thousands of lines of drift-prone duplication), this folder contains the same sections extracted as props-driven, language-agnostic components that new pages compose.

**Frozen reference:** `src/pages/EinGediRetreatV2.tsx` — do not modify. Use it only as the source of truth for visual parity during extraction.

## Directory map

```
src/components/retreat/
  theme.ts                      Shared design tokens (colors, fonts)
  types.ts                      Shared TS types (Teacher, ScheduleDay, PricingTier, SEOConfig, RegistrationConfig)
  RetreatLayout.tsx             Outer wrapper: sticky nav, fonts, dir/lang, footer, SEO hook
  RetreatHero.tsx               Full-width hero image + overlay + title/subtitle/date
  SectionFrame.tsx              Cream/stone section wrapper + SectionTitle/SectionEyebrow helpers
  AboutSection.tsx              Frosted panel over bg photo with paragraphs
  TeacherCard.tsx               Photo + bio block (with `reversed` prop for alternating sides)
  EmpowermentSection.tsx        Short highlighted section with optional image
  ScheduleBlock.tsx             Day list with times and notes
  VenueSection.tsx              Photo-bg venue section (+ optional accessibility list / photo grid)
  WhatsIncluded.tsx             Dark photo-bg section with 2-col checklist
  PricingGrid.tsx               Grid of pricing cards (1-3)
  PricingCard.tsx               Individual pricing card
  DanaSection.tsx               Dana-based contribution section
  GalleryCarousel.tsx           Infinite gallery carousel (uses useRetreatCarousel + Lightbox)
  Lightbox.tsx                  Fullscreen image viewer with swipe
  VideoSection.tsx              Responsive YouTube embed
  FinalCTA.tsx                  Closing photo-bg section with CTA
  InfoFooter.tsx                Cancellation policy + contact info
  MailingListSignup.tsx         Mailchimp form via mailchimp-sync edge function
  RegistrationModal.tsx         Generic registration form → n8n → Cardcom
  PaymentStatusModal.tsx        Success/failure dialog shown on ?payment= query return
  CTAButton.tsx                 Primary gold button
  GoldDot.tsx                   Bullet dot
  hooks/
    useRetreatSEO.ts            Sets document.title + meta tags from SEOConfig
    useRetreatCarousel.ts       Infinite scroll + touch + pause logic
    useMetaPixelRetreat.ts      fireInitiateCheckout + useRetreatPurchaseTracking
```

## Architecture

A retreat page is a thin file that:

1. Declares content as config objects (SEOConfig, RegistrationConfig, tiers, schedule days, etc.).
2. Renders `<RetreatLayout>` with the SEO + nav CTA config.
3. Composes section components as children.
4. Wires a `useState` for the registration modal and a `useRetreatPurchaseTracking` call for the Cardcom return flow.

Every section component is **display-only**. It takes strings/ReactNode via props and renders consistent markup. No component hardcodes Hebrew or English — language is entirely carried by the content passed in and the `dir`/`lang` on `RetreatLayout`.

Mandatory components for any retreat page:
- `RetreatLayout` — must wrap the whole page.
- `RetreatHero` — the first child.
- `RegistrationModal` + `PaymentStatusModal` — the registration flow.

Optional: everything else. Pick what the retreat needs.

## Design tokens (`theme.ts`)

Colors: `GOLD #C9A961`, `GOLD_DARK #B8860B`, `DARK #1A1A1A`, `CREAM #FAF8F5`, `STONE #F5F0EA`, `WARM_GRAY #6B635A`, `BODY #3D3830`.
Fonts: `serif: 'Playfair Display', 'Frank Ruhl Libre', serif` / `sans: 'Open Sans', 'Heebo', sans-serif`.

Deviate only if a page needs a clearly different aesthetic. If you do, add the variant to `theme.ts` rather than hardcoding in the page file.

## Component API reference

All components are fully typed; see individual files for prop documentation. Highlights:

### `RetreatLayout`
```tsx
<RetreatLayout
  lang="he" dir="rtl"
  seo={seo}
  navCtaLabel="להרשמה"
  onNavCtaClick={openModal}
  footerText="© 2026 מאיטרייה סנגהה ישראל. כל הזכויות שמורות."
>
  {/* sections */}
</RetreatLayout>
```
Sets direction, fonts, colors, sticky nav, footer, and calls `useRetreatSEO(seo)`.

### `RegistrationModal`
```tsx
<RegistrationModal open={open} onOpenChange={setOpen} config={registrationConfig} copy={registrationCopy} />
```
The `config` (`RegistrationConfig`) declares tiers, webhook URL, which fields to ask (gender/food/prevExp), terms URL, sessionStorage prefix and optional extra payload. The `copy` holds every visible string.

### `PricingGrid` / `DanaSection`
Pick one per page depending on payment model. `PricingGrid` is for fixed tiers (Ein Gedi). `DanaSection` is for dana-based retreats (Heart of Wisdom) with a single suggested-amount line and a CTA.

### `GalleryCarousel`
```tsx
<GalleryCarousel title="מהריטריטים שלנו" images={images} alt="…" />
```
Handles infinite scroll, touch, auto-advance, lightbox. Uses `useRetreatCarousel` internally.

See the `types.ts` file for full shapes of `RegistrationConfig`, `SEOConfig`, `PricingTier`, `Teacher`, `ScheduleDay`.

## Registration & payment flow

```
┌──────────────┐      ┌─────────┐      ┌──────────┐      ┌────────────────┐
│ User clicks  │ ───► │ Form    │ ───► │ n8n      │ ───► │ Cardcom hosted │
│ CTA          │      │ submit  │      │ webhook  │      │ payment page   │
└──────────────┘      └─────────┘      └──────────┘      └────────┬───────┘
                          │                                       │
                          ▼                                       │
                fireInitiateCheckout()                             │
                 (Meta pixel ic-<regToken>)                        │
                 sessionStorage pending_purchase                   │
                                                                   ▼
                                                        ?payment=success back
                                                                   │
                                                                   ▼
                                                        useRetreatPurchaseTracking()
                                                         fires Purchase event with
                                                         event_id = purchase-<regToken>
                                                         (matches CAPI fired by n8n)
```

Event ids are deterministic (`ic-<uuid>` / `purchase-<uuid>`) so n8n can fire a server-side CAPI event with the same id and Meta dedupes. The `storagePrefix` in `RegistrationConfig` isolates multiple retreat pages from stepping on each other's sessionStorage keys.

For dana-based retreats where Cardcom shows both a fixed and an open amount on its own page, you still pass a single tier with the suggested `priceValue` — Cardcom handles the amount UI itself.

## Adding a new retreat page

1. Create `src/pages/<NameRetreat>.tsx`. Start from `HeartOfWisdomRetreat.tsx` as a reference.
2. Create `src/assets/<name-retreat>/index.ts` that re-exports the assets used by the page. Use placeholders from `src/assets/retreat/` if real assets are pending.
3. Fill content config objects inline in the page file: `seo`, `registrationConfig`, `registrationCopy`, `scheduleDays`, `whatsIncluded`.
4. Compose sections inside `<RetreatLayout>`.
5. Add a lazy import and route in `src/App.tsx` (public events block, alongside Ein Gedi).
6. Add a page-header comment: what retreat, language, content source in the vault, assets location, registration config summary.
7. Run verification: `npm run test`, `npx tsc --noEmit`, `./node_modules/.bin/vite build` — all must pass.
8. Update `docs/README.md` with the new page entry.

## Adding a new language

Same components, different strings. `RetreatLayout` accepts `lang` and `dir` props; pass `lang="en" dir="ltr"` for English pages. Use `src/lib/dateFormat.ts` for locale-aware dates. Mailchimp tag convention: `"Hebrew"` for he, `"English"` for en (passed to `MailingListSignup` via the `tag` prop, and also sent as `language` to the `mailchimp-sync` edge function).

Because no component hardcodes Hebrew, translating a page means copying the page file, replacing the content strings, and changing lang/dir. Everything else carries over.

## Known limitations / gotchas

- **RTL teacher flip:** `TeacherCard.reversed` flips `md:flex-row-reverse` ↔ `md:flex-row`. Because the page is RTL, "reversed" visually means photo on the opposite side from the default. Preview both directions when alternating.
- **Carousel reset:** `useRetreatCarousel` holds a middle-anchored index into a 7× repeated array. When drifting toward either edge, it silently snaps back to the middle by toggling `transition: none` for a single frame on `carouselRef`. If you reuse the hook without wiring the `carouselRef` to the scrolling div, the reset becomes a visible slide.
- **Meta pixel dedup:** `storagePrefix` must be unique per page. Two pages sharing a prefix will clobber each other's `pending_purchase` sessionStorage key if a user visits both.
- **Frozen monolith:** Never backport these components into `EinGediRetreatV2.tsx`. That page is live with active registrations; the only safe change is to leave it alone.
- **Docs stay in-repo:** All README/JSDoc lives in source files. Vite's production build ignores `.md` files, and the GitHub Actions deploy step only mirrors `dist/`, so documentation never ships to the live site. Don't add `import … from "./README.md"` anywhere.
