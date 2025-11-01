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
    console.log('🔄 Navegando al login...');
    this.showPage('login');
    
    // Actualizar URL si AppRouter está disponible
    if (window.AppRouter && typeof window.AppRouter.updateUrl === 'function') {
      window.AppRouter.updateUrl('/login');
    }
  },

  goToRegister() {
    console.log('🔄 Navegando al registro...');
    this.showPage('register');
    
    // Actualizar URL si AppRouter está disponible
    if (window.AppRouter && typeof window.AppRouter.updateUrl === 'function') {
      window.AppRouter.updateUrl('/register');
    }
  },

  goToDashboard() {
    console.log('🎯 PageManager.goToDashboard() ejecutado');
    this.showPage('dashboard');

    // Asegurar inicialización del dashboard SOLO si no está inicializado
    if (window.dashboardManager && !window.dashboardManager.initialized) {
      console.log('🔄 Inicializando dashboard desde PageManager...');
      window.dashboardManager.init();
    } else {
      console.log('✅ Dashboard ya inicializado o no disponible');
    }
  },

  setupNavigationEventListeners() {
    // Método requerido por main.js
    console.log('PageManager navigation event listeners configurados');
  }
};