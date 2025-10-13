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

/* ========================================
 * FILE: core/main.js
 * PURPOSE: Core system bootstrap - Initialize system services only
 * DEPENDENCIES: All core services
 * ======================================== */

window.WebDesktop = {
    version: '2.0.0',
    initialized: false,
    initializationPromise: null,
    
    // Initialize the core system only
    init() {
        if (this.initializationPromise) {
            return this.initializationPromise;
        }
        
        console.log('WebDesktop v' + this.version + ' starting...');
        
        this.initializationPromise = this.bootstrap().catch(error => {
            console.error('WebDesktop initialization failed:', error);
            this.showFallbackError(error);
            throw error;
        });
        
        return this.initializationPromise;
    },
    
    // Main bootstrap sequence - core services only
    async bootstrap() {
        console.log('Starting core bootstrap sequence...');
        
        await this.waitForDOM();
        this.checkCoreServices();
        await this.initializeCoreServices();
        this.registerSystemApps();
        this.finalizeSystem();
        
        console.log('WebDesktop core initialized successfully');
        this.initialized = true;
        
        if (window.EventBus) {
            window.EventBus.emit('system-ready', { 
                version: this.version,
                timestamp: new Date()
            });
        }
        
        return true;
    },
    
    waitForDOM() {
        return new Promise(resolve => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    },
    
    checkCoreServices() {
        const requiredServices = ['EventBus', 'WindowManager', 'AppRegistry'];
        const optionalServices = ['DesktopManager', 'Taskbar', 'StartMenu'];
        
        const missing = requiredServices.filter(service => !window[service]);
        const optional = optionalServices.filter(service => !window[service]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required services: ${missing.join(', ')}`);
        }
        
        if (optional.length > 0) {
            console.warn('Optional services not available:', optional);
        }
        
        console.log('Core services check completed');
    },
    
    async initializeCoreServices() {
        console.log('Initializing core services...');
        
        const services = ['DesktopManager', 'Taskbar', 'StartMenu'];
        
        for (const serviceName of services) {
            if (window[serviceName] && typeof window[serviceName].init === 'function') {
                try {
                    window[serviceName].init();
                    console.log(`${serviceName} initialized`);
                } catch (error) {
                    console.warn(`Failed to initialize ${serviceName}:`, error);
                }
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('Core services initialized');
    },
    
    // Register only essential system applications
    registerSystemApps() {
        console.log('Registering system applications...');
        
        if (!window.AppRegistry) {
            console.warn('AppRegistry not available, skipping system app registration');
            return;
        }
        
        // No built-in apps — all apps load dynamically
        console.log('No system applications registered - all apps load dynamically');
    },
    
    finalizeSystem() {
        this.setupKeyboardShortcuts();
        this.setupResponsiveHandling();
        this.setupGlobalErrorHandling();
        this.logSystemStatus();
    },
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Alt + Space: Open start menu
            if (e.altKey && e.code === 'Space') {
                e.preventDefault();
                if (window.StartMenu) {
                    window.StartMenu.toggle();
                }
            }
            
            // Ctrl + Alt + D: Show desktop
            if (e.ctrlKey && e.altKey && e.code === 'KeyD') {
                e.preventDefault();
                if (window.DesktopManager) {
                    window.DesktopManager.showDesktop();
                }
            }
            
            // Escape: Close start menu
            if (e.code === 'Escape') {
                if (window.StartMenu && window.StartMenu.isOpen) {
                    window.StartMenu.close();
                }
            }
        });
    },
    
    setupResponsiveHandling() {
        const updateLayout = () => {
            const isMobile = window.innerWidth < 768;
            
            if (window.Taskbar && typeof window.Taskbar.updateLayout === 'function') {
                window.Taskbar.updateLayout(isMobile);
            }
            
            if (window.DesktopManager && typeof window.DesktopManager.adjustLayout === 'function') {
                window.DesktopManager.adjustLayout();
            }
        };
        
        updateLayout();
        
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(updateLayout, 150);
        });
    },
    
    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            
            if (window.EventBus) {
                window.EventBus.emit('system-error', {
                    error: event.error,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    timestamp: new Date()
                });
            }
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            
            if (window.EventBus) {
                window.EventBus.emit('system-error', {
                    error: event.reason,
                    type: 'unhandled-promise',
                    timestamp: new Date()
                });
            }
        });
    },
    
    logSystemStatus() {
        const status = {
            version: this.version,
            initialized: this.initialized,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            services: {
                eventBus: !!window.EventBus,
                windowManager: !!window.WindowManager,
                appRegistry: !!window.AppRegistry,
                desktopManager: !!window.DesktopManager,
                taskbar: !!window.Taskbar,
                startMenu: !!window.StartMenu
            }
        };
        
        console.log('WebDesktop System Status:', status);
    },
    
    showFallbackError(error) {
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: linear-gradient(135deg, #667eea, #764ba2); color: white; font-family: 'Segoe UI', sans-serif;">
                <div style="text-align: center; max-width: 500px; padding: 40px;">
                    <h1 style="margin-bottom: 20px; font-size: 24px;">WebDesktop Failed to Load</h1>
                    <p style="margin-bottom: 20px; opacity: 0.9;">There was an error initializing the desktop environment.</p>
                    <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left; font-family: monospace; font-size: 12px;">
                        ${error.message}
                    </div>
                    <button onclick="location.reload()" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                        Reload Page
                    </button>
                </div>
            </div>
        `;
    }
};

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.WebDesktop.init();
        });
    } else {
        setTimeout(() => {
            window.WebDesktop.init();
        }, 10);
    }
}
