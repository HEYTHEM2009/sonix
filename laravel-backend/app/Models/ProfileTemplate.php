<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProfileTemplate extends Model
{
    protected $fillable = ['user_id', 'template_name', 'template_data', 'is_active'];
    protected $casts = ['template_data' => 'array'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
