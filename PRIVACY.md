# Privacy Policy

**Last Updated:** July 2026

## Overview

Sonix is a social media platform starter kit. This privacy policy describes how data is handled when you deploy and run this application.

## Data Collection

When deployed, the application collects and stores:

### User-Provided Data
- **Username and email address** — Required for account creation
- **Profile picture** — Optional, uploaded by the user
- **Bio text** — Optional, user-provided
- **Posts, stories, and messages** — Content created by users

### Automatically Collected Data
- **Push notification token** — Used to send notifications (via Expo)
- **Online status** — Cached temporarily in Redis (expires after 2 minutes)
- **IP address** — Used for authentication security (not stored long-term)

## Data Storage

All data is stored in your own database (PostgreSQL). We do not have access to your deployed instance. You are responsible for:

- Securing your database
- Backing up user data
- Complying with local data protection laws

## Third-Party Services

### Railway (Backend Hosting)
- Your database and API are hosted on Railway
- Railway's privacy policy applies: https://railway.app/privacy

### Expo (Frontend & Push Notifications)
- Push notification tokens are sent to Expo's servers
- Expo's privacy policy applies: https://expo.dev/privacy

## Data Sharing

We (the Sonix project) do not collect, sell, or share any user data from your deployed instance. Your data stays on your infrastructure.

## User Rights

Users of your deployed app have the right to:
- **Access** their personal data
- **Delete** their account and all associated data
- **Export** their data

These features are built into the application (Settings → Delete Account).

## Children's Privacy

This application is not intended for children under 13. If you deploy this app, you are responsible for ensuring compliance with COPPA and local regulations.

## Changes to This Policy

We may update this privacy policy. Changes will be reflected in the `privacy.md` file.

## Contact

For questions about this privacy policy, open an issue on GitHub or contact the project maintainer.

---

**Note:** This privacy policy is a template. You should customize it for your specific deployment and consult with a legal professional for compliance with applicable laws (GDPR, CCPA, etc.).
