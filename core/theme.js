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

// Simplified Start Menu - Theme Compatible Version
// Gnokestation by edmundsparrow

(function() {
    window.ThemeManager = {
        // Theme Definitions
        themes: {
            'aero-crisp': { // 🌟 NEW THEME PRESET
                name: 'Aero Crisp (default)',
                colors: {
                    // Light Aero Title Bar / Taskbar Start Button (Mid-to-Dark Blue)
                    primary1: '#86b4e4', // Top of Gradient
                    primary2: '#3f6e9b', // Bottom of Gradient / Dark Accent
                    // Very Light Blue/White Glass Base (Backgrounds)
                    bg1: 'rgba(230, 238, 245, 0.95)',
                    bg2: 'rgba(230, 238, 245, 0.90)',
                    bg3: 'rgba(230, 238, 245, 0.85)',
                    text: '#1F4765',    // Dark Blue Text (for high contrast)
                    accent: '#1F4765'   // Dark Blue Accent
                }
            },
            'blue-purple': {
                name: 'Blue-Purple',
                colors: {
                    primary1: '#2c5282',
                    primary2: '#5b2c82',
                    bg1: '#e8e4f3',
                    bg2: '#d8d4e8',
                    bg3: '#c8c4dd',
                    text: '#f0f0f0',
                    accent: '#5b2c82'
                }
            },
            'ocean-blue': {
                name: 'Ocean Blue',
                colors: {
                    primary1: '#0c4a6e',
                    primary2: '#0891b2',
                    bg1: '#e0f2fe',
                    bg2: '#bae6fd',
                    bg3: '#7dd3fc',
                    text: '#f0f9ff',
                    accent: '#0891b2'
                }
            },
            'forest-green': {
                name: 'Forest Green',
                colors: {
                    primary1: '#14532d',
                    primary2: '#15803d',
                    bg1: '#dcfce7',
                    bg2: '#bbf7d0',
                    bg3: '#86efac',
                    text: '#f0fdf4',
                    accent: '#15803d'
                }
            },
            'sunset-orange': {
                name: 'Sunset Orange',
                colors: {
                    primary1: '#9a3412',
                    primary2: '#ea580c',
                    bg1: '#fed7aa',
                    bg2: '#fdba74',
                    bg3: '#fb923c',
                    text: '#fff7ed',
                    accent: '#ea580c'
                }
            },
            'old-vellum-wood': {
    name: 'Old Vellum Wood',
    colors: {
        primary1: '#5b4636',  // deep aged oak brown
        primary2: '#8b6f47',  // lighter polished wood tone
        bg1: '#f4e9d8',       // vellum parchment base
        bg2: '#e8d9b5',       // aged paper warmth
        bg3: '#d2b48c',       // tanned wood hue
        text: '#3e2f1c',      // dark ink brown
        accent: '#a67c52'     // antique gold accent
    }
},
            
            'rose-pink': {
                name: 'Rose Pink',
                colors: {
                    primary1: '#881337',
                    primary2: '#be123c',
                    bg1: '#fce7f3',
                    bg2: '#fbcfe8',
                    bg3: '#f9a8d4',
                    text: '#fdf2f8',
                    accent: '#be123c'
                }
            }
        },

        currentTheme: 'aero-crisp', 
        init() {
            // Load saved theme
            const savedTheme = localStorage.getItem('gnoke-theme');
            if (savedTheme && this.themes[savedTheme]) {
                this.currentTheme = savedTheme;
            }

            // Apply theme on load
            this.applyTheme(this.currentTheme);

            // Inject CSS variables style tag
            this.injectThemeStyles();

            console.log('[ThemeManager] Initialized with theme:', this.currentTheme);
        },

        injectThemeStyles() {
            // Create style tag for CSS variables if it doesn't exist
            if (!document.getElementById('theme-variables')) {
                const styleTag = document.createElement('style');
                styleTag.id = 'theme-variables';
                document.head.appendChild(styleTag);
            }
        },

        applyTheme(themeId) {
            if (!this.themes[themeId]) {
                console.error('[ThemeManager] Theme not found:', themeId);
                return;
            }

            this.currentTheme = themeId;
            const theme = this.themes[themeId];
            const colors = theme.colors;

            // Save to localStorage
            localStorage.setItem('gnoke-theme', themeId);

            // Update CSS Custom Properties
            const root = document.documentElement;
            root.style.setProperty('--theme-primary-1', colors.primary1);
            root.style.setProperty('--theme-primary-2', colors.primary2);
            root.style.setProperty('--theme-bg-1', colors.bg1);
            root.style.setProperty('--theme-bg-2', colors.bg2);
            root.style.setProperty('--theme-bg-3', colors.bg3);
            root.style.setProperty('--theme-text', colors.text);
            root.style.setProperty('--theme-accent', colors.accent);

            // Update desktop background
            this.updateDesktopBackground(colors);

            // Update wallpaper SVG
            this.updateWallpaperSVG(colors);

            // Update start menu colors
            this.updateStartMenuColors(colors);

            // Update window title bars
            this.updateWindowTitleBars(colors);

            // Update taskbar
            this.updateTaskbar(colors);

            // Emit theme change event
            if (window.EventBus) {
                window.EventBus.emit('theme-changed', { themeId, colors });
            }

            console.log('[ThemeManager] Theme applied:', theme.name);
        },

        updateDesktopBackground(colors) {
            const desktop = document.getElementById('desktop');
            if (desktop) {
                // Keep the light theme gradient for background, but use the new colors
                desktop.style.background = `linear-gradient(135deg, ${colors.primary1} 0%, ${colors.primary2} 100%)`;
            }
        },

        updateWallpaperSVG(colors) {
            // Find all SVG wallpapers on desktop
            const svgs = document.querySelectorAll('#desktop svg, .desktop-wallpaper');
            
            svgs.forEach(svg => {
                // Update gradient
                const gradient = svg.querySelector('linearGradient');
                if (gradient) {
                    const stops = gradient.querySelectorAll('stop');
                    if (stops.length >= 2) {
                        stops[0].setAttribute('stop-color', colors.primary1);
                        stops[1].setAttribute('stop-color', colors.primary2);
                    }
                }

                // Update text and shapes colors
                const texts = svg.querySelectorAll('text');
                texts.forEach(text => {
                    text.setAttribute('fill', colors.text);
                });

                const shapes = svg.querySelectorAll('g[stroke]');
                shapes.forEach(shape => {
                    shape.setAttribute('stroke', colors.text);
                });
            });
        },

        updateStartMenuColors(colors) {
            // Update existing start menu if open
            const startMenu = document.querySelector('.start-menu-app');
            if (!startMenu) return;

            // Update header
            const header = startMenu.querySelector('.menu-header');
            if (header) {
                header.style.background = `linear-gradient(135deg, ${colors.primary1} 0%, ${colors.primary2} 100%)`;
            }

            // Update menu background
            startMenu.style.background = `linear-gradient(180deg, ${colors.bg1} 0%, ${colors.bg2} 50%, ${colors.bg3} 100%)`;

            // Update category headers
            const categoryHeaders = startMenu.querySelectorAll('.category-header span');
            categoryHeaders.forEach(span => {
                // Only target the main category name (which was styled with font-weight: 600)
                if (span.style.fontWeight === '600' || span.style.fontWeight === '700') {
                    span.style.color = colors.accent;
                }
            });

            // Update toggle buttons (using a direct background color for active state)
            const toggleBtns = startMenu.querySelectorAll('.toggle-btn');
            toggleBtns.forEach(btn => {
                if (btn.classList.contains('active')) {
                    // Active button uses the primary2 (darker) color for high contrast
                    btn.style.background = colors.primary2;
                    btn.style.color = 'white';
                } else {
                    // Inactive button uses accent color for contrast
                    btn.style.background = 'transparent';
                    btn.style.color = colors.accent;
                }
                // Update stats area text color for high contrast
                const stats = startMenu.querySelector('#start-stats');
                if (stats) stats.style.color = colors.accent;
            });

            // Update footer (using subtle accent)
            const footer = startMenu.querySelector('.menu-footer');
            if (footer) {
                footer.style.background = `rgba(${this.hexToRgb(colors.accent)}, 0.05)`;
            }
        },

        updateWindowTitleBars(colors) {
            // Update all open window title bars
            const titleBars = document.querySelectorAll('.window-title-bar');
            titleBars.forEach(titleBar => {
                // Apply the light Aero gradient to the title bar
                titleBar.style.background = `linear-gradient(to bottom, ${colors.primary1} 0%, ${colors.primary2} 100%)`;
            });
        },

        updateTaskbar(colors) {
            const startBtn = document.querySelector('.start-button');
            if (startBtn) {
                // Apply the start button gradient
                startBtn.style.background = `linear-gradient(to bottom, ${colors.primary1}, ${colors.primary2})`;
            }
        },

        hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? 
                `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
                '0, 0, 0';
        },

        getCurrentTheme() {
            return {
                id: this.currentTheme,
                ...this.themes[this.currentTheme]
            };
        },

        getThemeList() {
            return Object.entries(this.themes).map(([id, theme]) => ({
                id,
                name: theme.name,
                colors: theme.colors
            }));
        }
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.ThemeManager.init();
        });
    } else {
        window.ThemeManager.init();
    }

    // Register with Docs system
    setTimeout(() => {
        if (window.Docs && typeof window.Docs.register === 'function') {
            window.Docs.register('theme-manager', {
                name: "Theme Manager",
                version: "1.0.0",
                description: "Centralized theme management system that dynamically applies color schemes across the entire desktop environment, including windows, start menu, and wallpaper.",
                type: "System Component",
                features: [
                    "Real-time theme switching without app restarts",
                    "Persists theme choice in localStorage",
                    "7 pre-defined theme presets (including Aero Crisp)",
                    "Updates CSS variables globally",
                    "Dynamically regenerates wallpaper SVG",
                    "Updates start menu and window colors",
                    "Event-driven architecture with EventBus"
                ],
                dependencies: ["localStorage", "EventBus (optional)"],
                methods: [
                    { name: "init()", description: "Initializes theme system and loads saved theme" },
                    { name: "applyTheme(themeId)", description: "Applies a theme by ID across all UI elements" },
                    { name: "getCurrentTheme()", description: "Returns current theme object" },
                    { name: "getThemeList()", description: "Returns array of available themes" }
                ],
                autoGenerated: false
            });
        }
    }, 1000);
})();
