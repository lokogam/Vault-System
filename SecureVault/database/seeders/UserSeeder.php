<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        // Crear usuario administrador
        $admin = User::updateOrCreate(
            ['email' => 'admin@securevault.com'],
            [
                'name' => 'Administrador',
                'password' => Hash::make('password'),
            ]
        );

        $admin->assignRole('Administrador');

        // Crear usuario normal
        $user = User::updateOrCreate(
            ['email' => 'user@securevault.com'],
            [
                'name' => 'Usuario Normal',
                'password' => Hash::make('password'),
                'storage_limit' => 20 * 1024 * 1024 // 20MB límite específico
            ]
        );

        // Limpiar roles existentes y asignar el rol de usuario
        $user->assignRole('Usuario');

        // Crear usuario adicional sin límite específico
        $user2 = User::updateOrCreate(
            ['email' => 'usuario2@securevault.com'],
            [
                'name' => 'María González',
                'password' => Hash::make('password'),
                'storage_limit' => null // Sin límite específico
            ]
        );

        $user2->assignRole('Usuario');
    }
}
