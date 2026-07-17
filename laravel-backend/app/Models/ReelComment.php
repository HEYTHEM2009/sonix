<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReelComment extends Model
{
    protected $fillable = ['user_id', 'reel_id', 'content', 'parent_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reel()
    {
        return $this->belongsTo(Reel::class);
    }

    public function replies()
    {
        return $this->hasMany(ReelComment::class, 'parent_id')->with('user:id,username,avatar')->withCount('likes')->orderBy('created_at');
    }

    public function likes()
    {
        return $this->hasMany(ReelCommentLike::class);
    }

    public function parent()
    {
        return $this->belongsTo(ReelComment::class, 'parent_id');
    }
}
