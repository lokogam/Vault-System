<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'type',
        'description'
    ];

    /**
     * Obtener el valor de una configuración
     */
    public static function get(string $key, $default = null)
    {
        $setting = self::where('key', $key)->first();

        if (!$setting) {
            return $default;
        }

        return self::castValue($setting->value, $setting->type);
    }

    /**
     * Establecer el valor de una configuración
     */
    public static function set(string $key, $value, string $type = 'string', string $description = null)
    {
        $setting = self::updateOrCreate(
            ['key' => $key],
            [
                'value' => self::prepareValue($value, $type),
                'type' => $type,
                'description' => $description
            ]
        );

        return $setting;
    }

    /**
     * Preparar valor para almacenamiento
     */
    private static function prepareValue($value, string $type)
    {
        switch ($type) {
            case 'json':
                return json_encode($value);
            case 'boolean':
                return $value ? '1' : '0';
            default:
                return (string) $value;
        }
    }

    /**
     * Convertir valor del tipo correcto
     */
    private static function castValue($value, string $type)
    {
        switch ($type) {
            case 'integer':
                return (int) $value;
            case 'boolean':
                return $value === '1' || $value === 'true';
            case 'json':
                return json_decode($value, true);
            default:
                return $value;
        }
    }

    /**
     * Obtener límite de almacenamiento por defecto
     */
    public static function getDefaultStorageLimit()
    {
        return self::get('default_storage_limit', 10 * 1024 * 1024); // 10MB por defecto
    }

    /**
     * Establecer límite de almacenamiento por defecto
     */
    public static function setDefaultStorageLimit(int $bytes)
    {
        return self::set(
            'default_storage_limit',
            $bytes,
            'integer',
            'Límite de almacenamiento por defecto para nuevos usuarios (en bytes)'
        );
    }
}
