# Privacy Policy — Sonix Starter Kit

This policy explains how a Sonix-based application handles data. **Sonix is software,
not a hosted service** — the policy below is a template you must adapt and publish for
your own deployed instance.

## 1. Who is responsible
The operator of the deployed Sonix app (you, the licensee) is the data controller.
Sonix the software does not itself collect or store end-user data on third-party servers.

## 2. Data the app may collect
Depending on configuration, your instance may process:
- Account data: email, username, password (hashed), profile info.
- User content: posts, reels, stories, comments, messages, media.
- Activity: follows, likes, views, presence/online status.
- Device tokens for push notifications (via your Firebase/APNs project).
- Optional analytics (Reel watch history, post statistics).

## 3. How data is used
- To provide the social features (feeds, chat, reels, search).
- To send notifications you enable.
- To moderate content and enforce community rules (admin tools).
- To improve the product via optional analytics you control.

## 4. Data storage & security
- Stored in **your** database and media storage (local / S3 / Cloudinary).
- Passwords are hashed (bcrypt); 2FA codes are single-use and expiring.
- Media URLs are signed; admin routes are gated by role.

## 5. Third parties
Your deployment may integrate: Firebase (push), SMTP provider (email), Cloudinary/S3
(media), Reverb/Redis (realtime/cache). Each has its own privacy policy you must disclose.

## 6. User rights
Provide users the ability to edit/delete their content and delete their account
(`/auth/account` endpoint). Honor data-access and deletion requests per applicable law.

## 7. Children
Do not target users under the age of 13 (or the minimum in your jurisdiction). Enforce
age gating in your deployment.

## 8. Changes
Post your finalized policy URL in your app store listing and in-app settings.

> **Action required:** Replace this template with your own legal policy before launch.
