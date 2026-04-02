# CMS-Managed Marketing Courses

**Status:** Todo
**Created:** 2026-02-26
**Source:** Claude Code session f5668a71

---

## Overview

The goal is to add a `course_type` discriminator to the existing `courses` table so that marketing/lead-magnet courses (like the Healing Retreat) are managed through the same admin CMS as standard courses, but render with a distinct progressive-unlock UX on the frontend. This requires schema changes, new transcript storage, a new frontend page component, admin UI additions, routing changes, analytics migration, and cleanup of hardcoded files.

---

## 1. Database Schema Changes

**Migration file:** `supabase/migrations/20260227000000_marketing_course_type.sql`

### 1a. Add `course_type` column to `courses`

```sql
ALTER TABLE public.courses
  ADD COLUMN course_type TEXT NOT NULL DEFAULT 'standard'
  CHECK (course_type IN ('standard', 'marketing'));
```

This is the core discriminator. `'standard'` is the existing behavior; `'marketing'` triggers the progressive-unlock UX. Default is `'standard'` so existing courses are unaffected.

### 1b. Add marketing-specific columns to `courses`

```sql
ALTER TABLE public.courses
  ADD COLUMN cta_url TEXT,           -- external purchase/registration URL
  ADD COLUMN cta_label TEXT,         -- CTA button text, e.g. "להרשמה לריטריט"
  ADD COLUMN cta_label_final TEXT,   -- final CTA section button text (after all videos)
  ADD COLUMN hero_title TEXT,        -- override title for the hero section (supports Hebrew HTML)
  ADD COLUMN hero_subtitle TEXT,     -- subtitle text for the hero section
  ADD COLUMN final_cta_title TEXT,   -- heading for the final CTA section
  ADD COLUMN final_cta_subtitle TEXT,-- subtitle for the final CTA section
  ADD COLUMN final_cta_note TEXT;    -- date/note line for the final CTA section
```

These fields give the admin full control over the hero and CTA content that is currently hardcoded in `Index.tsx`.

### 1c. Add transcript columns to `course_recordings`

```sql
ALTER TABLE public.course_recordings
  ADD COLUMN transcript_en TEXT DEFAULT '',
  ADD COLUMN transcript_he TEXT DEFAULT '';
```

This stores transcripts per recording directly in the DB, replacing the static text files. Both languages are stored as separate columns for simplicity.

### 1d. Update the `update_course_metadata` RPC

Add the new columns to the existing `update_course_metadata` function so they can be updated from the admin UI:

```sql
CREATE OR REPLACE FUNCTION public.update_course_metadata(
  _course_id UUID,
  _title TEXT DEFAULT NULL,
  _slug TEXT DEFAULT NULL,
  _description TEXT DEFAULT NULL,
  _hero_image_url TEXT DEFAULT NULL,
  _course_start_date DATE DEFAULT NULL,
  _access_code TEXT DEFAULT NULL,
  _default_dir TEXT DEFAULT NULL,
  _is_published BOOLEAN DEFAULT NULL,
  _course_type TEXT DEFAULT NULL,
  _cta_url TEXT DEFAULT NULL,
  _cta_label TEXT DEFAULT NULL,
  _cta_label_final TEXT DEFAULT NULL,
  _hero_title TEXT DEFAULT NULL,
  _hero_subtitle TEXT DEFAULT NULL,
  _final_cta_title TEXT DEFAULT NULL,
  _final_cta_subtitle TEXT DEFAULT NULL,
  _final_cta_note TEXT DEFAULT NULL
)
RETURNS VOID ...
```

The body adds `COALESCE` for each new parameter, matching the existing pattern.

### 1e. Seed the existing healing retreat data

A second migration file `supabase/migrations/20260227000001_seed_healing_retreat.sql` inserts the healing retreat as a marketing course:

