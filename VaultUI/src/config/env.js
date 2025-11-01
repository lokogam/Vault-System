// config/env.js - Configuración centralizada de variables de entorno

export const config = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
    timeout: import.meta.env.VITE_API_TIMEOUT || 30000,
  },
  
  // App Configuration
  app: {
    name: import.meta.env.VITE_APP_NAME || 'SecureVault',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: import.meta.env.MODE || 'development',
    isDev: import.meta.env.DEV || false,
    isProd: import.meta.env.PROD || false,
  },
  
  // Development Configuration
  dev: {
    enableLogs: import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV,
    enableDebug: import.meta.env.VITE_DEBUG === 'true' || false,
  },
  
  // Frontend Configuration
  frontend: {
    baseUrl: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173',
  }
};

// Helper functions para logging condicional
export const logger = {
  log: (...args) => {
    if (config.dev.enableLogs) {
      console.log('[SecureVault]', ...args);
    }
  },
  
  info: (...args) => {
    if (config.dev.enableLogs) {
      console.info('[SecureVault Info]', ...args);
    }
  },
  
  error: (...args) => {
    if (config.dev.enableLogs) {
      console.error('[SecureVault Error]', ...args);
    }
  },
  
  warn: (...args) => {
    if (config.dev.enableLogs) {
      console.warn('[SecureVault Warning]', ...args);
    }
  },
  
  debug: (...args) => {
    if (config.dev.enableDebug) {
      console.debug('[SecureVault Debug]', ...args);
    }
  }
};

export default config;