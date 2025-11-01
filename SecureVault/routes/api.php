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

    // Rutas de grupos (la verificación de roles se hace en el controlador)
    Route::apiResource('groups', GroupController::class);
});
