@echo off
title SecureVault Docker Manager

echo.
echo ================================
echo   🐳 SecureVault Docker Setup
echo ================================
echo.

if "%1"=="setup" goto setup
if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="restart" goto restart
if "%1"=="logs" goto logs
if "%1"=="backend" goto backend
if "%1"=="frontend" goto frontend
if "%1"=="mysql" goto mysql
if "%1"=="fresh" goto fresh
if "%1"=="build" goto build
if "%1"=="clean" goto clean
if "%1"=="status" goto status
goto help

:setup
echo 📋 Configurando proyecto SecureVault...
if not exist SecureVault\.env (
    copy SecureVault\.env.example SecureVault\.env
    echo ✅ Archivo .env del backend creado
)
if not exist VaultUI\.env (
    copy VaultUI\.env.example VaultUI\.env
    echo ✅ Archivo .env del frontend creado
)
echo 🔨 Construyendo imágenes Docker...
docker-compose build
echo 🚀 Iniciando servicios...
docker-compose up -d mysql
echo ⏳ Esperando que MySQL esté listo...
timeout /t 30 /nobreak > nul
docker-compose up -d backend frontend
echo ✅ Configuración completada!
echo 🌐 Frontend: http://localhost:5173
echo 🔗 Backend API: http://localhost:8000
echo 🗄️ MySQL: localhost:3307
goto end

:start
echo 🚀 Iniciando servicios...
docker-compose up -d
goto end

:stop
echo ⏹️ Deteniendo servicios...
docker-compose down
goto end

:restart
echo 🔄 Reiniciando servicios...
docker-compose restart
goto end

:logs
docker-compose logs -f
goto end

:backend
echo 🔗 Entrando al contenedor del backend...
docker-compose exec backend bash
goto end

:frontend
echo 🎨 Entrando al contenedor del frontend...
docker-compose exec frontend sh
goto end

:mysql
echo 🗄️ Entrando a MySQL...
docker-compose exec mysql mysql -u securevault_user -psecurevault_password secure
goto end

:fresh
echo 🗃️ Reseteando base de datos...
docker-compose exec backend php artisan migrate:fresh --seed
goto end

:build
echo 🔨 Reconstruyendo imágenes...
docker-compose build --no-cache
goto end

:clean
echo 🧹 Limpiando sistema Docker...
docker-compose down -v
docker system prune -f
docker volume prune -f
goto end

:status
echo 📊 Estado de los servicios:
docker-compose ps
goto end

:help
echo Uso: docker.bat [COMANDO]
echo.
echo Comandos disponibles:
echo   setup     - Configuración inicial del proyecto
echo   start     - Iniciar todos los servicios
echo   stop      - Detener todos los servicios
echo   restart   - Reiniciar todos los servicios
echo   logs      - Ver logs de todos los servicios
echo   backend   - Entrar al contenedor del backend
echo   frontend  - Entrar al contenedor del frontend
echo   mysql     - Entrar al contenedor de MySQL
echo   fresh     - Resetear base de datos con seeders
echo   build     - Reconstruir imágenes Docker
echo   clean     - Limpiar contenedores e imágenes
echo   status    - Ver estado de los servicios
echo   help      - Mostrar esta ayuda

:end
echo.