```sql
INSERT INTO public.courses (
  slug, title, description, course_type, default_dir, is_published,
  cta_url, cta_label, cta_label_final,
  hero_title, hero_subtitle,
  final_cta_title, final_cta_subtitle, final_cta_note
) VALUES (
  'healing-retreat',
  'הדרך לריפוי והילינג בודהיסטי',
  'קורס של שש שעות מוקלטות עם לאמה גלן מולין — מבוא לעולם הריפוי הטנטרי הבודהיסטי',
  'marketing',
  'rtl',
  true,
  'https://maitreya.org.il/he/our_events/lg26-the-path-of-buddhist-healing-retreat-he-1/',
  'הרשמה לריטריט הריפוי',
  'להרשמה לריטריט',
  'הדרך לריפוי והילינג בודהיסטי',
  'לאמה גלן מולין חושף את סודות הריפוי הטנטרי הבודהיסטי
ב-6 סרטונים שיפתחו לכם את הדלת לעולם חדש של ריפוי ושלום פנימי',
  'מוכנים לחוויה המלאה?',
  'ריטריט ריפוי בודהיסטי עם לאמה גלן מולין ודרופון צ''ונגול-לה',
  '26 למאי – 09 ליוני 2026'
)
RETURNING id;
```

Then insert the 6 recordings with their YouTube IDs and transcript content (read from the current static files), referencing the returned course id. The transcript content from `public/content/healing-online-course/transcripts.txt` and `transcripts-he.txt` would be parsed and inserted into `transcript_en`/`transcript_he` columns on each recording row.

---

## 2. TypeScript Type Updates

**File: `src/hooks/useCourse.ts`**

Update the `Course` interface:

```typescript
export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  hero_image_url: string | null;
  course_start_date: string | null;
  is_published: boolean;
  access_code: string | null;
  default_dir: "ltr" | "rtl";
  course_type: "standard" | "marketing";  // NEW
  cta_url: string | null;                 // NEW
  cta_label: string | null;               // NEW
  cta_label_final: string | null;         // NEW
  hero_title: string | null;              // NEW
  hero_subtitle: string | null;           // NEW
  final_cta_title: string | null;         // NEW
  final_cta_subtitle: string | null;      // NEW
  final_cta_note: string | null;          // NEW
  created_at: string;
  updated_at: string;
}
```

**File: `src/hooks/useCourseContent.ts`**

Update the `CourseRecording` interface:

```typescript
export interface CourseRecording {
  id: string;
  course_id: string;
  week_number: number | null;
  session_type: "main" | "clarification" | null;
  title: string;
  embed_type: "bunny" | "youtube" | "iframe";
  embed_url: string;
  sort_order: number;
  transcript_en: string;   // NEW
  transcript_he: string;   // NEW
}
```

---

## 3. Admin UI Changes

**File: `src/pages/admin/AdminCourseEditor.tsx`**

In the `MetadataEditor` component:

- Add a `course_type` dropdown (`standard` / `marketing`) at the top of the form, before the title field.
- When `course_type === 'marketing'`, show the additional fields:
  - `cta_url` (Input) -- "CTA URL"
  - `cta_label` (Input) -- "CTA Button Label"
  - `cta_label_final` (Input) -- "Final CTA Button Label"
  - `hero_title` (Input) -- "Hero Title Override"
  - `hero_subtitle` (Textarea) -- "Hero Subtitle"
  - `final_cta_title` (Input) -- "Final CTA Heading"
  - `final_cta_subtitle` (Input) -- "Final CTA Subtitle"
  - `final_cta_note` (Input) -- "Final CTA Note"
- These fields should be conditionally rendered only when `course_type === 'marketing'`.
- Update the `form` state to include all new fields.
- Update the `updateMutation` to pass new fields.

**File: `src/pages/admin/AdminCourseList.tsx`**

- Show the `course_type` as a badge next to the course slug, e.g. "Marketing" or "Standard".
- In the "Create Course" dialog, add a `course_type` dropdown so new marketing courses can be created.

**File: `src/pages/admin/AdminRecordingEditor.tsx`**

- Add `transcript_en` and `transcript_he` Textarea fields to both `RecordingRow` and `NewRecordingForm`.
- These should be collapsible (default collapsed) to avoid cluttering the UI for standard courses where transcripts are not used.
- Include the fields in the create/update mutations.

