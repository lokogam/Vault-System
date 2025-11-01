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
    this.fileManager = new FileManager();
    this.configManager = new ConfigManager();
    this.restrictionsManager = new RestrictionsManager();
    this.adminFileManager = new AdminFileManager();
    

  }

  async init() {
    if (this.initialized) {
      return;
    }


    // Verificar token con múltiples métodos
    const token = localStorage.getItem('auth_token') || window.Storage?.getToken();
    const user = window.Storage?.getUser();
    
    if (!token) {
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
    } catch (error) {
      console.error('❌ Error al inicializar dashboard:', error);
      localStorage.removeItem('auth_token');
      window.PageManager?.goToLogin();
    }
  }

  async loadUserInfo() {
    try {
      const userResponse = await window.Http.get('/user/me');

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

        // Actualizar UI con información del usuario
        const userNameElement = document.getElementById('user-name');
        const userEmailElement = document.getElementById('user-email');

        if (userNameElement) userNameElement.textContent = this.currentUser.name;
        if (userEmailElement) userEmailElement.textContent = this.currentUser.email;

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
    
    // Verificar que los elementos necesarios existan
    const dashboardNavigation = document.getElementById('dashboard-navigation');
    const dashboardContainer = document.getElementById('dashboard-container');

    
    const tabs = document.querySelectorAll('.dashboard-tab');
    
    if (tabs.length === 0) {
      console.error('❌ No se encontraron pestañas del dashboard. Los componentes HTML pueden no estar cargados.');
      setTimeout(() => {
        this.setupTabNavigation();
      }, 500);
      return;
    }
    


    tabs.forEach(tab => {
      // Limpiar listeners anteriores
      tab.removeEventListener('click', tab._dashboardClickHandler);
      
      // Crear nuevo listener
      tab._dashboardClickHandler = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Extraer ID de la pestaña - compatible con ambos formatos
        let tabId = tab.getAttribute('data-tab') || tab.id.replace('tab-', '');

        if (tabId) {
          await this.showTab(tabId);
        }
      };
      
      tab.addEventListener('click', tab._dashboardClickHandler);
    });
  }

  async showTab(tabId) {

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
    } else {
      console.error(`❌ No se encontró el contenido: ${tabId}-content`);
    }

    // Cargar datos específicos de la pestaña
    switch (tabId) {
      case 'files':
        await this.fileManager.loadFiles();
        await this.loadStorageInfo();
        break;
      case 'admin-files':
        if (this.isAdmin) {
          await this.adminFileManager.loadAllFiles();
        } 
        break;
      case 'groups':
        if (this.isAdmin && window.GroupManager) {
          await window.GroupManager.loadGroups();
        } else if (this.isAdmin) {
          await this.loadGroups();
        } 
        break;
      case 'users':
        if (this.isAdmin && window.UserManager) {
          await window.UserManager.loadUsers();
        } else if (this.isAdmin) {
          await this.loadUsers();
        } 
        break;
      case 'config':
        if (this.isAdmin) {
          
          try {
            await this.configManager.loadUsersForConfig();
            
            await this.configManager.loadGroupsForConfig();
            
            await this.configManager.loadDefaultLimit();
            
            await this.restrictionsManager.loadRestrictions();
            
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

    try {
      // Intentar hacer logout en el servidor
      try {
        await window.Http.post('/auth/logout');
      } catch (error) {
        console.log('⚠️ Error en logout del servidor (continuando):', error.message);
      }

      // Limpiar datos locales
      localStorage.removeItem('auth_token');
      
      // Limpiar estado del dashboard
      this.currentUser = null;
      this.isAdmin = false;
      this.initialized = false;


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
    try {
      const response = await window.Http.get('/files/storage-info');

      if (response && (response.storage_info || response.data)) {
        // Manejar diferentes estructuras de respuesta
        const storageInfo = response.storage_info || response.data;

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
    
    const usedElement = document.getElementById('storage-used');
    const barElement = document.getElementById('storage-bar');
    const percentageElement = document.getElementById('storage-percentage');

    if (usedElement && storageInfo.formatted_used && storageInfo.formatted_limit) {
      usedElement.textContent = `${storageInfo.formatted_used} / ${storageInfo.formatted_limit}`;
    }
    
    if (barElement && storageInfo.percentage !== undefined) {
      barElement.style.width = `${storageInfo.percentage}%`;
    }
    
    if (percentageElement && storageInfo.percentage !== undefined) {
      percentageElement.textContent = `${storageInfo.percentage}% utilizado`;
    }
  }

  // === GROUPS MANAGEMENT (ADMIN) ===
  async loadGroups() {
    if (!this.isAdmin) return;

    // Usar el GroupManager existente
    if (window.GroupManager && window.GroupManager.loadGroups) {
      await window.GroupManager.loadGroups();
    } else {
      try {
        const response = await window.Http.get('/groups');
        
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
    if (!this.isAdmin) return;

    // Usar el UserManager existente
    if (window.UserManager && window.UserManager.loadUsers) {
      await window.UserManager.loadUsers();
    } else {
      try {
        const response = await window.Http.get('/users');
        
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

    const adminTabs = document.querySelectorAll('[data-admin-only]');
    const adminElements = document.querySelectorAll('.admin-only');

    if (this.isAdmin) {
      adminTabs.forEach(tab => tab.style.display = 'block');
      adminElements.forEach(el => el.classList.remove('hidden'));
    } else {
      adminTabs.forEach(tab => tab.style.display = 'none');
      adminElements.forEach(el => el.classList.add('hidden'));
    }

  }
}

// Crear instancia global pero NO inicializar automáticamente
window.dashboardManager = new DashboardManager();

// Hacer disponibles los managers
window.fileManager = window.dashboardManager.fileManager;
window.configManager = window.dashboardManager.configManager;
window.restrictionsManager = window.dashboardManager.restrictionsManager;
window.adminFileManager = window.dashboardManager.adminFileManager;