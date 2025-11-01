// http.js - Utilidades para peticiones HTTP con preloader integrado

import { config, logger } from '../config/env.js';

// Configuración de la API desde variables de entorno
const API_BASE_URL = config.api.baseUrl;

export const Http = {
  async request(url, options = {}, preloaderConfig = null) {
    const config = {
      headers: {
        'Accept': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Solo agregar Content-Type si no es FormData
    if (!(options.body instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    // Agregar token si existe
    const token = window.AppState?.token || localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
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

  async postFormData(url, formData, preloaderConfig = null) {
    // Para FormData no enviar Content-Type (el navegador lo establecerá automáticamente con boundary)
    return this.request(url, {
      method: 'POST',
      body: formData
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