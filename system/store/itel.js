/* ========================================
 * FILE: applications/itel.js
 * PURPOSE: Itel Device Controller - Lightweight IoT device management
 * DEPENDENCIES: AppRegistry, WindowManager
 * ======================================== */

(function() {
    'use strict';

    // Itel device controller configuration
    const ITEL_CONFIG = {
        defaultIP: '192.168.1.100',
        apiPort: 8080,
        connectionTimeout: 5000,
        statusPollInterval: 3000
    };

    // Mock device data - replace with real API calls
    const mockDevices = [
        { id: 'tv_main', name: 'Itel Smart TV 55"', type: 'TV', status: 'online', room: 'Living Room' },
        { id: 'phone_a1', name: 'Itel A58 Pro', type: 'PHONE', status: 'connected', room: 'Personal' },
        { id: 'tablet_t1', name: 'Itel Pad A10', type: 'TABLET', status: 'offline', room: 'Bedroom' },
        { id: 'speaker_s1', name: 'Itel Smart Speaker', type: 'AUDIO', status: 'online', room: 'Kitchen' }
    ];

    const ItelControllerApp = {
        id: 'itel',
        name: 'Itel Controller',
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect x="6" y="6" width="36" height="36" rx="6" fill="%23FF6B35"/><text x="24" y="30" text-anchor="middle" font-size="14" font-weight="bold" fill="white">itel</text></svg>',
        category: 'IoT',
        version: 'v1.0.0',
        windowId: null,
        isConnected: false,
        currentIP: ITEL_CONFIG.defaultIP,
        statusInterval: null,

        // Main application entry point
        open() {
            if (this.windowId && window.WindowManager.isWindowOpen && window.WindowManager.isWindowOpen(this.windowId)) {
                window.WindowManager.focusWindow(this.windowId);
                return this.windowId;
            }

            const content = this.createContent();
            this.windowId = window.WindowManager.createWindow(this.name, content, 450, 600);
            this.setupEventHandlers();
            this.initializeConnection();
            
            return this.windowId;
        },

        // Create the main UI content
        createContent() {
            return `
                <div class="itel-controller" style="
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    font-family: 'Segoe UI', sans-serif;
                    background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
                    color: white;
                ">
                    <!-- Header Section -->
                    <div class="itel-header" style="
                        padding: 16px 20px;
                        background: rgba(0, 0, 0, 0.2);
                        backdrop-filter: blur(10px);
                        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                    ">
                        <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600;">Itel Smart Control</h2>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <input 
                                type="text" 
                                id="device-ip" 
                                placeholder="Device IP Address" 
                                value="${this.currentIP}"
                                style="
                                    flex: 1;
                                    padding: 8px 12px;
                                    border: 1px solid rgba(255, 255, 255, 0.3);
                                    border-radius: 6px;
                                    background: rgba(255, 255, 255, 0.1);
                                    color: white;
                                    font-size: 14px;
                                "
                            />
                            <button id="connect-btn" style="
                                padding: 8px 16px;
                                border: none;
                                border-radius: 6px;
                                background: ${this.isConnected ? '#4CAF50' : 'rgba(255, 255, 255, 0.2)'};
                                color: white;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.3s ease;
                            ">${this.isConnected ? 'Connected' : 'Connect'}</button>
                            
                            <div id="status-indicator" style="
                                width: 12px;
                                height: 12px;
                                border-radius: 50%;
                                background: ${this.isConnected ? '#4CAF50' : '#f44336'};
                                box-shadow: 0 0 10px ${this.isConnected ? '#4CAF50' : '#f44336'};
                            "></div>
                        </div>
                    </div>

                    <!-- Device List Section -->
                    <div class="device-list-section" style="
                        flex: 1;
                        padding: 20px;
                        overflow-y: auto;
                    ">
                        <h3 style="margin: 0 0 16px 0; font-size: 16px; opacity: 0.9;">Connected Devices</h3>
                        <div id="device-list" style="display: flex; flex-direction: column; gap: 12px;">
                            <!-- Device items will be populated here -->
                        </div>
                        
                        <div id="no-devices" style="
                            text-align: center;
                            padding: 40px 20px;
                            opacity: 0.7;
                            display: none;
                        ">
                            <div style="font-size: 48px; margin-bottom: 16px;">📱</div>
                            <p>No Itel devices found</p>
                            <p style="font-size: 12px; margin-top: 8px;">Make sure your devices are on the same network</p>
                        </div>
                    </div>

                    <!-- Status Bar -->
                    <div class="status-bar" style="
                        padding: 12px 20px;
                        background: rgba(0, 0, 0, 0.3);
                        border-top: 1px solid rgba(255, 255, 255, 0.1);
                        font-size: 12px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <span id="status-message">Ready to connect</span>
                        <span id="device-count">0 devices</span>
                    </div>
                </div>
            `;
        },

        // Setup event handlers for the UI
        setupEventHandlers() {
            const win = document.getElementById(this.windowId);
            if (!win) return;

            const connectBtn = win.querySelector('#connect-btn');
            const deviceIP = win.querySelector('#device-ip');

            // Connection button handler
            connectBtn.addEventListener('click', () => {
                this.currentIP = deviceIP.value.trim();
                if (this.isConnected) {
                    this.disconnect();
                } else {
                    this.connect();
                }
            });

            // IP input handler
            deviceIP.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.currentIP = deviceIP.value.trim();
                    if (!this.isConnected) {
                        this.connect();
                    }
                }
            });

            // Window close handler
            if (window.EventBus) {
                window.EventBus.on('window-closed', (data) => {
                    if (data.windowId === this.windowId) {
                        this.cleanup();
                    }
                });
            }
        },

        // Initialize connection attempt
        initializeConnection() {
            this.showStatus('Initializing Itel Controller...');
            setTimeout(() => {
                this.showStatus('Ready to connect to Itel devices');
                this.renderDevices(mockDevices); // Show mock devices initially
            }, 1000);
        },

        // Connect to Itel device network
        async connect() {
            this.showStatus('Connecting to Itel network...', 'info');
            this.updateConnectionUI(false, 'Connecting...');

            try {
                // Simulate connection attempt
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // In real implementation, this would be:
                // const response = await fetch(`http://${this.currentIP}:${ITEL_CONFIG.apiPort}/api/devices`);
                // const devices = await response.json();
                
                this.isConnected = true;
                this.updateConnectionUI(true, 'Connected');
                this.showStatus('Connected to Itel network', 'success');
                this.startStatusPolling();
                this.renderDevices(mockDevices);
                
            } catch (error) {
                this.showStatus('Failed to connect to Itel network', 'error');
                this.updateConnectionUI(false, 'Connect');
                this.renderNoDevices();
            }
        },

        // Disconnect from Itel network
        disconnect() {
            this.isConnected = false;
            this.stopStatusPolling();
            this.updateConnectionUI(false, 'Connect');
            this.showStatus('Disconnected from Itel network');
            this.renderNoDevices();
        },

        // Update connection UI elements
        updateConnectionUI(connected, buttonText) {
            const win = document.getElementById(this.windowId);
            if (!win) return;

            const connectBtn = win.querySelector('#connect-btn');
            const statusIndicator = win.querySelector('#status-indicator');

            connectBtn.textContent = buttonText;
            connectBtn.style.background = connected ? '#4CAF50' : 'rgba(255, 255, 255, 0.2)';
            
            statusIndicator.style.background = connected ? '#4CAF50' : '#f44336';
            statusIndicator.style.boxShadow = `0 0 10px ${connected ? '#4CAF50' : '#f44336'}`;
        },

        // Render device list
        renderDevices(devices) {
            const win = document.getElementById(this.windowId);
            if (!win) return;

            const deviceList = win.querySelector('#device-list');
            const noDevices = win.querySelector('#no-devices');
            const deviceCount = win.querySelector('#device-count');

            if (devices.length === 0) {
                this.renderNoDevices();
                return;
            }

            noDevices.style.display = 'none';
            deviceCount.textContent = `${devices.length} device${devices.length !== 1 ? 's' : ''}`;

            deviceList.innerHTML = devices.map(device => `
                <div class="device-item" style="
                    background: rgba(255, 255, 255, 0.15);
                    border-radius: 8px;
                    padding: 16px;
                    backdrop-filter: blur(5px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    cursor: pointer;
                    transition: all 0.2s ease;
                " onmouseover="this.style.background='rgba(255, 255, 255, 0.25)'" 
                   onmouseout="this.style.background='rgba(255, 255, 255, 0.15)'">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <h4 style="margin: 0; font-size: 16px;">${device.name}</h4>
                        <div style="
                            padding: 4px 8px;
                            border-radius: 12px;
                            font-size: 10px;
                            font-weight: 600;
                            text-transform: uppercase;
                            background: ${device.status === 'online' || device.status === 'connected' ? '#4CAF50' : '#f44336'};
                        ">${device.status}</div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; opacity: 0.8;">
                        <span>${device.type} • ${device.room}</span>
                        <span>${device.id}</span>
                    </div>
                </div>
            `).join('');

            // Add click handlers for device items
            deviceList.querySelectorAll('.device-item').forEach((item, index) => {
                item.addEventListener('click', () => {
                    this.selectDevice(devices[index]);
                });
            });
        },

        // Render no devices state
        renderNoDevices() {
            const win = document.getElementById(this.windowId);
            if (!win) return;

            const deviceList = win.querySelector('#device-list');
            const noDevices = win.querySelector('#no-devices');
            const deviceCount = win.querySelector('#device-count');

            deviceList.innerHTML = '';
            noDevices.style.display = 'block';
            deviceCount.textContent = '0 devices';
        },

        // Handle device selection
        selectDevice(device) {
            this.showStatus(`Selected ${device.name}`, 'info');
            // In real implementation, this would open device-specific controls
            console.log('Selected device:', device);
        },

        // Start status polling
        startStatusPolling() {
            if (this.statusInterval) return;
            
            this.statusInterval = setInterval(() => {
                if (this.isConnected) {
                    // In real implementation, poll device status
                    this.showStatus('Polling device status...');
                    setTimeout(() => {
                        this.showStatus('All devices responsive', 'success');
                    }, 500);
                }
            }, ITEL_CONFIG.statusPollInterval);
        },

        // Stop status polling
        stopStatusPolling() {
            if (this.statusInterval) {
                clearInterval(this.statusInterval);
                this.statusInterval = null;
            }
        },

        // Show status message
        showStatus(message, type = 'info') {
            const win = document.getElementById(this.windowId);
            if (!win) return;

            const statusMessage = win.querySelector('#status-message');
            if (statusMessage) {
                statusMessage.textContent = message;
                
                // Color coding based on type
                const colors = {
                    success: '#4CAF50',
                    error: '#f44336',
                    info: 'rgba(255, 255, 255, 0.8)',
                    warning: '#FFC107'
                };
                
                statusMessage.style.color = colors[type] || colors.info;
            }
        },

        // Cleanup when window closes
        cleanup() {
            this.stopStatusPolling();
            this.isConnected = false;
            this.windowId = null;
        }
    };

    // Register the application with the system
    if (window.AppRegistry) {
        window.AppRegistry.registerApp({
            id: 'itel',
            name: 'Itel Controller',
            icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect x="6" y="6" width="36" height="36" rx="6" fill="%23FF6B35"/><text x="24" y="30" text-anchor="middle" font-size="14" font-weight="bold" fill="white">itel</text></svg>',
            handler: () => ItelControllerApp.open(),
            singleInstance: true,
        });
    }

    // Register documentation
    if (window.Docs && typeof window.Docs.registerDocumentation === 'function') {
        window.Docs.registerDocumentation('itel', {
            name: "Itel Controller",
            version: "1.0.0",
            description: "Lightweight controller app for Itel smart devices including TVs, phones, tablets, and IoT accessories",
            type: "User App",
            features: [
                "Device discovery and connection management",
                "Real-time device status monitoring",
                "Multi-device control interface",
                "Network-based device communication",
                "Responsive design for all screen sizes",
                "Status polling with connection recovery"
            ],
            dependencies: ["WindowManager", "AppRegistry"],
            methods: [
                { name: "open", description: "Opens the Itel controller window with device discovery" },
                { name: "connect", description: "Establishes connection to Itel device network" },
                { name: "renderDevices", description: "Displays discovered Itel devices with status indicators" },
                { name: "selectDevice", description: "Handles device selection for control operations" }
            ],
            notes: "Ready for integration with Itel's actual device APIs. Currently shows mock devices for demonstration purposes.",
            auto_generated: false
        });
    }

    // Make available globally for debugging
    window.ItelControllerApp = ItelControllerApp;

})();
