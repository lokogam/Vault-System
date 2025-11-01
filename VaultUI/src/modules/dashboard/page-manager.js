// page-manager.js - Gestión de navegación entre páginas

export const PageManager = {
  showPage(pageId) {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('register-container').classList.add('hidden');
    document.getElementById('dashboard-container').classList.add('hidden');

    const targetContainer = document.getElementById(`${pageId}-container`);
    if (targetContainer) {
      targetContainer.classList.remove('hidden');
    }
  },

  goToLogin() {
    this.showPage('login');
    
    // Actualizar URL si AppRouter está disponible
    if (window.AppRouter && typeof window.AppRouter.updateUrl === 'function') {
      window.AppRouter.updateUrl('/login');
    }
  },

  goToRegister() {
    this.showPage('register');
    
    // Actualizar URL si AppRouter está disponible
    if (window.AppRouter && typeof window.AppRouter.updateUrl === 'function') {
      window.AppRouter.updateUrl('/register');
    }
  },

  goToDashboard() {
    this.showPage('dashboard');

    // Asegurar inicialización del dashboard SOLO si no está inicializado
    if (window.dashboardManager && !window.dashboardManager.initialized) {
      window.dashboardManager.init();
    }
  },

  setupNavigationEventListeners() {
    // Método requerido por main.js
    console.log('PageManager navigation event listeners configurados');
  }
};