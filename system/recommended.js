/*
 * Gnokestation Shell - Recommended Web brands Manager
 * Copyright (C) 2025 Ekong Ikpe
 *
 * Licensed under the GNU General Public License v3.0 or later.
 *
 * PURPOSE:
 * Manager for installing recommended web applications with proper
 * favicon support, persistence, and Terminal-style installation.
 */

window.RecommendedBrands = {
    // Storage key for persistence
    _STORAGE_KEY: 'gnokestation_recommended_brands',
    
    // Curated list of recommended web brands
    appCatalog: [
        { name: 'Dalolo Logistics', url: 'https://dalologisticsandautomobiles.netlify.app', description: 'Reliable logistics, express delivery & warehousing solutions' },
        { name: 'Notepad', url: 'https://notepad.js.org', description: 'Clean notepad offline and online sync' },
        { name: 'Photopea', url: 'https://www.photopea.com', description: 'Free online photo editor (PSD, XCF, XD)' },
    ],
    
    open() {
        const managerHTML = `
            <div style="height:100%;display:flex;flex-direction:column;background:#f5f7fa;color:#2c3e50;font-family:'Segoe UI',sans-serif;">
                <div style="padding:20px;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);border-bottom:2px solid #5a67d8;">
                    <h2 style="margin:0 0 8px;color:#ffffff;font-size:24px;font-weight:600;">🌟 Recommended Web Brands</h2>
                    <p style="margin:0;font-size:14px;color:#e8eaf6;">Discover and install popular web applications</p>
                </div>

                <div style="padding:16px;background:#ffffff;border-bottom:1px solid #e2e8f0;">
                    <input type="text" id="osa-search" placeholder="Search brands..." 
                        style="width:100%;padding:12px 16px;border:2px solid #e2e8f0;border-radius:8px;background:#f8fafc;color:#2c3e50;font-size:14px;box-sizing:border-box;transition:all 0.3s;">
                </div>

                <div id="osa-list" style="flex:1;overflow-y:auto;padding:16px;background:#f5f7fa;"></div>

                <div style="padding:12px 20px;background:#ffffff;border-top:1px solid #e2e8f0;font-size:13px;color:#64748b;display:flex;justify-content:space-between;box-shadow:0 -2px 4px rgba(0,0,0,0.05);">
                    <span id="osa-stats">Loading...</span>
                    <span id="osa-installed">0 installed</span>
                </div>
            </div>

            <style>
                #osa-search:focus {
                    outline: none;
                    border-color: #667eea;
                    background: #ffffff;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
            </style>
        `;

        const win = window.WindowManager.createWindow('Recommended Brands', managerHTML, 550, 600);
        this.setupHandlers(win);
        this.renderAppList(win);
        return win;
    },

    setupHandlers(win) {
        const searchInput = win.querySelector('#osa-search');
        let searchTimeout;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.renderAppList(win, e.target.value.toLowerCase());
            }, 300);
        });

        // Handle install/uninstall clicks
        win.addEventListener('click', (e) => {
            if (e.target.classList.contains('osa-install-btn')) {
                const url = e.target.dataset.url;
                const name = e.target.dataset.name;
                this.installApp(url, name, win);
            } else if (e.target.classList.contains('osa-uninstall-btn')) {
                const appId = e.target.dataset.id;
                this.uninstallApp(appId, win);
            }
        });
    },

    renderAppList(win, searchQuery = '') {
        const listContainer = win.querySelector('#osa-list');
        const statsEl = win.querySelector('#osa-stats');
        const installedEl = win.querySelector('#osa-installed');

        // Filter brands based on search
        const filtered = searchQuery 
            ? this.appCatalog.filter(app => 
                app.name.toLowerCase().includes(searchQuery) || 
                app.description.toLowerCase().includes(searchQuery))
            : this.appCatalog;

        // Get installed app IDs
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
            const favicon = this._getFaviconUrl(app.url);

            return `
                <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:12px;transition:all 0.3s;box-shadow:0 1px 3px rgba(0,0,0,0.05);"
                    onmouseover="this.style.boxShadow='0 4px 12px rgba(102,126,234,0.15)';this.style.borderColor='#667eea';"
                    onmouseout="this.style.boxShadow='0 1px 3px rgba(0,0,0,0.05)';this.style.borderColor='#e2e8f0';">
                    <div style="display:flex;align-items:flex-start;gap:14px;">
                        <img src="${favicon}" 
                            style="width:48px;height:48px;border-radius:10px;flex-shrink:0;background:#f8fafc;padding:6px;border:1px solid #e2e8f0;"
                            onerror="this.style.display='none'">
                        
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
                                    `<button class="osa-uninstall-btn" data-id="${appId}"
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
                                    `<button class="osa-install-btn" data-url="${app.url}" data-name="${app.name}"
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
        if (!window.TerminalApp) {
            this.showNotification('Terminal system not available', 'error');
            return;
        }

        // Create app entry using Terminal's method
        const appObj = window.TerminalApp._recreateAppEntry(url);
        
        // Check if already registered
        const existing = window.AppRegistry && window.AppRegistry.registeredBrands 
            ? window.AppRegistry.registeredBrands.get(appObj.id) 
            : null;

        if (existing) {
            this.showNotification(`${name} is already installed`, 'warning');
            return;
        }

        // Register the app
        const registered = window.TerminalApp._registerAppObject(appObj);
        
        if (registered) {
            // Add to our installed list
            this._addInstalledApp(appObj.id);
            
            this.showNotification(`✓ ${name} installed successfully`, 'success');
            
            // Refresh the list
            setTimeout(() => this.renderAppList(win), 100);
            
            // Refresh desktop icons
            if (window.DesktopIconManager && window.DesktopIconManager.refreshIcons) {
                setTimeout(() => window.DesktopIconManager.refreshIcons(), 200);
            }
        } else {
            this.showNotification('Failed to install app', 'error');
        }
    },

    uninstallApp(appId, win) {
        if (!window.TerminalApp) {
            this.showNotification('Terminal system not available', 'error');
            return;
        }

        const removed = window.TerminalApp._unregisterAppId(appId);
        
        if (removed) {
            // Remove from our installed list
            this._removeInstalledApp(appId);
            
            this.showNotification('✓ App uninstalled', 'success');
            
            // Refresh the list
            setTimeout(() => this.renderAppList(win), 100);
            
            // Refresh desktop icons
            if (window.DesktopIconManager && window.DesktopIconManager.refreshIcons) {
                setTimeout(() => window.DesktopIconManager.refreshIcons(), 200);
            }
        } else {
            this.showNotification('Failed to uninstall app', 'error');
        }
    },

    // Helper methods
    _makeId(url) {
        return window.TerminalApp._makeId(url);
    },

    _getFaviconUrl(url) {
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname;
            const origin = urlObj.origin;
            
            // Try multiple favicon sources in order of preference
            const sources = [
                `${origin}/favicon.svg`,
                `${origin}/favicon.ico`,
                `${origin}/favicon.png`,
                `${origin}/apple-touch-icon.png`,
                `${origin}/favicon.jpg`,
                `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
                `https://icons.duckduckgo.com/ip3/${domain}.ico`
            ];
            
            // Return the first source (will use onerror in HTML to cascade through fallbacks)
            return sources[0];
        } catch (e) {
            return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' fill='%23667eea' rx='8'/><text x='24' y='32' text-anchor='middle' font-size='24' fill='white' font-weight='bold'>?</text></svg>";
        }
    },
    
    _getFaviconFallbacks(url) {
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname;
            const origin = urlObj.origin;
            
            return [
                `${origin}/favicon.svg`,
                `${origin}/favicon.ico`,
                `${origin}/favicon.png`,
                `${origin}/apple-touch-icon.png`,
                `${origin}/favicon.jpg`,
                `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
                `https://icons.duckduckgo.com/ip3/${domain}.ico`,
                "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' fill='%23667eea' rx='8'/><text x='24' y='32' text-anchor='middle' font-size='24' fill='white' font-weight='bold'>?</text></svg>"
            ];
        } catch (e) {
            return ["data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' fill='%23667eea' rx='8'/><text x='24' y='32' text-anchor='middle' font-size='24' fill='white' font-weight='bold'>?</text></svg>"];
        }
    },

    // Persistence
    getInstalledBrands() {
        try {
            const stored = localStorage.getItem(this._STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    },

    _addInstalledApp(appId) {
        const installed = this.getInstalledBrands();
        if (!installed.includes(appId)) {
            installed.push(appId);
            localStorage.setItem(this._STORAGE_KEY, JSON.stringify(installed));
        }
    },

    _removeInstalledApp(appId) {
        let installed = this.getInstalledBrands();
        installed = installed.filter(id => id !== appId);
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

    // Auto-restore installed brands on system boot
    restoreInstalledBrands() {
        const installed = this.getInstalledBrands();
        const catalog = new Map(this.appCatalog.map(app => [this._makeId(app.url), app]));

        installed.forEach(appId => {
            // Find the app in catalog
            const app = catalog.get(appId);
            if (!app) return;

            // Check if already registered
            if (window.AppRegistry && window.AppRegistry.registeredBrands && 
                window.AppRegistry.registeredBrands.has(appId)) {
                return; // Already registered
            }

            // Reinstall using Terminal method
            if (window.TerminalApp) {
                const appObj = window.TerminalApp._recreateAppEntry(app.url);
                window.TerminalApp._registerAppObject(appObj);
                console.log(`[RecommendedBrands] Restored: ${app.name}`);
            }
        });
    }
};

// Register as system app
if (window.AppRegistry) {
    window.AppRegistry.registerApp({
        id: 'recommended',
        name: 'Recommended Brands',
        icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><defs><linearGradient id='grad1' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' style='stop-color:%23667eea;stop-opacity:1' /><stop offset='100%' style='stop-color:%23764ba2;stop-opacity:1' /></linearGradient></defs><rect width='48' height='48' fill='url(%23grad1)' rx='8'/><circle cx='24' cy='24' r='12' fill='none' stroke='white' stroke-width='3'/><path d='M24 16v16M16 24h16' stroke='white' stroke-width='3'/></svg>",
        handler: () => window.RecommendedBrands.open(),
        singleInstance: true,
        documentation: {
            name: 'Recommended Brands',
            version: '1.0.0',
            description: 'Install and manage popular recommended web applications with favicon support and persistence',
            type: 'System',
            features: [
                'Curated list of recommended web brands',
                'Auto-fetching favicons from websites',
                'Persistent installation across sessions',
                'Search and filter functionality',
                'Integration with Terminal installation system'
            ]
        }
    });
}

// Auto-restore installed brands on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (window.TerminalApp) {
                window.RecommendedBrands.restoreInstalledBrands();
            }
        }, 1500); // Wait for Terminal to initialize
    });
} else {
    setTimeout(() => {
        if (window.TerminalApp) {
            window.RecommendedBrands.restoreInstalledBrands();
        }
    }, 1500);
}
