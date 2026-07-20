<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    protected $fillable = [
        'reporter_id', 'reportable_type', 'reportable_id', 'reason',
        'status', 'moderated_by', 'moderated_at',
    ];

    protected $casts = [
        'moderated_at' => 'datetime',
    ];

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function moderator()
    {
        return $this->belongsTo(User::class, 'moderated_by');
    }

    public function reportable()
    {
        return $this->morphTo();
    }
}
