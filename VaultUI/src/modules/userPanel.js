import { api } from '../config/api.js';
import { showNotification } from '../components/notification.js';

class UserPanel {
    constructor() {
        this.files = [];
        this.storageInfo = null;
        this.currentDeleteFile = null;
        this.init();
    }

    async init() {
        // Verificar autenticación
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '../index.html';
            return;
        }

        this.setupEventListeners();
        await this.loadUserInfo();
        await this.loadFiles();
        await this.loadStorageInfo();
    }

    setupEventListeners() {
        // Logout
        document.getElementById('logout-btn').addEventListener('click', this.logout.bind(this));

        // File upload
        const fileInput = document.getElementById('file-input');
        const dropZone = document.getElementById('drop-zone');

        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Drag and drop
        dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        dropZone.addEventListener('drop', this.handleDrop.bind(this));
        dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));

        // Refresh files
        document.getElementById('refresh-files').addEventListener('click', this.loadFiles.bind(this));

        // Delete modal
        document.getElementById('cancel-delete').addEventListener('click', this.closeDeleteModal.bind(this));
        document.getElementById('confirm-delete').addEventListener('click', this.confirmDelete.bind(this));
    }

    async loadUserInfo() {
        try {
            const response = await api.get('/user/me');
            if (response.success) {
                document.getElementById('user-name').textContent = response.user.name;
            }
        } catch (error) {
            console.error('Error loading user info:', error);
        }
    }

    async loadStorageInfo() {
        try {
            const response = await api.get('/files/storage-info');
            this.storageInfo = response.storage_info;
            this.updateStorageDisplay();
        } catch (error) {
            console.error('Error loading storage info:', error);
        }
    }

    updateStorageDisplay() {
        if (!this.storageInfo) return;

        const usedElement = document.getElementById('storage-used');
        const barElement = document.getElementById('storage-bar');
        const percentageElement = document.getElementById('storage-percentage');

        usedElement.textContent = `${this.storageInfo.formatted_used} / ${this.storageInfo.formatted_limit}`;
        barElement.style.width = `${this.storageInfo.percentage}%`;
        percentageElement.textContent = `${this.storageInfo.percentage}% utilizado`;

        // Cambiar color de la barra según el uso
        barElement.className = 'h-2 rounded-full transition-all duration-300';
        if (this.storageInfo.percentage >= 90) {
            barElement.classList.add('bg-red-600');
        } else if (this.storageInfo.percentage >= 75) {
            barElement.classList.add('bg-yellow-600');
        } else {
            barElement.classList.add('bg-blue-600');
        }
    }

    async loadFiles() {
        const loadingElement = document.getElementById('files-loading');
        const emptyElement = document.getElementById('files-empty');
        const tableElement = document.getElementById('files-table');

        // Show loading
        loadingElement.classList.remove('hidden');
        emptyElement.classList.add('hidden');
        tableElement.classList.add('hidden');

        try {
            const response = await api.get('/files');
            this.files = response.files || [];
            
            if (this.files.length === 0) {
                emptyElement.classList.remove('hidden');
            } else {
                this.renderFilesTable();
                tableElement.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error loading files:', error);
            showNotification('Error al cargar los archivos', 'error');
        } finally {
            loadingElement.classList.add('hidden');
        }
    }

    renderFilesTable() {
        const tbody = document.getElementById('files-tbody');
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
                        <button onclick="userPanel.downloadFile(${file.id}, '${file.original_name}')" 
                                class="text-blue-600 hover:text-blue-900 transition">
                            <i class="fas fa-download"></i>
                        </button>
                        <button onclick="userPanel.showDeleteModal(${file.id}, '${file.original_name}')" 
                                class="text-red-600 hover:text-red-900 transition">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;

            tbody.appendChild(row);
        });
    }

    getFileIcon(extension) {
        const iconMap = {
            'pdf': 'fas fa-file-pdf text-red-600',
            'doc': 'fas fa-file-word text-blue-600',
            'docx': 'fas fa-file-word text-blue-600',
            'xls': 'fas fa-file-excel text-green-600',
            'xlsx': 'fas fa-file-excel text-green-600',
            'ppt': 'fas fa-file-powerpoint text-orange-600',
            'pptx': 'fas fa-file-powerpoint text-orange-600',
            'txt': 'fas fa-file-alt text-gray-600',
            'zip': 'fas fa-file-archive text-purple-600',
            'rar': 'fas fa-file-archive text-purple-600',
            'jpg': 'fas fa-file-image text-pink-600',
            'jpeg': 'fas fa-file-image text-pink-600',
            'png': 'fas fa-file-image text-pink-600',
            'gif': 'fas fa-file-image text-pink-600',
            'mp4': 'fas fa-file-video text-indigo-600',
            'avi': 'fas fa-file-video text-indigo-600',
            'mp3': 'fas fa-file-audio text-yellow-600',
            'wav': 'fas fa-file-audio text-yellow-600'
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

    handleDragOver(e) {
        e.preventDefault();
        e.target.closest('#drop-zone').classList.add('border-blue-400', 'bg-blue-50');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.target.closest('#drop-zone').classList.remove('border-blue-400', 'bg-blue-50');
    }

    handleDrop(e) {
        e.preventDefault();
        const dropZone = e.target.closest('#drop-zone');
        dropZone.classList.remove('border-blue-400', 'bg-blue-50');
        
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
        // Verificar tamaño
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            showNotification('El archivo es demasiado grande. Máximo permitido: 50MB', 'error');
            return;
        }

        const progressContainer = document.getElementById('upload-progress');
        const progressBar = document.getElementById('upload-bar');
        const progressText = document.getElementById('upload-percentage');

        // Mostrar progreso
        progressContainer.classList.remove('hidden');
        progressBar.style.width = '0%';
        progressText.textContent = '0%';

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.uploadFile('/files/upload', formData, (progress) => {
                progressBar.style.width = `${progress}%`;
                progressText.textContent = `${progress}%`;
            });

            if (response.success) {
                showNotification('Archivo subido exitosamente', 'success');
                await this.loadFiles();
                await this.loadStorageInfo();
                
                // Limpiar input
                document.getElementById('file-input').value = '';
            } else {
                showNotification(response.message || 'Error al subir el archivo', 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showNotification(error.message || 'Error al subir el archivo', 'error');
        } finally {
            progressContainer.classList.add('hidden');
        }
    }

    async downloadFile(fileId, filename) {
        try {
            const response = await fetch(`${api.baseURL}/files/${fileId}/download`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                showNotification('Archivo descargado exitosamente', 'success');
            } else {
                throw new Error('Error al descargar el archivo');
            }
        } catch (error) {
            console.error('Download error:', error);
            showNotification('Error al descargar el archivo', 'error');
        }
    }

    showDeleteModal(fileId, filename) {
        this.currentDeleteFile = { id: fileId, name: filename };
        document.getElementById('delete-filename').textContent = filename;
        document.getElementById('delete-modal').classList.remove('hidden');
    }

    closeDeleteModal() {
        this.currentDeleteFile = null;
        document.getElementById('delete-modal').classList.add('hidden');
    }

    async confirmDelete() {
        if (!this.currentDeleteFile) return;

        try {
            const response = await api.delete(`/files/${this.currentDeleteFile.id}`);
            
            if (response.message) {
                showNotification('Archivo eliminado exitosamente', 'success');
                await this.loadFiles();
                await this.loadStorageInfo();
            }
        } catch (error) {
            console.error('Delete error:', error);
            showNotification('Error al eliminar el archivo', 'error');
        } finally {
            this.closeDeleteModal();
        }
    }

    logout() {
        localStorage.removeItem('token');
        window.location.href = '../index.html';
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.userPanel = new UserPanel();
});