<?php

namespace App\Listeners;

use App\Events\MessageDelivered;
use App\Models\Message;
use Illuminate\Contracts\Queue\ShouldQueue;

class MarkMessageDelivered implements ShouldQueue
{
    public function handle(MessageDelivered $event): void
    {
        $message = Message::where('id', $event->messageId)
            ->where('receiver_id', $event->receiverId)
            ->first();

        if ($message && ! $message->delivered) {
            $message->delivered = true;
            $message->delivered_at = $event->deliveredAt;
            $message->saveQuietly();
        }
    }
}
