# maitreya-il-main docs index

Single entry point for developers (and coding agents) landing in this repo. All documentation lives inside the project repo — nothing lives in the vault or on an external wiki. Docs never ship: Vite ignores `.md` files and the GitHub Actions deploy step (`.github/workflows/deploy.yml`) mirrors only `dist/`.

## Project-wide conventions

- [`CLAUDE.md`](../CLAUDE.md) — git safety, commit protocol, pre-commit checks, documentation rule.
- [`.claude/CLAUDE.md`](../.claude/CLAUDE.md) — stack details, pre-commit checks, CI/CD notes.
- Pre-commit (MANDATORY): `npm run test`, `npx tsc --noEmit`, `npx vite build`.
- CI/CD: GitHub Actions → Hostinger SFTP on push to `main`.

## Component libraries

- [`src/components/retreat/`](../src/components/retreat/README.md) — shared retreat landing page components (layout, hero, teacher card, schedule, pricing, dana, gallery carousel, registration + Cardcom flow, Meta pixel dedup). Used by all retreat pages.

## Landing pages

### Ein Gedi Healing Retreat (Hebrew) — frozen monolith
- **URL:** `https://maitreya.org.il/p/events/ein-gedi-healing-retreat` (dev: `http://localhost:8081/p/events/ein-gedi-healing-retreat`)
- **Language:** Hebrew (RTL)
- **Source:** `src/pages/EinGediRetreatV2.tsx` — **frozen**, do not modify. 1,358-line monolith used as visual reference for extraction.
- **Assets:** `src/assets/retreat/`
- **Registration:** 3 pricing tiers → n8n webhook (`EinGedi_Register`) → Cardcom → `?payment=success|failed` return.

### Heart of Wisdom Retreat (Hebrew)
- **URL:** `https://maitreya.org.il/p/events/heart-of-wisdom-retreat` (dev: `http://localhost:8081/p/events/heart-of-wisdom-retreat`)
- **Language:** Hebrew (RTL)
- **Source:** `src/pages/HeartOfWisdomRetreat.tsx` — built on the retreat component library.
- **Content source (vault):** `the-system/W-work/ventures/maitreya-sangha/projects/teachers-visit-may-jun-2026/heart-of-wisdom-retreat/marketing/landing-page-content.md`
- **Assets:** `src/assets/heart-of-wisdom-retreat/` — **currently placeholders** (reused Ein Gedi hero/gallery/venue). Phase B.2 will replace with real Mahamudra/Manjushri/Antakarana imagery.
- **Dates:** May 28-30, 2026 (Thu-Sat). Urban, no lodging. Antakarana Center, Tel Aviv.
- **Teachers:** Lama Glenn Mullin + Drupon Chongwol-la.
- **Registration:** single dana tier (suggested 650₪) → n8n webhook (reused `EinGedi_Register` with `field_event: "how_dana"` and `extraPayload.source: "heart-of-wisdom"`) → Cardcom payment page configured to show both a fixed 650₪ option and an open-amount option on the same page.
- **sessionStorage prefix:** `how`.

## Future docs

When adding a new feature, update this index. Every README/doc in the project should be reachable from here in at most two clicks.
