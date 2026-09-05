# Maitreya Sangha Israel - Website Site Map

## Overview

The app serves the whole domain from the root (`maitreya.org.il/`) since the 2026-09 cutover; WordPress is gone and every old `/p/...` or `/he/...` URL 301-redirects (`scripts/redirects.mjs`). Hebrew is the primary language at the root, English lives under `/en`.

### Site pages (content in `content/`, components in `src/site/`)

| Route | English twin | Content file |
|-------|--------------|--------------|
| `/` | `/en` | `content/<lang>/pages/home.md` |
| `/about` | `/en/about` | `pages/about.md` |
| `/events` | `/en/events` | `content/<lang>/events/*.md` (upcoming + archive, one file per event) |
| `/articles`, `/articles/:slug` | `/en/articles` | `articles/*.md` |
| `/gallery` | - | `pages/gallery.md` + `src/assets/site-gallery/` |
| `/dana` | `/en/dana` | `pages/dana.md` |
| `/contact` | `/en/contact` | `pages/contact.md` |
| `/events/online-terms`, `/events/ein-gedi-healing-retreat/terms` | - | `pages/online-terms.md`, `pages/ein-gedi-terms.md` |
| `/practices` | - | `src/pages/WeeklyPractices.tsx` (noindex) |

All of these are pre-rendered to real HTML at build time (`scripts/prerender.mjs`); the list lives in `scripts/site-routes.mjs`.

## Route Structure

### `/discover/*` - Public Digital Experiences (Lead Magnets)
Free, public-facing content designed to attract and engage new audiences. Auth-gated: shows Register page if not logged in, content if logged in. Used for lead magnets, free courses, and digital marketing funnels.

| Route | Component | Purpose |
|-------|-----------|---------|
| `/discover/healing-retreat` | `Register` → `Index` | Free 6-video course on Buddhist healing (lead magnet) |

**Pattern:** Hardcoded React components. Content lives in the code, not in the CMS. Auth required to view content (captures email as lead).

### `/courses/:slug` - CMS-Managed Courses (Enrolled Members)
Database-driven course pages managed through the admin CMS. Enrollment-gated: shows CourseRegister if not enrolled, CoursePage if enrolled.

| Route | Component | Purpose |
|-------|-----------|---------|
| `/courses/:slug` | `CourseEnrollmentGate` → `CoursePage` | Dynamic course content page |
| `/courses/:slug/register` | `CourseRegister` | Course-specific registration/enrollment |

**Pattern:** Content comes from Supabase tables (`courses`, `course_content_blocks`, `course_meetings`, `course_resources`, `course_recordings`, `promotions`). Managed via Admin CMS. Enrollment required.

**Database tables:**
- `courses` - Course metadata (title, slug, description, hero image, published status)
- `course_content_blocks` - Flexible content sections (about, practice, footer, gallery, etc.)
- `course_meetings` - Scheduled sessions with Zoom links
- `course_resources` - Downloadable PDFs and links
- `course_recordings` - Video recordings of past sessions
- `promotions` - Special offers / upsells shown on course pages

### `/admin/*` - Admin CMS
Admin dashboard for managing courses, content, users, and analytics. Requires admin role.

### Utility Routes

| Route | Purpose |
|-------|---------|
| `/auth/callback` | OAuth callback (Google sign-in) |
| `/reset-password` | Password reset flow |
| `/heb/healing-online-course` | Legacy redirect → `/discover/healing-retreat` |
| `/*` (catch-all) | 404 page (`src/pages/NotFound.tsx`; the server serves `404.html` with a real 404 status) |

## Where New Pages Go

| Type | Route Pattern | Auth | Example |
|------|--------------|------|---------|
| **Lead magnet / free digital content** | `/discover/[name]` | Login required (captures email) | Free video course, downloadable guide |
| **Public marketing / landing page** | `/events/[name]` or `/retreats/[name]` | No auth (public) | Ein Gedi retreat landing page |
| **Paid/enrolled course** | `/courses/[slug]` | Enrollment required | Ongoing teaching program |

### `/events/*` - Public Event Landing Pages
For physical events, retreats, and workshops that need a public-facing landing page. No auth wall - the goal is to inform and drive registration (to an external payment/registration system like Eventbrite or a custom form).

**Characteristics:**
- Publicly accessible (no login required) - routed outside AuthGate in App.tsx
- Marketing-focused: hero, description, schedule, pricing, teacher info, venue, CTA
- Registration links to external system or on-site registration form
- Hebrew RTL content
- SEO-optimized: `useRetreatSEO` sets title/description/OG/canonical at runtime and the pre-renderer bakes them into the static HTML; add the route to `scripts/site-routes.mjs`
- Lazy-loaded, standalone components

| Route | Component | Purpose |
|-------|-----------|---------|
| `/events/ein-gedi-healing-retreat` | `EinGediRetreat` | Ein Gedi Healing Retreat landing page (June 1-6, 2026) |

## Tech Stack Reference
- **Frontend:** React + TypeScript + Vite + Tailwind + shadcn/ui
- **Backend:** Supabase (auth, database, storage)
- **Hosting:** Hostinger via SFTP (GitHub Actions CI/CD)
- **Base path:** `/` (Vite `base` + React Router basename derive from it)
- **Deploy + cutover runbook:** `docs/deployment.md`
