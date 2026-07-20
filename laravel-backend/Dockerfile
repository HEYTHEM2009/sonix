# Sonix API — Docker image (PHP 8.3 FPM + Nginx)
FROM php:8.3-fpm

# System deps
RUN apt-get update && apt-get install -y \
    git unzip libpq-dev libonig-dev libzip-dev libpng-dev libcurl4-openssl-dev \
    nginx supervisor cron ffmpeg \
    && docker-php-ext-install pdo_pgsql pdo_mysql mbstring zip bcmath opcache \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

WORKDIR /app/laravel-backend

# Install dependencies first (better layer caching)
COPY laravel-backend/composer.json laravel-backend/composer.lock* ./
RUN composer install --no-dev --optimize-autoloader --no-interaction || composer install --no-interaction

COPY laravel-backend ./

# Runtime config
COPY laravel-backend/docker/nginx-site.conf /etc/nginx/sites-available/default
COPY laravel-backend/docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY laravel-backend/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
    && chown -R www-data:www-data /app/laravel-backend/storage /app/laravel-backend/bootstrap/cache

EXPOSE 80

ENTRYPOINT ["docker-entrypoint.sh"]