---

## 4. New Frontend Components

### New file: `src/pages/MarketingCoursePage.tsx`

This is the main new component. It replaces the current `src/pages/Index.tsx` with a DB-driven version. It:

- Receives a `Course` object as a prop (just like `CoursePage`).
- Fetches recordings via `useCourseRecordings(course.id)`.
- Implements the same progressive-unlock UX: `unlockedCount` state, `handleNext`, progress bar.
- Reads `course.hero_title`, `course.hero_subtitle` for the hero section.
- Reads `course.cta_url`, `course.cta_label` for per-video CTA buttons.
- Reads `course.final_cta_title`, `course.final_cta_subtitle`, `course.final_cta_note`, `course.cta_label_final` for the final CTA section.
- Uses `recording.transcript_en` and `recording.transcript_he` instead of loading from static files.
- Tracks views via `track_recording_view` RPC instead of the old `video_views` table.

### New file: `src/components/MarketingVideoSection.tsx`

This is a refactored version of `src/components/VideoSection.tsx` that:
- Takes a `CourseRecording` + course-level CTA props instead of `VideoData`.
- Uses `recording.embed_url` instead of constructing from `youtubeId`.
- Uses `recording.transcript_en` / `recording.transcript_he` instead of `video.transcript` / `video.transcriptHe`.
- Accepts `ctaUrl` and `ctaLabel` as props (from the course).
- Otherwise preserves the same UI: YouTube embed, transcript toggle, CTA button, "next video" button.

### Modified file: `src/components/CourseEnrollmentGate.tsx`

- After determining the user is enrolled, check `course.course_type`.
- If `'standard'`, render `<CoursePage course={course} />` (existing behavior).
- If `'marketing'`, render `<MarketingCoursePage course={course} />`.

This is the key routing logic change -- the enrollment gate dispatches to the correct page component based on course type.

---

## 5. Routing Changes

**File: `src/App.tsx`**

The goal is to retire the hardcoded `/discover/healing-retreat` route and serve it through the standard `/courses/:slug` system. Changes:

1. Remove the direct imports of `Index` and `Register`.
2. Change the `/discover/healing-retreat` route to a redirect:
   ```tsx
   <Route path="/discover/healing-retreat" element={<Navigate to="/courses/healing-retreat" replace />} />
   ```
3. The `/heb/healing-online-course` redirect should also point to `/courses/healing-retreat`.
4. The existing `/courses/:slug/register` and `/courses/:slug` routes already handle registration and enrollment gating, so they will serve the healing retreat automatically once it exists in the DB.

The register page for marketing courses needs one behavioral adjustment: marketing courses should **auto-enroll on registration** (no access code). The existing `CourseRegister.tsx` already does this -- when `access_code` is null, `enroll_in_course` RPC succeeds without a code. So no change is needed there.

However, the register page styling for marketing courses should match the current spiritual gradient design. Two approaches:

- **Option A (recommended):** Check `course.course_type` in `CourseRegister.tsx` and conditionally use the RTL Hebrew marketing style (matching current `Register.tsx`) vs. the standard English style.
- **Option B:** Add a `register_style` column. This is over-engineering for now.

For Option A, the `CourseRegister.tsx` component should conditionally render the consent text and form labels in Hebrew when `course.default_dir === 'rtl'`.

---

## 6. Analytics Integration

**Current state:** The healing retreat uses a separate `video_views` table with a simple `user_id + video_id` unique constraint. The course system uses `daily_recording_views` with `track_recording_view` RPC.

**Plan:** The new `MarketingCoursePage` should use `track_recording_view` RPC, exactly like standard course recordings. This means:

- In `MarketingCoursePage`, when a video is viewed, call:
  ```typescript
  supabase.rpc("track_recording_view", {
    _recording_id: recording.id,
    _course_id: course.id,
  });
  ```
- The existing admin analytics dashboard (`AdminAnalytics.tsx`) already displays "Video Views per Recording" using the `daily_recording_views` table. Marketing course recordings will appear there automatically.
- No changes needed to `useAnalytics.ts` or `AdminAnalytics.tsx`.

