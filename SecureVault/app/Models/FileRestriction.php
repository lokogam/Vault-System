<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FileRestriction extends Model
{
    protected $fillable = [
        'extension',
        'is_prohibited',
        'description'
    ];

    protected $casts = [
        'is_prohibited' => 'boolean',
    ];

    // Scope para obtener solo extensiones prohibidas
    public function scopeProhibited($query)
    {
        return $query->where('is_prohibited', true);
    }

    // Método estático para verificar si una extensión está prohibida
    public static function isProhibited($extension)
    {
        return self::where('extension', strtolower($extension))
                   ->where('is_prohibited', true)
                   ->exists();
    }
}
