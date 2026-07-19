# Messaging API — Sonix

REST + Realtime reference for **1:1 realtime chat** (Messaging Phase 1, tasks 1–9).
All routes require a **Sanctum bearer token** (`Authorization: Bearer <token>`).
Routes are throttled; per-route limits are noted below.

> Base URL: `https://<api-host>/api`
> All request/response bodies are `application/json` unless noted.

---

## Endpoints

### Conversations list
- **GET** `/messages/conversations`
- Auth: Sanctum
- Response `200`:
  ```json
  [ { "user": { "id": 1, "username": "...", "avatar": "..." },
      "last_message": { "...": "Message resource" },
      "unread_count": 0 } ]
  ```

### Conversation history (1:1)
- **GET** `/messages/{userId}`
- Auth: Sanctum
- Query: `?page=1` (paginated)
- Response `200`:
  ```json
  { "data": [ "Message resource", "..." ],
    "meta": { "current_page": 1, "last_page": 3, "...": "..." } }
  ```
- Messages where the caller appears in `deleted_for` are excluded (`whereJsonDoesntContain('deleted_for', authUserId)`).

### Send a message
- **POST** `/messages`
- Auth: Sanctum — throttle `20,1` (20/min)
- Body:
  ```json
  { "receiver_id": 12,
    "content": "hi",
    "type": "text|image|voice|document",
    "image": "<url|file>", "voice": "<url>", "document": "<url>",
    "duration": 0, "reply_to": null }
  ```
- Success `201`: the created **Message resource**. Broadcasts `message.sent` (see Realtime).

### Mark conversation read
- **POST** `/messages/read/{userId}`
- Auth: Sanctum
- Body: `{ "message_id": 123 }` (optional — marks all from sender read if omitted)
- Success `200`: `{ "ok": true }`. Broadcasts `message.read`.

### Unread total
- **GET** `/messages/unread`
- Auth: Sanctum
- Response `200`: `{ "unread": 7 }`

### Presence: online ping
- **POST** `/messages/online` — updates `last_seen_at`/`online_at`
- **POST** `/messages/typing` (throttle `60,1`) — emits typing indicator
- **GET** `/messages/typing/{userId}` — current typing state for a peer

### Reactions (bonus, present in controller)
- **POST** `/messages/{id}/react` (throttle `30,1`) — `{ "emoji": "❤️" }`
- **DELETE** `/messages/{id}/react`

### Edit / Vanish
- **PUT** `/messages/{id}` (throttle `10,1`) — `{ "content": "edited" }` (sender only)
- **POST** `/messages/{id}/vanish` (throttle `10,1`) — `{ "minutes": 0 }`

### Delete
- **DELETE** `/messages/{id}` (throttle `20,1`) — delete for everyone (sender, within window)
- **DELETE** `/messages/{id}/for-me` (throttle `20,1`) — delete for self only
- **DELETE** `/messages/conversation/{userId}` — clear whole conversation

### Forward
- **POST** `/messages/{id}/forward` (throttle `20,1`)
- Body: `{ "receiver_id": 12 }`
- Success `201`: forwarded **Message resource**.

### Deliver receipt
- **POST** `/messages/{id}/deliver` (throttle `30,1`)
- Body: `{}`
- Success `200`: `{ "delivered": true, "delivered_at": "..." }`. Broadcasts `message.delivered`.

### Search
- **GET** `/messages/{userId}/search` (throttle `20,1`)
- Query: `?q=term&per_page=30`
- Response `200`: paginated **Message resource** list (LIKE-escaped `q`).

### Drafts
- **POST** `/messages/{userId}/draft` — `{ "content": "half typed..." }` (upsert by `user_id`+`partner_id`)
- **GET** `/messages/{userId}/draft` — `200`: `{ "content": "..." }` or `null`

### Star / Save / Pin (per message meta)
- **POST** `/messages/{id}/star` — `200`: `{ "is_starred": true }`
- **POST** `/messages/{id}/save` — `200`: `{ "is_saved": true }`
- **POST** `/messages/{id}/pin` — `200`: `{ "is_pinned": true }`

