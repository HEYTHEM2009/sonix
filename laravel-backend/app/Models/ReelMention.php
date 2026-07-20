<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReelMention extends Model
{
    protected $fillable = ['reel_id', 'user_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reel()
    {
        return $this->belongsTo(Reel::class);
    }
}
