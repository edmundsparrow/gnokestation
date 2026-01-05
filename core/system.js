// system.js
// Gnoke Station System Services Manager (twin of drivers.js)
// Manages OS-level utilities: Control Panel, Debug Viewer, Settings, System Monitor, etc.
// Version: 1.0.0
// License: GPL-3.0

;(() => {
  'use strict';

  // IMPORTANT: The file loader will try to load modules from these directories in order.
  const SYSTEM_DIR = ['system/', 'update/'];

  // Available system modules (rename/add as needed)
  const SYSTEM_MODULES = [
  
  'about.js',
  'app-manager.js',
  'calendar.js',
  'clock.js',
  'debug.js',
  'docs.js',
  'email.js',
  'recommended.js',
  'terminal.js',
  ];

  // Core System Services Manager
  window.SystemManager = {
    version: '1.0.0',
    services: new Map(),
    initialized: false,

    // Load stats
    stats: {
      loaded: 0,
      failed: 0,
      total: 0
    },

    // Initialize system manager and load modules
    async init() {
      if (this.initialized) {
        console.warn('[System] Already initialized');
        return;
      }

      console.log('[System] Initializing System Manager...');
      this.stats.total = SYSTEM_MODULES.length;

      for (const file of SYSTEM_MODULES) {
        let loadedSuccessfully = false;
        let lastError = null;

        // Try to load the module from each directory in SYSTEM_DIR
        for (const dir of SYSTEM_DIR) {
          const path = dir + file;
          try {
            await this.loadModule(path);
            this.stats.loaded++;
            console.log(`[System] ✓ Loaded: ${file} from ${dir}`);
            loadedSuccessfully = true;
            break; // Stop trying directories once successfully loaded
          } catch (err) {
            lastError = err;
            console.warn(`[System] ↻ Attempt failed: ${path}`);
          }
        }

        // If after checking all directories, the module hasn't loaded
        if (!loadedSuccessfully) {
          this.stats.failed++;
          const errorMessage = lastError && lastError.message ? lastError.message : 'Unknown error during load attempts.';
          console.warn(`[System] ✗ Failed: ${file} (All paths failed). Error: ${errorMessage}`);
        }
      }

      this.initialized = true;
      console.log(`[System] Initialization complete: ${this.stats.loaded}/${this.stats.total} modules loaded`);

      // Emit events for system readiness
      if (window.EventBus) {
        window.EventBus.emit('system-ready', {
          loaded: this.stats.loaded,
          failed: this.stats.failed,
          total: this.stats.total
        });
      }

      window.dispatchEvent(new CustomEvent('gnoke:system-ready', {
        detail: { stats: this.stats, services: Array.from(this.services.keys()) }
      }));
    },

    // Dynamically load a single module script
    loadModule(src) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;

        script.onload = () => resolve();
        script.onerror = (ev) => reject(new Error(`Failed to load ${src}`));

        document.head.appendChild(script);
      });
    },

    // Register a service (called by each system module)
    register(config) {
      if (!config || !config.name) {
        console.error('[System] Invalid service config:', config);
        return false;
      }

      // Normalize default service methods
      const service = {
        name: config.name,
        version: config.version || '1.0.0',
        description: config.description || '',
        category: config.category || 'system',
        // lifecycle hooks
        init: config.init || (() => Promise.resolve()),
        open: config.open || (() => { console.warn(`[System] ${config.name} has no open() method`); }),
        close: config.close || (() => { /* no-op */ }),
        configure: config.configure || (() => Promise.resolve()),
        enable: config.enable || (() => { service.enabled = true; }),
        disable: config.disable || (() => { service.enabled = false; }),
        status: config.status || (() => ({ enabled: service.enabled || false })),

        // state
        enabled: typeof config.enabled === 'boolean' ? config.enabled : true,
        initialized: false,
        lastError: null,

        // custom methods/properties
        ...config.methods
      };

      this.services.set(config.name, service);
      console.log(`[System] Registered service: ${config.name} (${service.category})`);
      return true;
    },

    // Initialize a specific service by name
    async initService(name, options = {}) {
      const svc = this.get(name);
      if (!svc) throw new Error(`Service not found: ${name}`);
      if (svc.initialized) return;

      try {
        await svc.init(options);
        svc.initialized = true;
        svc.lastError = null;
        console.log(`[System] Initialized service: ${name}`);

        if (window.EventBus) {
          window.EventBus.emit('service-initialized', { service: name });
        }

        window.dispatchEvent(new CustomEvent('gnoke:service-initialized', { detail: { service: name } }));
      } catch (err) {
        svc.lastError = err && err.message ? err.message : String(err);
        console.error(`[System] Initialization failed for ${name}:`, err);
        throw err;
      }
    },

    // Get a service by name
    get(name) {
      const svc = this.services.get(name);
      if (!svc) {
        console.warn(`[System] Service not found: ${name}`);
        return null;
      }
      return svc;
    },

    // Open a service UI or handler
    async open(name, ...args) {
      const svc = this.get(name);
      if (!svc) throw new Error(`Service not found: ${name}`);

      try {
        // ensure initialized
        if (!svc.initialized && svc.init) {
          await this.initService(name);
        }

        svc.open(...args);

        if (window.EventBus) {
          window.EventBus.emit('service-opened', { service: name });
        }

        window.dispatchEvent(new CustomEvent('gnoke:service-opened', { detail: { service: name } }));
        return { success: true };
      } catch (err) {
        svc.lastError = err && err.message ? err.message : String(err);
        console.error(`[System] Failed to open service ${name}:`, err);
        return { success: false, error: svc.lastError };
      }
    },

    // Close a service
    async close(name, ...args) {
      const svc = this.get(name);
      if (!svc) return;

      try {
        await svc.close(...args);
        if (window.EventBus) {
          window.EventBus.emit('service-closed', { service: name });
        }
        window.dispatchEvent(new CustomEvent('gnoke:service-closed', { detail: { service: name } }));
        console.log(`[System] Closed service: ${name}`);
      } catch (err) {
        svc.lastError = err && err.message ? err.message : String(err);
        console.error(`[System] Failed to close ${name}:`, err);
      }
    },

    // Configure a service
    async configure(name, settings = {}) {
      const svc = this.get(name);
      if (!svc) throw new Error(`Service not found: ${name}`);

      try {
        const result = await svc.configure(settings);
        if (window.EventBus) {
          window.EventBus.emit('service-configured', { service: name, settings });
        }
        return { success: true, result };
      } catch (err) {
        svc.lastError = err && err.message ? err.message : String(err);
        console.error(`[System] Failed to configure ${name}:`, err);
        return { success: false, error: svc.lastError };
      }
    },

    // Enable a service
    enable(name) {
      const svc = this.get(name);
      if (!svc) return false;
      try {
        svc.enable();
        svc.enabled = true;
        if (window.EventBus) window.EventBus.emit('service-enabled', { service: name });
        console.log(`[System] Service enabled: ${name}`);
        return true;
      } catch (err) {
        svc.lastError = err && err.message ? err.message : String(err);
        console.error(`[System] Failed to enable ${name}:`, err);
        return false;
      }
    },

    // Disable a service
    disable(name) {
      const svc = this.get(name);
      if (!svc) return false;
      try {
        svc.disable();
        svc.enabled = false;
        if (window.EventBus) window.EventBus.emit('service-disabled', { service: name });
        console.log(`[System] Service disabled: ${name}`);
        return true;
      } catch (err) {
        svc.lastError = err && err.message ? err.message : String(err);
        console.error(`[System] Failed to disable ${name}:`, err);
        return false;
      }
    },

    // Get status for a service
    getStatus(name) {
      const svc = this.get(name);
      if (!svc) return null;
      return {
        name: svc.name,
        version: svc.version,
        description: svc.description,
        category: svc.category,
        enabled: svc.enabled,
        initialized: svc.initialized,
        lastError: svc.lastError
      };
    },

    // Get statuses for all services
    getAllStatus() {
      const status = {};
      for (const [name, svc] of this.services) {
        status[name] = this.getStatus(name);
      }
      return status;
    },

    // List registered services
    list() {
      return Array.from(this.services.keys());
    },

    // Debug helper (exposed globally)
    debug() {
      console.log('System Services Status:', this.getAllStatus());
      console.log('Load Stats:', this.stats);
      return this.getAllStatus();
    }
  };

  // Auto-initialize on DOM ready
  const initSystem = () => {
    if (window.SystemManager && !window.SystemManager.initialized) {
      window.SystemManager.init();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSystem);
  } else {
    setTimeout(initSystem, 100);
  }

  // Convenience global helper
  window.sysDebug = () => window.SystemManager.debug();

  console.log('[System] System Manager loaded');

})();