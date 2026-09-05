# Deployment, hosting and the 2026-09 cutover

How maitreya.org.il is served, how a deploy works, and the one-time runbook that moved the site off WordPress. Written for a future session (human or agent) that has never seen the server.

## How the site is served (since the cutover)

- **One app at the domain root.** The React app in this repo serves everything on `maitreya.org.il` - the site pages (home, about, events, articles, gallery, dana, contact, in Hebrew at the root and English under `/en`), the retreat landing pages (`/events/...`), the weekly practices page, the courses and the admin. WordPress is gone.
- **Every public page is real HTML.** `npm run build` runs Vite and then `scripts/postbuild.mjs`: Playwright renders each public route (`scripts/site-routes.mjs`) and writes it to `dist/_pages/<route>.html`; then the course preview shells, `sitemap.xml`, `robots.txt`, `llms.txt`, the `.htaccess` and a link check that fails the build on any broken internal reference.
- **`.htaccess` is generated, never hand-edited.** `scripts/build-htaccess.mjs` writes it from `scripts/redirects.mjs` (every old WordPress URL and the former `/p/` prefix, 301s; WordPress internals 410) plus one explicit rewrite per pre-rendered page. Client-rendered areas (`/courses`, `/admin`, `/auth`, `/reset-password`, `/discover`, `/heb`) get the app shell; anything else is a real 404 (`404.html`).
- **Hosting:** Hostinger shared hosting (LiteSpeed, `.htaccess` honored). Document root: `~/domains/maitreya.org.il/public_html/`. http->https and www->apex are handled by Hostinger's edge.
- **Analytics:** GTM `GTM-W84DD38X`, gtag `GT-PJ79XDGL` and Microsoft Clarity are in `index.html` and therefore on every page.

## Deploying a change

1. Commit on `main` (or merge a branch). Pre-commit checks: `npm run test`, `npx tsc --noEmit`, `npm run build`.
2. Push. `.github/workflows/deploy.yml` builds (tests, pre-render, link check), mirrors `dist/` over the document root by SFTP and runs `scripts/smoke-test.mjs` against the live site.
3. The workflow's own smoke-test step is informational only: Hostinger's edge answers 403 to GitHub's runners (seen at the cutover). Run `node scripts/smoke-test.mjs https://maitreya.org.il` from a normal machine for the real verdict; every check names the URL and what it expected. Remember Hostinger's edge cache: right after a deploy, old HTML can still be served until it expires or is purged in hPanel.

The SFTP target comes from the `SFTP_REMOTE_PATH` secret. Historically it pointed at the old `/p/` folder; the workflows strip a trailing `/p`, so the secret may keep its old value or be set to the document root itself.

### Local rehearsal (do this before any change to redirects or routing)

```bash
npm run build
bash scripts/local-apache.sh            # the Mac's Apache on http://127.0.0.1:8089, .htaccess honored
node scripts/smoke-test.mjs http://127.0.0.1:8089
bash scripts/local-apache.sh stop
```

If macOS refuses Apache access to `~/Documents`, run it from a copy: `RUN=/tmp/apache DIST_DIR=/tmp/dist bash scripts/local-apache.sh` after copying `dist/` to `/tmp/dist`.

## The cutover runbook (WordPress -> this app at the root)

Prepared 2026-09-05 on branch `website-rebuild`. Run in this order.

### Before

1. **WordPress admin, export the Redirection plugin's rules** (Tools -> Redirection -> Import/Export). They are admin-only and may hold old-URL history that is not in our map. Anything important goes into `scripts/redirects.mjs`.
2. **Hostinger backup:** hPanel -> Files -> Backups -> generate a fresh files + database backup. The cutover takes its own server-side copy too, but this one is independent.
3. **Supabase auth URLs** (dashboard -> Authentication -> URL configuration, or the management API): add `https://maitreya.org.il/auth/callback` and `https://maitreya.org.il/**` to the redirect allow-list (keep the `/p/` entries), and set Site URL to `https://maitreya.org.il/`. Sign-in with Google and password reset land on `/auth/callback` and `/reset-password` after the cutover.

### Cutover

4. Push the branch, then run **Actions -> "Cutover - publish the site at the domain root" -> Run workflow** from that branch, typing `CUTOVER`. It builds, dumps the WordPress database and copies the whole web root to `~/site-archive-<timestamp>/` on the server, mirrors the build over the web root, moves the WordPress files and the old `/p/` folder out of the web root (into the same archive - nothing is deleted), and runs the smoke test against the live site.
5. **Purge caches:** hPanel -> the site's cache (LiteSpeed/CDN) -> purge all. Old WordPress HTML can otherwise be served from cache for a while.
6. Open the site on a phone and a desktop: home, an article, the events page, the practices page, a retreat page, an old link such as `/he/about/`, `/p/practices`.
7. Merge the branch into `main` and push (the normal deploy re-publishes the same build).

### After

8. **Google Search Console:** submit `https://maitreya.org.il/sitemap.xml` (the old Yoast sitemap URLs redirect to it). Watch Coverage for the following weeks.
9. **Share previews:** paste the home page and a retreat page into WhatsApp and the Facebook sharing debugger; if an old preview shows, click "scrape again".
10. **n8n / Cardcom:** the return URLs of the registration flows still say `/p/events/...`; they redirect, but update them to the root paths when next touching a flow.
11. Update the vault memory and skills (`/p/` references) - done for the tools; check campaign templates before the next send.

### Rollback

**Actions -> "Rollback - restore the archived WordPress web root" -> Run workflow**, typing `ROLLBACK`. It moves the new build aside and puts the archived web root (WordPress + `/p/`) back exactly as it was. The database was never touched.

## Secrets used by the workflows

`SFTP_HOST`, `SFTP_PORT`, `SFTP_USERNAME` (the bare Hostinger SSH username, no domain suffix), `SFTP_PASSWORD`, `SFTP_REMOTE_PATH`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. If SFTP/SSH auth fails: check that SSH access is enabled in hPanel (Hostinger disables it after inactivity) and that the username has no `.maitreya.org.il` suffix.
