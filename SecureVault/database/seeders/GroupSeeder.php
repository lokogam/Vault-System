<?php

namespace Database\Seeders;

use App\Models\Group;
use Illuminate\Database\Seeder;

class GroupSeeder extends Seeder
{
    public function run(): void
    {
        // Crear grupos de ejemplo
        Group::updateOrCreate(
            ['name' => 'Marketing'],
            [
                'description' => 'Equipo de marketing y comunicaciones',
                'storage_limit' => 50 * 1024 * 1024 // 50MB
            ]
        );

        Group::updateOrCreate(
            ['name' => 'Desarrolladores'],
            [
                'description' => 'Equipo de desarrollo de software',
                'storage_limit' => 100 * 1024 * 1024 // 100MB
            ]
        );

        Group::updateOrCreate(
            ['name' => 'Recursos Humanos'],
            [
                'description' => 'Departamento de recursos humanos',
                'storage_limit' => null // Sin límite específico
            ]
        );
    }
}