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
 * FILE: core/apps/desktop-settings.js
 * VERSION: 3.1.0 (THEME INTEGRATION)
 * ADDED: Theme control panel integration
 * ======================================== */

window.DesktopSettingsApp = {
    defaultSettings: {
        iconSize: 'medium',
        iconSpacing: 'normal',
        showLabels: true,
        doubleClickToOpen: false,
        layoutMode: 'auto',
        columnsPerRow: 4
    },

    loadSettings() {
        try {
            const saved = localStorage.getItem('webos-desktop-settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                console.log('DesktopSettingsApp loaded settings from localStorage:', parsed);
                return { ...this.defaultSettings, ...parsed };
            }
        } catch (error) {
            console.error('Failed to load desktop settings:', error);
        }
        console.log('DesktopSettingsApp using default settings');
        return { ...this.defaultSettings };
    },

    saveSettings(settings) {
        try {
            const settingsToSave = {
                ...settings,
                showLabels: Boolean(settings.showLabels),
                doubleClickToOpen: Boolean(settings.doubleClickToOpen)
            };
            
            localStorage.setItem('webos-desktop-settings', JSON.stringify(settingsToSave));
            console.log('DesktopSettingsApp saved settings to localStorage:', settingsToSave);
            return true;
        } catch (error) {
            console.error('Failed to save desktop settings:', error);
            return false;
        }
    },

    open() {
        const settingsHTML = `
            <div style="height:100%;display:flex;font-family:'Segoe UI',sans-serif;background:#f5f5f5;">
                <!-- Sidebar -->
                <div style="width:180px;background:linear-gradient(135deg,var(--theme-primary-1,#2c5282),var(--theme-primary-2,#5b2c82));color:white;padding:20px 0;border-right:1px solid rgba(255,255,255,0.1);">
                    <div class="settings-nav active" data-section="theme" style="padding:12px 20px;cursor:pointer;border-left:3px solid white;background:rgba(255,255,255,0.1);font-size:14px;">
                        🎨 Theme
                    </div>
                    <div class="settings-nav" data-section="desktop" style="padding:12px 20px;cursor:pointer;border-left:3px solid transparent;font-size:14px;">
                        🖥️ Desktop
                    </div>
                    <div class="settings-nav" data-section="info" style="padding:12px 20px;cursor:pointer;border-left:3px solid transparent;font-size:14px;">
                        ℹ️ Info
                    </div>
                </div>

                <!-- Content -->
                <div style="flex:1;overflow-y:auto;">
                    <!-- Theme Section -->
                    <div id="section-theme" class="settings-section" style="padding:20px;">
                        <h2 style="margin:0 0 10px;color:#333;">Theme Settings</h2>
                        <p style="color:#666;margin-bottom:20px;">Customize desktop appearance</p>
                        <div id="theme-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;"></div>
                    </div>

                    <!-- Desktop Section -->
                    <div id="section-desktop" class="settings-section" style="display:none;padding:16px;">
                        <h2 style="margin:0 0 20px 0;text-align:center;color:#2c3e50;">Desktop Settings</h2>
                        
                        <div style="background:white;border-radius:8px;padding:16px;margin-bottom:16px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                            <h3 style="margin-top:0;color:#1976d2;border-bottom:2px solid #1976d2;padding-bottom:8px;">Icon Appearance</h3>
                            
                            <div style="margin:12px 0;">
                                <label style="display:block;margin-bottom:8px;color:#333;font-weight:600;">Icon Size</label>
                                <select id="iconSize" style="width:100%;padding:10px;border:2px solid #e0e0e0;border-radius:6px;font-size:14px;background:white;">
                                    <option value="small">Small (32px) - Compact view</option>
                                    <option value="medium">Medium (48px) - Balanced</option>
                                    <option value="large">Large (64px) - Easy to see</option>
                                </select>
                            </div>
                            
                            <div style="margin:12px 0;">
                                <label style="display:block;margin-bottom:8px;color:#333;font-weight:600;">Icon Spacing</label>
                                <select id="iconSpacing" style="width:100%;padding:10px;border:2px solid #e0e0e0;border-radius:6px;font-size:14px;background:white;">
                                    <option value="tight">Tight (8px) - More icons</option>
                                    <option value="normal">Normal (15px) - Comfortable</option>
                                    <option value="loose">Loose (25px) - Spacious</option>
                                </select>
                            </div>
                            
                            <div style="margin:12px 0;padding:12px;background:#f5f5f5;border-radius:6px;">
                                <label style="display:flex;align-items:center;color:#333;cursor:pointer;">
                                    <input type="checkbox" id="showLabels" style="margin-right:10px;width:18px;height:18px;cursor:pointer;">
                                    <span style="font-weight:600;">Show icon labels</span>
                                </label>
                                <p style="margin:8px 0 0 28px;font-size:12px;color:#666;">Display app names below icons</p>
                            </div>
                        </div>

                        <div style="background:white;border-radius:8px;padding:16px;margin-bottom:16px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                            <h3 style="margin-top:0;color:#1976d2;border-bottom:2px solid #1976d2;padding-bottom:8px;">Interaction Behavior</h3>
                            
                            <div style="margin:12px 0;padding:12px;background:#f5f5f5;border-radius:6px;">
                                <label style="display:flex;align-items:center;color:#333;cursor:pointer;">
                                    <input type="checkbox" id="doubleClickToOpen" style="margin-right:10px;width:18px;height:18px;cursor:pointer;">
                                    <span style="font-weight:600;">Double-click to open apps</span>
                                </label>
                                <p style="margin:8px 0 0 28px;font-size:12px;color:#666;">Single click will just select the icon</p>
                            </div>
                        </div>

                        <div style="background:white;border-radius:8px;padding:16px;margin-bottom:16px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                            <h3 style="margin-top:0;color:#1976d2;border-bottom:2px solid #1976d2;padding-bottom:8px;">Layout Configuration</h3>
                            
                            <div style="margin:12px 0;">
                                <label style="display:block;margin-bottom:8px;color:#333;font-weight:600;">Icon Arrangement Method</label>
                                <select id="layoutMode" style="width:100%;padding:10px;border:2px solid #e0e0e0;border-radius:6px;font-size:14px;background:white;">
                                    <option value="auto">Auto Detect - Adapts to screen size</option>
                                    <option value="grid">Grid Layout - Fixed columns</option>
                                    <option value="lost">Adaptive Layout - Dynamic fitting</option>
                                </select>
                            </div>
                            
                            <div id="columnsPerRowContainer" style="margin:12px 0;display:none;">
                                <label style="display:block;margin-bottom:8px;color:#333;font-weight:600;">Columns per Row (Grid Mode Only)</label>
                                <select id="columnsPerRow" style="width:100%;padding:10px;border:2px solid #e0e0e0;border-radius:6px;font-size:14px;background:white;">
                                    <option value="2">2 Columns - Wide icons</option>
                                    <option value="3">3 Columns - Standard tablet</option>
                                    <option value="4">4 Columns - Desktop default</option>
                                    <option value="5">5 Columns - Compact desktop</option>
                                    <option value="6">6 Columns - Large screens</option>
                                </select>
                            </div>

                            <div style="margin-top:12px;padding:12px;background:#e3f2fd;border-left:4px solid #1976d2;border-radius:4px;font-size:13px;color:#1976d2;">
                                <strong>Layout Modes Explained:</strong><br>
                                <div style="margin-top:8px;line-height:1.6;">
                                    • <strong>Auto Detect:</strong> Automatically chooses the best layout based on screen size and orientation<br>
                                    • <strong>Grid:</strong> Fixed number of columns - consistent positioning across sessions<br>
                                    • <strong>Adaptive:</strong> Dynamic layout that adjusts when icons don't fit optimally
                                </div>
                            </div>
                        </div>
                        
                        <div style="display:flex;gap:12px;margin-top:20px;padding-top:20px;border-top:2px solid #e0e0e0;">
                            <button id="resetSettings" style="flex:1;padding:12px;background:#dc3545;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600;">
                                Reset to Defaults
                            </button>
                            <button id="applySettings" style="flex:1;padding:12px;background:#28a745;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600;">
                                Apply Settings
                            </button>
                        </div>
                        <div id="statusMessage" style="margin-top:12px;padding:12px;border-radius:6px;font-size:13px;display:none;"></div>
                    </div>

                    <!-- Info Section -->
                    <div id="section-info" class="settings-section" style="display:none;padding:20px;">
                        <h2 style="margin:0 0 10px;color:#333;">Screen Information</h2>
                        <div style="background:white;border-radius:8px;padding:16px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                            <div id="screenInfo" style="font-family:'Courier New',monospace;font-size:13px;line-height:1.8;color:#444;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <style>
            .settings-nav{transition:all 0.2s;}
            .settings-nav:hover{background:rgba(255,255,255,0.15)!important;}
            .settings-nav.active{background:rgba(255,255,255,0.2)!important;border-left:3px solid white!important;}
            .theme-card{border:3px solid transparent;border-radius:8px;padding:12px;cursor:pointer;transition:all 0.3s;background:white;}
            .theme-card:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,0.15);}
            .theme-card.active{border-color:var(--theme-primary-2,#5b2c82);box-shadow:0 4px 12px rgba(0,0,0,0.2);}
            </style>
        `;

        const win = window.WindowManager.createWindow('Desktop Settings', settingsHTML, 600, 520);
        this.setupHandlers(win);
        this.setupNavigation(win);
        this.loadCurrentSettings(win);
        this.renderThemes(win);
        return win;
    },

    setupNavigation(win) {
        win.querySelectorAll('.settings-nav').forEach(nav => {
            nav.addEventListener('click', () => {
                const section = nav.dataset.section;
                
                // Update nav
                win.querySelectorAll('.settings-nav').forEach(n => {
                    n.classList.remove('active');
                    n.style.background = 'transparent';
                    n.style.borderLeft = '3px solid transparent';
                });
                nav.classList.add('active');
                nav.style.background = 'rgba(255,255,255,0.2)';
                nav.style.borderLeft = '3px solid white';
                
                // Update sections
                win.querySelectorAll('.settings-section').forEach(s => s.style.display = 'none');
                const targetSection = win.querySelector(`#section-${section}`);
                if (targetSection) targetSection.style.display = 'block';
                
                // Update info if needed
                if (section === 'info') this.updateScreenInfo(win);
            });
        });
    },

    renderThemes(win) {
        const grid = win.querySelector('#theme-grid');
        if (!grid || !window.ThemeManager) {
            grid.innerHTML = '<p style="color:#999;">Theme Manager not available</p>';
            return;
        }
        
        const themes = window.ThemeManager.getThemeList();
        const current = window.ThemeManager.getCurrentTheme();
        
        themes.forEach(theme => {
            const card = document.createElement('div');
            card.className = 'theme-card';
            if (theme.id === current.id) card.classList.add('active');
            
            card.innerHTML = `
                <div style="margin-bottom:8px;font-weight:600;color:#333;font-size:13px;">${theme.name}</div>
                <div style="display:flex;gap:4px;margin-bottom:8px;">
                    <div style="width:28px;height:28px;border-radius:4px;background:${theme.colors.primary1};border:1px solid #ddd;"></div>
                    <div style="width:28px;height:28px;border-radius:4px;background:${theme.colors.primary2};border:1px solid #ddd;"></div>
                    <div style="width:28px;height:28px;border-radius:4px;background:${theme.colors.accent};border:1px solid #ddd;"></div>
                </div>
                <button style="width:100%;padding:6px;border:none;border-radius:4px;background:linear-gradient(135deg,${theme.colors.primary1},${theme.colors.primary2});color:white;cursor:pointer;font-size:12px;font-weight:600;">
                    ${theme.id === current.id ? '✓ Active' : 'Apply'}
                </button>
            `;
            
            card.querySelector('button').addEventListener('click', () => {
                if (window.ThemeManager) {
                    window.ThemeManager.applyTheme(theme.id);
                    grid.innerHTML = '';
                    this.renderThemes(win);
                }
            });
            
            grid.appendChild(card);
        });
    },

    setupHandlers(win) {
        const applyBtn = win.querySelector('#applySettings');
        const resetBtn = win.querySelector('#resetSettings');
        const layoutModeSelect = win.querySelector('#layoutMode');
        const columnsContainer = win.querySelector('#columnsPerRowContainer');
        
        if (applyBtn) applyBtn.onclick = () => this.applySettings(win);
        if (resetBtn) resetBtn.onclick = () => {
            this.showStatusMessage(win, 'Resetting to defaults...', 'info');
            this.resetSettings(win);
        };
        
        if (layoutModeSelect) {
            layoutModeSelect.addEventListener('change', (e) => {
                const isGridMode = e.target.value === 'grid';
                if (columnsContainer) columnsContainer.style.display = isGridMode ? 'block' : 'none';
            });
        }
        
        const buttons = [applyBtn, resetBtn].filter(b => b);
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.opacity = '0.9';
                btn.style.transform = 'translateY(-1px)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.opacity = '1';
                btn.style.transform = 'translateY(0)';
            });
        });
        
        const inputs = win.querySelectorAll('select, input');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                if (applyBtn) {
                    applyBtn.style.background = '#ffc107';
                    applyBtn.textContent = 'Apply Changes';
                }
            });
        });
    },

    loadCurrentSettings(win) {
        const settings = this.loadSettings();
        
        const iconSize = win.querySelector('#iconSize');
        const iconSpacing = win.querySelector('#iconSpacing');
        const showLabels = win.querySelector('#showLabels');
        const doubleClick = win.querySelector('#doubleClickToOpen');
        const layoutMode = win.querySelector('#layoutMode');
        const columnsPerRow = win.querySelector('#columnsPerRow');
        
        if (iconSize) iconSize.value = settings.iconSize;
        if (iconSpacing) iconSpacing.value = settings.iconSpacing;
        if (showLabels) showLabels.checked = settings.showLabels;
        if (doubleClick) doubleClick.checked = settings.doubleClickToOpen;
        if (layoutMode) layoutMode.value = settings.layoutMode;
        if (columnsPerRow) columnsPerRow.value = settings.columnsPerRow;
        
        const isGridMode = settings.layoutMode === 'grid';
        const columnsContainer = win.querySelector('#columnsPerRowContainer');
        if (columnsContainer) columnsContainer.style.display = isGridMode ? 'block' : 'none';
        
        console.log('Loaded current settings into form:', settings);
    },

    updateScreenInfo(win) {
        const info = win.querySelector('#screenInfo');
        if (!info) return;
        
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isMobile = width < 768;
        const orientation = width > height ? 'landscape' : 'portrait';
        
        const settings = this.loadSettings(); 
        const optimalColumns = this.calculateOptimalGrid(width);
        
        info.innerHTML = `
            <strong>Display:</strong> ${width} × ${height}px<br>
            <strong>Available Height:</strong> ${height - 40}px (minus taskbar)<br>
            <strong>Device Type:</strong> ${isMobile ? 'Mobile/Tablet' : 'Desktop'}<br>
            <strong>Orientation:</strong> ${orientation}<br>
            <strong>Current Layout:</strong> ${settings.layoutMode}<br>
            <strong>Optimal Columns:</strong> ${optimalColumns} (auto-detected)
        `;
    },

    calculateOptimalGrid(width) {
        if (width < 600) return 2;
        if (width < 800) return 3;
        if (width < 1200) return 4;
        if (width < 1600) return 5;
        return 6;
    },

    applySettings(win) {
        const newSettings = {
            iconSize: win.querySelector('#iconSize').value,
            iconSpacing: win.querySelector('#iconSpacing').value,
            showLabels: win.querySelector('#showLabels').checked,
            doubleClickToOpen: win.querySelector('#doubleClickToOpen').checked,
            layoutMode: win.querySelector('#layoutMode').value,
            columnsPerRow: parseInt(win.querySelector('#columnsPerRow').value)
        };
        
        console.log('DesktopSettingsApp applying settings:', newSettings);
        
        if (this.saveSettings(newSettings)) {
            const verification = this.loadSettings();
            console.log('Settings verification after save:', verification);
            
            if (verification.doubleClickToOpen !== newSettings.doubleClickToOpen) {
                console.error('CRITICAL: Double-click setting did not save correctly!');
                this.showStatusMessage(win, 'Error saving double-click setting. Please try again.', 'error');
                return;
            }
            
            if (window.EventBus) {
                window.EventBus.emit('desktop-settings-updated', newSettings);
                console.log('Broadcasted settings update via EventBus:', newSettings);
            }
            
            this.showStatusMessage(win, 'Settings saved and applied successfully!', 'success');
            
            const applyBtn = win.querySelector('#applySettings');
            if (applyBtn) {
                applyBtn.style.background = '#28a745';
                applyBtn.textContent = 'Settings Applied';
            }
        } else {
            this.showStatusMessage(win, 'Failed to save settings. Please try again.', 'error');
        }
    },

    resetSettings(win) {
        const defaults = { ...this.defaultSettings };
        
        console.log('Resetting to default settings:', defaults);
        
        if (this.saveSettings(defaults)) {
            if (window.EventBus) {
                window.EventBus.emit('desktop-settings-updated', defaults);
            }
            
            win.querySelector('#iconSize').value = defaults.iconSize;
            win.querySelector('#iconSpacing').value = defaults.iconSpacing;
            win.querySelector('#showLabels').checked = defaults.showLabels;
            win.querySelector('#doubleClickToOpen').checked = defaults.doubleClickToOpen;
            win.querySelector('#layoutMode').value = defaults.layoutMode;
            win.querySelector('#columnsPerRow').value = defaults.columnsPerRow;
            
            const applyBtn = win.querySelector('#applySettings');
            if (applyBtn) {
                applyBtn.style.background = '#28a745';
                applyBtn.textContent = 'Settings Applied';
            }

            const columnsContainer = win.querySelector('#columnsPerRowContainer');
            if (columnsContainer) columnsContainer.style.display = 'none';

            this.showStatusMessage(win, 'Settings reset to defaults!', 'success');
        } else {
            this.showStatusMessage(win, 'Failed to reset settings.', 'error');
        }
    },

    showStatusMessage(win, message, type = 'info') {
        const statusDiv = win.querySelector('#statusMessage');
        if (!statusDiv) return;
        
        const colors = {
            success: { bg: '#d4edda', border: '#28a745', text: '#155724' },
            error: { bg: '#f8d7da', border: '#dc3545', text: '#721c24' },
            info: { bg: '#d1ecf1', border: '#17a2b8', text: '#0c5460' }
        };
        
        const color = colors[type];
        statusDiv.style.cssText = `
            display: block;
            background: ${color.bg};
            border: 2px solid ${color.border};
            color: ${color.text};
            padding: 12px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
        `;
        statusDiv.textContent = message;
        
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    },

    debugCurrentSettings() {
        const current = this.loadSettings();
        console.log('Current settings from localStorage:', current);
        return current;
    }
};