**Progressive unlock tracking:** The current `video_views` table is used for simple dedup (has user seen this video?). For progressive unlock state, the new approach can either:
- Use `daily_recording_views` to check which recordings a user has viewed, OR
- Keep the progressive unlock purely client-side in `useState` (matching current behavior -- the unlock resets on page reload).

The current behavior is that unlock state is **session-only** (stored in `useState`, resets on refresh). Keeping this for now as it is simpler. If persistent progress is desired later, a new hook can query `daily_recording_views`.

---

## 7. Cleanup of Hardcoded Files

After the migration is complete and verified, remove:

1. `src/data/videos.ts` -- No longer needed; data comes from DB.
2. `src/data/loadTranscripts.ts` -- No longer needed; transcripts stored in DB.
3. `public/content/healing-online-course/transcripts.txt` -- Migrated to DB.
4. `public/content/healing-online-course/transcripts-he.txt` -- Migrated to DB.
5. `src/pages/Index.tsx` -- Replaced by `MarketingCoursePage.tsx`.
6. `src/pages/Register.tsx` -- Replaced by `CourseRegister.tsx` (already exists for standard courses).
7. `src/components/VideoSection.tsx` -- Replaced by `MarketingVideoSection.tsx`.

The `video_views` table can be dropped in a later migration after confirming the new system is stable. Check if any other code references it first.

---

## 8. Migration Strategy

### Phase 1: Schema + Admin (no user-facing changes)
1. Create the migration adding `course_type` and marketing columns to `courses`.
2. Create the migration adding `transcript_en`/`transcript_he` to `course_recordings`.
3. Update TypeScript types in `useCourse.ts` and `useCourseContent.ts`.
4. Update admin UI: `AdminCourseEditor.tsx` (MetadataEditor + conditional marketing fields), `AdminRecordingEditor.tsx` (transcript fields).
5. Run and verify: admin can create/edit a marketing course.

### Phase 2: Frontend + Seed Data
1. Create `MarketingCoursePage.tsx` and `MarketingVideoSection.tsx`.
2. Modify `CourseEnrollmentGate.tsx` to dispatch based on `course_type`.
3. Create the seed migration that inserts the healing retreat course + 6 recordings with transcripts.
4. Test the full flow: `/courses/healing-retreat/register` -> register -> auto-enroll -> progressive unlock page.

### Phase 3: Routing + Cleanup
1. Update `App.tsx` to redirect `/discover/healing-retreat` to `/courses/healing-retreat`.
2. Remove `Index.tsx`, `Register.tsx`, `VideoSection.tsx`, `videos.ts`, `loadTranscripts.ts`, static transcript files.
3. Verify existing links (e.g. `/heb/healing-online-course` redirect) still work.

### Edge Cases to Consider
- **Existing users with `video_views` data**: Their progress is session-only anyway, so no migration of view history is needed.
- **SEO/link preservation**: The redirect from `/discover/healing-retreat` to `/courses/healing-retreat` preserves any shared links.
- **Empty transcript fields**: `MarketingVideoSection` should handle empty transcript_en/transcript_he gracefully (hide the transcript panel if both are empty).
- **Non-YouTube embeds for marketing courses**: The `MarketingVideoSection` should use the recording's `embed_type` field, not assume YouTube. Use the `VideoEmbed` component from `src/components/course/VideoEmbed.tsx`.
- **Admin creating a new marketing course from scratch**: All marketing-specific fields should have sensible defaults (empty strings) so the page degrades gracefully if not all fields are filled in.

---

## Critical Files for Implementation
- `src/pages/admin/AdminCourseEditor.tsx` - Add marketing-specific fields to MetadataEditor
- `src/components/CourseEnrollmentGate.tsx` - Dispatch to MarketingCoursePage based on course_type
- `src/pages/Index.tsx` - Reference for building MarketingCoursePage (progressive unlock logic)
- `src/hooks/useCourse.ts` - Update Course interface with new fields
- `supabase/migrations/20260222120000_course_resource_system.sql` - Reference for migration patterns and RLS policies
