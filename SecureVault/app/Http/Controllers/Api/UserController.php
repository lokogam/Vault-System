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

        return response()->json([
            'users' => $users->map(function ($user) {
                return [
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
                ];
            })
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
}
