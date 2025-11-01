// component-loader.js - Sistema para cargar componentes HTML dinámicamente

import { logger } from '../config/env.js';

export const ComponentLoader = {
  
  /**
   * Carga un archivo HTML y lo inserta en el DOM
   * @param {string} componentPath - Ruta al archivo HTML
   * @param {string} targetId - ID del elemento donde insertar el componente
   * @returns {Promise<boolean>} - true si se carga correctamente
   */
  async loadComponent(componentPath, targetId) {
    try {
      const response = await fetch(componentPath);
      if (!response.ok) {
        throw new Error(`Error loading component: ${response.status}`);
      }
      
      const html = await response.text();
      const targetElement = document.getElementById(targetId);
      
      if (!targetElement) {
        throw new Error(`Target element with ID '${targetId}' not found`);
      }
      
      targetElement.innerHTML = html;
      return true;
    } catch (error) {
      logger.error('ComponentLoader error:', error);
      return false;
    }
  },

  /**
   * Carga múltiples componentes de forma paralela
   * @param {Array} components - Array de objetos {path, targetId}
   * @returns {Promise<Array>} - Array de resultados
   */
  async loadMultipleComponents(components) {
    const promises = components.map(comp => 
      this.loadComponent(comp.path, comp.targetId)
    );
    
    return Promise.all(promises);
  },

  /**
   * Carga todas las páginas principales
   */
  async loadAllPages() {
    const pages = [
      { path: '/src/pages/login.html', targetId: 'login-container' },
      { path: '/src/pages/register.html', targetId: 'register-container' },
      { path: '/src/pages/dashboard.html', targetId: 'dashboard-container' }
    ];

    const results = await this.loadMultipleComponents(pages);
    
    // Cargar componentes del dashboard después de cargar la página principal
    await this.loadDashboardComponents();
    
    // Ocultar spinner de carga una vez que las páginas estén cargadas
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
      spinner.classList.add('hidden');
    }

    return results;
  },

  /**
   * Carga los componentes específicos del dashboard
   */
  async loadDashboardComponents() {
    const dashboardComponents = [
      { path: '/src/components/dashboard/navigation.html', targetId: 'dashboard-navigation' },
      { path: '/src/components/dashboard/files-view.html', targetId: 'dashboard-files-view' },
      { path: '/src/components/dashboard/groups-view.html', targetId: 'dashboard-groups-view' },
      { path: '/src/components/dashboard/users-view.html', targetId: 'dashboard-users-view' },
      { path: '/src/components/dashboard/config-view.html', targetId: 'dashboard-config-view' },
      { path: '/src/components/dashboard/modals.html', targetId: 'dashboard-modals' }
    ];

    try {
      const results = await this.loadMultipleComponents(dashboardComponents);
      logger.info('Componentes del dashboard cargados correctamente');
      return results;
    } catch (error) {
      logger.error('Error cargando componentes del dashboard:', error);
      return false;
    }
  },

  /**
   * Carga todos los modales
   */
  async loadAllModals() {
    const modals = [
      { path: '/src/components/group-modal.html', targetId: 'group-modal-container' },
      { path: '/src/components/confirm-modal.html', targetId: 'confirm-modal-container' }
    ];

    return this.loadMultipleComponents(modals);
  },

  /**
   * Carga el preloader
   */
  async loadPreloader() {
    try {
      const response = await fetch('/src/components/preloader.html');
      if (!response.ok) {
        throw new Error(`Error cargando preloader: ${response.status}`);
      }
      
      const html = await response.text();
      document.body.insertAdjacentHTML('beforeend', html);
      
      return true;
    } catch (error) {
      logger.error('Error cargando preloader:', error);
      return false;
    }
  }
};