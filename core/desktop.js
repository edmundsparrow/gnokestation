/* ========================================
 * FILE: core/desktop.js
 * VERSION: 1.0.0
 * BUILD DATE: 2025-09-29
 *
 * PURPOSE:
 * Core UI component responsible for the visual desktop surface,
 * including wallpaper, desktop icons, and overall container
 * management.
 *
 * ARCHITECTURE:
 * - Singleton object exposed as window.Desktop.
 * - Handles the root 'desktop' container element.
 * - Manages desktop icons based on AppRegistry configuration.
 *
 * DEPENDENCIES:
 * - WindowManager (passed into constructor/init for window containment)
 * - AppRegistry (to fetch list of apps to display as icons)
 * - EventBus (for documentation registration)
 *
 * LIFECYCLE:
 * 1. Instantiated and initialized after core services (EventBus, WindowManager, AppRegistry).
 * 2. Creates the main 'desktop' container and renders wallpaper.
 * 3. Populates desktop icons upon initialization.
 *
 * FEATURES:
 * - Creates the primary desktop container.
 * - Renders customizable wallpaper.
 * - Dynamically loads icons for desktop-enabled apps.
 * - Icons launch apps via AppRegistry.
 *
 * EXAMPLE USAGE:
 * // Assumes it is initialized later by a core loader.
 * // e.g., new window.Desktop(window.WindowManager).init();
 *
 * AUTHOR:
 * Edmundsparrow.netlify.app | whatsappme @ 09024054758 | webaplications5050@gmail.com
 * ======================================== */

class Desktop {
  constructor(windowManager) {
    this.windowManager = windowManager;
    this.wallpaper = "url('default-wallpaper.jpg')";
    this.icons = [];
    this.container = null; // Will be set in createDesktopContainer
  }

  init() {
    // Initialize the desktop UI
    this.createDesktopContainer();
    this.renderWallpaper();
    // Desktop must be fully loaded before trying to load icons
    // which depend on the DOM container being ready.
    this.loadIcons(); 
    
    console.log('Desktop UI initialized.');
  }

  createDesktopContainer() {
    const container = document.createElement("div");
    container.id = "desktop";
    container.className = "desktop";
    document.body.appendChild(container);
    this.container = container;
    
    // Create the windows container, which sits on top of the wallpaper/icons
    const windowsContainer = document.createElement("div");
    windowsContainer.id = "windows-container";
    windowsContainer.className = "windows-container";
    this.container.appendChild(windowsContainer);
  }

  renderWallpaper() {
    if (this.container) {
      this.container.style.backgroundImage = this.wallpaper;
      this.container.style.backgroundSize = "cover";
      this.container.style.backgroundPosition = "center";
    }
  }

  loadIcons() {
    // Ensure AppRegistry exists and has the required function
    if (!window.AppRegistry || typeof window.AppRegistry.getAllApps !== 'function') {
        console.warn('Desktop.loadIcons: AppRegistry not available.');
        return;
    }
    
    const apps = window.AppRegistry.getAllApps();
    apps.forEach(app => {
      // Assuming app config includes a 'showOnDesktop' boolean
      if (app.showOnDesktop) {
        this.addIcon(app);
      }
    });
  }

  addIcon(app) {
    if (!this.container) return;
    
    const icon = document.createElement("div");
    icon.className = "desktop-icon";
    // Use the app's icon or a default placeholder
    const iconImage = app.icon || window.AppRegistry.getDefaultIcon() || "📦";
    
    icon.innerHTML = `<img src="${iconImage}" alt="${app.name} icon" class="icon-image">
                      <div class="label">${app.name}</div>`;
                      
    icon.onclick = () => {
        if (window.AppRegistry) {
            window.AppRegistry.openApp(app.id);
        }
    };
    
    this.container.appendChild(icon);
    this.icons.push(icon);
  }
}

// Export the class definition so it can be instantiated later by the core loader.
window.DesktopClass = Desktop;

// Register documentation with Docs service - wait for it to be ready
(function registerDesktopDoc() {
  const tryRegister = () => {
    // Check if Docs service is available and ready
    if (window.Docs && window.Docs.initialized && typeof window.Docs.register === 'function') {
      window.Docs.register('desktop-ui', {
        name: "Desktop",
        version: "1.0.0",
        description: "The main UI component for the desktop environment, managing the wallpaper, desktop container, and clickable icons.",
        type: "System Component",
        dependencies: ["WindowManager", "AppRegistry"],
        features: [
          "Creates the root #desktop and #windows-container elements.",
          "Renders the background wallpaper.",
          "Dynamically loads and renders desktop icons from AppRegistry.",
          "Icons act as launchers for applications."
        ],
        methods: [
          { name: "init()", description: "Initializes the desktop UI, renders the container and loads icons." },
          { name: "loadIcons()", description: "Fetches apps from AppRegistry and creates desktop icons for them." },
          { name: "renderWallpaper()", description: "Applies the current wallpaper setting to the container." }
        ],
        autoGenerated: false
      });
      console.log('Desktop documentation registered with Docs service');
      return true;
    }
    return false;
  };

  // Try immediate registration
  if (tryRegister()) return;

  // Wait for docs-ready event via EventBus (Desktop loads after EventBus)
  if (window.EventBus) {
    const onDocsReady = () => {
      if (tryRegister()) {
        window.EventBus.off('docs-ready', onDocsReady);
      }
    };
    window.EventBus.on('docs-ready', onDocsReady);
  }

  // Fallback: poll for Docs initialization
  let attempts = 0;
  const pollInterval = setInterval(() => {
    if (tryRegister() || attempts++ > 50) {
      clearInterval(pollInterval);
    }
  }, 100);
})();
