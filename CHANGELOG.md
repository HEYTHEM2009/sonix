# Changelog — Sonix (root)

## 2026-07-19: Messaging Phase 1 (1:1 realtime chat)
Added the full 1:1 realtime messaging feature set (tasks 1–9): conversation API,
Reverb realtime (`message.sent` / `message.delivered` / `message.read`), read & delivery
receipts, per-message star/save/pin, search, drafts, bulk select, rich media
(documents/zip/pdf + inline video), voice messages with live waveform, blocking &
privacy toggles, and message audit logs.

Schema additions: `messages` (delivered, delivered_at, is_starred, is_saved,
is_pinned, duration, document), new `message_drafts` and `message_audit_logs` tables,
`users` privacy columns (privacy_last_seen, privacy_read_receipts, privacy_typing),
and search indexes on `messages`. `blocked_users` (v1.0) reused as-is.

See `docs/MESSAGING_CHANGELOG.md`, `docs/MESSAGING_API.md`, and `docs/DB_MESSAGING.md`
for full detail. Runtime verification is still pending (static sweep only).
