<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecentSearch extends Model
{
    protected $fillable = ['user_id', 'searched_user_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function searchedUser()
    {
        return $this->belongsTo(User::class, 'searched_user_id');
    }
}
