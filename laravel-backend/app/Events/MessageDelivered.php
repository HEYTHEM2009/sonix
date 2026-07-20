<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageDelivered implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $messageId;

    public int $senderId;

    public int $receiverId;

    public string $deliveredAt;

    public function __construct(int $messageId, int $senderId, int $receiverId, string $deliveredAt)
    {
        $this->messageId = $messageId;
        $this->senderId = $senderId;
        $this->receiverId = $receiverId;
        $this->deliveredAt = $deliveredAt;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('messages.'.$this->senderId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.delivered';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->messageId,
            'delivered' => true,
            'delivered_at' => $this->deliveredAt,
        ];
    }
}
