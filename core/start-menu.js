/* ========================================
 * FILE: core/start-menu.js
 * VERSION: 1.0.2
 * BUILD DATE: 2025-09-29
 *
 * PURPOSE:
 *   Core script for the Unity Station desktop environment.
 *   Provides lifecycle management for the Start Menu overlay,
 *   including creation, display toggling, and cleanup of active
 *   state (such as search filters) when closed.
 *
 * ARCHITECTURE:
 *   - DOM event listener initializes on 'DOMContentLoaded'
 *   - Toggle mechanism bound to 'start-btn' click
 *   - Dynamically creates fixed-position DIV (menuOverlay)
 *   - Cleanup function resetSearchAndCloseMenu() resets search state
 *
 * LIFECYCLE:
 *   1. Loaded after DOM is ready
 *   2. Registers handlers for start button and outside clicks
 *   3. Overrides StartMenuApp.launchApp to ensure menu closes
 *   4. Runs throughout environment lifetime
 *
 * FEATURES:
 *   - Handles UI element creation & destruction
 *   - Implements outside-click-to-close behavior
 *   - Resets search state on closure (critical fix)
 *   - Cleans up dynamic listeners automatically
 *
 * EXAMPLE USAGE:
 *   // Runs automatically on page load
 *   document.getElementById('start-btn').click();
 *
 * AUTHOR:
 *   edmundsparrow.netlify.app | whatsappme @ 09024054758 | webaplications5050@gmail.com
 * ======================================== */
 

(function() {
    
    let menuOverlay = null;
    let outsideClickHandler = null;
    const startBtn = document.getElementById('start-btn');

    /**
     * Resets the search state within the StartMenuApp module 
     * and closes the menu overlay and cleans up listeners.
     */
    function resetSearchAndCloseMenu() {
        if (menuOverlay) {
            // CRITICAL FIX: Reset the search filter in the StartMenuApp module
            if (window.StartMenuApp) {
                // Clear the filter variable and refresh the app list to show ALL apps
                window.StartMenuApp.currentSearchTerm = '';
                window.StartMenuApp.refreshApps();
            }

            // Remove the DOM element
            menuOverlay.remove();
            menuOverlay = null;
            
            // Cleanup the outside click handler if it was active
            if(outsideClickHandler) {
                 document.removeEventListener('click', outsideClickHandler);
                 outsideClickHandler = null;
            }
        }
    }

    // Start menu overlay handler
    document.addEventListener('DOMContentLoaded', function() {
        
        startBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Close if already open (and cleanup state)
            if (menuOverlay && menuOverlay.parentNode) {
                resetSearchAndCloseMenu(); // Use the cleanup function
                return;
            }
            
            // Create menu overlay
            if (window.StartMenuApp) {
                createMenuOverlay();
            } else {
                // Wait for StartMenuApp to load
                const wait = setInterval(() => {
                    if (window.StartMenuApp) {
                        clearInterval(wait);
                        createMenuOverlay();
                    }
                }, 100);
                setTimeout(() => clearInterval(wait), 3000);
            }
        });
        
        function createMenuOverlay() {
            menuOverlay = document.createElement('div');
            menuOverlay.style.cssText = `
                position: fixed;
                bottom: 50px;
                left: 10px;
                width: 400px;
                max-height: 500px;
                z-index: 9999;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 16px 48px rgba(0,0,0,0.4);
            `;
            
            // Get menu content from StartMenuApp
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = window.StartMenuApp.createMenuHTML();
            const menuContent = tempDiv.firstElementChild;
            menuContent.style.height = '100%';
            menuOverlay.appendChild(menuContent);
            
            document.body.appendChild(menuOverlay);
            
            // Setup handlers for the overlay content
            window.StartMenuApp.currentWindow = menuOverlay;
            window.StartMenuApp.setupEventHandlers();
            window.StartMenuApp.refreshApps();
            
            // Close on outside click
            setTimeout(() => {
                // Define the handler and save its reference
                outsideClickHandler = (event) => {
                    if (!menuOverlay.contains(event.target) && !startBtn.contains(event.target)) {
                        resetSearchAndCloseMenu(); // Use the cleanup function
                        // Listener removal happens inside resetSearchAndCloseMenu
                    }
                };
                document.addEventListener('click', outsideClickHandler);
            }, 10);
            
            // Override launchApp to close overlay
            const originalLaunch = window.StartMenuApp.launchApp;
            window.StartMenuApp.launchApp = function(appId) {
                originalLaunch.call(this, appId);
                
                // Use the new cleanup function after launching the app
                if (menuOverlay) {
                    resetSearchAndCloseMenu();
                }
            };
        }
    });

    // --- Start Menu Documentation ---
    (function registerStartMenuUIDoc() {
        const tryRegister = () => {
            if (window.Docs && window.Docs.initialized && typeof window.Docs.register === 'function') {
                window.Docs.register('start-menu', {
                    name: "Start Menu",
                    version: "1.0.2", // Version bumped again for critical fix implementation
                    description: "Procedural script responsible for capturing the start button click, creating the visual menu overlay container (DIV), and managing the overlay's display state and external closing behavior within the Unity Station environment. **Fix: Clears StartMenuApp search state when menu closes.**",
                    type: "System Component",
                    features: [
                        "Captures 'start-btn' clicks to toggle the menu.",
                        "Dynamically creates and styles the menu overlay container.",
                        "Delegates content generation to the separate StartMenuApp module.",
                        "Implements 'close on outside click' behavior with state cleanup.",
                        "Overrides StartMenuApp.launchApp to automatically close the menu upon app launch."
                    ],
                    dependencies: ["StartMenuApp", "WindowManager", "DOM events"],
                    methods: [
                        { name: "createMenuOverlay()", description: "Internal function to construct, style, and append the menu container to the DOM." },
                        { name: "resetSearchAndCloseMenu()", description: "Internal function that clears the StartMenuApp's internal search state and removes the menu from the DOM." }
                    ],
                    autoGenerated: false
                });
                return true;
            }
            return false;
        };

        // Standard robust registration pattern
        if (tryRegister()) return;
        if (window.EventBus) {
            const onDocsReady = () => {
                if (tryRegister()) {
                    window.EventBus.off('docs-ready', onDocsReady);
                }
            };
            window.EventBus.on('docs-ready', onDocsReady);
        }
        let attempts = 0;
        const pollInterval = setInterval(() => {
            if (tryRegister() || attempts++ > 50) {
                clearInterval(pollInterval);
            }
        }, 100);
    })();
    // --- End Documentation ---
})();