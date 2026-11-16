#!/usr/bin/env bash
# Installe sur le serveur (Ubuntu / Debian, nginx + PHP-FPM, en root) :
#   - le worker de file d'attente et le scheduler (systemd) ;
#   - le site nginx sans journal d'acces (aucune IP enregistree) ;
#   - la rotation du journal d'erreurs nginx (24 h max).
#
# Usage :
#   sudo bash deploy/install.sh --domain certifloop.example --app-dir /var/www/certifloop
# Options : --user www-data  --php /usr/bin/php  --fpm-sock /run/php/php8.3-fpm.sock
set -euo pipefail

DOMAIN=""
APP_DIR=""
APP_USER="www-data"
PHP_BIN="$(command -v php || echo /usr/bin/php)"
FPM_SOCK="$(ls /run/php/php*-fpm.sock 2>/dev/null | head -n1 || true)"

while [ $# -gt 0 ]; do
  case "$1" in
    --domain) DOMAIN="$2"; shift 2 ;;
    --app-dir) APP_DIR="$2"; shift 2 ;;
    --user) APP_USER="$2"; shift 2 ;;
    --php) PHP_BIN="$2"; shift 2 ;;
    --fpm-sock) FPM_SOCK="$2"; shift 2 ;;
    *) echo "Option inconnue : $1" >&2; exit 1 ;;
  esac
done

[ "$(id -u)" -eq 0 ] || { echo "A lancer en root (sudo)." >&2; exit 1; }
[ -n "$DOMAIN" ] && [ -n "$APP_DIR" ] || { echo "--domain et --app-dir sont obligatoires." >&2; exit 1; }
[ -f "$APP_DIR/artisan" ] || { echo "$APP_DIR/artisan introuvable." >&2; exit 1; }
[ -S "$FPM_SOCK" ] || { echo "Socket PHP-FPM introuvable, preciser --fpm-sock." >&2; exit 1; }

HERE="$(cd "$(dirname "$0")" && pwd)"
render() {
  sed -e "s#__APP_DIR__#$APP_DIR#g" -e "s#__USER__#$APP_USER#g" -e "s#__PHP__#$PHP_BIN#g" \
      -e "s#__DOMAIN__#$DOMAIN#g" -e "s#__PHP_FPM_SOCK__#$FPM_SOCK#g" "$1"
}

echo "> systemd : worker + scheduler"
for unit in certifloop-queue.service certifloop-scheduler.service certifloop-scheduler.timer; do
  render "$HERE/systemd/$unit" > "/etc/systemd/system/$unit"
done
systemctl daemon-reload
systemctl enable --now certifloop-queue.service certifloop-scheduler.timer

echo "> nginx : site sans journal d'acces"
render "$HERE/nginx/certifloop.conf" > /etc/nginx/sites-available/certifloop.conf
ln -sf /etc/nginx/sites-available/certifloop.conf /etc/nginx/sites-enabled/certifloop.conf
nginx -t
systemctl reload nginx

echo "> logrotate : journal d'erreurs nginx efface apres 24 h"
cp "$HERE/logrotate/certifloop" /etc/logrotate.d/certifloop

echo
echo "Fait. Verifications :"
echo "  systemctl status certifloop-queue        # doit etre active (running)"
echo "  systemctl list-timers certifloop-scheduler  # prochaine execution dans moins d'une minute"
echo "  sudo -u $APP_USER $PHP_BIN $APP_DIR/artisan schedule:list"
echo "Ensuite : certbot --nginx -d $DOMAIN, puis le premier admin (deploy/README.md)."
