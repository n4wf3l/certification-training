# Déploiement de CertifLoop

Serveur Linux (Ubuntu / Debian) avec nginx, PHP 8.2+ (FPM) et MySQL ou PostgreSQL. Les commandes sont lancées depuis le dossier de l'application, par exemple `/var/www/certifloop`.

## 1. Code et dépendances

```bash
git clone https://github.com/n4wf3l/certification-training.git /var/www/certifloop
cd /var/www/certifloop
composer install --no-dev --optimize-autoloader
npm ci && npm run build
chown -R www-data:www-data storage bootstrap/cache
```

## 2. Configuration (`.env`)

```bash
cp .env.production.example .env
php artisan key:generate
```

Remplir au minimum :

| Variable | Pourquoi |
|---|---|
| `APP_URL` | adresse publique en `https://` |
| `DB_*` | base de données |
| `MAIL_*`, `MAIL_FROM_ADDRESS` | réinitialisation du mot de passe, prévenance avant suppression. `MAIL_FROM_ADDRESS` sert aussi de contact sur `/legal`. |
| `PUBLISHER_NAME`, `PUBLISHER_ADDRESS`, `PUBLISHER_COMPANY_ID` | identité de l'éditeur sur `/legal`, obligatoire en Belgique et dans l'UE. Le numéro d'entreprise (BCE) seulement s'il existe. |

`APP_DEBUG=false` et `PAYMENTS_ENABLED=false` sont déjà les bonnes valeurs dans le modèle.

## 3. Base de données

```bash
php artisan migrate --force
php artisan db:seed --force      # certifications et questions, aucun compte de démo en production
php artisan storage:link
php artisan config:cache && php artisan view:cache
```

`db:seed` charge tout le contenu depuis `database/seeders/data` : certifications, questions (ITIL 426, CCNA 368), traductions FR/EN, cours, réglages et logos. Rien n'est à ressaisir dans l'admin.

**Mettre à jour le contenu plus tard.** En local, après des changements de questions ou de cours, lancer `php artisan certifloop:dump-seeders` puis commiter `database/seeders/data`. Sur le serveur, `db:seed` met à jour les certifications et les cours, mais **ne remplace pas une banque de questions déjà en place** : la remplacer effacerait aussi l'historique des utilisateurs (réponses, statistiques, favoris). Pour la remplacer quand même, en connaissance de cause :

```bash
SEED_REPLACE_QUESTIONS=1 php artisan db:seed --force
```

Ne pas lancer `php artisan route:cache`. Les routes sont enregistrées sous le préfixe de langue de chaque requête (racine en français, `/en/…` en anglais) : un cache figerait un seul préfixe et les pages `/en` répondraient 404.

## 4. Worker, scheduler et nginx

```bash
sudo bash deploy/install.sh --domain certifloop.example --app-dir /var/www/certifloop
sudo certbot --nginx -d certifloop.example
```

Le script installe :

- **`certifloop-queue`** : worker permanent `queue:work` (systemd, redémarre tout seul) ;
- **`certifloop-scheduler.timer`** : `schedule:run` chaque minute. Il fait tourner les rappels, le résumé hebdomadaire et la **suppression des comptes inactifs** (chaque nuit à 3 h, prévenance à J-7) ;
- **le site nginx** : **sans journal d'accès**, donc aucune IP enregistrée. Il ajoute aussi une limite de 10 requêtes par seconde par visiteur, gardée en mémoire seulement ;
- **la rotation du journal d'erreurs nginx** : nginx y écrit l'IP du client et ne permet pas de la retirer, donc seules les erreurs critiques sont gardées, et 24 h maximum.

Pour préférer un cron au timer systemd, ne pas activer `certifloop-scheduler.timer` et ajouter dans `crontab -u www-data -e` :

```
* * * * * cd /var/www/certifloop && php artisan schedule:run >> /dev/null 2>&1
```

## 5. Premier admin

```bash
sudo -u www-data php artisan admin:create --email=toi@exemple.com
```

Le mot de passe est demandé au clavier, masqué (12 caractères minimum). Il ne passe ni par le `.env` ni par l'historique du shell, et un compte existant n'est jamais écrasé.

Variante sans saisie interactive : remplir `ADMIN_EMAIL` / `ADMIN_PASSWORD` dans le `.env`, lancer `php artisan db:seed --force`, puis vider `ADMIN_PASSWORD`.

## 6. Vérifications

```bash
systemctl status certifloop-queue                 # active (running)
systemctl list-timers certifloop-scheduler        # prochaine exécution < 1 min
sudo -u www-data php artisan schedule:list        # accounts:purge-inactive à 03:00
sudo -u www-data php artisan accounts:purge-inactive --dry-run
```

Puis ouvrir `/legal` et vérifier que l'éditeur et le contact s'affichent.

## Derrière un proxy (Cloudflare…)

Sans configuration, Laravel voit l'IP du proxy pour tous les visiteurs, et les limites anti-abus deviennent communes à tout le monde. Il faut alors déclarer les proxys de confiance (`trustProxies` dans `bootstrap/app.php`). Sans proxy, avec nginx et PHP-FPM sur la même machine, il n'y a rien à faire.
