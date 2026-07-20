# API Reference — Sonix

Base URL: `https://your-domain.com/api`

All authenticated requests require:
```
Authorization: Bearer <sanctum_token>
```

Errors return a JSON envelope:
```json
{ "success": false, "message": "Human readable message", "errors": {} }
```
Success returns:
```json
{ "success": true, "data": { ... } }
```

---

## Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register (username, email, password) |
| POST | `/auth/login` | Login → returns token + user |
| POST | `/auth/logout` | Revoke token |
| POST | `/auth/forgot-password` | Request reset link |
| POST | `/auth/reset-password` | Reset password |
| GET  | `/users/me` | Current user |

## Users & Social Graph
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/users/{id}` | Public profile |
| PUT  | `/users/me` | Update profile |
| POST | `/follow/{id}` | Follow / unfollow |
| GET  | `/users/{id}/followers` | Followers |
| GET  | `/users/{id}/following` | Following |
| GET  | `/users/search?q=` | Search users |
| GET  | `/users/search/suggestions` | Suggestions |
| POST | `/users/search/recent` | Save recent search |

## Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/posts` | Feed |
| POST | `/posts` | Create post |
| GET  | `/posts/{id}` | Post detail |
| PUT  | `/posts/{id}` | Edit |
| DELETE | `/posts/{id}` | Delete |
| POST | `/posts/{id}/like` | Like / unlike |
| POST | `/posts/{id}/comment` | Comment |
| POST | `/posts/{id}/save` | Bookmark |
| GET  | `/posts/hashtag/{tag}` | Hashtag feed |

## Stories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/stories` | Stories feed |
| POST | `/stories` | Create story |
| GET  | `/stories/{id}` | Story detail |
| DELETE | `/stories/{id}` | Delete |

## Reels (v2)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/reels` | Reels feed (paginated) |
| POST | `/reels` | Upload reel |
| GET  | `/reels/foryou` | Personalized "For You" |
| GET  | `/reels/trending` | Trending reels |
| GET  | `/reels/saved` | Current user saved reels |
| GET  | `/reels/search?q=` | Search reels |
| GET  | `/reels/hashtag/{tag}` | Reels by hashtag |
| GET  | `/reels/hashtags/popular` | Popular hashtags |
| GET  | `/reels/insights` | Creator analytics |
| GET  | `/reels/{id}` | Reel detail |
| PUT  | `/reels/{id}` | Edit reel |
| DELETE | `/reels/{id}` | Delete reel |
| POST | `/reels/{id}/like` | Like / unlike |
| POST | `/reels/{id}/comment` | Comment |
| POST | `/reels/{id}/save` | Save / unsave |
| POST | `/reels/{id}/share` | Record share |
| POST | `/reels/{id}/view` | Record watch history |

Request body for `POST /reels`:
```json
{
  "video": "<file>",
  "caption": "My first reel #fun",
  "music_title": "Original audio",
  "music_url": "https://...",
  "hashtags": ["fun", "travel"],
  "mentions": [12, 33],
  "status": "published | draft | scheduled",
  "scheduled_at": "2026-08-01 12:00:00",
  "is_featured": false
}
```
Response includes parsed `hashtags`, `mentions`, `analytics` (views, likes, engagement rate).

### Reels Pro endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/reels/drafts` | Current user's draft reels |
| GET  | `/reels/scheduled` | Current user's scheduled reels |
| GET  | `/reels/featured` | Admin-curated featured feed |
| GET  | `/reels/music?genre=&term=` | Music library for the create flow |
| POST | `/reels/pro` | Toggle current user's Pro badge `{ enabled: true }` |

## Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/search/users?q=` | Users |
| GET  | `/search/reels?q=` | Reels |
| GET  | `/search/posts?q=` | Posts |
| GET  | `/search/stories?q=` | Stories |
| GET  | `/search/hashtags?q=` | Hashtags |
| GET  | `/search/audio?q=` | Audio tracks |
| GET  | `/search/trending` | Trending hashtags |
| GET  | `/search/suggestions?q=` | Unified suggestions (cached) |

## Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/conversations` | List conversations |
| POST | `/conversations` | Start / open |
| GET  | `/conversations/{id}/messages` | Messages |
| POST | `/conversations/{id}/messages` | Send message |
| POST | `/conversations/{id}/read` | Mark read |
| POST | `/group-chat` | Create group |

## Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/notifications` | List |
| POST | `/notifications/{id}/read` | Mark read |
| DELETE | `/notifications/{id}` | Delete |

## Admin (requires `role=admin`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/admin/dashboard` | Stats |
| GET  | `/admin/users` | Users list |
| GET  | `/admin/users/{id}` | User detail |
| POST | `/admin/users/{id}/ban` | Ban |
| POST | `/admin/users/{id}/unban` | Unban |
| GET  | `/admin/reels` | Reels (with counts) |
| GET  | `/admin/posts` | Posts |
| GET  | `/admin/stories` | Stories |
| GET  | `/admin/reports` | Reports queue |
| PUT  | `/admin/reports/{id}` | Resolve report |
| DELETE | `/admin/content/{type}/{id}` | Remove content |
| GET  | `/admin/analytics` | Reel analytics |
| POST | `/admin/notifications` | Broadcast notification |
| GET  | `/admin/roles` | Roles |
| GET  | `/admin/permissions` | Permissions |
| GET  | `/admin/settings` | Settings |
| PUT  | `/admin/settings` | Update setting |
| GET  | `/admin/logs` | Audit logs |
| GET/POST/DELETE | `/admin/bad-words[/{id}]` | Profanity filter |

---

## Rate Limiting
API routes are throttled (default Sanctum limiter). Responses include `X-RateLimit-*` headers. Authenticated users get a higher limit.

## Media URLs
Media served via `/media/{path}` is signed for anonymous users. Authenticated requests pass automatically. The mobile client resolves URLs through `resolveUrl()` in `src/api/client.js`.
