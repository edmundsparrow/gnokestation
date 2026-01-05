// drivers.js
// Gnoke Station Hardware Abstraction Layer (HAL)
// Manages Web APIs + REST/IP fallback for hardware access
// Author: Gnoke Station
// Version: 2.0.0
// License: GPL-3.0

;(() => {
  'use strict';

  const DRIVER_DIR = 'plugins/drivers/';
  
  // Available driver modules
  const DRIVER_MODULES = [
  // 'adb.js', 
  // 'bluetooth-ble.js',
 // 'hid.js',
  'modbus-rtu.js',
 //  'network.js',
  // 'notifications.js',
  'serial.js',
 //  'storage.js',
  'wakelock.js',
  'webusb.js',
  ];

  // Core Hardware Abstraction Layer
  window.HardwareDrivers = {
    version: '2.0.0',
    drivers: new Map(),
    initialized: false,
    
    // Driver loading status
    stats: {
      loaded: 0,
      failed: 0,
      total: 0
    },

    // Initialize the HAL
    async init() {
      if (this.initialized) {
        console.warn('[HAL] Already initialized');
        return;
      }

      console.log('[HAL] Initializing Hardware Abstraction Layer...');
      this.stats.total = DRIVER_MODULES.length;

      // Load all driver modules
      for (const file of DRIVER_MODULES) {
        try {
          await this.loadDriver(DRIVER_DIR + file);
          this.stats.loaded++;
          console.log(`[HAL] ✓ Loaded: ${file}`);
        } catch (err) {
          this.stats.failed++;
          console.warn(`[HAL] ✗ Failed: ${file}`, err.message);
        }
      }

      this.initialized = true;
      console.log(`[HAL] Initialization complete: ${this.stats.loaded}/${this.stats.total} drivers loaded`);

      // Emit ready event
      if (window.EventBus) {
        window.EventBus.emit('drivers-ready', {
          loaded: this.stats.loaded,
          failed: this.stats.failed,
          total: this.stats.total
        });
      }

      window.dispatchEvent(new CustomEvent('gnoke:drivers-ready', {
        detail: { stats: this.stats, drivers: Array.from(this.drivers.keys()) }
      }));
    },

    // Load a single driver module
    loadDriver(src) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;

        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));

        document.head.appendChild(script);
      });
    },

    // Register a driver (called by individual driver files)
    register(config) {
      if (!config.name || !config.type) {
        console.error('[HAL] Invalid driver config:', config);
        return false;
      }

      const driver = {
        name: config.name,
        type: config.type, // 'webapi', 'rest', 'hybrid'
        version: config.version || '1.0.0',
        
        // Core methods
        init: config.init || (() => Promise.resolve()),
        detect: config.detect || (() => Promise.resolve(false)),
        connect: config.connect || (() => Promise.reject('Not implemented')),
        disconnect: config.disconnect || (() => Promise.resolve()),
        
        // Data methods
        read: config.read || null,
        write: config.write || null,
        
        // Fallback configuration
        fallback: config.fallback || null, // REST/IP endpoint
        useFallback: config.useFallback || false,
        
        // Status
        available: false,
        connected: false,
        lastError: null,
        
        // Custom methods
        ...config.methods
      };

      this.drivers.set(config.name, driver);
      console.log(`[HAL] Registered driver: ${config.name} (${config.type})`);
      return true;
    },

    // Get a specific driver
    get(name) {
      const driver = this.drivers.get(name);
      if (!driver) {
        console.warn(`[HAL] Driver not found: ${name}`);
        return null;
      }
      return driver;
    },

    // Check if driver is available
    async isAvailable(name) {
      const driver = this.get(name);
      if (!driver) return false;

      try {
        driver.available = await driver.detect();
        return driver.available;
      } catch (err) {
        console.error(`[HAL] Detection failed for ${name}:`, err);
        return false;
      }
    },

    // Connect to hardware (with fallback)
    async connect(name, options = {}) {
      const driver = this.get(name);
      if (!driver) {
        throw new Error(`Driver not found: ${name}`);
      }

      try {
        // Try primary method (Web API)
        if (!driver.useFallback && driver.type !== 'rest') {
          console.log(`[HAL] Connecting to ${name} via Web API...`);
          await driver.connect(options);
          driver.connected = true;
          driver.lastError = null;
          
          if (window.EventBus) {
            window.EventBus.emit('driver-connected', { driver: name, method: 'webapi' });
          }
          
          return { success: true, method: 'webapi' };
        }

        // Fallback to REST/IP
        if (driver.fallback) {
          console.log(`[HAL] Connecting to ${name} via REST fallback...`);
          const result = await this.connectREST(driver, options);
          driver.connected = result.success;
          driver.useFallback = true;
          
          if (window.EventBus) {
            window.EventBus.emit('driver-connected', { driver: name, method: 'rest' });
          }
          
          return { success: true, method: 'rest', ...result };
        }

        throw new Error('No connection method available');

      } catch (err) {
        driver.lastError = err.message;
        console.error(`[HAL] Connection failed for ${name}:`, err);

        // Try fallback if primary failed
        if (!driver.useFallback && driver.fallback && driver.type === 'hybrid') {
          console.log(`[HAL] Primary failed, trying REST fallback for ${name}...`);
          try {
            const result = await this.connectREST(driver, options);
            driver.connected = result.success;
            driver.useFallback = true;
            
            if (window.EventBus) {
              window.EventBus.emit('driver-connected', { driver: name, method: 'rest-fallback' });
            }
            
            return { success: true, method: 'rest-fallback', ...result };
          } catch (fallbackErr) {
            console.error(`[HAL] REST fallback also failed for ${name}:`, fallbackErr);
            throw new Error(`All connection methods failed: ${err.message}`);
          }
        }

        throw err;
      }
    },

    // REST/IP connection helper
    async connectREST(driver, options = {}) {
      if (!driver.fallback) {
        throw new Error('No REST fallback configured');
      }

      const endpoint = typeof driver.fallback === 'string' 
        ? driver.fallback 
        : driver.fallback.endpoint;

      const config = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect', ...options })
      };

      try {
        const response = await fetch(endpoint, config);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return { success: true, data };
      } catch (err) {
        throw new Error(`REST connection failed: ${err.message}`);
      }
    },

    // Disconnect from hardware
    async disconnect(name) {
      const driver = this.get(name);
      if (!driver) return;

      try {
        if (driver.useFallback && driver.fallback) {
          // REST disconnect
          const endpoint = typeof driver.fallback === 'string' 
            ? driver.fallback 
            : driver.fallback.endpoint;
          
          await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'disconnect' })
          });
        } else {
          // Web API disconnect
          await driver.disconnect();
        }

        driver.connected = false;
        driver.useFallback = false;

        if (window.EventBus) {
          window.EventBus.emit('driver-disconnected', { driver: name });
        }

        console.log(`[HAL] Disconnected: ${name}`);
      } catch (err) {
        console.error(`[HAL] Disconnect failed for ${name}:`, err);
      }
    },

    // Read data from hardware
    async read(name, options = {}) {
      const driver = this.get(name);
      if (!driver) throw new Error(`Driver not found: ${name}`);
      if (!driver.connected) throw new Error(`Driver not connected: ${name}`);

      if (driver.useFallback && driver.fallback) {
        // REST read
        const endpoint = typeof driver.fallback === 'string' 
          ? driver.fallback 
          : driver.fallback.endpoint;
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'read', ...options })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } else {
        // Web API read
        if (!driver.read) throw new Error(`Driver ${name} does not support read`);
        return await driver.read(options);
      }
    },

    // Write data to hardware
    async write(name, data, options = {}) {
      const driver = this.get(name);
      if (!driver) throw new Error(`Driver not found: ${name}`);
      if (!driver.connected) throw new Error(`Driver not connected: ${name}`);

      if (driver.useFallback && driver.fallback) {
        // REST write
        const endpoint = typeof driver.fallback === 'string' 
          ? driver.fallback 
          : driver.fallback.endpoint;
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'write', data, ...options })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
      } else {
        // Web API write
        if (!driver.write) throw new Error(`Driver ${name} does not support write`);
        return await driver.write(data, options);
      }
    },

    // Get all registered drivers
    list() {
      return Array.from(this.drivers.keys());
    },

    // Get driver status
    getStatus(name) {
      const driver = this.get(name);
      if (!driver) return null;

      return {
        name: driver.name,
        type: driver.type,
        version: driver.version,
        available: driver.available,
        connected: driver.connected,
        useFallback: driver.useFallback,
        lastError: driver.lastError
      };
    },

    // Get all driver statuses
    getAllStatus() {
      const status = {};
      for (const [name, driver] of this.drivers) {
        status[name] = this.getStatus(name);
      }
      return status;
    }
  };

  // Auto-initialize when DOM is ready
  const initHAL = () => {
    if (window.HardwareDrivers && !window.HardwareDrivers.initialized) {
      window.HardwareDrivers.init();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHAL);
  } else {
    setTimeout(initHAL, 100);
  }

  // Debug helper
  window.halDebug = () => {
    console.log('Hardware Drivers Status:', window.HardwareDrivers.getAllStatus());
    console.log('Load Stats:', window.HardwareDrivers.stats);
    return window.HardwareDrivers.getAllStatus();
  };

  console.log('[HAL] Hardware Abstraction Layer loaded');

})();