// admin-file-manager.js - Gestión de archivos del sistema para administradores

export class AdminFileManager {
  constructor() {
    this.allFiles = [];
  }

  // === ADMIN FILE MANAGEMENT METHODS ===
  
  // Cargar todos los archivos del sistema (solo admin)
  async loadAllFiles() {
    console.log('🔍 Cargando todos los archivos del sistema (admin)...');

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

      if (response.success || Array.isArray(response)) {
        // Manejar diferentes estructuras de respuesta
        let files = [];
        
        if (response.success && response.data) {
          // Respuesta con success flag
          if (Array.isArray(response.data)) {
            // Array directo
            files = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            // Respuesta paginada de Laravel: response.data.data
            files = response.data.data;
            console.log('✅ Archivos encontrados en respuesta paginada Laravel');
          } else {
            console.error('❌ Estructura de respuesta no reconocida en success:', response.data);
            files = [];
          }
        } else if (Array.isArray(response)) {
          // Respuesta directa como array
          files = response;
        } else if (response.data && Array.isArray(response.data)) {
          // Respuesta paginada directa: response.data
          files = response.data;
          console.log('✅ Archivos encontrados en response.data (paginado)');
        } else {
          console.error('❌ Estructura de respuesta no reconocida:', response);
          files = [];
        }

        console.log(`📊 ${files.length} archivos encontrados en el sistema`);
        
        this.allFiles = files;
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
                  onclick="window.adminFileManager.adminDeleteFile(${file.id}, '${file.original_name}', '${file.user?.name || 'Usuario'}')"
                  title="Eliminar archivo">
            <i class="fas fa-trash mr-1"></i>Eliminar
          </button>
          <button class="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                  onclick="window.fileManager.downloadFile(${file.id}, '${file.original_name}')"
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

  // === UTILITY METHODS ===
  getFileIcon(extension) {
    const iconMap = {
      pdf: 'fas fa-file-pdf text-red-600',
      doc: 'fas fa-file-word text-blue-600',
      docx: 'fas fa-file-word text-blue-600',
      xls: 'fas fa-file-excel text-green-600',
      xlsx: 'fas fa-file-excel text-green-600',
      ppt: 'fas fa-file-powerpoint text-orange-600',
      pptx: 'fas fa-file-powerpoint text-orange-600',
      txt: 'fas fa-file-alt text-gray-600',
      zip: 'fas fa-file-archive text-purple-600',
      rar: 'fas fa-file-archive text-purple-600',
      jpg: 'fas fa-file-image text-pink-600',
      jpeg: 'fas fa-file-image text-pink-600',
      png: 'fas fa-file-image text-pink-600',
      gif: 'fas fa-file-image text-pink-600'
    };
    return iconMap[extension] || 'fas fa-file text-gray-600';
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString) {
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  }
}