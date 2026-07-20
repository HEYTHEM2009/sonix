<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReelHashtag extends Model
{
    protected $fillable = ['reel_id', 'tag'];

    public function reel()
    {
        return $this->belongsTo(Reel::class);
    }
}
