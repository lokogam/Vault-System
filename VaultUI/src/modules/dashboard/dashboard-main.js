// dashboard-main.js - Gestor principal del dashboard simplificado

import { PageManager } from './page-manager.js';
import { FileManager } from './file-manager.js';
import { ConfigManager } from './config-manager.js';
import { RestrictionsManager } from './restrictions-manager.js';
import { AdminFileManager } from './admin-file-manager.js';

export { PageManager };

export class DashboardManager {
  constructor() {
    this.currentUser = null;
    this.isAdmin = false;
    this.initialized = false;

    // Inicializar managers
    console.log('🔧 Inicializando managers del dashboard...');
    this.fileManager = new FileManager();
    this.configManager = new ConfigManager();
    this.restrictionsManager = new RestrictionsManager();
    this.adminFileManager = new AdminFileManager();
    
    console.log('✅ Managers inicializados:', {
      fileManager: !!this.fileManager,
      configManager: !!this.configManager,
      restrictionsManager: !!this.restrictionsManager,
      adminFileManager: !!this.adminFileManager
    });
  }

  async init() {
    if (this.initialized) {
      console.log('⚠️ Dashboard ya inicializado');
      return;
    }

    console.log('🚀 INICIANDO DASHBOARD...');

    // Verificar token con múltiples métodos
    const token = localStorage.getItem('auth_token') || window.Storage?.getToken();
    const user = window.Storage?.getUser();
    
    console.log('🔍 Verificación de autenticación:', {
      token: !!token,
      user: !!user,
      tokenLength: token ? token.length : 0
    });

    if (!token) {
      console.log('❌ No hay token, redirigiendo al login');
      window.PageManager?.goToLogin();
      return;
    }

    try {
      await this.loadUserInfo();
      
      // Esperar un poco para asegurar que el HTML esté completamente cargado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.setupEventListeners();
      this.setupTabNavigation();
      this.setupRoleBasedUI();

      // Cargar datos iniciales
      this.showTab('files');
      
      this.initialized = true;
      console.log('✅ Dashboard inicializado correctamente');
    } catch (error) {
      console.error('❌ Error al inicializar dashboard:', error);
      localStorage.removeItem('auth_token');
      window.PageManager?.goToLogin();
    }
  }

