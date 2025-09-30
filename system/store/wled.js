// WLED Controller App for edmundsparrow-WebOS
(function() {
    'use strict';

    // --- Utility Functions ---

    /**
     * Debounces a function call, ensuring it's only called once after
     * a specified delay following the last trigger.
     */
    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * Wrapper around fetch to enforce a timeout using AbortController.
     */
    async function fetchWithTimeout(url, options = {}, timeout = 5000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            if (error.name === 'AbortError') {
                throw new Error('Request timed out');
            }
            throw error;
        }
    }

    // --- Main App Object ---
    window.WLEDApp = {
        deviceIP: '',
        isConnected: false,
        currentWindow: null,
        pollingInterval: null,
        
        // Debounced handlers (initialized in setupEventHandlers)
        debouncedBrightnessChange: null,
        debouncedColorChange: null,

        open() {
            // Retrieve stored IP if available, default to empty
            this.deviceIP = localStorage.getItem('wled_device_ip') || '';

            const wledHTML = `
                <div class="wled-app" style="
                    height: 100%;
                    max-height: 100%;
                    display: flex;
                    flex-direction: column;
                    font-family: 'Inter', sans-serif;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                    color: white;
                ">
                    <!-- Header -->
                    <div class="wled-header" style="
                        padding: 16px 20px;
                        background: rgba(255, 255, 255, 0.1);
                        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                        backdrop-filter: blur(10px);
                        border-top-left-radius: 8px;
                        border-top-right-radius: 8px;
                    ">
                        <h2 style="margin: 0 0 8px 0; font-size: 20px; color: #64ffda;">WLED Controller</h2>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <input 
                                type="text" 
                                id="deviceIP" 
                                placeholder="192.168.1.100" 
                                value="${this.deviceIP}"
                                style="
                                    padding: 8px 12px;
                                    border: 1px solid rgba(100, 255, 218, 0.3);
                                    border-radius: 6px;
                                    background: rgba(255, 255, 255, 0.1);
                                    color: white;
                                    font-size: 14px;
                                    width: 140px;
                                "
                            />
                            <button id="connectBtn" style="
                                padding: 8px 16px;
                                border: none;
                                border-radius: 6px;
                                background: ${this.isConnected ? '#4caf50' : '#2196f3'};
                                color: white;
                                font-weight: 600;
                                cursor: pointer;
                                font-size: 14px;
                                transition: all 0.3s ease;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                            ">${this.isConnected ? 'Disconnect' : 'Connect'}</button>
                            
                            <div id="statusIndicator" style="
                                width: 12px;
                                height: 12px;
                                border-radius: 50%;
                                background: ${this.isConnected ? '#4caf50' : '#f44336'};
                                margin-left: auto;
                                box-shadow: 0 0 8px ${this.isConnected ? '#4caf50' : '#f44336'};
                            "></div>
                        </div>
                    </div>

                    <!-- Controls Section -->
                    <div class="wled-controls" style="
                        flex: 1;
                        padding: 24px;
                        overflow-y: auto;
                        -webkit-overflow-scrolling: touch;
                    ">
                        <!-- Power Control -->
                        <div class="control-group" style="margin-bottom: 32px;">
                            <h3 style="margin: 0 0 16px 0; color: #64ffda; font-size: 16px; border-bottom: 1px solid rgba(100, 255, 218, 0.3); padding-bottom: 8px;">Power</h3>
                            <div style="display: flex; gap: 12px;">
                                <button id="powerOn" class="control-btn" style="
                                    flex: 1;
                                    padding: 16px;
                                    border: none;
                                    border-radius: 8px;
                                    background: linear-gradient(135deg, #4caf50, #45a049);
                                    color: white;
                                    font-weight: 600;
                                    cursor: pointer;
                                    font-size: 16px;
                                    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
                                    transition: all 0.3s ease;
                                ">ON</button>
                                <button id="powerOff" class="control-btn" style="
                                    flex: 1;
                                    padding: 16px;
                                    border: none;
                                    border-radius: 8px;
                                    background: linear-gradient(135deg, #f44336, #d32f2f);
                                    color: white;
                                    font-weight: 600;
                                    cursor: pointer;
                                    font-size: 16px;
                                    box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
                                    transition: all 0.3s ease;
                                ">OFF</button>
                            </div>
                        </div>

                        <!-- Brightness Control -->
                        <div class="control-group" style="margin-bottom: 32px;">
                            <h3 style="margin: 0 0 16px 0; color: #64ffda; font-size: 16px; border-bottom: 1px solid rgba(100, 255, 218, 0.3); padding-bottom: 8px;">Brightness</h3>
                            <div style="display: flex; align-items: center; gap: 16px;">
                                <span style="font-size: 14px; opacity: 0.8; min-width: 30px;">0</span>
                                <input 
                                    type="range" 
                                    id="brightness" 
                                    min="0" 
                                    max="255" 
                                    value="128"
                                    style="
                                        flex: 1;
                                        height: 6px;
                                        border-radius: 3px;
                                        background: linear-gradient(90deg, #333, #64ffda);
                                        outline: none;
                                        cursor: pointer;
                                        -webkit-appearance: none;
                                        appearance: none;
                                    "
                                />
                                <span style="font-size: 14px; opacity: 0.8; min-width: 30px;">255</span>
                                <span id="brightnessValue" style="
                                    font-weight: 600;
                                    color: #64ffda;
                                    min-width: 40px;
                                    text-align: center;
                                    background: rgba(100, 255, 218, 0.1);
                                    padding: 4px 8px;
                                    border-radius: 4px;
                                ">128</span>
                            </div>
                        </div>

                        <!-- Color Control -->
                        <div class="control-group" style="margin-bottom: 32px;">
                            <h3 style="margin: 0 0 16px 0; color: #64ffda; font-size: 16px; border-bottom: 1px solid rgba(100, 255, 218, 0.3); padding-bottom: 8px;">Color</h3>
                            <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
                                <input 
                                    type="color" 
                                    id="colorPicker" 
                                    value="#ff0000"
                                    style="
                                        width: 60px;
                                        height: 40px;
                                        border: none;
                                        border-radius: 8px;
                                        cursor: pointer;
                                        background: none;
                                        -webkit-appearance: none;
                                        appearance: none;
                                    "
                                />
                                <span id="colorValue" style="
                                    font-family: monospace;
                                    background: rgba(100, 255, 218, 0.1);
                                    padding: 8px 12px;
                                    border-radius: 6px;
                                    color: #64ffda;
                                    flex: 1;
                                ">#ff0000</span>
                            </div>
                            
                            <!-- Quick Color Presets -->
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(40px, 1fr)); gap: 8px;">
                                <button class="color-preset" data-color="#ff0000" style="width: 40px; height: 40px; background: #ff0000; border: 2px solid transparent; border-radius: 8px; cursor: pointer; transition: border 0.2s;"></button>
                                <button class="color-preset" data-color="#00ff00" style="width: 40px; height: 40px; background: #00ff00; border: 2px solid transparent; border-radius: 8px; cursor: pointer; transition: border 0.2s;"></button>
                                <button class="color-preset" data-color="#0000ff" style="width: 40px; height: 40px; background: #0000ff; border: 2px solid transparent; border-radius: 8px; cursor: pointer; transition: border 0.2s;"></button>
                                <button class="color-preset" data-color="#ffff00" style="width: 40px; height: 40px; background: #ffff00; border: 2px solid transparent; border-radius: 8px; cursor: pointer; transition: border 0.2s;"></button>
                                <button class="color-preset" data-color="#ff00ff" style="width: 40px; height: 40px; background: #ff00ff; border: 2px solid transparent; border-radius: 8px; cursor: pointer; transition: border 0.2s;"></button>
                                <button class="color-preset" data-color="#00ffff" style="width: 40px; height: 40px; background: #00ffff; border: 2px solid transparent; border-radius: 8px; cursor: pointer; transition: border 0.2s;"></button>
                                <button class="color-preset" data-color="#ffffff" style="width: 40px; height: 40px; background: #ffffff; border: 2px solid transparent; border-radius: 8px; cursor: pointer; transition: border 0.2s;"></button>
                                <button class="color-preset" data-color="#ffa500" style="width: 40px; height: 40px; background: #ffa500; border: 2px solid transparent; border-radius: 8px; cursor: pointer; transition: border 0.2s;"></button>
                            </div>
                        </div>

                        <!-- Effects -->
                        <div class="control-group" style="margin-bottom: 32px;">
                            <h3 style="margin: 0 0 16px 0; color: #64ffda; font-size: 16px; border-bottom: 1px solid rgba(100, 255, 218, 0.3); padding-bottom: 8px;">Effects</h3>
                            <div id="effectControls" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 12px;">
                                <!-- Effects loaded dynamically -->
                                <button class="effect-btn" data-effect="0" data-name="Solid" style="
                                    padding: 12px 8px;
                                    border: none;
                                    border-radius: 8px;
                                    background: rgba(100, 255, 218, 0.1);
                                    color: #64ffda;
                                    font-weight: 600;
                                    cursor: pointer;
                                    font-size: 12px;
                                    transition: all 0.3s ease;
                                    border: 1px solid rgba(100, 255, 218, 0.3);
                                ">Solid</button>
                                <button class="effect-btn" data-effect="28" data-name="Rainbow" style="
                                    padding: 12px 8px;
                                    border: none;
                                    border-radius: 8px;
                                    background: rgba(100, 255, 218, 0.1);
                                    color: #64ffda;
                                    font-weight: 600;
                                    cursor: pointer;
                                    font-size: 12px;
                                    transition: all 0.3s ease;
                                    border: 1px solid rgba(100, 255, 218, 0.3);
                                ">Rainbow</button>
                                <button class="effect-btn" data-effect="42" data-name="Twinklefox" style="
                                    padding: 12px 8px;
                                    border: none;
                                    border-radius: 8px;
                                    background: rgba(100, 255, 218, 0.1);
                                    color: #64ffda;
                                    font-weight: 600;
                                    cursor: pointer;
                                    font-size: 12px;
                                    transition: all 0.3s ease;
                                    border: 1px solid rgba(100, 255, 218, 0.3);
                                ">Twinklefox</button>
                                <!-- More effects can be loaded here from info/fx property if available -->
                            </div>
                        </div>
                    </div>

                    <!-- Status Bar -->
                    <div class="wled-status" style="
                        padding: 12px 20px;
                        background: rgba(0, 0, 0, 0.3);
                        border-top: 1px solid rgba(255, 255, 255, 0.1);
                        font-size: 12px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom-left-radius: 8px;
                        border-bottom-right-radius: 8px;
                    ">
                        <span id="statusMessage">Ready to connect</span>
                        <span id="deviceInfo">No device</span>
                    </div>
                </div>
            `;

            const win = window.WindowManager.createWindow('WLED Controller', wledHTML, 400, 600);
            this.currentWindow = win;
            this.setupEventHandlers(win);
            
            // Attempt to connect on open if IP is saved
            if (this.deviceIP) {
                this.connect(win);
            }

            return win;
        },

        setupEventHandlers(win) {
            const deviceIPInput = win.querySelector('#deviceIP');
            const connectBtn = win.querySelector('#connectBtn');
            const powerOnBtn = win.querySelector('#powerOn');
            const powerOffBtn = win.querySelector('#powerOff');
            const brightnessSlider = win.querySelector('#brightness');
            const colorPicker = win.querySelector('#colorPicker');
            const colorPresets = win.querySelectorAll('.color-preset');
            const effectBtns = win.querySelectorAll('.effect-btn');

            // Initialize debounced functions (200ms debounce)
            this.debouncedBrightnessChange = debounce((value) => {
                this.sendCommand(`/win&A=${value}`);
            }, 200);

            this.debouncedColorChange = debounce((color) => {
                this.setColor(color);
            }, 200);

            // Connect/Disconnect
            connectBtn.addEventListener('click', () => {
                const ip = deviceIPInput.value.trim();
                if (this.isConnected) {
                    this.disconnect(win);
                } else if (ip) {
                    this.deviceIP = ip;
                    localStorage.setItem('wled_device_ip', ip);
                    this.connect(win);
                } else {
                    this.showStatus(win, 'Please enter device IP address', 'error');
                }
            });

            // Power controls
            powerOnBtn.addEventListener('click', () => this.sendCommand('/win&T=1', 'powerOn'));
            powerOffBtn.addEventListener('click', () => this.sendCommand('/win&T=0', 'powerOff'));

            // Brightness control
            brightnessSlider.addEventListener('input', (e) => {
                win.querySelector('#brightnessValue').textContent = e.target.value;
                this.debouncedBrightnessChange(e.target.value);
            });

            // Color picker
            colorPicker.addEventListener('input', (e) => {
                const color = e.target.value;
                win.querySelector('#colorValue').textContent = color;
                this.debouncedColorChange(color);
            });

            // Color presets
            colorPresets.forEach(preset => {
                preset.addEventListener('click', () => {
                    const color = preset.dataset.color;
                    colorPicker.value = color;
                    win.querySelector('#colorValue').textContent = color;
                    this.setColor(color);
                });
            });

            // Effects
            win.addEventListener('click', (e) => {
                if (e.target.classList.contains('effect-btn')) {
                    const effect = e.target.dataset.effect;
                    this.sendCommand(`/win&FX=${effect}`, 'effectChange');
                    this.setActiveEffectButton(e.target);
                }
            });

            // Initial hover effects setup
            this.addHoverEffects(win);
        },

        setActiveEffectButton(activeButton) {
            this.currentWindow.querySelectorAll('.effect-btn').forEach(b => {
                b.style.background = 'rgba(100, 255, 218, 0.1)';
                b.style.borderColor = 'rgba(100, 255, 218, 0.3)';
            });
            if (activeButton) {
                activeButton.style.background = 'rgba(100, 255, 218, 0.3)';
                activeButton.style.borderColor = '#64ffda';
            }
        },

        addHoverEffects(win) {
            // Reusable hover handler
            const applyHoverEffects = (selector, enterFn, leaveFn) => {
                win.querySelectorAll(selector).forEach(btn => {
                    btn.addEventListener('mouseenter', enterFn);
                    btn.addEventListener('mouseleave', leaveFn);
                });
            };

            // Control buttons hover
            applyHoverEffects('.control-btn', (e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = e.target.style.boxShadow.replace('4px', '8px');
            }, (e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = e.target.style.boxShadow.replace('8px', '4px');
            });

            // Color preset hover
            applyHoverEffects('.color-preset', (e) => {
                e.target.style.border = '2px solid #64ffda';
            }, (e) => {
                e.target.style.border = '2px solid transparent';
            });
        },

        async connect(win) {
            this.showStatus(win, 'Connecting...', 'info');
            this.updateConnectionUI(win, false, true); // Set to connecting state

            try {
                // Test connection and get info (5 second timeout)
                const response = await fetchWithTimeout(`http://${this.deviceIP}/json/info`, { method: 'GET' }, 5000);
                
                if (!response.ok) {
                    throw new Error('HTTP error: ' + response.status);
                }
                
                const info = await response.json();
                
                this.isConnected = true;
                this.updateConnectionUI(win, true);
                this.showStatus(win, 'Connected successfully', 'success');
                
                const deviceInfo = win.querySelector('#deviceInfo');
                deviceInfo.textContent = `${info.name || 'WLED Device'} v${info.ver || 'Unknown'}`;

                // Start polling for state updates (every 2 seconds)
                this.startPolling(win);

                // Initial state sync
                this.getWLEDState(win);

            } catch (error) {
                console.error('WLED Connection Error:', error);
                this.showStatus(win, `Connection failed: ${error.message}`, 'error');
                this.isConnected = false;
                this.updateConnectionUI(win, false);
            }
        },

        disconnect(win) {
            this.isConnected = false;
            this.stopPolling();
            this.updateConnectionUI(win, false);
            this.showStatus(win, 'Disconnected', 'info');
            
            const deviceInfo = win.querySelector('#deviceInfo');
            deviceInfo.textContent = 'No device';
        },

        startPolling(win) {
            this.stopPolling(); // Clear any existing interval
            this.pollingInterval = setInterval(() => this.getWLEDState(win, true), 2000); // Poll every 2 seconds
        },

        stopPolling() {
            if (this.pollingInterval) {
                clearInterval(this.pollingInterval);
                this.pollingInterval = null;
            }
        },

        async getWLEDState(win, silent = false) {
            if (!this.isConnected || !this.deviceIP) return;

            try {
                const response = await fetchWithTimeout(`http://${this.deviceIP}/json/state`, { method: 'GET' }, 3000);
                
                if (!response.ok) throw new Error('Failed to fetch state');
                
                const state = await response.json();
                
                // --- Sync UI Elements ---
                const mainSegment = state.seg ? state.seg[0] : {}; // Get the first segment state
                
                // 1. Power State
                const powerOnBtn = win.querySelector('#powerOn');
                const powerOffBtn = win.querySelector('#powerOff');
                const isPoweredOn = state.on;

                powerOnBtn.style.opacity = isPoweredOn ? '1.0' : '0.7';
                powerOffBtn.style.opacity = !isPoweredOn ? '1.0' : '0.7';

                // 2. Brightness
                const brightnessSlider = win.querySelector('#brightness');
                const brightnessValue = win.querySelector('#brightnessValue');
                
                brightnessSlider.value = state.bri || 0;
                brightnessValue.textContent = state.bri || 0;
                
                // 3. Color
                const colorPicker = win.querySelector('#colorPicker');
                const colorValue = win.querySelector('#colorValue');
                
                if (mainSegment.col && mainSegment.col[0]) {
                    const rgb = mainSegment.col[0];
                    const hexColor = '#' + this.rgbToHex(rgb[0], rgb[1], rgb[2]);
                    
                    colorPicker.value = hexColor;
                    colorValue.textContent = hexColor;
                }
                
                // 4. Effect
                const currentEffectId = mainSegment.fx;
                
                this.currentWindow.querySelectorAll('.effect-btn').forEach(btn => {
                    const isActive = parseInt(btn.dataset.effect) === currentEffectId;
                    if (isActive) {
                        this.setActiveEffectButton(btn);
                    }
                });

                if (!silent) {
                    this.showStatus(win, 'State synced', 'success');
                }

            } catch (error) {
                console.error('WLED State Sync Error:', error);
                // If polling fails, treat it as a disconnect
                if (!silent) {
                    this.showStatus(win, 'State sync failed. Retrying...', 'warning');
                } else {
                    // Silent polling failed, only disconnect if it's a persistent issue
                    // For now, let's keep it simple: if the polling fails, we show a warning but don't disconnect.
                }
            }
        },

        updateConnectionUI(win, connected, connecting = false) {
            const connectBtn = win.querySelector('#connectBtn');
            const statusIndicator = win.querySelector('#statusIndicator');
            
            connectBtn.textContent = connecting ? 'Connecting...' : (connected ? 'Disconnect' : 'Connect');
            connectBtn.disabled = connecting;
            connectBtn.style.background = connecting ? '#ff9800' : (connected ? '#f44336' : '#2196f3');
            
            statusIndicator.style.background = connected ? '#4caf50' : (connecting ? '#ff9800' : '#f44336');
            statusIndicator.style.boxShadow = `0 0 8px ${connected ? '#4caf50' : (connecting ? '#ff9800' : '#f44336')}`;
        },

        async sendCommand(command, actionType = 'generic') {
            if (!this.isConnected || !this.deviceIP) {
                this.showStatus(this.currentWindow, 'Not connected to device', 'error');
                return false;
            }

            try {
                // Commands are sent with a 3 second timeout
                const response = await fetchWithTimeout(`http://${this.deviceIP}${command}`, { method: 'GET' }, 3000);
                
                if (response.ok) {
                    this.showStatus(this.currentWindow, `Command (${actionType}) sent successfully`, 'success');
                    // Force state sync after command for immediate UI update
                    this.getWLEDState(this.currentWindow, true); 
                    return true;
                } else {
                    throw new Error('HTTP status: ' + response.status);
                }
            } catch (error) {
                this.showStatus(this.currentWindow, `Command failed: ${error.message}`, 'error');
                return false;
            }
        },

        setColor(hexColor) {
            // Convert hex to RGB (r,g,b) for the WLED API's simplified /win endpoint
            const r = parseInt(hexColor.substr(1, 2), 16);
            const g = parseInt(hexColor.substr(3, 2), 16);
            const b = parseInt(hexColor.substr(5, 2), 16);
            
            this.sendCommand(`/win&R=${r}&G=${g}&B=${b}`, 'colorChange');
        },

        rgbToHex(r, g, b) {
            const toHex = (c) => ('0' + c.toString(16)).slice(-2);
            return toHex(r) + toHex(g) + toHex(b);
        },

        showStatus(win, message, type) {
            const statusMessage = win.querySelector('#statusMessage');
            statusMessage.textContent = message;
            
            // Color coding for status types
            const colors = {
                success: '#4caf50',
                error: '#f44336',
                info: '#2196f3',
                warning: '#ff9800',
                ready: '#64ffda'
            };
            
            statusMessage.style.color = colors[type] || colors.ready;
            
            // Auto-clear success messages
            if (type === 'success') {
                setTimeout(() => {
                    statusMessage.textContent = 'Ready';
                    statusMessage.style.color = colors.ready;
                }, 3000);
            }
        }
    };

    // Register app with the system
    if (window.AppRegistry) {
        window.AppRegistry.registerApp({
            id: 'wled',
            name: 'WLED Controller',
            icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' rx='8' fill='%231a1a2e'/><circle cx='12' cy='24' r='4' fill='%23ff0000'/><circle cx='24' cy='24' r='4' fill='%2300ff00'/><circle cx='36' cy='24' r='4' fill='%230000ff'/><path d='M8 32h32v4H8z' fill='%2364ffda'/></svg>",
            handler: () => window.WLEDApp.open(),
            singleInstance: true
        });
    }

    // Register documentation
    if (window.Docs && typeof window.Docs.registerDocumentation === 'function') {
        window.Docs.registerDocumentation('wled', {
            name: "WLED Controller",
            version: "1.1.0 (Production)",
            description: "IoT LED strip controller app for WLED-compatible devices with real-time color, brightness, and effect control.",
            type: "IoT App",
            features: [
                "Robust connection handling with timeouts",
                "200ms debounced controls (Brightness/Color) to prevent WLED crash",
                "Real-time UI state synchronization via 2-second polling",
                "Color picker, Brightness slider, and Power controls",
                "Device connection status monitoring",
                "Supports WLED HTTP API for control"
            ],
            dependencies: ["WindowManager", "AppRegistry"],
            methods: [
                { name: "open", description: "Creates WLED controller window and attempts initial connection." },
                { name: "connect", description: "Establishes connection, fetches device info, and starts state polling." },
                { name: "getWLEDState", description: "Polls device for current power, brightness, color, and effect state to sync the UI." },
                { name: "sendCommand", description: "Sends HTTP commands securely with a 3-second timeout." },
            ],
            notes: "This version includes production safeguards like debouncing and state syncing to ensure a stable connection with real WLED hardware. Uses the `/json/state` and `/json/info` endpoints.",
            cudos: "edmundsparrow.netlify.app | whatsappme @ 09024054758 | webaplications5050@gmail.com",
            auto_generated: false
        });
    }

})();
