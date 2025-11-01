<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

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
}
