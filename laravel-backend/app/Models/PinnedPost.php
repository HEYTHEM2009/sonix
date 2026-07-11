<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PinnedPost extends Model
{
    protected $fillable = ['user_id', 'post_id', 'position'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function post()
    {
        return $this->belongsTo(Post::class);
    }
}
