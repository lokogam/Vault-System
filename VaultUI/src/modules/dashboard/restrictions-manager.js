// restrictions-manager.js - Gestión de restricciones de archivos

export class RestrictionsManager {
  constructor() {
    this.restrictions = [];
  }

  // === RESTRICTIONS MANAGEMENT (ADMIN) ===
  async loadRestrictions() {
    console.log('🔍 Cargando restricciones de archivo...');

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
        this.restrictions = restrictions;
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

    // Usar las restricciones pasadas como parámetro o las almacenadas en la instancia
    const restrictionsToRender = restrictions || this.restrictions;

    // Verificar que restrictions sea un array
    if (!Array.isArray(restrictionsToRender)) {
      console.error('❌ restrictions debe ser un array, recibido:', typeof restrictionsToRender, restrictionsToRender);
      return;
    }

    console.log(`📊 Renderizando ${restrictionsToRender.length} restricciones`);

    if (restrictionsToRender.length === 0) {
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

    restrictionsToRender.forEach((restriction, index) => {
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
                  onclick="window.restrictionsManager.showDeleteRestrictionModal(${restriction.id}, '${restriction.extension}')"
                  title="Eliminar restricción">
            <i class="fas fa-trash mr-1"></i>Eliminar
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });

    console.log('✅ Tabla de restricciones renderizada correctamente');
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
    if (statusSelect) statusSelect.value = '1'; // Por defecto: Prohibido
    if (descriptionInput) descriptionInput.value = '';

    modal.classList.remove('hidden');
    if (extensionInput) extensionInput.focus();
    
    console.log('✅ Modal de restricción mostrado');
  }

  // Ocultar modal de restricciones
  hideRestrictionModal() {
    const modal = document.getElementById('restriction-modal');
    if (modal) {
      modal.classList.add('hidden');
      console.log('✅ Modal de restricción ocultado');
    }
  }

  // Manejar envío del formulario de restricciones
  async handleRestrictionSubmit(e) {
    e.preventDefault();
    console.log('📝 Procesando envío de restricción...');

    const extensionInput = document.getElementById('extension-input');
    const statusSelect = document.getElementById('status-select');
    const descriptionInput = document.getElementById('description-input');

    if (!extensionInput || !statusSelect) {
      console.error('❌ Faltan elementos del formulario');
      return;
    }

    const extension = extensionInput.value.trim().toLowerCase().replace(/^\./, ''); // Quitar punto inicial si existe
    const isProhibited = statusSelect.value === '1'; // true si es prohibido
    const description = descriptionInput?.value.trim() || '';

    console.log('📋 Datos del formulario:', { extension, isProhibited, description });

    if (!extension) {
      const msg = 'Por favor ingresa una extensión de archivo';
      window.NotificationManager?.showError(msg) || alert(msg);
      return;
    }

    // Validar extensión
    if (!/^[a-z0-9]+$/i.test(extension)) {
      const msg = 'La extensión solo puede contener letras y números';
      window.NotificationManager?.showError(msg) || alert(msg);
      return;
    }

    try {
      console.log('🔄 Enviando restricción al servidor...');
      const response = await window.Http.post('/file-restrictions', {
        extension: extension,
        is_prohibited: isProhibited,
        description: description || null
      });

      console.log('📡 Respuesta del servidor:', response);

      if (response.success || response.message || response.id) {
        console.log('✅ Restricción creada exitosamente');
        const statusText = isProhibited ? 'prohibida' : 'permitida';
        window.NotificationManager?.showSuccess(`Extensión .${extension} marcada como ${statusText}`) || alert(`Extensión .${extension} marcada como ${statusText}`);
        
        this.hideRestrictionModal();
        await this.loadRestrictions(); // Recargar tabla
      } else {
        console.log('❌ Error en respuesta:', response);
        const errorMsg = 'Error al crear restricción: ' + (response.error || response.message || 'Error desconocido');
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
      if (confirm(`¿Estás seguro de que quieres eliminar la restricción para archivos .${extension}?`)) {
        this.deleteRestriction(restrictionId);
      }
      return;
    }
    
    extensionSpan.textContent = extension;
    modal.classList.remove('hidden');
    
    // Limpiar event listeners anteriores
    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    
    // Agregar event listeners
    newConfirmBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      this.deleteRestriction(restrictionId);
    });
    
    newCancelBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
    
    console.log('✅ Modal de eliminación de restricción mostrado');
  }

  // Eliminar restricción de archivo
  async deleteRestriction(restrictionId) {
    console.log('🗑️ Eliminando restricción:', restrictionId);

    try {
      console.log('🔄 Enviando petición de eliminación...');
      const response = await window.Http.delete(`/file-restrictions/${restrictionId}`);
      console.log('📡 Respuesta del servidor:', response);

      if (response.success || response.message) {
        console.log('✅ Restricción eliminada exitosamente');
        window.NotificationManager?.showSuccess('Restricción eliminada correctamente') || alert('Restricción eliminada correctamente');
        
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
}