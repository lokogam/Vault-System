// config-manager.js - Gestión de configuraciones del administrador

export class ConfigManager {
  constructor() {
    this.pendingUserLimitRemoval = null;
    this.pendingGroupLimitRemoval = null;
  }

  // === CONFIGURATION MANAGEMENT ===

  // Cargar usuarios para configuración
  async loadUsersForConfig() {
    try {
      const response = await window.Http.get('/users');

      let users = null;

      if (response.success && response.data && response.data.users) {
        // Nueva estructura: response.data.users
        users = response.data.users;
      } else if (response.success && response.data && response.data.data) {
        // Estructura: response.data.data
        users = response.data.data;
      } else if (response.success && Array.isArray(response.data)) {
        // Estructura: response.data (array directo)
        users = response.data;
      } else if (Array.isArray(response)) {
        // Respuesta directa como array
        users = response;
      } else if (response.users) {
        // Estructura: response.users
        users = response.users;
      }

      if (users && Array.isArray(users)) {
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
    try {
      const response = await window.Http.get('/groups');

      let groups = null;

      if (response.success && response.data && response.data.data) {
        // Datos en response.data.data
        groups = response.data.data;
      } else if (response.success && response.data && Array.isArray(response.data)) {
        // Datos en response.data (array directo)
        groups = response.data;
      } else if (Array.isArray(response)) {
        // Respuesta directa como array
        groups = response;
      } else if (response.data && Array.isArray(response.data)) {
        // Grupos en response.data
        groups = response.data;
      }

      if (groups && Array.isArray(groups)) {
        this.populateGroupSelect(groups);
        this.renderGroupsList(groups);
      } else {
        console.error('❌ Respuesta inválida de grupos:', response);
        this.renderGroupsList([]);
      }
    } catch (error) {
      console.error('❌ Error loading groups for config:', error);
      this.renderGroupsList([]);
    }
  }

  // Poblar select de usuarios
  populateUserSelect(users) {
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

  }

  // Poblar select de grupos
  populateGroupSelect(groups) {
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

  }

  // Renderizar lista de usuarios con límites
  renderUsersList(users) {
    const usersList = document.getElementById('users-list');
    if (!usersList) {
      console.error('❌ No se encontró el elemento users-list');
      return;
    }

    if (!users || users.length === 0) {
      usersList.innerHTML = '<div class="text-sm text-gray-500 text-center py-4">No hay usuarios</div>';
      return;
    }

    usersList.innerHTML = '';

    users.forEach(user => {
      
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
            <button onclick="window.configManager.removeUserLimit(${user.id})"
                    class="text-xs text-red-600 hover:text-red-800">
              Quitar límite
            </button>
          ` : ''}
        </div>
      `;
      usersList.appendChild(userItem);
    });

  }

  // Renderizar lista de grupos con límites
  renderGroupsList(groups) {
    const groupsList = document.getElementById('groups-list');
    if (!groupsList) {
      console.error('❌ No se encontró el elemento groups-list');
      return;
    }

    if (!groups || groups.length === 0) {
      groupsList.innerHTML = '<div class="text-sm text-gray-500 text-center py-4">No hay grupos</div>';
      return;
    }

    groupsList.innerHTML = '';

    groups.forEach(group => {
      
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
            <button onclick="window.configManager.removeGroupLimit(${group.id})"
                    class="text-xs text-red-600 hover:text-red-800">
              Quitar límite
            </button>
          ` : ''}
        </div>
      `;
      groupsList.appendChild(groupItem);
    });

  }

  // === LIMIT MANAGEMENT ===

  // Actualizar límite de usuario
  async updateUserLimit() {
    const userSelect = document.getElementById('user-select');
    const userLimitInput = document.getElementById('user-limit');

    const userId = userSelect?.value;
    const limitMB = parseInt(userLimitInput?.value);

    if (!userId) {
      const msg = 'Por favor selecciona un usuario';
      window.NotificationManager?.showError(msg) || alert(msg);
      return;
    }

    if (!limitMB || limitMB <= 0) {
      const msg = 'Por favor ingresa un límite válido (mayor a 0 MB)';
      window.NotificationManager?.showError(msg) || alert(msg);
      return;
    }

    try {
      const response = await window.Http.put(`/users/${userId}/storage-limit`, {
        storage_limit: limitMB * 1024 * 1024 // Convertir MB a bytes
      });


      if (response.success || response.message) {
        window.NotificationManager?.showSuccess('Límite de usuario actualizado exitosamente') || alert('Límite de usuario actualizado exitosamente');
        await this.loadUsersForConfig();
        
        // Limpiar formulario
        userSelect.value = '';
        userLimitInput.value = '';
      } else {
        const errorMsg = 'Error al actualizar límite: ' + (response.error || response.message || 'Error desconocido');
        window.NotificationManager?.showError(errorMsg) || alert(errorMsg);
      }
    } catch (error) {
      console.error('❌ Error updating user limit:', error);
      const errorMsg = 'Error al actualizar límite de usuario: ' + (error.message || 'Error de conexión');
      window.NotificationManager?.showError(errorMsg) || alert(errorMsg);
    }
  }

  // Actualizar límite de grupo
  async updateGroupLimit() {
    const groupSelect = document.getElementById('group-select');
    const groupLimitInput = document.getElementById('group-limit');

    const groupId = groupSelect?.value;
    const limitMB = parseInt(groupLimitInput?.value);

    if (!groupId) {
      const msg = 'Por favor selecciona un grupo';
      window.NotificationManager?.showError(msg) || alert(msg);
      return;
    }

    if (!limitMB || limitMB <= 0) {
      const msg = 'Por favor ingresa un límite válido (mayor a 0 MB)';
      window.NotificationManager?.showError(msg) || alert(msg);
      return;
    }

    try {
      const response = await window.Http.put(`/groups/${groupId}/storage-limit`, {
        storage_limit: limitMB * 1024 * 1024 // Convertir MB a bytes
      });


      if (response.success || response.message) {
        window.NotificationManager?.showSuccess('Límite de grupo actualizado exitosamente') || alert('Límite de grupo actualizado exitosamente');
        await this.loadGroupsForConfig();
        
        // Limpiar formulario
        groupSelect.value = '';
        groupLimitInput.value = '';
      } else {
        const errorMsg = 'Error al actualizar límite: ' + (response.error || response.message || 'Error desconocido');
        window.NotificationManager?.showError(errorMsg) || alert(errorMsg);
      }
    } catch (error) {
      console.error('❌ Error updating group limit:', error);
      const errorMsg = 'Error al actualizar límite de grupo: ' + (error.message || 'Error de conexión');
      window.NotificationManager?.showError(errorMsg) || alert(errorMsg);
    }
  }

  // Actualizar límite por defecto
  async updateDefaultLimit() {
    const defaultLimitInput = document.getElementById('default-limit');

    const limitMB = parseInt(defaultLimitInput?.value);

    if (!limitMB || limitMB <= 0) {
      const msg = 'Por favor ingresa un límite válido (mayor a 0 MB)';
      window.NotificationManager?.showError(msg) || alert(msg);
      return;
    }

    if (limitMB > 10000) {
      const msg = 'El límite no puede ser mayor a 10GB (10000 MB)';
      window.NotificationManager?.showError(msg) || alert(msg);
      return;
    }

    try {
      const response = await window.Http.put('/system-settings/default-storage-limit', {
        storage_limit_mb: limitMB 
      });


      if (response.success || response.message) {
        window.NotificationManager?.showSuccess(`Límite global por defecto actualizado a ${limitMB} MB`) || alert(`Límite global por defecto actualizado a ${limitMB} MB`);
        await this.loadDefaultLimit();
        
        // Limpiar input
        defaultLimitInput.value = '';
      } else {
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
    try {
      const response = await window.Http.get('/system-settings/default-storage-limit');

      let defaultLimitMB = null;

      if (response.success && response.data) {
        // El backend devuelve default_storage_limit_mb que ya está en MB
        if (response.data.default_storage_limit_mb !== undefined) {
          defaultLimitMB = parseInt(response.data.default_storage_limit_mb);
        } else if (response.data.default_storage_limit !== undefined) {
          // Si viene en bytes, convertir a MB
          defaultLimitMB = Math.round(parseInt(response.data.default_storage_limit) / (1024 * 1024));
        }
      }

      if (defaultLimitMB !== null && !isNaN(defaultLimitMB)) {
        
        const currentLimitSpan = document.getElementById('current-default-limit');
        if (currentLimitSpan) {
          currentLimitSpan.textContent = `${defaultLimitMB} MB`;
        }
      } else {
        const currentLimitSpan = document.getElementById('current-default-limit');
        if (currentLimitSpan) {
          currentLimitSpan.textContent = 'No configurado';
        }
      }
    } catch (error) {
      console.error('❌ Error loading default limit:', error);
      const currentLimitSpan = document.getElementById('current-default-limit');
      if (currentLimitSpan) {
        currentLimitSpan.textContent = 'Error al cargar';
      }
    }
  }

  // === REMOVE LIMITS ===

  // Quitar límite específico de usuario
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
    
    this.showRemoveUserLimitModal(userId, userName);
  }

  // Función para quitar límite de usuario sin confirmación (para uso interno)
  async removeUserLimitWithoutConfirm(userId) {
    
    // Convertir userId a número si es string válido
    const parsedUserId = typeof userId === 'string' && !isNaN(userId) ? parseInt(userId) : userId;
    
    // Validar que userId sea válido
    if (!parsedUserId || parsedUserId === 'undefined' || parsedUserId === 'null' || isNaN(parsedUserId)) {
      console.error('❌ ID de usuario inválido:', userId);
      window.NotificationManager?.showError('ID de usuario inválido') || alert('ID de usuario inválido');
      return;
    }

    try {
      const response = await window.Http.put(`/users/${parsedUserId}/storage-limit`, {
        storage_limit: null
      });


      // Manejar diferentes estructuras de respuesta
      if (response.success || response.message || response.status === 'success') {
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
    
    this.showRemoveGroupLimitModal(groupId, groupName);
  }

  // Función para quitar límite de grupo sin confirmación (para uso interno)
  async removeGroupLimitWithoutConfirm(groupId) {
    
    // Convertir groupId a número si es string válido
    const parsedGroupId = typeof groupId === 'string' && !isNaN(groupId) ? parseInt(groupId) : groupId;
    
    // Validar que groupId sea válido
    if (!parsedGroupId || parsedGroupId === 'undefined' || parsedGroupId === 'null' || isNaN(parsedGroupId)) {
      console.error('❌ ID de grupo inválido:', groupId);
      window.NotificationManager?.showError('ID de grupo inválido') || alert('ID de grupo inválido');
      return;
    }

    try {
      const response = await window.Http.put(`/groups/${parsedGroupId}/storage-limit`, {
        storage_limit: null
      });


      // Manejar diferentes estructuras de respuesta
      if (response.success || response.message || response.status === 'success') {
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

  // === MODAL FUNCTIONS FOR REMOVING LIMITS ===
  
  // Mostrar modal de confirmación para quitar límite de usuario
  showRemoveUserLimitModal(userId, userName) {
    
    this.pendingUserLimitRemoval = userId;
    
    const modal = document.getElementById('remove-user-limit-modal');
    const userNameSpan = document.getElementById('user-limit-name');
    
    if (!modal || !userNameSpan) {
      console.error('❌ No se encontraron elementos del modal de quitar límite de usuario');
      // Fallback al confirm() tradicional
      if (confirm(`¿Estás seguro de que quieres quitar el límite específico para ${userName}?\n\nEl usuario usará el límite por defecto.`)) {
        this.removeUserLimitWithoutConfirm(userId);
      }
      return;
    }
    
    userNameSpan.textContent = userName;
    modal.classList.remove('hidden');
  }

  // Ocultar modal de quitar límite de usuario
  hideRemoveUserLimitModal() {
    const modal = document.getElementById('remove-user-limit-modal');
    if (modal) {
      modal.classList.add('hidden');
      this.pendingUserLimitRemoval = null; // Limpiar cuando se cancela o cierra
    }
  }

  // Confirmar quitar límite de usuario
  async confirmRemoveUserLimit() {
    if (this.pendingUserLimitRemoval) {
      const userId = this.pendingUserLimitRemoval; // Guardar el valor antes de ocultar el modal
      this.pendingUserLimitRemoval = null; // Limpiar inmediatamente
      this.hideRemoveUserLimitModal();
      await this.removeUserLimitWithoutConfirm(userId);
    } else {
      console.error('❌ No hay userId pendiente para remover');
    }
  }

  // Mostrar modal de confirmación para quitar límite de grupo
  showRemoveGroupLimitModal(groupId, groupName) {
    
    this.pendingGroupLimitRemoval = groupId;
    
    const modal = document.getElementById('remove-group-limit-modal');
    const groupNameSpan = document.getElementById('group-limit-name');
    
    if (!modal || !groupNameSpan) {
      console.error('❌ No se encontraron elementos del modal de quitar límite de grupo');
      // Fallback al confirm() tradicional
      if (confirm(`¿Estás seguro de que quieres quitar el límite específico para el grupo ${groupName}?\n\nEl grupo usará el límite por defecto.`)) {
        this.removeGroupLimitWithoutConfirm(groupId);
      }
      return;
    }
    
    groupNameSpan.textContent = groupName;
    modal.classList.remove('hidden');
  }

  // Ocultar modal de quitar límite de grupo
  hideRemoveGroupLimitModal() {
    const modal = document.getElementById('remove-group-limit-modal');
    if (modal) {
      modal.classList.add('hidden');
      this.pendingGroupLimitRemoval = null; // Limpiar cuando se cancela o cierra
    }
  }

  // Confirmar quitar límite de grupo
  async confirmRemoveGroupLimit() {
    if (this.pendingGroupLimitRemoval) {
      const groupId = this.pendingGroupLimitRemoval; // Guardar el valor antes de ocultar el modal
      this.pendingGroupLimitRemoval = null; // Limpiar inmediatamente
      this.hideRemoveGroupLimitModal();
      await this.removeGroupLimitWithoutConfirm(groupId);
    } else {
      console.error('❌ No hay groupId pendiente para remover');
    }
  }
}