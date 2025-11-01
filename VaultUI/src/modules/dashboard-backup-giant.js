// dashboard.js - Módulo del dashboard integrado

export const PageManager = {
  showPage(pageId) {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('register-container').classList.add('hidden');
    document.getElementById('dashboard-container').classList.add('hidden');

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
    console.log('🎯 PageManager.goToDashboard() ejecutado');
    this.showPage('dashboard');

    // Asegurar inicialización del dashboard SOLO si no está inicializado
    if (window.dashboardManager && !window.dashboardManager.initialized) {
      console.log('🚀 Inicializando dashboard desde goToDashboard() - primera vez');
      setTimeout(() => {
        window.dashboardManager.init();
      }, 100);
    } else {
      console.log('ℹ️ Dashboard ya inicializado, saltando re-inicialización');
    }
  },

  setupNavigationEventListeners() {
    // Método requerido por main.js
    console.log('PageManager navigation event listeners configurados');
  }
};

class DashboardManager {
  constructor() {
    this.currentUser = null;
    this.isAdmin = false;
    this.files = [];
    this.initialized = false;
  }

  async init() {
    if (this.initialized) {
      console.log('⚠️  Dashboard ya inicializado, saltando...');
      return;
    }

    console.log('🚀 INICIANDO DASHBOARD...');

    // Usar la clave correcta del token
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.log('🚪 No hay token, redirigiendo...');
      window.PageManager.goToLogin();
      return;
    }

