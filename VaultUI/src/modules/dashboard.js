// dashboard.js - Re-exportar módulos del dashboard modular
// Archivo simplificado que reemplaza el gigante de 2555 líneas

// Importar todos los módulos del dashboard
export { PageManager, DashboardManager } from './dashboard/dashboard-main.js'

// Re-exportar para compatibilidad con imports existentes
export { FileManager } from './dashboard/file-manager.js'
export { ConfigManager } from './dashboard/config-manager.js'
export { RestrictionsManager } from './dashboard/restrictions-manager.js'
export { AdminFileManager } from './dashboard/admin-file-manager.js'
