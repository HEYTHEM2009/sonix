<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = [
        'content', 'sender_id', 'receiver_id', 'is_read',
        'type', 'image', 'voice', 'reply_to', 'is_deleted', 'read_at',
        'is_edited', 'original_content', 'is_disappearing', 'disappears_at', 'deleted_for',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'is_deleted' => 'boolean',
        'is_edited' => 'boolean',
        'is_disappearing' => 'boolean',
        'read_at' => 'datetime',
        'disappears_at' => 'datetime',
    ];

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function replyMessage()
    {
        return $this->belongsTo(Message::class, 'reply_to');
    }

    public function reactions()
    {
        return $this->hasMany(MessageReaction::class);
    }
}
