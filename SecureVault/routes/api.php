<?php

use App\Http\Controllers\Api\GroupController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\FileController;
use App\Http\Controllers\Api\FileRestrictionController;
use App\Http\Controllers\Api\SystemSettingsController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [RegisteredUserController::class, 'store']);
Route::post('/login', [AuthenticatedSessionController::class, 'store']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);

    // Endpoint para debug - verificar usuario y roles
    Route::get('/user/me', [UserController::class, 'me']);

    // Gestión de usuarios (solo para administradores)
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::post('/users/{id}/assign-group', [UserController::class, 'assignToGroup']);
    Route::post('/users/{id}/remove-group', [UserController::class, 'removeFromGroup']);
    Route::post('/users/{id}/assign-role', [UserController::class, 'assignRole']);
    Route::put('/users/{user}/storage-limit', [UserController::class, 'updateStorageLimit']);
    Route::get('/users/{user}/storage-info', [UserController::class, 'getStorageInfo']);

    // Rutas de grupos (la verificación de roles se hace en el controlador)
    Route::apiResource('groups', GroupController::class);
    Route::post('groups/{group}/assign-users', [GroupController::class, 'assignUsers']);
    Route::post('groups/{group}/remove-users', [GroupController::class, 'removeUsers']);
    Route::put('groups/{group}/storage-limit', [GroupController::class, 'updateStorageLimit']);

    // Rutas de archivos
    Route::group(['prefix' => 'files'], function () {
        Route::get('/', [FileController::class, 'index']); // Mis archivos
        Route::post('/upload', [FileController::class, 'store']); // Subir archivo
        Route::get('/{file}/download', [FileController::class, 'download']); // Descargar archivo
        Route::delete('/{file}', [FileController::class, 'destroy']); // Eliminar archivo
        Route::get('/storage-info', [FileController::class, 'getStorageInfo']); // Info de almacenamiento
    });

    // Rutas de administración de archivos (solo administradores)
    Route::group(['prefix' => 'admin/files', 'middleware' => 'role:Administrador'], function () {
        Route::get('/', [FileController::class, 'adminIndex']); // Todos los archivos
        Route::delete('/{file}', [FileController::class, 'adminDestroy']); // Eliminar cualquier archivo
    });

    // Rutas de restricciones de archivos (solo administradores)
    Route::group(['prefix' => 'file-restrictions', 'middleware' => 'role:Administrador'], function () {
        Route::get('/', [FileRestrictionController::class, 'index']);
        Route::post('/', [FileRestrictionController::class, 'store']);
        Route::put('/{restriction}', [FileRestrictionController::class, 'update']);
        Route::delete('/{restriction}', [FileRestrictionController::class, 'destroy']);
    });

    // Rutas de configuraciones del sistema (solo administradores)
    Route::group(['prefix' => 'system-settings', 'middleware' => 'role:Administrador'], function () {
        Route::get('/', [SystemSettingsController::class, 'index']);
        Route::get('/default-storage-limit', [SystemSettingsController::class, 'getDefaultStorageLimit']);
        Route::put('/default-storage-limit', [SystemSettingsController::class, 'updateDefaultStorageLimit']);
    });
});