  async loadUserInfo() {
    try {
      console.log('👤 Cargando información del usuario...');
      const userResponse = await window.Http.get('/user/me');
      console.log('📦 Respuesta del usuario:', userResponse);

      // Manejar diferentes estructuras de respuesta
      let userData = null;
      
      if (userResponse.success && userResponse.data) {
        // Estructura: {success: true, data: {user: {...}, roles: [...], ...}}
        if (userResponse.data.user) {
          userData = userResponse.data.user;
          // Agregar información de roles desde el nivel superior
          userData.roles = userResponse.data.roles;
          userData.permissions = userResponse.data.permissions;
          userData.role_names = userResponse.data.role_names;
          userData.is_admin = userResponse.data.is_admin;
        } else {
          // Estructura: {success: true, data: {id: 1, name: "...", ...}}
          userData = userResponse.data;
        }
      } else {
        // Estructura directa: {user: {...}} o {id: 1, name: "...", ...}
        userData = userResponse.user || userResponse;
      }
      
      if (userData && userData.id) {
        this.currentUser = userData;
        this.isAdmin = userData.is_admin || userData.roles?.some(role => role.name === 'Administrador') || false;

        console.log('✅ Usuario cargado:', {
          name: this.currentUser.name,
          email: this.currentUser.email,
          isAdmin: this.isAdmin,
          roles: this.currentUser.roles || []
        });

        // Actualizar UI con información del usuario
        const userNameElement = document.getElementById('user-name');
        const userEmailElement = document.getElementById('user-email');

        if (userNameElement) userNameElement.textContent = this.currentUser.name;
        if (userEmailElement) userEmailElement.textContent = this.currentUser.email;

        console.log('👤 Información de usuario actualizada en la UI');
      } else {
        console.error('❌ Datos de usuario inválidos:', userData);
        throw new Error('No se pudo cargar la información del usuario');
      }
    } catch (error) {
      console.error('❌ Error al cargar información del usuario:', error);
      throw error;
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

    if (fileInput) fileInput.addEventListener('change', this.fileManager.handleFileSelect.bind(this.fileManager));
    if (dropZone) {
      dropZone.addEventListener('dragover', this.fileManager.handleDragOver.bind(this.fileManager));
      dropZone.addEventListener('drop', this.fileManager.handleDrop.bind(this.fileManager));
      dropZone.addEventListener('dragleave', this.fileManager.handleDragLeave.bind(this.fileManager));
    }
    if (refreshFilesBtn) refreshFilesBtn.addEventListener('click', this.fileManager.loadFiles.bind(this.fileManager));

    // Configuration management event listeners
    this.setupConfigEventListeners();
  }

  setupConfigEventListeners() {
    // Botones de actualizar listas
    const refreshUsersBtn = document.getElementById('refresh-users');
    const refreshGroupsBtn = document.getElementById('refresh-groups');

    if (refreshUsersBtn) {
      refreshUsersBtn.addEventListener('click', () => this.configManager.loadUsersForConfig());
    }
    if (refreshGroupsBtn) {
      refreshGroupsBtn.addEventListener('click', () => this.configManager.loadGroupsForConfig());
    }

    // Botones de actualizar límites
    const updateUserLimitBtn = document.getElementById('update-user-limit');
    const updateGroupLimitBtn = document.getElementById('update-group-limit');
    const updateDefaultLimitBtn = document.getElementById('update-default-limit');

    if (updateUserLimitBtn) {
      updateUserLimitBtn.addEventListener('click', () => this.configManager.updateUserLimit());
    }
    if (updateGroupLimitBtn) {
      updateGroupLimitBtn.addEventListener('click', () => this.configManager.updateGroupLimit());
    }
    if (updateDefaultLimitBtn) {
      updateDefaultLimitBtn.addEventListener('click', () => this.configManager.updateDefaultLimit());
    }

    // Botón para agregar restricción
    const addRestrictionBtn = document.getElementById('add-restriction-btn');
    if (addRestrictionBtn) {
      addRestrictionBtn.addEventListener('click', () => this.restrictionsManager.showAddRestrictionModal());
    }

    // Botón para refrescar todos los archivos (admin)
    const refreshAllFilesBtn = document.getElementById('refresh-all-files');
    if (refreshAllFilesBtn) {
      refreshAllFilesBtn.addEventListener('click', () => this.adminFileManager.loadAllFiles());
    }

    // Event listeners para el modal de restricciones
    this.restrictionsManager.setupRestrictionModalListeners();

    // Event listeners para modales de quitar límites
    this.setupRemoveLimitModalListeners();
  }

  setupRemoveLimitModalListeners() {
    // Modal de quitar límite de usuario
    const confirmRemoveUserLimitBtn = document.getElementById('confirm-remove-user-limit');
    const cancelRemoveUserLimitBtn = document.getElementById('cancel-remove-user-limit');

    if (confirmRemoveUserLimitBtn) {
      confirmRemoveUserLimitBtn.addEventListener('click', () => this.configManager.confirmRemoveUserLimit());
    }
    if (cancelRemoveUserLimitBtn) {
      cancelRemoveUserLimitBtn.addEventListener('click', () => this.configManager.hideRemoveUserLimitModal());
    }

    // Modal de quitar límite de grupo
    const confirmRemoveGroupLimitBtn = document.getElementById('confirm-remove-group-limit');
    const cancelRemoveGroupLimitBtn = document.getElementById('cancel-remove-group-limit');

    if (confirmRemoveGroupLimitBtn) {
      confirmRemoveGroupLimitBtn.addEventListener('click', () => this.configManager.confirmRemoveGroupLimit());
    }
    if (cancelRemoveGroupLimitBtn) {
      cancelRemoveGroupLimitBtn.addEventListener('click', () => this.configManager.hideRemoveGroupLimitModal());
    }
  }

  setupTabNavigation() {
    console.log('🔧 Configurando navegación de pestañas...');
    
    // Verificar que los elementos necesarios existan
    const dashboardNavigation = document.getElementById('dashboard-navigation');
    const dashboardContainer = document.getElementById('dashboard-container');
    
    console.log('🔍 Verificando elementos del DOM:', {
      dashboardNavigation: !!dashboardNavigation,
      dashboardContainer: !!dashboardContainer,
      dashboardNavigationContent: dashboardNavigation ? dashboardNavigation.innerHTML.length : 0
    });
    
    const tabs = document.querySelectorAll('.dashboard-tab');
    console.log(`📋 Encontradas ${tabs.length} pestañas`);
    
    if (tabs.length === 0) {
      console.error('❌ No se encontraron pestañas del dashboard. Los componentes HTML pueden no estar cargados.');
      console.log('🔍 Reintentando en 500ms...');
      setTimeout(() => {
        this.setupTabNavigation();
      }, 500);
      return;
    }
    
    // Debug: Mostrar todas las pestañas encontradas
    tabs.forEach((tab, index) => {
      console.log(`📋 Pestaña ${index + 1}:`, {
        id: tab.id,
        dataTab: tab.getAttribute('data-tab'),
        classes: tab.className,
        text: tab.textContent.trim()
      });
    });

    tabs.forEach(tab => {
      // Limpiar listeners anteriores
      tab.removeEventListener('click', tab._dashboardClickHandler);
      
      // Crear nuevo listener
      tab._dashboardClickHandler = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Extraer ID de la pestaña - compatible con ambos formatos
        let tabId = tab.getAttribute('data-tab') || tab.id.replace('tab-', '');
        
        console.log(`🖱️ Click en pestaña: ${tabId}`, {
          tabElement: tab,
          tabId: tabId,
          dataTab: tab.getAttribute('data-tab'),
          id: tab.id
        });

        if (tabId) {
          await this.showTab(tabId);
        }
      };
      
      tab.addEventListener('click', tab._dashboardClickHandler);
      console.log(`✅ Listener agregado a pestaña: ${tab.id || 'sin-id'}`);
    });
  }

