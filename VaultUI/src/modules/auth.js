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
    const token = Storage.getToken();
    const user = Storage.getUser();
    
    if (token && user) {
      window.PageManager.goToDashboard();
    } else {
      window.PageManager.goToLogin();
    }
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