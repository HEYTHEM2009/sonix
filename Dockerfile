FROM php:8.4-fpm

RUN apt-get update && apt-get install -y \
    git curl zip unzip libpng-dev libonig-dev libxml2-dev \
    libpq-dev libzip-dev nginx supervisor \
    && docker-php-ext-install pdo_pgsql mbstring exif pcntl bcmath gd zip \
    && pecl install redis && docker-php-ext-enable redis \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app/laravel-backend

COPY laravel-backend/composer.json laravel-backend/composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

COPY laravel-backend/ .

RUN composer dump-autoload --optimize

RUN mkdir -p public/uploads public/reels storage/framework/{cache,sessions,views} storage/logs bootstrap/cache /tmp/nginx-upload \
    && chmod -R 777 storage \
    && chmod -R 777 bootstrap/cache \
    && chmod -R 777 /tmp/nginx-upload \
    && chmod -R 777 public/uploads \
    && chmod -R 777 public/reels

RUN echo "upload_max_filesize = 50M" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "post_max_size = 55M" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "max_execution_time = 300" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "max_input_time = 300" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "memory_limit = 256M" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "file_uploads = On" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "upload_tmp_dir = /tmp/nginx-upload" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "session.auto_start = Off" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "cgi.fix_pathinfo = 0" >> /usr/local/etc/php/conf.d/uploads.ini

COPY nginx-site.conf /etc/nginx/sites-available/default

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 80

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

CMD ["/usr/local/bin/docker-entrypoint.sh"]
