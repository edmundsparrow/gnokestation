// plugins.js
// Dynamic Plugin Loader for Gnoke Station
// Loads all .js files from /plugins/ folder
// Author: Gnoke Producer + Grok
// License: GPL-3.0
// Version: 1.0.0

;(() => {
  'use strict';

  // Config
  const PLUGIN_DIR = '/plugins/';
  const PLUGIN_EXT = '.js';
  const LOAD_TIMEOUT = 10000; // 10s per plugin
  const DEBUG = true;

  // Internal state
  let loadedCount = 0;
  let failedCount = 0;
  let totalPlugins = 0;

  // DOM-ready helper
  const ready = (fn) => {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  };

  // Log helper
  const log = (msg, type = 'info') => {
    if (!DEBUG) return;
    const prefix = '[PluginLoader]';
    const styles = {
      info: 'color: #86b4e4',
      success: 'color: #4caf50',
      error: 'color: #f44336',
      warn: 'color: #ff9800'
    };
    console.log(`%c${prefix} ${msg}`, styles[type] || styles.info);
  };

  // Load a single script
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.type = 'module';
      script.async = true;

      const timeout = setTimeout(() => {
        reject(new Error(`Timeout loading ${src}`));
      }, LOAD_TIMEOUT);

      script.onload = () => {
        clearTimeout(timeout);
        resolve(src);
      };

      script.onerror = (err) => {
        clearTimeout(timeout);
        reject(new Error(`Failed to load ${src}`));
      };

      document.head.appendChild(script);
    });
  };

  // Discover plugins
  const discoverPlugins = async () => {
    try {
      // Option 1: Use a manifest file (recommended later)
      // const res = await fetch(`${PLUGIN_DIR}manifest.json`);
      // return await res.json();

      // Option 2: Auto-discover all .js files in /plugins/
      // This works if server supports directory listing or you use a build tool
      // For now, we use a hardcoded list or fallback

      // Fallback: Assume common plugin filenames
      const knownPlugins = [
        'fileman.js',
        'wallpaper.js',
        'filesys.js',
        'webusb.js',
        'theme-switcher.js',
        'taskbar-customizer.js'
        // Add new ones here temporarily
      ];

      return knownPlugins.map(name => `${PLUGIN_DIR}${name}`);
    } catch (err) {
      log('Auto-discovery failed, using fallback list', 'warn');
      return [];
    }
  };

  // Load all plugins
  const loadAllPlugins = async () => {
    const pluginFiles = await discoverPlugins();
    totalPlugins = pluginFiles.length;

    if (totalPlugins === 0) {
      log('No plugins found in /plugins/', 'warn');
      return;
    }

    log(`Loading ${totalPlugins} plugin(s)...`);

    const loadPromises = pluginFiles.map(src =>
      loadScript(src)
        .then(() => {
          loadedCount++;
          log(`Loaded: ${src.split('/').pop()}`, 'success');
        })
        .catch(err => {
          failedCount++;
          log(`Failed: ${src.split('/').pop()} — ${err.message}`, 'error');
        })
    );

    await Promise.allSettled(loadPromises);

    log(`Plugin load complete: ${loadedCount} loaded, ${failedCount} failed`);

    // Trigger plugin init after all are loaded
    initializePlugins();
  };

  // Initialize all registered plugins
  const initializePlugins = () => {
    if (!window.gnokePlugins || !Array.isArray(window.gnokePlugins)) {
      log('No plugins registered for init', 'warn');
      return;
    }

    log(`Initializing ${window.gnokePlugins.length} plugin(s)...`);

    window.gnokePlugins.forEach((plugin, index) => {
      if (typeof plugin.init === 'function') {
        try {
          plugin.init(window.gnoke || window);
          log(`Initialized: ${plugin.name || plugin.id || `Plugin[${index}]`}`, 'success');
        } catch (err) {
          log(`Init failed: ${plugin.name || 'Unknown'} — ${err.message}`, 'error');
        }
      } else {
        log(`Skipped: ${plugin.name || 'Unknown'} (no init method)`);
      }
    });

    // Optional: Emit global event
    window.dispatchEvent(new CustomEvent('gnoke:plugins-ready', {
      detail: { loaded: loadedCount, failed: failedCount }
    }));
  };

  // Start loader
  ready(() => {
    log('Plugin loader ready');
    loadAllPlugins();
  });

  // Expose for debugging
  window.GnokePluginLoader = {
    reload: loadAllPlugins,
    stats: () => ({ loaded: loadedCount, failed: failedCount, total: totalPlugins })
  };

})();

