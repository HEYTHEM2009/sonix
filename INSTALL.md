# Installation Guide

## Prerequisites

- **PHP 8.2+** with extensions: pdo_pgsql, mbstring, openssl, tokenizer, gd, exif
- **PostgreSQL 15+**
- **Redis 7+**
- **Composer 2+**
- **Node.js 18+** with npm
- **Expo CLI** (`npm install -g expo-cli`)

---

## Step 1: Clone & Setup Backend

```bash
cd laravel-backend

# Install PHP dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Edit .env with your database credentials
# DB_HOST=127.0.0.1
# DB_PORT=5432
# DB_DATABASE=your_database
# DB_USERNAME=postgres
# DB_PASSWORD=your_password

# Create database and run migrations
php artisan migrate

# Seed demo data
php artisan db:seed

# Start the backend server
php artisan serve --port=5000
```

Backend will run at: `http://localhost:5000`

---

## Step 2: Setup Frontend (Expo)

```bash
cd expo-app

# Install JavaScript dependencies
npm install

# Create .env file
echo "EXPO_PUBLIC_API_URL=http://localhost:5000/api" > .env
echo "EXPO_PUBLIC_WS_HOST=localhost" >> .env
echo "EXPO_PUBLIC_REVERB_KEY=your-reverb-key" >> .env

# Start Expo development server
npx expo start
```

---

## Step 3: Database Setup

### Local PostgreSQL

```sql
CREATE DATABASE your_database;
CREATE USER your_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE your_database TO your_user;
```

### Run Migrations

```bash
php artisan migrate
```

### Seed Demo Data (Optional)

```bash
php artisan db:seed
```

This creates:
- 6 demo users with avatars
- 10 sample posts
- Stories, likes, comments, follows

---

## Step 4: Environment Variables

### Backend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `APP_NAME` | Yes | Your app name |
| `APP_URL` | Yes | Backend URL (e.g., `http://localhost:5000`) |
| `DB_HOST` | Yes | PostgreSQL host |
| `DB_PORT` | Yes | PostgreSQL port (default: 5432) |
| `DB_DATABASE` | Yes | Database name |
| `DB_USERNAME` | Yes | Database user |
| `DB_PASSWORD` | Yes | Database password |
| `REDIS_HOST` | Yes | Redis host (default: 127.0.0.1) |
| `REVERB_APP_KEY` | Yes | WebSocket key |
| `REVERB_APP_SECRET` | Yes | WebSocket secret |
| `CLOUDINARY_CLOUD_NAME` | Optional | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Optional | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Optional | Cloudinary API secret |

### Frontend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Yes | Backend API URL |
| `EXPO_PUBLIC_WS_HOST` | Yes | WebSocket host |
| `EXPO_PUBLIC_REVERB_KEY` | Yes | WebSocket key |

---

## Step 5: Build for Production

### Android APK (EAS Build)

```bash
cd expo-app

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build APK
eas build --platform android --profile preview
```

### Docker Deployment

```bash
# Build Docker image
docker build -t your-app .

# Run container
docker run -p 8080:80 \
  -e APP_NAME="YourApp" \
  -e APP_URL="https://your-domain.com" \
  -e DB_HOST="your-db-host" \
  -e DB_DATABASE="your-db" \
  -e DB_USERNAME="your-db-user" \
  -e DB_PASSWORD="your-db-password" \
  your-app
```

---

## Troubleshooting

### "Could not find driver" error
```bash
sudo apt-get install php-pgsql php-mbstring php-openssl php-tokenizer php-gd php-exif
composer install
```

### "Connection refused" for database
- Make sure PostgreSQL is running
- Check `DB_HOST`, `DB_PORT`, `DB_DATABASE` in `.env`

### "Module not found" error in Expo
```bash
cd expo-app
rm -rf node_modules
npm install
npx expo start --clear
```