    try {
      console.log('🔑 Token encontrado, cargando información del usuario...');
      await this.loadUserInfo();

      console.log('🔧 Configurando event listeners...');
      this.setupEventListeners();

      console.log('📱 Configurando navegación de pestañas...');
      this.setupTabNavigation();

      console.log('📄 Mostrando pestaña de archivos por defecto...');

      // DAR TIEMPO PARA QUE EL DOM SE CARGUE COMPLETAMENTE
      setTimeout(async () => {
        await this.showTab('files');
      }, 100);

      this.initialized = true;
      console.log('✅ DASHBOARD INICIALIZADO CORRECTAMENTE');

    } catch (error) {
      console.error('💥 ERROR EN INICIALIZACIÓN DEL DASHBOARD:', error);
      if (window.NotificationManager) {
        window.NotificationManager.showError('Error al inicializar el dashboard: ' + error.message);
      }
    }
  }

  debugDOMElements() {
    console.log('=== DEBUG DOM ELEMENTS ===');

    // Verificar pestañas
    const tabs = document.querySelectorAll('.dashboard-tab');
    console.log(`Pestañas encontradas (${tabs.length}):`);
    tabs.forEach(tab => console.log(`- ${tab.id}: ${tab.textContent.trim()}`));

    // Verificar contenidos
    const contents = document.querySelectorAll('.dashboard-content');
    console.log(`Contenidos encontrados (${contents.length}):`);
    contents.forEach(content => console.log(`- ${content.id}`));

    // Verificar elementos específicos
    const specificElements = ['files-content', 'groups-content', 'users-content', 'config-content'];
    specificElements.forEach(id => {
      const element = document.getElementById(id);
      console.log(`${id}: ${element ? '✅ Encontrado' : '❌ NO ENCONTRADO'}`);
    });

    console.log('=== FIN DEBUG DOM ===');
  }

  async loadUserInfo() {
    try {
      const response = await window.Http.get('/user/me');

      if (response.success && response.data?.user) {
        this.currentUser = response.data.user;
        // Determinar si es admin - primero por campo directo, luego por roles
        this.isAdmin = this.currentUser.is_admin ||
          this.currentUser.roles?.some(role =>
            role.name === 'Administrador' ||
            role.name === 'admin' ||
            role.name === 'Admin'
          ) || false;

        console.log('👤 Roles del usuario:', this.currentUser.roles);
        console.log('🔑 Campo is_admin:', this.currentUser.is_admin);
        console.log('🔑 Es admin determinado:', this.isAdmin);

        console.log('👤 Usuario cargado:', this.currentUser);
        console.log('🔑 Es admin:', this.isAdmin);

        // Actualizar nombre en la UI
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
          userNameElement.textContent = this.currentUser.name;
        }

        // Configurar UI basada en roles
        this.setupRoleBasedUI();

        return true;
      } else {
        console.error('❌ Error en la respuesta del usuario');
        return false;
      }
    } catch (error) {
      console.error('💥 ERROR AL CARGAR USUARIO:', error);
      // Si hay error de autenticación, redirigir al login
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        window.PageManager.goToLogin();
      }
      return false;
    }
  }

  setupEventListeners() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', this.logout.bind(this));
    }

    // File management
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const refreshFilesBtn = document.getElementById('refresh-files');

    if (fileInput) fileInput.addEventListener('change', this.handleFileSelect.bind(this));
    if (dropZone) {
      dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
      dropZone.addEventListener('drop', this.handleDrop.bind(this));
      dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
    }
    if (refreshFilesBtn) refreshFilesBtn.addEventListener('click', this.loadFiles.bind(this));

    // Configuration management event listeners
    this.setupConfigEventListeners();
  }

  setupConfigEventListeners() {
    // Botones de actualizar listas
    const refreshUsersBtn = document.getElementById('refresh-users');
    const refreshGroupsBtn = document.getElementById('refresh-groups');

    if (refreshUsersBtn) {
      refreshUsersBtn.addEventListener('click', () => this.loadUsersForConfig());
    }
    if (refreshGroupsBtn) {
      refreshGroupsBtn.addEventListener('click', () => this.loadGroupsForConfig());
    }

    // Botones de actualizar límites
    const updateUserLimitBtn = document.getElementById('update-user-limit');
    const updateGroupLimitBtn = document.getElementById('update-group-limit');
    const updateDefaultLimitBtn = document.getElementById('update-default-limit');

    if (updateUserLimitBtn) {
      updateUserLimitBtn.addEventListener('click', () => this.updateUserLimit());
    }
    if (updateGroupLimitBtn) {
      updateGroupLimitBtn.addEventListener('click', () => this.updateGroupLimit());
    }
    if (updateDefaultLimitBtn) {
      updateDefaultLimitBtn.addEventListener('click', () => this.updateDefaultLimit());
    }

    // Botón para agregar restricción
    const addRestrictionBtn = document.getElementById('add-restriction-btn');
    if (addRestrictionBtn) {
      addRestrictionBtn.addEventListener('click', () => this.showAddRestrictionModal());
    }

    // Botón para refrescar todos los archivos (admin)
    const refreshAllFilesBtn = document.getElementById('refresh-all-files');
    if (refreshAllFilesBtn) {
      refreshAllFilesBtn.addEventListener('click', () => this.loadAllFiles());
    }

    // Event listeners para el modal de restricciones
    this.setupRestrictionModalListeners();

    // Event listeners para modales de quitar límites
    this.setupRemoveLimitModalListeners();
  }

  setupRemoveLimitModalListeners() {
    // Modal de quitar límite de usuario
    const confirmRemoveUserLimitBtn = document.getElementById('confirm-remove-user-limit');
    const cancelRemoveUserLimitBtn = document.getElementById('cancel-remove-user-limit');

    if (confirmRemoveUserLimitBtn) {
      confirmRemoveUserLimitBtn.addEventListener('click', () => this.confirmRemoveUserLimit());
    }
    if (cancelRemoveUserLimitBtn) {
      cancelRemoveUserLimitBtn.addEventListener('click', () => this.hideRemoveUserLimitModal());
    }

    // Modal de quitar límite de grupo
    const confirmRemoveGroupLimitBtn = document.getElementById('confirm-remove-group-limit');
    const cancelRemoveGroupLimitBtn = document.getElementById('cancel-remove-group-limit');

    if (confirmRemoveGroupLimitBtn) {
      confirmRemoveGroupLimitBtn.addEventListener('click', () => this.confirmRemoveGroupLimit());
    }
    if (cancelRemoveGroupLimitBtn) {
      cancelRemoveGroupLimitBtn.addEventListener('click', () => this.hideRemoveGroupLimitModal());
    }
  }

  setupTabNavigation() {
    console.log('🔧 Configurando navegación de pestañas...');
    const tabs = document.querySelectorAll('.dashboard-tab');
    console.log(`📋 Encontradas ${tabs.length} pestañas`);

    tabs.forEach(tab => {
      // Limpiar listeners anteriores
      tab.removeEventListener('click', this.handleTabClick);

      // Agregar nuevo listener
      tab.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const tabId = tab.id.replace('tab-', '');
        console.log(`🖱️ Click en pestaña: ${tabId}`);

        await this.showTab(tabId);
      });
    });
  }

  async showTab(tabId) {
    console.log(`📱 Cambiando a pestaña: ${tabId}`);

    // Actualizar pestañas activas
    const tabs = document.querySelectorAll('.dashboard-tab');
    tabs.forEach(tab => {
      const currentTabId = tab.id.replace('tab-', '');

      if (currentTabId === tabId) {
        tab.classList.add('border-indigo-500', 'text-indigo-600');
        tab.classList.remove('border-transparent', 'text-gray-500');
      } else {
        tab.classList.remove('border-indigo-500', 'text-indigo-600');
        tab.classList.add('border-transparent', 'text-gray-500');
      }
    });

    // Mostrar/ocultar contenido
    const contents = document.querySelectorAll('.dashboard-content');
    contents.forEach(content => {
      content.classList.add('hidden');
    });

    const targetContent = document.getElementById(`${tabId}-content`);
    if (targetContent) {
      targetContent.classList.remove('hidden');
      console.log(`✅ Mostrando contenido: ${tabId}-content`);
    } else {
      console.error(`❌ No se encontró el contenido: ${tabId}-content`);
    }

    // Cargar datos específicos de la pestaña
    switch (tabId) {
      case 'files':
        console.log('🗂️ Cargando archivos...');
        this.loadFiles();
        this.loadStorageInfo();
        break;
      case 'groups':
        console.log('👥 Cargando grupos...');
        if (this.isAdmin) {
          this.loadGroups();
        } else {
          console.warn('Usuario no es admin, no puede ver grupos');
        }
        break;
      case 'users':
        console.log('👤 Cargando usuarios...');
        if (this.isAdmin) {
          this.loadUsers();
        } else {
          console.warn('Usuario no es admin, no puede ver usuarios');
        }
        break;
      case 'config':
        console.log('⚙️ Cargando configuración...');
        if (this.isAdmin) {
          await this.loadRestrictions();
          await this.loadUsersForConfig();
          await this.loadGroupsForConfig();
          await this.loadDefaultLimit(); // Cargar límite por defecto
          await this.loadAllFiles(); // Cargar todos los archivos para admin
        } else {
          console.warn('Usuario no es admin, no puede ver configuración');
        }
        break;
      default:
        console.warn(`Pestaña desconocida: ${tabId}`);
    }
  }

  async logout() {
    console.log('🚪 Iniciando proceso de logout...');

    try {
      // Hacer petición al backend para invalidar el token
      const token = localStorage.getItem('token');
      if (token && window.Http) {
        try {
          await window.Http.post('/logout');
          console.log('✅ Token invalidado en el servidor');
        } catch (error) {
          console.log('⚠️ Error al invalidar token en servidor:', error);
          // Continuar con logout local aunque falle el servidor
        }
      }

      // Limpiar todos los datos locales
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();

      // Resetear estado de la aplicación
      this.currentUser = null;
      this.isAdmin = false;

      console.log('🧹 Datos locales limpiados');

      // Redirigir usando el router si está disponible
      if (window.AppRouter) {
        window.AppRouter.navigate('/');
      } else {
        // Fallback a navegación manual
        window.location.href = '/';
      }

      console.log('✅ Logout completado');

    } catch (error) {
      console.error('💥 Error durante logout:', error);
      // En caso de error, hacer logout forzado
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  }

  // === FILE MANAGEMENT ===
  async loadFiles() {
    console.log('🗂️ INICIANDO CARGA DE ARCHIVOS...');

    const loadingElement = document.getElementById('files-loading');
    const emptyElement = document.getElementById('files-empty');
    const tableElement = document.getElementById('files-table');

    // Mostrar loading
    if (loadingElement) {
      loadingElement.classList.remove('hidden');
      console.log('✅ Mostrando loading de archivos');
    } else {
      console.error('❌ NO SE ENCONTRÓ files-loading');
    }

    if (emptyElement) emptyElement.classList.add('hidden');
    if (tableElement) tableElement.classList.add('hidden');

    try {
      console.log('📡 Haciendo petición a /files...');
      const response = await window.Http.get('/files');
      console.log('📦 Respuesta recibida:', response);

      if (response.success) {
        this.files = response.data?.files || response.files || [];
        console.log(`📁 Archivos encontrados: ${this.files.length}`);

        // Actualizar información de almacenamiento si está disponible
        if (response.storage_info) {
          console.log('📊 Actualizando información de almacenamiento desde loadFiles');
          this.updateStorageDisplay(response.storage_info);
        }

        if (this.files.length === 0) {
          console.log('📭 No hay archivos, mostrando mensaje vacío');
          if (emptyElement) emptyElement.classList.remove('hidden');
        } else {
          console.log('📋 Renderizando tabla de archivos...');
          this.renderFilesTable();
          if (tableElement) tableElement.classList.remove('hidden');
        }
      } else {
        console.log('❌ La petición no fue exitosa');
        this.files = [];
        if (emptyElement) emptyElement.classList.remove('hidden');
      }
    } catch (error) {
      console.error('💥 ERROR AL CARGAR ARCHIVOS:', error);
      if (window.NotificationManager) {
        window.NotificationManager.showError('Error al cargar los archivos: ' + error.message);
      } else {
        console.error('Error al cargar los archivos:', error.message);
      }

      // Mostrar estado vacío en caso de error
      if (emptyElement) {
        emptyElement.classList.remove('hidden');
        emptyElement.innerHTML = `
          <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
          <p class="text-red-600">Error al cargar archivos</p>
          <p class="text-sm text-gray-500">${error.message}</p>
        `;
      }
    } finally {
      console.log('🏁 FINALIZANDO CARGA DE ARCHIVOS...');
      if (loadingElement) {
        loadingElement.classList.add('hidden');
        console.log('✅ Ocultando loading de archivos');
      }
    }
  }

  renderFilesTable() {
    const tbody = document.getElementById('files-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    this.files.forEach(file => {
      const row = document.createElement('tr');
      row.className = 'hover:bg-gray-50';

      const fileExtension = file.original_name.split('.').pop().toLowerCase();
      const fileIcon = this.getFileIcon(fileExtension);

      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <i class="${fileIcon} text-lg mr-3"></i>
            <div>
              <div class="text-sm font-medium text-gray-900">${file.original_name}</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            ${fileExtension.toUpperCase()}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          ${this.formatBytes(file.size)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          ${this.formatDate(file.created_at)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <div class="flex space-x-2">
            <button onclick="dashboardManager.downloadFile(${file.id}, '${file.original_name}')"
                    class="text-blue-600 hover:text-blue-900 transition">
              <i class="fas fa-download"></i>
            </button>
            <button onclick="dashboardManager.showDeleteModal(${file.id}, '${file.original_name}')"
                    class="text-red-600 hover:text-red-900 transition">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      `;

      tbody.appendChild(row);
    });
  }

  async loadStorageInfo() {
    console.log('🔍 Cargando información de almacenamiento...');
    try {
      const response = await window.Http.get('/files/storage-info');
      console.log('📦 Respuesta storage info:', response);

      if (response && (response.storage_info || response.data)) {
        // Manejar diferentes estructuras de respuesta
        const storageInfo = response.storage_info || response.data;
        console.log('📊 Info de almacenamiento:', storageInfo);

        const usedElement = document.getElementById('storage-used');
        const barElement = document.getElementById('storage-bar');
        const percentageElement = document.getElementById('storage-percentage');

        if (usedElement && storageInfo.formatted_used && storageInfo.formatted_limit) {
          usedElement.textContent = `${storageInfo.formatted_used} / ${storageInfo.formatted_limit}`;
          console.log('✅ Actualizado storage-used:', usedElement.textContent);
        }

        if (barElement && storageInfo.percentage !== undefined) {
          barElement.style.width = `${storageInfo.percentage}%`;
          console.log('✅ Actualizado storage-bar:', `${storageInfo.percentage}%`);
        }

        if (percentageElement && storageInfo.percentage !== undefined) {
          percentageElement.textContent = `${storageInfo.percentage}% utilizado`;
          console.log('✅ Actualizado storage-percentage:', percentageElement.textContent);
        }
      } else {
        console.error('❌ Respuesta de storage info inválida:', response);
      }
    } catch (error) {
      console.error('❌ Error loading storage info:', error);

      // Mostrar valores por defecto en caso de error
      const usedElement = document.getElementById('storage-used');
      const barElement = document.getElementById('storage-bar');
      const percentageElement = document.getElementById('storage-percentage');

      if (usedElement) usedElement.textContent = '0 B / 0 B';
      if (barElement) barElement.style.width = '0%';
      if (percentageElement) percentageElement.textContent = '0% utilizado';
    }
  }

  // Actualizar visualización de almacenamiento
  updateStorageDisplay(storageInfo) {
    console.log('🔄 Actualizando display de almacenamiento:', storageInfo);

    const usedElement = document.getElementById('storage-used');
    const barElement = document.getElementById('storage-bar');
    const percentageElement = document.getElementById('storage-percentage');

    if (usedElement && storageInfo.formatted_used && storageInfo.formatted_limit) {
      usedElement.textContent = `${storageInfo.formatted_used} / ${storageInfo.formatted_limit}`;
      console.log('✅ Actualizado storage-used:', usedElement.textContent);
    }

    if (barElement && storageInfo.percentage !== undefined) {
      barElement.style.width = `${storageInfo.percentage}%`;
      console.log('✅ Actualizado storage-bar:', `${storageInfo.percentage}%`);
    }

    if (percentageElement && storageInfo.percentage !== undefined) {
      percentageElement.textContent = `${storageInfo.percentage}% utilizado`;
      console.log('✅ Actualizado storage-percentage:', percentageElement.textContent);
    }
  }

  // === GROUPS MANAGEMENT (ADMIN) ===
  async loadGroups() {
    console.log('Cargando grupos...');
    if (!this.isAdmin) return;

    // Usar el GroupManager existente
    if (window.GroupManager && window.GroupManager.loadGroups) {
      await window.GroupManager.loadGroups();
    } else {
      console.warn('Módulo de grupos no disponible');
    }
  }

  // === USERS MANAGEMENT (ADMIN) ===
  async loadUsers() {
    console.log('Cargando usuarios...');
    if (!this.isAdmin) return;

    // Usar el UserManager existente
    if (window.UserManager && window.UserManager.loadUsers) {
      await window.UserManager.loadUsers();
    } else {
      console.warn('Módulo de usuarios no disponible');
    }
  }

  // === RESTRICTIONS MANAGEMENT (ADMIN) ===
  async loadRestrictions() {
    console.log('🔍 Cargando restricciones de archivo...');
    if (!this.isAdmin) {
      console.log('⚠️ Usuario no es admin, saltando carga de restricciones');
      return;
    }

    const loadingElement = document.getElementById('restrictions-loading');
    const tableElement = document.getElementById('restrictions-table');

    if (loadingElement) loadingElement.classList.remove('hidden');
    if (tableElement) tableElement.classList.add('hidden');

    try {
      console.log('📡 Solicitando restricciones al servidor...');
      const response = await window.Http.get('/file-restrictions');
      console.log('📦 Respuesta completa:', response);

      // Manejo robusto de diferentes estructuras de respuesta
      let restrictions = [];

      if (response.success) {
        // Con el Http utility corregido, la estructura debería ser response.data.restrictions
        if (response.data && response.data.restrictions) {
          restrictions = response.data.restrictions;
          console.log('✅ Restricciones encontradas en response.data.restrictions');
        } else if (response.restrictions) {
          restrictions = response.restrictions;
          console.log('✅ Restricciones encontradas en response.restrictions');
        } else if (Array.isArray(response.data)) {
          restrictions = response.data;
          console.log('✅ Restricciones encontradas en response.data (array)');
        } else {
          console.warn('⚠️ No se encontraron restricciones en la respuesta');
          console.warn('📋 Estructura de respuesta:', Object.keys(response));
          console.warn('📋 response.data:', response.data);
        }

        console.log(`📊 Restricciones cargadas: ${restrictions.length}`);
        this.renderRestrictionsTable(restrictions);
      } else {
        console.error('❌ Respuesta sin success flag:', response);
        window.NotificationManager?.showError('Error al cargar restricciones: ' + (response.message || 'Error desconocido'));
      }
    } catch (error) {
      console.error('❌ Error loading restrictions:', error);
      window.NotificationManager?.showError('Error de conexión al cargar restricciones: ' + error.message);
    } finally {
      if (loadingElement) loadingElement.classList.add('hidden');
      if (tableElement) tableElement.classList.remove('hidden');
    }
  }

  renderRestrictionsTable(restrictions) {
    console.log('🔄 Renderizando tabla de restricciones...');
    const tbody = document.getElementById('restrictions-tbody');
    if (!tbody) {
      console.error('❌ No se encontró el elemento restrictions-tbody');
      return;
    }

    tbody.innerHTML = '';

    // Verificar que restrictions sea un array
    if (!Array.isArray(restrictions)) {
      console.error('❌ restrictions debe ser un array, recibido:', typeof restrictions, restrictions);
      restrictions = [];
    }

    console.log(`📊 Renderizando ${restrictions.length} restricciones`);

    if (restrictions.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td colspan="4" class="px-6 py-4 text-center text-gray-500">
          <div class="py-8">
            <div class="text-gray-400 mb-2">
              <i class="fas fa-file-circle-xmark text-3xl"></i>
            </div>
            <div class="text-sm">No hay restricciones de archivo configuradas</div>
            <div class="text-xs text-gray-400 mt-1">Las restricciones permiten bloquear ciertos tipos de archivo</div>
          </div>
        </td>
      `;
      tbody.appendChild(row);
      return;
    }

    restrictions.forEach((restriction, index) => {
      console.log(`📝 Procesando restricción ${index + 1}:`, restriction);

      // Validar que la restricción tenga los campos necesarios
      if (!restriction.id || !restriction.extension) {
        console.warn('⚠️ Restricción inválida (falta id o extension):', restriction);
        return;
      }

      const row = document.createElement('tr');
      row.className = 'hover:bg-gray-50 transition-colors duration-200';

      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="font-mono text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full border border-red-200">
            .${restriction.extension}
          </span>
        </td>
        <td class="px-6 py-4">
          <span class="text-sm text-gray-900">${restriction.description || (restriction.is_prohibited ? 'Extensión no permitida' : 'Extensión permitida')}</span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-center">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            restriction.is_prohibited ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
          }">
            <i class="fas ${restriction.is_prohibited ? 'fa-times-circle' : 'fa-check-circle'} mr-1"></i>
            ${restriction.is_prohibited ? 'Prohibida' : 'Permitida'}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button class="text-red-600 hover:text-red-900 transition-colors duration-200"
                  onclick="window.dashboardManager.showDeleteRestrictionModal(${restriction.id}, '${restriction.extension}')"
                  title="Eliminar restricción">
            <i class="fas fa-trash mr-1"></i>Eliminar
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });

    console.log('✅ Tabla de restricciones renderizada correctamente');
  }

  // === CONFIGURATION MANAGEMENT ===

  // Cargar usuarios para configuración
  async loadUsersForConfig() {
    console.log('🔍 Cargando usuarios para configuración...');
    try {
      const response = await window.Http.get('/users');
      console.log('📦 Respuesta de usuarios:', response);

      let users = null;

      if (response.success && response.data && response.data.users) {
        // Nueva estructura: response.data.users
        users = response.data.users;
        console.log('✅ Usuarios encontrados en response.data.users');
      } else if (response.success && response.data && response.data.data) {
        // Estructura paginada: response.data.data
        users = response.data.data;
        console.log('✅ Usuarios encontrados en response.data.data');
      } else if (response.success && response.data && Array.isArray(response.data)) {
        // Array directo: response.data
        users = response.data;
        console.log('✅ Usuarios encontrados en response.data (array directo)');
      } else if (response.data && Array.isArray(response.data)) {
        // Fallback: data directamente
        users = response.data;
        console.log('✅ Usuarios encontrados en response.data (fallback)');
      }

      if (users && Array.isArray(users)) {
        console.log('� Usuarios encontrados:', users.length);
        this.populateUserSelect(users);
        this.renderUsersList(users);
      } else {
        console.error('❌ No se pudieron obtener usuarios válidos:', response);
        this.renderUsersList([]);
      }
    } catch (error) {
      console.error('💥 Error loading users for config:', error);
      this.renderUsersList([]);
    }
  }

  // Cargar grupos para configuración
  async loadGroupsForConfig() {
    console.log('🔍 Cargando grupos para configuración...');
    try {
      const response = await window.Http.get('/groups');
      console.log('📦 Respuesta de grupos:', response);

      let groups = null;

      if (response.success && response.data && response.data.data) {
        // Datos en response.data.data
        groups = response.data.data;
      } else if (response.success && response.data && Array.isArray(response.data)) {
        // Datos directamente en response.data
        groups = response.data;
      } else if (response.data && Array.isArray(response.data)) {
        // Fallback: data directamente
        groups = response.data;
      }

      if (groups && Array.isArray(groups)) {
        console.log('� Grupos encontrados:', groups.length);
        this.populateGroupSelect(groups);
        this.renderGroupsList(groups);
      } else {
        console.error('❌ No se pudieron obtener grupos válidos:', response);
        this.renderGroupsList([]);
      }
    } catch (error) {
      console.error('💥 Error loading groups for config:', error);
      this.renderGroupsList([]);
    }
  }

  // Poblar select de usuarios
  populateUserSelect(users) {
    console.log('🔄 Poblando select de usuarios...');
    const userSelect = document.getElementById('user-select');
    if (!userSelect) {
      console.error('❌ No se encontró el elemento user-select');
      return;
    }

    userSelect.innerHTML = '<option value="">Seleccionar usuario...</option>';

    users.forEach(user => {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = `${user.name} (${user.email})`;
      userSelect.appendChild(option);
    });

    console.log(`✅ Select poblado con ${users.length} usuarios`);
  }

  // Poblar select de grupos
  populateGroupSelect(groups) {
    console.log('🔄 Poblando select de grupos...');
    const groupSelect = document.getElementById('group-select');
    if (!groupSelect) {
      console.error('❌ No se encontró el elemento group-select');
      return;
    }

    groupSelect.innerHTML = '<option value="">Seleccionar grupo...</option>';

    groups.forEach(group => {
      const option = document.createElement('option');
      option.value = group.id;
      option.textContent = group.name;
      groupSelect.appendChild(option);
    });

    console.log(`✅ Select poblado con ${groups.length} grupos`);
  }

  // Renderizar lista de usuarios con límites
  renderUsersList(users) {
    console.log('🔄 Renderizando lista de usuarios...');
    const usersList = document.getElementById('users-list');
    if (!usersList) {
      console.error('❌ No se encontró el elemento users-list');
      return;
    }

    if (!users || users.length === 0) {
      usersList.innerHTML = '<div class="text-sm text-gray-500 text-center py-4">No hay usuarios</div>';
      console.log('⚠️ No hay usuarios para mostrar');
      return;
    }

    usersList.innerHTML = '';

    users.forEach(user => {
      console.log('🔍 Procesando usuario:', { id: user.id, name: user.name, storage_limit: user.storage_limit });
      
      if (!user.id) {
        console.error('❌ Usuario sin ID:', user);
        return;
      }
      
      const limitDisplay = user.storage_limit
        ? `${(user.storage_limit / (1024 * 1024)).toFixed(0)} MB`
        : 'Sin límite específico';

      const limitClass = user.storage_limit ? 'text-purple-700' : 'text-gray-500';

      const userItem = document.createElement('div');
      userItem.className = 'flex justify-between items-center p-2 bg-gray-50 rounded border';
      userItem.setAttribute('data-user-id', user.id);
      userItem.innerHTML = `
        <div>
          <div class="font-medium text-sm">${user.name}</div>
          <div class="text-xs text-gray-600">${user.email}</div>
        </div>
        <div class="text-right">
          <div class="text-sm font-medium ${limitClass}">${limitDisplay}</div>
          ${user.storage_limit ? `
            <button onclick="window.dashboardManager.removeUserLimit(${user.id})"
                    class="text-xs text-red-600 hover:text-red-800">
              Quitar límite
            </button>
          ` : ''}
        </div>
      `;
      usersList.appendChild(userItem);
    });

    console.log(`✅ Lista renderizada con ${users.length} usuarios`);
  }

  // Renderizar lista de grupos con límites
  renderGroupsList(groups) {
    console.log('🔄 Renderizando lista de grupos...');
    const groupsList = document.getElementById('groups-list');
    if (!groupsList) {
      console.error('❌ No se encontró el elemento groups-list');
      return;
    }

    if (!groups || groups.length === 0) {
      groupsList.innerHTML = `
        <div class="text-sm text-gray-500 text-center py-4">
          <div class="mb-2">No hay grupos creados</div>
          <div class="text-xs">Ve a la pestaña "Gestión de Grupos" para crear grupos</div>
        </div>
      `;
      console.log('⚠️ No hay grupos para mostrar');
      return;
    }

    groupsList.innerHTML = '';

    groups.forEach(group => {
      console.log('🔍 Procesando grupo:', { id: group.id, name: group.name, storage_limit: group.storage_limit });
      
      if (!group.id) {
        console.error('❌ Grupo sin ID:', group);
        return;
      }
      
      const limitDisplay = group.storage_limit
        ? `${(group.storage_limit / (1024 * 1024)).toFixed(0)} MB`
        : 'Sin límite específico';

      const limitClass = group.storage_limit ? 'text-green-700' : 'text-gray-500';

      const groupItem = document.createElement('div');
      groupItem.className = 'flex justify-between items-center p-2 bg-gray-50 rounded border';
      groupItem.setAttribute('data-group-id', group.id);
      groupItem.innerHTML = `
        <div>
          <div class="font-medium text-sm">${group.name}</div>
          <div class="text-xs text-gray-600">${group.description || 'Sin descripción'}</div>
        </div>
        <div class="text-right">
          <div class="text-sm font-medium ${limitClass}">${limitDisplay}</div>
          ${group.storage_limit ? `
            <button onclick="window.dashboardManager.removeGroupLimit(${group.id})"
                    class="text-xs text-red-600 hover:text-red-800">
              Quitar límite
            </button>
          ` : ''}
        </div>
      `;
      groupsList.appendChild(groupItem);
    });

    console.log(`✅ Lista renderizada con ${groups.length} grupos`);
  }

  // Actualizar límite de usuario - MEJORADO CON DEBUG
  async updateUserLimit() {
    console.log('🎯 updateUserLimit() llamada');
    const userSelect = document.getElementById('user-select');
    const userLimitInput = document.getElementById('user-limit');

    console.log('📋 Elementos encontrados:', {
      userSelect: !!userSelect,
      userLimitInput: !!userLimitInput,
      userSelectValue: userSelect?.value,
      userLimitValue: userLimitInput?.value
    });

    const userId = userSelect?.value;
    const limitMB = parseInt(userLimitInput?.value);

    if (!userId) {
      console.log('⚠️ Usuario no seleccionado');
      window.NotificationManager?.showWarning('Por favor selecciona un usuario') || alert('Por favor selecciona un usuario');
      return;
    }

    if (!limitMB || limitMB <= 0) {
      console.log('⚠️ Límite inválido:', limitMB);
      window.NotificationManager?.showWarning('Por favor ingresa un límite válido (mayor a 0)') || alert('Por favor ingresa un límite válido (mayor a 0)');
      return;
    }

    try {
      console.log('🔄 Actualizando límite de usuario:', { userId, limitMB });
      const response = await window.Http.put(`/users/${userId}/storage-limit`, {
        storage_limit: limitMB * 1024 * 1024 // Convertir MB a bytes
      });

      console.log('📡 Respuesta del servidor:', response);

      // Manejar diferentes estructuras de respuesta
      if (response.success || response.message) {
        console.log('✅ Límite actualizado exitosamente');
        window.NotificationManager?.showSuccess('Límite de usuario actualizado correctamente') || alert('Límite de usuario actualizado correctamente');
        userSelect.value = '';
        userLimitInput.value = '';
        await this.loadUsersForConfig(); // Recargar lista
      } else {
        console.log('❌ Error en respuesta:', response);
        const errorMsg = 'Error al actualizar límite: ' + (response.error || response.message || 'Error desconocido');
        window.NotificationManager?.showError(errorMsg) || alert(errorMsg);
      }
    } catch (error) {
      console.error('❌ Error updating user limit:', error);
      const errorMsg = 'Error al actualizar límite de usuario: ' + (error.message || 'Error de conexión');
      window.NotificationManager?.showError(errorMsg) || alert(errorMsg);
    }
  }  // Actualizar límite de grupo - MEJORADO CON DEBUG
  async updateGroupLimit() {
    console.log('🎯 updateGroupLimit() llamada');
    const groupSelect = document.getElementById('group-select');
    const groupLimitInput = document.getElementById('group-limit');

    console.log('📋 Elementos encontrados:', {
      groupSelect: !!groupSelect,
      groupLimitInput: !!groupLimitInput,
      groupSelectValue: groupSelect?.value,
      groupLimitValue: groupLimitInput?.value
    });

    const groupId = groupSelect?.value;
    const limitMB = parseInt(groupLimitInput?.value);

    if (!groupId) {
      console.log('⚠️ Grupo no seleccionado');
      window.NotificationManager?.showWarning('Por favor selecciona un grupo') || alert('Por favor selecciona un grupo');
      return;
    }

    if (!limitMB || limitMB <= 0) {
      console.log('⚠️ Límite inválido:', limitMB);
      window.NotificationManager?.showWarning('Por favor ingresa un límite válido (mayor a 0)') || alert('Por favor ingresa un límite válido (mayor a 0)');
      return;
    }

    try {
      console.log('🔄 Actualizando límite de grupo:', { groupId, limitMB });
      // ✅ CORREGIDO: Usar la ruta específica para límites de almacenamiento
      const response = await window.Http.put(`/groups/${groupId}/storage-limit`, {
        storage_limit: limitMB * 1024 * 1024 // Convertir MB a bytes
      });

      console.log('📡 Respuesta del servidor:', response);

      // Manejar diferentes estructuras de respuesta
      if (response.success || response.message) {
        console.log('✅ Límite de grupo actualizado exitosamente');
        window.NotificationManager?.showSuccess('Límite de grupo actualizado correctamente') || alert('Límite de grupo actualizado correctamente');
        groupSelect.value = '';
        groupLimitInput.value = '';
        await this.loadGroupsForConfig(); // Recargar lista
      } else {
        console.log('❌ Error en respuesta:', response);
        const errorMsg = 'Error al actualizar límite: ' + (response.error || response.message || 'Error desconocido');
        window.NotificationManager?.showError(errorMsg) || alert(errorMsg);
      }
    } catch (error) {
      console.error('❌ Error updating group limit:', error);
      const errorMsg = 'Error al actualizar límite de grupo: ' + (error.message || 'Error de conexión');
      window.NotificationManager?.showError(errorMsg) || alert(errorMsg);
    }
  }

    // Actualizar límite por defecto - IMPLEMENTACIÓN COMPLETA
  async updateDefaultLimit() {
    console.log('🎯 updateDefaultLimit() llamada');
    const defaultLimitInput = document.getElementById('default-limit');

    console.log('📋 Elementos encontrados:', {
      defaultLimitInput: !!defaultLimitInput,
      defaultLimitValue: defaultLimitInput?.value
    });

    const limitMB = parseInt(defaultLimitInput?.value);

    if (!limitMB || limitMB <= 0) {
      console.log('⚠️ Límite inválido:', limitMB);
      window.NotificationManager?.showWarning('Por favor ingresa un límite válido (mayor a 0)') || alert('Por favor ingresa un límite válido (mayor a 0)');
      return;
    }

    if (limitMB > 10000) { // Límite máximo de 10GB
      console.log('⚠️ Límite demasiado alto:', limitMB);
      window.NotificationManager?.showWarning('El límite no puede ser mayor a 10,000 MB (10GB)') || alert('El límite no puede ser mayor a 10,000 MB (10GB)');
      return;
    }

    try {
      console.log('🔄 Actualizando límite global por defecto:', { limitMB });
      const response = await window.Http.put('/system-settings/default-storage-limit', {
        storage_limit_mb: limitMB
      });

      console.log('📡 Respuesta del servidor:', response);

      if (response.success) {
        console.log('✅ Límite global actualizado exitosamente');
        this._justUpdatedDefaultLimit = true; // Bandera para mostrar notificación especial
        window.NotificationManager?.showSuccess(`Límite por defecto actualizado a ${limitMB} MB`) || alert(`Límite por defecto actualizado a ${limitMB} MB`);
        defaultLimitInput.value = '';

        // Recargar la información del límite actual
        await this.loadDefaultLimit();
      } else {
        console.log('❌ Error en respuesta:', response);
        const errorMsg = 'Error al actualizar límite por defecto: ' + (response.error || response.message || 'Error desconocido');
        window.NotificationManager?.showError(errorMsg) || alert(errorMsg);
      }
    } catch (error) {
      console.error('❌ Error updating default limit:', error);
      const errorMsg = 'Error al actualizar límite por defecto: ' + (error.message || 'Error de conexión');
      window.NotificationManager?.showError(errorMsg) || alert(errorMsg);
    }
  }

  // Cargar límite por defecto actual
  async loadDefaultLimit() {
    console.log('🔍 Cargando límite por defecto actual...');
    try {
      const response = await window.Http.get('/system-settings/default-storage-limit');
      console.log('📦 Respuesta límite por defecto:', response);

      if (response.success && response.data) {
        const limitMB = response.data.default_storage_limit_mb;
        const formattedLimit = response.data.formatted_limit;

        // Mostrar el límite actual en la interfaz
        const currentLimitElement = document.getElementById('current-default-limit');
        if (currentLimitElement) {
          currentLimitElement.innerHTML = `
            <i class="fas fa-check-circle mr-1"></i>
            <span class="font-semibold">${formattedLimit}</span>
          `;
          currentLimitElement.className = 'text-sm text-blue-600 font-medium flex items-center';
        }

        // También actualizar el placeholder del input
        const defaultLimitInput = document.getElementById('default-limit');
        if (defaultLimitInput) {
          defaultLimitInput.placeholder = limitMB.toString();
        }

        console.log(`✅ Límite por defecto cargado: ${limitMB} MB (${formattedLimit})`);

        // Mostrar notificación de éxito si acabamos de cargar después de una actualización
        if (this._justUpdatedDefaultLimit) {
          window.NotificationManager?.showSuccess(`Límite global actualizado y aplicado: ${formattedLimit}`);
          this._justUpdatedDefaultLimit = false;
        }
      } else {
        console.warn('⚠️ No se pudo cargar el límite por defecto');
        const currentLimitElement = document.getElementById('current-default-limit');
        if (currentLimitElement) {
          currentLimitElement.innerHTML = `
            <i class="fas fa-exclamation-triangle mr-1"></i>
            <span>Error al cargar</span>
          `;
          currentLimitElement.className = 'text-sm text-red-600 font-medium flex items-center';
        }
      }
    } catch (error) {
      console.error('❌ Error loading default limit:', error);
      const currentLimitElement = document.getElementById('current-default-limit');
      if (currentLimitElement) {
        currentLimitElement.innerHTML = `
          <i class="fas fa-times-circle mr-1"></i>
          <span>Error de conexión</span>
        `;
        currentLimitElement.className = 'text-sm text-red-600 font-medium flex items-center';
      }
    }
  }  // Quitar límite específico de usuario
  async removeUserLimit(userId) {
    // Buscar el nombre del usuario para el modal
    const usersListElement = document.getElementById('users-list');
    let userName = 'Usuario';
    
    if (usersListElement) {
      const userCard = usersListElement.querySelector(`[data-user-id="${userId}"]`);
      if (userCard) {
        const nameElement = userCard.querySelector('.font-medium');
        if (nameElement) {
          userName = nameElement.textContent;
        }
      }
    }
    
    console.log('🔍 Mostrando modal para quitar límite de usuario:', { userId, userName });
    this.showRemoveUserLimitModal(userId, userName);
  }

  // Función para quitar límite de usuario sin confirmación (para uso interno)
  async removeUserLimitWithoutConfirm(userId) {
    console.log('🔍 Iniciando remoción de límite de usuario:', { userId, type: typeof userId });
    
    // Validar que userId sea válido
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.error('❌ ID de usuario inválido:', userId);
      window.NotificationManager?.showError('ID de usuario inválido') || alert('ID de usuario inválido');
      return;
    }

    try {
      console.log('🔄 Removiendo límite de usuario:', userId);
      const response = await window.Http.put(`/users/${userId}/storage-limit`, {
        storage_limit: null
      });

      console.log('📡 Respuesta del servidor:', response);

      // Manejar diferentes estructuras de respuesta
      if (response.success || response.message) {
        window.NotificationManager?.showSuccess('Límite específico removido. El usuario usará el límite por defecto.') || alert('Límite específico removido. El usuario usará el límite por defecto.');
        await this.loadUsersForConfig(); // Recargar lista
      } else {
        const errorMsg = 'Error al remover límite: ' + (response.error || response.message || 'Error desconocido');
        window.NotificationManager?.showError(errorMsg) || alert(errorMsg);
      }
    } catch (error) {
      console.error('❌ Error removing user limit:', error);
      const errorMsg = 'Error al remover límite de usuario: ' + (error.message || 'Error de conexión');
      window.NotificationManager?.showError(errorMsg) || alert(errorMsg);
    }
  }

  // Quitar límite específico de grupo
  async removeGroupLimit(groupId) {
    // Buscar el nombre del grupo para el modal
    const groupsListElement = document.getElementById('groups-list');
    let groupName = 'Grupo';
    
    if (groupsListElement) {
      const groupCard = groupsListElement.querySelector(`[data-group-id="${groupId}"]`);
      if (groupCard) {
        const nameElement = groupCard.querySelector('.font-medium');
        if (nameElement) {
          groupName = nameElement.textContent;
        }
      }
    }
    
    console.log('🔍 Mostrando modal para quitar límite de grupo:', { groupId, groupName });
    this.showRemoveGroupLimitModal(groupId, groupName);
  }

  // Función para quitar límite de grupo sin confirmación (para uso interno)
  async removeGroupLimitWithoutConfirm(groupId) {
    console.log('🔍 Iniciando remoción de límite de grupo:', { groupId, type: typeof groupId });
    
    // Validar que groupId sea válido
    if (!groupId || groupId === 'undefined' || groupId === 'null') {
      console.error('❌ ID de grupo inválido:', groupId);
      window.NotificationManager?.showError('ID de grupo inválido') || alert('ID de grupo inválido');
      return;
    }

    try {
      console.log('🔄 Removiendo límite de grupo:', groupId);
      // ✅ CORREGIDO: Usar la ruta específica para límites de almacenamiento
      const response = await window.Http.put(`/groups/${groupId}/storage-limit`, {
        storage_limit: null
      });

      console.log('📡 Respuesta del servidor:', response);

      // Manejar diferentes estructuras de respuesta
      if (response.success || response.message) {
        window.NotificationManager?.showSuccess('Límite específico removido. El grupo usará el límite por defecto.') || alert('Límite específico removido. El grupo usará el límite por defecto.');
        await this.loadGroupsForConfig(); // Recargar lista
      } else {
        const errorMsg = 'Error al remover límite: ' + (response.error || response.message || 'Error desconocido');
        window.NotificationManager?.showError(errorMsg) || alert(errorMsg);
      }
    } catch (error) {
      console.error('❌ Error removing group limit:', error);
      const errorMsg = 'Error al remover límite de grupo: ' + (error.message || 'Error de conexión');
      window.NotificationManager?.showError(errorMsg) || alert(errorMsg);
    }
  }

  // === RESTRICTIONS MANAGEMENT METHODS ===

  // Configurar event listeners del modal de restricciones
  setupRestrictionModalListeners() {
    const modal = document.getElementById('restriction-modal');
    const form = document.getElementById('restriction-form');
    const cancelBtn = document.getElementById('cancel-restriction');

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.hideRestrictionModal());
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideRestrictionModal();
        }
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => this.handleRestrictionSubmit(e));
    }
  }

  // Mostrar modal para agregar restricción
  showAddRestrictionModal() {
    console.log('📝 Mostrando modal para agregar restricción');

    const modal = document.getElementById('restriction-modal');
    const modalTitle = document.getElementById('modal-title');
    const extensionInput = document.getElementById('extension-input');
    const statusSelect = document.getElementById('status-select');
    const descriptionInput = document.getElementById('description-input');

    if (!modal) {
      console.error('❌ No se encontró el modal de restricciones');
      return;
    }

    // Configurar modal para agregar
    if (modalTitle) modalTitle.textContent = 'Agregar Restricción';
    if (extensionInput) extensionInput.value = '';
    if (statusSelect) statusSelect.value = '1'; // Prohibido por defecto
    if (descriptionInput) descriptionInput.value = '';

    // Mostrar modal
    modal.classList.remove('hidden');
  }

  // Ocultar modal de restricciones
  hideRestrictionModal() {
    console.log('❌ Ocultando modal de restricciones');

    const modal = document.getElementById('restriction-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  // Manejar envío del formulario de restricciones
  async handleRestrictionSubmit(e) {
    e.preventDefault();
    console.log('📤 Enviando formulario de restricción');

    const extensionInput = document.getElementById('extension-input');
    const statusSelect = document.getElementById('status-select');
    const descriptionInput = document.getElementById('description-input');

    if (!extensionInput || !statusSelect) {
      console.error('❌ Campos requeridos no encontrados');
      return;
    }

    const extension = extensionInput.value.trim().toLowerCase();
    const isProhibited = statusSelect.value === '1'; // Convertir string a boolean
    const description = descriptionInput?.value.trim() || '';

    // Validaciones
    if (!extension) {
      window.NotificationManager?.showWarning('Por favor ingresa una extensión de archivo') || alert('Por favor ingresa una extensión de archivo');
      return;
    }

    // Remover punto inicial si lo tiene
    const cleanExtension = extension.startsWith('.') ? extension.substring(1) : extension;

    if (!/^[a-zA-Z0-9]+$/.test(cleanExtension)) {
      window.NotificationManager?.showWarning('La extensión solo puede contener letras y números') || alert('La extensión solo puede contener letras y números');
      return;
    }

    try {
      console.log('🔄 Creando restricción:', { cleanExtension, isProhibited, description });

      const response = await window.Http.post('/file-restrictions', {
        extension: cleanExtension,
        is_prohibited: isProhibited, // Ahora es boolean: true/false
        description: description
      });

      console.log('📡 Respuesta del servidor:', response);

      if (response.success) {
        console.log('✅ Restricción creada exitosamente');
        const statusText = isProhibited ? 'PROHIBIDA' : 'PERMITIDA';
        const statusIcon = isProhibited ? '🚫' : '✅';
        window.NotificationManager?.showSuccess(`${statusIcon} Extensión .${cleanExtension} marcada como ${statusText}`) || alert(`Restricción creada: .${cleanExtension} ${statusText}`);

        // Ocultar modal y recargar restricciones
        this.hideRestrictionModal();
        await this.loadRestrictions();
      } else {
        console.log('❌ Error en respuesta:', response);
        const errorMsg = response.message || response.error || 'Error al crear restricción';
        window.NotificationManager?.showError(errorMsg) || alert(errorMsg);
      }
    } catch (error) {
      console.error('❌ Error creating restriction:', error);
      let errorMsg = 'Error al crear restricción: ';

      if (error.message.includes('422')) {
        errorMsg += 'La extensión ya existe o los datos son inválidos';
      } else {
        errorMsg += error.message || 'Error de conexión';
      }

      window.NotificationManager?.showError(errorMsg) || alert(errorMsg);
    }
  }

  // Mostrar modal de confirmación para eliminar restricción
  showDeleteRestrictionModal(restrictionId, extension) {
    console.log('🗑️ Mostrando modal de eliminación para restricción:', { restrictionId, extension });

    const modal = document.getElementById('delete-restriction-modal');
    const extensionSpan = document.getElementById('restriction-extension');
    const confirmBtn = document.getElementById('confirm-delete-restriction');
    const cancelBtn = document.getElementById('cancel-delete-restriction');

    if (!modal || !extensionSpan || !confirmBtn || !cancelBtn) {
      console.error('❌ No se encontraron elementos del modal de restricciones');
      // Fallback al confirm() tradicional
      const confirmMsg = `¿Estás seguro de que quieres eliminar la restricción para archivos .${extension}?`;
      if (confirm(confirmMsg)) {
        this.deleteRestriction(restrictionId);
      }
      return;
    }

    // Configurar el modal
    extensionSpan.textContent = `.${extension}`;

    // Limpiar event listeners anteriores
    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    // Agregar nuevos event listeners
    newConfirmBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      this.deleteRestriction(restrictionId);
    });

    newCancelBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    // Cerrar modal al hacer click fuera
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });

    // Mostrar el modal
    modal.classList.remove('hidden');
  }

  // Eliminar restricción de archivo
  async deleteRestriction(restrictionId) {
    console.log('🗑️ Eliminando restricción:', restrictionId);

    try {
      console.log('🔄 Enviando petición de eliminación...');
      const response = await window.Http.delete(`/file-restrictions/${restrictionId}`);
      console.log('📡 Respuesta del servidor:', response);

      if (response.success) {
        console.log('✅ Restricción eliminada exitosamente');
        window.NotificationManager?.showSuccess('Restricción de archivo eliminada correctamente') || alert('Restricción eliminada correctamente');

        // Recargar la tabla de restricciones
        await this.loadRestrictions();
      } else {
        console.log('❌ Error en respuesta:', response);
        const errorMsg = 'Error al eliminar restricción: ' + (response.error || response.message || 'Error desconocido');
        window.NotificationManager?.showError(errorMsg) || alert(errorMsg);
      }
    } catch (error) {
      console.error('❌ Error deleting restriction:', error);
      const errorMsg = 'Error al eliminar restricción: ' + (error.message || 'Error de conexión');
      window.NotificationManager?.showError(errorMsg) || alert(errorMsg);
    }
  }

  // === MODAL FUNCTIONS FOR REMOVING LIMITS ===
  
  // Mostrar modal de confirmación para quitar límite de usuario
  showRemoveUserLimitModal(userId, userName) {
    console.log('🔍 Mostrando modal para quitar límite de usuario:', { userId, userName });
    
    this.pendingUserLimitRemoval = userId;
    
    const modal = document.getElementById('remove-user-limit-modal');
    const userNameSpan = document.getElementById('user-limit-name');
    
    if (!modal || !userNameSpan) {
      console.error('❌ No se encontraron elementos del modal de quitar límite de usuario');
      // Fallback al confirm() tradicional
      this.removeUserLimit(userId);
      return;
    }
    
    userNameSpan.textContent = userName;
    modal.classList.remove('hidden');
    console.log('✅ Modal de quitar límite de usuario mostrado');
  }

  // Ocultar modal de quitar límite de usuario
  hideRemoveUserLimitModal() {
    const modal = document.getElementById('remove-user-limit-modal');
    if (modal) {
      modal.classList.add('hidden');
      this.pendingUserLimitRemoval = null;
      console.log('✅ Modal de quitar límite de usuario ocultado');
    }
  }

  // Confirmar quitar límite de usuario
  async confirmRemoveUserLimit() {
    if (this.pendingUserLimitRemoval) {
      console.log('✅ Confirmado quitar límite de usuario:', this.pendingUserLimitRemoval);
      this.hideRemoveUserLimitModal();
      await this.removeUserLimitWithoutConfirm(this.pendingUserLimitRemoval);
    }
  }

  // Mostrar modal de confirmación para quitar límite de grupo
  showRemoveGroupLimitModal(groupId, groupName) {
    console.log('🔍 Mostrando modal para quitar límite de grupo:', { groupId, groupName });
    
    this.pendingGroupLimitRemoval = groupId;
    
    const modal = document.getElementById('remove-group-limit-modal');
    const groupNameSpan = document.getElementById('group-limit-name');
    
    if (!modal || !groupNameSpan) {
      console.error('❌ No se encontraron elementos del modal de quitar límite de grupo');
      // Fallback al confirm() tradicional
      this.removeGroupLimit(groupId);
      return;
    }
    
    groupNameSpan.textContent = groupName;
    modal.classList.remove('hidden');
    console.log('✅ Modal de quitar límite de grupo mostrado');
  }

  // Ocultar modal de quitar límite de grupo
  hideRemoveGroupLimitModal() {
    const modal = document.getElementById('remove-group-limit-modal');
    if (modal) {
      modal.classList.add('hidden');
      this.pendingGroupLimitRemoval = null;
      console.log('✅ Modal de quitar límite de grupo ocultado');
    }
  }

  // Confirmar quitar límite de grupo
  async confirmRemoveGroupLimit() {
    if (this.pendingGroupLimitRemoval) {
      console.log('✅ Confirmado quitar límite de grupo:', this.pendingGroupLimitRemoval);
      this.hideRemoveGroupLimitModal();
      await this.removeGroupLimitWithoutConfirm(this.pendingGroupLimitRemoval);
    }
  }

  // === ADMIN FILE MANAGEMENT METHODS ===

  // Cargar todos los archivos del sistema (solo admin)
  async loadAllFiles() {
    console.log('🔍 Cargando todos los archivos del sistema (admin)...');
    if (!this.isAdmin) {
      console.log('⚠️ Usuario no es admin, saltando carga de archivos del sistema');
      return;
    }

    const loadingElement = document.getElementById('all-files-loading');
    const tableElement = document.getElementById('all-files-table');
    const emptyElement = document.getElementById('all-files-empty');
    const statsElement = document.getElementById('files-stats');

    if (loadingElement) loadingElement.classList.remove('hidden');
    if (tableElement) tableElement.classList.add('hidden');
    if (emptyElement) emptyElement.classList.add('hidden');
    if (statsElement) statsElement.classList.add('hidden');

    try {
      console.log('📡 Solicitando todos los archivos al servidor...');
      const response = await window.Http.get('/admin/files');
      console.log('📦 Respuesta de archivos admin:', response);

      if (response.success || Array.isArray(response) || response.data) {
        // Manejar diferentes estructuras de respuesta
        let files = [];
        if (response.success && response.data) {
          files = response.data;
        } else if (Array.isArray(response)) {
          files = response;
        } else if (response.data && Array.isArray(response.data)) {
          // Respuesta paginada de Laravel
          files = response.data;
        } else {
          console.error('❌ Estructura de respuesta no reconocida:', response);
          files = [];
        }

        console.log(`📊 ${files.length} archivos encontrados en el sistema`);

        this.renderAllFilesTable(files);
        this.renderFilesStats(files);

        if (files.length === 0) {
          if (emptyElement) emptyElement.classList.remove('hidden');
        } else {
          if (tableElement) tableElement.classList.remove('hidden');
          if (statsElement) statsElement.classList.remove('hidden');
        }
      } else {
        console.error('❌ Respuesta sin success flag:', response);
        if (emptyElement) emptyElement.classList.remove('hidden');
      }
    } catch (error) {
      console.error('❌ Error loading all files:', error);
      window.NotificationManager?.showError('Error de conexión al cargar archivos del sistema: ' + error.message);
      if (emptyElement) emptyElement.classList.remove('hidden');
    } finally {
      if (loadingElement) loadingElement.classList.add('hidden');
    }
  }

  // Renderizar tabla de todos los archivos
  renderAllFilesTable(files) {
    console.log('🔄 Renderizando tabla de todos los archivos...');
    const tbody = document.getElementById('all-files-tbody');
    if (!tbody) {
      console.error('❌ No se encontró el elemento all-files-tbody');
      return;
    }

    tbody.innerHTML = '';

    if (!Array.isArray(files)) {
      console.error('❌ files debe ser un array, recibido:', typeof files, files);
      files = [];
    }

    console.log(`📊 Renderizando ${files.length} archivos del sistema`);

    files.forEach((file, index) => {
      console.log(`📝 Procesando archivo ${index + 1}:`, file);

      if (!file.id || !file.original_name) {
        console.warn('⚠️ Archivo inválido (falta id o original_name):', file);
        return;
      }

      const row = document.createElement('tr');
      row.className = 'hover:bg-gray-50 transition-colors duration-200';

      const fileExtension = file.original_name.split('.').pop().toLowerCase();
      const fileIcon = this.getFileIcon(fileExtension);

      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <div class="flex-shrink-0 h-8 w-8">
              <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span class="text-xs font-medium text-blue-700">${file.user?.name?.charAt(0) || 'U'}</span>
              </div>
            </div>
            <div class="ml-3">
              <div class="text-sm font-medium text-gray-900">${file.user?.name || 'Usuario desconocido'}</div>
              <div class="text-sm text-gray-500">${file.user?.email || 'Sin email'}</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <i class="${fileIcon} text-lg mr-3"></i>
            <div class="text-sm font-medium text-gray-900">${file.original_name}</div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            ${fileExtension.toUpperCase()}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          ${this.formatBytes(file.size)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          ${this.formatDate(file.created_at)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button class="text-red-600 hover:text-red-900 transition-colors duration-200 mr-3"
                  onclick="window.dashboardManager.adminDeleteFile(${file.id}, '${file.original_name}', '${file.user?.name || 'Usuario'}')"
                  title="Eliminar archivo">
            <i class="fas fa-trash mr-1"></i>Eliminar
          </button>
          <button class="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                  onclick="window.dashboardManager.downloadFile(${file.id}, '${file.original_name}')"
                  title="Descargar archivo">
            <i class="fas fa-download mr-1"></i>Descargar
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });

    console.log('✅ Tabla de todos los archivos renderizada correctamente');
  }

  // Renderizar estadísticas de archivos
  renderFilesStats(files) {
    const totalFilesElement = document.getElementById('total-files-count');
    const totalStorageElement = document.getElementById('total-storage-used');
    const totalUsersElement = document.getElementById('total-users-with-files');

    if (!files || !Array.isArray(files)) {
      files = [];
    }

    // Calcular estadísticas
    const totalFiles = files.length;
    const totalStorage = files.reduce((sum, file) => sum + (file.size || 0), 0);
    const uniqueUsers = new Set(files.map(file => file.user?.id).filter(id => id)).size;

    // Actualizar elementos
    if (totalFilesElement) totalFilesElement.textContent = totalFiles.toLocaleString();
    if (totalStorageElement) totalStorageElement.textContent = this.formatBytes(totalStorage);
    if (totalUsersElement) totalUsersElement.textContent = uniqueUsers.toLocaleString();

    console.log('📊 Estadísticas actualizadas:', { totalFiles, totalStorage, uniqueUsers });
  }

  // Eliminar archivo como admin
  async adminDeleteFile(fileId, fileName, userName) {
    console.log('🗑️ Admin eliminando archivo:', { fileId, fileName, userName });

    const confirmMsg = `¿Estás seguro de que quieres eliminar el archivo "${fileName}" del usuario ${userName}?\n\nEsta acción no se puede deshacer.`;
    if (!(window.confirm ? confirm(confirmMsg) : true)) {
      console.log('❌ Eliminación cancelada por el administrador');
      return;
    }

    try {
      console.log('🔄 Enviando petición de eliminación admin...');
      const response = await window.Http.delete(`/admin/files/${fileId}`);
      console.log('📡 Respuesta del servidor:', response);

      if (response.success || response.message) {
        console.log('✅ Archivo eliminado exitosamente por admin');
        window.NotificationManager?.showSuccess(`Archivo "${fileName}" eliminado del sistema`) || alert(`Archivo "${fileName}" eliminado del sistema`);

        // Recargar la tabla de archivos
        await this.loadAllFiles();
      } else {
        console.log('❌ Error en respuesta:', response);
        const errorMsg = 'Error al eliminar archivo: ' + (response.error || response.message || 'Error desconocido');
        window.NotificationManager?.showError(errorMsg) || alert(errorMsg);
      }
    } catch (error) {
      console.error('❌ Error deleting file as admin:', error);
      const errorMsg = 'Error al eliminar archivo: ' + (error.message || 'Error de conexión');
      window.NotificationManager?.showError(errorMsg) || alert(errorMsg);
    }
  }

  // === FILE MANAGEMENT METHODS ===

  // Mostrar modal de confirmación para eliminar archivo
  showDeleteModal(fileId, fileName) {
    console.log('🗑️ Mostrando modal de eliminación para archivo:', { fileId, fileName });

    const modal = document.getElementById('delete-modal');
    const filenameSpan = document.getElementById('delete-filename');
    const confirmBtn = document.getElementById('confirm-delete');
    const cancelBtn = document.getElementById('cancel-delete');

    if (!modal || !filenameSpan || !confirmBtn || !cancelBtn) {
      console.error('❌ No se encontraron elementos del modal de archivos');
      // Fallback al confirm() tradicional
      const confirmMsg = `¿Estás seguro de que quieres eliminar el archivo "${fileName}"?`;
      if (confirm(confirmMsg)) {
        this.deleteFile(fileId, fileName);
      }
      return;
    }

    // Configurar el modal
    filenameSpan.textContent = fileName;

    // Limpiar event listeners anteriores
    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    // Agregar nuevos event listeners
    newConfirmBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      this.deleteFile(fileId, fileName);
    });

    newCancelBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    // Cerrar modal al hacer click fuera
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });

    // Mostrar el modal
    modal.classList.remove('hidden');
  }

  // Eliminar archivo
  async deleteFile(fileId, fileName) {
    console.log('🗑️ Eliminando archivo:', { fileId, fileName });

    try {
      console.log('🔄 Enviando petición de eliminación de archivo...');
      const response = await window.Http.delete(`/files/${fileId}`);
      console.log('📡 Respuesta del servidor:', response);

      if (response.success) {
        console.log('✅ Archivo eliminado exitosamente');
        window.NotificationManager?.showSuccess(`Archivo "${fileName}" eliminado correctamente`) || alert(`Archivo "${fileName}" eliminado correctamente`);

        // Recargar archivos y información de almacenamiento
        await this.loadFiles();
        await this.loadStorageInfo();
      } else {
        console.log('❌ Error en respuesta:', response);
        const errorMsg = 'Error al eliminar archivo: ' + (response.error || response.message || 'Error desconocido');
        window.NotificationManager?.showError(errorMsg) || alert(errorMsg);
      }
    } catch (error) {
      console.error('❌ Error deleting file:', error);
      const errorMsg = 'Error al eliminar archivo: ' + (error.message || 'Error de conexión');
      window.NotificationManager?.showError(errorMsg) || alert(errorMsg);
    }
  }

  // Descargar archivo
  async downloadFile(fileId, fileName) {
    console.log('📥 Descargando archivo:', { fileId, fileName });

    try {
      console.log('🔄 Iniciando descarga...');

      // Crear URL para descarga
      const token = localStorage.getItem('auth_token');
      const downloadUrl = `http://localhost:8000/api/files/${fileId}/download`;

      // Crear elemento temporal para descarga
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', fileName);

      // Agregar headers de autorización si es necesario
      if (token) {
        // Para descargas directas, podemos usar fetch y crear blob
        const response = await fetch(downloadUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          link.href = url;

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Limpiar URL del blob
          window.URL.revokeObjectURL(url);

          console.log('✅ Descarga iniciada exitosamente');
          window.NotificationManager?.showSuccess(`Descargando "${fileName}"...`) || console.log(`Descargando "${fileName}"...`);
        } else {
          throw new Error(`Error HTTP: ${response.status}`);
        }
      } else {
        // Sin token, descarga directa
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

    } catch (error) {
      console.error('❌ Error downloading file:', error);
      const errorMsg = 'Error al descargar archivo: ' + (error.message || 'Error de conexión');
      window.NotificationManager?.showError(errorMsg) || alert(errorMsg);
    }
  }

  // === UTILITY METHODS ===
  getFileIcon(extension) {
    const iconMap = {
      'pdf': 'fas fa-file-pdf text-red-600',
      'doc': 'fas fa-file-word text-blue-600',
      'docx': 'fas fa-file-word text-blue-600',
      'xls': 'fas fa-file-excel text-green-600',
      'xlsx': 'fas fa-file-excel text-green-600',
      'txt': 'fas fa-file-alt text-gray-600',
      'zip': 'fas fa-file-archive text-purple-600',
      'jpg': 'fas fa-file-image text-pink-600',
      'jpeg': 'fas fa-file-image text-pink-600',
      'png': 'fas fa-file-image text-pink-600'
    };
    return iconMap[extension] || 'fas fa-file text-gray-600';
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // === EVENT HANDLERS ===
  handleDragOver(e) {
    e.preventDefault();
    const dropZone = e.target.closest('#drop-zone');
    if (dropZone) {
      dropZone.classList.add('border-blue-400', 'bg-blue-50');
    }
  }

  handleDragLeave(e) {
    e.preventDefault();
    const dropZone = e.target.closest('#drop-zone');
    if (dropZone) {
      dropZone.classList.remove('border-blue-400', 'bg-blue-50');
    }
  }

  handleDrop(e) {
    e.preventDefault();
    const dropZone = e.target.closest('#drop-zone');
    if (dropZone) {
      dropZone.classList.remove('border-blue-400', 'bg-blue-50');
    }

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      this.uploadFile(files[0]);
    }
  }

  handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      this.uploadFile(file);
    }
  }

  async uploadFile(file) {
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      if (window.NotificationManager) {
        window.NotificationManager.showError('El archivo es demasiado grande. Máximo permitido: 50MB');
      } else {
        console.error('El archivo es demasiado grande. Máximo permitido: 50MB');
      }
      return;
    }

    const progressContainer = document.getElementById('upload-progress');
    const progressBar = document.getElementById('upload-bar');
    const progressText = document.getElementById('upload-percentage');

    if (progressContainer) progressContainer.classList.remove('hidden');
    if (progressBar) progressBar.style.width = '0%';
    if (progressText) progressText.textContent = '0%';

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Temporalmente usar fetch hasta que window.Http tenga uploadFile
      const token = localStorage.getItem('auth_token');
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          if (progressBar) progressBar.style.width = `${progress}%`;
          if (progressText) progressText.textContent = `${progress}%`;
        }
      });

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.addEventListener('load', () => {
          try {
            const response = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(response);
            } else {
              reject(new Error(response.message || 'Error en upload'));
            }
          } catch (e) {
            reject(new Error('Error parsing response'));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error')));
        xhr.open('POST', 'http://localhost:8000/api/files/upload');
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });

      const response = await uploadPromise;

      if (response.success) {
        if (window.NotificationManager) {
          window.NotificationManager.showSuccess('Archivo subido exitosamente');
        }
        await this.loadFiles();
        await this.loadStorageInfo();
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
      } else {
        if (window.NotificationManager) {
          window.NotificationManager.showError(response.message || 'Error al subir el archivo');
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      if (window.NotificationManager) {
        window.NotificationManager.showError(error.message || 'Error al subir el archivo');
      }
    } finally {
      if (progressContainer) progressContainer.classList.add('hidden');
    }
  }

  // Configurar UI basada en roles del usuario
  setupRoleBasedUI() {
    console.log('🔧 Configurando UI basada en roles...');

    if (!this.currentUser) {
      console.error('❌ No hay usuario para configurar UI');
      return;
    }

    const isAdmin = this.isAdmin; // Usar this.isAdmin en lugar de this.currentUser.is_admin
    console.log(`👤 Configurando UI para ${isAdmin ? 'administrador' : 'usuario regular'}`);
    console.log(`👤 Valor de this.isAdmin:`, this.isAdmin);
    console.log(`👤 Valor de this.currentUser:`, this.currentUser);

    // Mostrar/ocultar pestañas basadas en roles
    const adminTabs = ['groups', 'users', 'config'];

    adminTabs.forEach(tabId => {
      const tabElement = document.getElementById(`tab-${tabId}`);
      if (tabElement) {
        if (isAdmin) {
          tabElement.style.display = 'block';
          tabElement.classList.remove('hidden');
        } else {
          tabElement.style.display = 'none';
          tabElement.classList.add('hidden');
        }
      }
    });

    // Actualizar elementos de la interfaz
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(element => {
      if (isAdmin) {
        element.classList.remove('hidden');
      } else {
        element.classList.add('hidden');
      }
    });

    console.log('✅ UI configurada correctamente basada en roles');
  }

  // Función de prueba para verificar notificaciones
  testNotifications() {
    console.log('🧪 Probando sistema de notificaciones...');
    if (window.NotificationManager) {
      window.NotificationManager.showSuccess('¡Sistema de notificaciones funcionando!');
      console.log('✅ NotificationManager disponible y funcionando');
    } else {
      console.error('❌ NotificationManager no disponible');
      alert('Sistema de notificaciones no disponible');
    }
  }

  // Función de prueba para el guardado de límites de usuario
  testUserLimitSave() {
    console.log('🧪 Probando guardado de límites de usuario...');
    const testData = {
      userSelect: document.getElementById('user-select'),
      userLimitInput: document.getElementById('user-limit'),
      http: window.Http,
      notifications: window.NotificationManager
    };

    console.log('📊 Estado de elementos para prueba:', {
      userSelect: !!testData.userSelect,
      userLimitInput: !!testData.userLimitInput,
      http: !!testData.http,
      notifications: !!testData.notifications,
      userSelectOptions: testData.userSelect?.options?.length || 0
    });

    if (testData.notifications) {
      testData.notifications.showInfo('Elementos de límites de usuario verificados. Revisa la consola para detalles.');
    }
  }

  // Función de prueba para el guardado de límites de grupos
  testGroupLimitSave() {
    console.log('🧪 Probando guardado de límites de grupo...');
    const testData = {
      groupSelect: document.getElementById('group-select'),
      groupLimitInput: document.getElementById('group-limit'),
      http: window.Http,
      notifications: window.NotificationManager
    };

    console.log('📊 Estado de elementos para prueba de grupos:', {
      groupSelect: !!testData.groupSelect,
      groupLimitInput: !!testData.groupLimitInput,
      http: !!testData.http,
      notifications: !!testData.notifications,
      groupSelectOptions: testData.groupSelect?.options?.length || 0
    });

    if (testData.notifications) {
      testData.notifications.showInfo('Elementos de límites de grupo verificados. Revisa la consola para detalles.');
    }
  }

  // Función de prueba para cargar restricciones de archivo
  testRestrictionsLoad() {
    console.log('🧪 Probando carga de restricciones de archivo...');
    const testData = {
      restrictionsTable: document.getElementById('restrictions-table'),
      restrictionsTbody: document.getElementById('restrictions-tbody'),
      isAdmin: this.isAdmin,
      http: window.Http,
      notifications: window.NotificationManager
    };

    console.log('📊 Estado de elementos para restricciones:', {
      restrictionsTable: !!testData.restrictionsTable,
      restrictionsTbody: !!testData.restrictionsTbody,
      isAdmin: testData.isAdmin,
      http: !!testData.http,
      notifications: !!testData.notifications
    });

    if (testData.notifications) {
      testData.notifications.showInfo('Elementos de restricciones verificados. Revisa la consola para detalles.');
    }

    // Intentar cargar restricciones directamente
    this.loadRestrictions();
  }

  // Función de prueba para límite global por defecto
  testDefaultLimitSave() {
    console.log('🧪 Probando guardado de límite global por defecto...');
    const testData = {
      defaultLimitInput: document.getElementById('default-limit'),
      currentLimitElement: document.getElementById('current-default-limit'),
      updateButton: document.getElementById('update-default-limit'),
      http: window.Http,
      notifications: window.NotificationManager
    };

    console.log('📊 Estado de elementos para límite global:', {
      defaultLimitInput: !!testData.defaultLimitInput,
      currentLimitElement: !!testData.currentLimitElement,
      updateButton: !!testData.updateButton,
      http: !!testData.http,
      notifications: !!testData.notifications,
      currentLimitText: testData.currentLimitElement?.textContent || 'No disponible'
    });

    if (testData.notifications) {
      testData.notifications.showInfo('Elementos de límite global verificados. Revisa la consola para detalles.');
    }

    // Intentar cargar límite por defecto
    this.loadDefaultLimit();
  }

  // Función de prueba para el modal de agregar restricciones
  testAddRestrictionModal() {
    console.log('🧪 Probando modal de agregar restricciones...');
    const testData = {
      modal: document.getElementById('restriction-modal'),
      addBtn: document.getElementById('add-restriction-btn'),
      form: document.getElementById('restriction-form'),
      extensionInput: document.getElementById('extension-input'),
      statusSelect: document.getElementById('status-select'),
      descriptionInput: document.getElementById('description-input'),
      cancelBtn: document.getElementById('cancel-restriction'),
      http: window.Http,
      notifications: window.NotificationManager
    };

    console.log('📊 Estado de elementos para modal de restricciones:', {
      modal: !!testData.modal,
      addBtn: !!testData.addBtn,
      form: !!testData.form,
      extensionInput: !!testData.extensionInput,
      statusSelect: !!testData.statusSelect,
      descriptionInput: !!testData.descriptionInput,
      cancelBtn: !!testData.cancelBtn,
      http: !!testData.http,
      notifications: !!testData.notifications,
      modalVisible: testData.modal ? !testData.modal.classList.contains('hidden') : false,
      statusOptions: testData.statusSelect ? Array.from(testData.statusSelect.options).map(opt => ({ value: opt.value, text: opt.text })) : []
    });

    console.log('🔍 Verificando lógica de estado:');
    console.log('- Valor "0" = Permitido (is_prohibited: false)');
    console.log('- Valor "1" = Prohibido (is_prohibited: true)');

    if (testData.notifications) {
      testData.notifications.showInfo('Elementos del modal de restricciones verificados. Revisa la consola para detalles.');
    }

    // Probar abrir modal
    if (testData.addBtn) {
      console.log('🖱️ Simulando click en botón agregar restricción...');
      this.showAddRestrictionModal();
    }
  }

  // Función de prueba para verificar restricciones existentes
  testRestrictionsLogic() {
    console.log('🧪 Probando lógica de restricciones existentes...');

    if (this.currentUser && this.isAdmin) {
      console.log('✅ Usuario es admin, cargando restricciones para probar...');
      this.loadRestrictions().then(() => {
        console.log('📊 Restricciones cargadas para verificar lógica de prohibido/permitido');
      });
    } else {
      console.log('❌ Usuario no es admin, no puede probar restricciones');
    }
  }

  // Función de prueba para usuarios
  testUsersLoad() {
    console.log('🧪 Probando carga de usuarios...');

    if (!this.isAdmin) {
      console.log('❌ Usuario no es admin, no puede cargar usuarios');
      window.NotificationManager?.showWarning('Solo los administradores pueden gestionar usuarios');
      return;
    }

    console.log('✅ Usuario es admin, probando UserManager...');

    // Verificar que UserManager existe
    if (window.UserManager) {
      console.log('✅ UserManager disponible');

      // Probar funciones de debugging
      if (window.UserManager.debugUsersState) {
        window.UserManager.debugUsersState();
      }

      if (window.UserManager.testLoadUsers) {
        window.UserManager.testLoadUsers();
      }

    } else {
      console.error('❌ UserManager no disponible');
      window.NotificationManager?.showError('UserManager no está cargado');
    }
  }

  // Función para verificar el estado actual del límite global
  async verifyGlobalLimitStatus() {
    console.log('🔍 Verificando estado actual del límite global...');

    try {
      const response = await window.Http.get('/system-settings/default-storage-limit');

      if (response.success && response.data) {
        const info = {
          limitBytes: response.data.default_storage_limit,
          limitMB: response.data.default_storage_limit_mb,
          formattedLimit: response.data.formatted_limit
        };

        console.log('📊 Estado del límite global:', info);

        window.NotificationManager?.showInfo(
          `Límite global actual: ${info.formattedLimit} (${info.limitMB} MB)`
        );

        return info;
      } else {
        console.error('❌ Error al verificar límite global:', response);
        return null;
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      return null;
    }
  }

  // Función de prueba para límites de usuarios
  testUserLimitsConfig() {
    console.log('🧪 Probando configuración de límites de usuarios...');

    const elements = {
      userSelect: document.getElementById('user-select'),
      userLimitInput: document.getElementById('user-limit'),
      updateUserLimitBtn: document.getElementById('update-user-limit'),
      usersList: document.getElementById('users-list')
    };

    console.log('📊 Estado de elementos para límites de usuarios:', {
      userSelect: !!elements.userSelect,
      userSelectOptions: elements.userSelect?.options?.length || 0,
      userLimitInput: !!elements.userLimitInput,
      updateUserLimitBtn: !!elements.updateUserLimitBtn,
      usersList: !!elements.usersList,
      usersListContent: elements.usersList?.innerHTML?.length || 0
    });

    // Probar carga de usuarios para configuración
    console.log('🔄 Probando carga de usuarios para configuración...');
    this.loadUsersForConfig().then(() => {
      console.log('✅ Carga de usuarios para configuración completada');

      // Verificar que el select se pobló
      const userSelect = document.getElementById('user-select');
      if (userSelect && userSelect.options.length > 1) {
        console.log(`✅ Select de usuarios poblado con ${userSelect.options.length - 1} usuarios`);
      } else {
        console.error('❌ Select de usuarios vacío o no encontrado');
      }
    }).catch(error => {
      console.error('❌ Error en carga de usuarios para configuración:', error);
    });

    if (window.NotificationManager) {
      window.NotificationManager.showInfo('Prueba de límites de usuarios completada. Revisa la consola para detalles.');
    }
  }

  // Función de prueba para información de almacenamiento
  async testStorageInfo() {
    console.log('🧪 === PRUEBA DE INFORMACIÓN DE ALMACENAMIENTO ===');

    // Probar elementos del DOM
    const elements = {
      storageUsed: document.getElementById('storage-used'),
      storageBar: document.getElementById('storage-bar'),
      storagePercentage: document.getElementById('storage-percentage')
    };

    console.log('📊 Elementos de almacenamiento encontrados:', {
      storageUsed: !!elements.storageUsed,
      storageBar: !!elements.storageBar,
      storagePercentage: !!elements.storagePercentage
    });

    // Valores actuales
    console.log('📈 Valores actuales:', {
      storageUsedText: elements.storageUsed?.textContent,
      storageBarWidth: elements.storageBar?.style?.width,
      storagePercentageText: elements.storagePercentage?.textContent
    });

    // Probar carga de info de almacenamiento
    console.log('🔄 Probando carga de información de almacenamiento...');
    try {
      await this.loadStorageInfo();
      console.log('✅ loadStorageInfo() completada');
    } catch (error) {
      console.error('❌ Error en loadStorageInfo():', error);
    }

    // Probar endpoint directo
    console.log('📡 Probando endpoint /files/storage-info directamente...');
    try {
      const response = await window.Http.get('/files/storage-info');
      console.log('📦 Respuesta directa de storage-info:', response);
    } catch (error) {
      console.error('❌ Error al llamar endpoint storage-info:', error);
    }

    // Valores después de la prueba
    console.log('📊 Valores después de la prueba:', {
      storageUsedText: elements.storageUsed?.textContent,
      storageBarWidth: elements.storageBar?.style?.width,
      storagePercentageText: elements.storagePercentage?.textContent
    });

    if (window.NotificationManager) {
      window.NotificationManager.showInfo('Prueba de información de almacenamiento completada. Revisa la consola.');
    }
  }

  // Función de prueba para modales de quitar límites
  async testRemoveLimitModals() {
    console.log('🧪 === PRUEBA DE MODALES DE QUITAR LÍMITES ===');
    
    // Probar elementos del DOM
    const elements = {
      removeUserLimitModal: document.getElementById('remove-user-limit-modal'),
      confirmRemoveUserLimit: document.getElementById('confirm-remove-user-limit'),
      cancelRemoveUserLimit: document.getElementById('cancel-remove-user-limit'),
      userLimitName: document.getElementById('user-limit-name'),
      
      removeGroupLimitModal: document.getElementById('remove-group-limit-modal'),
      confirmRemoveGroupLimit: document.getElementById('confirm-remove-group-limit'),
      cancelRemoveGroupLimit: document.getElementById('cancel-remove-group-limit'),
      groupLimitName: document.getElementById('group-limit-name')
    };
    
    console.log('📊 Elementos de modales encontrados:', {
      removeUserLimitModal: !!elements.removeUserLimitModal,
      confirmRemoveUserLimit: !!elements.confirmRemoveUserLimit,
      cancelRemoveUserLimit: !!elements.cancelRemoveUserLimit,
      userLimitName: !!elements.userLimitName,
      removeGroupLimitModal: !!elements.removeGroupLimitModal,
      confirmRemoveGroupLimit: !!elements.confirmRemoveGroupLimit,
      cancelRemoveGroupLimit: !!elements.cancelRemoveGroupLimit,
      groupLimitName: !!elements.groupLimitName
    });
    
    // Probar mostrar modal de usuario
    console.log('🔄 Probando modal de quitar límite de usuario...');
    this.showRemoveUserLimitModal(1, 'Usuario de Prueba');
    
    setTimeout(() => {
      console.log('🔄 Ocultando modal de usuario...');
      this.hideRemoveUserLimitModal();
      
      // Probar modal de grupo
      console.log('🔄 Probando modal de quitar límite de grupo...');
      this.showRemoveGroupLimitModal(1, 'Grupo de Prueba');
      
      setTimeout(() => {
        console.log('🔄 Ocultando modal de grupo...');
        this.hideRemoveGroupLimitModal();
        
        if (window.NotificationManager) {
          window.NotificationManager.showInfo('Prueba de modales de quitar límites completada. Revisa la consola.');
        }
      }, 2000);
    }, 2000);
  }

  // Función de prueba para debuggear quitar límites
  async testRemoveLimits() {
    console.log('🧪 === PRUEBA DE QUITAR LÍMITES ===');
    
    // Probar endpoint directo para usuarios
    console.log('🔄 Probando endpoint /users/1/storage-limit directamente...');
    try {
      const userResponse = await window.Http.put('/users/1/storage-limit', {
        storage_limit: null
      });
      console.log('📦 Respuesta de usuario:', userResponse);
    } catch (error) {
      console.error('❌ Error al probar endpoint de usuario:', error);
    }
    
    // Probar endpoint directo para grupos  
    console.log('🔄 Probando endpoint /groups/1/storage-limit directamente...');
    try {
      const groupResponse = await window.Http.put('/groups/1/storage-limit', {
        storage_limit: null
      });
      console.log('📦 Respuesta de grupo:', groupResponse);
    } catch (error) {
      console.error('❌ Error al probar endpoint de grupo:', error);
    }
    
    if (window.NotificationManager) {
      window.NotificationManager.showInfo('Prueba de quitar límites completada. Revisa la consola.');
    }
  }
}

// Crear instancia global pero NO inicializar automáticamente
window.dashboardManager = new DashboardManager();

// Exportar la instancia para que main.js pueda controlar la inicialización
export { DashboardManager };
