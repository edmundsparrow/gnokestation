// plugins.js
// Auto-loads all apps from /plugins/ folder
// Apps behave exactly like hardcoded index.html scripts
// Author: Gnoke Station
// Version: 1.0.0

;(() => {
  'use strict';

  const PLUGIN_DIR = 'plugins/';
  
  // List all plugin files here
  const PLUGINS = [
    'deviceman.js',
  'drivers.js',
  'debug.js',
 // 'drivers/serial-monitor.js'
    //'filesys.js',
   // 'webusb.js',
  //  'search.js'
    // Add new plugins here as you create them
  ];

  let loaded = 0;
  let failed = 0;

  // Load a single script
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      
      script.onload = () => {
        loaded++;
        console.log(`[Plugins] ✓ ${src.split('/').pop()}`);
        resolve();
      };
      
      script.onerror = () => {
        failed++;
        console.error(`[Plugins] ✗ ${src.split('/').pop()}`);
        reject();
      };
      
      document.head.appendChild(script);
    });
  };

  // Load all plugins sequentially
  const loadAllPlugins = async () => {
    console.log(`[Plugins] Loading ${PLUGINS.length} apps from /plugins/...`);
    
    for (const file of PLUGINS) {
      try {
        await loadScript(PLUGIN_DIR + file);
      } catch (err) {
        // Continue loading other plugins even if one fails
      }
    }
    
    console.log(`[Plugins] Complete: ${loaded} loaded, ${failed} failed`);
    
    // Emit event for system awareness
    if (window.EventBus) {
      window.EventBus.emit('plugins-loaded', { loaded, failed, total: PLUGINS.length });
    }
  };

  // Wait for core system to be ready
  const init = () => {
    // Check if AppRegistry is available
    if (window.AppRegistry) {
      loadAllPlugins();
    } else {
      // Wait a bit for core to load
      setTimeout(init, 50);
    }
  };

  // Start loading after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging
  window.PluginLoader = {
    reload: loadAllPlugins,
    stats: () => ({ loaded, failed, total: PLUGINS.length })
  };

})();