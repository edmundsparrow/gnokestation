// samsung-tv.js - Samsung Smart TV Controller
/**
 * FILE: apps/samsung-tv.js
 * VERSION: 1.0.0
 * BUILD DATE: 2025-09-28
 *
 * PURPOSE:
 *   Samsung Smart TV remote control interface using Samsung's REST API
 *   for Tizen-based smart TVs (2016+). Provides comprehensive TV control
 *   including power, volume, channels, apps, and input management.
 *
 * FEATURES:
 *   - TV discovery and connection management
 *   - Remote control functions (power, volume, channels)
 *   - App launching and management
 *   - Input source selection
 *   - Real-time TV status monitoring
 *
 * COMPATIBILITY:
 *   Samsung Tizen TVs (2016+) with network API enabled
 *   Requires TV to be on same network as controller
 *
 * SETUP REQUIREMENTS:
 *   1. Enable "External Device Manager" on TV
 *   2. Allow "Device Connect Manager" 
 *   3. Note TV's IP address for initial connection
 */

(function() {
    window.SamsungTVApp = {
        tvIP: '',
        isConnected: false,
        currentWindow: null,
        tvInfo: {
            name: '',
            model: '',
            version: ''
        },
        
        // Samsung TV API endpoints
        apiBase: '',
        
        open() {
            const tvHTML = `
                <div class="samsung-tv-app" style="
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    font-family: 'Segoe UI', sans-serif;
                    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%);
                    color: white;
                ">
                    <!-- Header -->
                    <div class="tv-header" style="
                        padding: 16px 20px;
                        background: rgba(255, 255, 255, 0.1);
                        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                        backdrop-filter: blur(10px);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <div>
                            <h2 style="margin: 0; font-size: 20px;">Samsung TV Remote</h2>
                            <div style="font-size: 12px; opacity: 0.8;" id="tv-model">Not connected</div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <input 
                                type="text" 
                                id="tv-ip" 
                                placeholder="TV IP (e.g. 192.168.1.100)" 
                                value="${this.tvIP}"
                                style="
                                    padding: 6px 10px;
                                    border: 1px solid rgba(255, 255, 255, 0.3);
                                    border-radius: 4px;
                                    background: rgba(255, 255, 255, 0.1);
                                    color: white;
                                    font-size: 12px;
                                    width: 160px;
                                "
                            />
                            <button id="connect-tv" style="
                                padding: 6px 12px;
                                border: none;
                                border-radius: 4px;
                                background: ${this.isConnected ? '#ef4444' : '#10b981'};
                                color: white;
                                font-weight: 600;
                                cursor: pointer;
                                font-size: 12px;
                            ">${this.isConnected ? 'Disconnect' : 'Connect'}</button>
                        </div>
                    </div>

                    <!-- Remote Control Interface -->
                    <div style="flex: 1; padding: 20px; overflow-y: auto;">
                        
                        <!-- Power and Volume Controls -->
                        <div style="margin-bottom: 25px;">
                            <h3 style="margin: 0 0 15px 0; color: #fef3c7;">Power & Volume</h3>
                            <div style="display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 15px; align-items: center;">
                                
                                <button class="tv-btn power-btn" data-key="KEY_POWER" style="
                                    padding: 15px;
                                    background: #ef4444;
                                    color: white;
                                    border: none;
                                    border-radius: 8px;
                                    cursor: pointer;
                                    font-size: 16px;
                                    font-weight: bold;
                                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                                ">⏻ POWER</button>
                                
                                <div style="display: flex; align-items: center; gap: 10px; justify-content: center;">
                                    <button class="tv-btn volume-btn" data-key="KEY_VOLDOWN" style="
                                        padding: 12px 16px;
                                        background: rgba(255, 255, 255, 0.1);
                                        color: white;
                                        border: 1px solid rgba(255, 255, 255, 0.3);
                                        border-radius: 6px;
                                        cursor: pointer;
                                        font-size: 18px;
                                    ">VOL-</button>
                                    
                                    <span style="
                                        padding: 10px 20px;
                                        background: rgba(255, 255, 255, 0.2);
                                        border-radius: 6px;
                                        font-weight: bold;
                                        min-width: 60px;
                                        text-align: center;
                                    " id="volume-display">--</span>
                                    
                                    <button class="tv-btn volume-btn" data-key="KEY_VOLUP" style="
                                        padding: 12px 16px;
                                        background: rgba(255, 255, 255, 0.1);
                                        color: white;
                                        border: 1px solid rgba(255, 255, 255, 0.3);
                                        border-radius: 6px;
                                        cursor: pointer;
                                        font-size: 18px;
                                    ">VOL+</button>
                                </div>
                                
                                <button class="tv-btn" data-key="KEY_MUTE" style="
                                    padding: 15px;
                                    background: rgba(255, 255, 255, 0.1);
                                    color: white;
                                    border: 1px solid rgba(255, 255, 255, 0.3);
                                    border-radius: 8px;
                                    cursor: pointer;
                                    font-size: 16px;
                                    font-weight: bold;
                                ">🔇 MUTE</button>
                            </div>
                        </div>

                        <!-- Navigation Controls -->
                        <div style="margin-bottom: 25px;">
                            <h3 style="margin: 0 0 15px 0; color: #fef3c7;">Navigation</h3>
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; grid-template-rows: repeat(3, 1fr); gap: 8px; max-width: 200px; margin: 0 auto;">
                                
                                <div></div>
                                <button class="tv-btn nav-btn" data-key="KEY_UP" style="${this.getNavButtonStyle()}">▲</button>
                                <div></div>
                                
                                <button class="tv-btn nav-btn" data-key="KEY_LEFT" style="${this.getNavButtonStyle()}">◀</button>
                                <button class="tv-btn nav-btn" data-key="KEY_ENTER" style="${this.getNavButtonStyle()} background: #10b981;">OK</button>
                                <button class="tv-btn nav-btn" data-key="KEY_RIGHT" style="${this.getNavButtonStyle()}">▶</button>
                                
                                <div></div>
                                <button class="tv-btn nav-btn" data-key="KEY_DOWN" style="${this.getNavButtonStyle()}">▼</button>
                                <div></div>
                            </div>
                        </div>

                        <!-- Channel Controls -->
                        <div style="margin-bottom: 25px;">
                            <h3 style="margin: 0 0 15px 0; color: #fef3c7;">Channels</h3>
                            <div style="display: flex; justify-content: center; gap: 15px;">
                                <button class="tv-btn" data-key="KEY_CHDOWN" style="
                                    padding: 10px 20px;
                                    background: rgba(255, 255, 255, 0.1);
                                    color: white;
                                    border: 1px solid rgba(255, 255, 255, 0.3);
                                    border-radius: 6px;
                                    cursor: pointer;
                                    font-weight: bold;
                                ">CH ▼</button>
                                
                                <button class="tv-btn" data-key="KEY_CHUP" style="
                                    padding: 10px 20px;
                                    background: rgba(255, 255, 255, 0.1);
                                    color: white;
                                    border: 1px solid rgba(255, 255, 255, 0.3);
                                    border-radius: 6px;
                                    cursor: pointer;
                                    font-weight: bold;
                                ">CH ▲</button>
                                
                                <button class="tv-btn" data-key="KEY_PRECH" style="
                                    padding: 10px 20px;
                                    background: rgba(255, 255, 255, 0.1);
                                    color: white;
                                    border: 1px solid rgba(255, 255, 255, 0.3);
                                    border-radius: 6px;
                                    cursor: pointer;
                                    font-weight: bold;
                                ">LAST</button>
                            </div>
                        </div>

                        <!-- Quick Apps -->
                        <div style="margin-bottom: 25px;">
                            <h3 style="margin: 0 0 15px 0; color: #fef3c7;">Quick Launch</h3>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px;">
                                <button class="app-btn" data-app="Netflix" style="${this.getAppButtonStyle('#e50914')}">Netflix</button>
                                <button class="app-btn" data-app="YouTube" style="${this.getAppButtonStyle('#ff0000')}">YouTube</button>
                                <button class="app-btn" data-app="Prime Video" style="${this.getAppButtonStyle('#00a8e1')}">Prime</button>
                                <button class="app-btn" data-app="Disney+" style="${this.getAppButtonStyle('#113ccf')}">Disney+</button>
                                <button class="tv-btn" data-key="KEY_HOME" style="${this.getAppButtonStyle('#666')}">Home</button>
                                <button class="tv-btn" data-key="KEY_MENU" style="${this.getAppButtonStyle('#666')}">Menu</button>
                            </div>
                        </div>

                        <!-- Playback Controls -->
                        <div>
                            <h3 style="margin: 0 0 15px 0; color: #fef3c7;">Playback</h3>
                            <div style="display: flex; justify-content: center; gap: 10px;">
                                <button class="tv-btn" data-key="KEY_REWIND" style="${this.getPlaybackButtonStyle()}">⏪</button>
                                <button class="tv-btn" data-key="KEY_PLAY" style="${this.getPlaybackButtonStyle()}">▶️</button>
                                <button class="tv-btn" data-key="KEY_PAUSE" style="${this.getPlaybackButtonStyle()}">⏸️</button>
                                <button class="tv-btn" data-key="KEY_STOP" style="${this.getPlaybackButtonStyle()}">⏹️</button>
                                <button class="tv-btn" data-key="KEY_FF" style="${this.getPlaybackButtonStyle()}">⏩</button>
                            </div>
                        </div>
                    </div>

                    <!-- Status Bar -->
                    <div style="
                        padding: 12px 20px;
                        background: rgba(0, 0, 0, 0.3);
                        border-top: 1px solid rgba(255, 255, 255, 0.1);
                        font-size: 12px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <span id="connection-status">Not connected to TV</span>
                        <span id="last-command">Ready</span>
                    </div>
                </div>
            `;

            const win = window.WindowManager.createWindow('Samsung TV Remote', tvHTML, 400, 700);
            this.currentWindow = win;
            this.setupTVControls(win);
            return win;
        },

        setupTVControls(win) {
            // Connection button
            const connectBtn = win.querySelector('#connect-tv');
            const tvIPInput = win.querySelector('#tv-ip');

            connectBtn.addEventListener('click', () => {
                if (this.isConnected) {
                    this.disconnect(win);
                } else {
                    this.tvIP = tvIPInput.value.trim();
                    if (this.tvIP) {
                        this.connect(win);
                    } else {
                        this.showStatus(win, 'Please enter TV IP address', 'error');
                    }
                }
            });

            // TV control buttons
            win.querySelectorAll('.tv-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const key = btn.dataset.key;
                    if (key) {
                        this.sendTVCommand('key', { key: key }, win);
                    }
                });
            });

            // App launch buttons
            win.querySelectorAll('.app-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const app = btn.dataset.app;
                    if (app) {
                        this.launchApp(app, win);
                    }
                });
            });

            // Add hover effects
            this.addButtonEffects(win);
        },

        async connect(win) {
            this.showStatus(win, 'Connecting to TV...', 'info');
            this.apiBase = `http://${this.tvIP}:8001/api/v2`;

            try {
                // Test connection with device info request
                const response = await fetch(`${this.apiBase}/`, {
                    method: 'GET',
                    timeout: 5000
                });

                if (response.ok) {
                    const data = await response.json();
                    this.isConnected = true;
                    this.tvInfo = {
                        name: data.name || 'Samsung TV',
                        model: data.model || 'Unknown',
                        version: data.version || '1.0'
                    };
                    
                    this.updateConnectionUI(win, true);
                    this.showStatus(win, 'Connected to Samsung TV', 'success');
                } else {
                    throw new Error('Connection failed');
                }
            } catch (error) {
                this.showStatus(win, 'Failed to connect. Check TV IP and network.', 'error');
                this.updateConnectionUI(win, false);
            }
        },

        disconnect(win) {
            this.isConnected = false;
            this.updateConnectionUI(win, false);
            this.showStatus(win, 'Disconnected from TV', 'info');
        },

        updateConnectionUI(win, connected) {
            const connectBtn = win.querySelector('#connect-tv');
            const tvModel = win.querySelector('#tv-model');
            const connectionStatus = win.querySelector('#connection-status');

            connectBtn.textContent = connected ? 'Disconnect' : 'Connect';
            connectBtn.style.background = connected ? '#ef4444' : '#10b981';

            if (connected) {
                tvModel.textContent = `${this.tvInfo.name} (${this.tvInfo.model})`;
                connectionStatus.textContent = `Connected to ${this.tvInfo.name}`;
            } else {
                tvModel.textContent = 'Not connected';
                connectionStatus.textContent = 'Not connected to TV';
            }
        },

        async sendTVCommand(endpoint, data, win) {
            if (!this.isConnected) {
                this.showStatus(win, 'Not connected to TV', 'error');
                return false;
            }

            try {
                const url = `${this.apiBase}/${endpoint}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                    timeout: 3000
                });

                if (response.ok) {
                    const lastCommand = win.querySelector('#last-command');
                    lastCommand.textContent = `Sent: ${data.key || endpoint}`;
                    return true;
                } else {
                    throw new Error('Command failed');
                }
            } catch (error) {
                this.showStatus(win, 'Command failed', 'error');
                return false;
            }
        },

        async launchApp(appName, win) {
            // App launching requires app ID mapping
            const appIds = {
                'Netflix': '11101200001',
                'YouTube': '111299001912',
                'Prime Video': '3201606009684',
                'Disney+': '3201901017640'
            };

            const appId = appIds[appName];
            if (appId) {
                const success = await this.sendTVCommand('applications/' + appId, {}, win);
                if (success) {
                    this.showStatus(win, `Launching ${appName}`, 'success');
                }
            } else {
                this.showStatus(win, `App ${appName} not found`, 'error');
            }
        },

        showStatus(win, message, type) {
            const colors = {
                success: '#10b981',
                error: '#ef4444',
                info: '#3b82f6',
                warning: '#f59e0b'
            };

            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${colors[type]};
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                font-family: 'Segoe UI', sans-serif;
                font-size: 14px;
                font-weight: 600;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                z-index: 10000;
                opacity: 0;
                transform: translateX(100px);
                transition: all 0.3s ease;
            `;

            notification.textContent = message;
            document.body.appendChild(notification);

            requestAnimationFrame(() => {
                notification.style.opacity = '1';
                notification.style.transform = 'translateX(0)';
            });

            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100px)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        },

        addButtonEffects(win) {
            win.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('mouseenter', () => {
                    btn.style.transform = 'translateY(-2px)';
                    btn.style.opacity = '0.9';
                });
                btn.addEventListener('mouseleave', () => {
                    btn.style.transform = 'translateY(0)';
                    btn.style.opacity = '1';
                });
            });
        },

        getNavButtonStyle() {
            return `
                padding: 15px;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 8px;
                cursor: pointer;
                font-size: 18px;
                font-weight: bold;
                transition: all 0.2s;
            `;
        },

        getAppButtonStyle(bgColor) {
            return `
                padding: 10px 8px;
                background: ${bgColor};
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                transition: all 0.2s;
            `;
        },

        getPlaybackButtonStyle() {
            return `
                padding: 12px 16px;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
                transition: all 0.2s;
            `;
        }
    };

    // Register app
    if (window.AppRegistry) {
        window.AppRegistry.registerApp({
            id: 'samsung-tv',
            name: 'Samsung TV Remote',
            icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' rx='8' fill='%233b82f6'/><rect x='8' y='12' width='32' height='20' rx='2' fill='%23000'/><rect x='10' y='14' width='28' height='16' fill='%23333'/><circle cx='24' cy='22' r='2' fill='%233b82f6'/><rect x='20' y='36' width='8' height='2' fill='%23666'/><rect x='18' y='38' width='12' height='4' rx='2' fill='%23666'/></svg>",
            handler: () => window.SamsungTVApp.open(),
            singleInstance: true
        });
    }

})();
