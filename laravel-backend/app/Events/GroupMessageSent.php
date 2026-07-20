<?php

namespace App\Events;

use App\Models\GroupMessage;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GroupMessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public GroupMessage $message;

    public int $groupId;

    public function __construct(GroupMessage $message)
    {
        $this->message = $message->load('user:id,username,avatar');
        $this->groupId = $message->group_id;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('groups.'.$this->groupId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'group.message.sent';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->message->id,
            'group_id' => $this->message->group_id,
            'content' => $this->message->content,
            'type' => $this->message->type,
            'image' => $this->message->image,
            'user_id' => $this->message->user_id,
            'created_at' => $this->message->created_at->toISOString(),
            'user' => [
                'id' => $this->message->user?->id,
                'username' => $this->message->user?->username,
                'avatar' => $this->message->user?->avatar,
            ],
        ];
    }
}
