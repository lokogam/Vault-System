<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\Request;

class SystemSettingsController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Obtener configuraciones del sistema (solo admins)
     */
    public function index(Request $request)
    {
        if (!$request->user()->hasRole('Administrador')) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para acceder a esta funcionalidad'
            ], 403);
        }

        $settings = SystemSetting::all();

        return response()->json([
            'success' => true,
            'data' => [
                'settings' => $settings
            ]
        ]);
    }

    /**
     * Obtener límite de almacenamiento por defecto
     */
    public function getDefaultStorageLimit(Request $request)
    {
        if (!$request->user()->hasRole('Administrador')) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para acceder a esta funcionalidad'
            ], 403);
        }

        $defaultLimit = SystemSetting::getDefaultStorageLimit();
        $limitInMB = $defaultLimit / (1024 * 1024);

        return response()->json([
            'success' => true,
            'data' => [
                'default_storage_limit' => $defaultLimit,
                'default_storage_limit_mb' => round($limitInMB, 2),
                'formatted_limit' => $this->formatBytes($defaultLimit)
            ]
        ]);
    }

    /**
     * Actualizar límite de almacenamiento por defecto
     */
    public function updateDefaultStorageLimit(Request $request)
    {
        if (!$request->user()->hasRole('Administrador')) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para realizar esta acción'
            ], 403);
        }

        $validated = $request->validate([
            'storage_limit_mb' => 'required|integer|min:1|max:10000' // Entre 1MB y 10GB
        ]);

        $bytes = $validated['storage_limit_mb'] * 1024 * 1024;

        try {
            SystemSetting::setDefaultStorageLimit($bytes);

            return response()->json([
                'success' => true,
                'message' => "Límite por defecto actualizado exitosamente a {$validated['storage_limit_mb']} MB",
                'data' => [
                    'default_storage_limit' => $bytes,
                    'default_storage_limit_mb' => $validated['storage_limit_mb'],
                    'formatted_limit' => $this->formatBytes($bytes)
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar el límite por defecto: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Formatear bytes en formato legible
     */
    private function formatBytes($size, $precision = 2)
    {
        if ($size == 0) return '0 B';

        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $factor = floor(log($size, 1024));

        return round($size / pow(1024, $factor), $precision) . ' ' . $units[$factor];
    }
}
