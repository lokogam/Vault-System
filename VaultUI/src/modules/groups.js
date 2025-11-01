// groups.js - Módulo de gestión de grupos

export const GroupManager = {
  currentEditingGroup: null,
  groups: [], // Almacenar grupos cargados
  initialized: false,

  // Función para inicializar el módulo
  async init() {
    if (!this.initialized) {
      await this.loadGroups();
      this.initialized = true;
    }
  },

  async loadGroups() {
    const loadingDiv = document.getElementById('groups-loading');
    const tableContainer = document.getElementById('groups-table-container');
    const noGroupsDiv = document.getElementById('no-groups');
    
    // Mostrar loading
    loadingDiv.classList.remove('hidden');
    tableContainer.classList.add('hidden');
    noGroupsDiv.classList.add('hidden');

    const response = await window.Http.get('/groups', window.PreloaderMessages.LOADING_GROUPS);
    
    if (response.success) {
      // Usar la estructura mejorada o fallback a la original
      const groups = response.data.groups || response.data.data || response.data;
      this.groups = groups; // Almacenar grupos en el objeto
      this.renderGroupsTable(groups);
      
      if (groups.length === 0) {
        tableContainer.classList.add('hidden');
        noGroupsDiv.classList.remove('hidden');
      } else {
        tableContainer.classList.remove('hidden');
        noGroupsDiv.classList.add('hidden');
      }
    } else {
      console.error('Error cargando grupos:', response.error);
      tableContainer.classList.add('hidden');
      noGroupsDiv.classList.remove('hidden');
    }
    
    loadingDiv.classList.add('hidden');
  },

  renderGroupsTable(groups) {
    const tbody = document.getElementById('groups-tbody');
    
    if (groups.length === 0) {
      tbody.innerHTML = '';
      return;
    }

    tbody.innerHTML = groups.map(group => `
      <tr>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${group.id}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${group.name}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${group.description || 'Sin descripción'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${group.users ? group.users.length : 0} usuarios</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
          <button data-group-id="${group.id}" class="manage-users-btn text-green-600 hover:text-green-900">Gestionar Usuarios</button>
          <button data-group-id="${group.id}" class="edit-group-btn text-indigo-600 hover:text-indigo-900">Editar</button>
          <button data-group-id="${group.id}" class="delete-group-btn text-red-600 hover:text-red-900">Eliminar</button>
        </td>
      </tr>
    `).join('');

    // Agregar event listeners a los botones
    this.attachGroupButtonListeners();
  },

  attachGroupButtonListeners() {
    // Event listeners para botones de gestionar usuarios
    document.querySelectorAll('.manage-users-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const groupId = e.target.getAttribute('data-group-id');
        
        if (!groupId) {
          window.NotificationManager.showError('Error: ID de grupo no válido');
          return;
        }
        
        this.openManageUsersModal(parseInt(groupId));
      });
    });

    // Event listeners para botones de editar
    document.querySelectorAll('.edit-group-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const groupId = e.target.getAttribute('data-group-id');
        this.editGroup(parseInt(groupId));
      });
    });

    // Event listeners para botones de eliminar
    document.querySelectorAll('.delete-group-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const groupId = e.target.getAttribute('data-group-id');
        this.deleteGroup(parseInt(groupId));
      });
    });
  },

  openCreateModal() {
    this.currentEditingGroup = null;
    document.getElementById('modal-title').textContent = 'Crear Grupo';
    document.getElementById('group-name').value = '';
    document.getElementById('group-description').value = '';
    document.getElementById('group-error').classList.add('hidden');
    document.getElementById('group-modal').classList.remove('hidden');
  },

  async editGroup(groupId) {
    const response = await window.Http.get(`/groups/${groupId}`);
    
    if (response.success) {
      this.currentEditingGroup = response.data;
      document.getElementById('modal-title').textContent = 'Editar Grupo';
      document.getElementById('group-name').value = response.data.name;
      document.getElementById('group-description').value = response.data.description || '';
      document.getElementById('group-error').classList.add('hidden');
      document.getElementById('group-modal').classList.remove('hidden');
    } else {
      alert('Error al cargar el grupo: ' + response.error);
    }
  },

  async saveGroup(formData) {
    const errorDiv = document.getElementById('group-error');
    errorDiv.classList.add('hidden');

    let response;
    
    if (this.currentEditingGroup) {
      // Editar grupo existente
      response = await window.Http.request(`/groups/${this.currentEditingGroup.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      }, window.PreloaderMessages.UPDATING_GROUP);
    } else {
      // Crear nuevo grupo
      response = await window.Http.post('/groups', formData, window.PreloaderMessages.CREATING_GROUP);
    }

    if (response.success) {
      this.closeModal();
      this.loadGroups(); // Recargar la tabla
      return { success: true };
    } else {
      errorDiv.textContent = response.error;
      errorDiv.classList.remove('hidden');
      return { success: false, error: response.error };
    }
  },

  async deleteGroup(groupId) {
    // Encontrar el nombre del grupo
    const groupRow = document.querySelector(`button[data-group-id="${groupId}"]`).closest('tr');
    const groupName = groupRow.children[1].textContent; // Nombre está en la segunda columna

    // Mostrar modal de confirmación
    const confirmed = await window.ModalManager.confirmDelete(groupName, 'grupo');
    
    if (!confirmed) {
      return; // Usuario canceló
    }

    const response = await window.Http.request(`/groups/${groupId}`, {
      method: 'DELETE'
    }, window.PreloaderMessages.DELETING_GROUP);

    if (response.success) {
      this.loadGroups(); // Recargar la tabla
      // Opcional: mostrar mensaje de éxito
      // await window.ModalManager.showAlert({
      //   title: 'Éxito',
      //   message: `El grupo "${groupName}" ha sido eliminado correctamente.`,
      //   type: 'info'
      // });
    } else {
      await window.ModalManager.showAlert({
        title: 'Error',
        message: 'Error al eliminar el grupo: ' + response.error,
        type: 'danger'
      });
    }
  },

  closeModal() {
    document.getElementById('group-modal').classList.add('hidden');
    this.currentEditingGroup = null;
  },

  setupEventListeners() {
    // Botón crear grupo
    const createBtn = document.getElementById('create-group-btn');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        this.openCreateModal();
      });
    }

    // Botón cancelar modal
    const cancelBtn = document.getElementById('cancel-group-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.closeModal();
      });
    }

    // Formulario de grupo
    const form = document.getElementById('group-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = document.getElementById('save-group-btn');
        const originalText = submitBtn.textContent;
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';
        
        const formData = {
          name: document.getElementById('group-name').value,
          description: document.getElementById('group-description').value
        };
        
        await this.saveGroup(formData);
        
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      });
    }

    // Cerrar modal al hacer click fuera
    const modal = document.getElementById('group-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target.id === 'group-modal') {
          this.closeModal();
        }
      });
    }

    // Event listeners para gestión de usuarios
    const manageUsersModal = document.getElementById('manage-group-users-modal');
    if (manageUsersModal) {
      // Cerrar modal
      document.getElementById('close-manage-users-modal')?.addEventListener('click', () => {
        this.closeManageUsersModal();
      });

      document.getElementById('cancel-manage-users')?.addEventListener('click', () => {
        this.closeManageUsersModal();
      });

      // Asignar usuarios
      document.getElementById('assign-selected-users')?.addEventListener('click', () => {
        this.assignSelectedUsers();
      });

      // Remover usuarios
      document.getElementById('remove-selected-users')?.addEventListener('click', () => {
        this.removeSelectedUsers();
      });

      // Búsqueda de usuarios
      document.getElementById('search-available-users')?.addEventListener('input', (e) => {
        this.filterUsers('available', e.target.value);
      });

      document.getElementById('search-group-users')?.addEventListener('input', (e) => {
        this.filterUsers('group', e.target.value);
      });

      // Cerrar modal al hacer click fuera
      manageUsersModal.addEventListener('click', (e) => {
        if (e.target.id === 'manage-group-users-modal') {
          this.closeManageUsersModal();
        }
      });
    }
  },

  // Funciones para gestionar usuarios en grupos
  currentGroupId: null,
  availableUsers: [],
  groupUsers: [],

  async openManageUsersModal(groupId) {
    this.currentGroupId = groupId;
    
    // Validar que los grupos estén cargados
    if (!this.groups || this.groups.length === 0) {
      window.NotificationManager.showError('Error: Los grupos no están cargados. Intente recargar la página.');
      return;
    }
    
    const group = this.groups.find(g => g.id == groupId); // Usar == para comparación flexible
    
    if (!group) {
      window.NotificationManager.showError('Error: Grupo no encontrado.');
      return;
    }
    
    // Mostrar modal inmediatamente
    document.getElementById('manage-users-title').textContent = `Gestionar Usuarios - ${group.name}`;
    document.getElementById('manage-group-users-modal').classList.remove('hidden');
    
    // Mostrar loading overlay
    this.showManageUsersLoading(true);
    
    // Cargar datos
    await this.loadUsersForManagement();
    
    // Ocultar loading overlay
    this.showManageUsersLoading(false);
  },

  async loadUsersForManagement() {
    try {
      // Mostrar loading en ambas listas
      this.showListLoading('available', true);
      this.showListLoading('group', true);
      
      // Limpiar listas primero
      document.getElementById('available-users-list').innerHTML = '';
      document.getElementById('group-users-list').innerHTML = '';

      // Cargar todos los usuarios
      const usersResponse = await window.Http.get('/users');
      if (usersResponse.success) {
        this.availableUsers = usersResponse.data.users || [];
      }

      // Cargar usuarios del grupo actual
      const groupResponse = await window.Http.get(`/groups/${this.currentGroupId}`);
      if (groupResponse.success) {
        this.groupUsers = groupResponse.data.users || [];
      }

      // Ocultar loading y renderizar listas
      this.showListLoading('available', false);
      this.showListLoading('group', false);
      this.renderUsersLists();
    } catch (error) {
      console.error('Error loading users for management:', error);
      window.NotificationManager.showError('Error al cargar usuarios');
      // Ocultar loading en caso de error
      this.showListLoading('available', false);
      this.showListLoading('group', false);
    }
  },

  showManageUsersLoading(show) {
    const loadingOverlay = document.getElementById('manage-users-loading');
    const content = document.getElementById('manage-users-content');
    
    if (loadingOverlay && content) {
      if (show) {
        loadingOverlay.classList.remove('hidden');
        content.style.opacity = '0.3';
      } else {
        loadingOverlay.classList.add('hidden');
        content.style.opacity = '1';
      }
    }
  },

  showListLoading(type, show) {
    const loadingElement = document.getElementById(`${type}-users-loading`);
    if (loadingElement) {
      if (show) {
        loadingElement.classList.remove('hidden');
      } else {
        loadingElement.classList.add('hidden');
      }
    }
  },

  renderUsersLists() {
    this.renderAvailableUsers();
    this.renderGroupUsers();
  },

  renderAvailableUsers() {
    const container = document.getElementById('available-users-list');
    const groupUserIds = this.groupUsers.map(u => u.id);
    const available = this.availableUsers.filter(u => !groupUserIds.includes(u.id));
    
    container.innerHTML = available.map(user => `
      <div class="flex items-center p-2 hover:bg-gray-50 rounded">
        <input type="checkbox" id="available-${user.id}" value="${user.id}" 
               class="available-user-checkbox mr-3">
        <label for="available-${user.id}" class="flex-1 text-sm cursor-pointer">
          <div class="font-medium">${user.name}</div>
          <div class="text-gray-500 text-xs">${user.email}</div>
        </label>
      </div>
    `).join('');
  },

  renderGroupUsers() {
    const container = document.getElementById('group-users-list');
    
    container.innerHTML = this.groupUsers.map(user => `
      <div class="flex items-center p-2 hover:bg-gray-50 rounded">
        <input type="checkbox" id="group-${user.id}" value="${user.id}" 
               class="group-user-checkbox mr-3">
        <label for="group-${user.id}" class="flex-1 text-sm cursor-pointer">
          <div class="font-medium">${user.name}</div>
          <div class="text-gray-500 text-xs">${user.email}</div>
        </label>
      </div>
    `).join('');
  },

  async assignSelectedUsers() {
    const selectedUsers = Array.from(document.querySelectorAll('.available-user-checkbox:checked'))
      .map(checkbox => parseInt(checkbox.value));
    
    if (selectedUsers.length === 0) {
      window.NotificationManager.showWarning('Seleccione al menos un usuario para asignar');
      return;
    }

    try {
      // Mostrar loading durante la operación
      this.showListLoading('available', true);
      this.showListLoading('group', true);

      const response = await window.Http.post(`/groups/${this.currentGroupId}/assign-users`, {
        user_ids: selectedUsers
      }, {
        title: 'Asignando Usuarios',
        message: 'Asignando usuarios al grupo...'
      });

      if (response.success) {
        window.NotificationManager.showSuccess(`${selectedUsers.length} usuario(s) asignado(s) exitosamente`);
        await this.loadUsersForManagement();
        this.loadGroups(); // Actualizar tabla principal
      } else {
        window.NotificationManager.showError('Error: ' + response.error);
        this.showListLoading('available', false);
        this.showListLoading('group', false);
      }
    } catch (error) {
      console.error('Error assigning users:', error);
      window.NotificationManager.showError('Error al asignar usuarios');
      this.showListLoading('available', false);
      this.showListLoading('group', false);
    }
  },

  async removeSelectedUsers() {
    const selectedUsers = Array.from(document.querySelectorAll('.group-user-checkbox:checked'))
      .map(checkbox => parseInt(checkbox.value));
    
    if (selectedUsers.length === 0) {
      window.NotificationManager.showWarning('Seleccione al menos un usuario para remover');
      return;
    }

    if (!confirm(`¿Está seguro de remover ${selectedUsers.length} usuario(s) del grupo?`)) {
      return;
    }

    try {
      // Mostrar loading durante la operación
      this.showListLoading('available', true);
      this.showListLoading('group', true);

      const response = await window.Http.post(`/groups/${this.currentGroupId}/remove-users`, {
        user_ids: selectedUsers
      }, {
        title: 'Removiendo Usuarios',
        message: 'Removiendo usuarios del grupo...'
      });

      if (response.success) {
        window.NotificationManager.showSuccess(`${selectedUsers.length} usuario(s) removido(s) exitosamente`);
        await this.loadUsersForManagement();
        this.loadGroups(); // Actualizar tabla principal
      } else {
        window.NotificationManager.showError('Error: ' + response.error);
        this.showListLoading('available', false);
        this.showListLoading('group', false);
      }
    } catch (error) {
      console.error('Error removing users:', error);
      window.NotificationManager.showError('Error al remover usuarios');
      this.showListLoading('available', false);
      this.showListLoading('group', false);
    }
  },

  filterUsers(type, searchTerm) {
    const containers = type === 'available' ? 
      document.querySelectorAll('#available-users-list > div') :
      document.querySelectorAll('#group-users-list > div');
    
    containers.forEach(container => {
      const name = container.querySelector('.font-medium').textContent.toLowerCase();
      const email = container.querySelector('.text-xs').textContent.toLowerCase();
      const matches = name.includes(searchTerm.toLowerCase()) || 
                     email.includes(searchTerm.toLowerCase());
      
      container.style.display = matches ? 'flex' : 'none';
    });
  },

  closeManageUsersModal() {
    // Ocultar loading states
    this.showManageUsersLoading(false);
    this.showListLoading('available', false);
    this.showListLoading('group', false);
    
    // Cerrar modal
    document.getElementById('manage-group-users-modal').classList.add('hidden');
    
    // Limpiar datos
    this.currentGroupId = null;
    this.availableUsers = [];
    this.groupUsers = [];
    
    // Limpiar listas
    document.getElementById('available-users-list').innerHTML = '';
    document.getElementById('group-users-list').innerHTML = '';
    
    // Limpiar campos de búsqueda
    document.getElementById('search-available-users').value = '';
    document.getElementById('search-group-users').value = '';
  }
};