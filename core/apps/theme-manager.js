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

/**
 * FILE: core/window-manager-theme-patch.js
 * VERSION: 1.0.0
 * BUILD DATE: 2025-10-08
 *
 * PURPOSE:
 *   Patches WindowManager to ensure new windows always use current theme.
 *   This ensures title bars are created with CSS variables, not hardcoded colors.
 *
 * INSTALLATION:
 *   Load this AFTER window-manager.js but BEFORE theme.js
 *
 * AUTHOR:
 *   edmundsparrow.netlify.app
 */

(function() {
    // Wait for WindowManager to exist
    const waitForWindowManager = setInterval(() => {
        if (window.WindowManager && typeof window.WindowManager.createWindow === 'function') {
            clearInterval(waitForWindowManager);
            patchWindowManager();
        }
    }, 100);

    function patchWindowManager() {
        // Store original createWindow function
        const originalCreateWindow = window.WindowManager.createWindow;

        // Override createWindow to ensure theme compatibility
        window.WindowManager.createWindow = function(title, content, width = 400, height = 300, options = {}) {
            // Call original function
            const win = originalCreateWindow.call(this, title, content, width, height, options);

            // Ensure title bar uses CSS variables
            const titleBar = win.querySelector('.window-title-bar');
            if (titleBar) {
                // Remove any inline background styles
                titleBar.style.removeProperty('background');
                
                // Get current theme colors from CSS variables
                const primary1 = getComputedStyle(document.documentElement)
                    .getPropertyValue('--theme-primary-1').trim() || '#2c5282';
                const primary2 = getComputedStyle(document.documentElement)
                    .getPropertyValue('--theme-primary-2').trim() || '#5b2c82';
                
                // Apply gradient using current theme
                titleBar.style.background = `linear-gradient(135deg, ${primary1}, ${primary2})`;
                
                // Add CSS class for easier targeting
                titleBar.classList.add('themed-title-bar');
            }

            return win;
        };

        console.log('[WindowManager-ThemePatch] Title bars now use CSS variables');
    }

    // Also listen for theme changes and update ALL title bars
    if (window.EventBus) {
        window.EventBus.on('theme-changed', (data) => {
            updateAllTitleBars(data.colors);
        });
    }

    function updateAllTitleBars(colors) {
        const titleBars = document.querySelectorAll('.window-title-bar, .themed-title-bar');
        titleBars.forEach(titleBar => {
            titleBar.style.background = `linear-gradient(135deg, ${colors.primary1}, ${colors.primary2})`;
        });
    }

    // Alternative: Patch at the DOM level
    // This ensures even dynamically created windows get the right styles
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Element node
                    const titleBars = node.querySelectorAll ? 
                        node.querySelectorAll('.window-title-bar') : [];
                    
                    titleBars.forEach(titleBar => {
                        // Get current theme
                        const primary1 = getComputedStyle(document.documentElement)
                            .getPropertyValue('--theme-primary-1').trim() || '#2c5282';
                        const primary2 = getComputedStyle(document.documentElement)
                            .getPropertyValue('--theme-primary-2').trim() || '#5b2c82';
                        
                        titleBar.style.background = `linear-gradient(135deg, ${primary1}, ${primary2})`;
                        titleBar.classList.add('themed-title-bar');
                    });
                }
            });
        });
    });

    // Start observing when DOM is ready
    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }

    console.log('[WindowManager-ThemePatch] Monitoring for new windows');
})();

