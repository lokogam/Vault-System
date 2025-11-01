// main.js - Punto de entrada principal de la aplicación
import './style.css'
import { config, logger } from './config/env.js'

// Importar módulos principales
import { Auth, Storage } from './modules/auth.js'
import { PageManager } from './modules/dashboard.js'
import { GroupManager } from './modules/groups.js'
import { UserManager } from './modules/users.js'
import { FormHandlers } from './modules/forms.js'

// Importar utilidades
import { ModalManager } from './utils/modal.js'
import { Http } from './utils/http.js'
import { ComponentLoader } from './utils/component-loader.js'
import { Preloader, PreloaderMessages } from './utils/preloader.js'
import { AppRouter } from './utils/router.js'
import { NotificationManager } from './utils/notifications.js'

// Estado global de la aplicación
window.AppState = {
  user: null,
  token: null,
  currentPage: 'login',
  currentTab: 'dashboard'
};

// Hacer disponibles los módulos globalmente
window.Auth = Auth;
window.PageManager = PageManager;
window.GroupManager = GroupManager;
window.UserManager = UserManager;
window.Storage = Storage;
window.ModalManager = ModalManager;
window.Http = Http;
window.ComponentLoader = ComponentLoader;
window.Preloader = Preloader;
window.PreloaderMessages = PreloaderMessages;
window.AppRouter = AppRouter;
window.NotificationManager = NotificationManager;

// Inicialización de la aplicación
async function initializeApp() {
  try {
    
    // 1. Cargar el preloader primero usando ComponentLoader
    await ComponentLoader.loadPreloader();
    
    // 2. Marcar el preloader como cargado en la instancia
    window.Preloader.isLoaded = true;
    
    // 3. Cargar todos los componentes HTML
    await ComponentLoader.loadAllPages();
    await ComponentLoader.loadAllModals();
    
    // 4. Cargar token y usuario del localStorage
    Storage.getToken();
    Storage.getUser();
    
    // 5. Configurar event listeners
    FormHandlers.setupAllForms();
    PageManager.setupNavigationEventListeners();
    GroupManager.setupEventListeners();
    UserManager.setupEventListeners();
    
    
    
  } catch (error) {
    logger.error('Error inicializando la aplicación:', error);
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initializeApp);

// Exportar para depuración
window.SecureVault = {
  AppState: window.AppState,
  Auth,
  PageManager,
  Http,
  Storage,
  GroupManager,
  UserManager,
  ModalManager,
  ComponentLoader,
  NotificationManager
};