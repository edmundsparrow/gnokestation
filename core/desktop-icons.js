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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

/* ========================================
 * FILE: core/desktop-icons.js
 * VERSION: 2.0.0 (SIMPLIFIED - DOUBLE-CLICK DEFAULT)
 * BUILD DATE: 2025-09-29
 *
 * PURPOSE:
 * Manages the display, styling, and user interaction for all desktop icons.
 * Uses natural double-click/tap behavior for launching apps.
 *
 * CHANGES FROM v1.0.1:
 * - Removed redundant doubleClickToOpen setting
 * - Double-click/tap is now the natural default behavior
 * - Single click selects the icon (standard desktop behavior)
 * - Cleaner, more intuitive interaction model
 *
 * AUTHOR:
 * Edmundsparrow.netlify.app | whatsappme @ 09024054758 | webaplications5050@gmail.com
 * ======================================== */

window.DesktopIconManager = {
    iconContainer: null,
    hiddenApps: new Set(),
    systemApps: new Set(['about', 'desktop-settings']),
    systemAppsNoDesktop: new Set(['startmenu', 'taskbar']), 
    settings: {
        showLabels: true,
        layoutMode: 'auto',
        columnsPerRow: 4
    },
    initialized: false,
    
    init() {
        if (this.initialized) return;
        console.log('DesktopIconManager initializing...');
        
        this.setupIconContainer();
        this.setupEventListeners();

        if (window.DesktopSettingsApp) {
            const initialSettings = window.DesktopSettingsApp.loadSettings();
            this.updateSettings(initialSettings, { isInitialLoad: true });
            console.log('DesktopIconManager loaded initial settings.');
        }

        this.refreshIcons();
        this.initialized = true;
        
        console.log('DesktopIconManager initialized');
        
        if (window.EventBus) {
            window.EventBus.emit('desktop-icons-ready');
        }
    },
    
    setupIconContainer() {
        let container = document.getElementById('icons');
        if (!container) {
            container = document.createElement('div');
            container.id = 'icons';
            container.className = 'desktop-icons-container';
            const desktop = document.getElementById('desktop');
            if (desktop) {
                desktop.appendChild(container);
            } else {
                document.body.appendChild(container);
            }
        }
        
        this.iconContainer = container;
        this.applyContainerStyles();
    },
    
    applyContainerStyles() {
        if (!this.iconContainer || !window.DisplayManager) return;
        
        window.DisplayManager.applyStylesToContainer(this.iconContainer);
    },
    
    setupEventListeners() {
        if (window.EventBus) {
            window.EventBus.on('app-registered', () => {
                setTimeout(() => this.refreshIcons(), 100);
            });
            
            window.EventBus.on('system-ready', () => {
                setTimeout(() => this.refreshIcons(), 200);
            });

            window.EventBus.on('orientation-changed', () => {
                this.applyContainerStyles();
                this.refreshIcons();
            });

            window.EventBus.on('display-resized', () => {
                this.applyContainerStyles();
            });

            window.EventBus.on('layout-changed', () => {
                this.applyContainerStyles();
                this.refreshIcons();
            });

            window.EventBus.on('display-force-refresh', () => {
                this.applyContainerStyles();
                this.refreshIcons();
            });

            window.EventBus.on('desktop-settings-updated', (newSettings) => {
                console.log('Desktop settings received update event:', newSettings);
                this.updateSettings(newSettings);
            });
        }
    },
    
    refreshIcons() {
        if (!this.iconContainer || !window.AppRegistry) return;
        
        this.iconContainer.innerHTML = '';
        
        const apps = window.AppRegistry.getAllApps();
        
        apps.forEach(app => {
            if (!this.hiddenApps.has(app.id) && !this.systemAppsNoDesktop.has(app.id)) {
                this.createDesktopIcon(app);
            }
        });
    },
    
    createDesktopIcon(app) {
        const icon = document.createElement('div');
        icon.className = 'desktop-icon';
        icon.dataset.appId = app.id;
        
        const iconSize = (window.DisplayManager && window.DisplayManager.getIconSize) ? window.DisplayManager.getIconSize() : 48;
        const containerWidth = (window.DisplayManager && window.DisplayManager.getIconContainerWidth) ? window.DisplayManager.getIconContainerWidth() : iconSize + 30;
        const isSystem = this.systemApps.has(app.id);
        const isMobile = (window.DisplayManager && window.DisplayManager.isMobileDevice) ? window.DisplayManager.isMobileDevice() : window.innerWidth < 768;
        
        icon.innerHTML = `
            <div class="desktop-icon-image" style="
                width: ${iconSize}px;
                height: ${iconSize}px;
                margin-bottom: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: ${Math.floor(iconSize * 0.6)}px;
                background: rgba(255, 255, 255, 0.9);
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                border: 2px solid ${isSystem ? '#dc3545' : '#28a745'};
                transition: all 0.2s ease;
                backdrop-filter: blur(5px);
            ">
                ${this.getAppIcon(app)}
            </div>
            ${this.settings.showLabels ? `
                <div class="desktop-icon-label" style="
                    font-size: ${isMobile ? '10px' : '11px'};
                    color: white;
                    text-align: center;
                    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
                    line-height: 1.2;
                    word-wrap: break-word;
                    max-width: ${containerWidth}px;
                    margin-top: 2px;
                ">${app.name}</div>
            ` : ''}
        `;
        
        this.styleDesktopIcon(icon, containerWidth);
        this.setupIconInteraction(icon, app);
        
        this.iconContainer.appendChild(icon);
    },
    
    styleDesktopIcon(icon, containerWidth) {
        icon.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            width: ${containerWidth}px;
            padding: 8px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            user-select: none;
            margin: 2px;
        `;
        
        icon.addEventListener('mouseenter', () => {
            icon.style.background = 'rgba(255, 255, 255, 0.15)';
            icon.style.backdropFilter = 'blur(10px)';
            icon.style.transform = 'scale(1.05) translateY(-2px)';
            
            const iconImage = icon.querySelector('.desktop-icon-image');
            if (iconImage) {
                iconImage.style.transform = 'translateY(-2px)';
                iconImage.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
                iconImage.style.background = 'rgba(255, 255, 255, 0.95)';
            }
        });
        
        icon.addEventListener('mouseleave', () => {
            icon.style.background = 'transparent';
            icon.style.backdropFilter = 'none';
            icon.style.transform = 'scale(1) translateY(0)';
            
            const iconImage = icon.querySelector('.desktop-icon-image');
            if (iconImage) {
                iconImage.style.transform = 'translateY(0)';
                iconImage.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
                iconImage.style.background = 'rgba(255, 255, 255, 0.9)';
            }
        });
    },
    
    setupIconInteraction(icon, app) {
        let clickCount = 0;
        let clickTimer = null;
        
        // Standard desktop behavior: single click selects, double-click launches
        icon.addEventListener('click', (e) => {
            e.preventDefault();
            clickCount++;
            
            if (clickTimer) {
                clearTimeout(clickTimer);
            }
            
            clickTimer = setTimeout(() => {
                if (clickCount === 1) {
                    // Single click - select the icon
                    console.log('Single click - selecting icon');
                    this.selectIcon(icon);
                } else if (clickCount === 2) {
                    // Double click - launch the app
                    console.log('Double click - launching app');
                    this.launchApp(app);
                }
                clickCount = 0;
            }, 250); // 250ms window for double-click detection
        });
        
        // Context menu
        icon.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e, app);
        });

        // Touch support
        let touchStartTime = 0;
        let touchCount = 0;
        let touchTimer = null;
        
        icon.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            touchCount++;
            
            if (touchTimer) {
                clearTimeout(touchTimer);
            }
            
            touchTimer = setTimeout(() => {
                touchCount = 0;
            }, 300);
        });

        icon.addEventListener('touchend', (e) => {
            const touchDuration = Date.now() - touchStartTime;
            
            if (touchDuration < 500) {
                e.preventDefault();
                
                if (touchCount === 1) {
                    // Single tap - select
                    this.selectIcon(icon);
                } else if (touchCount >= 2) {
                    // Double tap - launch
                    this.launchApp(app);
                    touchCount = 0;
                }
            }
        });
    },
    
    launchApp(app) {
        if (window.AppRegistry) {
            const instance = window.AppRegistry.openApp(app.id);
            if (instance) {
                const icon = document.querySelector(`[data-app-id="${app.id}"]`);
                if (icon) {
                    const iconImage = icon.querySelector('.desktop-icon-image');
                    if (iconImage) {
                        iconImage.style.animation = 'iconLaunch 0.3s ease';
                        setTimeout(() => {
                            iconImage.style.animation = '';
                        }, 300);
                    }
                }
            }
        }
    },
    
    selectIcon(icon) {
        // Deselect all other icons
        document.querySelectorAll('.desktop-icon').forEach(i => {
            i.classList.remove('selected');
            i.style.background = 'transparent';
        });
        
        // Select this icon
        icon.classList.add('selected');
        icon.style.background = 'rgba(74, 144, 226, 0.3)';
        icon.style.backdropFilter = 'blur(10px)';
    },
    
    showContextMenu(e, app) {
        const menu = document.createElement('div');
        menu.style.cssText = `
            position: fixed;
            left: ${e.clientX}px;
            top: ${e.clientY}px;
            background: rgba(255, 255, 255, 0.95);
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(20px);
            z-index: 9999;
            padding: 8px 0;
            min-width: 150px;
        `;
        
        const items = [
            { text: 'Open', action: () => this.launchApp(app) },
            { text: 'Hide from Desktop', action: () => this.hideApp(app.id) }
        ];
        
        items.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.textContent = item.text;
            menuItem.style.cssText = `
                padding: 8px 16px;
                cursor: pointer;
                font-size: 13px;
                transition: background 0.2s;
                color: #333;
            `;
            
            menuItem.addEventListener('mouseenter', () => {
                menuItem.style.background = 'rgba(74, 144, 226, 0.1)';
            });
            
            menuItem.addEventListener('mouseleave', () => {
                menuItem.style.background = 'transparent';
            });
            
            menuItem.addEventListener('click', () => {
                item.action();
                menu.remove();
            });
            
            menu.appendChild(menuItem);
        });
        
        document.body.appendChild(menu);
        
        setTimeout(() => {
            const removeMenu = (e) => {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', removeMenu);
                }
            };
            document.addEventListener('click', removeMenu);
        }, 10);
    },
    
    getAppIcon(app) {
        if (app.icon) {
            if (app.icon.startsWith('data:') || app.icon.startsWith('http')) {
                return `<img src="${app.icon}" alt="${app.name}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 4px;">`;
            } else {
                return app.icon;
            }
        }
        return '📱';
    },
    
    hideApp(appId) {
        this.hiddenApps.add(appId);
        this.refreshIcons();
        
        if (window.EventBus) {
            window.EventBus.emit('app-hidden', { appId });
        }
    },
    
    showApp(appId) {
        this.hiddenApps.delete(appId);
        this.refreshIcons();
        
        if (window.EventBus) {
            window.EventBus.emit('app-shown', { appId });
        }
    },
    
    updateSettings(newSettings, options = {}) {
        console.log('DesktopIconManager.updateSettings called with:', newSettings);
        
        // Only extract settings this manager cares about
        const behaviorSettings = {};
        if (newSettings.showLabels !== undefined) behaviorSettings.showLabels = newSettings.showLabels;
        
        this.settings = { ...this.settings, ...behaviorSettings };
        console.log('Updated DesktopIconManager internal settings:', this.settings);
        
        // Pass display-specific settings to DisplayManager
        if (window.DisplayManager) {
            const displaySettings = {};
            ['iconSize', 'iconSpacing', 'layoutMode', 'columnsPerRow'].forEach(key => {
                if (newSettings[key] !== undefined) {
                    displaySettings[key] = newSettings[key];
                }
            });
            
            if (Object.keys(displaySettings).length > 0) {
                console.log('Passing display settings to DisplayManager:', displaySettings);
                window.DisplayManager.updateSettings(displaySettings);
            }
        }
        
        this.refreshIcons();
        
        if (!options.isInitialLoad && window.EventBus) {
            window.EventBus.emit('desktop-settings-applied', this.settings);
        }
    },
    
    getSettings() {
        const displaySettings = window.DisplayManager && window.DisplayManager.getSettings ? 
            window.DisplayManager.getSettings() : {};
        
        return { ...displaySettings, ...this.settings };
    },
    
    getAllApps() {
        return window.AppRegistry ? window.AppRegistry.getAllApps() : [];
    },

    getStatus() {
        const displayStatus = window.DisplayManager ? (window.DisplayManager.getStatus ? window.DisplayManager.getStatus() : {}) : { message: 'DisplayManager not found.' };
        return {
            ...displayStatus,
            initialized: this.initialized,
            iconCount: this.iconContainer ? this.iconContainer.children.length : 0,
            containerExists: !!this.iconContainer,
            hiddenApps: Array.from(this.hiddenApps),
            settings: this.getSettings()
        };
    },

    forceRefresh() {
        console.log('Force refreshing desktop icons...');
        if (window.DisplayManager) {
            window.DisplayManager.forceRefresh();
        }
        this.applyContainerStyles();
        this.refreshIcons();
    }
};

const style = document.createElement('style');
style.textContent = `
    @keyframes iconLaunch {
        0% { transform: scale(1); }
        50% { transform: scale(0.9); }
        100% { transform: scale(1); }
    }
    
    .desktop-icon.selected {
        background: rgba(74, 144, 226, 0.3) !important;
        backdrop-filter: blur(10px) !important;
    }
    
    @media (max-width: 768px) {
        .desktop-icon {
            min-height: 44px;
        }
    }
`;
document.head.appendChild(style);

if (typeof window !== 'undefined') {
    const initManager = () => {
        if (window.AppRegistry && window.DisplayManager && window.DesktopSettingsApp) {
            window.DesktopIconManager.init();
        } else {
            if (!window.AppRegistry) console.warn('DesktopIconManager waiting for AppRegistry.');
            if (!window.DisplayManager) console.warn('DesktopIconManager waiting for DisplayManager.');
            if (!window.DesktopSettingsApp) console.warn('DesktopIconManager waiting for DesktopSettingsApp.');

            const waitForDeps = setInterval(() => {
                if (window.AppRegistry && window.DisplayManager && window.DesktopSettingsApp) {
                    clearInterval(waitForDeps);
                    window.DesktopIconManager.init();
                }
            }, 100);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(initManager, 300));
    } else {
        setTimeout(initManager, 300);
    }
}

if (typeof window !== 'undefined') {
    window.desktopIconsDebug = () => {
        console.log('Desktop Icons Status:', window.DesktopIconManager.getStatus());
        return window.DesktopIconManager.getStatus();
    };
}

(function registerDesktopIconManagerDoc() {
  const tryRegister = () => {
    if (window.Docs && window.Docs.initialized && typeof window.Docs.register === 'function') {
      window.Docs.register('desktop-icon-manager', {
        name: "DesktopIconManager",
        version: "2.0.0",
        description: "Manages desktop icons with natural double-click/tap behavior. Single click selects, double-click launches - standard desktop interaction model.",
        type: "System Component",
        dependencies: ["AppRegistry", "DisplayManager", "EventBus", "DesktopSettingsApp"],
        features: [
          "Natural double-click/tap to launch (standard desktop behavior)",
          "Single click/tap to select icons",
          "Right-click context menu (Open, Hide)",
          "Touch-friendly with double-tap support",
          "Visual settings (size, spacing, labels) via DisplayManager",
          "Persistent settings storage"
        ],
        methods: [
          { name: "init()", description: "Initializes the manager and loads settings." },
          { name: "refreshIcons()", description: "Re-renders all desktop icons." },
          { name: "updateSettings(newSettings)", description: "Updates settings and triggers refresh." },
          { name: "launchApp(app)", description: "Launches an application." },
          { name: "selectIcon(icon)", description: "Selects an icon (single-click behavior)." },
          { name: "hideApp(appId)", description: "Removes an app icon from desktop." }
        ],
        events: [
          "desktop-icons-ready", "desktop-settings-applied", "app-hidden", "app-shown"
        ],
        autoGenerated: false
      });
      console.log('DesktopIconManager documentation registered with Docs service');
      return true;
    }
    return false;
  };

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