// forms.js - Gestión de formularios

export const FormHandlers = {
  setupLoginForm() {
    const form = document.getElementById('login-form');
    const errorDiv = document.getElementById('login-error');
    const submitBtn = document.getElementById('login-btn');

    if (!form) return;

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
      
      const result = await window.Auth.login(email, password);
      
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

    if (!form) return;

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
      
      const result = await window.Auth.register(name, email, password, passwordConfirm);
      
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
    const gotoRegisterBtn = document.getElementById('goto-register');
    if (gotoRegisterBtn) {
      gotoRegisterBtn.addEventListener('click', () => {
        window.PageManager.goToRegister();
      });
    }
    
    // Botón para ir a login desde registro
    const gotoLoginBtn = document.getElementById('goto-login');
    if (gotoLoginBtn) {
      gotoLoginBtn.addEventListener('click', () => {
        window.PageManager.goToLogin();
      });
    }
  },

  setupAllForms() {
    this.setupLoginForm();
    this.setupRegisterForm();
    this.setupNavigationButtons();
  }
};