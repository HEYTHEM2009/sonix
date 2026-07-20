# Database Schema — Sonix

Sonix ships with **40 Eloquent models** and **56+ migrations**. Below are the key tables.

## Core
- **users** — id, username, email, password, bio, avatar, role (`user`/`admin`), is_banned, last_seen_at, timestamps
- **password_reset_tokens**, **personal_access_tokens** (Sanctum)

## Social Graph
- **follows** — follower_id, following_id
- **blocks** — user_id, blocked_id
- **muted_words** — user_id, word

## Content
- **posts** — user_id, caption, media, type, is_published, view_count, pinned
- **likes** — user_id, likeable (polymorphic)
- **comments** — user_id, post_id, parent_id, body
- **bookmarks** — user_id, post_id
- **hashtags** — tag, uses_count
- **mentions** — mentionable (polymorphic), user_id

## Stories
- **stories** — user_id, media, type, expires_at, view_count
- **story_views** — story_id, user_id

## Reels (v2)
- **reels** — user_id, video_url, thumbnail, caption, music_title, duration, is_published, like_count, comment_count, share_count, view_count
- **reel_likes** — user_id, reel_id
- **reel_comments** — user_id, reel_id, parent_id, body
- **reel_saves** — user_id, reel_id
- **reel_shares** — user_id, reel_id, platform
- **reel_hashtags** — reel_id, tag
- **reel_mentions** — reel_id, user_id
- **reel_watch_history** — user_id, reel_id, watched_seconds, completed
- **reel_analytics** — reel_id, views, likes, shares, saves, engagement_rate, trending_score, recommendation_score, completion_rate
- **music_tracks** — title, artist, url, genre, duration, is_trending (powers the in-app music library)

### Reels Pro columns
- **reels.status** — `published | draft | scheduled` (drafts/scheduled are hidden from public feeds)
- **reels.scheduled_at** — when a scheduled reel becomes visible
- **reels.is_featured** — curator-pinned reels for the Featured feed
- **users.is_pro** / **users.pro_until** — creator Pro badge

## Chat
- **conversations**, **messages** (is_deleted, deleted_for), **group_messages**, **conversation_participants**

## Moderation & Admin
- **reports** — reporter_id, reportable (polymorphic), reason, description, status, moderated_by, moderated_at
- **notifications** — user_id, type, data, read_at
- **blocked_words** (bad words) — word
- **settings** — key, value
- **audit_logs** — actor_id, action, payload
- **roles**, **permissions**, **role_permissions**

## Conventions
- All tables use `id` bigIncrements, `created_at`/`updated_at` timestamps, soft-deletes where appropriate.
- Polymorphic relations used for likes/comments/mentions/reports.
- Indexes added on hot columns (reel_comments.parent_id/user_id, reel_likes.reel_id, notifications.user_id, follows, etc.).
- `last_seen_at` and report moderation columns added via migration `2026_07_18_000003`.

## Migrations added for v2
- `2026_07_18_000001_create_reels_v2_tables` — reel save/share/hashtag/mention/watch-history/analytics
- `2026_07_18_000002_add_missing_indexes` — performance indexes (defensive)
- `2026_07_18_000003_admin_support_columns` — users.last_seen_at, reports moderation columns
