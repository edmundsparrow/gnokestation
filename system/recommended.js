// FILE: system/recommended.js - Top Brands Manager for Gnokestation
// STANDALONE VERSION - Contains all Terminal methods internally

(function() {
  /**
   * Top Brands Manager - Install curated web applications
   * Features: Search, Install/Uninstall, Favicon support, Persistence
   * STANDALONE: All Terminal favicon methods copied internally for independence
   */
  window.TopBrandsManager = {
    // Storage key for persistence
    _STORAGE_KEY: 'gnokestation_top_brands',
    
    // Curated list of top web brands
    appCatalog: [
        { name: 'Dalolo Logistics', url: 'https://dalologisticsandautomobiles.netlify.app', description: 'Reliable logistics, express delivery & warehousing solutions' },
        { name: 'Notepad', url: 'https://notepad.js.org', description: 'Clean notepad with offline and online sync' },
        { name: 'Photopea', url: 'https://www.photopea.com', description: 'Free online photo editor (PSD, XCF, XD)' },
      { name: 'Three.js', url: 'https://three.js', description: 'Code platform' },
      { name: "colorhexa.com", url: "https://colorhexa.com", description: "Comprehensive color encyclopedia for hex, RGB, conversions, palettes, and color information" },
          { name: "wide.video", url: "https://wide.video", description: "Free browser-based video editor (local processing, no uploads)" },
      ],
    
    // =========================================================================
    // COPIED FROM TERMINAL.JS - Core favicon and app creation methods
    // =========================================================================
    
    _makeId(str) {
        return String(str || '')
            .toLowerCase()
            .replace(/^(https?:\/\/|file:\/\/\/?)/, '')
            .replace(/[^\w\-\.\/]/g, '-')
            .replace(/[\/\.]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 64)
            || ('app_' + Math.random().toString(36).slice(2, 8));
    },

    _friendlyNameFromUrlOrPath(input) {
        try {
            const u = new URL(input);
            const host = u.hostname.replace(/^www\./, '');
            const firstSegment = (u.pathname.split('/').filter(Boolean)[0] || '')
                .replace(/\.[a-z0-9]+$/i, '');
            return (firstSegment ? `${firstSegment} — ${host}` : host).replace(/[_\-]/g, ' ');
        } catch (e) {
            const parts = input.split(/[/\\]/).filter(Boolean);
            const base = parts[parts.length - 1] || input;
            return base.replace(/\.[a-z0-9]+$/i, '').replace(/[_\-]/g, ' ');
        }
    },

    _faviconFor(url) {
        try {
            const u = new URL(url);
            const domain = u.hostname;
            return this._createFaviconDataUrl(domain, url);
        } catch (e) {
            return null;
        }
    },

    _createFaviconDataUrl(domain, fullUrl) {
        // Uses icon.horse which handles SVG, WebP, PNG, ICO automatically
        return `https://icon.horse/icon/${domain}`;
    },

    _stringToColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = hash % 360;
        return `hsl(${hue}, 65%, 50%)`;
    },

    _createFallbackIcon(domain) {
        const letter = domain.charAt(0).toUpperCase();
        const color = this._stringToColor(domain);
        
        return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><rect width='48' height='48' rx='8' fill='${encodeURIComponent(color)}'/><text x='24' y='32' text-anchor='middle' font-size='24' font-weight='bold' fill='white' font-family='Arial'>${letter}</text></svg>`;
    },

    _createWebAppWindow(appName, url) {
        const faviconUrl = this._faviconFor(url);
        let fallbackIcon;
        try {
            fallbackIcon = this._createFallbackIcon(new URL(url).hostname);
        } catch (e) {
            fallbackIcon = this._createFallbackIcon(appName);
        }

        const iframeHTML = `
            <div style="height:100%;display:flex;flex-direction:column;background:#fff;">
                <div style="padding:8px 10px;border-bottom:1px solid #ddd;background:#f7f7f7;display:flex;align-items:center;gap:8px;">
                    <img src="${faviconUrl}" style="width:16px;height:16px;" onerror="this.src='${fallbackIcon}'"/>
                    <strong style="font-family:Segoe UI, sans-serif;flex:1;">${appName}</strong>
                    <button onclick="window.open('${url}', '_blank')" style="padding:4px 8px;border:1px solid #ddd;border-radius:3px;background:white;cursor:pointer;font-size:11px;">Open in New Tab</button>
                </div>
                <iframe src="${url}" style="flex:1;border:0;width:100%;height:100%;" sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"></iframe>
            </div>
        `;
        return window.WindowManager.createWindow(appName, iframeHTML, 900, 600);
    },

    _recreateAppEntry(url) {
        let id, name, icon, handler, urlForIframe = url;

        try {
            const u = new URL(url);
            urlForIframe = u.href;
            id = this._makeId(u.hostname + (u.pathname || ''));
            name = this._friendlyNameFromUrlOrPath(u.href);
            icon = this._faviconFor(u.href) || this._createFallbackIcon(u.hostname);
        } catch (err) {
            id = this._makeId(url);
            name = this._friendlyNameFromUrlOrPath(url);
            icon = this._createFallbackIcon(id);
        }

        handler = () => this._createWebAppWindow(name, urlForIframe);

        return {
            id: id,
            name: (name || id),
            icon: icon,
            handler: handler,
            singleInstance: true,
            url: urlForIframe 
        };
    },

    _registerAppObject(appObj) {
        let registered = false;
        if (window.AppRegistry && typeof window.AppRegistry.registerApp === 'function') {
            registered = window.AppRegistry.registerApp(appObj);
        } else if (window.AppRegistry && window.AppRegistry.registeredApps instanceof Map) {
            window.AppRegistry.registeredApps.set(appObj.id, appObj);
            registered = true;
        }

        if (registered) {
            if (window.EventBus) window.EventBus.emit('app-registered', appObj);
            // Force desktop icons refresh
            if (window.DesktopIconManager && typeof window.DesktopIconManager.refreshIcons === 'function') {
                setTimeout(() => window.DesktopIconManager.refreshIcons(), 100);
            }
        }
        return registered;
    },

    _unregisterAppId(appId) {
        if (!window.AppRegistry) return false;

        // Get the app object BEFORE unregistering
        const allApps = (window.AppRegistry.getAllApps 
            ? window.AppRegistry.getAllApps() 
            : (window.AppRegistry.registeredApps ? Array.from(window.AppRegistry.registeredApps.values()) : [])
        );
        const app = allApps.find(a => a.id === appId);

        let removed = false;
        if (typeof window.AppRegistry.unregisterApp === 'function') {
            try {
                window.AppRegistry.unregisterApp(appId);
                removed = true;
            } catch (e) {
                console.warn('Unregister via API failed:', e);
            }
        } else if (window.AppRegistry.registeredApps && typeof window.AppRegistry.registeredApps.delete === 'function') {
            removed = window.AppRegistry.registeredApps.delete(appId);
        }

        if (removed) {
            if (window.EventBus) {
                window.EventBus.emit('app-unregistered', appId);
                window.EventBus.emit('display-force-refresh');
            }
        }

        return removed;
    },

    // =========================================================================
    // TOP BRANDS UI METHODS
    // =========================================================================
    
    /**
     * Opens the main brands manager window
     */
    open() {
        const managerHTML = `
            <div style="height:100%;display:flex;flex-direction:column;background:#f5f7fa;color:#2c3e50;font-family:'Segoe UI',sans-serif;">
                <div style="padding:20px;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);border-bottom:2px solid #5a67d8;">
                    <h2 style="margin:0 0 8px;color:#ffffff;font-size:24px;font-weight:600;">🌟 Top Brands</h2>
                    <p style="margin:0;font-size:14px;color:#e8eaf6;">Discover and install popular web applications</p>
                </div>

                <div style="padding:16px;background:#ffffff;border-bottom:1px solid #e2e8f0;">
                    <input type="text" id="brands-search" placeholder="Search brands..." 
                        style="width:100%;padding:12px 16px;border:2px solid #e2e8f0;border-radius:8px;background:#f8fafc;color:#2c3e50;font-size:14px;box-sizing:border-box;transition:all 0.3s;">
                </div>

                <div id="brands-list" style="flex:1;overflow-y:auto;padding:16px;background:#f5f7fa;"></div>

                <div style="padding:12px 20px;background:#ffffff;border-top:1px solid #e2e8f0;font-size:13px;color:#64748b;display:flex;justify-content:space-between;box-shadow:0 -2px 4px rgba(0,0,0,0.05);">
                    <span id="brands-stats">Loading...</span>
                    <span id="brands-installed">0 installed</span>
                </div>
            </div>

            <style>
                #brands-search:focus {
                    outline: none;
                    border-color: #667eea;
                    background: #ffffff;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
            </style>
        `;

        const win = window.WindowManager.createWindow('Top Brands', managerHTML, 550, 600);
        this.setupHandlers(win);
        this.renderAppList(win);
        return win;
    },

    setupHandlers(win) {
        const searchInput = win.querySelector('#brands-search');
        let searchTimeout;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.renderAppList(win, e.target.value.toLowerCase());
            }, 300);
        });

        win.addEventListener('click', (e) => {
            if (e.target.classList.contains('brands-install-btn')) {
                const url = e.target.dataset.url;
                const name = e.target.dataset.name;
                this.installApp(url, name, win);
            } else if (e.target.classList.contains('brands-uninstall-btn')) {
                const appId = e.target.dataset.id;
                this.uninstallApp(appId, win);
            }
        });
    },

    renderAppList(win, searchQuery = '') {
        const listContainer = win.querySelector('#brands-list');
        const statsEl = win.querySelector('#brands-stats');
        const installedEl = win.querySelector('#brands-installed');

        const filtered = searchQuery 
            ? this.appCatalog.filter(app => 
                app.name.toLowerCase().includes(searchQuery) || 
                app.description.toLowerCase().includes(searchQuery))
            : this.appCatalog;

        const installed = this.getInstalledBrands();
        const installedCount = installed.length;

        statsEl.textContent = `${filtered.length} brands available`;
        installedEl.textContent = `${installedCount} installed`;

        if (filtered.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align:center;padding:80px 20px;color:#94a3b8;">
                    <div style="font-size:48px;margin-bottom:16px;">🔍</div>
                    <p style="font-size:16px;margin:0;">No brands found matching "${searchQuery}"</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = filtered.map(app => {
            const appId = this._makeId(app.url);
            const isInstalled = installed.includes(appId);
            
            // Use internal favicon methods (same as Terminal)
            const favicon = this._faviconFor(app.url);
            let fallbackIcon;
            try {
                fallbackIcon = this._createFallbackIcon(new URL(app.url).hostname);
            } catch (e) {
                fallbackIcon = this._createFallbackIcon(app.name);
            }

            return `
                <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:12px;transition:all 0.3s;box-shadow:0 1px 3px rgba(0,0,0,0.05);"
                    onmouseover="this.style.boxShadow='0 4px 12px rgba(102,126,234,0.15)';this.style.borderColor='#667eea';"
                    onmouseout="this.style.boxShadow='0 1px 3px rgba(0,0,0,0.05)';this.style.borderColor='#e2e8f0';">
                    <div style="display:flex;align-items:flex-start;gap:14px;">
                        <img src="${favicon}" 
                            style="width:48px;height:48px;border-radius:10px;flex-shrink:0;background:#f8fafc;padding:6px;border:1px solid #e2e8f0;"
                            onerror="this.src='${fallbackIcon}'">
                        
                        <div style="flex:1;min-width:0;">
                            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
                                <h4 style="margin:0;color:#1e293b;font-size:16px;font-weight:600;">${app.name}</h4>
                                ${isInstalled ? 
                                    `<span style="background:linear-gradient(135deg, #10b981, #059669);color:#ffffff;padding:4px 12px;border-radius:16px;font-size:11px;font-weight:600;box-shadow:0 2px 4px rgba(16,185,129,0.3);">✓ Installed</span>` 
                                    : ''}
                            </div>
                            <p style="margin:0 0 12px;font-size:13px;color:#64748b;line-height:1.5;">${app.description}</p>
                            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
                                ${isInstalled ? 
                                    `<button class="brands-uninstall-btn" data-id="${appId}"
                                        style="padding:8px 16px;background:linear-gradient(135deg, #ef4444, #dc2626);color:#ffffff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;box-shadow:0 2px 4px rgba(239,68,68,0.3);transition:all 0.2s;"
                                        onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 4px 8px rgba(239,68,68,0.4)';"
                                        onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 2px 4px rgba(239,68,68,0.3)';">
                                        Uninstall
                                    </button>
                                    <button onclick="window.open('${app.url}', '_blank')" 
                                        style="padding:8px 16px;background:#f8fafc;color:#475569;border:1px solid #e2e8f0;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;transition:all 0.2s;"
                                        onmouseover="this.style.background='#f1f5f9';"
                                        onmouseout="this.style.background='#f8fafc';">
                                        Open in Browser
                                    </button>` 
                                    : 
                                    `<button class="brands-install-btn" data-url="${app.url}" data-name="${app.name}"
                                        style="padding:8px 16px;background:linear-gradient(135deg, #667eea, #764ba2);color:#ffffff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;box-shadow:0 2px 4px rgba(102,126,234,0.3);transition:all 0.2s;"
                                        onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 4px 8px rgba(102,126,234,0.4)';"
                                        onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 2px 4px rgba(102,126,234,0.3)';">
                                        Install
                                    </button>`
                                }
                                <a href="${app.url}" target="_blank" 
                                    style="color:#667eea;font-size:11px;text-decoration:none;transition:color 0.2s;"
                                    onmouseover="this.style.color='#764ba2';"
                                    onmouseout="this.style.color='#667eea';">
                                    ${app.url}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    installApp(url, name, win) {
        // Use internal _recreateAppEntry (copied from Terminal)
        const appObj = this._recreateAppEntry(url);
        
        console.log('TopBrands installing:', appObj);
        console.log('Icon URL:', appObj.icon);
        
        const existing = window.AppRegistry && window.AppRegistry.registeredApps 
            ? window.AppRegistry.registeredApps.get(appObj.id) 
            : null;

        if (existing) {
            this.showNotification(`${name} is already installed`, 'warning');
            return;
        }

        // Use internal _registerAppObject
        const registered = this._registerAppObject(appObj);
        
        if (registered) {
            this._addInstalledApp(appObj.id, url);
            
            this.showNotification(`✓ ${name} installed successfully`, 'success');
            
            // AGGRESSIVE REFRESH STRATEGY
            // Multiple refresh attempts with different delays to ensure desktop updates
            setTimeout(() => this.renderAppList(win), 50);
            
            // Force multiple desktop icon refreshes
            if (window.DesktopIconManager) {
                // Immediate refresh
                if (typeof window.DesktopIconManager.refreshIcons === 'function') {
                    window.DesktopIconManager.refreshIcons();
                }
                // Delayed refreshes
                setTimeout(() => {
                    if (typeof window.DesktopIconManager.refreshIcons === 'function') {
                        window.DesktopIconManager.refreshIcons();
                    }
                }, 100);
                setTimeout(() => {
                    if (typeof window.DesktopIconManager.refreshIcons === 'function') {
                        window.DesktopIconManager.refreshIcons();
                    }
                }, 300);
                setTimeout(() => {
                    if (typeof window.DesktopIconManager.refreshIcons === 'function') {
                        window.DesktopIconManager.refreshIcons();
                    }
                }, 500);
            }
            
            // Force EventBus refresh events
            if (window.EventBus) {
                setTimeout(() => window.EventBus.emit('display-force-refresh'), 100);
                setTimeout(() => window.EventBus.emit('display-force-refresh'), 300);
            }
            
            console.log('✓ TopBrands: Installation complete, icon uses icon.horse:', appObj.icon);
        } else {
            this.showNotification('Failed to install app', 'error');
        }
    },

    uninstallApp(appId, win) {
        const removed = this._unregisterAppId(appId);
        
        if (removed) {
            this._removeInstalledApp(appId);
            
            this.showNotification('✓ App uninstalled', 'success');
            
            setTimeout(() => this.renderAppList(win), 100);
            
            if (window.DesktopIconManager && window.DesktopIconManager.refreshIcons) {
                setTimeout(() => window.DesktopIconManager.refreshIcons(), 200);
            }
        } else {
            this.showNotification('Failed to uninstall app', 'error');
        }
    },

    // --- Persistence Methods ---

    getInstalledBrands() {
        try {
            const stored = localStorage.getItem(this._STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    },

    _addInstalledApp(appId, url) {
        const installed = this.getInstalledBrands();
        const entry = { id: appId, url: url };
        
        if (!installed.find(item => item.id === appId)) {
            installed.push(entry);
            localStorage.setItem(this._STORAGE_KEY, JSON.stringify(installed));
        }
    },

    _removeInstalledApp(appId) {
        let installed = this.getInstalledBrands();
        installed = installed.filter(item => item.id !== appId);
        localStorage.setItem(this._STORAGE_KEY, JSON.stringify(installed));
    },

    showNotification(message, type = 'info') {
        const colors = {
            success: 'linear-gradient(135deg, #10b981, #059669)',
            error: 'linear-gradient(135deg, #ef4444, #dc2626)',
            warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
            info: 'linear-gradient(135deg, #667eea, #764ba2)'
        };

        const note = document.createElement('div');
        note.style.cssText = `
            position:fixed;top:20px;right:20px;background:${colors[type]};color:#ffffff;
            padding:14px 24px;border-radius:8px;font-family:'Segoe UI',sans-serif;
            font-size:14px;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,0.15);
            z-index:10000;opacity:0;transform:translateX(100px);transition:all 0.3s;
        `;
        note.textContent = message;
        document.body.appendChild(note);

        requestAnimationFrame(() => {
            note.style.opacity = '1';
            note.style.transform = 'translateX(0)';
        });

        setTimeout(() => {
            note.style.opacity = '0';
            note.style.transform = 'translateX(100px)';
            setTimeout(() => note.remove(), 300);
        }, 3000);
    },

    restoreInstalledBrands() {
        const installed = this.getInstalledBrands();

        installed.forEach(entry => {
            // Check if already registered
            if (window.AppRegistry && window.AppRegistry.registeredApps && 
                window.AppRegistry.registeredApps.has(entry.id)) {
                return;
            }

            // Reinstall using internal methods
            const appObj = this._recreateAppEntry(entry.url);
            this._registerAppObject(appObj);
            console.log(`[TopBrands] Restored: ${appObj.name} with favicon: ${appObj.icon}`);
        });
    }
  };

  // --- Application Registration ---

  if (window.AppRegistry) {
    window.AppRegistry.registerApp({
      id: 'brands',
      name: 'Top Brands',
      icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><defs><linearGradient id='grad1' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' style='stop-color:%23667eea;stop-opacity:1' /><stop offset='100%' style='stop-color:%23764ba2;stop-opacity:1' /></linearGradient></defs><rect width='48' height='48' fill='url(%23grad1)' rx='8'/><circle cx='24' cy='24' r='12' fill='none' stroke='white' stroke-width='3'/><path d='M24 16v16M16 24h16' stroke='white' stroke-width='3'/></svg>",
      handler: () => window.TopBrandsManager.open(),
      singleInstance: true,
      
      documentation: {
        name: 'Top Brands',
        version: '3.0.0',
        type: 'System',
        description: 'STANDALONE: Install and manage popular web applications. Contains all Terminal favicon methods internally.',
        features: [
          'Curated list of top web brands',
          'Search and filter functionality',
          'Standalone favicon handling (icon.horse)',
          'No dependency on Terminal loading order',
          'Persistent installation across sessions',
          'Install/Uninstall with visual feedback'
        ]
      }
    });
    
    console.log('✓ Top Brands Manager registered (STANDALONE VERSION)');
  }

  // Auto-restore on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.TopBrandsManager.restoreInstalledBrands();
      }, 1500);
    });
  } else {
    setTimeout(() => {
      window.TopBrandsManager.restoreInstalledBrands();
    }, 1500);
  }
})();