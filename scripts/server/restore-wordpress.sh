#!/bin/bash
# Runs ON THE HOSTINGER SERVER (piped over ssh by rollback.yml). Argument: the web root.
# Moves the current web root (the new build) aside and puts the archived copy
# (WordPress + the old /p/ app) back exactly as it was before the cutover.
set -euo pipefail

ROOT="${1:?web root path required}"
case "$ROOT" in /*) ;; *) ROOT="$HOME/$ROOT" ;; esac

ARCHIVE="$(cat "$HOME/site-archive-latest" 2>/dev/null || true)"
if [ -z "$ARCHIVE" ] || [ ! -f "$ARCHIVE/public_html/wp-config.php" ]; then
  echo "No archived web root found - nothing to restore."
  exit 2
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
PARKED="$HOME/site-rolledback-$STAMP"
mv "$ROOT" "$PARKED"
cp -a "$ARCHIVE/public_html" "$ROOT"
echo "Restored the archived web root; the new build is parked in site-rolledback-$STAMP"
