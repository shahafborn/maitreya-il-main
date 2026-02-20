# Maitreya IL — Implementation Plan

**Overall Progress:** `80%`

## TLDR
Deploy the React app under `/p/` on the WordPress domain, then add Supabase auth (email/password + Google) to gate the video library behind a registration page. On signup, sync users to MailChimp with a specific tag. Track which videos each user views.

## Critical Decisions
- **Supabase** for auth + database — gives us Auth (email/password + Google OAuth), Postgres for user/view tracking, and Edge Functions for server-side MailChimp calls
- **MailChimp API key stays server-side** — Edge Function handles the API call, key never reaches the client
- **Tag format:** `2026-video-online-healing-course`
- **Simple view tracking (Phase 1)** — record which videos a user clicked, not watch time or completion %
- **Single registration page** — doubles as login; no separate login page for now
- **Post-registration flow** — user lands directly on the video library (no onboarding step)
- **Google OAuth deferred** — shipping email/password first, Google auth added later

---

## Phase 1: Deploy Under `/p/`

- [x] 🟩 **Step 1: Vite + Router config**
  - [x] 🟩 Add `base: "/p/"` to `vite.config.ts`
  - [x] 🟩 Add `basename="/p"` to `<BrowserRouter>` in `src/App.tsx`
  - [x] 🟩 Update route to `/heb/healing-online-course`

- [x] 🟩 **Step 2: CI/CD — GitHub Actions SFTP deploy**
  - [x] 🟩 Create `.github/workflows/deploy.yml` (SFTP, Node 22, concurrency group)
  - [ ] 🟥 (Manual) Enable SSH on Hostinger: Hosting → Advanced → SSH Access
  - [ ] 🟥 (Manual) Add GitHub Secrets: `SFTP_HOST`, `SFTP_USERNAME`, `SFTP_PASSWORD` or `SFTP_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

- [ ] 🟥 **Step 3: Hostinger `.htaccess` for `/p/`**
  - [ ] 🟥 (Manual) Backup current `.htaccess`
  - [ ] 🟥 (Manual) Add scoped SPA rewrite: `/p/*` → `/p/index.html` (non-file requests only)
  - [ ] 🟥 (Manual) Add cache headers: no-cache `index.html`, long-term cache `assets/*`

- [x] 🟩 **Step 4: Verify build**
  - [x] 🟩 `npm run build` succeeds locally
  - [ ] 🟥 `npm run preview` loads at `localhost:4173/p/heb/healing-online-course/`
  - [ ] 🟥 Push → GitHub Actions deploys → live on domain

---

## Phase 2: Supabase Setup

- [x] 🟩 **Step 5: Supabase project + Auth**
  - [x] 🟩 (Manual) Create Supabase project, get URL + anon key
  - [x] 🟩 Install `@supabase/supabase-js`
  - [x] 🟩 Create `src/lib/supabase.ts` client (using `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
  - [x] 🟩 Enable Email/Password auth + disable email confirmation
  - [x] 🟩 Configure Google OAuth in Supabase
  - [x] 🟩 Add env vars to `.env.local` (gitignored via `*.local`)

- [x] 🟩 **Step 6: Database tables**
  - [x] 🟩 Create `profiles` table (id, email, full_name, created_at, last_sign_in)
  - [x] 🟩 Create `video_views` table (id, user_id, video_id, first_viewed_at)
  - [x] 🟩 Set up RLS policies (users can read/write own data only)
  - [x] 🟩 Create trigger: auto-create profile row on auth.users insert
  - [x] 🟩 Client: update `last_sign_in` on login (`src/hooks/useAuth.tsx`)
  - [x] 🟩 Client: track video views with upsert (`src/pages/Index.tsx`)

---

## Phase 3: Registration Page + Route Guard

- [x] 🟩 **Step 7: Registration page UI**
  - [x] 🟩 Create `src/pages/Register.tsx` — Hebrew intro + email/password signup form
  - [x] 🟩 Intro section: course name, what they'll get (6 free videos), spiritual theme styling
  - [x] 🟩 "Sign in with Google" button + OAuth flow (Google Cloud Console + Supabase provider configured)
  - [x] 🟩 Consent checkbox — required for signup, highlights with message on nudge
  - [x] 🟩 Toggle to login mode (existing users) within the same page
  - [x] 🟩 Match existing theme (spiritual gradient, Heebo/Frank Ruhl Libre fonts, gold accent)

- [x] 🟩 **Step 8: Auth context + route guard**
  - [x] 🟩 Create `src/hooks/useAuth.tsx` — AuthProvider context with single subscription
  - [x] 🟩 Update `src/App.tsx` — AuthProvider wrapper, unauthenticated → Register, authenticated → video library
  - [x] 🟩 Add sign-out button to video library header
  - [x] 🟩 Fix: race condition (removed getSession, rely on onAuthStateChange only)
  - [x] 🟩 Fix: try/catch/finally + variable rename in Register submit handler

---

## Phase 4: MailChimp Integration

- [x] 🟩 **Step 9: Supabase Edge Function for MailChimp**
  - [x] 🟩 Create Edge Function `mailchimp-sync` — adds user to audience + applies tag `2026-video-coursel-healing-lp`
  - [x] 🟩 (Manual) Set MailChimp API key + audience ID as Edge Function secrets
  - [x] 🟩 Wire: call Edge Function after successful signup (from client or via DB webhook)
  - [x] 🟩 Handle errors gracefully (signup succeeds even if MailChimp fails)

---

## Phase 5: Video View Tracking

- [x] 🟩 **Step 10: Track video views**
  - [x] 🟩 On video unlock/click, upsert row into `video_views` (deduplicated by unique constraint)
  - [x] 🟩 Update `profiles.last_sign_in` on each login
  - [ ] 🟥 (Future) Admin dashboard to view user stats — not in scope now, data just accumulates

---

## URL Structure (updated)
```
yourdomain.com/                                  → WordPress (unchanged)
yourdomain.com/p/heb/healing-online-course/      → Register (if not logged in) / Video library (if logged in)
yourdomain.com/p/en/[future-page]/               → React app (future)
```

## Files created/modified
| Action | File | Status |
|--------|------|--------|
| Edit | `vite.config.ts` — added `base: "/p/"` | 🟩 Done |
| Edit | `src/App.tsx` — basename, routes, auth guard | 🟩 Done |
| Edit | `src/pages/Index.tsx` — sign-out button in header | 🟩 Done |
| Create | `src/lib/supabase.ts` | 🟩 Done |
| Create | `src/hooks/useAuth.ts` | 🟩 Done |
| Create | `src/pages/Register.tsx` | 🟩 Done |
| Create | `.env.local` — Supabase env vars (gitignored) | 🟩 Done |
| Create | `.github/workflows/deploy.yml` | 🟩 Done |
| Create | `supabase/functions/mailchimp-sync/index.ts` | 🟩 Done |

## Blocked — needs from you
- [x] ~~Supabase project URL + anon key~~
- [ ] Google OAuth client ID + secret (deferred)
- [ ] MailChimp API key + audience/list ID
- [ ] Confirm: Email auth enabled + "Confirm email" disabled in Supabase dashboard
