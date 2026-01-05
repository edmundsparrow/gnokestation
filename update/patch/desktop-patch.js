/*
 * Gnokestation Shell - Desktop Icons Patch
 * Copyright (C) 2025 Ekong Ikpe <ekongmikpe@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * FILE: core/desktop-patch.js
 * VERSION: 1.0.0
 * PURPOSE: Fixes double-click behavior and icon deselection
 * 
 * INSTALLATION: Load AFTER desktop-icons.js
 * <script src="core/desktop-icons.js"></script>
 * <script src="core/desktop-patch.js"></script>
 */

(function() {
    'use strict';
    
    console.log('[DesktopPatch] Initializing...');
    
    // Wait for DesktopIconManager
    const interval = setInterval(() => {
        if (window.DesktopIconManager && window.DesktopIconManager.initialized) {
            clearInterval(interval);
            applyPatch();
        }
    }, 100);
    
    setTimeout(() => clearInterval(interval), 10000);
    
    function applyPatch() {
        console.log('[DesktopPatch] Applying fixes...');
        
        // PATCH 1: Fix getFreshSettings to always read from localStorage
        window.DesktopIconManager.getFreshSettings = function() {
            try {
                const saved = localStorage.getItem('webos-desktop-settings');
                if (saved) {
                    return JSON.parse(saved);
                }
            } catch (error) {
                console.warn('[DesktopPatch] Failed to read settings:', error);
            }
            return this.settings;
        };
        
        // PATCH 2: Fix setupIconInteraction with clean click logic
        window.DesktopIconManager.setupIconInteraction = function(icon, app) {
            let clickCount = 0;
            let clickTimer = null;
            
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const settings = this.getFreshSettings();
                const doubleClick = settings.doubleClickToOpen;
                
                if (!doubleClick) {
                    // Single-click mode: launch immediately
                    this.launchApp(app);
                    return;
                }
                
                // Double-click mode
                clickCount++;
                
                if (clickTimer) clearTimeout(clickTimer);
                
                if (clickCount === 1) {
                    // First click: select
                    this.selectIcon(icon);
                    clickTimer = setTimeout(() => { clickCount = 0; }, 500);
                } else if (clickCount === 2) {
                    // Second click: launch
                    this.launchApp(app);
                    clickCount = 0;
                }
            });
            
            icon.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showContextMenu(e, app);
            });
            
            // Touch support
            let touchStartTime = 0;
            icon.addEventListener('touchstart', () => touchStartTime = Date.now());
            icon.addEventListener('touchend', (e) => {
                if (Date.now() - touchStartTime < 500) {
                    e.preventDefault();
                    icon.click();
                }
            });
        };
        
        // PATCH 3: Add deselect on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.desktop-icon')) {
                document.querySelectorAll('.desktop-icon').forEach(icon => {
                    icon.classList.remove('selected');
                    icon.style.background = 'transparent';
                    icon.style.backdropFilter = 'none';
                });
            }
        });
        
        // PATCH 4: Force refresh on settings change
        const originalUpdateSettings = window.DesktopIconManager.updateSettings;
        window.DesktopIconManager.updateSettings = function(newSettings, options = {}) {
            originalUpdateSettings.call(this, newSettings, options);
            setTimeout(() => this.refreshIcons(), 100);
        };
        
        console.log('[DesktopPatch] ✓ Patch applied successfully');
        console.log('[DesktopPatch] ✓ Double-click now responds to settings');
        console.log('[DesktopPatch] ✓ Icons deselect on outside click');
        
        // Force initial refresh
        setTimeout(() => {
            if (window.DesktopIconManager.refreshIcons) {
                window.DesktopIconManager.refreshIcons();
            }
        }, 200);
    }
    
})();