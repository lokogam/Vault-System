# SecureVault - Sistema de Almacenamiento Seguro

## 📋 Descripción del Proyecto

SecureVault es una aplicación web para la gestión segura de archivos que permite a los usuarios subir documentos mientras aplica un conjunto robusto de reglas de negocio para garantizar la seguridad y el uso justo del almacenamiento. El sistema incluye un panel de administración completo para la gestión de usuarios, grupos y configuraciones del sistema.

## 🏗️ Arquitectura del Proyecto

### Backend
- **Framework**: Laravel 12.x (PHP 8.2+)
- **Base de datos**: MySQL 8.0
- **Autenticación**: Laravel Sanctum (API tokens)
- **Autorización**: Spatie Laravel Permission (roles y permisos)

### Frontend
- **Tecnología**: Vanilla JavaScript (ES6+)
- **Estilos**: TailwindCSS 4.x
- **Build Tool**: Vite 7.x
- **Arquitectura**: SPA (Single Page Application) modular

### Infraestructura
- **Containerización**: Docker y Docker Compose
- **Servidor web**: Nginx (producción)
- **Servidor de desarrollo**: PHP Built-in Server

## 🚀 Funcionalidades Implementadas

### 1. Sistema de Autenticación y Autorización
- ✅ Registro e inicio de sesión de usuarios
- ✅ Sistema de roles: **Administrador** y **Usuario**
- ✅ Protección de rutas basada en roles
- ✅ Tokens JWT con Laravel Sanctum

### 2. Gestión de Usuarios y Grupos
- ✅ **Administradores** pueden:
  - Crear y gestionar grupos (ej. "Marketing", "Desarrolladores")
  - Asignar usuarios a grupos
  - Establecer límites de almacenamiento por usuario
  - Gestionar roles de usuario

### 3. Sistema de Almacenamiento con Cuotas Inteligentes
- ✅ **Límites jerárquicos de almacenamiento**:
  1. Límite específico por usuario (máxima prioridad)
  2. Límite específico por grupo
  3. Límite global por defecto (configurable)
- ✅ Validación automática antes de cada subida
- ✅ Cálculo en tiempo real del uso de almacenamiento

### 4. Gestión Avanzada de Archivos
- ✅ **Subida de archivos** con validación completa
- ✅ **Restricción de tipos de archivo** configurable
- ✅ **Análisis de archivos ZIP**: Inspección automática del contenido interno
- ✅ Lista negra de extensiones peligrosas (exe, bat, js, php, sh, etc.)
- ✅ Descarga y eliminación de archivos

### 5. Panel de Administración
- ✅ Gestión de usuarios y asignación de grupos
- ✅ Configuración de límites de almacenamiento globales
- ✅ Administración de extensiones prohibidas
- ✅ Vista de todos los archivos del sistema
- ✅ Configuraciones del sistema centralizadas

### 6. Interfaz de Usuario
- ✅ **Panel de usuario**: Vista de archivos personales y formulario de subida
- ✅ **Panel de administrador**: Área protegida con todas las herramientas administrativas
- ✅ **SPA moderna** con navegación sin recarga de página
- ✅ **Notificaciones en tiempo real** para éxito y errores
- ✅ **Diseño responsive** y estéticamente agradable

## 🛠️ Instalación y Configuración

### Prerrequisitos
- Docker y Docker Compose
- Git

### Opción 1: Instalación con Docker (Recomendada)

1. **Clonar el repositorio**:
```bash
git clone https://github.com/lokogam/Vault-System.git
cd Vault-System
```

2. **Configuración inicial (solo la primera vez)**:

**Windows:**
```cmd
start.bat setup
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh setup
```

3. **Uso diario - Iniciar servicios**:

**Windows:**
```cmd
start.bat start
```

**Linux/Mac:**
```bash
./start.sh start
```

4. **Acceder a la aplicación**:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **MySQL**: localhost:3307

### Comandos Docker Disponibles

