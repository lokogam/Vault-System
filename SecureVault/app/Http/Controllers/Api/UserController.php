<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function me(Request $request)
    {
        $user = $request->user();
        $user->load('roles', 'permissions');

        return response()->json([
            'user' => $user,
            'roles' => $user->roles,
            'permissions' => $user->permissions,
            'role_names' => $user->getRoleNames(),
            'is_admin' => $user->hasRole('Administrador')
        ]);
    }

    public function index(Request $request)
    {
        // Solo administradores pueden listar usuarios
        if (!$request->user()->hasRole('Administrador')) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $users = User::with(['roles', 'groups'])->get();

        $transformedUsers = $users->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'storage_limit' => $user->storage_limit,
                'roles' => $user->roles->pluck('name'),
                'groups' => $user->groups->map(function ($group) {
                    return [
                        'id' => $group->id,
                        'name' => $group->name
                    ];
                }),
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'users' => $transformedUsers
            ]
        ]);
    }

    public function show(Request $request, $id)
    {
        // Solo administradores pueden ver detalles de usuarios
        if (!$request->user()->hasRole('Administrador')) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $user = User::with(['roles', 'groups'])->findOrFail($id);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name'),
                'groups' => $user->groups->map(function ($group) {
                    return [
                        'id' => $group->id,
                        'name' => $group->name
                    ];
                }),
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at
            ]
        ]);
    }

    public function assignToGroup(Request $request, $userId)
    {
        // Solo administradores pueden asignar usuarios a grupos
        if (!$request->user()->hasRole('Administrador')) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $request->validate([
            'group_id' => 'required|exists:groups,id'
        ]);

        $user = User::findOrFail($userId);

        // Verificar si ya está en el grupo
        if ($user->groups()->where('group_id', $request->group_id)->exists()) {
            return response()->json(['message' => 'El usuario ya está en este grupo'], 422);
        }

        $user->groups()->attach($request->group_id);

        return response()->json([
            'message' => 'Usuario asignado al grupo exitosamente',
            'user' => $user->load('groups')
        ]);
    }

    public function removeFromGroup(Request $request, $userId)
    {
        // Solo administradores pueden remover usuarios de grupos
        if (!$request->user()->hasRole('Administrador')) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $request->validate([
            'group_id' => 'required|exists:groups,id'
        ]);

        $user = User::findOrFail($userId);
        $user->groups()->detach($request->group_id);

        return response()->json([
            'message' => 'Usuario removido del grupo exitosamente',
            'user' => $user->load('groups')
        ]);
    }

    public function assignRole(Request $request, $userId)
    {
        // Solo administradores pueden asignar roles
        if (!$request->user()->hasRole('Administrador')) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $request->validate([
            'role' => 'required|in:Usuario,Administrador'
        ]);

        $user = User::findOrFail($userId);

        // Remover roles existentes y asignar el nuevo
        $user->syncRoles([$request->role]);

        return response()->json([
            'message' => 'Rol asignado exitosamente',
            'user' => $user->load('roles')
        ]);
    }

    public function updateStorageLimit(Request $request, $userId)
    {
        // Solo administradores pueden actualizar límites
        if (!$request->user()->hasRole('Administrador')) {
            return response()->json([
                'success' => false,
                'message' => 'No autorizado'
            ], 403);
        }

        $user = User::findOrFail($userId);

        // Validación más flexible - permitir cualquier valor o null
        $validated = $request->validate([
            'storage_limit' => 'nullable|integer|min:0' // Permitir 0 o mayor
        ]);

        // Si el valor es 0, convertir a null (sin límite)
        $storageLimit = $validated['storage_limit'] === 0 ? null : $validated['storage_limit'];

        $user->update([
            'storage_limit' => $storageLimit
        ]);

        $limitDisplay = $storageLimit
            ? (number_format($storageLimit / (1024 * 1024), 2) . ' MB')
            : 'Sin límite específico';

        return response()->json([
            'success' => true,
            'message' => "Límite de almacenamiento actualizado exitosamente a: {$limitDisplay}",
            'data' => [
                'user' => $user->fresh(),
                'storage_limit_display' => $limitDisplay
            ]
        ]);
    }

    public function getStorageInfo($userId)
    {
        // Solo administradores pueden ver información de almacenamiento
        if (!request()->user()->hasRole('Administrador')) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $user = User::findOrFail($userId);

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

    private function formatBytes($size, $precision = 2)
    {
        if ($size == 0) return '0 B';

        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $factor = floor(log($size, 1024));

        return round($size / pow(1024, $factor), $precision) . ' ' . $units[$factor];
    }
}
