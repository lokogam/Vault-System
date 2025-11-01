<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'storage_limit',
        'storage_used',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function groups()
    {
        return $this->belongsToMany(Group::class, 'group_user');
    }

    public function files()
    {
        return $this->hasMany(File::class);
    }

    public function getEffectiveStorageLimit()
    {
        // 1. Límite específico del usuario
        if ($this->storage_limit !== null) {
            return $this->storage_limit;
        }

        // 2. Límite del grupo
        $group = $this->groups()->first();
        if ($group && $group->storage_limit !== null) {
            return $group->storage_limit;
        }

        // 3. Límite global por defecto
        return SystemSetting::getDefaultStorageLimit();
    }

    public function canUploadFile($fileSize)
    {
        $currentUsage = $this->storage_used;
        $limit = $this->getEffectiveStorageLimit();

        return ($currentUsage + $fileSize) <= $limit;
    }

    public function updateStorageUsage()
    {
        $this->storage_used = $this->files()->sum('size');
        $this->save();
    }
}
