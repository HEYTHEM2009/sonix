<?php

namespace App\Services;

use App\Events\MessageDelivered;
use App\Events\MessageRead;
use App\Events\MessageSent;
use App\Models\BlockedUser;
use App\Models\Message;
use App\Models\MessageAuditLog;
use App\Models\MessageDraft;
use App\Models\MessageReaction;
use App\Models\Notification;
use App\Models\User;
use App\Services\Security\FloodService;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

class MessageService
{
    private const DELETED_PLACEHOLDER = 'This message was deleted';

    public function __construct(
        private readonly FloodService $flood
    ) {}

    public function send(User $sender, array $data): Message
    {
        $receiverId = (int) ($data['receiver_id'] ?? 0);

        // Block checks: sender must not be blocked by receiver, and sender must not have blocked receiver.
        if ($this->isBlocked($sender->id, $receiverId)) {
            throw new \InvalidArgumentException('You cannot message this user.');
        }

        // Flood protection: max 30 messages per 60 seconds per sender.
        if (! $this->flood->allow("msg:{$sender->id}", 30, 60)) {
            throw new TooManyRequestsHttpException(60, 'Too many messages sent. Please slow down.');
        }

        $message = new Message();
        $message->sender_id = $sender->id;
        $message->receiver_id = $receiverId;
        $message->content = $data['content'] ?? null;
        $message->type = $data['type'] ?? 'text';
        $message->image = $data['image'] ?? null;
        $message->voice = $data['voice'] ?? null;
        $message->reply_to = $data['reply_to'] ?? null;
        $message->duration = $data['duration'] ?? null;
        $message->is_read = false;
        $message->delivered = false;
        $message->is_deleted = false;
        $message->deleted_for = [];
        $message->save();

        $message->load('sender:id,username,avatar', 'replyMessage.sender:id,username');

        broadcast(new MessageSent($message))->toOthers();

        // Notification dispatch must never break the send flow.
        try {
            $notification = Notification::create([
                'type' => 'message',
                'message' => $sender->username . ' sent you a message',
                'seen' => false,
                'user_id' => $receiverId,
                'sender_id' => $sender->id,
            ]);

            broadcast(new \App\Events\NotificationCreated($notification))->toOthers();
        } catch (\Throwable $e) {
            report($e);
        }

        $this->audit($message->id, $sender->id, 'send', [
            'receiver_id' => $receiverId,
            'type' => $message->type,
        ]);

        return $message;
    }

    public function markDelivered(int $messageId, int $receiverId): void
    {
        $message = Message::where('id', $messageId)
            ->where('receiver_id', $receiverId)
            ->where('delivered', false)
            ->firstOrFail();

        $message->delivered = true;
        $message->delivered_at = now();
        $message->saveQuietly();

        broadcast(new MessageDelivered(
            $message->id,
            $message->sender_id,
            $message->receiver_id,
            $message->delivered_at->toISOString()
        ))->toOthers();
    }

    public function markRead(int $messageId, int $readerId): void
    {
        $message = Message::where('id', $messageId)
            ->where('receiver_id', $readerId)
            ->firstOrFail();

        $message->is_read = true;
        $message->read_at = now();
        $message->saveQuietly();

        // Respect the receiver's read-receipt privacy setting.
        // We always mark the message read locally for the receiver's own view,
        // but only broadcast the read receipt to the sender when the receiver
        // allows read receipts (privacy_read_receipts === true).
        $receiver = User::find($message->receiver_id);
        if ($receiver && $receiver->privacy_read_receipts) {
            broadcast(new MessageRead(
                $message->id,
                $readerId,
                $message->sender_id,
                $message->read_at->toISOString()
            ))->toOthers();
        }

        $this->audit($message->id, $readerId, 'read', [
            'sender_id' => $message->sender_id,
            'receipt_sent' => (bool) ($receiver && $receiver->privacy_read_receipts),
        ]);
    }

    public function react(int $messageId, int $userId, string $emoji): MessageReaction
    {
        $message = Message::where('id', $messageId)
            ->where(function ($q) use ($userId) {
                $q->where('sender_id', $userId)->orWhere('receiver_id', $userId);
            })
            ->where('is_deleted', false)
            ->firstOrFail();

        $reaction = MessageReaction::updateOrCreate(
            [
                'message_id' => $messageId,
                'user_id' => $userId,
                'emoji' => $emoji,
            ],
            [
                'message_id' => $messageId,
                'user_id' => $userId,
                'emoji' => $emoji,
            ]
        );

        $this->audit($messageId, $userId, 'react', ['emoji' => $emoji]);

        return $reaction;
    }

    public function edit(int $messageId, int $userId, string $content): Message
    {
        $message = Message::where('id', $messageId)
            ->where('sender_id', $userId)
            ->where('is_deleted', false)
            ->firstOrFail();

        if ($message->is_edited === false && $message->original_content === null) {
            $message->original_content = $message->content;
        }

        $message->content = $content;
        $message->is_edited = true;
        $message->save();

        $this->audit($messageId, $userId, 'edit', []);

        return $message;
    }

