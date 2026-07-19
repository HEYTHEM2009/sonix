<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MessageAuditLog extends Model
{
    protected $fillable = [
        'message_id',
        'actor_id',
        'action',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];
}
