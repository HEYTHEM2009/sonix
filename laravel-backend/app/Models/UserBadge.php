<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserBadge extends Model
{
    protected $fillable = ['user_id', 'badge_type', 'badge_name', 'description', 'icon_url'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
