# Site Content - Editing Guide

This folder is the ENTIRE editable content of the maitreya.org.il website (the site pages - not the retreat landing pages, which live in `src/pages/`). Updating the website = editing a text file here. No code knowledge needed. This guide is written for humans and AI assistants alike.

**Two ways to edit, same files:**
1. **Directly** - edit the markdown files here (by hand or via an AI assistant).
2. **Back office** - the admin area (`/admin` -> "Site Content") shows every file as a friendly form. While the local dev server runs, saving from there writes to these same files and the site updates instantly. (Publishing from the DEPLOYED admin is a go-live phase item - see the migration plan in the vault.)

## Structure

```
content/
  he/            Hebrew content (primary language, RTL)
    pages/       One .md file per site page (home, about, contact, gallery)
    articles/    One .md file per article
    events/      One .md file per event
  en/            English content - INDEPENDENT of Hebrew (different content, not translations)
    pages/
    articles/
    events/
```

Every file is markdown with a frontmatter block (the `---` ... `---` section at the top) holding structured fields, followed by the body text.

## The golden rules

1. **Hebrew and English are separate.** Editing `he/pages/home.md` changes only the Hebrew homepage. If the change matters in both languages, edit both files - and the texts are allowed to differ.
2. **Dates are ISO format** (`2026-06-01`) in frontmatter, always.
3. **`title` and `description` in every page/article frontmatter are the SEO fields** - they become the browser title, Google snippet, and social-share text. Keep `description` under ~155 characters.
4. **Regular hyphens only** - never em dashes (–, —) anywhere.
5. **Images** go in `public/media/` (articles: `public/media/articles/`, site photos: `public/media/site/`) and are referenced as `/media/...` paths.

## Where pages live on the site (URL scheme)

Hebrew is the primary language and lives at the root: `/`, `/about`, `/events`, `/articles/<slug>`, `/gallery`, `/dana`, `/contact`. English lives under `/en`: `/en`, `/en/about`, `/en/events`, ... The scheme is defined once in `src/site/content.ts` (`sitePath`). Old WordPress URLs (`/he/about/`, `/he/our_events/...`) and the app's former `/p/...` prefix redirect automatically (`scripts/redirects.mjs`).

## How to add a new event

Create `content/he/events/<yyyy-mm-slug>.md` (and an `en/` twin if the event has an English audience). The file name becomes the row's anchor on the events page (`/events#<file-name>`); the entries migrated from WordPress keep their old slugs as file names for exactly that reason - old links land on the right row.

```markdown
---
title: "שם האירוע"
start: 2026-12-07
end: 2026-12-12
location: "בית ספר שדה עין גדי, ים המלח"
teacher: "לאמה גלן מולין"
url: "/events/some-landing-page"
image: "/media/site/some-event.jpg"
summary: "משפט או שניים על האירוע."
---
```

`image` is optional: with it, the homepage shows the event as a large picture card (like the courses page promo) and the events page puts the picture beside the row; without it, a plain text card. Put the file in `public/media/site/` (a 1200x630 share card works well).

That's the whole job. The event appears automatically: on the homepage "אירועים קרובים" section while `end` is today or later, and in the events archive after it passes. `url` may point to an in-app landing page (`/events/...`), or be omitted while registration isn't open yet.

## How to add a new article

Create `content/he/articles/<slug>.md`:

```markdown
---
title: "כותרת המאמר"
slug: my-article-slug
date: 2026-08-14
lang: he
description: "תקציר קצר למנועי חיפוש ולתצוגת הרשימה."
image: /media/articles/share/my-article-slug.jpg
image_alt: "תיאור קצר של התמונה"
---
גוף המאמר במרקדאון...
```

**Share image (`image`, `image_alt`):** every article gets its own social-share picture, 1200x630: the post's own photo or artwork with a white strip under it holding the article's name (the title up to the first " - ") and the Sangha logo (Shahaf, 18.10). Make it with `node scripts/share-image.mjs <slug> <picture, path from the repo root> [focus-y 0-100]` - it writes `public/media/articles/share/<slug>.jpg`; look at it, move the crop with focus-y if a head is cut. Set `image` to that path and `image_alt` to a short description of the picture. They become og:image (+ alt), twitter:image and the Article JSON-LD image; without `image` the post shares the site-wide card. The link checker fails the build if the file is missing.

The article appears automatically in the articles index (newest first) and gets its own page at `/he/articles/<filename-without-.md>`. Images: put files in `public/media/articles/` and embed with `![תיאור](/media/articles/file.jpg)`.

**Embedding a YouTube video:** put the video's link alone on its own line (nothing else on that line) and it renders as an embedded player. A `t=`/`start=` seconds parameter in the link is respected. A link inside a sentence stays a normal link.

**Promo boxes inside an article:** a line that is only `[[visit-promo]]` shows the current visit's text box (from `pages/visit-promo.md`); a line that is only `[[retreat-promo]]` shows the photo card for one retreat (from `pages/retreat-promo.md` - eyebrow, heading, photo, button, short text). Each box lives in ONE file, so pointing it at the next retreat is one edit, never a hunt through articles. Both hide themselves after their `until` date. Use real photos only in the card.

## How to edit an existing page

Open the page's file under `pages/`, edit, save. `home.md` is special: its frontmatter fields are the homepage's text blocks (hero, section titles, newsletter copy) - edit the field values, keep the field names.

**Standalone documents** (terms pages such as `ein-gedi-terms.md` and `online-terms.md`) use the same format plus a `heading` field (the H1) and are wired to a path in `src/App.tsx` + `scripts/site-routes.mjs` via the generic `SiteDocPage` component.

## What NOT to touch from here

- Retreat landing pages, registration, payments, admin - those live in `src/` and have their own docs (`src/components/retreat/README.md`).
- The weekly practices schedule - that lives in `src/pages/WeeklyPractices.tsx` and has its own skill in the vault.

## Verifying a content change

Content changes are safe by design, but before deploying run the standard checks from the repo root (see `.claude/CLAUDE.md`). A missing frontmatter field falls back to an empty string - if a section on the site shows up blank, check the field names against this guide.
