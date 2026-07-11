<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VoiceMessage extends Model
{
    protected $fillable = ['user_id', 'message_id', 'conversation_id', 'audio_url', 'duration'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
