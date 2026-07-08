<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('messages.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

Broadcast::channel('typing.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

Broadcast::channel('notifications.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

use App\Models\Follow;

Broadcast::channel('stories.{userId}', function ($user, $userId) {
    if ((int) $user->id === (int) $userId) {
        return true;
    }
    return Follow::where('follower_id', $user->id)
        ->where('following_id', $userId)
        ->where('status', 'accepted')
        ->exists();
});

Broadcast::channel('presence.users', function ($user) {
    return [
        'id' => $user->id,
        'username' => $user->username,
        'avatar' => $user->avatar,
    ];
});
