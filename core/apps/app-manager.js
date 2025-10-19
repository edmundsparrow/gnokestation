// app-manager.js - FINAL VERSION with proper uninstall
// Lists user-installed apps and properly removes them from all persistence layers

(function () {
  'use strict';

  window.AppManager = {
    // Core system apps that should NEVER appear in App Manager
    SYSTEM_APPS: new Set([
      'app-manager',
      'startmenu', 
      'taskbar',
      'desktop-settings',
      'about',
      'terminal',
      'store',
      'Gnokestation-store'
    ]),
    
    // Apps from core/ folder that are part of the system
    CORE_PATHS: ['core/', '/core/', 'core/apps/', 'system/'],

    open() {
      const html = `
        <style>
          .am-container { height:100%; display:flex; flex-direction:column; font-family:'Segoe UI',sans-serif; background:#fff; }
          .am-header { padding:12px; background:#2c5282; color:#fff; font-size:16px; font-weight:600; border-bottom: 2px solid #1a3c5d; }
          .am-list { flex:1; overflow-y:auto; padding:12px; }
          .am-app { 
            display:flex; align-items:center; gap:12px; padding:12px; 
            margin-bottom:10px; border:1px solid #e0e0e0; border-radius:8px; 
            background:#ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            transition: all 0.2s ease-in-out;
          }
          .am-app:hover { background:#f5f5f5; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
          .am-icon { width:36px; height:36px; flex-shrink:0; border-radius:4px; }
          .am-info { flex:1; min-width:0; }
          .am-name { font-weight:700; color:#2c5282; margin-bottom:1px; font-size:14px; }
          .am-id { font-size:10px; color:#999; font-family:monospace; word-break: break-all; }
          .am-source { font-size:9px; color:#666; margin-top:2px; font-style:italic; }
          .am-btn { 
            padding:8px 14px; background:#dc3545; color:#fff; border:none; border-radius:5px; 
            cursor:pointer; font-size:13px; font-weight:600; transition:background 0.2s;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          }
          .am-btn:hover { background:#c82333; }
          .am-btn:disabled { background:#6c757d; cursor:not-allowed; }
          .am-status { padding:10px 12px; border-top:1px solid #ddd; background:#f0f0f0; font-size:12px; color:#444; text-align:center; }
          .am-debug { padding:8px 12px; background:#fff3cd; border-top:1px solid #ffc107; font-size:10px; color:#856404; }
          .am-debug-toggle { cursor:pointer; text-decoration:underline; }
        </style>
        <div class="am-container">
          <div class="am-header">Application Manager</div>
          <div class="am-list" id="am-list"></div>
          <div class="am-status" id="am-status">Loading apps...</div>
          <div class="am-debug" id="am-debug" style="display:none;">
            <div class="am-debug-toggle" onclick="this.parentElement.style.display='none'">Hide Debug Info</div>
            <pre id="am-debug-content" style="margin-top:8px; font-size:9px; overflow-x:auto;"></pre>
          </div>
        </div>
      `;

      const win = window.WindowManager.createWindow('App Manager', html, 500, 600);
      this.setup(win);
      return win;
    },

    setup(win) {
      const refreshHandler = () => this.render(win);
      if (window.EventBus) {
        window.EventBus.on('app-registered', refreshHandler);
        window.EventBus.on('app-unregistered', refreshHandler);
        window.EventBus.on('program-status-changed', refreshHandler);
        window.EventBus.on('program-uninstalled', refreshHandler);
      }
      this.render(win);
    },

    render(win) {
      const list = win.querySelector('#am-list');
      const status = win.querySelector('#am-status');
      const debugEl = win.querySelector('#am-debug');
      const debugContent = win.querySelector('#am-debug-content');

      if (!window.AppRegistry) {
        list.innerHTML = '<div style="padding:20px;text-align:center;color:#999;">AppRegistry not found</div>';
        status.textContent = 'Error: AppRegistry unavailable';
        return;
      }

      const apps = window.AppRegistry.getAllApps
        ? window.AppRegistry.getAllApps()
        : Array.from(window.AppRegistry.registeredApps?.values() || []);

      // Debug info
      const debugInfo = {
        totalApps: apps.length,
        systemApps: apps.filter(app => this.SYSTEM_APPS.has(app.id)).map(a => a.id),
        urlApps: apps.filter(app => app.url).map(a => ({ id: a.id, url: a.url })),
        storeApps: [],
        suiteApps: [],
        unknownApps: []
      };

      // Filter logic with detailed tracking
      const userApps = apps.filter(app => {
        // Skip App Manager itself
        if (app.id === 'app-manager') return false;
        
        // Skip known system apps
        if (this.SYSTEM_APPS.has(app.id)) {
          return false;
        }
        
        // 1. Check for TerminalApp/URL-installed apps (external URLs)
        if (app.url) {
          const url = app.url.toLowerCase();
          const isCore = this.CORE_PATHS.some(path => url.startsWith(path) || url.includes(path));
          if (!isCore) {
            return true; // External URL = user installed
          }
        }
        
        // 2. Check for Store-installed apps
        if (window.ProgramLoader && typeof window.ProgramLoader.isAppInstalled === 'function') {
          if (window.ProgramLoader.isAppInstalled(app.id)) {
            debugInfo.storeApps.push(app.id);
            return true;
          }
        }
        
        // 3. Check for GnokeSuite apps
        if (window.GnokeSuiteLoader && window.GnokeSuiteLoader.loadedApps && window.GnokeSuiteLoader.loadedApps.has(`gnokesuite/${app.id}.js`)) {
          debugInfo.suiteApps.push(app.id);
          return true;
        }
        
        // 4. Check for dynamically registered apps (not in system set)
        if (!app.url && !this.SYSTEM_APPS.has(app.id)) {
          debugInfo.unknownApps.push({ id: app.id, hasUrl: !!app.url, handler: typeof app.handler });
          return true;
        }

        return false;
      });

      debugContent.textContent = JSON.stringify(debugInfo, null, 2);

      if (userApps.length === 0) {
        list.innerHTML = `
          <div style="padding:20px;text-align:center;color:#999;">
            No user-installed apps found
            <div style="margin-top:10px;">
              <button onclick="document.getElementById('am-debug').style.display='block'" 
                style="padding:6px 12px;background:#ffc107;border:none;border-radius:4px;cursor:pointer;font-size:11px;">
                Show Debug Info
              </button>
            </div>
          </div>
        `;
        status.textContent = 'No user apps';
        return;
      }

      // Render app list
      list.innerHTML = userApps.map(app => {
        const source = this.detectSource(app);
        return `
          <div class="am-app">
            <img class="am-icon" src="${this.esc(app.icon || this.getDefaultIcon())}" alt="${this.esc(app.name)}">
            <div class="am-info">
              <div class="am-name">${this.esc(app.name)}</div>
              <div class="am-id">${this.esc(app.id)}</div>
              <div class="am-source">${source}</div>
            </div>
            <button class="am-btn" data-id="${this.esc(app.id)}">Uninstall</button>
          </div>
        `;
      }).join('');

      status.textContent = `${userApps.length} user app${userApps.length !== 1 ? 's' : ''} installed`;

      // Wire uninstall buttons
      list.querySelectorAll('.am-btn').forEach(btn => {
        btn.onclick = () => this.uninstall(win, btn.dataset.id);
      });
    },

    detectSource(app) {
      // Determine where the app came from
      if (window.GnokeSuiteLoader && window.GnokeSuiteLoader.loadedApps && window.GnokeSuiteLoader.loadedApps.has(`gnokesuite/${app.id}.js`)) {
        return 'Source: Gnoke Suite';
      }
      
      if (app.url) {
        const url = app.url.toLowerCase();
        if (url.includes('github')) return 'Source: GitHub';
        if (url.includes('cdn')) return 'Source: CDN';
        if (url.includes('netlify') || url.includes('vercel')) return 'Source: Hosted';
        return 'Source: Terminal Install';
      }
      
      if (window.ProgramLoader && window.ProgramLoader.isAppInstalled && window.ProgramLoader.isAppInstalled(app.id)) {
        return 'Source: App Store';
      }
      
      return 'Source: Unknown (manually registered)';
    },

    uninstall(win, appId) {
      if (!confirm(`Uninstall "${appId}"? This will remove it permanently.`)) {
        return;
      }

      const status = win.querySelector('#am-status');
      let removed = false;

      console.log(`[AppManager] Attempting to uninstall: ${appId}`);

      // STEP 1: Use ProgramLoader.uninstallApp() - THE EXACT METHOD FROM STORE
      if (window.ProgramLoader && typeof window.ProgramLoader.uninstallApp === 'function') {
        console.log(`[AppManager] Calling ProgramLoader.uninstallApp(${appId})`);
        
        try {
          // Call the EXACT same method that the store uses
          const result = window.ProgramLoader.uninstallApp(appId);
          
          if (result) {
            removed = true;
            console.log(`[AppManager] ✓ Successfully uninstalled via ProgramLoader`);
          } else {
            console.log(`[AppManager] ProgramLoader.uninstallApp returned false (app not in installedApps)`);
          }
        } catch (e) {
          console.error(`[AppManager] ProgramLoader.uninstallApp failed:`, e);
        }
      }

      // STEP 2: Try TerminalApp for URL-installed apps
      if (!removed && window.TerminalApp && typeof window.TerminalApp._unregisterAppId === 'function') {
        const app = window.AppRegistry.getApp(appId);
        
        if (app && app.url) {
          console.log(`[AppManager] Calling TerminalApp._unregisterAppId(${appId})`);
          
          try {
            const result = window.TerminalApp._unregisterAppId(appId);
            
            if (result) {
              removed = true;
              console.log(`[AppManager] ✓ Successfully uninstalled via TerminalApp`);
            }
          } catch (e) {
            console.error(`[AppManager] TerminalApp uninstall failed:`, e);
          }
        }
      }

      // STEP 3: Force removal from AppRegistry as last resort
      if (!removed && window.AppRegistry && window.AppRegistry.registeredApps && window.AppRegistry.registeredApps.has(appId)) {
        console.log(`[AppManager] Force removing from AppRegistry: ${appId}`);
        
        window.AppRegistry.registeredApps.delete(appId);
        
        if (window.AppRegistry.runningInstances && window.AppRegistry.runningInstances.has(appId)) {
          window.AppRegistry.runningInstances.delete(appId);
        }
        
        removed = true;
        console.log(`[AppManager] ✓ Force removed from AppRegistry`);
        
        // Emit events manually since we bypassed normal uninstall
        if (window.EventBus) {
          window.EventBus.emit('app-unregistered', { appId });
          window.EventBus.emit('program-uninstalled', { appId });
        }
      }

      // STEP 4: UI feedback and refresh
      if (removed) {
        console.log(`[AppManager] Uninstall completed for ${appId}`);
        
        // Refresh desktop icons
        if (window.DesktopIconManager && window.DesktopIconManager.refreshIcons) {
          setTimeout(() => window.DesktopIconManager.refreshIcons(), 100);
        }

        // Re-render app manager list
        setTimeout(() => this.render(win), 200);
        
        // Success message
        status.textContent = `✓ Uninstalled ${appId}`;
        status.style.color = '#28a745';
        status.style.background = '#d4edda';
        
        setTimeout(() => {
          status.style.color = '#444';
          status.style.background = '#f0f0f0';
          const userAppsCount = this._getUserAppCount(); 
          status.textContent = `${userAppsCount} user app${userAppsCount !== 1 ? 's' : ''} installed`;
        }, 3000);
        
      } else {
        console.error(`[AppManager] Failed to uninstall ${appId}`);
        
        status.textContent = `❌ Failed to uninstall ${appId}`;
        status.style.color = '#fff';
        status.style.background = '#dc3545';
        
        setTimeout(() => {
          status.style.color = '#444';
          status.style.background = '#f0f0f0';
        }, 3000);
      }
    },
    
    _getUserAppCount() {
      if (!window.AppRegistry) return 0;
      const apps = window.AppRegistry.getAllApps
          ? window.AppRegistry.getAllApps()
          : Array.from(window.AppRegistry.registeredApps?.values() || []);
      
      return apps.filter(app => {
          if (app.id === 'app-manager') return false;
          if (this.SYSTEM_APPS.has(app.id)) return false;

          if (app.url) {
              const url = app.url.toLowerCase();
              return !this.CORE_PATHS.some(path => url.startsWith(path) || url.includes(path));
          }

          if (window.ProgramLoader && typeof window.ProgramLoader.isAppInstalled === 'function') {
              return window.ProgramLoader.isAppInstalled(app.id);
          }
          
          return !this.SYSTEM_APPS.has(app.id);
      }).length;
    },

    getDefaultIcon() {
      return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><rect fill='%23ccc' width='32' height='32' rx='4'/><text x='16' y='20' text-anchor='middle' font-size='16' fill='%23666'>?</text></svg>";
    },

    esc(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
  };

  // Register App Manager itself
  if (window.AppRegistry) {
    window.AppRegistry.registerApp({
      id: 'app-manager',
      name: 'App Manager',
      url: 'core/apps/app-manager.js',
      icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect x='4' y='4' width='40' height='40' rx='6' fill='%232c5282'/><rect x='10' y='12' width='28' height='8' rx='2' fill='%23fff'/><rect x='10' y='24' width='28' height='8' rx='2' fill='%23fff'/><rect x='10' y='36' width='16' height='8' rx='2' fill='%23dc3545'/></svg>",
      handler: () => window.AppManager.open(),
      singleInstance: true
    });
  }
})();