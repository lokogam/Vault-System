<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class GroupController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $this->authorize('viewAny', Group::class);

        $groups = Group::with('users')->get();

        return response()->json([
            'success' => true,
            'data' => $groups,
            'groups' => $groups // Para compatibilidad con diferentes partes del frontend
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $this->authorize('create', Group::class);

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);
        $group = Group::create($request->only('name', 'description'));
        return response()->json($group, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Group $group)
    {
        $this->authorize('view', $group);

        return response()->json($group->load('users'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Group $group)
    {
        $this->authorize('update', $group);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
        ]);
        $group->update($request->only('name', 'description'));
        return response()->json($group);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Group $group)
    {
        $this->authorize('delete', $group);

        $group->delete();
        return response()->json(['message' => 'Grupo eliminado exitosamente'], 200);
    }

    /**
     * Asignar usuarios a un grupo
     */
    public function assignUsers(Request $request, Group $group)
    {
        $this->authorize('update', $group);

        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id'
        ]);

        // Asignar usuarios al grupo
        $group->users()->attach($request->user_ids);

        return response()->json([
            'message' => 'Usuarios asignados al grupo exitosamente',
            'group' => $group->load('users')
        ]);
    }

    /**
     * Remover usuarios de un grupo
     */
    public function removeUsers(Request $request, Group $group)
    {
        $this->authorize('update', $group);

        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id'
        ]);

        // Remover usuarios del grupo
        $group->users()->detach($request->user_ids);

        return response()->json([
            'message' => 'Usuarios removidos del grupo exitosamente',
            'group' => $group->load('users')
        ]);
    }

    /**
     * Actualizar límite de almacenamiento de un grupo
     */
    public function updateStorageLimit(Request $request, Group $group)
    {
        $this->authorize('update', $group);

        // Validación más flexible - permitir cualquier valor o null
        $validated = $request->validate([
            'storage_limit' => 'nullable|integer|min:0' // Permitir 0 o mayor
        ]);

        // Si el valor es 0, convertir a null (sin límite)
        $storageLimit = $validated['storage_limit'] === 0 ? null : $validated['storage_limit'];

        $group->update([
            'storage_limit' => $storageLimit
        ]);

        $limitDisplay = $storageLimit
            ? (number_format($storageLimit / (1024 * 1024), 2) . ' MB')
            : 'Sin límite específico';

        return response()->json([
            'success' => true,
            'message' => "Límite de almacenamiento del grupo actualizado exitosamente a: {$limitDisplay}",
            'data' => [
                'group' => $group->fresh(),
                'storage_limit_display' => $limitDisplay
            ]
        ]);
    }
}
