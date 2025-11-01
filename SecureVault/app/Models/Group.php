<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Group extends Model
{
     protected $fillable = [
        'name',
        'description',
        'storage_limit'
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'group_user');
    }
}
