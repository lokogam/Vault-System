<?php

use App\Http\Controllers\Api\GroupController;
use App\Http\Controllers\Api\UserController;
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

    // Rutas de grupos (la verificación de roles se hace en el controlador)
    Route::apiResource('groups', GroupController::class);
    Route::post('groups/{group}/assign-users', [GroupController::class, 'assignUsers']);
    Route::post('groups/{group}/remove-users', [GroupController::class, 'removeUsers']);
});
