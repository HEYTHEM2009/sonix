# 🧹 Clean Exit Checklist — Sonix

This checklist ensures all personal information is removed before selling the source code.

---

## ✅ Completed Items

### 1. Code Cleanup

- [x] Removed personal username from `expo-app/app.json` (owner field)
- [x] Changed bundle identifier from `com.xxx.sonix` to `com.sonix.app`
- [x] Removed GitHub username from `README.md`
- [x] Removed GitHub username from `SALES_PITCH.md`
- [x] Removed hardcoded Cloudinary API credentials from `docker-entrypoint.sh`
- [x] Removed hardcoded Runsite URLs from `docker-entrypoint.sh`
- [x] Removed EAS project ID reference (will need buyer's own)

### 2. Configuration Files

- [x] `.env.example` files contain only placeholder values
- [x] No real API keys in source code
- [x] No personal email addresses in code

---

## 📋 Buyer Handover Checklist

### Step 1: Create New Accounts (Buyer)

The buyer should create these accounts with their own email:

- [ ] GitHub account (for repository)
- [ ] Expo account (for EAS builds)
- [ ] Cloudinary account (for media storage)
- [ ] Runsite/Railway/DigitalOcean (for backend hosting)
- [ ] Domain name (optional, for custom URL)

### Step 2: Configure Environment

- [ ] Copy `laravel-backend/.env.example` to `laravel-backend/.env`
- [ ] Copy `expo-app/.env.example` to `expo-app/.env`
- [ ] Fill in database credentials
- [ ] Fill in Cloudinary credentials
- [ ] Fill in mail credentials (for password reset)
- [ ] Set `APP_URL` to their domain

### Step 3: Database Setup

- [ ] Create PostgreSQL database
- [ ] Run `php artisan migrate`
- [ ] Run `php artisan db:seed` (optional, for test data)

### Step 4: Deploy Backend

- [ ] Push code to their GitHub repository
- [ ] Deploy to hosting platform (Runsite/Railway/DigitalOcean)
- [ ] Verify API is working

### Step 5: Build Mobile App

- [ ] Update `expo-app/app.json` with their Expo username
- [ ] Run `npx expo login` with their Expo account
- [ ] Run `npx eas build --platform android --profile production`

---

## 🔒 Security Notes

### What's Included in Sale

- ✅ Complete source code (backend + frontend)
- ✅ Database migrations
- ✅ Docker configuration
- ✅ Documentation (INSTALL.md, CONFIG.md, DEPLOY.md, CUSTOMIZATION.md)
- ✅ Environment templates (.env.example)

### What's NOT Included

- ❌ Personal GitHub account
- ❌ Personal Expo account
- ❌ Personal Cloudinary account
- ❌ Personal hosting accounts
- ❌ API keys or credentials
- ❌ Database data
- ❌ Media files (uploaded by test users)

### Post-Sale Responsibilities

**Seller (You):**
- Transfer GitHub repository ownership
- Provide 48-hour support window for questions
- No access to buyer's accounts

**Buyer:**
- Create their own accounts
- Configure their own API keys
- Deploy and maintain their instance
- Handle legal compliance (GDPR, privacy laws)

---

## 📝 Legal Disclaimer

This source code is sold "AS-IS" with no warranties. The buyer assumes full responsibility for:

- Legal compliance (privacy laws, content moderation)
- Security of their deployment
- Ongoing maintenance and updates
- Any third-party service costs

---

## 🚀 Quick Start Commands

```bash
# Backend
cd laravel-backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve

# Frontend
cd expo-app
npm install
cp .env.example .env
# Edit .env with API URL
npx expo start
```

---

*Last updated: July 2026*
