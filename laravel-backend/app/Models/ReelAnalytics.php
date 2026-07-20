<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReelAnalytics extends Model
{
    protected $fillable = [
        'reel_id', 'views_count', 'likes_count', 'comments_count',
        'shares_count', 'saves_count', 'watch_time_seconds',
        'completion_rate', 'trending_score', 'recommendation_score',
        'last_viewed_at',
    ];

    protected $casts = [
        'completion_rate' => 'decimal:2',
        'trending_score' => 'decimal:2',
        'recommendation_score' => 'decimal:2',
        'last_viewed_at' => 'datetime',
    ];

    public function reel()
    {
        return $this->belongsTo(Reel::class);
    }
}
