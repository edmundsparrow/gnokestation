/**
 * Smart Home Controller Template
 * Version: 4.1.0
 * A modern IoT device management interface (concept/template)
 * Note: This is an independent demo/template not affiliated with any brand
 */

(function() {
    'use strict';

    const THEMES = {
        itel: { primary: '#FF6B35', secondary: '#F7931E', name: 'Itel Orange' },
        dirtyBlue: { primary: '#5B7C99', secondary: '#7A9AB8', name: 'Dirty Blue' },
        dirtyGreen: { primary: '#6B8E6F', secondary: '#8AAA8E', name: 'Dirty Green' },
        oldWood: { primary: '#8B7355', secondary: '#A68A6D', name: 'Old Wood Vellum' }
    };

    // In-memory device storage - expanded device list
    const devices = {
        'dev001': { id: 'dev001', name: 'Living Room TV', type: 'tv', status: 'on', brightness: 75, connected: true },
        'dev002': { id: 'dev002', name: 'Main Ceiling Light', type: 'light', status: 'on', brightness: 80, connected: true },
        'dev003': { id: 'dev003', name: 'Bedroom Speaker', type: 'speaker', status: 'off', volume: 50, connected: true },
        'dev004': { id: 'dev004', name: 'Kitchen TV', type: 'tv', status: 'off', brightness: 75, connected: false },
        'dev005': { id: 'dev005', name: 'Bedside Lamp', type: 'light', status: 'off', brightness: 100, connected: true },
        'dev006': { id: 'dev006', name: 'Dining Light', type: 'light', status: 'on', brightness: 60, connected: true },
        'dev007': { id: 'dev007', name: 'Outdoor Speaker', type: 'speaker', status: 'off', volume: 70, connected: true },
        'dev008': { id: 'dev008', name: 'Master Bedroom TV', type: 'tv', status: 'off', brightness: 75, connected: true },
        'dev009': { id: 'dev009', name: 'Porch Light', type: 'light', status: 'off', brightness: 90, connected: false },
        'dev010': { id: 'dev010', name: 'Living Room Speaker', type: 'speaker', status: 'on', volume: 45, connected: true }
    };

    let currentTheme = 'itel';

    window.ItelApp = {
        currentWindow: null,
        activeView: 'home',

        open() {
            const html = this.buildUI();
            const win = window.WindowManager.createWindow('Smart Home Controller', html, 480, 620);
            this.currentWindow = win;
            this.attachHandlers(win);
            this.switchView(win, 'home');
            return win;
        },

        buildUI() {
            const theme = THEMES[currentTheme];
            return `
                <style>
                    .itel-app {
                        display: flex;
                        flex-direction: column;
                        height: 100%;
                        background: linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%);
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        color: white;
                        transition: background 0.3s ease;
                    }
                    .itel-header {
                        padding: 20px;
                        background: rgba(0,0,0,0.2);
                        backdrop-filter: blur(10px);
                        border-bottom: 1px solid rgba(255,255,255,0.1);
                    }
                    .itel-title {
                        margin: 0 0 8px 0;
                        font-size: 24px;
                        font-weight: 700;
                    }
                    .itel-subtitle {
                        margin: 0;
                        font-size: 13px;
                        opacity: 0.8;
                    }
                    .itel-tabs {
                        display: flex;
                        background: rgba(0,0,0,0.15);
                        border-bottom: 1px solid rgba(255,255,255,0.1);
                    }
                    .tab-btn {
                        flex: 1;
                        padding: 14px;
                        background: transparent;
                        border: none;
                        color: rgba(255,255,255,0.6);
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                        border-bottom: 3px solid transparent;
                    }
                    .tab-btn.active {
                        color: white;
                        background: rgba(255,255,255,0.1);
                        border-bottom-color: white;
                    }
                    .itel-content {
                        flex: 1;
                        overflow-y: auto;
                        padding: 20px;
                    }
                    .device-card {
                        background: rgba(255,255,255,0.15);
                        backdrop-filter: blur(10px);
                        border: 1px solid rgba(255,255,255,0.2);
                        border-radius: 16px;
                        padding: 16px;
                        margin-bottom: 12px;
                        transition: transform 0.2s, box-shadow 0.2s;
                        cursor: pointer;
                    }
                    .device-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
                    }
                    .device-card.offline {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }
                    .device-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 12px;
                    }
                    .device-name {
                        font-size: 16px;
                        font-weight: 600;
                        margin: 0;
                    }
                    .device-type {
                        font-size: 11px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        opacity: 0.7;
                    }
                    .device-status {
                        padding: 4px 12px;
                        border-radius: 12px;
                        font-size: 11px;
                        font-weight: 600;
                    }
                    .device-status.on {
                        background: rgba(76,175,80,0.3);
                        border: 1px solid rgba(76,175,80,0.5);
                    }
                    .device-status.off {
                        background: rgba(158,158,158,0.3);
                        border: 1px solid rgba(158,158,158,0.5);
                    }
                    .device-controls {
                        display: flex;
                        gap: 8px;
                        flex-wrap: wrap;
                    }
                    .control-btn {
                        flex: 1;
                        min-width: 80px;
                        padding: 10px 16px;
                        border: 1px solid rgba(255,255,255,0.3);
                        background: rgba(255,255,255,0.1);
                        color: white;
                        border-radius: 8px;
                        font-size: 13px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .control-btn:hover {
                        background: rgba(255,255,255,0.2);
                        transform: scale(1.05);
                    }
                    .control-btn:active {
                        transform: scale(0.98);
                    }
                    .control-btn.primary {
                        background: rgba(255,255,255,0.25);
                        border-color: rgba(255,255,255,0.5);
                    }
                    .slider-control {
                        margin-top: 12px;
                        width: 100%;
                    }
                    .slider-label {
                        font-size: 12px;
                        margin-bottom: 8px;
                        opacity: 0.9;
                    }
                    .slider {
                        width: 100%;
                        height: 6px;
                        border-radius: 3px;
                        background: rgba(255,255,255,0.2);
                        outline: none;
                        -webkit-appearance: none;
                    }
                    .slider::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        width: 18px;
                        height: 18px;
                        border-radius: 50%;
                        background: white;
                        cursor: pointer;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    }
                    .settings-section {
                        background: rgba(255,255,255,0.15);
                        border-radius: 12px;
                        padding: 20px;
                        margin-bottom: 16px;
                    }
                    .settings-title {
                        font-size: 16px;
                        font-weight: 600;
                        margin: 0 0 16px 0;
                    }
                    .theme-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 12px;
                    }
                    .theme-option {
                        padding: 16px;
                        background: rgba(255,255,255,0.1);
                        border: 2px solid rgba(255,255,255,0.2);
                        border-radius: 12px;
                        cursor: pointer;
                        transition: all 0.2s;
                        text-align: center;
                    }
                    .theme-option:hover {
                        background: rgba(255,255,255,0.2);
                        transform: translateY(-2px);
                    }
                    .theme-option.active {
                        border-color: white;
                        background: rgba(255,255,255,0.25);
                    }
                    .theme-preview {
                        width: 100%;
                        height: 40px;
                        border-radius: 8px;
                        margin-bottom: 8px;
                    }
                    .connection-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 12px;
                        background: rgba(0,0,0,0.1);
                        border-radius: 8px;
                        margin-bottom: 8px;
                    }
                    .connection-status {
                        padding: 4px 10px;
                        border-radius: 8px;
                        font-size: 11px;
                        font-weight: 600;
                    }
                    .connection-status.connected {
                        background: rgba(76,175,80,0.3);
                        border: 1px solid rgba(76,175,80,0.5);
                    }
                    .connection-status.disconnected {
                        background: rgba(244,67,54,0.3);
                        border: 1px solid rgba(244,67,54,0.5);
                    }
                    .reconnect-btn {
                        padding: 6px 12px;
                        background: rgba(255,255,255,0.2);
                        border: 1px solid rgba(255,255,255,0.3);
                        border-radius: 6px;
                        color: white;
                        font-size: 12px;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .reconnect-btn:hover {
                        background: rgba(255,255,255,0.3);
                    }
                    .footer {
                        padding: 12px 20px;
                        background: rgba(0,0,0,0.2);
                        border-top: 1px solid rgba(255,255,255,0.1);
                        font-size: 12px;
                        text-align: center;
                        opacity: 0.8;
                    }
                    .add-device-btn {
                        width: 100%;
                        padding: 12px;
                        background: rgba(255,255,255,0.2);
                        border: 2px dashed rgba(255,255,255,0.4);
                        border-radius: 12px;
                        color: white;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                        margin-bottom: 20px;
                    }
                    .add-device-btn:hover {
                        background: rgba(255,255,255,0.3);
                        border-style: solid;
                    }
                </style>

                <div class="itel-app">
                    <div class="itel-header">
                        <h1 class="itel-title">Smart Home Controller</h1>
                        <p class="itel-subtitle">IoT Device Management Template</p>
                    </div>

                    <div class="itel-tabs">
                        <button class="tab-btn" data-view="home">Home</button>
                        <button class="tab-btn" data-view="settings">Settings</button>
                    </div>

                    <div class="itel-content" id="app-content"></div>

                    <div class="footer">
                        Template by Gnokestation • Concept Demo
                    </div>
                </div>
            `;
        },

        attachHandlers(win) {
            const tabs = win.querySelectorAll('.tab-btn');
            tabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    const view = e.target.getAttribute('data-view');
                    this.switchView(win, view);
                });
            });
        },

        switchView(win, view) {
            this.activeView = view;
            
            // Update tab buttons
            win.querySelectorAll('.tab-btn').forEach(tab => {
                tab.classList.toggle('active', tab.getAttribute('data-view') === view);
            });

            // Render content
            const content = win.querySelector('#app-content');
            if (view === 'home') {
                this.renderHomeView(content);
            } else if (view === 'settings') {
                this.renderSettingsView(content);
            }
        },

        renderHomeView(container) {
            const deviceArray = Object.values(devices);

            container.innerHTML = `
                <button class="add-device-btn" id="add-device">+ Add New Device</button>
                <div id="device-list"></div>
            `;

            const addBtn = container.querySelector('#add-device');
            addBtn.addEventListener('click', () => this.showAddDeviceDialog());

            const list = container.querySelector('#device-list');
            list.innerHTML = deviceArray.map(device => this.createDeviceCard(device)).join('');

            // Attach control handlers
            list.querySelectorAll('.control-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const deviceId = btn.getAttribute('data-device-id');
                    const action = btn.getAttribute('data-action');
                    this.handleDeviceAction(deviceId, action);
                });
            });

            list.querySelectorAll('.slider').forEach(slider => {
                slider.addEventListener('input', (e) => {
                    const deviceId = slider.getAttribute('data-device-id');
                    const property = slider.getAttribute('data-property');
                    const value = parseInt(slider.value);
                    this.updateDeviceProperty(deviceId, property, value);
                });
            });
        },

        renderSettingsView(container) {
            container.innerHTML = `
                <div class="settings-section">
                    <h3 class="settings-title">Theme</h3>
                    <div class="theme-grid" id="theme-grid"></div>
                </div>

                <div class="settings-section">
                    <h3 class="settings-title">Device Connections</h3>
                    <div id="connections-list"></div>
                </div>
            `;

            // Render themes
            const themeGrid = container.querySelector('#theme-grid');
            themeGrid.innerHTML = Object.entries(THEMES).map(([key, theme]) => `
                <div class="theme-option ${key === currentTheme ? 'active' : ''}" data-theme="${key}">
                    <div class="theme-preview" style="background: linear-gradient(135deg, ${theme.primary}, ${theme.secondary})"></div>
                    <div style="font-size: 13px; font-weight: 600;">${theme.name}</div>
                </div>
            `).join('');

            themeGrid.querySelectorAll('.theme-option').forEach(opt => {
                opt.addEventListener('click', () => {
                    const theme = opt.getAttribute('data-theme');
                    this.changeTheme(theme);
                });
            });

            // Render connections
            const connectionsList = container.querySelector('#connections-list');
            connectionsList.innerHTML = Object.values(devices).map(device => `
                <div class="connection-item">
                    <div>
                        <div style="font-weight: 600; margin-bottom: 4px;">${device.name}</div>
                        <div style="font-size: 11px; opacity: 0.7;">${device.ip || '192.168.1.' + Math.floor(Math.random() * 200)}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span class="connection-status ${device.connected ? 'connected' : 'disconnected'}">
                            ${device.connected ? 'Connected' : 'Disconnected'}
                        </span>
                        ${!device.connected ? `<button class="reconnect-btn" data-device-id="${device.id}">Reconnect</button>` : ''}
                    </div>
                </div>
            `).join('');

            connectionsList.querySelectorAll('.reconnect-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const deviceId = btn.getAttribute('data-device-id');
                    this.reconnectDevice(deviceId);
                });
            });
        },

        createDeviceCard(device) {
            const icon = this.getDeviceIcon(device.type);
            const statusClass = device.status === 'on' ? 'on' : 'off';
            const offlineClass = device.connected ? '' : 'offline';

            let controls = '';
            if (device.connected) {
                controls = this.getDeviceControls(device);
            } else {
                controls = '<p style="margin: 0; opacity: 0.7; font-size: 13px;">Device offline</p>';
            }

            return `
                <div class="device-card ${offlineClass}" data-device-id="${device.id}">
                    <div class="device-header">
                        <div>
                            <div style="font-size: 24px; margin-bottom: 4px;">${icon}</div>
                            <h3 class="device-name">${device.name}</h3>
                            <div class="device-type">${device.type}</div>
                        </div>
                        <div class="device-status ${statusClass}">
                            ${device.status.toUpperCase()}
                        </div>
                    </div>
                    <div class="device-controls">
                        ${controls}
                    </div>
                </div>
            `;
        },

        getDeviceIcon(type) {
            const icons = { tv: '📺', light: '💡', speaker: '🔊' };
            return icons[type] || '📱';
        },

        getDeviceControls(device) {
            let html = `
                <button class="control-btn primary" data-device-id="${device.id}" data-action="toggle">
                    ${device.status === 'on' ? 'Turn Off' : 'Turn On'}
                </button>
            `;

            if (device.type === 'tv') {
                html += `
                    <button class="control-btn" data-device-id="${device.id}" data-action="vol-up">Vol +</button>
                    <button class="control-btn" data-device-id="${device.id}" data-action="vol-down">Vol -</button>
                    <button class="control-btn" data-device-id="${device.id}" data-action="ch-up">CH ↑</button>
                `;
            }

            if (device.type === 'light' && device.status === 'on') {
                html += `
                    <div class="slider-control">
                        <div class="slider-label">Brightness: ${device.brightness}%</div>
                        <input type="range" min="0" max="100" value="${device.brightness}" 
                               class="slider" data-device-id="${device.id}" data-property="brightness">
                    </div>
                `;
            }

            if (device.type === 'speaker') {
                html += `
                    <button class="control-btn" data-device-id="${device.id}" data-action="play">Play</button>
                    <button class="control-btn" data-device-id="${device.id}" data-action="pause">Pause</button>
                `;
                if (device.status === 'on') {
                    html += `
                        <div class="slider-control">
                            <div class="slider-label">Volume: ${device.volume}%</div>
                            <input type="range" min="0" max="100" value="${device.volume}" 
                                   class="slider" data-device-id="${device.id}" data-property="volume">
                        </div>
                    `;
                }
            }

            return html;
        },

        handleDeviceAction(deviceId, action) {
            const device = devices[deviceId];
            if (!device) return;

            switch(action) {
                case 'toggle':
                    device.status = device.status === 'on' ? 'off' : 'on';
                    this.showNotification(`${device.name} turned ${device.status}`);
                    break;
                case 'vol-up':
                case 'vol-down':
                case 'ch-up':
                case 'play':
                case 'pause':
                    this.showNotification(`${device.name}: ${action} executed`);
                    break;
            }

            this.switchView(this.currentWindow, 'home');
        },

        updateDeviceProperty(deviceId, property, value) {
            const device = devices[deviceId];
            if (!device) return;

            device[property] = value;
            
            const label = this.currentWindow.querySelector(`[data-device-id="${deviceId}"][data-property="${property}"]`)
                ?.parentElement.querySelector('.slider-label');
            if (label) {
                label.textContent = `${property.charAt(0).toUpperCase() + property.slice(1)}: ${value}%`;
            }
        },

        changeTheme(themeKey) {
            currentTheme = themeKey;
            const theme = THEMES[themeKey];
            
            const app = this.currentWindow.querySelector('.itel-app');
            app.style.background = `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`;
            
            this.showNotification(`Theme changed to ${theme.name}`);
            this.switchView(this.currentWindow, 'settings');
        },

        reconnectDevice(deviceId) {
            const device = devices[deviceId];
            if (!device) return;

            device.connected = true;
            this.showNotification(`${device.name} reconnected`);
            this.switchView(this.currentWindow, 'settings');
        },

        showAddDeviceDialog() {
            const deviceName = prompt('Enter device name:');
            if (!deviceName) return;

            const deviceType = prompt('Enter device type (tv/light/speaker):');
            if (!deviceType || !['tv', 'light', 'speaker'].includes(deviceType)) {
                alert('Invalid device type. Use: tv, light, or speaker');
                return;
            }

            const newId = 'dev' + String(Date.now()).slice(-6);
            devices[newId] = {
                id: newId,
                name: deviceName,
                type: deviceType,
                status: 'off',
                brightness: 100,
                volume: 50,
                connected: true
            };

            this.showNotification(`${deviceName} added successfully`);
            this.switchView(this.currentWindow, 'home');
        },

        showNotification(message) {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0,0,0,0.9);
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 600;
                z-index: 10000;
                box-shadow: 0 4px 16px rgba(0,0,0,0.3);
                animation: slideIn 0.3s ease;
            `;
            notification.textContent = message;

            document.body.appendChild(notification);
            setTimeout(() => {
                notification.style.animation = 'slideIn 0.3s ease reverse';
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        }
    };

    // Register with AppRegistry
    if (window.AppRegistry) {
        window.AppRegistry.registerApp({
            id: 'itel-smart-home',
            name: 'Itel Controller (Template)',
            icon: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' rx='8' fill='%23FF6B35'/%3E%3Cpath d='M24 14l12 10v14H30V28h-12v10H12V24z' fill='white'/%3E%3C/svg%3E`,
            handler: () => window.ItelApp.open(),
            singleInstance: true
        });
    }

})();
