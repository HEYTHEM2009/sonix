#!/usr/bin/env bash
set -e

cd /app/laravel-backend

# Generate key if missing
if [ -z "$APP_KEY" ]; then
  php artisan key:generate --force
fi

# Run migrations (idempotent)
php artisan migrate --force

# Cache for production
php artisan config:cache
php artisan route:cache || true

# Ensure storage is writable
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Start supervisor (nginx + php-fpm + scheduler)
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
