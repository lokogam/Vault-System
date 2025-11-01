// http.js - Utilidades para peticiones HTTP con preloader integrado

import { config, logger } from '../config/env.js';

// Configuración de la API desde variables de entorno
const API_BASE_URL = config.api.baseUrl;

export const Http = {
  async request(url, options = {}, preloaderConfig = null) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Agregar token si existe
    if (window.AppState.token) {
      config.headers['Authorization'] = `Bearer ${window.AppState.token}`;
    }

    try {
      // Mostrar preloader si está configurado
      if (preloaderConfig && window.Preloader) {
        window.Preloader.show(preloaderConfig.title, preloaderConfig.message);
      }

      const response = await fetch(`${API_BASE_URL}${url}`, config);
      
      // Para respuestas vacías (204 No Content)
      if (response.status === 204) {
        return { success: true, data: null };
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        // Si es error 401 (Unauthorized), limpiar sesión y redirigir a login
        if (response.status === 401) {
          // Solo limpiar sesión y redirigir si no estamos en login
          if (!window.location.pathname.includes('login') && !window.location.pathname.includes('index.html')) {
            window.Storage.removeToken();
            window.Storage.removeUser();
            window.PageManager.goToLogin();
          }
          
          throw new Error(data.message || 'Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
        
        throw new Error(data.message || 'Error en la petición');
      }
      
      // Si la respuesta ya tiene un success flag, devolverla tal como está
      // para evitar anidación innecesaria
      if (data && typeof data === 'object' && data.hasOwnProperty('success')) {
        return data;
      }
      
      // Para respuestas sin estructura estándar, envolver en success wrapper
      return { success: true, data };
    } catch (error) {
      logger.error('Error en petición HTTP:', error);
      return { success: false, error: error.message };
    } finally {
      // Ocultar preloader si estaba configurado
      if (preloaderConfig && window.Preloader) {
        window.Preloader.hide();
      }
    }
  },

  async post(url, body, preloaderConfig = null) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(body)
    }, preloaderConfig);
  },

  async get(url, preloaderConfig = null) {
    return this.request(url, { method: 'GET' }, preloaderConfig);
  },

  async put(url, body, preloaderConfig = null) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(body)
    }, preloaderConfig);
  },

  async delete(url, preloaderConfig = null) {
    return this.request(url, { method: 'DELETE' }, preloaderConfig);
  }
};