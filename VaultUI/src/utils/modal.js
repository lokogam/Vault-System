// modal.js - Sistema de modales reutilizables

export const ModalManager = {
  /**
   * Muestra un modal de confirmación
   * @param {Object} options - Configuración del modal
   * @param {string} options.title - Título del modal
   * @param {string} options.message - Mensaje de confirmación
   * @param {string} options.confirmText - Texto del botón de confirmación (opcional)
   * @param {string} options.cancelText - Texto del botón de cancelación (opcional)
   * @param {string} options.type - Tipo de modal: 'danger', 'warning', 'info' (opcional)
   * @returns {Promise<boolean>} - true si se confirma, false si se cancela
   */
  showConfirmDialog(options = {}) {
    return new Promise((resolve) => {
      const {
        title = 'Confirmar Acción',
        message = '¿Estás seguro de que quieres realizar esta acción?',
        confirmText = 'Confirmar',
        cancelText = 'Cancelar',
        type = 'danger'
      } = options;

      // Configurar elementos del modal
      const modal = document.getElementById('confirm-modal');
      const titleEl = document.getElementById('confirm-title');
      const messageEl = document.getElementById('confirm-message');
      const confirmBtn = document.getElementById('confirm-action-btn');
      const cancelBtn = document.getElementById('confirm-cancel-btn');

      // Actualizar contenido
      titleEl.textContent = title;
      messageEl.textContent = message;
      confirmBtn.textContent = confirmText;
      cancelBtn.textContent = cancelText;

      // Mostrar/ocultar botón cancelar si es null
      if (cancelText === null) {
        cancelBtn.style.display = 'none';
      } else {
        cancelBtn.style.display = 'inline-block';
      }

      // Configurar estilos según el tipo
      this.setConfirmButtonStyle(confirmBtn, type);

      // Mostrar modal
      modal.classList.remove('hidden');

      // Manejar eventos (una sola vez)
      const handleConfirm = () => {
        modal.classList.add('hidden');
        cleanup();
        resolve(true);
      };

      const handleCancel = () => {
        modal.classList.add('hidden');
        cleanup();
        resolve(false);
      };

      const handleClickOutside = (e) => {
        if (e.target.id === 'confirm-modal') {
          handleCancel();
        }
      };

      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          handleCancel();
        }
      };

      // Agregar listeners
      confirmBtn.addEventListener('click', handleConfirm);
      cancelBtn.addEventListener('click', handleCancel);
      modal.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscape);

      // Función para limpiar listeners
      const cleanup = () => {
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        modal.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };

      // Focus en el botón de cancelar por defecto (más seguro)
      cancelBtn.focus();
    });
  },

  setConfirmButtonStyle(button, type) {
    // Limpiar clases existentes
    button.className = button.className.replace(/bg-\w+-\d+/g, '').replace(/hover:bg-\w+-\d+/g, '');
    
    switch (type) {
      case 'danger':
        button.classList.add('bg-red-600', 'hover:bg-red-700');
        break;
      case 'warning':
        button.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
        break;
      case 'info':
        button.classList.add('bg-blue-600', 'hover:bg-blue-700');
        break;
      default:
        button.classList.add('bg-red-600', 'hover:bg-red-700');
    }
  },

  /**
   * Muestra un modal de confirmación para eliminar
   * @param {string} itemName - Nombre del elemento a eliminar
   * @param {string} itemType - Tipo de elemento (ej: "grupo", "usuario")
   * @returns {Promise<boolean>}
   */
  async confirmDelete(itemName, itemType = 'elemento') {
    return this.showConfirmDialog({
      title: `Eliminar ${itemType}`,
      message: `¿Estás seguro de que quieres eliminar "${itemName}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    });
  },

  /**
   * Muestra un modal de información/notificación
   * @param {Object} options - Configuración del modal
   */
  showAlert(options = {}) {
    return this.showConfirmDialog({
      ...options,
      cancelText: null // Solo mostrar botón de confirmación
    });
  }
};