### Mute / Pin conversation
- **POST** `/messages/mute/{userId}` — toggle mute
- **POST** `/messages/pin/{userId}` — toggle conversation pin (distinct from per-message pin)

### Block / Unblock
- **POST** `/users/{userId}/block` — `block(user_id, blocked_id)`
- **POST** `/users/{userId}/unblock` — removes the `blocked_users` row
- Also available: **POST** `/block` (toggle), **GET** `/block/{userId}/status`, **GET** `/block/list` (via `BlockController`).

---

## Message resource shape
```json
{
  "id": 1,
  "content": "hi",
  "type": "text",
  "image": null, "voice": null, "document": null, "duration": null,
  "sender_id": 5, "receiver_id": 12,
  "is_read": false, "read_at": null,
  "delivered": false, "delivered_at": null,
  "is_starred": false, "is_saved": false, "is_pinned": false,
  "reply_to": null,
  "is_edited": false, "is_deleted": false, "deleted_for": [],
  "created_at": "2026-07-19T10:00:00.000000Z"
}
```

---

## Realtime (Reverb / WebSockets)

Client authenticates the private channel with the same Sanctum token.
Echo/Pusher client connects to Reverb and subscribes to `messages.{myUserId}`.

### Channels
| Channel | Visibility | Authorization |
|---|---|---|
| `messages.{userId}` | **private** | returns `[id, username, avatar]` for the authenticated user only |
| `typing.{userId}` | private | own user only |
| `notifications.{userId}` | private | own user only |
| `presence.users` | presence | returns `[id, username, avatar]` |

Registered in `laravel-backend/routes/channels.php`.

### Events (broadcast)
| Event (`broadcastAs`) | Channel(s) | Payload |
|---|---|---|
| `message.sent` (`MessageSent`) | `messages.{receiverId}` **and** `messages.{senderId}` | full message resource + nested `sender` |
| `message.delivered` (`MessageDelivered`) | `messages.{senderId}` | `{ id, delivered:true, delivered_at }` |
| `message.read` (`MessageRead`) | `messages.{senderId}` | `{ id, read:true, read_at, reader_id }` |
| `typing` (`TypingIndicator`) | `messages.{peerId}` | typing state |

Events implement `ShouldBroadcast` and broadcast on `PrivateChannel`.

---

## Setup

### Backend (Reverb)
Required `.env` keys (Laravel Reverb broadcasting driver):
```
BROADCAST_DRIVER=reverb
REVERB_APP_KEY=your-app-key
REVERB_APP_SECRET=your-app-secret
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http
# VITE/EXPO consume these via the frontend-prefixed vars below
```
Start the Reverb server (separate process / supervisor / Docker sidecar):
```
php artisan reverb:start
```
Redis is used for the broadcasting cache/queue in production.

### Frontend (Expo)
The Expo app reads Reverb config from env (e.g. `EXPO_PUBLIC_REVERB_APP_KEY`, `EXPO_PUBLIC_REVERB_APP_HOST`, `EXPO_PUBLIC_REVERB_PORT`, `EXPO_PUBLIC_REVERB_SCHEME`, `EXPO_PUBLIC_REVERB_APP_SECRET`, or the `REACT_APP_*`-prefixed equivalents — confirm with `src/api/realtime.js` / `src/api/websocket.js` at build time).

Two native dependencies are referenced by the messaging/media code but **are NOT yet installed**:
```
npx expo install expo-document-picker   # ~57.0.0
npx expo install expo-image-manipulator # ~57.0.0
```
Run the above before building/running the app, otherwise document/media + image-crop flows will fail to resolve the modules.

### Throttling summary
Conversation send `20/min`; reactions `30/min`; edit/vanish `10/min`; deletes `20/min`; forward `20/min`; typing `60/min`; deliver `30/min`; search `20/min`.
