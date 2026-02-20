# Changelog

## Unreleased

### Added
- **CI/CD** — GitHub Actions workflow: test → build → SFTP deploy to Hostinger on push to `main` (`.github/workflows/deploy.yml`)
- **Auth gate** — video library requires registration/login (`src/App.tsx`)
- **Registration page** — Hebrew intro, email/password form, login/signup toggle (`src/pages/Register.tsx`)
- **Google OAuth** — "Sign in with Google" button on registration page
- **Consent checkbox** — required before signup; highlights with message if user tries to proceed without checking
- **Supabase client** — env var based, no hardcoded keys (`src/lib/supabase.ts`)
- **Auth context** — single shared `AuthProvider` with `useAuth()` hook (`src/hooks/useAuth.tsx`)
- **Sign-out button** — in video library header (`src/pages/Index.tsx`)
- **Video view tracking** — records which videos each user unlocks in `video_views` table
- **Last sign-in tracking** — updates `profiles.last_sign_in` on each login
- **Database tables** — `profiles` (auto-created on signup via trigger) and `video_views` (deduplicated by unique constraint) with RLS policies
- **Base path** — Vite `base: "/p/"` + router `basename="/p"` for `/p/` deployment

### Removed
- Old Lovable integration (`src/integrations/lovable/`)
- Old Supabase integration with generated types (`src/integrations/supabase/`)
- Admin page (`src/pages/Admin.tsx`)
- `.env` file (replaced by gitignored `.env.local`)
- Full name field from registration (email + password only)

### Fixed
- E2E test no longer crashes in CI — `createClient` moved inside `beforeAll` so it only runs when `RUN_E2E=1` is set
- `useAuth` return types use `AuthResponse` instead of `any`

### Changed
- `src/App.tsx` — routes updated to `/heb/healing-online-course`, wrapped in `AuthProvider`
- `vite.config.ts` — added `base: "/p/"`
- `package.json` — added `@supabase/supabase-js`
