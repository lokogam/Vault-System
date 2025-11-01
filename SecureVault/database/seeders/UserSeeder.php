<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::create([
            'name' => 'Administrador',
            'email' => 'admin@securevault.com',
            'password' => Hash::make('password'),
        ]);
        $admin->assignRole('Administrador');

        $developer = User::create([
            'name' => 'Usuario',
            'email' => 'user@securevault.com',
            'password' => Hash::make('password'),
        ]);
        $developer->assignRole('Usuario');
    }
}
