# Maitreya Sangha Israel - Website Site Map

## Overview

The web app lives at `maitreya.org.il/p/` (base path `/p/`). The main WordPress site is at `maitreya.org.il/`. Root (`/p/`) redirects to the main site.

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
| `/` | Redirects to `maitreya.org.il` (main WordPress site) |
| `/auth/callback` | OAuth callback (Google sign-in) |
| `/reset-password` | Password reset flow |
| `/heb/healing-online-course` | Legacy redirect → `/discover/healing-retreat` |
| `/*` (catch-all) | Redirects to `maitreya.org.il` |

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
- SEO-optimized with OG tags (generated in `scripts/generate-og-pages.mjs` via STATIC_EVENTS array)
- Lazy-loaded, standalone components

| Route | Component | Purpose |
|-------|-----------|---------|
| `/events/ein-gedi-healing-retreat` | `EinGediRetreat` | Ein Gedi Healing Retreat landing page (June 1-6, 2026) |

## Tech Stack Reference
- **Frontend:** React + TypeScript + Vite + Tailwind + shadcn/ui
- **Backend:** Supabase (auth, database, storage)
- **Hosting:** Hostinger via SFTP (GitHub Actions CI/CD)
- **Base path:** `/p/` (configured in Vite + React Router)
- **Main site:** WordPress at `maitreya.org.il/`
