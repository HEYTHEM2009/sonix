<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reel extends Model
{
    protected $fillable = ['user_id', 'video_url', 'thumbnail_url', 'caption', 'music_title', 'music_url', 'duration', 'comments_enabled'];

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
}