**Windows (start.bat):**
- `setup` - Configuración inicial completa
- `start` - Iniciar todos los servicios
- `stop` - Detener todos los servicios
- `restart` - Reiniciar servicios
- `logs` - Ver logs en tiempo real
- `fresh` - Resetear base de datos con datos iniciales
- `build` - Reconstruir imágenes Docker
- `clean` - Limpiar sistema Docker

**Linux/Mac (start.sh):**
Los mismos comandos usando `./start.sh [comando]`

### Comandos Docker Manuales (Alternativa)

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Detener servicios
docker-compose down

# Resetear base de datos
docker-compose exec backend php artisan migrate:fresh --seed
```

### Opción 2: Instalación Manual

#### Backend (Laravel)
```bash
cd SecureVault

# Instalar dependencias
composer install

# Configurar entorno
cp .env.example .env
# Editar .env con configuración de base de datos

# Generar clave de aplicación
php artisan key:generate

# Ejecutar migraciones y seeders
php artisan migrate:fresh --seed

# Crear enlace simbólico para storage
php artisan storage:link

# Iniciar servidor de desarrollo
php artisan serve
```

#### Frontend (VaultUI)
```bash
cd VaultUI

# Instalar dependencias
npm install

# Configurar variables de entorno
# Crear archivo .env con VITE_API_URL=http://localhost:8000/api

# Iniciar servidor de desarrollo
npm run dev
```

## 🔐 Credenciales de Acceso

### Usuarios de Prueba

| Rol | Email | Contraseña | Descripción |
|-----|-------|------------|-------------|
| **Administrador** | admin@securevault.com | password | Acceso completo al sistema |
| **Usuario** | user@securevault.com | password | Usuario con límite de 20MB |
| **Usuario** | usuario2@securevault.com | password | Usuario sin límite específico |

## 📁 Estructura del Proyecto

```
Vault-System/
├── docker-compose.yml          # Orquestación de contenedores
├── README.md                   # Este archivo
├── start.bat                   # Script de inicio para Windows
├── start.sh                    # Script de inicio para Linux/Mac
├── 
├── SecureVault/               # Backend Laravel
│   ├── app/
│   │   ├── Http/Controllers/  # Controladores API
│   │   ├── Models/           # Modelos Eloquent
│   │   └── Policies/         # Políticas de autorización
│   ├── database/
│   │   ├── migrations/       # Migraciones de BD
│   │   └── seeders/          # Datos de prueba
│   ├── routes/api.php        # Rutas API
│   └── storage/              # Almacenamiento de archivos
│
├── VaultUI/                  # Frontend Vanilla JS
│   ├── src/
│   │   ├── components/       # Componentes HTML reutilizables
│   │   ├── modules/          # Módulos JavaScript
│   │   ├── pages/            # Páginas SPA
│   │   ├── utils/            # Utilidades y helpers
│   │   └── main.js           # Punto de entrada
│   ├── index.html            # Archivo principal HTML
│   └── package.json          # Dependencias NPM
│
└── docker/                   # Configuraciones Docker
    ├── mysql/init/           # Scripts de inicialización BD
    ├── nginx/conf.d/         # Configuración Nginx
    └── php/local.ini         # Configuración PHP
