# 🐳 SecureVault - Configuración Docker

Sistema de almacenamiento seguro de archivos con gestión de usuarios, grupos y restricciones.

## 🚀 Inicio Rápido

### Prerequisitos
- Docker Desktop
- Docker Compose

### 1. Configuración Inicial (Solo la primera vez)

**Windows:**
```cmd
start.bat setup
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh setup
```

### 2. Uso Diario

**Iniciar servicios:**
```bash
# Windows
start.bat start

# Linux/Mac
./start.sh start
```

**Detener servicios:**
```bash
# Windows
start.bat stop

# Linux/Mac
./start.sh stop
```

## 🌐 URLs de Acceso

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **MySQL**: localhost:3307

## 📋 Comandos Disponibles

### Windows (start.bat)
- `setup` - Configuración inicial completa
- `start` - Iniciar todos los servicios
- `stop` - Detener todos los servicios
- `restart` - Reiniciar servicios
- `logs` - Ver logs en tiempo real
- `backend` - Entrar al contenedor del backend
- `frontend` - Entrar al contenedor del frontend
- `mysql` - Conectar a MySQL
- `fresh` - Resetear base de datos con datos iniciales
- `build` - Reconstruir imágenes Docker
- `clean` - Limpiar sistema Docker
- `status` - Ver estado de servicios

### Linux/Mac (start.sh)
Los mismos comandos, usando `./start.sh [comando]`

## 🔧 Configuración de Base de Datos

- **Base de datos**: `secure`
- **Usuario**: `securevault_user`
- **Contraseña**: `securevault_password`
- **Puerto**: `3307` (externo), `3306` (interno)

## 🗃️ Estructura del Proyecto

```
📁 EDU-LABS/
├── 📁 SecureVault/          # Backend Laravel API
├── 📁 VaultUI/              # Frontend Vite
├── 📁 docker/               # Configuraciones Docker
│   ├── 📁 mysql/init/       # Scripts iniciales MySQL
│   ├── 📁 nginx/conf.d/     # Configuración Nginx
│   └── 📁 php/              # Configuración PHP
├── 🐳 docker-compose.yml    # Orquestación servicios
├── 📄 DOCKER.md            # Documentación Docker
├── 🚀 start.bat            # Script Windows
└── 🚀 start.sh             # Script Linux/Mac
```

## 🔄 Flujo de Trabajo

1. **Primera vez**: `start.bat setup` o `./start.sh setup`
2. **Desarrollo diario**: `start.bat start` o `./start.sh start`
3. **Ver logs**: `start.bat logs` o `./start.sh logs`
4. **Resetear datos**: `start.bat fresh` o `./start.sh fresh`
5. **Terminar**: `start.bat stop` o `./start.sh stop`

## ⚠️ Solución de Problemas

### Error de permisos (Linux/Mac)
```bash
chmod +x start.sh
```

### Resetear completamente
```bash
# Windows
start.bat clean
start.bat setup

# Linux/Mac
./start.sh clean
./start.sh setup
```

### Ver logs de un servicio específico
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

## 🎯 Usuarios por Defecto

Después del setup inicial, tendrás estos usuarios:

- **Admin**: `admin@example.com` / `password`
- **Usuario**: `user@example.com` / `password`

## 🔒 Características

- ✅ Gestión de archivos segura
- ✅ Control de usuarios y grupos
- ✅ Restricciones de extensiones
- ✅ Límites de almacenamiento
- ✅ API RESTful completa
- ✅ Interfaz moderna con Vite

---

💡 **Tip**: Usa `start.bat help` o `./start.sh help` para ver todos los comandos disponibles.