// odroid.js - Production-Ready ODROID Hardware Controller Interface
/**
 * FILE: apps/odroid.js
 * VERSION: 2.0.0 - PRODUCTION READY
 * BUILD DATE: 2025-09-27
 *
 * PURPOSE:
 * Production ODROID hardware monitoring and control interface for industrial applications.
 * Connects to real backend APIs for live hardware data and control capabilities.
 *
 * BACKEND API ENDPOINTS (to be implemented by ODROID team):
 * GET  /api/system/info     - Device info, model, version
 * GET  /api/system/status   - CPU, memory, temperature, uptime
 * GET  /api/gpio/status     - All GPIO pin states
 * POST /api/gpio/control    - Control GPIO pins
 * GET  /api/network/status  - Network interface information
 * GET  /api/storage/status  - Storage usage statistics
 * POST /api/system/command  - Execute system commands
 *
 * FEATURES:
 * - Real-time hardware monitoring
 * - GPIO pin control interface with safety checks
 * - Network status and configuration
 * - Storage management dashboard
 * - Error handling and connection status
 * - Responsive design for touchscreen interfaces
 * - Industrial-grade reliability
 */

(function() {
    window.ODROIDApp = {
        // Configuration
        apiBaseUrl: window.location.origin + '/api', // Assumes backend on same server
        deviceInfo: null,
        isConnected: false,
        currentWindow: null,
        updateInterval: null,
        reconnectAttempts: 0,
        maxReconnectAttempts: 5,
        updateFrequency: 2000, // 2 seconds
        
        // Connection status tracking
        connectionStatus: {
            api: false,
            lastUpdate: null,
            errorCount: 0
        },

        open() {
            const odroidHTML = `
                <div class="odroid-app" style="
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    font-family: 'Segoe UI', sans-serif;
                    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%);
                    color: white;
                    overflow: hidden;
                ">
                    <div class="odroid-header" style="
                        padding: 16px 20px;
                        background: rgba(255, 255, 255, 0.1);
                        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                        backdrop-filter: blur(10px);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <div>
                            <h2 style="margin: 0; font-size: 20px; color: #fbbf24;">ODROID Controller</h2>
                            <div style="font-size: 12px; opacity: 0.8;" id="device-info">Device: Connecting...</div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div id="connection-indicator" style="
                                width: 12px;
                                height: 12px;
                                border-radius: 50%;
                                background: #ef4444;
                                box-shadow: 0 0 10px #ef4444;
                                animation: pulse 2s infinite;
                            "></div>
                            <span id="connection-text" style="font-size: 12px;">Connecting...</span>
                        </div>
                    </div>

                    <div style="display: flex; height: calc(100% - 70px);">
                        <div class="sidebar" style="
                            width: 180px;
                            background: rgba(0, 0, 0, 0.2);
                            border-right: 1px solid rgba(255, 255, 255, 0.1);
                            padding: 20px 0;
                        ">
                            <div class="nav-item active" data-tab="monitor" style="
                                padding: 12px 20px;
                                cursor: pointer;
                                border-left: 3px solid #fbbf24;
                                background: rgba(255, 255, 255, 0.1);
                                font-size: 14px;
                                font-weight: 600;
                            ">📊 System Monitor</div>
                            
                            <div class="nav-item" data-tab="gpio" style="
                                padding: 12px 20px;
                                cursor: pointer;
                                border-left: 3px solid transparent;
                                font-size: 14px;
                                transition: all 0.3s;
                            ">⚡ GPIO Control</div>
                            
                            <div class="nav-item" data-tab="network" style="
                                padding: 12px 20px;
                                cursor: pointer;
                                border-left: 3px solid transparent;
                                font-size: 14px;
                                transition: all 0.3s;
                            ">🌐 Network</div>
                            
                            <div class="nav-item" data-tab="storage" style="
                                padding: 12px 20px;
                                cursor: pointer;
                                border-left: 3px solid transparent;
                                font-size: 14px;
                                transition: all 0.3s;
                            ">💾 Storage</div>
                            
                            <div class="nav-item" data-tab="diagnostics" style="
                                padding: 12px 20px;
                                cursor: pointer;
                                border-left: 3px solid transparent;
                                font-size: 14px;
                                transition: all 0.3s;
                            ">🔧 Diagnostics</div>
                        </div>

                        <div class="main-content" style="
                            flex: 1;
                            padding: 20px;
                            overflow-y: auto;
                        ">
                            <!-- System Monitor Tab -->
                            <div id="tab-monitor" class="tab-content" style="display: block;">
                                <h3 style="margin: 0 0 20px 0; color: #fbbf24;">System Status</h3>
                                
                                <div id="connection-error" style="
                                    display: none;
                                    background: rgba(239, 68, 68, 0.2);
                                    border: 1px solid #ef4444;
                                    border-radius: 8px;
                                    padding: 15px;
                                    margin-bottom: 20px;
                                    color: #fecaca;
                                ">
                                    <h4 style="margin: 0 0 8px 0;">Connection Error</h4>
                                    <div id="error-message">Unable to connect to ODROID backend API</div>
                                    <button id="retry-connection" style="
                                        margin-top: 10px;
                                        padding: 6px 12px;
                                        background: #ef4444;
                                        color: white;
                                        border: none;
                                        border-radius: 4px;
                                        cursor: pointer;
                                    ">Retry Connection</button>
                                </div>
                                
                                <div id="system-metrics" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                                    <div class="metric-card" style="
                                        background: rgba(255, 255, 255, 0.1);
                                        padding: 20px;
                                        border-radius: 12px;
                                        border: 1px solid rgba(255, 255, 255, 0.2);
                                    ">
                                        <div style="font-size: 14px; opacity: 0.8; margin-bottom: 8px;">CPU Usage</div>
                                        <div style="display: flex; align-items: center; gap: 15px;">
                                            <div style="font-size: 28px; font-weight: bold;" id="cpu-usage">--</div>
                                            <div style="
                                                flex: 1;
                                                height: 8px;
                                                background: rgba(255, 255, 255, 0.2);
                                                border-radius: 4px;
                                                overflow: hidden;
                                            ">
                                                <div id="cpu-bar" style="
                                                    height: 100%;
                                                    width: 0%;
                                                    background: linear-gradient(90deg, #10b981, #fbbf24);
                                                    transition: width 0.5s ease;
                                                "></div>
                                            </div>
                                        </div>
                                        <div style="font-size: 12px; opacity: 0.7; margin-top: 8px;" id="cpu-temp">Temperature: --</div>
                                    </div>

                                    <div class="metric-card" style="
                                        background: rgba(255, 255, 255, 0.1);
                                        padding: 20px;
                                        border-radius: 12px;
                                        border: 1px solid rgba(255, 255, 255, 0.2);
                                    ">
                                        <div style="font-size: 14px; opacity: 0.8; margin-bottom: 8px;">Memory Usage</div>
                                        <div style="display: flex; align-items: center; gap: 15px;">
                                            <div style="font-size: 28px; font-weight: bold;" id="memory-usage">--</div>
                                            <div style="
                                                flex: 1;
                                                height: 8px;
                                                background: rgba(255, 255, 255, 0.2);
                                                border-radius: 4px;
                                                overflow: hidden;
                                            ">
                                                <div id="memory-bar" style="
                                                    height: 100%;
                                                    width: 0%;
                                                    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
                                                    transition: width 0.5s ease;
                                                "></div>
                                            </div>
                                        </div>
                                        <div style="font-size: 12px; opacity: 0.7; margin-top: 8px;" id="memory-total">Total: --</div>
                                    </div>
                                </div>

                                <div style="
                                    background: rgba(255, 255, 255, 0.1);
                                    padding: 20px;
                                    border-radius: 12px;
                                    border: 1px solid rgba(255, 255, 255, 0.2);
                                ">
                                    <h4 style="margin: 0 0 15px 0; color: #fbbf24;">System Information</h4>
                                    <div id="system-info" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
                                        <div>Model: <span id="device-model">Loading...</span></div>
                                        <div>Kernel: <span id="kernel-version">Loading...</span></div>
                                        <div>CPU Cores: <span id="cpu-cores">--</span></div>
                                        <div>CPU Frequency: <span id="cpu-freq">--</span></div>
                                        <div>Uptime: <span id="system-uptime">--</span></div>
                                        <div>Load Average: <span id="load-average">--</span></div>
                                    </div>
                                </div>
                            </div>

                            <!-- GPIO Control Tab -->
                            <div id="tab-gpio" class="tab-content" style="display: none;">
                                <h3 style="margin: 0 0 20px 0; color: #fbbf24;">GPIO Pin Control</h3>
                                
                                <div style="
                                    background: rgba(255, 255, 255, 0.1);
                                    padding: 20px;
                                    border-radius: 12px;
                                    border: 1px solid rgba(255, 255, 255, 0.2);
                                    margin-bottom: 20px;
                                ">
                                    <h4 style="margin: 0 0 15px 0;">Safety Controls</h4>
                                    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                                        <button id="gpio-refresh" style="
                                            padding: 8px 16px;
                                            background: #3b82f6;
                                            color: white;
                                            border: none;
                                            border-radius: 6px;
                                            cursor: pointer;
                                            font-size: 12px;
                                        ">Refresh Status</button>
                                        <button id="gpio-emergency-stop" style="
                                            padding: 8px 16px;
                                            background: #ef4444;
                                            color: white;
                                            border: none;
                                            border-radius: 6px;
                                            cursor: pointer;
                                            font-size: 12px;
                                        ">Emergency Stop All</button>
                                    </div>
                                    <div style="font-size: 12px; color: #fbbf24;">
                                        ⚠️ GPIO control requires hardware permissions. Ensure proper electrical safety.
                                    </div>
                                </div>

                                <div id="gpio-loading" style="
                                    text-align: center;
                                    padding: 40px;
                                    color: #9ca3af;
                                ">
                                    <div style="font-size: 18px; margin-bottom: 10px;">⚡</div>
                                    <div>Loading GPIO configuration...</div>
                                </div>

                                <div id="gpio-grid" style="
                                    display: none;
                                    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                                    gap: 10px;
                                "></div>
                            </div>

                            <!-- Network Tab -->
                            <div id="tab-network" class="tab-content" style="display: none;">
                                <h3 style="margin: 0 0 20px 0; color: #fbbf24;">Network Status</h3>
                                
                                <div style="
                                    background: rgba(255, 255, 255, 0.1);
                                    padding: 20px;
                                    border-radius: 12px;
                                    border: 1px solid rgba(255, 255, 255, 0.2);
                                    margin-bottom: 20px;
                                ">
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                        <div>
                                            <h4 style="margin: 0 0 15px 0;">Primary Interface</h4>
                                            <div id="network-info" style="font-size: 14px; line-height: 1.8;">
                                                <div>Interface: <strong id="net-interface">Loading...</strong></div>
                                                <div>IP Address: <strong id="net-ip">Loading...</strong></div>
                                                <div>Status: <strong id="net-status">Loading...</strong></div>
                                                <div>Speed: <strong id="net-speed">Loading...</strong></div>
                                                <div>Gateway: <strong id="net-gateway">Loading...</strong></div>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 style="margin: 0 0 15px 0;">Network Statistics</h4>
                                            <div id="network-stats" style="font-size: 14px; line-height: 1.8;">
                                                <div>Bytes Sent: <strong id="bytes-sent">--</strong></div>
                                                <div>Bytes Received: <strong id="bytes-received">--</strong></div>
                                                <div>Packets Sent: <strong id="packets-sent">--</strong></div>
                                                <div>Packets Received: <strong id="packets-received">--</strong></div>
                                                <div>Errors: <strong id="network-errors">--</strong></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Storage Tab -->
                            <div id="tab-storage" class="tab-content" style="display: none;">
                                <h3 style="margin: 0 0 20px 0; color: #fbbf24;">Storage Management</h3>
                                
                                <div id="storage-devices"></div>
                                
                                <div style="
                                    background: rgba(255, 255, 255, 0.1);
                                    padding: 20px;
                                    border-radius: 12px;
                                    border: 1px solid rgba(255, 255, 255, 0.2);
                                    margin-bottom: 20px;
                                ">
                                    <h4 style="margin: 0 0 15px 0;">Disk I/O Statistics</h4>
                                    <div id="disk-io" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; font-size: 14px;">
                                        <div>Read Operations: <strong id="disk-reads">--</strong></div>
                                        <div>Write Operations: <strong id="disk-writes">--</strong></div>
                                        <div>I/O Wait: <strong id="io-wait">--</strong></div>
                                    </div>
                                </div>
                            </div>

                            <!-- Diagnostics Tab -->
                            <div id="tab-diagnostics" class="tab-content" style="display: none;">
                                <h3 style="margin: 0 0 20px 0; color: #fbbf24;">System Diagnostics</h3>
                                
                                <div style="
                                    background: rgba(255, 255, 255, 0.1);
                                    padding: 20px;
                                    border-radius: 12px;
                                    border: 1px solid rgba(255, 255, 255, 0.2);
                                    margin-bottom: 20px;
                                ">
                                    <h4 style="margin: 0 0 15px 0;">Connection Status</h4>
                                    <div id="diagnostic-info" style="font-family: monospace; font-size: 12px; line-height: 1.6;">
                                        <div>API Endpoint: <span id="api-endpoint">Loading...</span></div>
                                        <div>Backend Version: <span id="backend-version">--</span></div>
                                        <div>Last Update: <span id="last-successful-update">--</span></div>
                                        <div>Update Frequency: <span id="update-freq">${this.updateFrequency}ms</span></div>
                                        <div>Error Count: <span id="error-count">0</span></div>
                                        <div>Reconnect Attempts: <span id="reconnect-count">0</span></div>
                                    </div>
                                </div>

                                <div style="
                                    background: rgba(255, 255, 255, 0.1);
                                    padding: 20px;
                                    border-radius: 12px;
                                    border: 1px solid rgba(255, 255, 255, 0.2);
                                ">
                                    <h4 style="margin: 0 0 15px 0;">System Tests</h4>
                                    <div style="display: flex; flex-direction: column; gap: 8px;">
                                        <button id="test-api" style="
                                            padding: 8px 12px;
                                            background: rgba(255, 255, 255, 0.2);
                                            color: white;
                                            border: 1px solid rgba(255, 255, 255, 0.3);
                                            border-radius: 4px;
                                            cursor: pointer;
                                            font-size: 12px;
                                        ">Test API Connection</button>
                                        <button id="test-gpio" style="
                                            padding: 8px 12px;
                                            background: rgba(255, 255, 255, 0.2);
                                            color: white;
                                            border: 1px solid rgba(255, 255, 255, 0.3);
                                            border-radius: 4px;
                                            cursor: pointer;
                                            font-size: 12px;
                                        ">Test GPIO Access</button>
                                        <button id="reset-connection" style="
                                            padding: 8px 12px;
                                            background: rgba(255, 255, 255, 0.2);
                                            color: white;
                                            border: 1px solid rgba(255, 255, 255, 0.3);
                                            border-radius: 4px;
                                            cursor: pointer;
                                            font-size: 12px;
                                        ">Reset Connection</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="status-bar" style="
                        padding: 8px 20px;
                        background: rgba(0, 0, 0, 0.3);
                        border-top: 1px solid rgba(255, 255, 255, 0.1);
                        font-size: 12px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <span id="status-message">Initializing ODROID controller...</span>
                        <span id="last-update">Ready</span>
                    </div>
                </div>

                <style>
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
                .nav-item:hover {
                    background: rgba(255, 255, 255, 0.05) !important;
                }
                .gpio-pin {
                    transition: all 0.3s ease;
                }
                .gpio-pin:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                }
                </style>
            `;

            const win = window.WindowManager.createWindow('ODROID Controller', odroidHTML, 900, 700);
            this.currentWindow = win;
            this.setupController(win);
            return win;
        },

        setupController(win) {
            this.setupNavigation(win);
            this.setupEventHandlers(win);
            this.initializeAPI(win);
            this.updateDiagnosticInfo(win);
        },

        setupNavigation(win) {
            const navItems = win.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                item.addEventListener('click', () => {
                    // Update navigation state
                    navItems.forEach(nav => {
                        nav.classList.remove('active');
                        nav.style.borderLeft = '3px solid transparent';
                        nav.style.background = 'transparent';
                    });
                    
                    item.classList.add('active');
                    item.style.borderLeft = '3px solid #fbbf24';
                    item.style.background = 'rgba(255, 255, 255, 0.1)';
                    
                    // Switch content
                    const tabId = item.dataset.tab;
                    win.querySelectorAll('.tab-content').forEach(content => {
                        content.style.display = 'none';
                    });
                    
                    const activeTab = win.querySelector(`#tab-${tabId}`);
                    if (activeTab) {
                        activeTab.style.display = 'block';
                        
                        // Load tab-specific data
                        if (tabId === 'gpio') {
                            this.loadGPIOStatus(win);
                        } else if (tabId === 'network') {
                            this.loadNetworkStatus(win);
                        } else if (tabId === 'storage') {
                            this.loadStorageStatus(win);
                        }
                    }
                });
            });
        },

        setupEventHandlers(win) {
            // Retry connection button
            win.querySelector('#retry-connection').addEventListener('click', () => {
                this.reconnectAttempts = 0;
                this.initializeAPI(win);
            });

            // GPIO controls
            win.querySelector('#gpio-refresh').addEventListener('click', () => {
                this.loadGPIOStatus(win);
            });

            win.querySelector('#gpio-emergency-stop').addEventListener('click', () => {
                this.emergencyStopAllGPIO(win);
            });

            // Diagnostic controls
            win.querySelector('#test-api').addEventListener('click', () => {
                this.testAPIConnection(win);
            });

            win.querySelector('#test-gpio').addEventListener('click', () => {
                this.testGPIOAccess(win);
            });

            win.querySelector('#reset-connection').addEventListener('click', () => {
                this.resetConnection(win);
            });

            // Window cleanup
            if (window.EventBus) {
                window.EventBus.on('window-closed', (data) => {
                    if (data.windowId === win.id) {
                        this.cleanup();
                    }
                });
            }
        },

        async initializeAPI(win) {
            try {
                this.updateConnectionStatus(win, 'connecting', 'Connecting to ODROID...');
                
                // Test API connection with device info
                const deviceInfo = await this.apiCall('/system/info');
                
                if (deviceInfo) {
                    this.deviceInfo = deviceInfo;
                    this.isConnected = true;
                    this.connectionStatus.api = true;
                    this.connectionStatus.errorCount = 0;
                    this.reconnectAttempts = 0;
                    
                    this.updateConnectionStatus(win, 'connected', 'Connected to ODROID');
                    this.updateDeviceInfo(win, deviceInfo);
                    this.hideConnectionError(win);
                    this.startDataUpdates(win);
                    
                    this.showNotification('Successfully connected to ODROID system', 'success');
                } else {
                    throw new Error('No response from device info endpoint');
                }
                
            } catch (error) {
                this.handleConnectionError(win, error);
            }
        },

        async apiCall(endpoint, method = 'GET', data = null) {
            try {
                const url = `${this.apiBaseUrl}${endpoint}`;
                const options = {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    timeout: 5000
                };

                if (data && method !== 'GET') {
                    options.body = JSON.stringify(data);
                }

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                options.signal = controller.signal;

                const response = await fetch(url, options);
                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const result = await response.json();
                this.connectionStatus.lastUpdate = new Date();
                return result;

            } catch (error) {
                this.connectionStatus.errorCount++;
                console.error(`API call failed: ${endpoint}`, error);
                throw error;
            }
        },

        startDataUpdates(win) {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
            }

            this.updateSystemData(win);
            
            this.updateInterval = setInterval(() => {
                if (this.isConnected) {
                    this.updateSystemData(win);
                }
            }, this.updateFrequency);
        },

        async updateSystemData(win) {
            try {
                const systemStatus = await this.apiCall('/system/status');
                
                if (systemStatus) {
                    this.updateSystemMetrics(win, systemStatus);
                    win.querySelector('#last-update').textContent = `Updated: ${new Date().toLocaleTimeString()}`;
                }
                
            } catch (error) {
                console.error('Failed to update system data:', error);
                if (this.connectionStatus.errorCount > 3) {
                    this.handleConnectionLost(win);
                }
            }
        },

        updateSystemMetrics(win, data) {
            // CPU metrics
            if (data.cpu) {
                win.querySelector('#cpu-usage').textContent = `${Math.round(data.cpu.usage)}%`;
                win.querySelector('#cpu-bar').style.width = `${data.cpu.usage}%`;
                win.querySelector('#cpu-temp').textContent = `Temperature: ${Math.round(data.cpu.temperature)}°C`;
                win.querySelector('#cpu-cores').textContent = data.cpu.cores || '--';
                win.querySelector('#cpu-freq').textContent = `${data.cpu.frequency}MHz` || '--';
            }

            // Memory metrics
            if (data.memory) {
                const memUsedGB = (data.memory.used / 1024 / 1024 / 1024).toFixed(1);
                const memTotalGB = (data.memory.total / 1024 / 1024 / 1024).toFixed(1);
                const memPercent = Math.round((data.memory.used / data.memory.total) * 100);

                win.querySelector('#memory-usage').textContent = `${memUsedGB}GB`;
                win.querySelector('#memory-total').textContent = `Total: ${memTotalGB}GB`;
                win.querySelector('#memory-bar').style.width = `${memPercent}%`;
            }

            // System info
            if (data.system) {
                win.querySelector('#system-uptime').textContent = data.system.uptime || '--';
                win.querySelector('#load-average').textContent = data.system.loadAverage || '--';
            }
        },

        async loadGPIOStatus(win) {
            try {
                win.querySelector('#gpio-loading').style.display = 'block';
                win.querySelector('#gpio-grid').style.display = 'none';
                
                const gpioData = await this.apiCall('/gpio/status');
                
                if (gpioData && gpioData.pins) {
                    this.renderGPIOGrid(win, gpioData.pins);
                    win.querySelector('#gpio-loading').style.display = 'none';
                    win.querySelector('#gpio-grid').style.display = 'grid';
                } else {
                    throw new Error('Invalid GPIO data received');
                }
                
            } catch (error) {
                console.error('Failed to load GPIO status:', error);
                this.showGPIOError(win, error.message);
            }
        },

        renderGPIOGrid(win, pins) {
            const gpioGrid = win.querySelector('#gpio-grid');
            gpioGrid.innerHTML = '';

            pins.forEach(pin => {
                const pinElement = document.createElement('div');
                pinElement.className = 'gpio-pin';
                pinElement.dataset.pin = pin.number;
                
                const isControllable = pin.mode === 'output' && pin.available;
                const stateColor = this.getGPIOStateColor(pin.mode, pin.state);

                pinElement.innerHTML = `
                    <div style="
                        background: ${isControllable ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.2)'};
                        border: 2px solid ${stateColor.border};
                        border-radius: 10px;
                        padding: 12px 8px;
                        text-align: center;
                        cursor: ${isControllable ? 'pointer' : 'default'};
                        transition: all 0.3s ease;
                        min-height: 80px;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        ${isControllable ? 'opacity: 1;' : 'opacity: 0.6;'}
                    ">
                        <div style="font-size: 11px; color: #fbbf24; font-weight: bold;">
                            GPIO ${pin.number}
                        </div>
                        <div style="
                            font-size: 14px;
                            font-weight: bold;
                            color: ${stateColor.text};
                            margin: 4px 0;
                        ">${pin.state.toUpperCase()}</div>
                        <div style="
                            font-size: 9px;
                            color: ${stateColor.mode};
                            text-transform: uppercase;
                        ">${pin.mode}</div>
                        ${pin.description ? `<div style="font-size: 8px; color: #9ca3af; margin-top: 2px;">${pin.description}</div>` : ''}
                    </div>
                `;

                if (isControllable) {
                    pinElement.addEventListener('click', () => {
                        this.toggleGPIOPin(pin.number, pinElement);
                    });
                }

                gpioGrid.appendChild(pinElement);
            });
        },

        getGPIOStateColor(mode, state) {
            switch (mode) {
                case 'output':
                    return {
                        text: state === 'high' ? '#10b981' : '#ef4444',
                        border: state === 'high' ? '#10b981' : '#ef4444',
                        mode: '#fbbf24'
                    };
                case 'input':
                    return {
                        text: '#3b82f6',
                        border: '#3b82f6',
                        mode: '#3b82f6'
                    };
                default:
                    return {
                        text: '#9ca3af',
                        border: '#6b7280',
                        mode: '#9ca3af'
                    };
            }
        },

        async toggleGPIOPin(pinNumber, element) {
            try {
                const currentState = element.querySelector('div:nth-child(2)').textContent.toLowerCase();
                const newState = currentState === 'high' ? 'low' : 'high';
                
                // Show loading state
                element.style.opacity = '0.5';
                element.style.pointerEvents = 'none';

                const result = await this.apiCall('/gpio/control', 'POST', {
                    pin: pinNumber,
                    action: 'set',
                    value: newState
                });

                if (result && result.success) {
                    // Update UI with new state
                    const stateElement = element.querySelector('div:nth-child(2)');
                    stateElement.textContent = newState.toUpperCase();
                    
                    const colors = this.getGPIOStateColor('output', newState);
                    stateElement.style.color = colors.text;
                    element.querySelector('div').style.borderColor = colors.border;
                    
                    this.showNotification(`GPIO ${pinNumber} set to ${newState.toUpperCase()}`, 'success');
                } else {
                    throw new Error(result.error || 'GPIO control failed');
                }

            } catch (error) {
                console.error(`Failed to control GPIO ${pinNumber}:`, error);
                this.showNotification(`Failed to control GPIO ${pinNumber}: ${error.message}`, 'error');
            } finally {
                element.style.opacity = '1';
                element.style.pointerEvents = 'auto';
            }
        },

        async emergencyStopAllGPIO(win) {
            if (!confirm('Emergency stop will set all output pins to LOW. Continue?')) {
                return;
            }

            try {
                const result = await this.apiCall('/gpio/control', 'POST', {
                    action: 'emergency_stop'
                });

                if (result && result.success) {
                    this.showNotification('Emergency stop executed - all outputs set to LOW', 'success');
                    this.loadGPIOStatus(win); // Refresh display
                } else {
                    throw new Error(result.error || 'Emergency stop failed');
                }

            } catch (error) {
                console.error('Emergency stop failed:', error);
                this.showNotification(`Emergency stop failed: ${error.message}`, 'error');
            }
        },

        async loadNetworkStatus(win) {
            try {
                const networkData = await this.apiCall('/network/status');
                
                if (networkData) {
                    this.updateNetworkInfo(win, networkData);
                }
                
            } catch (error) {
                console.error('Failed to load network status:', error);
                this.showNetworkError(win, error.message);
            }
        },

        updateNetworkInfo(win, data) {
            if (data.interface) {
                win.querySelector('#net-interface').textContent = data.interface.name || '--';
                win.querySelector('#net-ip').textContent = data.interface.ip || '--';
                win.querySelector('#net-status').textContent = data.interface.status || '--';
                win.querySelector('#net-speed').textContent = data.interface.speed || '--';
                win.querySelector('#net-gateway').textContent = data.interface.gateway || '--';
            }

            if (data.statistics) {
                win.querySelector('#bytes-sent').textContent = this.formatBytes(data.statistics.bytes_sent);
                win.querySelector('#bytes-received').textContent = this.formatBytes(data.statistics.bytes_received);
                win.querySelector('#packets-sent').textContent = data.statistics.packets_sent || '--';
                win.querySelector('#packets-received').textContent = data.statistics.packets_received || '--';
                win.querySelector('#network-errors').textContent = data.statistics.errors || '0';
            }
        },

        async loadStorageStatus(win) {
            try {
                const storageData = await this.apiCall('/storage/status');
                
                if (storageData && storageData.devices) {
                    this.updateStorageInfo(win, storageData);
                }
                
            } catch (error) {
                console.error('Failed to load storage status:', error);
                this.showStorageError(win, error.message);
            }
        },

        updateStorageInfo(win, data) {
            const storageContainer = win.querySelector('#storage-devices');
            storageContainer.innerHTML = '';

            data.devices.forEach(device => {
                const usagePercent = Math.round((device.used / device.total) * 100);
                
                const deviceElement = document.createElement('div');
                deviceElement.style.cssText = `
                    background: rgba(255, 255, 255, 0.1);
                    padding: 20px;
                    border-radius: 12px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    margin-bottom: 20px;
                `;

                deviceElement.innerHTML = `
                    <h4 style="margin: 0 0 15px 0; color: #fbbf24;">${device.name} (${device.filesystem})</h4>
                    <div style="
                        background: rgba(255, 255, 255, 0.2);
                        height: 24px;
                        border-radius: 12px;
                        overflow: hidden;
                        margin-bottom: 15px;
                        position: relative;
                    ">
                        <div style="
                            height: 100%;
                            width: ${usagePercent}%;
                            background: linear-gradient(90deg, ${usagePercent > 80 ? '#ef4444' : usagePercent > 60 ? '#f59e0b' : '#10b981'}, 
                                                             ${usagePercent > 80 ? '#dc2626' : usagePercent > 60 ? '#d97706' : '#059669'});
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: width 0.5s ease;
                        "></div>
                        <div style="
                            position: absolute;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            font-size: 12px;
                            font-weight: bold;
                            text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                        ">${this.formatBytes(device.used)} / ${this.formatBytes(device.total)} (${usagePercent}%)</div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; font-size: 14px;">
                        <div>Mount: <strong>${device.mount}</strong></div>
                        <div>Available: <strong>${this.formatBytes(device.available)}</strong></div>
                        <div>Type: <strong>${device.filesystem}</strong></div>
                    </div>
                `;

                storageContainer.appendChild(deviceElement);
            });

            // Update I/O statistics if available
            if (data.io_stats) {
                win.querySelector('#disk-reads').textContent = data.io_stats.reads || '--';
                win.querySelector('#disk-writes').textContent = data.io_stats.writes || '--';
                win.querySelector('#io-wait').textContent = `${data.io_stats.iowait}%` || '--';
            }
        },

        formatBytes(bytes) {
            if (bytes === 0) return '0 B';
            
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        },

        updateConnectionStatus(win, status, message) {
            const indicator = win.querySelector('#connection-indicator');
            const text = win.querySelector('#connection-text');
            const statusMessage = win.querySelector('#status-message');

            switch (status) {
                case 'connected':
                    indicator.style.background = '#10b981';
                    indicator.style.boxShadow = '0 0 10px #10b981';
                    indicator.style.animation = 'none';
                    break;
                case 'connecting':
                    indicator.style.background = '#f59e0b';
                    indicator.style.boxShadow = '0 0 10px #f59e0b';
                    indicator.style.animation = 'pulse 2s infinite';
                    break;
                case 'error':
                    indicator.style.background = '#ef4444';
                    indicator.style.boxShadow = '0 0 10px #ef4444';
                    indicator.style.animation = 'pulse 2s infinite';
                    break;
            }

            text.textContent = message;
            statusMessage.textContent = message;
        },

        updateDeviceInfo(win, deviceInfo) {
            win.querySelector('#device-info').textContent = `Device: ${deviceInfo.model || 'ODROID'}`;
            win.querySelector('#device-model').textContent = deviceInfo.model || '--';
            win.querySelector('#kernel-version').textContent = deviceInfo.kernel || '--';
        },

        handleConnectionError(win, error) {
            this.isConnected = false;
            this.connectionStatus.api = false;
            this.connectionStatus.errorCount++;

            this.updateConnectionStatus(win, 'error', 'Connection failed');
            this.showConnectionError(win, error.message);

            // Attempt reconnection
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                setTimeout(() => {
                    this.initializeAPI(win);
                }, 5000);
            }
        },

        handleConnectionLost(win) {
            this.isConnected = false;
            this.connectionStatus.api = false;
            
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }

            this.updateConnectionStatus(win, 'error', 'Connection lost');
            this.showConnectionError(win, 'Lost connection to ODROID system');
            this.showNotification('Connection lost - attempting to reconnect...', 'error');

            // Attempt reconnection
            setTimeout(() => {
                this.initializeAPI(win);
            }, 3000);
        },

        showConnectionError(win, message) {
            const errorDiv = win.querySelector('#connection-error');
            const errorMessage = win.querySelector('#error-message');
            
            errorMessage.textContent = message;
            errorDiv.style.display = 'block';
        },

        hideConnectionError(win) {
            win.querySelector('#connection-error').style.display = 'none';
        },

        showGPIOError(win, message) {
            const gpioGrid = win.querySelector('#gpio-grid');
            const gpioLoading = win.querySelector('#gpio-loading');
            
            gpioLoading.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #ef4444;">
                    <div style="font-size: 18px; margin-bottom: 10px;">⚠️</div>
                    <div>GPIO Error</div>
                    <div style="font-size: 12px; margin-top: 8px; opacity: 0.8;">${message}</div>
                </div>
            `;
            
            gpioGrid.style.display = 'none';
            gpioLoading.style.display = 'block';
        },

        showNetworkError(win, message) {
            win.querySelector('#network-info').innerHTML = `
                <div style="color: #ef4444; text-align: center; padding: 20px;">
                    <div>Failed to load network information</div>
                    <div style="font-size: 12px; margin-top: 5px;">${message}</div>
                </div>
            `;
        },

        showStorageError(win, message) {
            win.querySelector('#storage-devices').innerHTML = `
                <div style="
                    background: rgba(239, 68, 68, 0.2);
                    border: 1px solid #ef4444;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    color: #fecaca;
                ">
                    <div>Failed to load storage information</div>
                    <div style="font-size: 12px; margin-top: 8px;">${message}</div>
                </div>
            `;
        },

        updateDiagnosticInfo(win) {
            win.querySelector('#api-endpoint').textContent = this.apiBaseUrl;
            win.querySelector('#error-count').textContent = this.connectionStatus.errorCount;
            win.querySelector('#reconnect-count').textContent = this.reconnectAttempts;
        },

        async testAPIConnection(win) {
            try {
                const startTime = Date.now();
                const result = await this.apiCall('/system/info');
                const responseTime = Date.now() - startTime;
                
                if (result) {
                    this.showNotification(`API test successful (${responseTime}ms)`, 'success');
                    win.querySelector('#backend-version').textContent = result.version || 'Unknown';
                } else {
                    throw new Error('No response received');
                }
            } catch (error) {
                this.showNotification(`API test failed: ${error.message}`, 'error');
            }
        },

        async testGPIOAccess(win) {
            try {
                const result = await this.apiCall('/gpio/test');
                
                if (result && result.success) {
                    this.showNotification(`GPIO test successful - ${result.message}`, 'success');
                } else {
                    throw new Error(result.error || 'GPIO test failed');
                }
            } catch (error) {
                this.showNotification(`GPIO test failed: ${error.message}`, 'error');
            }
        },

        resetConnection(win) {
            this.cleanup();
            this.reconnectAttempts = 0;
            this.connectionStatus.errorCount = 0;
            
            this.showNotification('Connection reset - reinitializing...', 'info');
            setTimeout(() => {
                this.initializeAPI(win);
            }, 1000);
        },

        showNotification(message, type = 'info') {
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
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10000;
                max-width: 300px;
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
            }, 4000);
        },

        cleanup() {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
            
            this.isConnected = false;
            this.connectionStatus.api = false;
            this.currentWindow = null;
        }
    };

    // Register app with the WebOS system
    if (window.AppRegistry) {
        window.AppRegistry.registerApp({
            id: 'odroid',
            name: 'ODROID Controller',
            icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><rect x='4' y='4' width='40' height='40' rx='6' fill='%231e3a8a' stroke='%23fbbf24' stroke-width='2'/><path d='M24 8L12 16V32L24 40L36 32V16L24 8Z' fill='%23fbbf24' stroke='%23fbbf24' stroke-width='1.5'/><path d='M24 40V24M24 24L12 16M24 24L36 16' stroke='%2360a5fa' stroke-width='2' stroke-linecap='round'/><circle cx='18' cy='20' r='2' fill='%2310b981'/><circle cx='30' cy='20' r='2' fill='%23ef4444'/><circle cx='24' cy='28' r='2' fill='%233b82f6'/></svg>",
            handler: () => window.ODROIDApp.open(),
            singleInstance: true
        });

        // Register documentation
        if (window.Docs && typeof window.Docs.registerDocumentation === 'function') {
            window.Docs.registerDocumentation('odroid', {
                name: "ODROID Controller",
                version: "2.0.0",
                description: "Production-ready ODROID hardware monitoring and control interface for industrial applications with real backend API integration",
                type: "Hardware App",
                features: [
                    "Real-time system monitoring (CPU, memory, temperature)",
                    "GPIO pin control with safety features and emergency stop",
                    "Network interface status and statistics monitoring",
                    "Storage device management and I/O statistics",
                    "Connection status monitoring with auto-reconnect",
                    "Comprehensive error handling and diagnostics",
                    "Industrial-grade touchscreen interface design",
                    "RESTful API integration with timeout handling"
                ],
                dependencies: ["WindowManager", "AppRegistry"],
                apiEndpoints: [
                    { endpoint: "GET /api/system/info", description: "Device information and model details" },
                    { endpoint: "GET /api/system/status", description: "Real-time system metrics" },
                    { endpoint: "GET /api/gpio/status", description: "GPIO pin states and configuration" },
                    { endpoint: "POST /api/gpio/control", description: "Control GPIO pin states" },
                    { endpoint: "GET /api/network/status", description: "Network interface information" },
                    { endpoint: "GET /api/storage/status", description: "Storage usage and I/O stats" }
                ],
                methods: [
                    { name: "open", description: "Creates ODROID controller window with full hardware interface" },
                    { name: "initializeAPI", description: "Establishes connection to ODROID backend API" },
                    { name: "toggleGPIOPin", description: "Controls individual GPIO pin states with safety checks" },
                    { name: "emergencyStopAllGPIO", description: "Emergency stop function for all GPIO outputs" },
                    { name: "updateSystemData", description: "Real-time system metrics update loop" }
                ],
                notes: "Production-ready application designed for industrial ODROID deployment. Requires backend API implementation by ODROID team. Features comprehensive error handling, auto-reconnect, and safety controls for GPIO operations.",
                backendRequired: true,
                targetHardware: ["ODROID-XU4", "ODROID-C4", "ODROID-N2+", "ODROID-M1S"],
                auto_generated: false
            });
        }
    } else {
        console.error('AppRegistry not found - ODROID Controller cannot register');
        console.log('Available globals:', Object.keys(window).filter(k => k.includes('App') || k.includes('Registry')));
    }

})();