#!/bin/bash
# Serves dist/ through the Mac's built-in Apache with .htaccess fully honored
# (mod_rewrite, mod_headers, ErrorDocument) - the closest local stand-in for
# Hostinger's LiteSpeed. Use it to rehearse the redirect map before a deploy:
#
#   npm run build
#   bash scripts/local-apache.sh            # start on http://127.0.0.1:8089
#   node scripts/smoke-test.mjs http://127.0.0.1:8089
#   bash scripts/local-apache.sh stop
#
# Runtime files (config, logs, pid) live in .apache-local/ (git-ignored).
# macOS may refuse httpd access to folders under ~/Documents (privacy
# protection); in that case point RUN and DIST_DIR at a copy elsewhere:
#   RUN=/tmp/apache DIST_DIR=/tmp/dist bash scripts/local-apache.sh
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RUN="${RUN:-$ROOT/.apache-local}"
DIST_DIR="${DIST_DIR:-$ROOT/dist}"
PORT="${PORT:-8089}"
mkdir -p "$RUN"

cat > "$RUN/httpd.conf" <<EOF
ServerRoot "/usr"
Listen 127.0.0.1:$PORT
LoadModule mpm_prefork_module libexec/apache2/mod_mpm_prefork.so
LoadModule authz_core_module libexec/apache2/mod_authz_core.so
LoadModule mime_module libexec/apache2/mod_mime.so
LoadModule log_config_module libexec/apache2/mod_log_config.so
LoadModule headers_module libexec/apache2/mod_headers.so
LoadModule dir_module libexec/apache2/mod_dir.so
LoadModule rewrite_module libexec/apache2/mod_rewrite.so
LoadModule unixd_module libexec/apache2/mod_unixd.so
PidFile "$RUN/httpd.pid"
ErrorLog "$RUN/error.log"
CustomLog "$RUN/access.log" "%h %>s %r"
LogLevel warn
TypesConfig /private/etc/apache2/mime.types
AddType text/javascript .mjs
ServerName localhost
DocumentRoot "$DIST_DIR"
<Directory "$DIST_DIR">
  AllowOverride All
  Require all granted
  Options -Indexes +FollowSymLinks
</Directory>
DirectoryIndex index.html
EOF

case "${1:-start}" in
  stop)
    /usr/sbin/httpd -f "$RUN/httpd.conf" -k stop
    echo "stopped"
    ;;
  restart)
    /usr/sbin/httpd -f "$RUN/httpd.conf" -k restart
    ;;
  *)
    /usr/sbin/httpd -f "$RUN/httpd.conf" -k start
    echo "Apache serving $DIST_DIR at http://127.0.0.1:$PORT (logs in $RUN)"
    ;;
esac
