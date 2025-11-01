<?php

namespace Database\Seeders;

use App\Models\SystemSetting;
use Illuminate\Database\Seeder;

class SystemSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Configurar límite de almacenamiento por defecto
        SystemSetting::set(
            'default_storage_limit',
            50 * 1024 * 1024, // 50MB por defecto
            'integer',
            'Límite de almacenamiento por defecto para nuevos usuarios (en bytes)'
        );

        // Otras configuraciones del sistema que podrían ser útiles
        SystemSetting::set(
            'max_file_size',
            100 * 1024 * 1024, // 100MB
            'integer',
            'Tamaño máximo permitido por archivo (en bytes)'
        );

        SystemSetting::set(
            'allowed_file_types',
            ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt', 'zip'],
            'json',
            'Tipos de archivo permitidos por defecto'
        );

        SystemSetting::set(
            'enable_zip_analysis',
            true,
            'boolean',
            'Habilitar análisis automático de archivos ZIP'
        );

        SystemSetting::set(
            'system_name',
            'SecureVault',
            'string',
            'Nombre del sistema'
        );
    }
}
