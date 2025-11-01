// utils/notifications.js - Sistema de notificaciones

export const NotificationManager = {
  showNotification(message, type = 'info', duration = 5000) {
    // Crear el contenedor de notificaciones si no existe
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.className = 'fixed top-6 right-6 z-50 space-y-3 max-w-md w-full';
      document.body.appendChild(container);
    }

    // Crear la notificación con estilos mejorados
    const notification = document.createElement('div');
    
    // Configuración de colores y estilos por tipo
    const configs = {
      success: {
        bgClass: 'bg-gradient-to-r from-green-50 to-emerald-50',
        borderClass: 'border-l-4 border-green-400',
        iconClass: 'text-green-500',
        titleClass: 'text-green-800',
        textClass: 'text-green-700'
      },
      error: {
        bgClass: 'bg-gradient-to-r from-red-50 to-rose-50',
        borderClass: 'border-l-4 border-red-400',
        iconClass: 'text-red-500',
        titleClass: 'text-red-800',
        textClass: 'text-red-700'
      },
      warning: {
        bgClass: 'bg-gradient-to-r from-yellow-50 to-amber-50',
        borderClass: 'border-l-4 border-yellow-400',
        iconClass: 'text-yellow-500',
        titleClass: 'text-yellow-800',
        textClass: 'text-yellow-700'
      },
      info: {
        bgClass: 'bg-gradient-to-r from-blue-50 to-indigo-50',
        borderClass: 'border-l-4 border-blue-400',
        iconClass: 'text-blue-500',
        titleClass: 'text-blue-800',
        textClass: 'text-blue-700'
      }
    };

    const config = configs[type] || configs.info;
    
    notification.className = `${config.bgClass} ${config.borderClass} shadow-xl rounded-r-lg pointer-events-auto transform transition-all duration-500 ease-out translate-x-full opacity-0 hover:shadow-2xl hover:scale-105`;

    // Título según el tipo
    const titles = {
      success: '¡Éxito!',
      error: 'Error',
      warning: 'Advertencia',
      info: 'Información'
    };

    const icon = type === 'success' ? `
      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
      </svg>
    ` : type === 'error' ? `
      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>
    ` : type === 'warning' ? `
      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
    ` : `
      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
      </svg>
    `;

    notification.innerHTML = `
      <div class="px-6 py-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <div class="${config.iconClass} drop-shadow-sm">
              ${icon}
            </div>
          </div>
          <div class="ml-4 flex-1">
            <h4 class="${config.titleClass} text-sm font-bold mb-1">${titles[type]}</h4>
            <p class="${config.textClass} text-sm leading-relaxed">${message}</p>
          </div>
          <div class="ml-4 flex-shrink-0">
            <button class="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-full p-1 transition-colors duration-200" onclick="window.NotificationManager.removeNotification(this.closest('.transform'))">
              <span class="sr-only">Cerrar</span>
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Barra de progreso para mostrar tiempo restante -->
        <div class="mt-3 bg-white bg-opacity-30 rounded-full h-1 overflow-hidden">
          <div class="notification-progress bg-white bg-opacity-60 h-full rounded-full transition-all ease-linear" style="width: 100%; transition-duration: ${duration}ms;"></div>
        </div>
      </div>
    `;

    container.appendChild(notification);

    // Aplicar límites de notificaciones
    this.enforceLimits();

    // Animar la entrada con un efecto más suave
    setTimeout(() => {
      notification.classList.remove('translate-x-full', 'opacity-0');
      notification.classList.add('translate-x-0', 'opacity-100');
      
      // Iniciar animación de la barra de progreso
      const progressBar = notification.querySelector('.notification-progress');
      if (progressBar && duration > 0) {
        setTimeout(() => {
          progressBar.style.width = '0%';
        }, 100);
      }
    }, 50);

    // Auto-remover después del tiempo especificado
    if (duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification);
      }, duration);
    }

    return notification;
  },

  removeNotification(notification) {
    if (notification && notification.parentNode) {
      // Efecto de salida más suave
      notification.classList.add('translate-x-full', 'opacity-0', 'scale-95');
      notification.classList.remove('hover:scale-105');
      
      setTimeout(() => {
        if (notification.parentNode) {
          // Efecto de colapso antes de remover
          notification.style.maxHeight = notification.offsetHeight + 'px';
          notification.style.overflow = 'hidden';
          notification.style.transition = 'max-height 0.3s ease-out, margin 0.3s ease-out, padding 0.3s ease-out';
          
          setTimeout(() => {
            notification.style.maxHeight = '0px';
            notification.style.marginTop = '0px';
            notification.style.marginBottom = '0px';
            notification.style.paddingTop = '0px';
            notification.style.paddingBottom = '0px';
            
            setTimeout(() => {
              if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
              }
            }, 300);
          }, 50);
        }
      }, 400);
    }
  },

  showSuccess(message, duration = 5000) {
    return this.showNotification(message, 'success', duration);
  },

  showError(message, duration = 7000) {
    return this.showNotification(message, 'error', duration);
  },

  showWarning(message, duration = 6000) {
    return this.showNotification(message, 'warning', duration);
  },

  showInfo(message, duration = 5000) {
    return this.showNotification(message, 'info', duration);
  },

  // Función para notificaciones personalizadas con más opciones
  showCustom(options) {
    const {
      message,
      type = 'info',
      duration = 5000,
      title = null,
      persistent = false,
      actions = []
    } = options;

    // Si tiene título personalizado, modificar temporalmente los títulos
    const originalTitles = {
      success: '¡Éxito!',
      error: 'Error',
      warning: 'Advertencia',
      info: 'Información'
    };

    if (title) {
      // Temporalmente cambiar el título para esta notificación
      const tempDuration = persistent ? 0 : duration;
      return this.showNotification(`<strong>${title}</strong><br>${message}`, type, tempDuration);
    }

    return this.showNotification(message, type, persistent ? 0 : duration);
  },

  // Función para mostrar notificaciones de carga
  showLoading(message = 'Cargando...') {
    const notification = this.showNotification(
      `<div class="flex items-center">
        <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        ${message}
      </div>`,
      'info',
      0 // Persistente hasta que se llame manualmente a remove
    );

    // Añadir clase especial para notificaciones de carga
    notification.classList.add('notification-loading');
    
    return notification;
  },

  // Función para remover todas las notificaciones de carga
  hideLoading() {
    const loadingNotifications = document.querySelectorAll('.notification-loading');
    loadingNotifications.forEach(notification => {
      this.removeNotification(notification);
    });
  },

  clearAll() {
    const container = document.getElementById('notification-container');
    if (container) {
      // Animar salida de todas las notificaciones
      const notifications = container.querySelectorAll('.transform');
      notifications.forEach((notification, index) => {
        setTimeout(() => {
          this.removeNotification(notification);
        }, index * 100); // Escalonar la animación
      });
    }
  },

  // Función para contar notificaciones activas
  getActiveCount() {
    const container = document.getElementById('notification-container');
    return container ? container.querySelectorAll('.transform').length : 0;
  },

  // Función para limitar el número máximo de notificaciones
  enforceLimits() {
    const container = document.getElementById('notification-container');
    if (container) {
      const notifications = container.querySelectorAll('.transform');
      const maxNotifications = 5; // Máximo 5 notificaciones
      
      if (notifications.length > maxNotifications) {
        // Remover las más antiguas
        for (let i = 0; i < notifications.length - maxNotifications; i++) {
          this.removeNotification(notifications[i]);
        }
      }
    }
  },

  // Función de demostración para probar todos los tipos de notificaciones
  demo() {
    console.log('🎨 Iniciando demostración de notificaciones mejoradas...');
    
    this.showSuccess('¡Usuario asignado al grupo exitosamente! Los cambios se han guardado.');
    
    setTimeout(() => {
      this.showError('Error de conexión: No se pudo conectar con el servidor. Verifique su conexión a internet.');
    }, 1000);
    
    setTimeout(() => {
      this.showWarning('Advertencia: El archivo supera el límite de tamaño permitido (10MB).');
    }, 2000);
    
    setTimeout(() => {
      this.showInfo('Información: Se han actualizado las configuraciones del sistema.');
    }, 3000);
    
    setTimeout(() => {
      const loading = this.showLoading('Procesando solicitud...');
      setTimeout(() => {
        this.removeNotification(loading);
        this.showSuccess('¡Proceso completado con éxito!');
      }, 2000);
    }, 4000);
  }
};

// Hacer disponible globalmente
window.NotificationManager = NotificationManager;