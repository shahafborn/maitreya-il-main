# Heart of Wisdom + Retreat Component Library - Execution Tracker

**Overall progress: 100% ✅**

## Phase A.1 - Primitives
- ✅ theme.ts
- ✅ types.ts
- ✅ CTAButton.tsx
- ✅ GoldDot.tsx
- ✅ SectionFrame.tsx (+ SectionTitle, SectionEyebrow)
- ✅ RetreatLayout.tsx
- ✅ hooks/useRetreatSEO.ts

## Phase A.2 - Visual sections
- ✅ RetreatHero
- ✅ AboutSection
- ✅ TeacherCard
- ✅ EmpowermentSection
- ✅ ScheduleBlock
- ✅ WhatsIncluded
- ✅ VenueSection
- ✅ VideoSection
- ✅ FinalCTA
- ✅ InfoFooter
- ✅ DanaSection
- ✅ PricingGrid + PricingCard

## Phase A.3 - Complex pieces
- ✅ GalleryCarousel + Lightbox + hooks/useRetreatCarousel
- ✅ MailingListSignup
- ✅ RegistrationModal + PaymentStatusModal + hooks/useMetaPixelRetreat

## Phase B - Heart of Wisdom page
- ✅ lib/dateFormat.ts
- ✅ pages/HeartOfWisdomRetreat.tsx (single dana tier, `storagePrefix: "how"`)
- ✅ assets/heart-of-wisdom-retreat/index.ts (placeholder re-exports)
- ✅ App.tsx lazy import + route `/events/heart-of-wisdom-retreat`

## Phase B.3 - Docs + verification
- ✅ src/components/retreat/README.md
- ✅ docs/README.md
- ✅ CLAUDE.md Documentation Rule section
- ✅ npm run test (13 passed, 6 skipped, 0 failed)
- ⚠️ tsc --noEmit (2 pre-existing errors in frozen `EinGediRetreatV2.tsx` and `auth-e2e.test.ts` — not caused by this work; all new library files + page are clean)
- ✅ vite build (HeartOfWisdomRetreat-*.js chunk 39.75 kB gzipped 13.17 kB, code-split correctly)
- ⏳ commit (after final verification)

## Open items for follow-up

- **Real assets (Phase B.2):** hero, White Manjushri thangka, Antakarana venue photos, gallery. Currently using Ein Gedi placeholders via `src/assets/heart-of-wisdom-retreat/index.ts`. TODO comments mark each placeholder.
- **OG image:** `public/og-heart-of-wisdom-retreat.png` not yet created (SEO `ogImage` points to expected URL).
- **Terms URL:** Currently points to `https://maitreya.org.il/` root — replace once the retreat-specific terms page exists.
- **Manual QA checklist:** dev server (`npm run dev`, port 8081) visit `/p/events/heart-of-wisdom-retreat` and confirm RTL, fonts, gallery, registration modal, payment-status modal, mailing list signup. Also visit `/p/events/ein-gedi-healing-retreat` to confirm zero regression in the frozen monolith.
