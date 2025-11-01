# SecureVault Frontend

Sistema de almacenamiento seguro - Interfaz de usuario construida con Vite, TailwindCSS y JavaScript modular.

## Configuración

### Variables de Entorno

Copia el archivo `.env.example` a `.env` y ajusta las configuraciones según tu entorno:

```bash
cp .env.example .env
```

### Variables Disponibles

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `VITE_API_BASE_URL` | URL base de la API backend | `http://localhost:8000/api` |
| `VITE_API_TIMEOUT` | Timeout para peticiones HTTP (ms) | `30000` |
| `VITE_APP_NAME` | Nombre de la aplicación | `SecureVault` |
| `VITE_APP_VERSION` | Versión de la aplicación | `1.0.0` |
| `VITE_FRONTEND_URL` | URL del frontend | `http://localhost:5173` |
| `VITE_DEV_MODE` | Habilitar logs de desarrollo | `true` |
| `VITE_DEBUG` | Habilitar logs de debug | `false` |
| `VITE_ENABLE_PRELOADER` | Habilitar sistema de preloader | `true` |

## Instalación y Desarrollo

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## Estructura del Proyecto

```
src/
├── components/     # Componentes HTML reutilizables
├── pages/         # Páginas principales (login, register, dashboard)
├── modules/       # Módulos de lógica de negocio
├── utils/         # Utilidades y helpers
├── config/        # Configuración de la aplicación
└── main.js        # Punto de entrada principal
```

## Configuración para Diferentes Entornos

### Desarrollo Local
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_DEV_MODE=true
```

### Producción
```env
VITE_API_BASE_URL=https://api.tudominio.com/api
VITE_DEV_MODE=false
VITE_DEBUG=false
```

### Testing
```env
VITE_API_BASE_URL=http://localhost:8001/api
VITE_DEV_MODE=true
VITE_DEBUG=true
```