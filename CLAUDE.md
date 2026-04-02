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
