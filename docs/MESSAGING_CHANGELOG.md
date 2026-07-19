# Messaging Changelog — Phase 1 (Tasks 1–9)

Phase 1 delivers **1:1 realtime chat** for Sonix: sending/receiving, read & delivery
receipts, message meta (star/save/pin), search, drafts, bulk actions, rich media
(docs/zip/pdf + inline video), voice messages with live waveform, realtime over
Reverb (Echo/Pusher), and blocking.

> **Runtime verification still pending.** This changelog reflects static verification
> only (PHP lint, Babel/JS syntax, route/model/service wiring). No backend runtime
> was available during the sweep.

## Tasks

### Task 1 — Messaging scaffold & conversation API
- `MessageController` conversation endpoints (`conversations`, `conversation`, `send`).
- `Message` model baseline + `deleted_for` JSON column (`whereJsonDoesntContain` queries).
- `BlockedUser` model + `blocked_users` (pre-existing v1.0 table: `user_id`, `blocked_id`).

### Task 2 — Realtime foundation (Reverb)
- `routes/channels.php`: private `messages.{userId}` channel returning `[id, username, avatar]`; `typing.{userId}`; `presence.users`.
- `BroadcastServiceProvider` registers `Broadcast::routes(['middleware'=>['auth:sanctum']])`.
- Events `MessageSent`, `MessageDelivered`, `MessageRead` (`ShouldBroadcast`, `PrivateChannel`).

### Task 3 — Read & delivery receipts
- Migration `2026_07_19_000001_add_delivered_to_messages` → `messages.delivered` (bool), `messages.delivered_at` (timestamp).
- `POST /messages/{id}/deliver` + `MessageDelivered` broadcast to `messages.{senderId}`.
- `POST /messages/read/{userId}` + `MessageRead` broadcast to `messages.{senderId}`.
- `Message` casts: `delivered` (bool), `delivered_at` (datetime).

### Task 4 — Message meta (star / save / pin)
- Migration `2026_07_19_000002_add_message_meta_columns` → `is_starred`, `is_saved`, `is_pinned` (bool).
- `POST /messages/{id}/star|save|pin` toggles.
- `Message` casts + fillable updated.

### Task 5 — Search, drafts, bulk select, read ticks
- Migration `2026_07_19_000003_create_message_drafts_table` → `message_drafts` (unique `user_id`+`partner_id`).
- Migration `2026_07_19_000007_add_indexes_for_search` → indexes on `content`, `created_at`, `(receiver_id, created_at)`, `(sender_id, created_at)`.
- `GET /messages/{userId}/search` (LIKE-escaped), draft `POST`/`GET` endpoints.
- `MessageService` methods: `search`, `saveDraft`, `getDraft`, `toggleStar`, `toggleSave`, `togglePin`.

### Task 6 — Rich media (documents + video)
- Migration `2026_07_19_000009_add_document_to_messages` → `messages.document` (string, nullable).
- Inline video bubble, document/zip/pdf upload + progress, `DocumentPicker` integration.

### Task 7 — Voice messages (waveform + recorder)
- Migration `2026_07_19_000008_add_duration_to_messages` → `messages.duration` (int, nullable).
- `VoiceRecorder` component (pause/resume, live `AudioWaveform`), `messages.duration` populated on send.

### Task 8 — Blocking & privacy
- Migration `2026_07_19_000005_add_privacy_and_audit_to_users` → `users.privacy_last_seen`, `privacy_read_receipts`, `privacy_typing` (bool, default true).
- `POST /users/{userId}/block` + `/unblock` delegating to `MessageService::block`/`unblock`.
- Audit logging migration `2026_07_19_000006_create_message_audit_logs_table` → `message_audit_logs`.

### Task 9 — Polish, realtime hardening, translations
- `useMessages` central hook, realtime manager (Echo backoff + presence), dedupe reconnect.
- `MessageService` refactor: `send`, `forward`, `edit`, `deleteForMe`, `deleteForEveryone`, `markDelivered`, `markRead`, `react`, `isBlocked`.
- Removed `?.(` optional-call syntax from `VoiceRecorder.js` (babel-preset-expo compatibility).
- Translation keys added for messaging UI.

## Schema changes (migrations)
| Order | File | Effect |
|---|---|---|
| 000001 | add_delivered_to_messages | `messages`: +`delivered`, +`delivered_at` |
| 000002 | add_message_meta_columns | `messages`: +`is_starred`, +`is_saved`, +`is_pinned` |
| 000003 | create_message_drafts_table | new `message_drafts` |
| 000005 | add_privacy_and_audit_to_users | `users`: +`privacy_last_seen`, +`privacy_read_receipts`, +`privacy_typing` |
| 000006 | create_message_audit_logs_table | new `message_audit_logs` |
| 000007 | add_indexes_for_search | `messages`: +4 indexes |
| 000008 | add_duration_to_messages | `messages`: +`duration` |
| 000009 | add_document_to_messages | `messages`: +`document` |

Note: `2026_07_19_000004` was intentionally **not** created — `blocked_users` already
existed in v1.0; the duplicate was reverted via a separate git commit.

## Realtime summary
- `message.sent` → `messages.{receiverId}` + `messages.{senderId}`
- `message.delivered` → `messages.{senderId}`
- `message.read` → `messages.{senderId}`

## Media / voice summary
- Document upload via `expo-document-picker` (not yet installed — see Setup flags).
- Image crop/manipulation via `expo-image-manipulator` (not yet installed).
- Voice: `expo-audio` `AudioRecorder` with live amplitude bars.

## Known gaps / pending
- Runtime (Laravel + Reverb) verification not executed — static sweep only.
- `expo-document-picker` / `expo-image-manipulator` declared in `package.json` (~57.0.0) but not installed.
- `pint --test` reports style fixes repo-wide (pre-existing, not messaging-specific).
