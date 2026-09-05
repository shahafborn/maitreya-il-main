# Project Instructions

## Before Committing
- Run `npm run test` and verify all tests pass before committing
- Run `npx tsc --noEmit` to check for type errors
- Run `npm run build` to verify the production build (Vite + pre-render + sitemap + redirects + link check; needs Playwright's Chromium: `npx playwright install chromium` once)

## After Pushing
- Watch the CI/CD pipeline: `gh run watch <run-id> --repo shahafborn/maitreya-il-main`
- Confirm to the user that the deploy succeeded (or report the failure)

## Stack
- React + TypeScript + Vite
- Supabase (remote: iyjymeqbyloxkwymhzpl.supabase.co)
- Hosting: Hostinger via SFTP (GitHub Actions CI/CD) - see `docs/deployment.md`
- Base path: `/` - the app serves the whole domain since the 2026-09 cutover (old `/p/...` links 301-redirect)
- Domain: maitreya.org.il
- Public pages are pre-rendered to real HTML at build time; the page list lives in `scripts/site-routes.mjs`, redirects in `scripts/redirects.mjs`
