import { api } from '../config/api.js';
import { showNotification } from '../components/notification.js';

class Configuration {
    constructor() {
        this.restrictions = [];
        this.currentRestriction = null;
        this.init();
    }

    async init() {
        // Verificar autenticación y rol de administrador
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '../index.html';
            return;
        }

        try {
            const userResponse = await api.get('/user/me');
            if (!userResponse.user.roles.some(role => role.name === 'Administrador')) {
                showNotification('Acceso denegado. Se requieren permisos de administrador.', 'error');
                setTimeout(() => {
                    window.location.href = 'user-panel.html';
                }, 2000);
                return;
            }
        } catch (error) {
            window.location.href = '../index.html';
            return;
        }

        this.setupEventListeners();
        await this.loadRestrictions();
        await this.loadSystemInfo();
    }

    setupEventListeners() {
        // Logout
        document.getElementById('logout-btn').addEventListener('click', this.logout.bind(this));

        // Restriction management
        document.getElementById('add-restriction-btn').addEventListener('click', this.showAddRestrictionModal.bind(this));
        document.getElementById('cancel-restriction').addEventListener('click', this.closeRestrictionModal.bind(this));
        document.getElementById('restriction-form').addEventListener('submit', this.saveRestriction.bind(this));

        // Storage limits
        document.getElementById('update-default-limit').addEventListener('click', this.updateDefaultLimit.bind(this));
        document.getElementById('update-user-limit').addEventListener('click', this.updateUserLimit.bind(this));
    }

    async loadRestrictions() {
        const loadingElement = document.getElementById('restrictions-loading');
        const tableElement = document.getElementById('restrictions-table');

        loadingElement.classList.remove('hidden');
        tableElement.classList.add('hidden');

        try {
            const response = await api.get('/file-restrictions');
            this.restrictions = response.data || response.restrictions || [];
            this.renderRestrictionsTable();
            tableElement.classList.remove('hidden');
        } catch (error) {
            console.error('Error loading restrictions:', error);
            showNotification('Error al cargar las restricciones', 'error');
        } finally {
            loadingElement.classList.add('hidden');
        }
    }

    renderRestrictionsTable() {
        const tbody = document.getElementById('restrictions-tbody');
        tbody.innerHTML = '';

        if (this.restrictions.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="4" class="px-6 py-4 text-center text-gray-500">
                    No hay restricciones configuradas
                </td>
            `;
            tbody.appendChild(row);
            return;
        }

        this.restrictions.forEach(restriction => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';

            const statusClass = restriction.is_prohibited ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
            const statusText = restriction.is_prohibited ? 'Prohibido' : 'Permitido';

            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="font-mono text-sm bg-gray-100 px-2 py-1 rounded">.${restriction.extension}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
                        ${statusText}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">${restriction.description || 'Sin descripción'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button onclick="configuration.editRestriction(${restriction.id})" 
                                class="text-blue-600 hover:text-blue-900 transition">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="configuration.deleteRestriction(${restriction.id})" 
                                class="text-red-600 hover:text-red-900 transition">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;

            tbody.appendChild(row);
        });
    }

    showAddRestrictionModal() {
        this.currentRestriction = null;
        document.getElementById('modal-title').textContent = 'Agregar Restricción';
        document.getElementById('extension-input').value = '';
        document.getElementById('status-select').value = '1'; // Prohibido por defecto
        document.getElementById('description-input').value = '';
        document.getElementById('restriction-modal').classList.remove('hidden');
    }

    editRestriction(id) {
        const restriction = this.restrictions.find(r => r.id === id);
        if (!restriction) return;

        this.currentRestriction = restriction;
        document.getElementById('modal-title').textContent = 'Editar Restricción';
        document.getElementById('extension-input').value = restriction.extension;
        document.getElementById('status-select').value = restriction.is_prohibited ? '1' : '0';
        document.getElementById('description-input').value = restriction.description || '';
        document.getElementById('restriction-modal').classList.remove('hidden');
    }

    closeRestrictionModal() {
        this.currentRestriction = null;
        document.getElementById('restriction-modal').classList.add('hidden');
    }

    async saveRestriction(e) {
        e.preventDefault();

        const extension = document.getElementById('extension-input').value.trim().toLowerCase();
        const isProhibited = document.getElementById('status-select').value === '1';
        const description = document.getElementById('description-input').value.trim();

        // Limpiar extensión (remover punto si existe)
        const cleanExtension = extension.replace(/^\./, '');

        if (!cleanExtension) {
            showNotification('La extensión es requerida', 'error');
            return;
        }

        try {
            const data = {
                extension: cleanExtension,
                is_prohibited: isProhibited,
                description: description || null
            };

            if (this.currentRestriction) {
                // Actualizar
                await api.put(`/file-restrictions/${this.currentRestriction.id}`, data);
                showNotification('Restricción actualizada exitosamente', 'success');
            } else {
                // Crear nueva
                await api.post('/file-restrictions', data);
                showNotification('Restricción creada exitosamente', 'success');
            }

            await this.loadRestrictions();
            this.closeRestrictionModal();
        } catch (error) {
            console.error('Error saving restriction:', error);
            showNotification(error.message || 'Error al guardar la restricción', 'error');
        }
    }

    async deleteRestriction(id) {
        if (!confirm('¿Estás seguro de que deseas eliminar esta restricción?')) {
            return;
        }

        try {
            await api.delete(`/file-restrictions/${id}`);
            showNotification('Restricción eliminada exitosamente', 'success');
            await this.loadRestrictions();
        } catch (error) {
            console.error('Error deleting restriction:', error);
            showNotification('Error al eliminar la restricción', 'error');
        }
    }

    async updateDefaultLimit() {
        const limit = document.getElementById('default-limit').value;
        
        if (!limit || limit < 1) {
            showNotification('El límite debe ser mayor a 0 MB', 'error');
            return;
        }

        try {
            // Este endpoint necesitaría implementarse en el backend
            // await api.post('/admin/default-storage-limit', { limit: limit * 1024 * 1024 });
            showNotification('Esta funcionalidad requiere implementación adicional en el backend', 'info');
        } catch (error) {
            console.error('Error updating default limit:', error);
            showNotification('Error al actualizar el límite por defecto', 'error');
        }
    }

    async updateUserLimit() {
        const email = document.getElementById('user-email').value.trim();
        const limit = document.getElementById('user-limit').value;

        if (!email || !limit || limit < 1) {
            showNotification('El email y límite son requeridos', 'error');
            return;
        }

        try {
            // Primero buscar el usuario por email
            const usersResponse = await api.get('/users');
            const user = usersResponse.users?.find(u => u.email === email);
            
            if (!user) {
                showNotification('Usuario no encontrado', 'error');
                return;
            }

            // Actualizar límite
            await api.put(`/users/${user.id}/storage-limit`, {
                storage_limit: limit * 1024 * 1024 // Convertir MB a bytes
            });

            showNotification(`Límite de almacenamiento actualizado para ${email}`, 'success');
            
            // Limpiar campos
            document.getElementById('user-email').value = '';
            document.getElementById('user-limit').value = '';
        } catch (error) {
            console.error('Error updating user limit:', error);
            showNotification(error.message || 'Error al actualizar el límite del usuario', 'error');
        }
    }

    async loadSystemInfo() {
        try {
            // Cargar estadísticas del sistema
            const [usersResponse, filesResponse] = await Promise.all([
                api.get('/users'),
                api.get('/admin/files')
            ]);

            // Actualizar estadísticas
            document.getElementById('total-users').textContent = usersResponse.users?.length || 0;
            document.getElementById('total-files').textContent = filesResponse.data?.length || filesResponse.total || 0;
            
            // Calcular almacenamiento total usado
            if (usersResponse.users) {
                const totalStorage = usersResponse.users.reduce((total, user) => {
                    return total + (user.storage_used || 0);
                }, 0);
                document.getElementById('total-storage').textContent = this.formatBytes(totalStorage);
            }
        } catch (error) {
            console.error('Error loading system info:', error);
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    logout() {
        localStorage.removeItem('token');
        window.location.href = '../index.html';
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.configuration = new Configuration();
});