<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageRead implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $messageId;

    public int $readerId;

    public int $senderId;

    public string $readAt;

    public function __construct(int $messageId, int $readerId, int $senderId, string $readAt)
    {
        $this->messageId = $messageId;
        $this->readerId = $readerId;
        $this->senderId = $senderId;
        $this->readAt = $readAt;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("messages.{$this->senderId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.read';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->messageId,
            'read' => true,
            'read_at' => $this->readAt,
            'reader_id' => $this->readerId,
        ];
    }
}