if (window.AppRegistry) { 
    window.AppRegistry.registerApp({ 
        id: 'desktop-settings', 
        name: 'Desktop Settings', 
        icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><circle cx='24' cy='24' r='20' fill='%23444'/><circle cx='24' cy='24' r='8' fill='none' stroke='white' stroke-width='2'/><path d='M24 4v4M24 40v4M44 24h-4M8 24H4M37.2 10.8l-2.8 2.8M13.6 35.4l-2.8 2.8M37.2 37.2l-2.8-2.8M13.6 12.6l-2.8-2.8' stroke='white' stroke-width='2'/></svg>", 
        handler: () => window.DesktopSettingsApp.open(), 
        singleInstance: true, 
        documentation: { 
            name: 'Desktop Settings', 
            version: '3.1.0', 
            description: 'Configure desktop layout, icon appearance, theme, and interaction preferences with persistent state management.', 
            type: 'System', 
            features: [ 
                'Theme control with live preview',
                'Independent state persistence to localStorage', 
                'Icon size and spacing controls', 
                'Layout mode selection (auto/grid/adaptive)', 
                'Show/hide icon labels', 
                'Click behavior preferences', 
                'Grid column configuration', 
                'Screen information display', 
                'Reset to defaults functionality' 
            ] 
        } 
    }); 
}