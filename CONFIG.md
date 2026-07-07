# Configuration Reference

## Backend Configuration

### Core Settings

```env
# Application
APP_NAME=YourAppName
APP_ENV=production
APP_KEY=base64:...  # Auto-generated
APP_DEBUG=false
APP_URL=https://your-domain.com

# Database
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=your_database
DB_USERNAME=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

### WebSocket (Reverb)

```env
REVERB_SERVER_HOST=127.0.0.1
REVERB_SERVER_PORT=8080
REVERB_HOST=your-domain.com
REVERB_PORT=443
REVERB_SCHEME=https
REVERB_APP_KEY=your-unique-key
REVERB_APP_SECRET=your-unique-secret
REVERB_APP_ID=your-app-id
```

### Media & Storage

```env
MEDIA_SIGNED_URL_TTL=3600
MEDIA_MAX_UPLOAD_SIZE=50
MEDIA_IMAGE_QUALITY=85
MEDIA_WATERMARK_ENABLED=false
MEDIA_WATERMARK_TEXT=YourApp
MEDIA_TRANSCODING_ENABLED=false
MEDIA_STORAGE_DISK=local
MEDIA_CDN_ENABLED=false
MEDIA_CDN_URL=
```

### Cloudinary (Optional)

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Anti-Scraping

```env
ANTI_SCRAPING_ENABLED=true
```

---

## Frontend Configuration

Create `expo-app/.env`:

```env
# API
EXPO_PUBLIC_API_URL=https://your-domain.com/api
EXPO_PUBLIC_WS_HOST=your-domain.com
EXPO_PUBLIC_REVERB_KEY=your-reverb-key
```

---

## Changing App Branding

### 1. App Name

Edit `expo-app/app.json`:
```json
{
  "expo": {
    "name": "YourAppName",
    "slug": "your-app-slug",
    "owner": "your-expo-username",
    "ios": {
      "bundleIdentifier": "com.yourcompany.app"
    },
    "android": {
      "package": "com.yourcompany.app"
    }
  }
}
```

### 2. Colors (Dark Theme)

Edit `expo-app/src/components/Theme.js`:
```javascript
export const colors = {
  primary: '#7c6cf7',      // Main color
  accent: '#d4a574',       // Secondary color
  background: '#0d0d1a',   // Background
  surface: '#1a1a2e',      // Card background
  text: '#ffffff',          // Text color
  textSecondary: '#8888aa', // Secondary text
};
```

### 3. Logo

Replace these files with your own logo:
- `expo-app/assets/icon.png` (1024x1024)
- `expo-app/assets/splash.png` (1284x2778)

### 4. App Description

Edit `expo-app/app.json` → `splash` section for splash screen colors.

---

## Deployment Options

### Option 1: Railway (Recommended)
1. Push code to GitHub
2. Connect Railway to your repo
3. Add PostgreSQL and Redis addons
4. Set environment variables
5. Deploy

### Option 2: Docker
1. Build Docker image
2. Push to Docker Hub/registry
3. Deploy to any VPS (DigitalOcean, Linode, etc.)

### Option 3: Render
1. Connect GitHub repo
2. Create Web Service
3. Add PostgreSQL database
4. Set environment variables
5. Deploy

---

## Demo Accounts

After seeding the database:

| Email | Password | Username |
|-------|----------|----------|
| admin@yourapp.com | password123 | admin |
| sara@test.com | password123 | sara |
