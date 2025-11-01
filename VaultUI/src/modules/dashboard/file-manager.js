// file-manager.js - Gestión de archivos del usuario

export class FileManager {
  constructor() {
    this.files = [];
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
        if (response.storage_info && window.dashboardManager) {
          console.log('📊 Actualizando información de almacenamiento desde loadFiles');
          window.dashboardManager.updateStorageDisplay(response.storage_info);
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
      if (loadingElement) {
        loadingElement.classList.add('hidden');
        console.log('✅ Loading de archivos ocultado');
      }
    }
  }

  renderFilesTable() {
    const tbody = document.getElementById('files-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    this.files.forEach(file => {
      const row = document.createElement('tr');
      row.className = 'hover:bg-gray-50 transition-colors duration-200';

      const fileExtension = file.original_name.split('.').pop().toLowerCase();
      const fileIcon = this.getFileIcon(fileExtension);

      row.innerHTML = `
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
          <button class="text-blue-600 hover:text-blue-900 transition-colors duration-200 mr-3"
                  onclick="window.fileManager.downloadFile(${file.id}, '${file.original_name}')"
                  title="Descargar archivo">
            <i class="fas fa-download mr-1"></i>Descargar
          </button>
          <button class="text-red-600 hover:text-red-900 transition-colors duration-200"
                  onclick="window.fileManager.showDeleteModal(${file.id}, '${file.original_name}')"
                  title="Eliminar archivo">
            <i class="fas fa-trash mr-1"></i>Eliminar
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

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
      if (confirm(`¿Estás seguro de que quieres eliminar el archivo "${fileName}"?`)) {
        this.deleteFile(fileId, fileName);
      }
      return;
    }
    
    filenameSpan.textContent = fileName;
    modal.classList.remove('hidden');
    
    // Limpiar event listeners anteriores
    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    
    // Agregar event listeners
    newConfirmBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      this.deleteFile(fileId, fileName);
    });
    
    newCancelBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
    
    console.log('✅ Modal de eliminación mostrado');
  }

  // Eliminar archivo
  async deleteFile(fileId, fileName) {
    console.log('🗑️ Eliminando archivo:', { fileId, fileName });

    try {
      const response = await window.Http.delete(`/files/${fileId}`);
      console.log('📡 Respuesta del servidor:', response);

      if (response.success || response.message) {
        console.log('✅ Archivo eliminado exitosamente');
        window.NotificationManager?.showSuccess(`Archivo "${fileName}" eliminado correctamente`) || alert(`Archivo "${fileName}" eliminado correctamente`);
        
        // Recargar la lista de archivos
        await this.loadFiles();
        await window.dashboardManager?.loadStorageInfo();
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
    console.log('⬇️ Descargando archivo:', { fileId, fileName });

    try {
      // Para descargas de archivos, usar fetch directo en lugar de window.Http
      // porque el servidor devuelve el archivo binario, no JSON
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${window.Config?.apiUrl || 'http://localhost:8000'}/api/files/${fileId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': '*/*'  // Aceptar cualquier tipo de contenido
        }
      });

      console.log('📦 Respuesta de descarga:', response.status, response.headers.get('content-type'));

      if (response.ok) {
        // Obtener el archivo como blob
        const blob = await response.blob();
        console.log('✅ Archivo descargado como blob:', blob.size, 'bytes');
        
        // Crear URL temporal para descarga
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpiar URL temporal
        window.URL.revokeObjectURL(url);
        
        window.NotificationManager?.showSuccess(`Descargando archivo: ${fileName}`) || 
        console.log(`✅ Descarga iniciada: ${fileName}`);
      } else {
        // Si hay error, intentar leer como JSON para obtener el mensaje de error
        try {
          const errorData = await response.json();
          const errorMsg = errorData.message || errorData.error || `Error del servidor: ${response.status}`;
          console.error('❌ Error en descarga:', errorData);
          window.NotificationManager?.showError(`Error al descargar: ${errorMsg}`) || alert(`Error al descargar: ${errorMsg}`);
        } catch (parseError) {
          // Si no se puede parsear como JSON, usar mensaje genérico
          const errorMsg = `Error del servidor: ${response.status} ${response.statusText}`;
          console.error('❌ Error en descarga (no JSON):', errorMsg);
          window.NotificationManager?.showError(`Error al descargar: ${errorMsg}`) || alert(`Error al descargar: ${errorMsg}`);
        }
      }
    } catch (error) {
      console.error('❌ Error downloading file:', error);
      const errorMsg = 'Error al descargar archivo: ' + (error.message || 'Error de conexión');
      window.NotificationManager?.showError(errorMsg) || alert(errorMsg);
    }
  }

  // === EVENT HANDLERS ===
  handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
  }

  handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
  }

  handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
    
    const files = Array.from(e.dataTransfer.files);
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
    console.log('📤 Iniciando subida de archivo:', file.name);

    // Validar tamaño máximo (50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      const errorMsg = 'El archivo es demasiado grande. Tamaño máximo: 50MB';
      window.NotificationManager?.showError(errorMsg) || alert(errorMsg);
      return;
    }

    // Mostrar progreso
    const progressContainer = document.getElementById('upload-progress');
    const progressBar = document.getElementById('upload-bar');
    const progressPercentage = document.getElementById('upload-percentage');

    if (progressContainer) {
      progressContainer.classList.remove('hidden');
      if (progressBar) progressBar.style.width = '0%';
      if (progressPercentage) progressPercentage.textContent = '0%';
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('📡 Enviando archivo al servidor...');
      
      // Simular progreso mientras se procesa
      if (progressBar && progressPercentage) {
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += 10;
          if (progress <= 80) {
            progressBar.style.width = `${progress}%`;
            progressPercentage.textContent = `${progress}%`;
          }
          
          if (progress >= 80) {
            clearInterval(progressInterval);
          }
        }, 150);
      }
      
      // Usar directamente window.Http para subida de archivos
      const response = await window.Http.postFormData('/files/upload', formData);

      console.log('📦 Respuesta completa:', response);

      // Completar progreso
      if (progressBar && progressPercentage) {
        progressBar.style.width = '100%';
        progressPercentage.textContent = '100%';
      }

      if (response.success || response.message) {
        console.log('✅ Archivo subido exitosamente');
        window.NotificationManager?.showSuccess(`Archivo "${file.name}" subido correctamente`) || alert(`Archivo "${file.name}" subido correctamente`);
        
        // Recargar archivos y información de almacenamiento
        await this.loadFiles();
        await window.dashboardManager?.loadStorageInfo();
      } else {
        console.log('❌ Error en subida:', response);
        const errorMsg = response.message || response.error || 'Error al subir archivo';
        window.NotificationManager?.showError(errorMsg) || alert(errorMsg);
      }
    } catch (error) {
      console.error('❌ Error uploading file:', error);
      const errorMsg = 'Error al subir archivo: ' + (error.message || 'Error de conexión');
      window.NotificationManager?.showError(errorMsg) || alert(errorMsg);
    } finally {
      // Ocultar progreso
      if (progressContainer) {
        setTimeout(() => {
          progressContainer.classList.add('hidden');
        }, 1000);
      }
      
      // Limpiar input
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';
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