// dashboard.js - Módulo del dashboard

export const PageManager = {
  showPage(pageId) {
    // Ocultar todos los contenedores de páginas
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('register-container').classList.add('hidden');
    document.getElementById('dashboard-container').classList.add('hidden');
    
    // Mostrar el contenedor solicitado
    const targetContainer = document.getElementById(`${pageId}-container`);
    if (targetContainer) {
      targetContainer.classList.remove('hidden');
      window.AppState.currentPage = pageId;
    }
  },

  goToLogin() {
    if (window.AppRouter) {
      window.AppRouter.navigateTo('login');
    } else {
      this.showPage('login');
    }
  },

  goToRegister() {
    if (window.AppRouter) {
      window.AppRouter.navigateTo('register');
    } else {
      this.showPage('register');
    }
  },

  goToDashboard() {
    if (window.AppRouter) {
      window.AppRouter.navigateTo('dashboard');
    } else {
      this.showPage('dashboard');
    }
    // Usar setTimeout para asegurar que el DOM está listo
    setTimeout(() => {
      this.updateDashboard();
      this.debugUserRoles();
      this.setupRoleBasedUI();
    }, 0);
  },

  async debugUserRoles() {
    // Solo ejecutar si hay token
    if (!window.AppState.token) {
      return;
    }
    
    try {
      const response = await window.Http.get('/user/me', window.PreloaderMessages.LOADING_DASHBOARD);
      if (response.success) {
        // Actualizar el usuario con la información completa
        window.AppState.user = response.data.user;
        window.Storage.setUser(response.data.user);
        // Reconfigurar UI con información actualizada
        this.setupRoleBasedUI();
      }
    } catch (error) {
      // No hacer nada más, el error de token ya se manejó en Http.request
    }
  },

  updateDashboard() {
    if (window.AppState.user) {
      const userNameElement = document.getElementById('user-name');
      if (userNameElement) {
        userNameElement.textContent = window.AppState.user.name;
      }
    }
  },

  setupRoleBasedUI() {
    const groupsTab = document.getElementById('tab-groups');
    const usersTab = document.getElementById('tab-users');
    
    if (window.Auth.isAdmin()) {
      // Mostrar pestañas de administrador
      if (groupsTab) {
        groupsTab.classList.remove('hidden');
      }
      if (usersTab) {
        usersTab.classList.remove('hidden');
      }
    } else {
      // Ocultar pestañas de administrador
      if (groupsTab) {
        groupsTab.classList.add('hidden');
      }
      if (usersTab) {
        usersTab.classList.add('hidden');
      }
      // Si está en una pestaña de admin, redirigir al dashboard principal
      if (window.AppState.currentTab === 'groups' || window.AppState.currentTab === 'users') {
        this.showDashboardTab('dashboard');
      }
    }
  },

  showDashboardTab(tabName) {
    // Verificar permisos para pestañas de administrador
    if ((tabName === 'groups' || tabName === 'users') && !window.Auth.isAdmin()) {
      return;
    }

    // Ocultar todos los contenidos del dashboard
    document.querySelectorAll('.dashboard-content').forEach(content => {
      content.classList.add('hidden');
    });
    
    // Mostrar el contenido seleccionado
    const targetContent = document.getElementById(`${tabName}-content`);
    if (targetContent) {
      targetContent.classList.remove('hidden');
    }

    // Actualizar estilos de las pestañas
    document.querySelectorAll('.dashboard-tab').forEach(tab => {
      tab.classList.remove('border-indigo-500', 'text-indigo-600');
      tab.classList.add('border-transparent', 'text-gray-500');
    });
    
    const activeTab = document.getElementById(`tab-${tabName}`);
    if (activeTab) {
      activeTab.classList.remove('border-transparent', 'text-gray-500');
      activeTab.classList.add('border-indigo-500', 'text-indigo-600');
    }

    // Guardar pestaña actual
    window.AppState.currentTab = tabName;

    // Cargar datos específicos según la pestaña
    if (tabName === 'groups') {
      window.GroupManager.init();
    } else if (tabName === 'users') {
      window.UserManager.loadUsers();
    }
  },

  setupNavigationEventListeners() {
    // Navegación de pestañas del dashboard
    const dashboardTab = document.getElementById('tab-dashboard');
    if (dashboardTab) {
      dashboardTab.addEventListener('click', () => {
        this.showDashboardTab('dashboard');
      });
    }
    
    const groupsTab = document.getElementById('tab-groups');
    if (groupsTab) {
      groupsTab.addEventListener('click', () => {
        if (window.Auth.isAdmin()) {
          this.showDashboardTab('groups');
        }
      });
    }

    const usersTab = document.getElementById('tab-users');
    if (usersTab) {
      usersTab.addEventListener('click', () => {
        if (window.Auth.isAdmin()) {
          this.showDashboardTab('users');
        }
      });
    }

    // Botón de logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        window.Auth.logout();
      });
    }
  }
};