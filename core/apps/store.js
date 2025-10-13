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

// store.js - Modified with category tabs, safer categorizeApp, and SEARCH FUNCTIONALITY
(function() {
    window.GnokeStationStore = {
        currentCategory: 'all',
        searchQuery: '', // New property for search term
        
        // --- Windows 7 Aero-like Colors for Store Head/Base ---
        colors: {
            background: '#DEE8F5', // Light blue background for the window/content area
            dark: '#1F4765', // Dark blue text/accent
            text: '#333333',
            border: '#C4D3E3', // Light border
            primary: '#E4EAF2', // Header background
            blue: '#4D8BC1', // Primary blue accent
            accent: '#e74c3c', // Red accent for hardware/uninstall
            success: '#28a745', // Green for install/success
        },

        open() {
            const c = this.colors;
            
            // Re-styled Tab Button Base CSS
            const getTabStyle = (isActive) => {
                const base = `padding:12px 20px;border:none;background:transparent;cursor:pointer;font-size:14px;font-weight:600;transition:all 0.2s;`;
                const active = `color:${c.dark};border-bottom:3px solid ${c.blue};`;
                const inactive = `color:#6c757d;border-bottom:3px solid transparent;`;
                return base + (isActive ? active : inactive);
            };

            const storeHTML = `
                <div style="height:100%;display:flex;flex-direction:column;font-family:'Segoe UI',sans-serif;background:${c.background};">
                    
                    <div style="padding:16px;border-bottom:1px solid ${c.border};background:${c.primary};">
                        <h2 style="margin:0 0 8px 0;color:${c.dark};font-weight:700;">GnokeStation App Catalog</h2>
                        
                        <input type="search" id="app-search" placeholder="Search apps by name or description..." 
                            style="width:100%;padding:10px 12px;border:1px solid ${c.border};border-radius:6px;font-size:15px;margin-bottom:12px;background:white;color:${c.text};box-shadow:inset 0 1px 2px rgba(0,0,0,0.1);">

                        <div style="display:flex;gap:8px;">
                            <input type="url" id="external-app-url" placeholder="Enter .webos URL to install directly.." 
                                style="flex:1;padding:8px;border:1px solid ${c.border};border-radius:4px;font-size:14px;background:white;color:${c.text};">
                            <button id="external-app-go" 
                                style="padding:8px 16px;border:none;border-radius:4px;cursor:not-allowed;font-size:14px;font-weight:600;
                                       background:#99aab5;color:white;opacity:0.8;" 
                                disabled>
                                External
                            </button>
                        </div>
                    </div>
                    
                    <div style="display:flex;background:white;border-bottom:1px solid ${c.border};padding:0 16px;">
                        <button class="category-tab active" data-category="all" style="${getTabStyle(true)}">
                            All Apps
                        </button>
                        <button class="category-tab" data-category="oob" style="${getTabStyle(false)}">
                            Out of Box
                        </button>
                        <button class="category-tab" data-category="api" style="${getTabStyle(false)}">
                            API Required
                        </button>
                        <button class="category-tab" data-category="hal" style="${getTabStyle(false)}">
                            HAL Required
                        </button>
                    </div>
                    
                    <div style="flex:1;overflow-y:auto;padding:16px;">
                        <div id="app-catalog" style="display:grid;gap:16px;"></div>
                    </div>
                    
                    <div style="padding:10px;background:${c.primary};border-top:1px solid ${c.border};font-size:12px;color:${c.dark};text-align:center;font-weight:600;">
                        Apps are loaded and changes persist after refresh
                    </div>
                </div>
            `;

            const win = window.WindowManager.createWindow('GnokeStation Store', storeHTML, 520, 600);
            this.setupStoreHandlers(win);
            this.renderAppCatalog(win);
            return win;
        },

        // 🔹 Updated categorizeApp with safer logic (No change here, keeping it for context)
        categorizeApp(app) {
            try {
                if (!app || !app.id) return 'oob';

                // 1) Prefer explicit declaration on app
                const declared = (
                    (app.documentation && app.documentation.type) ||
                    app.type ||
                    app.category ||
                    ''
                ).toString().trim().toLowerCase();

                if (declared) {
                    if (declared === 'hal' || declared.includes('hardware')) return 'hal';
                    if (declared === 'api' || declared.includes('api')) return 'api';
                    if (declared === 'oob' || declared.includes('box')) return 'oob';
                }

                // 2) Backwards-compatible arrays
                const oobApps = ['calculator', 'calendar', 'notepad', 'sysinfo', 'contacts', 'gallery', 'clock'];
                const apiApps = ['weather', 'rssnews', 'sports', 'recipe', 'crypto', 'flight'];
                const halApps = [
                    'gpio', 'wled', 'greenhouse', 'aquarium', 'hue', 'fleet-monitor',
                    'network-device-controller', 'irrigation-controller', 'cisco-router-controller',
                    'homehub', 'samsung-tv', 'odroid', 'mini-routers' 
                ];

                if (oobApps.includes(app.id)) return 'oob';
                if (apiApps.includes(app.id)) return 'api';
                if (halApps.includes(app.id)) return 'hal';

                // 3) Fallback heuristic
                const text = ((app.name || '') + ' ' + (app.description || '')).toLowerCase();
                if (/(device|hardware|gpio|hal|router|mifi|iot|controller)/.test(text)) return 'hal';
                if (/(api|weather|rss|news|flight|crypto)/.test(text)) return 'api';

                // 4) Safe default
                return 'oob';
            } catch (err) {
                console.warn('categorizeApp() failed for', app && app.id, err);
                return 'oob';
            }
        },

        // ⭐️ MODIFIED: App Catalog now uses the crisp, high-contrast SVG-like style
        renderAppCatalog(win) {
            const c = this.colors;
            const catalogContainer = win.querySelector('#app-catalog');
            const availableApps = window.ProgramLoader ? window.ProgramLoader.getAvailableApps() : [];
            
            if (availableApps.length === 0) {
                catalogContainer.innerHTML = `
                    <div style="text-align:center;padding:40px;color:#6c757d;">
                        <h4>No apps available</h4>
                        <p>ProgramLoader not initialized or no apps found</p>
                    </div>
                `;
                return;
            }
            
            // Normalize search query
            const query = this.searchQuery.toLowerCase();
            
            // 1. Filter by category
            let filteredApps = this.currentCategory === 'all' 
                ? availableApps 
                : availableApps.filter(app => this.categorizeApp(app) === this.currentCategory);
                
            // 2. Filter by search query (if one exists)
            if (query) {
                filteredApps = filteredApps.filter(app => {
                    const appText = (app.name || '') + ' ' + (app.description || '');
                    return appText.toLowerCase().includes(query);
                });
            }

            if (filteredApps.length === 0) {
                catalogContainer.innerHTML = `
                    <div style="text-align:center;padding:40px;color:#6c757d;">
                        <p>No apps found matching your criteria.</p>
                    </div>
                `;
                return;
            }

            catalogContainer.innerHTML = filteredApps.map(app => {
                const isInstalled = window.ProgramLoader.isAppInstalled(app.id);
                const category = this.categorizeApp(app);
                
                // Define colors based on category/status for the crisp aesthetic
                const categoryStyles = {
                    oob: { text: 'Core/OOB', color: c.success, border: '#28a745' },
                    api: { text: 'API Service', color: '#ffc107', border: '#ffc107' },
                    hal: { text: 'HAL Device', color: c.accent, border: c.accent }
                };
                const style = categoryStyles[category];
                const actionButtonColor = isInstalled ? c.accent : c.success;
                
                // Crisp App Card Styling
                return `
                    <div style="
                        background:white;
                        border:2px solid ${c.border};
                        border-left:5px solid ${style.border}; 
                        border-radius:6px;
                        padding:14px;
                        box-shadow:0 2px 8px rgba(0,0,0,0.08);
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        transition:box-shadow 0.2s;
                    " onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'" onmouseout="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.08)'">
                        
                        <div style="flex:1;">
                            <div style="display:flex;align-items:center;margin-bottom:8px;">
                                <div style="width:36px;height:36px;background:${c.dark};border-radius:4px;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:18px;margin-right:12px;box-shadow:0 1px 3px rgba(0,0,0,0.2);">
                                    ${app.name.charAt(0).toUpperCase()}
                                </div>
                                
                                <div>
                                    <h4 style="margin:0 0 2px 0;color:${c.dark};font-size:16px;font-weight:700;">${app.name}</h4>
                                    <div style="font-size:12px;color:#6c757d;">
                                        Category: <span style="font-weight:600;color:${style.color};">${style.text}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <p style="margin:0;font-size:13px;color:${c.text};line-height:1.4;margin-left:48px;">${app.description || 'No description available.'}</p>
                            
                            <div style="font-size:11px;color:${c.blue};margin-top:8px;font-weight:600;margin-left:48px;">
                                ${isInstalled 
                                    ? `<span style="color:${c.success};">✓ Installed (${app.size || 'Small'})</span>` 
                                    : `Available (${app.size || 'Small'})`
                                }
                            </div>
                        </div>
                        
                        <button class="app-action-btn" data-app-id="${app.id}" 
                            style="padding:10px 18px;border:none;border-radius:4px;cursor:pointer;font-size:13px;font-weight:700;margin-left:16px;
                                   background:${actionButtonColor};color:white;min-width:100px;
                                   box-shadow:0 2px 4px rgba(0,0,0,0.2);transition:background 0.2s, transform 0.1s;"
                            onmousedown="this.style.transform='translateY(1px)'" onmouseup="this.style.transform='translateY(0)'">
                            ${isInstalled ? 'Uninstall' : 'Install'}
                        </button>
                    </div>
                `;
            }).join('');
        },

        // ⭐️ MODIFIED: Updated button styles in setupStoreHandlers for category tabs
        setupStoreHandlers(win) {
            const c = this.colors;
            
            // Search Input Handler
            const searchInput = win.querySelector('#app-search');
            if (searchInput) {
                // Throttle the input for better performance on quick typing
                let timeout = null;
                searchInput.addEventListener('input', (e) => {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => {
                        this.searchQuery = e.target.value;
                        this.renderAppCatalog(win);
                    }, 200); // 200ms delay for performance
                });
            }

            // Tab switching
            win.querySelectorAll('.category-tab').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    // Update active tab styling
                    win.querySelectorAll('.category-tab').forEach(t => {
                        t.style.color = '#6c757d'; // Inactive text
                        t.style.borderBottomColor = 'transparent';
                        t.classList.remove('active');
                    });
                    e.target.style.color = c.dark; // Active text
                    e.target.style.borderBottomColor = c.blue; // Active line
                    e.target.classList.add('active');

                    // Update category and re-render
                    this.currentCategory = e.target.dataset.category;
                    this.renderAppCatalog(win);
                });
            });

            // App install/uninstall
            win.addEventListener('click', (e) => {
                if (e.target.classList.contains('app-action-btn')) {
                    const appId = e.target.dataset.appId;
                    
                    if (window.ProgramLoader.isAppInstalled(appId)) {
                        window.ProgramLoader.uninstallApp(appId);
                        this.showNotification(`${appId} uninstalled`, 'success'); // Re-using success for consistency
                    } else {
                        window.ProgramLoader.installApp(appId);
                        this.showNotification(`${appId} installed`, 'success');
                    }
                    
                    setTimeout(() => this.renderAppCatalog(win), 100);
                }
                
                if (e.target.id === 'external-app-go') {
                    const url = win.querySelector('#external-app-url').value.trim();
                    if (url) {
                        this.showNotification(`Feature coming soon for URL: ${url}`, 'info');
                    } else {
                        this.showNotification('Please enter a valid URL.', 'error');
                    }
                }
            });
        },

        showNotification(message, type = 'info') {
            const c = this.colors;
            const colors = {
                success: c.success,
                error: c.accent, 
                info: c.blue
            };

            const notification = document.createElement('div');
            notification.style.cssText = `
                position:fixed;top:20px;right:20px;background:${colors[type]};color:white;
                padding:12px 20px;border-radius:6px;font-family:'Segoe UI',sans-serif;
                font-size:14px;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.3);
                z-index:10000;opacity:0;transform:translateX(100px);transition:all 0.3s ease;
            `;
            
            notification.textContent = message;
            document.body.appendChild(notification);
            
            requestAnimationFrame(() => {
                notification.style.opacity = '1';
                notification.style.transform = 'translateX(0)';
            });
            
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100px)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        }
    };

    if (window.AppRegistry) {
        window.AppRegistry.registerApp({
            id: 'Gnokestation-store',
            name: 'App Store',
            icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' rx='8' fill='%23007bff'/><circle cx='24' cy='20' r='6' fill='white'/><rect x='14' y='28' width='20' height='2' fill='white'/><rect x='16' y='32' width='16' height='2' fill='white'/></svg>",
            handler: () => window.GnokeStationStore.open(),
            singleInstance: true
        });
    }
})();
