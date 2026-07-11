<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReelLike extends Model
{
    protected $fillable = ['user_id', 'reel_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reel()
    {
        return $this->belongsTo(Reel::class);
    }
}
