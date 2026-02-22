# Changelog

## Unreleased

### Added
- **Role hierarchy** — three-tier `super_admin` > `admin` > `editor` system. Editors can edit course content but not create courses or publish. Admins get full course management + analytics. Super admins can assign/revoke roles.
- **Analytics tracking** — `daily_recording_views` and `daily_resource_downloads` tables with per-user/per-day upsert. Video views tracked on iframe load (deduplicated per session), resource downloads tracked on click.
- **Analytics dashboard** (`/admin/analytics`) — summary cards (users, enrollments, views, downloads) + charts (signup trend, enrollments per course, views per recording, downloads per resource). Date range filter: 7d / 30d / 90d / all time.
- **User list** (`/admin/users`) — paginated table of all users with email search, signup/login dates, enrollment counts, role badges (color-coded by tier). Admin+ only.
- **Staff management** (`/admin/staff`) — assign/revoke roles via user email search. DB trigger prevents revoking the last super_admin. Super admin only.
- **`update_course_metadata` RPC** — enforces admin+ permission at DB level (editors denied), used for publish toggle and course settings saves
- **`has_any_admin_role()` / `has_admin_or_above()` helpers** — SECURITY DEFINER functions used in all RLS policies

### Changed
- **RLS policies** — all 15 course/storage policies updated from `has_role(uid, 'admin')` to `has_any_admin_role()` to accept any privileged role
- **`useAdmin` hook** — returns granular role info: `role`, `isSuperAdmin`, `isAdminOrAbove`, `isEditor`, `isAdmin`, `loading`
- **Admin nav** — Analytics and Users links visible to admin+, Staff link visible to super_admin only
- **Course list** — "New Course" button and publish toggle hidden for editors
- **Course components** — `CourseRecordings`, `CourseFiles`, `CourseGallery` now accept `courseId` prop for analytics tracking; `VideoEmbed` accepts `onLoad` callback

### Security
- **Last super_admin guard** — `BEFORE DELETE` trigger on `user_roles` prevents deleting the only remaining super_admin (DB-enforced, not just UI)
- **Editor publish restriction** — enforced at DB level via `update_course_metadata` RPC, not just hidden in UI

---

### Added
- **Cache rules** — version-controlled `public/.htaccess` with SPA rewrite, `no-cache` for `index.html`, long-cache (without `immutable`) for hashed assets

### Fixed
- **Stale CDN content** — removed `immutable` from asset cache headers so CDN edge nodes can revalidate after deploys
- **`.htaccess` not deployed** — removed `--exclude .htaccess` from lftp in `deploy.yml`; cache rules now deploy with every build

### Previously added
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
