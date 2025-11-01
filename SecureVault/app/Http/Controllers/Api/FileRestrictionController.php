<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FileRestriction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FileRestrictionController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    // Listar todas las restricciones (solo admins)
    public function index()
    {
        if (!Auth::user()->hasRole('admin')) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para acceder a esta funcionalidad'
            ], 403);
        }

        $restrictions = FileRestriction::orderBy('extension')->get();

        return response()->json([
            'success' => true,
            'restrictions' => $restrictions
        ]);
    }

    // Crear nueva restricción
    public function store(Request $request)
    {
        if (!Auth::user()->hasRole('admin')) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para realizar esta acción'
            ], 403);
        }

        $request->validate([
            'extension' => 'required|string|max:10|unique:file_restrictions,extension',
            'description' => 'nullable|string|max:255'
        ]);

        $restriction = FileRestriction::create([
            'extension' => strtolower($request->extension),
            'is_prohibited' => true,
            'description' => $request->description
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Restricción creada exitosamente',
            'restriction' => $restriction
        ]);
    }

    // Actualizar restricción
    public function update(Request $request, $id)
    {
        if (!Auth::user()->hasRole('admin')) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para realizar esta acción'
            ], 403);
        }

        $restriction = FileRestriction::findOrFail($id);

        $request->validate([
            'extension' => 'required|string|max:10|unique:file_restrictions,extension,' . $id,
            'is_prohibited' => 'required|boolean',
            'description' => 'nullable|string|max:255'
        ]);

        $restriction->update([
            'extension' => strtolower($request->extension),
            'is_prohibited' => $request->is_prohibited,
            'description' => $request->description
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Restricción actualizada exitosamente',
            'restriction' => $restriction
        ]);
    }

    // Eliminar restricción
    public function destroy($id)
    {
        if (!Auth::user()->hasRole('admin')) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para realizar esta acción'
            ], 403);
        }

        $restriction = FileRestriction::findOrFail($id);
        $restriction->delete();

        return response()->json([
            'success' => true,
            'message' => 'Restricción eliminada exitosamente'
        ]);
    }
}
