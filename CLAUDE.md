# CLAUDE.md

See also `.claude/CLAUDE.md` for pre-commit checks, CI/CD, and stack details.

## Git Safety Protocol

### Auto-commit at milestones
Commit after completing a logical unit of work (feature, fix, refactor). Notify the user but don't ask - just commit.

### Commit before destructive operations
Before any revert, rewrite, or large refactor, silently commit current state so nothing is lost.

### Pre-session snapshot
At the start of a session, if there's dirty state, commit it with a `WIP:` prefix before making new changes.

### WIP commits are fine
Use `WIP: description` prefix for work-in-progress commits. Better to save state than lose it.

### Check for uncommitted work at pauses
At natural pauses in the session, check `git status`. If there's uncommitted work, commit it.

### Push after features or session end
Push to remote after completing a feature or when ending a session.

### Verify clean state
Run `git status` after each commit to confirm it went through cleanly.

## Documentation Rule

Every non-trivial feature in this project must ship with documentation sufficient for a future session (human or agent) to understand and extend it without re-reading all the code:

1. **New component libraries** get a `README.md` in their folder covering purpose, architecture, API reference, and a "how to add a new X" checklist. See `src/components/retreat/README.md` as the reference example.
2. **New pages** start with a file-header comment describing what the page is, language, content source in the vault, assets location, and external integrations (webhooks, payments, analytics).
3. **Exported components, hooks, and types** get JSDoc blocks with a short summary, prop semantics, and at least one `@example` where helpful.
4. **Non-obvious behavior** (RTL quirks, payment flows, Meta pixel dedup, carousel logic, etc.) gets inline explanatory comments where the reasoning isn't self-evident from the code.
5. **When you finish a feature**, update the relevant README/comment in the same commit. Documentation drift is worse than no documentation.
6. **New features update the docs index.** Add an entry to `docs/README.md` so developers have a single entry point.

When starting a session on this project, read any nearby `README.md` files before touching their folder.

Docs never ship to production: Vite ignores `.md` files by default, and the GitHub Actions deploy workflow mirrors only `dist/`, so source documentation stays in the repo. Do not `import` README files from TypeScript/TSX.
