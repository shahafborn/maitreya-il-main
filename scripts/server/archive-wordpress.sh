#!/bin/bash
# Runs ON THE HOSTINGER SERVER (piped over ssh by cutover.yml), before the new
# build is uploaded. Argument: the web root (document root of maitreya.org.il).
#
# 1. Refuses to run unless the web root really holds WordPress and the old app.
# 2. Dumps the WordPress database (wp-cli, or mysqldump with wp-config.php's credentials).
# 3. Copies the ENTIRE web root (WordPress + /p/) to ~/site-archive-<timestamp>/public_html
# 4. Records the archive path in ~/site-archive-latest for the rollback script.
# Nothing is deleted or moved here - the web root is untouched when this finishes.
set -euo pipefail

ROOT="${1:?web root path required}"
case "$ROOT" in /*) ;; *) ROOT="$HOME/$ROOT" ;; esac

if [ ! -f "$ROOT/wp-config.php" ]; then
  echo "No wp-config.php in the web root - WordPress is not there (already cut over?). Refusing."
  exit 2
fi
if [ ! -f "$ROOT/p/index.html" ]; then
  echo "No p/index.html in the web root - unexpected layout. Refusing."
  exit 2
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
ARCHIVE="$HOME/site-archive-$STAMP"
mkdir -p "$ARCHIVE"
echo "Archiving to site-archive-$STAMP"

# --- database ---------------------------------------------------------------
if command -v wp >/dev/null 2>&1 && wp --path="$ROOT" db export "$ARCHIVE/wordpress-db.sql" --quiet 2>/dev/null; then
  echo "Database exported with wp-cli"
else
  cfg() { grep -oP "define\(\s*['\"]$1['\"]\s*,\s*['\"]\K[^'\"]*" "$ROOT/wp-config.php" | head -1; }
  DB_NAME="$(cfg DB_NAME)"; DB_USER="$(cfg DB_USER)"; DB_PASSWORD="$(cfg DB_PASSWORD)"; DB_HOST="$(cfg DB_HOST)"
  if [ -n "$DB_NAME" ] && MYSQL_PWD="$DB_PASSWORD" mysqldump -h "${DB_HOST:-localhost}" -u "$DB_USER" "$DB_NAME" > "$ARCHIVE/wordpress-db.sql" 2>/dev/null; then
    echo "Database exported with mysqldump"
  else
    echo "WARNING: database export failed - Hostinger's own backups (hPanel -> Files -> Backups) still hold it"
    rm -f "$ARCHIVE/wordpress-db.sql"
  fi
fi
[ -f "$ARCHIVE/wordpress-db.sql" ] && gzip -f "$ARCHIVE/wordpress-db.sql"

# --- files ------------------------------------------------------------------
cp -a "$ROOT" "$ARCHIVE/public_html"
echo "$ARCHIVE" > "$HOME/site-archive-latest"
echo "Web root copied: $(du -sh "$ARCHIVE/public_html" | cut -f1), $(find "$ARCHIVE/public_html" -type f | wc -l) files"
echo "Archive complete."