    public function deleteForMe(int $messageId, int $userId): void
    {
        $message = Message::where('id', $messageId)
            ->where(function ($q) use ($userId) {
                $q->where('sender_id', $userId)->orWhere('receiver_id', $userId);
            })
            ->firstOrFail();

        $deletedFor = $message->deleted_for ?? [];
        if (! in_array($userId, $deletedFor, true)) {
            $deletedFor[] = $userId;
        }
        $message->deleted_for = $deletedFor;
        $message->saveQuietly();

        $this->audit($messageId, $userId, 'delete_for_me', []);
    }

    public function deleteForEveryone(int $messageId, int $userId): void
    {
        $message = Message::where('id', $messageId)
            ->where('sender_id', $userId)
            ->where('is_deleted', false)
            ->firstOrFail();

        $message->is_deleted = true;
        $message->content = self::DELETED_PLACEHOLDER;
        $message->image = null;
        $message->voice = null;
        $message->saveQuietly();

        $this->audit($messageId, $userId, 'delete', ['scope' => 'everyone']);
    }

    public function forward(int $messageId, int $userId, int $toUserId): Message
    {
        $source = Message::where('id', $messageId)
            ->where('is_deleted', false)
            ->firstOrFail();

        // Flood protection also applies to forwards.
        if (! $this->flood->allow("fwd:{$userId}", 20, 60)) {
            throw new TooManyRequestsHttpException(60, 'Too many forwards sent. Please slow down.');
        }

        // Cannot forward to a user who blocks the forwarder, or whom the forwarder has blocked.
        if ($this->isBlocked($userId, $toUserId)) {
            throw new \InvalidArgumentException('You cannot forward to this user.');
        }

        $forwarded = new Message();
        $forwarded->sender_id = $userId;
        $forwarded->receiver_id = $toUserId;
        $forwarded->content = $source->content;
        $forwarded->type = $source->type;
        $forwarded->image = $source->image;
        $forwarded->voice = $source->voice;
        $forwarded->reply_to = null;
        $forwarded->is_read = false;
        $forwarded->delivered = false;
        $forwarded->is_deleted = false;
        $forwarded->deleted_for = [];
        $forwarded->save();

        $forwarded->load('sender:id,username,avatar');

        broadcast(new MessageSent($forwarded))->toOthers();

        $this->audit($forwarded->id, $userId, 'forward', [
            'source_id' => $source->id,
            'to_user_id' => $toUserId,
        ]);

        return $forwarded;
    }

    public function search(int $userId, string $query, int $perPage = 30)
    {
        // Escape LIKE wildcards so user input cannot alter the pattern.
        $escaped = addcslashes($query, '%_\\');

        return Message::where(function ($q) use ($userId) {
                $q->where('sender_id', $userId)->orWhere('receiver_id', $userId);
            })
            ->where('content', 'LIKE', '%' . $escaped . '%')
            ->where('is_deleted', false)
            ->whereJsonDoesntContain('deleted_for', $userId)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function saveDraft(int $userId, int $partnerId, ?string $content): MessageDraft
    {
        if ($content === null || trim($content) === '') {
            MessageDraft::where('user_id', $userId)
                ->where('partner_id', $partnerId)
                ->delete();

            return new MessageDraft();
        }

        return MessageDraft::updateOrCreate(
            [
                'user_id' => $userId,
                'partner_id' => $partnerId,
            ],
            [
                'content' => $content,
            ]
        );
    }

    public function getDraft(int $userId, int $partnerId): ?MessageDraft
    {
        return MessageDraft::where('user_id', $userId)
            ->where('partner_id', $partnerId)
            ->first();
    }

    public function toggleStar(int $messageId, int $userId): bool
    {
        return $this->toggleFlag($messageId, $userId, 'is_starred');
    }

    public function toggleSave(int $messageId, int $userId): bool
    {
        return $this->toggleFlag($messageId, $userId, 'is_saved');
    }

    public function togglePin(int $messageId, int $userId): bool
    {
        return $this->toggleFlag($messageId, $userId, 'is_pinned');
    }

    private function toggleFlag(int $messageId, int $userId, string $column): bool
    {
        // Lock the row to avoid a lost update race on concurrent toggles.
        return DB::transaction(function () use ($messageId, $userId, $column) {
            $message = Message::where('id', $messageId)
                ->where(function ($q) use ($userId) {
                    $q->where('sender_id', $userId)->orWhere('receiver_id', $userId);
                })
                ->lockForUpdate()
                ->firstOrFail();

            $message->{$column} = ! $message->{$column};
            $message->saveQuietly();

            return (bool) $message->{$column};
        });
    }

    public function block(int $userId, int $blockedId): void
    {
        BlockedUser::firstOrCreate([
            'user_id' => $userId,
            'blocked_id' => $blockedId,
        ]);
    }

    public function unblock(int $userId, int $blockedId): void
    {
        BlockedUser::where('user_id', $userId)
            ->where('blocked_id', $blockedId)
            ->delete();
    }

    public function isBlocked(int $a, int $b): bool
    {
        return BlockedUser::where('user_id', $b)
            ->where('blocked_id', $a)
            ->exists()
            || BlockedUser::where('user_id', $a)
                ->where('blocked_id', $b)
                ->exists();
    }

    private function audit(int $messageId, int $actorId, string $action, array $meta): void
    {
        try {
            MessageAuditLog::create([
                'message_id' => $messageId,
                'actor_id' => $actorId,
                'action' => $action,
                'meta' => $meta,
            ]);
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
