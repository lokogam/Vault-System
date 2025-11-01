// groups.js - Módulo de gestión de grupos

export const GroupManager = {
  currentEditingGroup: null,

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
      const groups = response.data.data; // Laravel pagination data
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
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <button data-group-id="${group.id}" class="edit-group-btn text-indigo-600 hover:text-indigo-900 mr-3">Editar</button>
          <button data-group-id="${group.id}" class="delete-group-btn text-red-600 hover:text-red-900">Eliminar</button>
        </td>
      </tr>
    `).join('');

    // Agregar event listeners a los botones
    this.attachGroupButtonListeners();
  },

  attachGroupButtonListeners() {
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
  }
};