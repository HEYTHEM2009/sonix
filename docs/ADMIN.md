# Admin Panel — Sonix

The Admin Panel lets operators manage the community and moderate content. Access requires the user `role` column to equal `admin`.

## Granting admin
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@sonix.app';
```
Or via Tinker:
```bash
php artisan tinker
User::where('email','admin@sonix.app')->update(['role'=>'admin']);
```

In the mobile app, an **Admin Panel** entry appears in *Settings* automatically for admin users.

## Features

### Dashboard
Live counts: users, reels, posts, stories, reports, comments. Backed by a 120s cache (`Cache::remember('admin_dashboard', ...)`).

### Users
- List users.
- **Ban** / **Unban** via `POST /admin/users/{id}/ban|unban`.

### Reels / Posts / Stories
- Review content with engagement counts.
- **Remove** any item via `DELETE /admin/content/{type}/{id}` (type = `reel`|`post`|`story`).

### Reports
- Queue of user reports (`reporter → reported`).
- **Resolve** sets `status='resolved'`, `moderated_by`, `moderated_at`.

### Bad Words (Profanity Filter)
- CRUD on `blocked_words`. Used by the content-filter service to scrub captions/comments.

### Broadcasts
- `POST /admin/notifications` with `{ message, user_id? }`. Omit `user_id` to notify everyone.

### Settings & Logs
- Key/value app settings (`GET/PUT /admin/settings`).
- Audit log viewer (`GET /admin/logs`).

## Authorization
Every admin route is wrapped in `auth:sanctum` and the controller's `authorizeAdmin()` guard, which aborts with `403` for non-admins.

## Notes
- All admin actions are rate-limited and logged.
- The dashboard cache can be cleared with `php artisan cache:clear`.
