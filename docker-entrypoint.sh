#!/bin/sh

PORT=${PORT:-8080}

# Runsite passes a single DATABASE_URL / REDIS_URL (postgresql://... / redis://...).
# Parse them into the discrete vars Laravel expects, only when not explicitly provided.
if [ -n "${DATABASE_URL}" ] && [ -z "${DB_HOST}" ]; then
    _db_rest="${DATABASE_URL#*://}"
    _db_userpass="${_db_rest%%@*}"
    DB_USERNAME="${_db_userpass%%:*}"
    DB_PASSWORD="${_db_userpass#*:}"
    _db_host="${_db_rest#*@}"
    DB_HOST="${_db_host%%:*}"
    _db_hostport="${_db_host#*:}"
    DB_PORT="${_db_hostport%%/*}"
    DB_DATABASE="${_db_hostport#*/}"
    DB_DATABASE="${DB_DATABASE%%\?*}"
    echo "Parsed DATABASE_URL -> host=${DB_HOST} port=${DB_PORT} db=${DB_DATABASE}"
fi

if [ -n "${REDIS_URL}" ] && [ -z "${REDIS_HOST}" ]; then
    _redis_rest="${REDIS_URL#*://}"
    case "$_redis_rest" in
        *@*)
            _redis_userpass="${_redis_rest%%@*}"
            REDIS_PASSWORD="${_redis_userpass#*:}"
            _redis_rest="${_redis_rest#*@}"
            ;;
    esac
    REDIS_HOST="${_redis_rest%%:*}"
    _redis_rest="${_redis_rest#*:}"
    REDIS_PORT="${_redis_rest%%/*}"
    echo "Parsed REDIS_URL -> host=${REDIS_HOST} port=${REDIS_PORT}"
fi

cat > /etc/nginx/sites-available/default <<NGINX
server {
    listen ${PORT};
    server_name _;
    client_max_body_size 50M;
    client_body_temp_path /tmp/nginx-upload;

    root /app/sonix-web;
    index index.html;

    location ^~ /api/ {
        include fastcgi_params;
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_param SCRIPT_FILENAME /app/laravel-backend/public/index.php;
        fastcgi_param REQUEST_URI \$uri?\$args;
        fastcgi_read_timeout 300;
        fastcgi_send_timeout 300;
        fastcgi_connect_timeout 300;
        fastcgi_buffering off;
    }

    location /storage/ {
        alias /app/laravel-backend/storage/app/public/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /app/ {
        proxy_pass http://127.0.0.1:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    location /apps/ {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME /app/laravel-backend/public/index.php;
        fastcgi_read_timeout 300;
        fastcgi_send_timeout 300;
        fastcgi_connect_timeout 300;
        fastcgi_buffering off;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
        expires -1;
    }

    location ~ /\.ht { deny all; }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|mp4|webm)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

cat > /app/laravel-backend/.env <<EOF
APP_NAME=Sonix
APP_ENV=${APP_ENV:-production}
APP_KEY=${APP_KEY:-}
APP_DEBUG=${APP_DEBUG:-false}
APP_URL=${APP_URL:-http://localhost}

APP_LOCALE=en
APP_FALLBACK_LOCALE=en

DB_CONNECTION=pgsql
DB_HOST=${DB_HOST:-127.0.0.1}
DB_PORT=${DB_PORT:-5432}
DB_DATABASE=${DB_DATABASE:-sonix_api}
DB_USERNAME=${DB_USERNAME:-postgres}
DB_PASSWORD=${DB_PASSWORD:-}

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=true
SESSION_PATH=/
SESSION_DOMAIN=null

BROADCAST_CONNECTION=reverb
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database

CACHE_STORE=file

REDIS_CLIENT=phpredis
REDIS_HOST=${REDIS_HOST:-127.0.0.1}
REDIS_PASSWORD=${REDIS_PASSWORD:-null}
REDIS_PORT=${REDIS_PORT:-6379}

REVERB_SERVER_HOST=127.0.0.1
REVERB_SERVER_PORT=8081
REVERB_HOST=${REVERB_HOST:-localhost}
REVERB_PORT=${REVERB_PORT:-443}
REVERB_SCHEME=${REVERB_SCHEME:-https}
REVERB_APP_KEY=${REVERB_APP_KEY:-}
REVERB_APP_SECRET=${REVERB_APP_SECRET:-}
REVERB_APP_ID=${REVERB_APP_ID:-}
REVERB_APP_PING_INTERVAL=60

MAIL_MAILER=${MAIL_MAILER:-log}
MAIL_HOST=${MAIL_HOST:-}
MAIL_PORT=${MAIL_PORT:-587}
MAIL_USERNAME=${MAIL_USERNAME:-}
MAIL_PASSWORD=${MAIL_PASSWORD:-}
MAIL_ENCRYPTION=${MAIL_ENCRYPTION:-tls}
MAIL_FROM_ADDRESS=${MAIL_FROM_ADDRESS:-noreply@sonix.app}

MEDIA_SIGNED_URL_TTL=3600
MEDIA_MAX_UPLOAD_SIZE=50
MEDIA_IMAGE_QUALITY=85
MEDIA_WATERMARK_ENABLED=false
MEDIA_WATERMARK_TEXT=Sonix
MEDIA_TRANSCODING_ENABLED=false
ANTI_SCRAPING_ENABLED=true
MEDIA_CDN_ENABLED=false
MEDIA_CDN_URL=

CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME:-}
CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY:-}
CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET:-}
LOG_CHANNEL=stderr
LOG_LEVEL=error
EOF

echo "Nginx listening on port ${PORT}"
echo "Generated .env file"

chmod -R 777 /app/laravel-backend/storage 2>/dev/null
chmod -R 777 /app/laravel-backend/bootstrap/cache 2>/dev/null
mkdir -p /app/laravel-backend/public/uploads
chmod -R 777 /app/laravel-backend/public/uploads 2>/dev/null

if echo "$APP_KEY" | grep -q "base64:"; then
    echo "APP_KEY already set"
else
    php artisan key:generate --force
fi

php artisan app:ensure-feature-tables 2>&1 | head -20 || echo "WARNING: Feature table check failed, continuing..."
php artisan migrate --force || echo "WARNING: Migrations failed, continuing..."

php artisan db:seed --force || echo "WARNING: Seeding failed, continuing..."

php artisan config:clear 2>/dev/null
php artisan route:clear 2>/dev/null
php artisan view:clear 2>/dev/null
php artisan cache:clear 2>/dev/null

echo "Starting services..."

exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
