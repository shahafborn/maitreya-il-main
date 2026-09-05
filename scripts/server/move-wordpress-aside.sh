#!/bin/bash
# Runs ON THE HOSTINGER SERVER (piped over ssh by cutover.yml), after the new
# build has been uploaded over the web root. Argument: the web root.
#
# Moves the WordPress installation and the old /p/ app folder OUT of the web
# root into the archive folder taken by archive-wordpress.sh (a second,
# independent copy already lives there). Nothing is deleted: every item is
# moved with `mv` and can be moved back by hand or by restore-wordpress.sh.
# Files that are neither WordPress nor ours (e.g. .well-known) are listed and
# left in place.
set -euo pipefail

ROOT="${1:?web root path required}"
case "$ROOT" in /*) ;; *) ROOT="$HOME/$ROOT" ;; esac

ARCHIVE="$(cat "$HOME/site-archive-latest" 2>/dev/null || true)"
if [ -z "$ARCHIVE" ] || [ ! -d "$ARCHIVE/public_html/wp-admin" ]; then
  echo "No verified archive of the web root found - refusing to touch the web root."
  exit 2
fi
if [ ! -f "$ROOT/_pages/index.html" ] || [ ! -f "$ROOT/.htaccess" ]; then
  echo "The new build is not in the web root yet - refusing to touch the web root."
  exit 2
fi

ASIDE="$ARCHIVE/moved-out-of-web-root"
mkdir -p "$ASIDE"

WORDPRESS="wp-admin wp-includes wp-content wp-activate.php wp-blog-header.php wp-comments-post.php \
wp-config.php wp-config-sample.php wp-cron.php wp-links-opml.php wp-load.php wp-login.php wp-mail.php \
wp-settings.php wp-signup.php wp-trackback.php xmlrpc.php index.php license.txt readme.html \
.htaccess.bak .htaccess.bak.old wp-cli.yml .wp-cli p"

for name in $WORDPRESS; do
  if [ -e "$ROOT/$name" ]; then
    mv "$ROOT/$name" "$ASIDE/$name"
    echo "moved aside: $name"
  fi
done

# Ours (from dist/) - anything else is reported, not touched
OURS="index.html 404.html .htaccess assets _pages media content robots.txt sitemap.xml llms.txt \
favicon.png favicon-192.png apple-touch-icon.png placeholder.svg"
for f in "$ROOT"/* "$ROOT"/.[!.]*; do
  [ -e "$f" ] || continue
  b="$(basename "$f")"
  case " $OURS " in *" $b "*) continue ;; esac
  case "$b" in og-*.png|og-*.jpg) continue ;; esac
  echo "left in place (not ours, not WordPress): $b"
done
echo "WordPress moved out of the web root (kept under $(basename "$ARCHIVE")/moved-out-of-web-root)."