  async showTab(tabId) {
    console.log(`📱 Cambiando a pestaña: ${tabId}`);

    // Actualizar pestañas activas - compatible con ambos formatos
    const tabs = document.querySelectorAll('.dashboard-tab');
    tabs.forEach(tab => {
      // Extraer ID de la pestaña - compatible con ambos formatos
      const currentTabId = tab.getAttribute('data-tab') || tab.id.replace('tab-', '');
      
      if (currentTabId === tabId) {
        // Estilos activos - usando las mismas clases del archivo original
        tab.classList.add('border-indigo-500', 'text-indigo-600');
        tab.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700');
        // Mantener compatibilidad con estilos nuevos si existen
        tab.classList.add('bg-blue-50', 'text-blue-700', 'border-blue-500');
        tab.classList.remove('text-gray-500', 'hover:text-gray-700');
      } else {
        // Estilos inactivos
        tab.classList.remove('border-indigo-500', 'text-indigo-600', 'bg-blue-50', 'text-blue-700', 'border-blue-500');
        tab.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700');
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
        await this.fileManager.loadFiles();
        await this.loadStorageInfo();
        break;
      case 'admin-files':
        console.log('📂 Cargando gestión de archivos del sistema...');
        if (this.isAdmin) {
          console.log('✅ Usuario admin, cargando todos los archivos...');
          await this.adminFileManager.loadAllFiles();
        } else {
          console.warn('Usuario no es admin, no puede ver archivos del sistema');
        }
        break;
      case 'groups':
        console.log('👥 Cargando grupos...');
        if (this.isAdmin && window.GroupManager) {
          console.log('✅ GroupManager disponible, cargando grupos...');
          await window.GroupManager.loadGroups();
        } else if (this.isAdmin) {
          console.log('⚠️ GroupManager no disponible, usando loadGroups interno...');
          await this.loadGroups();
        } else {
          console.warn('Usuario no es admin, no puede ver grupos');
        }
        break;
      case 'users':
        console.log('👤 Cargando usuarios...');
        if (this.isAdmin && window.UserManager) {
          console.log('✅ UserManager disponible, cargando usuarios...');
          await window.UserManager.loadUsers();
        } else if (this.isAdmin) {
          console.log('⚠️ UserManager no disponible, usando loadUsers interno...');
          await this.loadUsers();
        } else {
          console.warn('Usuario no es admin, no puede ver usuarios');
        }
        break;
      case 'config':
        console.log('⚙️ Cargando configuración...');
        if (this.isAdmin) {
          console.log('📋 Iniciando carga de configuración completa...');
          console.log('🔍 Estado de managers:', {
            configManager: !!this.configManager,
            restrictionsManager: !!this.restrictionsManager
          });
          
          try {
            console.log('1️⃣ Cargando usuarios para configuración...');
            await this.configManager.loadUsersForConfig();
            
            console.log('2️⃣ Cargando grupos para configuración...');
            await this.configManager.loadGroupsForConfig();
            
            console.log('3️⃣ Cargando límite por defecto...');
            await this.configManager.loadDefaultLimit();
            
            console.log('4️⃣ Cargando restricciones...');
            await this.restrictionsManager.loadRestrictions();
            
            console.log('✅ Configuración cargada completamente');
          } catch (error) {
            console.error('❌ Error cargando configuración:', error);
            window.NotificationManager?.showError('Error al cargar configuración: ' + error.message);
          }
        } else {
          console.warn('Usuario no es admin, no puede ver configuración');
        }
        break;
      default:
        console.log(`🤷 Pestaña sin datos específicos: ${tabId}`);
    }
  }

  async logout() {
    console.log('🚪 Iniciando proceso de logout...');

    try {
      // Intentar hacer logout en el servidor
      try {
        await window.Http.post('/auth/logout');
        console.log('✅ Logout exitoso en el servidor');
      } catch (error) {
        console.log('⚠️ Error en logout del servidor (continuando):', error.message);
      }

      // Limpiar datos locales
      localStorage.removeItem('auth_token');
      
      // Limpiar estado del dashboard
      this.currentUser = null;
      this.isAdmin = false;
      this.initialized = false;

      console.log('🧹 Datos locales limpiados');

      // Mostrar notificación
      if (window.NotificationManager) {
        window.NotificationManager.showSuccess('Has cerrado sesión correctamente');
      }

      // Redirigir al login
      setTimeout(() => {
        window.PageManager?.goToLogin();
      }, 1000);

    } catch (error) {
      console.error('❌ Error durante logout:', error);
      // Forzar logout local aunque falle el servidor
      localStorage.removeItem('auth_token');
      window.PageManager?.goToLogin();
    }
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

        this.updateStorageDisplay(storageInfo);
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
      console.log('GroupManager no disponible - cargando grupos con método interno');
      try {
        const response = await window.Http.get('/groups');
        console.log('📦 Respuesta de grupos (interno):', response);
        
        // Mostrar mensaje básico si no hay GroupManager
        const groupsContent = document.getElementById('groups-content');
        if (groupsContent) {
          groupsContent.innerHTML = `
            <div class="px-4 py-6">
              <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div class="flex">
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-yellow-800">
                      Módulo de Grupos No Disponible
                    </h3>
                    <div class="mt-2 text-sm text-yellow-700">
                      <p>El administrador de grupos no está cargado. Actualiza la página para cargar todos los módulos.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
        }
      } catch (error) {
        console.error('Error cargando grupos:', error);
      }
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
      console.log('UserManager no disponible - cargando usuarios con método interno');
      try {
        const response = await window.Http.get('/users');
        console.log('📦 Respuesta de usuarios (interno):', response);
        
        // Mostrar mensaje básico si no hay UserManager
        const usersContent = document.getElementById('users-content');
        if (usersContent) {
          usersContent.innerHTML = `
            <div class="px-4 py-6">
              <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div class="flex">
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-yellow-800">
                      Módulo de Usuarios No Disponible
                    </h3>
                    <div class="mt-2 text-sm text-yellow-700">
                      <p>El administrador de usuarios no está cargado. Actualiza la página para cargar todos los módulos.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
        }
      } catch (error) {
        console.error('Error cargando usuarios:', error);
      }
    }
  }

  // Configurar UI basada en roles del usuario
  setupRoleBasedUI() {
    console.log('🔧 Configurando UI basada en roles...');

    const adminTabs = document.querySelectorAll('[data-admin-only]');
    const adminElements = document.querySelectorAll('.admin-only');

    if (this.isAdmin) {
      console.log('👑 Usuario es administrador - mostrando elementos admin');
      adminTabs.forEach(tab => tab.style.display = 'block');
      adminElements.forEach(el => el.classList.remove('hidden'));
    } else {
      console.log('👤 Usuario normal - ocultando elementos admin');
      adminTabs.forEach(tab => tab.style.display = 'none');
      adminElements.forEach(el => el.classList.add('hidden'));
    }

    console.log('✅ UI configurada según rol de usuario');
  }
}

// Crear instancia global pero NO inicializar automáticamente
window.dashboardManager = new DashboardManager();

// Hacer disponibles los managers
window.fileManager = window.dashboardManager.fileManager;
window.configManager = window.dashboardManager.configManager;
window.restrictionsManager = window.dashboardManager.restrictionsManager;
window.adminFileManager = window.dashboardManager.adminFileManager;