// utils/router.js - Sistema de ruteo para actualizar URLs

export class Router {
  constructor() {
    this.routes = {
      '/': 'login',
      '/login': 'login',
      '/register': 'register',
      '/dashboard': 'dashboard'
    };
    
    this.currentRoute = '/';
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Escuchar cambios en el historial del navegador
    window.addEventListener('popstate', (event) => {
      const path = window.location.pathname;
      this.navigateToPath(path, false); // false = no agregar al historial
    });

    // Manejar el estado inicial
    this.handleInitialRoute();
  }

  handleInitialRoute() {
    const currentPath = window.location.pathname;
    const page = this.routes[currentPath] || 'login';
    
    // Navegar sin agregar al historial (ya estamos en esta URL)
    this.navigateToPath(currentPath, false);
    
    // COMENTADO: evitar bucle con checkAuthStatus en main.js
    // setTimeout(() => {
    //   if (window.Auth) {
    //     window.Auth.checkAuthStatus();
    //   }
    // }, 100);
  }

  // Navegar a una ruta específica
  navigateTo(page) {
    const path = this.getPathForPage(page);
    this.navigateToPath(path, true);
  }

  navigateToPath(path, addToHistory = true) {
    const page = this.routes[path] || 'login';
    
    // Actualizar la URL del navegador
    if (addToHistory) {
      window.history.pushState({ page }, '', path);
    }
    
    // Actualizar la página actual
    this.currentRoute = path;
    
    // Mostrar la página correspondiente
    if (window.PageManager) {
      window.PageManager.showPage(page);
    }
  }

  // Obtener la ruta para una página
  getPathForPage(page) {
    for (const [path, pageName] of Object.entries(this.routes)) {
      if (pageName === page) {
        return path;
      }
    }
    return '/login'; // fallback
  }

  // Obtener la página actual
  getCurrentPage() {
    return this.routes[this.currentRoute] || 'login';
  }

  // Reemplazar la URL actual (sin agregar al historial)
  replace(page) {
    const path = this.getPathForPage(page);
    window.history.replaceState({ page }, '', path);
    this.currentRoute = path;
    
    if (window.PageManager) {
      window.PageManager.showPage(page);
    }
  }

  // Ir hacia atrás en el historial
  goBack() {
    window.history.back();
  }

  // Ir hacia adelante en el historial
  goForward() {
    window.history.forward();
  }
}

// Instancia singleton del router
export const AppRouter = new Router();