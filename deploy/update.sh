#!/usr/bin/env bash
# Met la production a jour avec la derniere version de main.
#
# Lance par le deploiement automatique (GitHub Actions, via une cle SSH qui ne
# peut executer QUE ce script), ou a la main : sudo certifloop-deploy
#
# Installe une fois sur le serveur, hors du depot :
#   install -m 700 deploy/update.sh /usr/local/sbin/certifloop-deploy
# Ainsi, un push ne peut pas modifier ce que la cle de deploiement a le droit
# de lancer ; un changement de ce script se recopie a la main.
#
# Ne touche jamais a la banque de questions en place (pas de db:seed).
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/certifloop}"
APP_USER="${APP_USER:-www-data}"
BRANCH="${BRANCH:-main}"

cd "$APP_DIR"
artisan() { sudo -u "$APP_USER" HOME=/tmp php artisan "$@"; }

# En cas d'echec a n'importe quelle etape, le site ressort du mode maintenance.
trap 'echo "Echec du deploiement, site remis en ligne sur l ancienne config." >&2; artisan up || true' ERR

echo "> code : origin/$BRANCH"
git fetch --quiet origin "$BRANCH"
git reset --hard "origin/$BRANCH"
echo "  $(git log -1 --format='%h %s')"

echo "> maintenance (le temps de reconstruire)"
artisan down --retry=30

echo "> dependances PHP"
COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader --no-interaction --no-progress --quiet

echo "> fichiers du site (vite build)"
npm ci --no-audit --no-fund --loglevel=error
npm run build --silent

chown -R "$APP_USER:$APP_USER" storage bootstrap/cache database

echo "> base de donnees"
artisan migrate --force

echo "> caches"
artisan config:cache
artisan view:cache

artisan up
systemctl restart certifloop-queue

trap - ERR
echo "Deploiement termine : $(git log -1 --format='%h %s')"
