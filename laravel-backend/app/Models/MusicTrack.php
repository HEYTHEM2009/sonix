<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MusicTrack extends Model
{
    protected $fillable = [
        'title', 'artist', 'url', 'genre', 'duration', 'is_trending',
    ];

    protected $casts = [
        'is_trending' => 'boolean',
    ];
}
