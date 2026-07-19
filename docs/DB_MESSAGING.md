# Messaging Schema — Sonix

Messaging Phase 1 schema additions for **1:1 realtime chat**. All tables use Eloquent
conventions (`id` bigIncrements, `created_at`/`updated_at`). Auth: Sanctum.

## `messages` (additions)
Base `messages` table predates Phase 1. Phase 1 added the following nullable columns:

| Column | Type | Notes |
|---|---|---|
| `delivered` | boolean | delivery receipt flag (default false) |
| `delivered_at` | timestamp/nullable | when the peer's device received it |
| `is_starred` | boolean | per-message star (default false) |
| `is_saved` | boolean | per-message save (default false) |
| `is_pinned` | boolean | per-message pin (default false) |
| `duration` | integer/nullable | voice-message length in seconds |
| `document` | string/nullable | uploaded document/zip/pdf URL |

Pre-existing relevant columns: `sender_id`, `receiver_id`, `content`, `type`,
`image`, `voice`, `reply_to`, `is_read`, `read_at`, `is_deleted`, `is_edited`,
`original_content`, `is_disappearing`, `disappears_at`, `deleted_for`.

### `deleted_for` (soft delete per user)
`deleted_for` is stored as a **JSON array of user IDs**. To fetch messages still
visible to a user, query with **`whereJsonDoesntContain('deleted_for', $userId)`**
(never `LIKE '%id%'`). See `MessageService` (`deleteForMe`/`deleteForEveryone`) and
`MessageController` conversation query.

### Casts / fillable (`app/Models/Message.php`)
- Casts: `delivered` (bool), `delivered_at` (datetime), `is_starred` (bool),
  `is_saved` (bool), `is_pinned` (bool) — plus existing `is_read`, `is_deleted`,
  `is_edited`, `is_disappearing` (bool) and `read_at`, `disappears_at` (datetime).
- Fillable includes: `delivered`, `delivered_at`, `is_starred`, `is_saved`,
  `is_pinned`, `duration`, `document` (and the original baseline fields).

## `message_drafts`
Per-user-per-partner draft text (typing persistence).
| Column | Type | Notes |
|---|---|---|
| `id` | bigIncrements | |
| `user_id` | unsigned bigint | FK → `users` (cascade) |
| `partner_id` | unsigned bigint | FK → `users` (cascade) |
| `content` | text/nullable | draft body |
| unique | `(user_id, partner_id)` | one draft per conversation side |

## `message_audit_logs`
Audit trail for sensitive message actions (delete-for-everyone, etc.).
| Column | Type | Notes |
|---|---|---|
| `id` | bigIncrements | |
| `message_id` | unsigned bigint/nullable | |
| `actor_id` | unsigned bigint/nullable | user who performed the action |
| `action` | string | e.g. `delete_for_everyone` |
| `meta` | text/nullable | JSON context |
| index | `(message_id, action)` | |

## `users` (privacy additions)
Phase 1 added privacy toggles used by read receipts / presence / typing:
| Column | Type | Notes |
|---|---|---|
| `privacy_last_seen` | boolean | default true |
| `privacy_read_receipts` | boolean | default true (controls `message.read` emit) |
| `privacy_typing` | boolean | default true |

(`online_at`/`is_private` existed earlier and are unrelated to this phase.)

## `blocked_users` (pre-existing, v1.0)
Already present before Phase 1 (duplicate migration `2026_07_19_000004` was reverted).
| Column | Type | Notes |
|---|---|---|
| `id` | bigIncrements | |
| `user_id` | foreignId | blocker — FK `users` cascade |
| `blocked_id` | foreignId | blocked user — FK `users` cascade |
| unique | `(user_id, blocked_id)` | |

`App\Models\BlockedUser` uses columns **`user_id`** and **`blocked_id`** (not `blocker_id`),
matching this schema. `MessageService::block($userId, $blockedId)` inserts a row;
`unblock` removes it; `isBlocked($a, $b)` checks either direction.

## Search indexes (`messages`)
Added in `2026_07_19_000007_add_indexes_for_search`:
- `messages(content)`
- `messages(created_at)`
- `messages(receiver_id, created_at)`
- `messages(sender_id, created_at)`

## Conventions
- All message access via Eloquent / `MessageService`; no raw SQL concatenation.
- `deleted_for` queried with `whereJsonDoesntContain` (security rule, see project AGENTS.md).
- Boolean flags default `false`; privacy flags default `true`.
