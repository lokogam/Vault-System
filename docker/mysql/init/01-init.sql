-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS secure;

-- Usar la base de datos
USE secure;

-- Configuraciones adicionales
SET GLOBAL sql_mode = '';
SET SESSION sql_mode = '';

-- Configurar charset
ALTER DATABASE secure CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;