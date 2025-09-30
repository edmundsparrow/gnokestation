/* ========================================
 * FILE: core/display.js
 * PURPOSE: Display and layout management with orientation awareness
 * DEPENDENCIES: EventBus, DesktopSettingsApp (for initial load)
 * FIX: Now loads initial settings from DesktopSettingsApp and listens to the
 * central 'desktop-settings-updated' event.
 * ======================================== */

window.DisplayManager = {
    currentOrientation: null,
    resizeTimeout: null,
    initialized: false,
    
    // Display settings (default values, overwritten by loadSettings in init)
    settings: {
        iconSize: 'medium',
        iconSpacing: 'normal',
        layoutMode: 'auto', 
        columnsPerRow: 4 
    },

    // Initialize display management
    init() {
        if (this.initialized) return;
        console.log('DisplayManager initializing...');
        
        // 1. Load initial settings
        if (window.DesktopSettingsApp) {
            const initialSettings = window.DesktopSettingsApp.loadSettings();
            
            // Only update settings that DisplayManager manages
            const displaySettings = {};
            ['iconSize', 'iconSpacing', 'layoutMode', 'columnsPerRow'].forEach(key => {
                displaySettings[key] = initialSettings[key];
            });
            this.updateSettings(displaySettings, { isInitialLoad: true });
            console.log('DisplayManager loaded initial settings:', displaySettings);
        }

        // 2. Setup environment state
        this.currentOrientation = this.detectOrientation();
        this.setupEventListeners();
        this.initialized = true;
        
        console.log('DisplayManager initialized');
        
        if (window.EventBus) {
            window.EventBus.emit('display-ready');
        }
    },

    // Detect current device orientation
    detectOrientation() {
        if (window.screen && window.screen.orientation) {
            const angle = window.screen.orientation.angle;
            return (angle === 0 || angle === 180) ? 'portrait' : 'landscape';
        }
        // Fallback to window dimensions
        return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    },

    // Check if device is mobile/tablet
    isMobileDevice() {
        return window.innerWidth < 768;
    },

    // Setup event listeners for display changes
    setupEventListeners() {
        // Handle window resize and orientation changes with debouncing
        const handleResize = () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                const newOrientation = this.detectOrientation();
                
                // Only emit orientation change if it actually changed
                if (newOrientation !== this.currentOrientation) {
                    console.log(`Orientation changed: ${this.currentOrientation} → ${newOrientation}`);
                    this.currentOrientation = newOrientation;
                    
                    if (window.EventBus) {
                        window.EventBus.emit('orientation-changed', {
                            orientation: newOrientation,
                            isMobile: this.isMobileDevice()
                        });
                    }
                }
                
                // Always emit display resized for layout adjustments
                if (window.EventBus) {
                    window.EventBus.emit('display-resized', {
                        width: window.innerWidth,
                        height: window.innerHeight,
                        orientation: newOrientation,
                        isMobile: this.isMobileDevice()
                    });
                }
            }, 150);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', () => {
            // Orientation change needs extra delay to get accurate dimensions
            setTimeout(handleResize, 300);
        });

        // FIX: Listen for the central settings update event
        if (window.EventBus) {
            window.EventBus.on('desktop-settings-updated', (fullSettings) => {
                console.log('DisplayManager received full settings update event.');
                
                // Filter the full settings payload for only display-relevant properties
                const displaySettings = {};
                ['iconSize', 'iconSpacing', 'layoutMode', 'columnsPerRow'].forEach(key => {
                    if (fullSettings[key] !== undefined) {
                        displaySettings[key] = fullSettings[key];
                    }
                });
                
                this.updateSettings(displaySettings);
            });
        }
    },

    // Generate container styles for mobile layout
    getMobileLayoutStyles(spacing, iconSize, orientation) {
        let gridColumns;
        
        // Ensure columnsPerRow is a valid number for 'manual' mode
        const columns = parseInt(this.settings.columnsPerRow) || 4;

        if (this.settings.layoutMode === 'grid') {
            gridColumns = `repeat(${columns}, 1fr)`;
        } else {
            // Auto and Adaptive modes use auto-fit/minmax
            const minIconSize = iconSize + 20; // Icon size + margin/padding
            gridColumns = `repeat(auto-fit, minmax(${minIconSize}px, 1fr))`;
        }
        
        return {
            position: 'absolute',
            top: '20px',
            left: '20px',
            right: '20px',
            display: 'grid',
            gridTemplateColumns: gridColumns,
            gap: `${spacing}px`,
            zIndex: '100',
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            alignItems: 'start',
            justifyItems: 'center',
            paddingBottom: '20px',
            transition: 'grid-template-columns 0.3s ease, gap 0.3s ease'
        };
    },

    // Generate container styles for desktop layout
    getDesktopLayoutStyles(spacing, iconSize, orientation) {
        const columns = parseInt(this.settings.columnsPerRow) || 4;
        
        // Always use grid layout for desktop for modern responsiveness
        let gridColumns;
        
        if (this.settings.layoutMode === 'grid') {
            // Manual mode: fixed columns
            gridColumns = `repeat(${columns}, 1fr)`;
        } else {
            // Auto/Adaptive mode: responsive grid based on screen width
            const minIconWidth = iconSize + 30; // Icon + spacing/padding
            gridColumns = `repeat(auto-fit, minmax(${minIconWidth}px, 1fr))`;
        }
            
        return {
            position: 'absolute',
            top: '20px',
            left: '40px',
            right: '40px',
            display: 'grid',
            gridTemplateColumns: gridColumns,
            gap: `${spacing + 5}px`,
            zIndex: '100',
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            alignItems: 'start',
            justifyItems: 'center',
            paddingBottom: '20px',
            transition: 'grid-template-columns 0.3s ease, gap 0.3s ease'
        };
    },

    // Get layout styles based on current display state
    getLayoutStyles() {
        const spacing = this.getSpacingValue();
        const iconSize = this.getIconSize();
        const isMobile = this.isMobileDevice();
        const orientation = this.detectOrientation();
        
        // Update current orientation if changed
        if (orientation !== this.currentOrientation) {
            this.currentOrientation = orientation;
            console.log(`Orientation changed to: ${orientation}`);
        }

        if (isMobile) {
            return this.getMobileLayoutStyles(spacing, iconSize, orientation);
        } else {
            return this.getDesktopLayoutStyles(spacing, iconSize, orientation);
        }
    },

    // Apply styles to a container element
    applyStylesToContainer(container) {
        if (!container) return;
        
        const styles = this.getLayoutStyles();
        
        // Apply all styles to the container
        Object.keys(styles).forEach(property => {
            // Helper to convert camelCase to kebab-case
            const cssProp = property.replace(/([A-Z])/g, '-$1').toLowerCase();
            container.style.setProperty(cssProp, styles[property]);
        });
    },

    // Get icon size in pixels
    getIconSize() {
        const sizes = {
            small: 32,
            medium: 48,
            large: 64
        };
        return sizes[this.settings.iconSize] || 48;
    },
    
    // Get spacing value in pixels
    getSpacingValue() {
        const spacings = {
            tight: 8,
            normal: 15,
            loose: 25
        };
        return spacings[this.settings.iconSpacing] || 15;
    },

    // Get container width for icons based on orientation and device
    getIconContainerWidth() {
        const iconSize = this.getIconSize();
        const spacing = this.getSpacingValue();
        // Width should accommodate the icon and some buffer/padding
        return iconSize + spacing + 10; 
    },

    // Update settings
    updateSettings(newSettings, options = {}) {
        const oldSettings = { ...this.settings };
        this.settings = { ...this.settings, ...newSettings };
        
        // Check if layout-affecting settings changed
        const layoutChanged = (
            oldSettings.iconSize !== this.settings.iconSize ||
            oldSettings.iconSpacing !== this.settings.iconSpacing ||
            oldSettings.layoutMode !== this.settings.layoutMode ||
            oldSettings.columnsPerRow !== this.settings.columnsPerRow
        );
        
        if (layoutChanged && window.EventBus && !options.isInitialLoad) {
            // Only emit layout change if settings changed AND it's not the initial load
            window.EventBus.emit('layout-changed', {
                settings: this.settings,
                orientation: this.currentOrientation,
                isMobile: this.isMobileDevice()
            });
            console.log('DisplayManager detected layout change and emitted event.');
        }
    },
    
    // Get current settings
    getSettings() {
        return { ...this.settings };
    },

    // Get current display status
    getStatus() {
        return {
            initialized: this.initialized,
            orientation: this.currentOrientation,
            isMobile: this.isMobileDevice(),
            width: window.innerWidth,
            height: window.innerHeight,
            settings: this.settings
        };
    },

    // Force refresh display state
    forceRefresh() {
        console.log('Force refreshing display state...');
        this.currentOrientation = this.detectOrientation();
        
        if (window.EventBus) {
            window.EventBus.emit('display-force-refresh', {
                orientation: this.currentOrientation,
                isMobile: this.isMobileDevice(),
                settings: this.settings
            });
        }
    }
};

// Auto-initialize when system is ready
if (typeof window !== 'undefined') {
    const initManager = () => {
        if (window.DesktopSettingsApp) {
            window.DisplayManager.init();
        } else {
            console.warn('DisplayManager waiting for DesktopSettingsApp to load initial settings.');
             // Simple poll to wait for the settings app to load its window object
            const waitForSettings = setInterval(() => {
                if (window.DesktopSettingsApp) {
                    clearInterval(waitForSettings);
                    window.DisplayManager.init();
                }
            }, 100);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initManager, 100);
        });
    } else {
        setTimeout(initManager, 100);
    }
}

// Debug helper
if (typeof window !== 'undefined') {
    window.displayDebug = () => {
        console.log('Display Manager Status:', window.DisplayManager.getStatus());
        return window.DisplayManager.getStatus();
    };
}