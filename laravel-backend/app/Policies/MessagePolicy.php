<?php

namespace App\Policies;

use App\Models\Message;
use App\Models\User;

class MessagePolicy
{
    public function delete(User $user, Message $message): bool
    {
        return $message->sender_id === $user->id;
    }

    public function edit(User $user, Message $message): bool
    {
        return $message->sender_id === $user->id && ! $message->is_deleted;
    }

    public function forward(User $user, Message $message): bool
    {
        return ! $message->is_deleted;
    }
}
