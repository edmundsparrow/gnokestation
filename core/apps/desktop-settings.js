/* ========================================
 * FILE: core/apps/desktop-settings.js
 * VERSION: 3.0.1 (FIXED)
 * FIXED: Double-click setting now properly saves and broadcasts.
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

    // CRITICAL FIX: Ensure boolean values are properly handled
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
            <div style="height:100%;padding:16px;overflow-y:auto;font-family:'Segoe UI',sans-serif;background:#f8f9fa;">
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
                
                <div style="background:white;border-radius:8px;padding:16px;margin-bottom:16px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                    <h3 style="margin-top:0;color:#666;border-bottom:2px solid #e0e0e0;padding-bottom:8px;">Screen Information</h3>
                    <div id="screenInfo" style="font-family:'Courier New',monospace;font-size:13px;line-height:1.8;color:#444;"></div>
                </div>
                
                <div style="display:flex;gap:12px;margin-top:20px;padding-top:20px;border-top:2px solid #e0e0e0;">
                    <button id="resetSettings" style="flex:1;padding:12px;background:#dc3545;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600;transition:background 0.2s;">
                        Reset to Defaults
                    </button>
                    <button id="applySettings" style="flex:1;padding:12px;background:
#28a745;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600;transition:background 0.2s;"> Apply Settings </button> </div>
        <div id="statusMessage" style="margin-top:12px;padding:12px;border-radius:6px;font-size:13px;display:none;"></div>
        </div>
    `;
    
    const win = window.WindowManager.createWindow('Desktop Settings', settingsHTML, 480, 650);
    this.setupHandlers(win);
    this.loadCurrentSettings(win);
    return win;
},

setupHandlers(win) {
    const applyBtn = win.querySelector('#applySettings');
    const resetBtn = win.querySelector('#resetSettings');
    const layoutModeSelect = win.querySelector('#layoutMode');
    const columnsContainer = win.querySelector('#columnsPerRowContainer');
    
    applyBtn.onclick = () => {
        this.applySettings(win);
    };
    
    resetBtn.onclick = () => {
        this.showStatusMessage(win, 'Resetting to defaults...', 'info');
        this.resetSettings(win);
    };
    
    layoutModeSelect.addEventListener('change', (e) => {
        const isGridMode = e.target.value === 'grid';
        columnsContainer.style.display = isGridMode ? 'block' : 'none';
    });
    
    const buttons = [applyBtn, resetBtn];
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
            applyBtn.style.background = '#ffc107';
            applyBtn.textContent = 'Apply Changes';
        });
    });
},

loadCurrentSettings(win) {
    const settings = this.loadSettings();
    
    win.querySelector('#iconSize').value = settings.iconSize;
    win.querySelector('#iconSpacing').value = settings.iconSpacing;
    win.querySelector('#showLabels').checked = settings.showLabels;
    win.querySelector('#doubleClickToOpen').checked = settings.doubleClickToOpen;
    win.querySelector('#layoutMode').value = settings.layoutMode;
    win.querySelector('#columnsPerRow').value = settings.columnsPerRow;
    
    const isGridMode = settings.layoutMode === 'grid';
    win.querySelector('#columnsPerRowContainer').style.display = isGridMode ? 'block' : 'none';
    
    this.updateScreenInfo(win);
    
    console.log('Loaded current settings into form:', settings);
},

updateScreenInfo(win) {
    const info = win.querySelector('#screenInfo');
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

// CRITICAL FIX: Verify save was successful
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
    console.log('Double-click checkbox state:', win.querySelector('#doubleClickToOpen').checked);
    
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
        applyBtn.style.background = '#28a745';
        applyBtn.textContent = 'Settings Applied';
        
        this.updateScreenInfo(win);
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
            console.log('Broadcasted settings reset via EventBus:', defaults);
        }
        
        win.querySelector('#iconSize').value = defaults.iconSize;
        win.querySelector('#iconSpacing').value = defaults.iconSpacing;
        win.querySelector('#showLabels').checked = defaults.showLabels;
        win.querySelector('#doubleClickToOpen').checked = defaults.doubleClickToOpen;
        win.querySelector('#layoutMode').value = defaults.layoutMode;
        win.querySelector('#columnsPerRow').value = defaults.columnsPerRow;
        
        const applyBtn = win.querySelector('#applySettings');
        applyBtn.style.background = '#28a745';
        applyBtn.textContent = 'Settings Applied';

        win.querySelector('#columnsPerRowContainer').style.display = 'none';

        this.updateScreenInfo(win);
        this.showStatusMessage(win, 'Settings reset to defaults!', 'success');
    } else {
        this.showStatusMessage(win, 'Failed to reset settings.', 'error');
    }
},

showStatusMessage(win, message, type = 'info') {
    const statusDiv = win.querySelector('#statusMessage');
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
    console.log('doubleClickToOpen type:', typeof current.doubleClickToOpen);
    console.log('doubleClickToOpen value:', current.doubleClickToOpen);
    return current;
}
}; // Properly closed window.DesktopSettingsApp object

if (window.AppRegistry) { 
    window.AppRegistry.registerApp({ 
        id: 'desktop-settings', 
        name: 'Desktop Settings', 
        icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><circle cx='24' cy='24' r='20' fill='%23444'/><circle cx='24' cy='24' r='8' fill='none' stroke='white' stroke-width='2'/><path d='M24 4v4M24 40v4M44 24h-4M8 24H4M37.2 10.8l-2.8 2.8M13.6 35.4l-2.8 2.8M37.2 37.2l-2.8-2.8M13.6 12.6l-2.8-2.8' stroke='white' stroke-width='2'/></svg>", 
        handler: () => window.DesktopSettingsApp.open(), 
        singleInstance: true, 
        documentation: { 
            name: 'Desktop Settings', 
            version: '3.0.1', 
            description: 'Configure desktop layout, icon appearance, and interaction preferences with persistent state management. FIXED: Double-click setting now properly saves and applies.', 
            type: 'System', 
            features: [ 
                'Independent state persistence to localStorage', 
                'Icon size and spacing controls', 
                'Layout mode selection (auto/grid/adaptive)', 
                'Show/hide icon labels', 
                'Click behavior preferences (FIXED)', 
                'Grid column configuration', 
                'Screen information display', 
                'Reset to defaults functionality' 
            ] 
        } 
    }); 
}
