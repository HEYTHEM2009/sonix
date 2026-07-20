<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Facades\Auth;

class Reel extends Model
{
    protected $fillable = [
        'user_id', 'video_url', 'thumbnail_url', 'caption', 'music_title',
        'music_url', 'duration', 'comments_enabled', 'views_count', 'is_published',
        'status', 'scheduled_at', 'is_featured',
    ];

    protected $casts = [
        'comments_enabled' => 'boolean',
        'is_published' => 'boolean',
        'is_featured' => 'boolean',
        'scheduled_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function likes()
    {
        return $this->hasMany(ReelLike::class);
    }

    public function comments()
    {
        return $this->hasMany(ReelComment::class);
    }

    public function saves()
    {
        return $this->hasMany(ReelSave::class);
    }

    public function shares()
    {
        return $this->hasMany(ReelShare::class);
    }

    public function reports(): MorphMany
    {
        return $this->morphMany(Report::class, 'reportable');
    }

    public function hashtags()
    {
        return $this->hasMany(ReelHashtag::class);
    }

    public function mentions()
    {
        return $this->hasMany(ReelMention::class);
    }

    public function watchHistory()
    {
        return $this->hasMany(ReelWatchHistory::class);
    }

    public function analytics()
    {
        return $this->hasOne(ReelAnalytics::class);
    }

    /**
     * Extract #hashtags from the caption and persist them.
     */
    public function syncHashtags(): void
    {
        if (empty($this->caption)) {
            return;
        }

        preg_match_all('/(?:^|\s)#([\p{L}0-9_]+)/u', $this->caption, $matches);
        $tags = array_unique(array_map('strtolower', $matches[1] ?? []));

        $this->hashtags()->delete();
        foreach (array_slice($tags, 0, 30) as $tag) {
            $this->hashtags()->create(['tag' => $tag]);
        }
    }

    /**
     * Extract @mentions from the caption and persist them.
     */
    public function syncMentions(): void
    {
        if (empty($this->caption)) {
            return;
        }

        preg_match_all('/(?:^|\s)@([\p{L}0-9_.]+)/u', $this->caption, $matches);
        $handles = array_unique($matches[1] ?? []);

        $this->mentions()->delete();
        foreach (array_slice($handles, 0, 30) as $handle) {
            $user = User::where('username', $handle)->first();
            if ($user && $user->id !== $this->user_id) {
                $this->mentions()->create(['user_id' => $user->id]);
            }
        }
    }

    public function isLikedBy(?int $userId = null): bool
    {
        $userId = $userId ?? Auth::id();
        if (! $userId) {
            return false;
        }

        return $this->likes()->where('user_id', $userId)->exists();
    }

    public function isSavedBy(?int $userId = null): bool
    {
        $userId = $userId ?? Auth::id();
        if (! $userId) {
            return false;
        }

        return $this->saves()->where('user_id', $userId)->exists();
    }
}
