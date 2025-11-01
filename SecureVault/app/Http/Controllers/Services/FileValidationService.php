<?php

namespace App\Services;

use App\Models\FileRestriction;
use ZipArchive;

class FileValidationService
{
    /**
     * Validar si una extensión está prohibida
     */
    public static function isExtensionProhibited($extension)
    {
        return FileRestriction::isProhibited(strtolower($extension));
    }

    /**
     * Validar contenido de archivo ZIP
     */
    public static function validateZipContent($filePath)
    {
        $zip = new ZipArchive();

        if ($zip->open($filePath) !== TRUE) {
            return [
                'valid' => false,
                'message' => 'Error: No se pudo analizar el archivo ZIP'
            ];
        }

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $filename = $zip->getNameIndex($i);
            $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

            if (self::isExtensionProhibited($extension)) {
                $zip->close();
                return [
                    'valid' => false,
                    'message' => "Error: El archivo '$filename' dentro del .zip no está permitido"
                ];
            }
        }

        $zip->close();
        return ['valid' => true];
    }

    /**
     * Obtener lista de extensiones prohibidas
     */
    public static function getProhibitedExtensions()
    {
        return FileRestriction::prohibited()->pluck('extension')->toArray();
    }

    /**
     * Formatear bytes para mostrar
     */
    public static function formatBytes($size, $precision = 2)
    {
        if ($size == 0) return '0 B';

        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $factor = floor(log($size, 1024));

        return round($size / pow(1024, $factor), $precision) . ' ' . $units[$factor];
    }

    /**
     * Validar tamaño de archivo según cuota del usuario
     */
    public static function validateUserQuota($user, $fileSize)
    {
        $currentUsage = $user->storage_used ?? 0;
        $limit = $user->getEffectiveStorageLimit();

        if (($currentUsage + $fileSize) > $limit) {
            return [
                'valid' => false,
                'message' => 'Error: Cuota de almacenamiento (' . self::formatBytes($limit) . ') excedida',
                'current_usage' => $currentUsage,
                'limit' => $limit,
                'file_size' => $fileSize
            ];
        }

        return ['valid' => true];
    }

    /**
     * Validar tipo MIME del archivo
     */
    public static function validateMimeType($file)
    {
        $allowedMimes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain', 'text/csv',
            'application/zip', 'application/x-zip-compressed',
            'video/mp4', 'video/mpeg', 'video/quicktime',
            'audio/mpeg', 'audio/wav', 'audio/ogg'
        ];

        if (!in_array($file->getMimeType(), $allowedMimes)) {
            return [
                'valid' => false,
                'message' => 'Tipo de archivo no permitido: ' . $file->getMimeType()
            ];
        }

        return ['valid' => true];
    }
}
