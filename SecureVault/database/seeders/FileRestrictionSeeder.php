<?php

namespace Database\Seeders;

use App\Models\FileRestriction;
use Illuminate\Database\Seeder;

class FileRestrictionSeeder extends Seeder
{
    public function run(): void
    {
        $prohibitedExtensions = [
            ['extension' => 'exe', 'description' => 'Archivo ejecutable de Windows'],
            ['extension' => 'bat', 'description' => 'Archivo por lotes de Windows'],
            ['extension' => 'cmd', 'description' => 'Archivo de comandos de Windows'],
            ['extension' => 'com', 'description' => 'Archivo ejecutable COM'],
            ['extension' => 'scr', 'description' => 'Archivo de protector de pantalla'],
            ['extension' => 'vbs', 'description' => 'Visual Basic Script'],
            ['extension' => 'js', 'description' => 'JavaScript (potencialmente peligroso)'],
            ['extension' => 'php', 'description' => 'Archivo PHP (código del servidor)'],
            ['extension' => 'sh', 'description' => 'Shell script Unix/Linux'],
        ];

        foreach ($prohibitedExtensions as $restriction) {
            FileRestriction::create([
                'extension' => $restriction['extension'],
                'is_prohibited' => true,
                'description' => $restriction['description']
            ]);
        }
    }
}
