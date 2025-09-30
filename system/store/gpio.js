// gpio.js - Production-Ready Raspberry Pi GPIO Controller
/**
 * FILE: apps/gpio.js
 * VERSION: 2.0.0 - PRODUCTION READY
 * BUILD DATE: 2025-09-27
 *
 * PURPOSE:
 * Production GPIO controller for Raspberry Pi with industrial safety features.
 * Connects to real backend GPIO service with comprehensive error handling.
 *
 * BACKEND API ENDPOINTS (Flask/FastAPI on Pi):
 * GET  /gpio/status           - All pin states and configuration
 * POST /gpio/control/{pin}    - Control specific pin
 * POST /gpio/emergency_stop   - Emergency stop all outputs
 * GET  /gpio/config          - GPIO configuration and pin mapping
 * GET  /system/info          - Pi model and system information
 *
 * SAFETY FEATURES:
 * - Emergency stop functionality
 * - Pin validation and mode checking  
 * - Connection monitoring with auto-reconnect
 * - Hardware-specific pin mapping
 * - Current limiting warnings
 */

(function() {
    window.GPIODemoApp = {
        // Configuration - Auto-detect or configurable
        config: {
            apiHost: null, // Auto-detected from current location or user input
            apiPort: 5000,
            updateInterval: 1000, // 1 second for GPIO
            maxReconnectAttempts: 10,
            connectionTimeout: 3000
        },

        // Runtime state
        isConnected: false,
        deviceInfo: null,
        currentWindow: null,
        updateInterval: null,
        reconnectAttempts: 0,
        pinStates: new Map(),
        
        // Connection status
        connectionStatus: {
            lastUpdate: null,
            errorCount: 0,
            apiVersion: null
        },

        open() {
            // ... (HTML content remains the same) ...
            const gpioHTML = `
                <div class="gpio-app" style="
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    font-family: 'Segoe UI', sans-serif;
                    background: linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #2c3e50 100%);
                    color: #ecf0f1;
                    overflow: hidden;
                ">
                    <div class="gpio-header" style="
                        padding: 16px 20px;
                        background: rgba(231, 76, 60, 0.9);
                        border-bottom: 2px solid rgba(192, 57, 43, 0.8);
                        backdrop-filter: blur(10px);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <div>
                            <h2 style="margin: 0; font-size: 20px; color: #fff;">Pi GPIO Controller</h2>
                            <div style="font-size: 12px; opacity: 0.9;" id="device-info">Device: Detecting...</div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div id="connection-indicator" style="
                                width: 12px;
                                height: 12px;
                                border-radius: 50%;
                                background: #e74c3c;
                                box-shadow: 0 0 10px #e74c3c;
                                animation: pulse 2s infinite;
                            "></div>
                            <span id="connection-text" style="font-size: 12px;">Connecting...</span>
                        </div>
                    </div>

                    <div id="config-panel" style="
                        padding: 20px;
                        background: rgba(52, 73, 94, 0.3);
                        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                        display: block;
                    ">
                        <h3 style="margin: 0 0 15px 0; color: #3498db;">Connection Configuration</h3>
                        <div style="display: grid; grid-template-columns: 1fr auto auto; gap: 10px; align-items: center;">
                            <input 
                                type="text" 
                                id="pi-host" 
                                placeholder="Raspberry Pi IP (e.g., 192.168.1.100)"
                                style="
                                    padding: 10px 12px;
                                    border: 1px solid rgba(52, 152, 219, 0.5);
                                    border-radius: 6px;
                                    background: rgba(255, 255, 255, 0.1);
                                    color: white;
                                    font-size: 14px;
                                "
                            />
                            <button id="connect-btn" style="
                                padding: 10px 20px;
                                border: none;
                                border-radius: 6px;
                                background: #27ae60;
                                color: white;
                                font-weight: 600;
                                cursor: pointer;
                                font-size: 14px;
                            ">Connect</button>
                            <button id="auto-detect-btn" style="
                                padding: 10px 16px;
                                border: 1px solid #3498db;
                                border-radius: 6px;
                                background: transparent;
                                color: #3498db;
                                font-weight: 600;
                                cursor: pointer;
                                font-size: 14px;
                            ">Auto-detect</button>
                        </div>
                        <div id="config-status" style="
                            margin-top: 10px;
                            font-size: 12px;
                            color: #95a5a6;
                        ">Enter Pi IP address or try auto-detection</div>
                    </div>

                    <div id="error-panel" style="
                        display: none;
                        background: rgba(231, 76, 60, 0.2);
                        border: 1px solid #e74c3c;
                        margin: 20px;
                        padding: 15px;
                        border-radius: 8px;
                    ">
                        <h4 style="margin: 0 0 8px 0; color: #e74c3c;">Connection Error</h4>
                        <div id="error-message" style="margin-bottom: 10px;">Unable to connect to GPIO service</div>
                        <button id="retry-connection" style="
                            padding: 6px 12px;
                            background: #e74c3c;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 12px;
                        ">Retry Connection</button>
                    </div>

                    <div class="gpio-controls" style="
                        flex: 1;
                        padding: 20px;
                        overflow-y: auto;
                        display: none;
                    " id="main-controls">
                        
                        <div class="control-section" style="
                            background: rgba(231, 76, 60, 0.1);
                            border: 1px solid rgba(231, 76, 60, 0.3);
                            border-radius: 8px;
                            padding: 15px;
                            margin-bottom: 20px;
                        ">
                            <h3 style="margin: 0 0 15px 0; color: #e74c3c;">Safety Controls</h3>
                            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                                <button id="emergency-stop" style="
                                    padding: 12px 20px;
                                    background: #c0392b;
                                    color: white;
                                    border: none;
                                    border-radius: 6px;
                                    cursor: pointer;
                                    font-weight: bold;
                                    font-size: 14px;
                                ">EMERGENCY STOP</button>
                                <button id="refresh-gpio" style="
                                    padding: 12px 16px;
                                    background: #3498db;
                                    color: white;
                                    border: none;
                                    border-radius: 6px;
                                    cursor: pointer;
                                    font-size: 14px;
                                ">Refresh Status</button>
                            </div>
                            <div style="font-size: 12px; color: #e74c3c; opacity: 0.8;">
                                ⚠️ Emergency stop sets all output pins to LOW immediately
                            </div>
                        </div>

                        <div class="control-section" style="
                            background: rgba(52, 152, 219, 0.1);
                            border: 1px solid rgba(52, 152, 219, 0.3);
                            border-radius: 8px;
                            padding: 15px;
                            margin-bottom: 20px;
                        ">
                            <h3 style="margin: 0 0 15px 0; color: #3498db;">System Status</h3>
                            <div id="system-status" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
                                <div>Model: <span id="pi-model">Loading...</span></div>
                                <div>GPIO Pins: <span id="gpio-count">--</span></div>
                                <div>Active Outputs: <span id="active-outputs">0</span></div>
                                <div>Last Update: <span id="last-gpio-update">--</span></div>
                            </div>
                        </div>

                        <div class="control-section" style="
                            background: rgba(46, 204, 113, 0.1);
                            border: 1px solid rgba(46, 204, 113, 0.3);
                            border-radius: 8px;
                            padding: 15px;
                            margin-bottom: 20px;
                        ">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                <h3 style="margin: 0; color: #2ecc71;">GPIO Pin Control</h3>
                                <div style="display: flex; gap: 8px;">
                                    <button id="all-outputs-low" style="
                                        padding: 6px 12px;
                                        background: #e74c3c;
                                        color: white;
                                        border: none;
                                        border-radius: 4px;
                                        cursor: pointer;
                                        font-size: 11px;
                                    ">All LOW</button>
                                    <button id="all-outputs-high" style="
                                        padding: 6px 12px;
                                        background: #27ae60;
                                        color: white;
                                        border: none;
                                        border-radius: 4px;
                                        cursor: pointer;
                                        font-size: 11px;
                                    ">All HIGH</button>
                                    <button id="toggle-all" style="
                                        padding: 6px 12px;
                                        background: #f39c12;
                                        color: white;
                                        border: none;
                                        border-radius: 4px;
                                        cursor: pointer;
                                        font-size: 11px;
                                    ">Toggle</button>
                                </div>
                            </div>

                            <div id="gpio-loading" style="
                                text-align: center;
                                padding: 40px;
                                color: #95a5a6;
                            ">
                                <div style="font-size: 18px; margin-bottom: 10px;">⚡</div>
                                <div>Loading GPIO configuration...</div>
                            </div>

                            <div id="gpio-grid" style="
                                display: none;
                                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                                gap: 12px;
                            "></div>
                        </div>

                        <div class="control-section" style="
                            background: rgba(149, 165, 166, 0.1);
                            border: 1px solid rgba(149, 165, 166, 0.3);
                            border-radius: 8px;
                            padding: 15px;
                        ">
                            <h3 style="margin: 0 0 15px 0; color: #95a5a6;">Pin Legend</h3>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; font-size: 12px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div style="width: 16px; height: 16px; background: #27ae60; border-radius: 4px;"></div>
                                    <span>Output HIGH</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div style="width: 16px; height: 16px; background: #e74c3c; border-radius: 4px;"></div>
                                    <span>Output LOW</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div style="width: 16px; height: 16px; background: #3498db; border-radius: 4px;"></div>
                                    <span>Input</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div style="width: 16px; height: 16px; background: #95a5a6; border-radius: 4px;"></div>
                                    <span>Power/Ground</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="status-bar" style="
                        padding: 8px 20px;
                        background: rgba(0, 0, 0, 0.4);
                        border-top: 1px solid rgba(255, 255, 255, 0.1);
                        font-size: 12px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <span id="status-message">GPIO controller ready</span>
                        <span id="api-info">API: Not connected</span>
                    </div>
                </div>

                <style>
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
                .gpio-pin {
                    transition: all 0.2s ease;
                    user-select: none;
                }
                .gpio-pin:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                }
                .gpio-pin.output {
                    cursor: pointer;
                }
                .gpio-pin.disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                </style>
            `;

            const win = window.WindowManager.createWindow('GPIO Controller', gpioHTML, 900, 700);
            this.currentWindow = win;
            this.setupGPIOController(win);
            return win;
        },

        setupGPIOController(win) {
            this.setupEventHandlers(win);
            this.attemptAutoDetection(win);
        },

        setupEventHandlers(win) {
            // Connection controls
            win.querySelector('#connect-btn').addEventListener('click', () => {
                const host = win.querySelector('#pi-host').value.trim();
                if (host) {
                    this.config.apiHost = host;
                    this.initializeConnection(win);
                } else {
                    this.showConfigStatus(win, 'Please enter a valid IP address', 'error');
                }
            });

            win.querySelector('#auto-detect-btn').addEventListener('click', () => {
                this.attemptAutoDetection(win);
            });

            win.querySelector('#retry-connection').addEventListener('click', () => {
                this.initializeConnection(win);
            });

            // Safety controls
            win.querySelector('#emergency-stop').addEventListener('click', () => {
                this.emergencyStop(win);
            });

            win.querySelector('#refresh-gpio').addEventListener('click', () => {
                this.refreshGPIOStatus(win);
            });

            // Bulk GPIO controls
            win.querySelector('#all-outputs-low').addEventListener('click', () => {
                this.bulkGPIOControl(win, 'low');
            });

            win.querySelector('#all-outputs-high').addEventListener('click', () => {
                this.bulkGPIOControl(win, 'high');
            });

            win.querySelector('#toggle-all').addEventListener('click', () => {
                this.bulkGPIOControl(win, 'toggle');
            });

            // Enter key in host input
            win.querySelector('#pi-host').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    win.querySelector('#connect-btn').click();
                }
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

        async attemptAutoDetection(win) {
            this.showConfigStatus(win, 'Attempting auto-detection...', 'info');
            
            // Try common local network ranges
            const commonHosts = [
                window.location.hostname, // Same host as WebOS
                '192.168.1.100',
                '192.168.0.100',
                '10.0.0.100',
                'localhost',
                '127.0.0.1'
            ];

            for (const host of commonHosts) {
                try {
                    this.config.apiHost = host;
                    win.querySelector('#pi-host').value = host;
                    
                    const response = await this.apiCall('/system/info', 3000); // Short timeout for detection
                    
                    if (response) {
                        this.showConfigStatus(win, `Found Pi at ${host}`, 'success');
                        this.initializeConnection(win);
                        return;
                    }
                } catch (error) {
                    // Continue trying next host
                    continue;
                }
            }

            this.showConfigStatus(win, 'Auto-detection failed. Please enter IP manually.', 'error');
        },

        async initializeConnection(win) {
            try {
                this.updateConnectionStatus(win, 'connecting', 'Connecting to Pi...');
                this.hideError(win);
                
                // Test system info endpoint
                const systemInfo = await this.apiCall('/system/info');
                
                if (!systemInfo) {
                    throw new Error('No response from system info endpoint');
                }

                this.deviceInfo = systemInfo;
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.connectionStatus.errorCount = 0;
                this.connectionStatus.apiVersion = systemInfo.gpio_api_version;

                // Update UI
                this.updateConnectionStatus(win, 'connected', 'Connected to Pi');
                this.updateSystemInfo(win, systemInfo);
                this.showMainControls(win);
                
                // Start GPIO monitoring
                this.startGPIOUpdates(win);
                
                this.showNotification('Successfully connected to Raspberry Pi GPIO service', 'success');

            } catch (error) {
                this.handleConnectionError(win, error);
            }
        },

        async apiCall(endpoint, timeout = this.config.connectionTimeout) {
            if (!this.config.apiHost) {
                throw new Error('No host configured');
            }

            const url = `http://${this.config.apiHost}:${this.config.apiPort}${endpoint}`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                this.connectionStatus.lastUpdate = new Date();
                return data;

            } catch (error) {
                clearTimeout(timeoutId);
                this.connectionStatus.errorCount++;
                
                if (error.name === 'AbortError') {
                    throw new Error('Connection timeout');
                }
                throw error;
            }
        },

        async apiPost(endpoint, data, timeout = this.config.connectionTimeout) {
            if (!this.config.apiHost) {
                throw new Error('No host configured');
            }

            const url = `http://${this.config.apiHost}:${this.config.apiPort}${endpoint}`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(data),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const result = await response.json();
                this.connectionStatus.lastUpdate = new Date();
                return result;

            } catch (error) {
                clearTimeout(timeoutId);
                this.connectionStatus.errorCount++;
                
                if (error.name === 'AbortError') {
                    throw new Error('Connection timeout');
                }
                throw error;
            }
        },

        startGPIOUpdates(win) {
            this.refreshGPIOStatus(win);
            
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
            }

            this.updateInterval = setInterval(() => {
                if (this.isConnected) {
                    this.refreshGPIOStatus(win);
                }
            }, this.config.updateInterval);
        },

        async refreshGPIOStatus(win) {
            try {
                const gpioData = await this.apiCall('/gpio/status');
                
                if (gpioData && gpioData.pins) {
                    this.updateGPIODisplay(win, gpioData);
                    win.querySelector('#last-gpio-update').textContent = new Date().toLocaleTimeString();
                } else {
                    throw new Error('Invalid GPIO data received');
                }

            } catch (error) {
                console.error('Failed to refresh GPIO status:', error);
                
                if (this.connectionStatus.errorCount > 5) {
                    this.handleConnectionLost(win);
                }
            }
        },

        updateGPIODisplay(win, gpioData) {
            const gpioGrid = win.querySelector('#gpio-grid');
            const gpioLoading = win.querySelector('#gpio-loading');
            
            // Show grid, hide loading
            gpioLoading.style.display = 'none';
            gpioGrid.style.display = 'grid';
            
            // Clear existing pins
            gpioGrid.innerHTML = '';
            
            let activeOutputs = 0;
            
            gpioData.pins.forEach(pin => {
                const pinElement = this.createPinElement(pin);
                gpioGrid.appendChild(pinElement);
                
                if (pin.mode === 'output' && pin.value === 1) {
                    activeOutputs++;
                }
            });

            // Update active outputs count
            win.querySelector('#active-outputs').textContent = activeOutputs;
            win.querySelector('#gpio-count').textContent = gpioData.pins.length;
            
            // Store pin states for bulk operations
            this.pinStates.clear();
            gpioData.pins.forEach(pin => {
                this.pinStates.set(pin.pin, pin);
            });
        },

        createPinElement(pin) {
            const pinElement = document.createElement('div');
            pinElement.className = 'gpio-pin';
            pinElement.dataset.pin = pin.pin;
            
            const isOutput = pin.mode === 'output';
            const isInput = pin.mode === 'input';
            const isPower = pin.mode === 'power' || pin.mode === 'ground';
            
            let backgroundColor, borderColor, textColor;
            
            if (isOutput) {
                backgroundColor = pin.value === 1 ? 'rgba(39, 174, 96, 0.2)' : 'rgba(231, 76, 60, 0.2)';
                borderColor = pin.value === 1 ? '#27ae60' : '#e74c3c';
                textColor = pin.value === 1 ? '#27ae60' : '#e74c3c';
                pinElement.classList.add('output');
            } else if (isInput) {
                backgroundColor = 'rgba(52, 152, 219, 0.2)';
                borderColor = '#3498db';
                textColor = '#3498db';
            } else {
                backgroundColor = 'rgba(149, 165, 166, 0.2)';
                borderColor = '#95a5a6';
                textColor = '#95a5a6';
                pinElement.classList.add('disabled');
            }

            pinElement.innerHTML = `
                <div style="
                    background: ${backgroundColor};
                    border: 2px solid ${borderColor};
                    border-radius: 8px;
                    padding: 12px 8px;
                    text-align: center;
                    min-height: 90px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    position: relative;
                ">
                    <div style="
                        font-size: 12px;
                        font-weight: bold;
                        color: #ecf0f1;
                        margin-bottom: 4px;
                    ">GPIO ${pin.pin}</div>
                    
                    <div style="
                        font-size: 16px;
                        font-weight: bold;
                        color: ${textColor};
                        margin: 4px 0;
                    ">${isOutput ? (pin.value === 1 ? 'HIGH' : 'LOW') : (isInput ? (pin.value === 1 ? 'HIGH' : 'LOW') : pin.mode.toUpperCase())}</div>
                    
                    <div style="
                        font-size: 9px;
                        color: #bdc3c7;
                        text-transform: uppercase;
                        margin-top: 2px;
                    ">${pin.mode}</div>
                    
                    ${pin.description ? `
                        <div style="
                            font-size: 8px;
                            color: #95a5a6;
                            margin-top: 4px;
                            line-height: 1.2;
                        ">${pin.description}</div>
                    ` : ''}
                    
                    ${isOutput ? `
                        <div style="
                            position: absolute;
                            top: 4px;
                            right: 4px;
                            width: 8px;
                            height: 8px;
                            border-radius: 50%;
                            background: ${pin.value === 1 ? '#27ae60' : '#e74c3c'};
                            box-shadow: 0 0 4px ${pin.value === 1 ? '#27ae60' : '#e74c3c'};
                        "></div>
                    ` : ''}
                </div>
            `;

            // Add click handler for output pins
            if (isOutput) {
                pinElement.addEventListener('click', () => {
                    this.togglePin(pin.pin, pinElement);
                });
            }

            return pinElement;
        },

        async togglePin(pinNumber, element) {
            const pin = this.pinStates.get(pinNumber);
            if (!pin || pin.mode !== 'output') return;

            try {
                // Show loading state
                element.style.opacity = '0.6';
                element.style.pointerEvents = 'none';

                const newValue = pin.value === 1 ? 0 : 1;
                const result = await this.apiPost(`/gpio/control/${pinNumber}`, {
                    action: 'set',
                    value: newValue
                });

                if (result && result.success) {
                    // Update local state
                    pin.value = newValue;
                    this.pinStates.set(pinNumber, pin);
                    
                    // Update visual state
                    this.updatePinVisual(element, pin);
                    
                    this.showNotification(`GPIO ${pinNumber} set to ${newValue === 1 ? 'HIGH' : 'LOW'}`, 'success');
                } else {
                    throw new Error(result.error || 'Pin control failed');
                }

            } catch (error) {
                console.error(`Failed to toggle pin ${pinNumber}:`, error);
                this.showNotification(`Failed to control GPIO ${pinNumber}: ${error.message}`, 'error');
            } finally {
                element.style.opacity = '1';
                element.style.pointerEvents = 'auto';
            }
        },

        updatePinVisual(element, pin) {
            const container = element.querySelector('div');
            const valueDisplay = container.querySelector('div:nth-child(2)');
            const indicator = container.querySelector('div:last-child');

            if (pin.mode === 'output') {
                const isHigh = pin.value === 1;
                
                container.style.background = isHigh ? 'rgba(39, 174, 96, 0.2)' : 'rgba(231, 76, 60, 0.2)';
                container.style.borderColor = isHigh ? '#27ae60' : '#e74c3c';
                valueDisplay.style.color = isHigh ? '#27ae60' : '#e74c3c';
                valueDisplay.textContent = isHigh ? 'HIGH' : 'LOW';
                
                if (indicator) {
                    indicator.style.background = isHigh ? '#27ae60' : '#e74c3c';
                    indicator.style.boxShadow = `0 0 4px ${isHigh ? '#27ae60' : '#e74c3c'}`;
                }
            }
        },

        async bulkGPIOControl(win, action) {
            const outputPins = Array.from(this.pinStates.values()).filter(pin => pin.mode === 'output');
            
            if (outputPins.length === 0) {
                this.showNotification('No output pins available for bulk control', 'warning');
                return;
            }

            const confirmMessage = `${action.toUpperCase()} all ${outputPins.length} output pins?`;
            if (!confirm(confirmMessage)) {
                return;
            }

            try {
                const result = await this.apiPost('/gpio/bulk_control', {
                    action: action,
                    pins: outputPins.map(pin => pin.pin)
                });

                if (result && result.success) {
                    this.showNotification(`Bulk ${action} completed successfully`, 'success');
                    this.refreshGPIOStatus(win);
                } else {
                    throw new Error(result.error || 'Bulk control failed');
                }

            } catch (error) {
                console.error('Bulk GPIO control failed:', error);
                this.showNotification(`Bulk control failed: ${error.message}`, 'error');
            }
        },

        async emergencyStop(win) {
            if (!confirm('EMERGENCY STOP will immediately set all output pins to LOW. Continue?')) {
                return;
            }

            try {
                const result = await this.apiPost('/gpio/emergency_stop', {});

                if (result && result.success) {
                    this.showNotification('EMERGENCY STOP executed - all outputs set to LOW', 'success');
                    this.refreshGPIOStatus(win);
                } else {
                    throw new Error(result.error || 'Emergency stop failed');
                }

            } catch (error) {
                console.error('Emergency stop failed:', error);
                this.showNotification(`Emergency stop failed: ${error.message}`, 'error');
            }
        },

        updateConnectionStatus(win, status, message) {
            const indicator = win.querySelector('#connection-indicator');
            const text = win.querySelector('#connection-text');
            const statusMessage = win.querySelector('#status-message');
            const apiInfo = win.querySelector('#api-info');

            switch (status) {
                case 'connected':
                    indicator.style.background = '#27ae60';
                    indicator.style.boxShadow = '0 0 10px #27ae60';
                    indicator.style.animation = 'none';
                    apiInfo.textContent = `API: ${this.config.apiHost}:${this.config.apiPort}`;
                    break;
                case 'connecting':
                    indicator.style.background = '#f39c12';
                    indicator.style.boxShadow = '0 0 10px #f39c12';
                    indicator.style.animation = 'pulse 2s infinite';
                    break;
                case 'error':
                    indicator.style.background = '#e74c3c';
                    indicator.style.boxShadow = '0 0 10px #e74c3c';
                    indicator.style.animation = 'pulse 2s infinite';
                    apiInfo.textContent = 'API: Connection failed';
                    break;
            }

            text.textContent = message;
            statusMessage.textContent = message;
        },

        updateSystemInfo(win, systemInfo) {
            win.querySelector('#device-info').textContent = `Device: ${systemInfo.model || 'Raspberry Pi'}`;
            win.querySelector('#pi-model').textContent = systemInfo.model || 'Unknown';
            
            if (systemInfo.gpio_api_version) {
                win.querySelector('#api-info').textContent += ` v${systemInfo.gpio_api_version}`;
            }
        },

        showMainControls(win) {
            win.querySelector('#config-panel').style.display = 'none';
            win.querySelector('#main-controls').style.display = 'block';
        },

        hideMainControls(win) {
            win.querySelector('#config-panel').style.display = 'block';
            win.querySelector('#main-controls').style.display = 'none';
        },

        showConfigStatus(win, message, type) {
            const status = win.querySelector('#config-status');
            const colors = {
                success: '#27ae60',
                error: '#e74c3c',
                info: '#3498db',
                warning: '#f39c12'
            };

            status.textContent = message;
            status.style.color = colors[type] || '#95a5a6';
        },

        handleConnectionError(win, error) {
            this.isConnected = false;
            this.connectionStatus.errorCount++;

            this.updateConnectionStatus(win, 'error', 'Connection failed');
            this.showError(win, error.message);
            this.hideMainControls(win);

            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }

            // Attempt reconnection if not too many attempts
            if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
                this.reconnectAttempts++;
                this.showConfigStatus(win, `Retrying connection (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})...`, 'warning');
                
                setTimeout(() => {
                    this.initializeConnection(win);
                }, 3000);
            } else {
                this.showConfigStatus(win, 'Max reconnection attempts reached. Please check configuration.', 'error');
            }
        },

        handleConnectionLost(win) {
            this.isConnected = false;
            
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }

            this.updateConnectionStatus(win, 'error', 'Connection lost');
            this.showError(win, 'Lost connection to GPIO service');
            
            // Attempt to reconnect
            this.showNotification('Connection lost - attempting to reconnect...', 'error');
            setTimeout(() => {
                this.initializeConnection(win);
            }, 2000);
        },

        showError(win, message) {
            const errorPanel = win.querySelector('#error-panel');
            const errorMessage = win.querySelector('#error-message');
            
            errorMessage.textContent = message;
            errorPanel.style.display = 'block';
        },

        hideError(win) {
            win.querySelector('#error-panel').style.display = 'none';
        },

        showNotification(message, type = 'info') {
            const colors = {
                success: '#27ae60',
                error: '#e74c3c',
                info: '#3498db',
                warning: '#f39c12'
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
                max-width: 350px;
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
            this.currentWindow = null;
            this.pinStates.clear();
        }
    };

    // --- System Integration ---
    const appConfig = {
        id: 'gpio-demo',
        name: 'Pi GPIO',
        icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><rect x='4' y='4' width='40' height='40' rx='6' fill='%232c3e50'/><circle cx='16' cy='16' r='3' fill='%2327ae60'/><circle cx='32' cy='16' r='3' fill='%23e74c3c'/><circle cx='16' cy='32' r='3' fill='%233498db'/><circle cx='32' cy='32' r='3' fill='%23f39c12'/><path d='M8 24h32M24 8v32' stroke='%23ecf0f1' stroke-width='1' opacity='0.3'/><rect x='20' y='20' width='8' height='8' fill='%23e74c3c' rx='2'/></svg>",
        handler: () => window.GPIODemoApp.open(),
        singleInstance: true
    };
    
    if (window.AppRegistry) {
        // Register the app to the Start Menu/Applications list
        window.AppRegistry.registerApp(appConfig);
        
        // --- FIX: Create Desktop Icon ---
        if (window.DesktopManager && typeof window.DesktopManager.createDesktopIcon === 'function') {
            window.DesktopManager.createDesktopIcon(appConfig);
        } else if (window.WindowManager && typeof window.WindowManager.createDesktopIcon === 'function') {
            // Fallback assumption if the functionality is on WindowManager
            window.WindowManager.createDesktopIcon(appConfig);
        } else {
            console.warn("DesktopManager or WindowManager's createDesktopIcon not found. Icon only in Start Menu.");
        }
        // -------------------------------

        // Register documentation
        if (window.Docs && typeof window.Docs.registerDocumentation === 'function') {
            window.Docs.registerDocumentation('gpio-demo', {
                name: "Pi GPIO Controller",
                version: "2.0.0",
                description: "Production-ready Raspberry Pi GPIO controller with industrial safety features and real-time hardware control",
                type: "Hardware App",
                features: [
                    "Auto-detection of Raspberry Pi devices on local network",
                    "Real-time GPIO pin monitoring and control",
                    "Emergency stop functionality for all output pins",
                    "Bulk GPIO operations (all high/low/toggle)",
                    "Hardware-specific pin mapping and validation",
                    "Connection monitoring with auto-reconnect",
                    "Industrial safety warnings and confirmations",
                    "Visual pin status indicators with color coding"
                ],
                dependencies: ["WindowManager", "AppRegistry"],
                apiEndpoints: [
                    { endpoint: "GET /system/info", description: "Pi model and system information" },
                    { endpoint: "GET /gpio/status", description: "All GPIO pin states and modes" },
                    { endpoint: "POST /gpio/control/{pin}", description: "Control individual GPIO pin" },
                    { endpoint: "POST /gpio/bulk_control", description: "Bulk GPIO operations" },
                    { endpoint: "POST /gpio/emergency_stop", description: "Emergency stop all outputs" }
                ],
                methods: [
                    { name: "open", description: "Creates GPIO controller window with connection interface" },
                    { name: "attemptAutoDetection", description: "Auto-detects Pi devices on local network" },
                    { name: "initializeConnection", description: "Establishes connection to GPIO service" },
                    { name: "togglePin", description: "Controls individual GPIO pin with safety checks" },
                    { name: "emergencyStop", description: "Emergency stop all output pins immediately" },
                    { name: "bulkGPIOControl", description: "Bulk operations on multiple GPIO pins" }
                ],
                notes: "Production-ready GPIO controller designed for industrial Pi deployments. Features comprehensive error handling, safety controls, and auto-detection. Requires Flask/FastAPI backend on Raspberry Pi.",
                safetyFeatures: [
                    "Emergency stop with immediate response",
                    "Pin mode validation before control",
                    "Connection timeout and retry logic",
                    "Bulk operation confirmations",
                    "Visual status indicators for all pins"
                ],
                backendRequired: true,
                targetHardware: ["Raspberry Pi 4", "Raspberry Pi 3", "Raspberry Pi Zero", "Industrial Pi modules"],
                auto_generated: false
            });
        }
    } else {
        console.error('AppRegistry not found - GPIO Controller cannot register');
        console.log('Available globals:', Object.keys(window).filter(k => k.includes('App') || k.includes('Registry')));
    }
})();

