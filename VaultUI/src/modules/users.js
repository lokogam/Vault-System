// modules/users.js - Módulo de gestión de usuarios

export const UserManager = {
  users: [],

  async loadUsers() {
    if (!window.Auth.isAdmin()) {
      return;
    }

    const loadingElement = document.getElementById('users-loading');
    const tableContainer = document.getElementById('users-table-container');
    const noUsersElement = document.getElementById('no-users');

    if (loadingElement) loadingElement.classList.remove('hidden');
    if (tableContainer) tableContainer.classList.add('hidden');
    if (noUsersElement) noUsersElement.classList.add('hidden');

    try {
      const response = await window.Http.get('/users', {
        title: 'Cargando Usuarios',
        message: 'Obteniendo lista de usuarios...'
      });


      if (response.success) {
        // Manejar diferentes estructuras de respuesta de manera robusta
        let users = null;

        if (response.data && response.data.data) {
          // Estructura paginada de Laravel: response.data.data
          users = response.data.data;
        } else if (response.data && response.data.users) {
          // Estructura con key 'users': response.data.users
          users = response.data.users;
        } else if (response.data && Array.isArray(response.data)) {
          // Array directo: response.data
          users = response.data;
        } else if (response.users && Array.isArray(response.users)) {
          // Fallback: response.users
          users = response.users;
        }

        if (users && Array.isArray(users)) {
          this.users = users;
          this.renderUsersTable();
        } else {
          console.error('❌ No se encontraron usuarios válidos en la respuesta:', response);
          this.users = [];
          this.renderUsersTable();
          window.NotificationManager.showWarning('No se encontraron usuarios en la respuesta del servidor');
        }
      } else {
        console.error('❌ Respuesta sin éxito:', response);
        window.NotificationManager.showError('Error al cargar usuarios: ' + (response.error || response.message || 'Error desconocido'));
        if (noUsersElement) noUsersElement.classList.remove('hidden');
      }
    } catch (error) {
      console.error('💥 Error loading users:', error);
      window.NotificationManager.showError('Error al cargar usuarios: ' + error.message);
      if (noUsersElement) noUsersElement.classList.remove('hidden');
    } finally {
      if (loadingElement) loadingElement.classList.add('hidden');
    }
  },

  renderUsersTable() {
    const tableContainer = document.getElementById('users-table-container');
    const tbody = document.getElementById('users-tbody');
    const noUsersElement = document.getElementById('no-users');

    if (!tbody) {
      console.error('❌ No se encontró el elemento users-tbody');
      return;
    }

    // Validar que this.users sea un array válido
    if (!this.users || !Array.isArray(this.users)) {
      console.warn('⚠️ this.users no es un array válido:', this.users);
      this.users = []; // Inicializar como array vacío
    }

    tbody.innerHTML = '';


    if (this.users.length === 0) {
      if (tableContainer) tableContainer.classList.add('hidden');
      if (noUsersElement) {
        noUsersElement.classList.remove('hidden');
        noUsersElement.innerHTML = `
          <div class="text-center py-8">
            <i class="fas fa-users text-4xl text-gray-400 mb-4"></i>
            <p class="text-gray-600">No hay usuarios disponibles</p>
            <p class="text-sm text-gray-400 mt-2">Verifica los permisos de administrador</p>
          </div>
        `;
      }
      return;
    }

    if (tableContainer) tableContainer.classList.remove('hidden');
    if (noUsersElement) noUsersElement.classList.add('hidden');

    this.users.forEach(user => {
      const row = document.createElement('tr');

      const rolesText = user.roles ? user.roles.join(', ') : 'Sin rol';
      const groupsText = user.groups && user.groups.length > 0
        ? user.groups.map(g => g.name).join(', ')
        : 'Sin grupos';

      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.id}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.name}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.email}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            user.roles && user.roles.includes('Administrador')
              ? 'bg-purple-100 text-purple-800'
              : 'bg-blue-100 text-blue-800'
          }">
            ${rolesText}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          <div class="flex flex-wrap gap-1">
            ${user.groups && user.groups.length > 0
              ? user.groups.map(group => `
                  <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                    ${group.name}
                    <button class="ml-1 text-green-600 hover:text-green-800" onclick="UserManager.removeFromGroup(${user.id}, ${group.id})">
                      ×
                    </button>
                  </span>
                `).join('')
              : '<span class="text-gray-500 text-xs">Sin grupos</span>'
            }
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
          <button class="text-indigo-600 hover:text-indigo-900" onclick="UserManager.showAssignGroupModal(${user.id}, '${user.name}')">
            Asignar Grupo
          </button>
          <button class="text-purple-600 hover:text-purple-900" onclick="UserManager.showAssignRoleModal(${user.id}, '${user.name}', '${rolesText}')">
            Cambiar Rol
          </button>
        </td>
      `;

      tbody.appendChild(row);
    });
  },

  async showAssignGroupModal(userId, userName) {
    const modal = document.getElementById('assign-user-modal');
    const titleElement = document.getElementById('assign-modal-title');
    const userIdInput = document.getElementById('assign-user-id');
    const groupSelect = document.getElementById('assign-group-select');

    if (!modal || !titleElement || !userIdInput || !groupSelect) return;

    titleElement.textContent = `Asignar "${userName}" a Grupo`;
    userIdInput.value = userId;

    // Cargar grupos disponibles
    try {
      const response = await window.Http.get('/groups');
      if (response.success) {
        groupSelect.innerHTML = '<option value="">Seleccione un grupo...</option>';

        // Verificar si response.data tiene la estructura de paginación o es un array directo
        let groups = [];
        if (response.data.data) {
          // Estructura paginada de Laravel
          groups = response.data.data;
        } else if (response.data.groups) {
          // Estructura con key 'groups'
          groups = response.data.groups;
        } else if (Array.isArray(response.data)) {
          // Array directo
          groups = response.data;
        }

        groups.forEach(group => {
          groupSelect.innerHTML += `<option value="${group.id}">${group.name}</option>`;
        });
      }
    } catch (error) {
      console.error('Error loading groups for modal:', error);
      window.NotificationManager.showError('Error al cargar grupos');
    }

    modal.classList.remove('hidden');
  },

  async showAssignRoleModal(userId, userName, currentRole) {
    const modal = document.getElementById('assign-role-modal');
    const userIdInput = document.getElementById('assign-role-user-id');
    const roleSelect = document.getElementById('role-select');

    if (!modal || !userIdInput || !roleSelect) return;

    userIdInput.value = userId;

    // Seleccionar el rol actual
    if (currentRole.includes('Administrador')) {
      roleSelect.value = 'Administrador';
    } else {
      roleSelect.value = 'Usuario';
    }

    modal.classList.remove('hidden');
  },

  closeAssignModal() {
    const modal = document.getElementById('assign-user-modal');
    if (modal) modal.classList.add('hidden');
  },

  closeRoleModal() {
    const modal = document.getElementById('assign-role-modal');
    if (modal) modal.classList.add('hidden');
  },

  async assignUserToGroup(userId, groupId) {
    try {
      const response = await window.Http.post(`/users/${userId}/assign-group`, {
        group_id: groupId
      }, {
        title: 'Asignando Usuario',
        message: 'Asignando usuario al grupo...'
      });

      if (response.success) {
        window.NotificationManager.showSuccess('Usuario asignado al grupo exitosamente');
        this.closeAssignModal();
        this.loadUsers(); // Recargar la lista
      } else {
        window.NotificationManager.showError('Error: ' + response.error);
      }
    } catch (error) {
      console.error('Error assigning user to group:', error);
      window.NotificationManager.showError('Error al asignar usuario al grupo');
    }
  },

  async removeFromGroup(userId, groupId) {
    if (!confirm('¿Está seguro de que desea remover este usuario del grupo?')) {
      return;
    }

    try {
      const response = await window.Http.post(`/users/${userId}/remove-group`, {
        group_id: groupId
      }, {
        title: 'Removiendo Usuario',
        message: 'Removiendo usuario del grupo...'
      });

      if (response.success) {
        window.NotificationManager.showSuccess('Usuario removido del grupo exitosamente');
        this.loadUsers(); // Recargar la lista
      } else {
        window.NotificationManager.showError('Error: ' + response.error);
      }
    } catch (error) {
      console.error('Error removing user from group:', error);
      window.NotificationManager.showError('Error al remover usuario del grupo');
    }
  },

  async assignRole(userId, role) {
    try {
      const response = await window.Http.post(`/users/${userId}/assign-role`, {
        role: role
      }, {
        title: 'Asignando Rol',
        message: 'Asignando rol al usuario...'
      });

      if (response.success) {
        window.NotificationManager.showSuccess('Rol asignado exitosamente');
        this.closeRoleModal();
        this.loadUsers(); // Recargar la lista
      } else {
        window.NotificationManager.showError('Error: ' + response.error);
      }
    } catch (error) {
      console.error('Error assigning role:', error);
      window.NotificationManager.showError('Error al asignar rol');
    }
  },


  setupEventListeners() {
    // Botón de actualizar
    const refreshBtn = document.getElementById('refresh-users-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadUsers();
      });
    }

    // Modal de asignar grupo
    const assignForm = document.getElementById('assign-user-form');
    if (assignForm) {
      assignForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userId = document.getElementById('assign-user-id').value;
        const groupId = document.getElementById('assign-group-select').value;

        if (!groupId) {
          window.NotificationManager.showError('Debe seleccionar un grupo');
          return;
        }

        this.assignUserToGroup(userId, groupId);
      });
    }

    const cancelAssignBtn = document.getElementById('cancel-assign-btn');
    if (cancelAssignBtn) {
      cancelAssignBtn.addEventListener('click', () => {
        this.closeAssignModal();
      });
    }

    // Modal de asignar rol
    const roleForm = document.getElementById('assign-role-form');
    if (roleForm) {
      roleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userId = document.getElementById('assign-role-user-id').value;
        const role = document.getElementById('role-select').value;

        this.assignRole(userId, role);
      });
    }

    const cancelRoleBtn = document.getElementById('cancel-role-btn');
    if (cancelRoleBtn) {
      cancelRoleBtn.addEventListener('click', () => {
        this.closeRoleModal();
      });
    }

    // Cerrar modales al hacer click fuera
    document.getElementById('assign-user-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'assign-user-modal') {
        this.closeAssignModal();
      }
    });

    document.getElementById('assign-role-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'assign-role-modal') {
        this.closeRoleModal();
      }
    });
  }
};

// Exportar para uso global
window.UserManager = UserManager;