// utils/preloader.js - Sistema de preloader para operaciones asíncronas

export class PreloaderManager {
  constructor() {
    this.isLoaded = false;
    this.currentOperation = null;
  }

  // Cargar el componente de preloader
  async loadPreloader() {
    if (this.isLoaded) return;

    try {
      const response = await fetch('/src/components/preloader.html');
      const html = await response.text();
      
      // Agregar al body
      document.body.insertAdjacentHTML('beforeend', html);
      this.isLoaded = true;
      
    } catch (error) {
      console.error('Error cargando preloader:', error);
    }
  }

  // Mostrar preloader con mensaje personalizado
  show(title = 'Cargando...', message = 'Por favor espera mientras procesamos tu solicitud') {
    if (!this.isLoaded) {
      console.warn('Preloader no ha sido cargado aún');
      return;
    }

    const preloader = document.getElementById('preloader');
    const titleElement = document.getElementById('preloader-title');
    const messageElement = document.getElementById('preloader-message');
    
    if (preloader && titleElement && messageElement) {
      titleElement.textContent = title;
      messageElement.textContent = message;
      preloader.classList.remove('hidden');
      
      // Prevenir scroll del body
      document.body.style.overflow = 'hidden';
    }
  }

  // Ocultar preloader
  hide() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.classList.add('hidden');
      
      // Restaurar scroll del body
      document.body.style.overflow = '';
      
      this.hideProgress();
    }
  }

  // Mostrar barra de progreso
  showProgress() {
    const progressContainer = document.getElementById('preloader-progress');
    if (progressContainer) {
      progressContainer.classList.remove('hidden');
    }
  }

  // Ocultar barra de progreso
  hideProgress() {
    const progressContainer = document.getElementById('preloader-progress');
    if (progressContainer) {
      progressContainer.classList.add('hidden');
    }
  }

  // Actualizar progreso (0-100)
  updateProgress(percentage) {
    const progressBar = document.getElementById('preloader-bar');
    const progressText = document.getElementById('preloader-percentage');
    
    if (progressBar && progressText) {
      const clampedPercentage = Math.max(0, Math.min(100, percentage));
      progressBar.style.width = `${clampedPercentage}%`;
      progressText.textContent = `${Math.round(clampedPercentage)}%`;
    }
  }

  // Wrapper para operaciones asíncronas con preloader
  async withPreloader(operation, title, message) {
    try {
      this.show(title, message);
      const result = await operation();
      return result;
    } catch (error) {
      console.error('Error en operación con preloader:', error);
      throw error;
    } finally {
      this.hide();
    }
  }

  // Wrapper para múltiples operaciones con progreso
  async withProgress(operations, title = 'Procesando...') {
    try {
      this.show(title, 'Iniciando operaciones...');
      this.showProgress();
      
      const results = [];
      const total = operations.length;
      
      for (let i = 0; i < total; i++) {
        const progress = ((i + 1) / total) * 100;
        this.updateProgress(progress);
        
        if (operations[i].message) {
          document.getElementById('preloader-message').textContent = operations[i].message;
        }
        
        const result = await operations[i].operation();
        results.push(result);
      }
      
      return results;
    } catch (error) {
      console.error('Error en operaciones con progreso:', error);
      throw error;
    } finally {
      this.hide();
    }
  }
}

// Instancia singleton
export const Preloader = new PreloaderManager();

// Preloader específicos para diferentes operaciones
export const PreloaderMessages = {
  LOGIN: {
    title: 'Iniciando Sesión',
    message: 'Verificando credenciales...'
  },
  REGISTER: {
    title: 'Creando Cuenta',
    message: 'Registrando nuevo usuario...'
  },
  LOADING_GROUPS: {
    title: 'Cargando Grupos',
    message: 'Obteniendo lista de grupos...'
  },
  CREATING_GROUP: {
    title: 'Creando Grupo',
    message: 'Guardando nuevo grupo...'
  },
  UPDATING_GROUP: {
    title: 'Actualizando Grupo',
    message: 'Guardando cambios...'
  },
  DELETING_GROUP: {
    title: 'Eliminando Grupo',
    message: 'Eliminando grupo seleccionado...'
  },
  LOADING_DASHBOARD: {
    title: 'Cargando Dashboard',
    message: 'Preparando tu panel de control...'
  }
};