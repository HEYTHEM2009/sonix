<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReelWatchHistory extends Model
{
    protected $fillable = [
        'user_id', 'reel_id', 'watch_seconds', 'percent_watched', 'completed',
    ];

    protected $table = 'reel_watch_history';

    protected $casts = [
        'completed' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reel()
    {
        return $this->belongsTo(Reel::class);
    }
}
