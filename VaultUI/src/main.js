import './style.css'

// Configuración de la API
const API_BASE_URL = 'http://localhost:8000/api';

// Estado de la aplicación
const AppState = {
  user: null,
  token: null,
  currentPage: 'login'
};

// Utilidades para localStorage
const Storage = {
  setToken(token) {
    localStorage.setItem('auth_token', token);
    AppState.token = token;
  },
  
  getToken() {
    const token = localStorage.getItem('auth_token');
    AppState.token = token;
    return token;
  },
  
  removeToken() {
    localStorage.removeItem('auth_token');
    AppState.token = null;
  },
  
  setUser(user) {
    localStorage.setItem('user_data', JSON.stringify(user));
    AppState.user = user;
  },
  
  getUser() {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData);
      AppState.user = user;
      return user;
    }
    return null;
  },
  
  removeUser() {
    localStorage.removeItem('user_data');
    AppState.user = null;
  }
};

// Utilidades para peticiones HTTP
const Http = {
  async request(url, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Agregar token si existe
    if (AppState.token) {
      config.headers['Authorization'] = `Bearer ${AppState.token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error en la petición');
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Error en petición HTTP:', error);
      return { success: false, error: error.message };
    }
  },

  async post(url, body) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  async get(url) {
    return this.request(url, { method: 'GET' });
  }
};

// Gestión de páginas
const PageManager = {
  showPage(pageId) {
    // Ocultar todas las páginas
    document.querySelectorAll('.page').forEach(page => {
      page.classList.add('hidden');
    });
    
    // Mostrar la página solicitada
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
      targetPage.classList.remove('hidden');
      AppState.currentPage = pageId;
    }
  },

  goToLogin() {
    this.showPage('login');
  },

  goToRegister() {
    this.showPage('register');
  },

  goToDashboard() {
    this.showPage('dashboard');
    this.updateDashboard();
  },

  updateDashboard() {
    if (AppState.user) {
      document.getElementById('user-name').textContent = AppState.user.name;
    }
  }
};

// Gestión de autenticación
const Auth = {
  async login(email, password) {
    const response = await Http.post('/login', { email, password });
    
    if (response.success) {
      const { user, token, access_token } = response.data;
      // Usar access_token si está disponible, sino usar token
      const authToken = access_token || token;
      Storage.setToken(authToken);
      Storage.setUser(user);
      PageManager.goToDashboard();
      return { success: true };
    } else {
      return { success: false, error: response.error };
    }
  },

  async register(name, email, password, passwordConfirmation) {
    const response = await Http.post('/register', {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation
    });
    
    if (response.success) {
      const { user, token, access_token } = response.data;
      // Usar access_token si está disponible, sino usar token
      const authToken = access_token || token;
      Storage.setToken(authToken);
      Storage.setUser(user);
      PageManager.goToDashboard();
      return { success: true };
    } else {
      return { success: false, error: response.error };
    }
  },

  async logout() {
    if (AppState.token) {
      await Http.post('/logout');
    }
    
    Storage.removeToken();
    Storage.removeUser();
    PageManager.goToLogin();
  },

  checkAuthStatus() {
    const token = Storage.getToken();
    const user = Storage.getUser();
    
    if (token && user) {
      PageManager.goToDashboard();
    } else {
      PageManager.goToLogin();
    }
  }
};

// Gestión de formularios
const FormHandlers = {
  setupLoginForm() {
    const form = document.getElementById('login-form');
    const errorDiv = document.getElementById('login-error');
    const submitBtn = document.getElementById('login-btn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Limpiar errores previos
      errorDiv.classList.add('hidden');
      errorDiv.textContent = '';
      
      // Deshabilitar botón
      submitBtn.disabled = true;
      submitBtn.textContent = 'Iniciando sesión...';
      
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      
      const result = await Auth.login(email, password);
      
      if (!result.success) {
        errorDiv.textContent = result.error;
        errorDiv.classList.remove('hidden');
      }
      
      // Rehabilitar botón
      submitBtn.disabled = false;
      submitBtn.textContent = 'Iniciar Sesión';
    });
  },

  setupRegisterForm() {
    const form = document.getElementById('register-form');
    const errorDiv = document.getElementById('register-error');
    const submitBtn = document.getElementById('register-btn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Limpiar errores previos
      errorDiv.classList.add('hidden');
      errorDiv.textContent = '';
      
      const name = document.getElementById('register-name').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;
      const passwordConfirm = document.getElementById('register-password-confirm').value;
      
      // Validación básica
      if (password !== passwordConfirm) {
        errorDiv.textContent = 'Las contraseñas no coinciden';
        errorDiv.classList.remove('hidden');
        return;
      }
      
      // Deshabilitar botón
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creando cuenta...';
      
      const result = await Auth.register(name, email, password, passwordConfirm);
      
      if (!result.success) {
        errorDiv.textContent = result.error;
        errorDiv.classList.remove('hidden');
      }
      
      // Rehabilitar botón
      submitBtn.disabled = false;
      submitBtn.textContent = 'Crear Cuenta';
    });
  },

  setupNavigationButtons() {
    // Botón para ir a registro desde login
    document.getElementById('goto-register').addEventListener('click', () => {
      PageManager.goToRegister();
    });
    
    // Botón para ir a login desde registro
    document.getElementById('goto-login').addEventListener('click', () => {
      PageManager.goToLogin();
    });
    
    // Botón de logout
    document.getElementById('logout-btn').addEventListener('click', () => {
      Auth.logout();
    });
  }
};

// Inicialización de la aplicación
function initializeApp() {
  console.log('Inicializando SecureVault...');
  
  // Configurar event listeners
  FormHandlers.setupLoginForm();
  FormHandlers.setupRegisterForm();
  FormHandlers.setupNavigationButtons();
  
  // Verificar estado de autenticación
  Auth.checkAuthStatus();
  
  console.log('SecureVault inicializado correctamente');
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initializeApp);

// Exportar para depuración
window.SecureVault = {
  AppState,
  Auth,
  PageManager,
  Http,
  Storage
};