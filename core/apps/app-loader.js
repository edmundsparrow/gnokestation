/* ========================================
 * FILE: core/app-loader.js
 * PURPOSE: Dynamic user application loader
 * DEPENDENCIES: Core system (WebDesktop, AppRegistry)
 * ======================================== */

window.AppLoader = {
    loadedApps: new Set(),
    failedApps: new Set(),
    
    // List of user applications to load
    appScripts: [
    "core/apps/menu.js",
    "core/apps/about.js",
    "system/clock.js",
    "system/news.js",
    "core/apps/desktop-settings.js",
    "system/weather.js",
    "core/apps/store.js",
    "system/calculator.js",
    "core/apps/readme.js"
    ],
    
    // Initialize app loading after system is ready
    init() {
        console.log('AppLoader initializing...');
        
        // Wait for core system to be ready
        this.waitForSystem().then(() => {
            this.loadAllApplications();
        }).catch(error => {
            console.error('Failed to initialize AppLoader:', error);
        });
    },
    
    // Wait for core system to be ready
    waitForSystem() {
        return new Promise((resolve, reject) => {
            const maxWait = 10000; // 10 seconds max wait
            const startTime = Date.now();
            
            const checkSystem = () => {
                const requiredSystems = ['WebDesktop', 'AppRegistry', 'WindowManager'];
                const missing = requiredSystems.filter(system => !window[system]);
                
                if (missing.length === 0 && window.WebDesktop.initialized) {
                    console.log('Core system ready for app loading');
                    resolve();
                } else if (Date.now() - startTime > maxWait) {
                    reject(new Error('Timeout waiting for core system'));
                } else {
                    console.log(`Waiting for systems: ${missing.join(', ')}`);
                    setTimeout(checkSystem, 200);
                }
            };
            
            checkSystem();
        });
    },
    
    // Load all user applications
    loadAllApplications() {
        console.log(`Loading ${this.appScripts.length} user applications...`);
        
        const loadPromises = this.appScripts.map(scriptPath => {
            return this.loadApplication(scriptPath);
        });
        
        Promise.allSettled(loadPromises).then(results => {
            this.reportLoadResults(results);
        });
    },
    
    // Load a single application
    loadApplication(scriptPath) {
        return new Promise((resolve, reject) => {
            if (this.loadedApps.has(scriptPath)) {
                resolve(`Already loaded: ${scriptPath}`);
                return;
            }
            
            const script = document.createElement('script');
            script.src = scriptPath;
            script.async = true;
            
            script.onload = () => {
                this.loadedApps.add(scriptPath);
                console.log(`✓ Loaded: ${scriptPath}`);
                resolve(`Loaded: ${scriptPath}`);
            };
            
            script.onerror = () => {
                this.failedApps.add(scriptPath);
                console.error(`✗ Failed to load: ${scriptPath}`);
                reject(new Error(`Failed to load: ${scriptPath}`));
            };
            
            // Set timeout for loading
            setTimeout(() => {
                if (!this.loadedApps.has(scriptPath) && !this.failedApps.has(scriptPath)) {
                    script.remove();
                    this.failedApps.add(scriptPath);
                    reject(new Error(`Timeout loading: ${scriptPath}`));
                }
            }, 10000);
            
            document.body.appendChild(script);
        });
    },
    
    // Report loading results
    reportLoadResults(results) {
        const loaded = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        console.log(`Application loading complete:`);
        console.log(`  ✓ Successfully loaded: ${loaded}`);
        console.log(`  ✗ Failed to load: ${failed}`);
        
        if (failed > 0) {
            console.log('Failed applications:', Array.from(this.failedApps));
        }
        
        // Emit event for system monitoring
        if (window.EventBus) {
            window.EventBus.emit('apps-loaded', {
                loaded: loaded,
                failed: failed,
                loadedApps: Array.from(this.loadedApps),
                failedApps: Array.from(this.failedApps)
            });
        }
        
        // Show simple notification
        this.showLoadNotification(loaded, failed);
    },
    
    // Show load notification
    showLoadNotification(loaded, failed) {
        if (window.WindowManager && (failed > 0 || loaded > 10)) {
            const content = `
                <div style="text-align: center; padding: 20px;">
                    <h3>Applications Loaded</h3>
                    <div style="margin: 20px 0;">
                        <div style="color: #28a745; margin: 10px 0;">
                            ✓ Successfully loaded: ${loaded}
                        </div>
                        ${failed > 0 ? `<div style="color: #dc3545; margin: 10px 0;">✗ Failed to load: ${failed}</div>` : ''}
                    </div>
                    <button onclick="this.closest('.window').querySelector('.close-btn').click()" 
                            style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                        OK
                    </button>
                </div>
            `;
            
            const notification = window.WindowManager.createWindow('Application Status', content, 300, 200);
            
            // Auto-close after 5 seconds
            setTimeout(() => {
                if (notification && notification.parentNode) {
                    const closeBtn = notification.querySelector('.close-btn');
                    if (closeBtn) closeBtn.click();
                }
            }, 5000);
        }
    },
    
    // Reload a specific application
    reloadApplication(scriptPath) {
        console.log(`Reloading application: ${scriptPath}`);
        
        // Remove from loaded/failed sets
        this.loadedApps.delete(scriptPath);
        this.failedApps.delete(scriptPath);
        
        // Remove existing script tag
        const existingScript = document.querySelector(`script[src="${scriptPath}"]`);
        if (existingScript) {
            existingScript.remove();
        }
        
        // Reload the application
        return this.loadApplication(scriptPath);
    },
    
    // Add new application to load list
    addApplication(scriptPath) {
        if (!this.appScripts.includes(scriptPath)) {
            this.appScripts.push(scriptPath);
            return this.loadApplication(scriptPath);
        }
        return Promise.resolve(`Already in list: ${scriptPath}`);
    },
    
    // Get loading statistics
    getStats() {
        return {
            total: this.appScripts.length,
            loaded: this.loadedApps.size,
            failed: this.failedApps.size,
            pending: this.appScripts.length - this.loadedApps.size - this.failedApps.size,
            loadedApps: Array.from(this.loadedApps),
            failedApps: Array.from(this.failedApps)
        };
    }
};

// Initialize when system is ready or immediately if it already is
if (typeof window !== 'undefined') {
    // Wait for core system first
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Small delay to let core system initialize first
            setTimeout(() => {
                window.AppLoader.init();
            }, 500);
        });
    } else {
        // DOM already loaded
        setTimeout(() => {
            window.AppLoader.init();
        }, 500);
    }
}

