/*
 * Gnokestation Shell - Service Worker Update Manager
 * Copyright (C) 2025 Ekong Ikpe <ekongmikpe@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * FILE: updateservice.js
 * PURPOSE: Forces cache updates when service worker version changes
 * INSTALLATION: Load in index.html BEFORE any other scripts
 * 
 * <script src="updateservice.js"></script>
 */

(function() {
    'use strict';

    const UpdateService = {
        // CRITICAL: Change this version when you update sw.js
        CURRENT_VERSION: '2.1.1',
        STORED_VERSION_KEY: 'gnoke-sw-version',
        
        init() {
            console.log('[UpdateService] Initializing...');
            
            if (!('serviceWorker' in navigator)) {
                console.warn('[UpdateService] Service Workers not supported');
                return;
            }
            
            // Check version and force update if needed
            this.checkAndUpdate();
            
            // Register service worker
            this.registerServiceWorker();
            
            // Listen for updates
            this.setupUpdateListener();
        },
        
        checkAndUpdate() {
            const storedVersion = localStorage.getItem(this.STORED_VERSION_KEY);
            
            console.log('[UpdateService] Current version:', this.CURRENT_VERSION);
            console.log('[UpdateService] Stored version:', storedVersion);
            
            if (storedVersion !== this.CURRENT_VERSION) {
                console.log('[UpdateService] Version mismatch detected! Forcing cache clear...');
                this.forceCacheUpdate();
                localStorage.setItem(this.STORED_VERSION_KEY, this.CURRENT_VERSION);
            } else {
                console.log('[UpdateService] Version up to date');
            }
        },
        
        forceCacheUpdate() {
            // Delete all old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        console.log('[UpdateService] Deleting cache:', cacheName);
                        return caches.delete(cacheName);
                    })
                );
            }).then(() => {
                console.log('[UpdateService] ✓ All caches cleared');
                
                // Unregister all service workers
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    return Promise.all(
                        registrations.map(registration => {
                            console.log('[UpdateService] Unregistering service worker');
                            return registration.unregister();
                        })
                    );
                }).then(() => {
                    console.log('[UpdateService] ✓ Service workers unregistered');
                    
                    // Show update notification
                    this.showUpdateNotification();
                });
            }).catch(error => {
                console.error('[UpdateService] Cache clear failed:', error);
            });
        },
        
        registerServiceWorker() {
            // Service worker is in root, not in /gnokestation/
            navigator.serviceWorker.register('/sw.js', { scope: '/' })
                .then(registration => {
                    console.log('[UpdateService] Service Worker registered:', registration.scope);
                    
                    // Check for updates every 60 seconds
                    setInterval(() => {
                        registration.update();
                    }, 60000);
                    
                    // Listen for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        console.log('[UpdateService] New service worker found');
                        
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                console.log('[UpdateService] New version available');
                                this.showUpdateNotification(true);
                            }
                        });
                    });
                })
                .catch(error => {
                    console.error('[UpdateService] Service Worker registration failed:', error);
                });
        },
        
        setupUpdateListener() {
            // Listen for controller change (new SW activated)
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('[UpdateService] New service worker activated');
                
                // Reload if user hasn't recently refreshed
                const lastReload = sessionStorage.getItem('last-sw-reload');
                const now = Date.now();
                
                if (!lastReload || (now - parseInt(lastReload)) > 5000) {
                    sessionStorage.setItem('last-sw-reload', now.toString());
                    console.log('[UpdateService] Reloading page for update...');
                    window.location.reload();
                }
            });
        },
        
        showUpdateNotification(isNewVersion = false) {
            const message = isNewVersion 
                ? '🔄 New version available! Click to update.' 
                : '✓ system updated to v' + this.CURRENT_VERSION;
            
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 16px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 999999;
                font-family: 'Segoe UI', sans-serif;
                font-size: 14px;
                font-weight: 600;
                cursor: ${isNewVersion ? 'pointer' : 'default'};
                animation: slideIn 0.3s ease;
            `;
            
            notification.textContent = message;
            
            if (isNewVersion) {
                notification.onclick = () => {
                    window.location.reload();
                };
            }
            
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
            
            document.body.appendChild(notification);
            
            // Auto-remove after 5 seconds (unless it's an update prompt)
            if (!isNewVersion) {
                setTimeout(() => {
                    notification.style.animation = 'slideIn 0.3s ease reverse';
                    setTimeout(() => notification.remove(), 300);
                }, 5000);
            }
        },
        
        // Manual update trigger
        forceUpdate() {
            console.log('[UpdateService] Manual update triggered');
            this.forceCacheUpdate();
        },
        
        // Check current status
        getStatus() {
            return {
                currentVersion: this.CURRENT_VERSION,
                storedVersion: localStorage.getItem(this.STORED_VERSION_KEY),
                isServiceWorkerSupported: 'serviceWorker' in navigator,
                isControllerActive: navigator.serviceWorker.controller !== null
            };
        }
    };
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => UpdateService.init());
    } else {
        UpdateService.init();
    }
    
    // Expose to global scope for manual control
    window.UpdateService = UpdateService;
    
    console.log('[UpdateService] Loaded - Use UpdateService.forceUpdate() to manually clear cache');
    
})();