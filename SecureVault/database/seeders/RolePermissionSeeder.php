<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Resetear caché de permisos
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Crear permisos
        $permissions = [
            // Permisos de archivos
            'upload files',
            'view files',
            'delete files',

            // Permisos de usuarios
            'manage users',
            'view users',
            'create users',
            'edit users',
            'delete users',

            // Permisos de grupos
            'manage groups',
            'create groups',
            'edit groups',
            'delete groups',
            'assign users to groups',

            // Permisos de configuración
            'manage settings',
        ];

        // Crear cada permiso
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Crear rol Usuario
        $userRole = Role::firstOrCreate(['name' => 'Usuario', 'guard_name' => 'web']);
        $userRole->syncPermissions([
            'upload files',
            'view files',
            'delete files',
        ]);

        // Crear rol Administrador con todos los permisos
        $adminRole = Role::firstOrCreate(['name' => 'Administrador', 'guard_name' => 'web']);
        $adminRole->syncPermissions(Permission::all());



    }
}
