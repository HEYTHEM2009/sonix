<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReelCommentLike extends Model
{
    protected $fillable = ['user_id', 'reel_comment_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function comment()
    {
        return $this->belongsTo(ReelComment::class, 'reel_comment_id');
    }
}
