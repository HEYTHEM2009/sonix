FROM php:8.4-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git curl zip unzip libpng-dev libonig-dev libxml2-dev \
    libpq-dev libzip-dev nginx supervisor \
    && docker-php-ext-install pdo_pgsql mbstring exif pcntl bcmath gd zip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app/laravel-backend

# Copy composer files first (for caching)
COPY laravel-backend/composer.json laravel-backend/composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

# Copy the rest
COPY laravel-backend/ .

RUN composer dump-autoload --optimize

# Create necessary directories
RUN mkdir -p public/uploads storage/framework/{cache,sessions,views} storage/logs bootstrap/cache \
    && chmod -R 775 public/uploads storage bootstrap/cache

# PHP-FPM config: increase upload limits
RUN echo "upload_max_filesize = 50M" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "post_max_size = 55M" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "max_execution_time = 300" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "max_input_time = 300" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "memory_limit = 256M" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "default_socket_timeout = 300" >> /usr/local/etc/php/conf.d/uploads.ini

# Nginx config
RUN echo 'server { \
    listen 8000; \
    server_name _; \
    root /app/laravel-backend/public; \
    index index.php index.html; \
    client_max_body_size 50M; \
    location / { \
        try_files $uri $uri/ /index.php?$query_string; \
    } \
    location ~ \.php$ { \
        fastcgi_pass 127.0.0.1:9000; \
        fastcgi_index index.php; \
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name; \
        include fastcgi_params; \
        fastcgi_read_timeout 300; \
    } \
    location ~ /\.ht { deny all; } \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|mp4|webm)$ { \
        expires 30d; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/sites-available/default

# Supervisor config: run nginx + php-fpm + queue worker + scheduler
RUN echo '[supervisord] \
nodaemon=true \
logfile=/var/log/supervisord.log \
\
[program:php-fpm] \
command=php-fpm -F \
autostart=true \
autorestart=true \
\
[program:nginx] \
command=nginx -g "daemon off;" \
autostart=true \
autorestart=true \
\
[program:queue] \
command=php /app/laravel-backend/artisan queue:work --sleep=3 --tries=3 --max-time=3600 \
autostart=true \
autorestart=true \
redirect_stderr=true \
\
[program:scheduler] \
command=/bin/sh -c "while true; do php /app/laravel-backend/artisan schedule:run --verbose --no-interaction & sleep 60; done" \
autostart=true \
autorestart=true \
redirect_stderr=true \
' > /etc/supervisor/conf.d/supervisord.conf

EXPOSE 8000

CMD ["sh", "-c", "php artisan key:generate --force && php artisan migrate --force && php artisan db:seed --force && supervisord -c /etc/supervisor/conf.d/supervisord.conf"]
