/**
 * Gnoke App Store - Application Management System
 * 
 *  -App store for Gnokestation platform providing:
 * - Application discovery and installation interface
 * - Dynamic app catalog with install/uninstall capabilities
 * - Integration with ProgramLoader for persistent app management
 * - Professional UI with notifications and status tracking
 * 
 * Size: 29KB | Type: System Application | Dependencies: WindowManager, AppRegistry, ProgramLoader
 * 
 * Manufacturer Integration Notes:
 * - Customize app catalog source for device-specific applications
 * - Modify installation process for production deployment scenarios
 * - Configure app approval workflows for controlled environments
 */
 

// store.js - GnokeStation App Store (Rewritten)
(function() {
    window.GnokeStationStore = {
        
        open() {
            const storeHTML = `
                <div style="height:100%;display:flex;flex-direction:column;font-family:'Segoe UI',sans-serif;background:#f8f9fa;">
                    <div style="padding:16px;border-bottom:1px solid #dee2e6;background:white;">
                        <h2 style="margin:0 0 12px 0;color:#2c3e50;">GnokeStation Store</h2>
                        <p style="margin:0;font-size:14px;color:#6c757d;">Install JavaScript applications to extend GnokeStation functionality</p>
                    </div>
                    
                    <div style="flex:1;overflow-y:auto;padding:16px;">
                        <div id="app-catalog" style="display:grid;gap:12px;">
                            <!-- Apps will be rendered here -->
                        </div>
                    </div>
                    
                    <div style="padding:12px;background:#e9ecef;border-top:1px solid #dee2e6;font-size:12px;color:#6c757d;text-align:center;">
                        Apps are loaded from system/apps/ directory • Changes persist after refresh
                    </div>
                </div>
            `;

            const win = window.WindowManager.createWindow('GnokeStation Store', storeHTML, 520, 600);
            this.setupStoreHandlers(win);
            this.renderAppCatalog(win);
            return win;
        },

        renderAppCatalog(win) {
            const catalogContainer = win.querySelector('#app-catalog');
            
            // Get app list from ProgramLoader
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

            catalogContainer.innerHTML = availableApps.map(app => {
                const isInstalled = window.ProgramLoader.isAppInstalled(app.id);
                return `
                    <div style="background:white;border:1px solid #dee2e6;border-radius:8px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                            <div style="flex:1;">
                                <div style="display:flex;align-items:center;margin-bottom:8px;">
                                    <div style="width:32px;height:32px;background:#007bff;border-radius:6px;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;margin-right:12px;">
                                        ${app.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 style="margin:0 0 2px 0;color:#2c3e50;font-size:16px;">${app.name}</h4>
                                        <div style="font-size:12px;color:#6c757d;">
                                            ${app.category} • ${app.size}
                                        </div>
                                    </div>
                                </div>
                                <p style="margin:0;font-size:13px;color:#495057;line-height:1.4;">${app.description}</p>
                                ${isInstalled ? '<div style="font-size:11px;color:#28a745;margin-top:4px;font-weight:600;">✓ Installed</div>' : ''}
                            </div>
                            <button class="app-action-btn" data-app-id="${app.id}" 
                                style="padding:8px 16px;border:none;border-radius:4px;cursor:pointer;font-size:13px;font-weight:600;margin-left:16px;
                                       background:${isInstalled ? '#dc3545' : '#28a745'};color:white;min-width:80px;">
                                ${isInstalled ? 'Uninstall' : 'Install'}
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        },

        setupStoreHandlers(win) {
            // App action buttons (Install/Uninstall)
            win.addEventListener('click', (e) => {
                if (e.target.classList.contains('app-action-btn')) {
                    const appId = e.target.dataset.appId;
                    
                    if (window.ProgramLoader.isAppInstalled(appId)) {
                        // Uninstall
                        window.ProgramLoader.uninstallApp(appId);
                        this.showNotification(`${appId} uninstalled`, 'success');
                    } else {
                        // Install
                        window.ProgramLoader.installApp(appId);
                        this.showNotification(`${appId} installed`, 'success');
                    }
                    
                    // Refresh the catalog display
                    setTimeout(() => {
                        this.renderAppCatalog(win);
                    }, 100);
                }
            });
        },

        showNotification(message, type = 'info') {
            const colors = {
                success: '#28a745',
                error: '#dc3545', 
                info: '#007bff'
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

    // Register store app
    if (window.AppRegistry) {
        window.AppRegistry.registerApp({
            id: 'webdesktop-store',
            name: 'App Store',
            icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' rx='8' fill='%23007bff'/><circle cx='24' cy='20' r='6' fill='white'/><rect x='14' y='28' width='20' height='2' fill='white'/><rect x='16' y='32' width='16' height='2' fill='white'/></svg>",
            handler: () => window.GnokeStationStore.open(),
            singleInstance: true,
            documentation: {
                name: 'App Store',
                version: '1.0',
                description: 'Install and manage JavaScript applications for GnokeStation',
                type: 'System',
                features: [
                    'Browse available applications',
                    'Install/uninstall apps with persistent state',
                    'View app details and categories'
                ]
            }
        });
    }

})();

