<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\File;
use App\Models\FileRestriction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use ZipArchive;

class FileController extends Controller
{
    // Listar archivos del usuario autenticado
    public function index(Request $request)
    {
        $user = Auth::user();
        $files = $user->files()->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'files' => $files,
            'storage_info' => [
                'used' => $user->storage_used,
                'limit' => $user->getEffectiveStorageLimit(),
                'formatted_used' => $this->formatBytes($user->storage_used),
                'formatted_limit' => $this->formatBytes($user->getEffectiveStorageLimit())
            ]
        ]);
    }

    // Subir archivo
    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:' . (50 * 1024) // 50MB máximo
        ]);

        $user = Auth::user();
        $uploadedFile = $request->file('file');

        // 1. Validar extensión
        $extension = strtolower($uploadedFile->getClientOriginalExtension());
        if (FileRestriction::isProhibited($extension)) {
            return response()->json([
                'success' => false,
                'message' => "Error: El tipo de archivo '.$extension' no está permitido"
            ], 422);
        }

        // 2. Validar cuota de almacenamiento
        $fileSize = $uploadedFile->getSize();
        if (!$user->canUploadFile($fileSize)) {
            $limit = $this->formatBytes($user->getEffectiveStorageLimit());
            return response()->json([
                'success' => false,
                'message' => "Error: Cuota de almacenamiento ($limit) excedida"
            ], 422);
        }

        // 3. Validar contenido de archivos ZIP
        if ($extension === 'zip') {
            $zipValidation = $this->validateZipContent($uploadedFile);
            if (!$zipValidation['valid']) {
                return response()->json([
                    'success' => false,
                    'message' => $zipValidation['message']
                ], 422);
            }
        }

        try {
            // 4. Guardar archivo
            $filename = time() . '_' . $uploadedFile->getClientOriginalName();
            $path = $uploadedFile->storeAs('uploads', $filename, 'public');

            // 5. Crear registro en base de datos
            $file = File::create([
                'user_id' => $user->id,
                'filename' => $filename,
                'original_name' => $uploadedFile->getClientOriginalName(),
                'size' => $fileSize,
                'mime_type' => $uploadedFile->getMimeType(),
                'path' => $path,
                'extension' => $extension
            ]);

            // 6. Actualizar uso de almacenamiento del usuario
            $user->updateStorageUsage();

            return response()->json([
                'success' => true,
                'message' => 'Archivo subido exitosamente',
                'file' => $file,
                'storage_info' => [
                    'used' => $user->storage_used,
                    'limit' => $user->getEffectiveStorageLimit(),
                    'formatted_used' => $this->formatBytes($user->storage_used),
                    'formatted_limit' => $this->formatBytes($user->getEffectiveStorageLimit())
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al subir el archivo: ' . $e->getMessage()
            ], 500);
        }
    }

    // Eliminar archivo
    public function destroy($id)
    {
        $user = Auth::user();
        $file = File::where('id', $id)->where('user_id', $user->id)->first();

        if (!$file) {
            return response()->json([
                'success' => false,
                'message' => 'Archivo no encontrado'
            ], 404);
        }

        try {
            // Eliminar archivo físico
            Storage::disk('public')->delete($file->path);

            // Eliminar registro de base de datos
            $file->delete();

            // Actualizar uso de almacenamiento
            $user->updateStorageUsage();

            return response()->json([
                'success' => true,
                'message' => 'Archivo eliminado exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar el archivo'
            ], 500);
        }
    }

    // Descargar archivo
    public function download($id)
    {
        $user = Auth::user();
        $file = File::where('id', $id)->where('user_id', $user->id)->first();

        if (!$file) {
            return response()->json([
                'success' => false,
                'message' => 'Archivo no encontrado'
            ], 404);
        }

        $filePath = storage_path('app/public/' . $file->path);

        if (!file_exists($filePath)) {
            return response()->json([
                'success' => false,
                'message' => 'Archivo no encontrado en el servidor'
            ], 404);
        }

        return response()->download($filePath, $file->original_name);
    }

    // Validar contenido de archivo ZIP
    private function validateZipContent($uploadedFile)
    {
        $tempPath = $uploadedFile->getPathname();
        $zip = new ZipArchive();

        if ($zip->open($tempPath) === TRUE) {
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $filename = $zip->getNameIndex($i);
                $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

                if (FileRestriction::isProhibited($extension)) {
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

        return [
            'valid' => false,
            'message' => 'Error: No se pudo analizar el archivo ZIP'
        ];
    }

    // Formatear bytes para mostrar
    private function formatBytes($size, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        for ($i = 0; $size > 1024 && $i < count($units) - 1; $i++) {
            $size /= 1024;
        }
        return round($size, $precision) . ' ' . $units[$i];
    }

    public function getStorageInfo(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'storage_info' => [
                'used' => $user->storage_used ?? 0,
                'limit' => $user->getEffectiveStorageLimit(),
                'formatted_used' => $this->formatBytes($user->storage_used ?? 0),
                'formatted_limit' => $this->formatBytes($user->getEffectiveStorageLimit()),
                'percentage' => $user->getEffectiveStorageLimit() > 0
                    ? round((($user->storage_used ?? 0) / $user->getEffectiveStorageLimit()) * 100, 2)
                    : 0
            ]
        ]);
    }

    public function adminIndex(Request $request)
    {
        // Solo administradores
        if (!$request->user()->hasRole('Administrador')) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $files = File::with(['user:id,name,email'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($files);
    }

    public function adminDestroy(Request $request, File $file)
    {
        // Solo administradores
        if (!$request->user()->hasRole('Administrador')) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        // Eliminar archivo físico
        Storage::disk('private')->delete($file->path);

        // Actualizar storage_used del usuario
        $file->user->decrement('storage_used', $file->size);

        // Eliminar registro
        $file->delete();

        return response()->json(['message' => 'Archivo eliminado exitosamente']);
    }
}
