# Project Instructions

## Before Committing
- Run `npm run test` and verify all tests pass before committing
- Run `npx tsc --noEmit` to check for type errors
- Run `npx vite build` to verify production build

## After Pushing
- Watch the CI/CD pipeline: `gh run watch <run-id> --repo shahafborn/maitreya-il-main`
- Confirm to the user that the deploy succeeded (or report the failure)

## Stack
- React + TypeScript + Vite
- Supabase (remote: iyjymeqbyloxkwymhzpl.supabase.co)
- Hosting: Hostinger via SFTP (GitHub Actions CI/CD)
- Base path: `/p/`
- Domain: maitreya.org.il