```

## 🔧 Decisiones de Diseño

### Backend - Laravel
- **Patrón Repository implícito**: Uso de Eloquent ORM con modelos ricos en lógica de negocio
- **API RESTful**: Endpoints claros y semánticamente correctos
- **Middleware de autorización**: Protección granular por rol en cada ruta
- **Políticas de acceso**: Control fino sobre quién puede acceder a qué recursos
- **Validación de archivos ZIP**: Análisis profundo del contenido usando ZipArchive

### Frontend - Vanilla JavaScript
- **Arquitectura modular**: Separación clara de responsabilidades
- **Gestión de estado global**: `window.AppState` para datos compartidos
- **Sistema de enrutamiento SPA**: Navegación sin recarga de página
- **Carga dinámica de componentes**: HTML y modales cargados bajo demanda
- **Manejo de errores**: Notificaciones claras y amigables al usuario

### Base de Datos
- **Normalización**: Relaciones claras entre usuarios, grupos y archivos
- **Flexibilidad**: Configuraciones del sistema almacenadas dinámicamente
- **Integridad referencial**: Claves foráneas y restricciones apropiadas

## 🧪 Pruebas y Validación

### Funcionalidades Probadas
1. ✅ Registro e inicio de sesión de usuarios
2. ✅ Subida de archivos con validación de cuotas
3. ✅ Restricción de extensiones peligrosas
4. ✅ Análisis de contenido de archivos ZIP
5. ✅ Gestión de usuarios y grupos (admin)
6. ✅ Configuración de límites de almacenamiento
7. ✅ Descarga y eliminación de archivos

### Casos de Prueba Sugeridos
```bash
# Probar límites de almacenamiento
1. Subir archivo que exceda la cuota del usuario
2. Subir archivo ZIP con contenido prohibido
3. Intentar subir extensión peligrosa (.exe, .bat)

# Probar permisos
1. Usuario normal intentando acceder a panel admin
2. Administrador gestionando usuarios y grupos
```

## 🐳 Docker Services

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| **mysql** | 3307 | Base de datos MySQL 8.0 |
| **backend** | 8000 | API Laravel con PHP 8.2 |
| **frontend** | 5173 | Aplicación Vite con hot reload |
| **nginx** | 80/443 | Servidor web (perfil producción) |

### Configuración Docker Database
- **Base de datos**: `secure`
- **Usuario**: `securevault_user`
- **Contraseña**: `securevault_password`
- **Puerto externo**: `3307`
- **Puerto interno**: `3306`

### Solución de Problemas Docker

**Error de permisos (Linux/Mac):**
```bash
chmod +x start.sh
```

**Resetear completamente:**
```bash
# Windows
start.bat clean
start.bat setup

# Linux/Mac
./start.sh clean
./start.sh setup
```

**Ver logs de servicio específico:**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

## 📊 Variables de Entorno

### Backend (.env)
```env
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=secure
DB_USERNAME=securevault_user
DB_PASSWORD=securevault_password
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api
```

## 🚀 Scripts de Desarrollo

### Backend
```bash
composer run dev      # Servidor + queue + logs + frontend
composer run setup    # Instalación completa
composer run test     # Ejecutar tests
```

### Frontend
```bash
npm run dev           # Servidor de desarrollo
npm run build         # Build para producción
npm run preview       # Preview del build
```

## 🔒 Seguridad Implementada

1. **Validación de archivos**: Verificación de extensiones y contenido
2. **Análisis de ZIP**: Inspección recursiva de archivos comprimidos
3. **Autenticación robusta**: Tokens JWT con expiración
4. **Autorización granular**: Control de acceso basado en roles
5. **Sanitización de datos**: Validación en backend y frontend
6. **Límites de almacenamiento**: Prevención de abuso de recursos

## 📈 Métricas del Sistema

- **Arquitectura**: Microservicios containerizados
- **Escalabilidad**: Horizontal mediante Docker
- **Performance**: SPA con carga bajo demanda
- **Mantenibilidad**: Código modular y documentado
- **Seguridad**: Múltiples capas de validación

---

## 🤝 Contribución

Este proyecto fue desarrollado como una prueba técnica siguiendo estrictamente los requerimientos funcionales y no funcionales especificados. La implementación demuestra conocimientos sólidos en:

- **PHP/Laravel**: Desarrollo de APIs REST robustas
- **JavaScript ES6+**: Aplicaciones SPA modernas
- **Docker**: Containerización y orquestación
- **MySQL**: Diseño de base de datos eficiente
- **Seguridad web**: Validaciones y controles de acceso

## 👨‍💻 Desarrollado por

- LinkedIn: [Duvan Gamboa](https://www.linkedin.com/in/duvan-gamboa-5193951b2/)  
- Email: [duvangamboa8@gmail.com](mailto:duvangamboa8@gmail.com)
- Web: [Duvan-Gamboa](https://lokogam.github.io/Duvan-Gamboa/)
