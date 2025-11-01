<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class File extends Model
{
    protected $fillable = [
        'user_id',
        'filename',
        'original_name',
        'size',
        'mime_type',
        'path',
        'extension'
    ];

    protected $casts = [
        'size' => 'integer',
    ];

    // Relación con usuario
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Formatear tamaño para mostrar
    public function getFormattedSizeAttribute()
    {
        return $this->formatBytes($this->size);
    }

    private function formatBytes($size, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        for ($i = 0; $size > 1024 && $i < count($units) - 1; $i++) {
            $size /= 1024;
        }
        return round($size, $precision) . ' ' . $units[$i];
    }
}
