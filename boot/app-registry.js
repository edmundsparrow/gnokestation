/*
 * Gnokestation Shell
 * Copyright (C) 2025 Ekong Ikpe <ekongmikpe@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

/* ========================================
 * FILE: boot/app-registry.js
 * VERSION: 1.0.0
 * BUILD DATE: 2025-09-29
 *
 * PURPOSE:
 * Core service for managing the lifecycle of all desktop
 * applications in gnoke Station, including registration,
 * launching, and tracking running instances.
 *
 * ARCHITECTURE:
 * - Singleton object exposed as window.AppRegistry.
 * - Map-based storage for app configurations and running instances.
 * - Handles single-instance logic and instance cleanup via EventBus.
 *
 * DEPENDENCIES:
 * - EventBus (for emitting lifecycle events and cleanup).
 * - WindowManager (for focusing/restoring existing instances).
 *
 * LIFECYCLE:
 * 1. Loaded after EventBus and WindowManager.
 * 2. Provides API for other modules (e.g., AppLoader, Taskbar)
 * to interact with applications.
 *
 * FEATURES:
 * - Register apps with configuration (ID, name, handler).
 * - Launch apps, supporting single-instance mode.
 * - Automatic cleanup of stale single-instance references.
 * - Provides default icon data for unregistered apps.
 * - Emits key lifecycle events via EventBus.
 *
 * EXAMPLE USAGE:
 * AppRegistry.registerApp({ id: 'term', name: 'Terminal', handler: () => WindowManager.createWindow(...) });
 * AppRegistry.openApp('term');
 *
 * AUTHOR:
 * [Your Author Information]
 * ======================================== */

window.AppRegistry = {
    registeredApps: new Map(),
    runningInstances: new Map(),
    
    // Register new application
    registerApp(appConfig) {
        // Validate app configuration
        if (!this.validateAppConfig(appConfig)) {
            console.error('AppRegistry.registerApp: Invalid app configuration', appConfig);
            return false;
        }
        
        this.registeredApps.set(appConfig.id, appConfig);
        
        // Emit registration event
        if (window.EventBus) {
            window.EventBus.emit('app-registered', appConfig);
        }
        
        console.log(`App registered: ${appConfig.name} (${appConfig.id})`);
        return true;
    },
    
    // Launch application
    openApp(appId) {
        const app = this.registeredApps.get(appId);
        if (!app) {
            console.error(`App not found: ${appId}`);
            return null;
        }
        
        // Check for single instance
        if (app.singleInstance && this.runningInstances.has(appId)) {
            const existingInstance = this.runningInstances.get(appId);
            if (existingInstance && existingInstance.parentNode) {
                // Focus existing instance
                if (window.WindowManager) {
                    if (existingInstance.style.display === 'none') {
                        window.WindowManager.restoreWindow(existingInstance.id);
                    } else {
                        window.WindowManager.bringToFront(existingInstance);
                    }
                }
                return existingInstance;
            } else {
                // Clean up stale reference
                this.runningInstances.delete(appId);
            }
        }
        
        // Launch app
        try {
            const instance = app.handler();
            
            if (instance && instance.nodeType === Node.ELEMENT_NODE) {
                // Track single instance apps
                if (app.singleInstance) {
                    this.runningInstances.set(appId, instance);
                    
                    // Setup cleanup when window closes
                    if (window.EventBus) {
                        const cleanup = (data) => {
                            // Check if the closed window is the instance we tracked
                            if (data.windowId === instance.id) {
                                this.runningInstances.delete(appId);
                                window.EventBus.off('window-closed', cleanup);
                            }
                        };
                        window.EventBus.on('window-closed', cleanup);
                    }
                }
                
                // Emit app launch event
                if (window.EventBus) {
                    window.EventBus.emit('app-launched', { appId, instance });
                }
                
                return instance;
            }
            
        } catch (error) {
            console.error(`Failed to launch app ${appId}:`, error);
        }
        
        return null;
    },
    
    // Validate app configuration
    validateAppConfig(config) {
        if (!config || typeof config !== 'object') return false;
        if (!config.id || typeof config.id !== 'string') return false;
        if (!config.name || typeof config.name !== 'string') return false;
        if (!config.handler || typeof config.handler !== 'function') return false;
        return true;
    },
    
    // Get all registered apps
    getAllApps() {
        return Array.from(this.registeredApps.values());
    },
    
    // Get specific app
    getApp(appId) {
        return this.registeredApps.get(appId);
    },
    
    // Check if app is running
    isAppRunning(appId) {
        return this.runningInstances.has(appId);
    },
    
    // Get running instance
    getRunningInstance(appId) {
        return this.runningInstances.get(appId);
    }
};

// Auto-register default icon provider
window.AppRegistry.getDefaultIcon = function() {
    return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' rx='8' fill='%23666'/><text x='24' y='30' text-anchor='middle' font-size='12' fill='white'>App</text></svg>";
};

// Register documentation with Docs service - wait for it to be ready
(function registerAppRegistryDoc() {
  const tryRegister = () => {
    // Check if Docs service is available and ready
    if (window.Docs && window.Docs.initialized && typeof window.Docs.register === 'function') {
      window.Docs.register('app-registry', {
        name: "AppRegistry",
        version: "1.0.0",
        description: "Core service for managing the lifecycle, registration, and launching of all desktop applications.",
        type: "System Service",
        dependencies: ["EventBus", "WindowManager"],
        features: [
          "Global singleton (window.AppRegistry)",
          "Application registration and validation.",
          "Handles app launching and tracking of running instances.",
          "Enforces single-instance app mode.",
          "Automatic cleanup of running instance tracking on window close."
        ],
        methods: [
          { name: "registerApp(appConfig)", description: "Adds a new application to the registry." },
          { name: "openApp(appId)", description: "Launches or focuses a registered application." },
          { name: "getAllApps()", description: "Returns an array of all registered app configurations." },
          { name: "isAppRunning(appId)", description: "Checks if a specific app instance is currently running." },
          { name: "getDefaultIcon()", description: "Returns a default SVG icon data URI for generic apps." }
        ],
        events: [
          "app-registered", "app-launched"
        ],
        autoGenerated: false
      });
      console.log('AppRegistry documentation registered with Docs service');
      return true;
    }
    return false;
  };

  // Try immediate registration
  if (tryRegister()) return;

  // Wait for docs-ready event via EventBus (AppRegistry must load after EventBus)
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

