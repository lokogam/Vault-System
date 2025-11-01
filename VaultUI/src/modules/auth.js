// auth.js - Módulo de autenticación

export const Storage = {
  setToken(token) {
    localStorage.setItem('auth_token', token);
    window.AppState.token = token;
  },
  
  getToken() {
    const token = localStorage.getItem('auth_token');
    window.AppState.token = token;
    return token;
  },
  
  removeToken() {
    localStorage.removeItem('auth_token');
    window.AppState.token = null;
  },
  
  setUser(user) {
    localStorage.setItem('user_data', JSON.stringify(user));
    window.AppState.user = user;
  },
  
  getUser() {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData);
      window.AppState.user = user;
      return user;
    }
    return null;
  },
  
  removeUser() {
    localStorage.removeItem('user_data');
    window.AppState.user = null;
  },
  
  clearAll() {
    this.removeToken();
    this.removeUser();
  }
};

export const Auth = {
  async login(email, password) {
    const response = await window.Http.post('/login', { email, password }, window.PreloaderMessages.LOGIN);
    
    if (response.success) {
      const { user, token, access_token } = response.data;
      const authToken = access_token || token;
      Storage.setToken(authToken);
      Storage.setUser(user);
      window.PageManager.goToDashboard();
      return { success: true };
    } else {
      return { success: false, error: response.error };
    }
  },

  async register(name, email, password, passwordConfirmation) {
    const response = await window.Http.post('/register', {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation
    }, window.PreloaderMessages.REGISTER);
    
    if (response.success) {
      const { user, token, access_token } = response.data;
      const authToken = access_token || token;
      Storage.setToken(authToken);
      Storage.setUser(user);
      window.PageManager.goToDashboard();
      return { success: true };
    } else {
      return { success: false, error: response.error };
    }
  },

  async logout() {
    if (window.AppState.token) {
      await window.Http.post('/logout', {}, { title: 'Cerrando Sesión', message: 'Terminando sesión...' });
    }
    
    Storage.clearAll();
    window.PageManager.goToLogin();
  },

  checkAuthStatus() {
    console.log('🔍 ===== AUTH STATUS CHECK INICIADO =====');
    const token = Storage.getToken();
    const user = Storage.getUser();
    const currentPage = window.AppRouter ? window.AppRouter.getCurrentPage() : 'login';
    
    console.log('  - Token:', !!token);
    console.log('  - User:', !!user);
    console.log('  - Current page:', currentPage);
    console.log('  - AppRouter available:', !!window.AppRouter);
    console.log('  - Dashboard initialized:', window.dashboardManager?.initialized);
    
    // Verificar que AMBOS token y usuario estén presentes
    if (token && user) {
      console.log('✅ Usuario autenticado correctamente (token + user)');
      // Usuario autenticado
      if (currentPage === 'login' || currentPage === 'register') {
        console.log('🔄 Redirigiendo a dashboard desde', currentPage);
        // Si está en login/register, redirigir a dashboard
        window.PageManager.goToDashboard();
      } else {
        console.log('📱 Manteniendo en dashboard, verificando inicialización...');
        // Si está en dashboard, mantener la página actual
        window.PageManager.showPage('dashboard');
        // Verificar si el dashboard ya está inicializado para evitar re-inicializaciones
        if (window.dashboardManager && !window.dashboardManager.initialized) {
          console.log('🚀 Inicializando dashboard manager por primera vez...');
          setTimeout(() => {
            window.dashboardManager.init();
          }, 100);
        } else {
          console.log('✅ Dashboard ya está inicializado');
        }
      }
    } else {
      // Si falta token o usuario, limpiar todo y redirigir a login
      if (!token && user) {
        console.log('⚠️ Usuario sin token - limpiando datos y redirigiendo');
        Storage.clearAll();
      } else if (token && !user) {
        console.log('⚠️ Token sin usuario - limpiando datos y redirigiendo');
        Storage.clearAll();
      } else {
        console.log('❌ Usuario NO autenticado');
      }
      
      // Usuario no autenticado
      if (currentPage === 'dashboard') {
        console.log('🔄 Redirigiendo a login desde dashboard');
        // Si está en dashboard sin auth, redirigir a login
        window.PageManager.goToLogin();
      } else {
        console.log('📱 Manteniendo en', currentPage);
        // Si está en login/register, mantener la página actual
        window.PageManager.showPage(currentPage);
      }
    }
    console.log('🔍 ===== AUTH STATUS CHECK TERMINADO =====');
  },

  isAdmin() {
    if (!window.AppState.user) {
      return false;
    }
    
    if (!window.AppState.user.roles) {
      return false;
    }
    
    return window.AppState.user.roles.some(role => role.name === 'Administrador');
  },

  hasRole(roleName) {
    return window.AppState.user && window.AppState.user.roles && 
           window.AppState.user.roles.some(role => role.name === roleName);
  }
};