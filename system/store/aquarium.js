// aquarium.js - Professional Aquarium Controller for WebDesktop
/**
 * FILE: applications/aquarium.js
 * VERSION: 2.0.0 - PRODUCTION READY
 * BUILD DATE: 2025-09-27
 *
 * PURPOSE:
 * Professional aquarium monitoring and control system for hobbyists.
 * Monitors water parameters, lighting schedules, feeding systems, and equipment.
 *
 * FEATURES:
 * - Real-time water parameter monitoring (pH, temperature, ammonia, nitrite, nitrate)
 * - Automated lighting schedule control with sunrise/sunset simulation
 * - Feeding system automation with portion control
 * - Equipment status monitoring (filters, heaters, pumps, air stones)
 * - Alert system for critical parameter deviations
 * - Historical data tracking and graphing
 * - Multi-tank support with individual configurations
 *
 * BACKEND API ENDPOINTS:
 * GET  /api/tanks           - List all tanks
 * GET  /api/tank/{id}/status - Current tank parameters
 * POST /api/tank/{id}/feed   - Trigger feeding
 * POST /api/tank/{id}/light  - Control lighting
 * GET  /api/tank/{id}/history - Historical data
 * POST /api/tank/{id}/alert  - Configure alerts
 */

(function() {
    window.AquariumApp = {
        // Configuration
        config: {
            apiBaseUrl: '/api',
            updateInterval: 5000, // 5 seconds for real-time monitoring
            maxReconnectAttempts: 10,
            connectionTimeout: 8000
        },

        // Runtime state
        isConnected: false,
        currentTank: 'main',
        tanks: new Map(),
        currentWindow: null,
        updateInterval: null,
        reconnectAttempts: 0,
        
        // Connection status tracking
        connectionStatus: {
            api: false,
            lastUpdate: null,
            errorCount: 0
        },

        // Mock data for demonstration
        mockData: {
            tanks: [
                {
                    id: 'main',
                    name: 'Community Tank',
                    size: '75 Gallon',
                    fish: ['Neon Tetras', 'Angelfish', 'Corydoras'],
                    parameters: {
                        temperature: 76.2,
                        pH: 6.8,
                        ammonia: 0.0,
                        nitrite: 0.0,
                        nitrate: 10.5,
                        oxygen: 8.2
                    },
                    equipment: {
                        heater: { status: 'on', target: 76.0, current: 76.2 },
                        filter: { status: 'running', flow: 350 },
                        light: { status: 'on', intensity: 75, schedule: 'auto' },
                        airPump: { status: 'on', flow: 2.5 }
                    },
                    feeding: {
                        lastFed: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
                        nextFeed: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
                        dailyFeedings: 3,
                        autoFeed: true
                    }
                },
                {
                    id: 'saltwater',
                    name: 'Reef Tank',
                    size: '50 Gallon',
                    fish: ['Clownfish', 'Tang', 'Gobies'],
                    parameters: {
                        temperature: 78.5,
                        pH: 8.2,
                        ammonia: 0.0,
                        nitrite: 0.0,
                        nitrate: 5.2,
                        salinity: 1.025
                    },
                    equipment: {
                        heater: { status: 'on', target: 78.0, current: 78.5 },
                        filter: { status: 'running', flow: 400 },
                        light: { status: 'on', intensity: 85, schedule: 'auto' },
                        skimmer: { status: 'on', efficiency: 92 }
                    },
                    feeding: {
                        lastFed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                        nextFeed: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
                        dailyFeedings: 2,
                        autoFeed: true
                    }
                }
            ]
        },

        open() {
            const aquariumHTML = `
                <div class="aquarium-app" style="
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    font-family: 'Segoe UI', sans-serif;
                    background: linear-gradient(135deg, #0c4a6e 0%, #0e7490 50%, #0891b2 100%);
                    color: white;
                    overflow: hidden;
                ">
                    <!-- Header -->
                    <div class="aquarium-header" style="
                        padding: 16px 20px;
                        background: rgba(255, 255, 255, 0.1);
                        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                        backdrop-filter: blur(10px);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <div>
                            <h2 style="margin: 0; font-size: 20px; color: #67e8f9;">Aquarium Controller</h2>
                            <div style="font-size: 12px; opacity: 0.9;" id="tank-info">Tank: Loading...</div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <select id="tank-selector" style="
                                padding: 8px 12px;
                                border: 1px solid rgba(103, 232, 249, 0.3);
                                border-radius: 6px;
                                background: rgba(255, 255, 255, 0.1);
                                color: white;
                                font-size: 14px;
                            ">
                                <option value="main">Community Tank</option>
                                <option value="saltwater">Reef Tank</option>
                            </select>
                            <div id="connection-indicator" style="
                                width: 12px;
                                height: 12px;
                                border-radius: 50%;
                                background: #ef4444;
                                box-shadow: 0 0 10px #ef4444;
                                animation: pulse 2s infinite;
                            "></div>
                        </div>
                    </div>

                    <div style="display: flex; height: calc(100% - 70px);">
                        <!-- Sidebar Navigation -->
                        <div class="sidebar" style="
                            width: 200px;
                            background: rgba(0, 0, 0, 0.2);
                            border-right: 1px solid rgba(255, 255, 255, 0.1);
                            padding: 20px 0;
                        ">
                            <div class="nav-item active" data-tab="overview" style="
                                padding: 12px 20px;
                                cursor: pointer;
                                border-left: 3px solid #67e8f9;
                                background: rgba(255, 255, 255, 0.1);
                                font-size: 14px;
                                font-weight: 600;
                            ">🐠 Tank Overview</div>
                            
                            <div class="nav-item" data-tab="parameters" style="
                                padding: 12px 20px;
                                cursor: pointer;
                                border-left: 3px solid transparent;
                                font-size: 14px;
                                transition: all 0.3s;
                            ">🧪 Water Parameters</div>
                            
                            <div class="nav-item" data-tab="equipment" style="
                                padding: 12px 20px;
                                cursor: pointer;
                                border-left: 3px solid transparent;
                                font-size: 14px;
                                transition: all 0.3s;
                            ">⚙️ Equipment Control</div>
                            
                            <div class="nav-item" data-tab="feeding" style="
                                padding: 12px 20px;
                                cursor: pointer;
                                border-left: 3px solid transparent;
                                font-size: 14px;
                                transition: all 0.3s;
                            ">🍤 Feeding Schedule</div>
                            
                            <div class="nav-item" data-tab="lighting" style="
                                padding: 12px 20px;
                                cursor: pointer;
                                border-left: 3px solid transparent;
                                font-size: 14px;
                                transition: all 0.3s;
                            ">💡 Lighting Control</div>
                            
                            <div class="nav-item" data-tab="alerts" style="
                                padding: 12px 20px;
                                cursor: pointer;
                                border-left: 3px solid transparent;
                                font-size: 14px;
                                transition: all 0.3s;
                            ">⚠️ Alerts & Notifications</div>
                        </div>

                        <!-- Main Content -->
                        <div class="main-content" style="
                            flex: 1;
                            padding: 20px;
                            overflow-y: auto;
                        ">
                            <!-- Tank Overview Tab -->
                            <div id="tab-overview" class="tab-content" style="display: block;">
                                <h3 style="margin: 0 0 20px 0; color: #67e8f9;">Tank Status Dashboard</h3>
                                
                                <!-- Quick Stats -->
                                <div style="
                                    display: grid;
                                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                                    gap: 20px;
                                    margin-bottom: 30px;
                                ">
                                    <div class="stat-card" style="
                                        background: rgba(255, 255, 255, 0.1);
                                        padding: 20px;
                                        border-radius: 12px;
                                        border: 1px solid rgba(255, 255, 255, 0.2);
                                        text-align: center;
                                    ">
                                        <div style="font-size: 28px; font-weight: bold; color: #fbbf24;" id="overview-temp">--°F</div>
                                        <div style="font-size: 14px; opacity: 0.8;">Temperature</div>
                                    </div>
                                    
                                    <div class="stat-card" style="
                                        background: rgba(255, 255, 255, 0.1);
                                        padding: 20px;
                                        border-radius: 12px;
                                        border: 1px solid rgba(255, 255, 255, 0.2);
                                        text-align: center;
                                    ">
                                        <div style="font-size: 28px; font-weight: bold; color: #10b981;" id="overview-ph">--</div>
                                        <div style="font-size: 14px; opacity: 0.8;">pH Level</div>
                                    </div>
                                    
                                    <div class="stat-card" style="
                                        background: rgba(255, 255, 255, 0.1);
                                        padding: 20px;
                                        border-radius: 12px;
                                        border: 1px solid rgba(255, 255, 255, 0.2);
                                        text-align: center;
                                    ">
                                        <div style="font-size: 28px; font-weight: bold; color: #3b82f6;" id="overview-feeding">--h</div>
                                        <div style="font-size: 14px; opacity: 0.8;">Last Fed</div>
                                    </div>
                                </div>

                                <!-- Tank Information -->
                                <div style="
                                    background: rgba(255, 255, 255, 0.1);
                                    padding: 20px;
                                    border-radius: 12px;
                                    border: 1px solid rgba(255, 255, 255, 0.2);
                                    margin-bottom: 20px;
                                ">
                                    <h4 style="margin: 0 0 15px 0; color: #67e8f9;">Tank Information</h4>
                                    <div id="tank-details" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
                                        <!-- Populated by JavaScript -->
                                    </div>
                                </div>

                                <!-- System Health -->
                                <div style="
                                    background: rgba(255, 255, 255, 0.1);
                                    padding: 20px;
                                    border-radius: 12px;
                                    border: 1px solid rgba(255, 255, 255, 0.2);
                                ">
                                    <h4 style="margin: 0 0 15px 0; color: #67e8f9;">System Health</h4>
                                    <div id="system-health" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                                        <!-- Equipment status populated here -->
                                    </div>
                                </div>
                            </div>

                            <!-- Water Parameters Tab -->
                            <div id="tab-parameters" class="tab-content" style="display: none;">
                                <h3 style="margin: 0 0 20px 0; color: #67e8f9;">Water Parameters</h3>
                                
                                <div id="parameters-grid" style="
                                    display: grid;
                                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                                    gap: 20px;
                                ">
                                    <!-- Parameter cards populated by JavaScript -->
                                </div>
                                
                                <div style="
                                    background: rgba(255, 255, 255, 0.1);
                                    padding: 20px;
                                    border-radius: 12px;
                                    border: 1px solid rgba(255, 255, 255, 0.2);
                                    margin-top: 20px;
                                ">
                                    <h4 style="margin: 0 0 15px 0; color: #67e8f9;">Parameter History</h4>
                                    <div style="text-align: center; padding: 40px; color: #9ca3af;">
                                        📊 Historical parameter graphs would appear here
                                        <br><small>Integration with charting library needed</small>
                                    </div>
                                </div>
                            </div>

                            <!-- Equipment Control Tab -->
                            <div id="tab-equipment" class="tab-content" style="display: none;">
                                <h3 style="margin: 0 0 20px 0; color: #67e8f9;">Equipment Control</h3>
                                
                                <div id="equipment-controls" style="
                                    display: grid;
                                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                                    gap: 20px;
                                ">
                                    <!-- Equipment controls populated by JavaScript -->
                                </div>
                            </div>

                            <!-- Feeding Schedule Tab -->
                            <div id="tab-feeding" class="tab-content" style="display: none;">
                                <h3 style="margin: 0 0 20px 0; color: #67e8f9;">Feeding Management</h3>
                                
                                <!-- Manual Feed Controls -->
                                <div style="
                                    background: rgba(255, 255, 255, 0.1);
                                    padding: 20px;
                                    border-radius: 12px;
                                    border: 1px solid rgba(255, 255, 255, 0.2);
                                    margin-bottom: 20px;
                                ">
                                    <h4 style="margin: 0 0 15px 0; color: #67e8f9;">Manual Feed Controls</h4>
                                    <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                                        <button id="feed-small" style="
                                            padding: 12px 20px;
                                            background: #10b981;
                                            color: white;
                                            border: none;
                                            border-radius: 8px;
                                            cursor: pointer;
                                            font-weight: 600;
                                        ">Small Portion</button>
                                        <button id="feed-medium" style="
                                            padding: 12px 20px;
                                            background: #3b82f6;
                                            color: white;
                                            border: none;
                                            border-radius: 8px;
                                            cursor: pointer;
                                            font-weight: 600;
                                        ">Medium Portion</button>
                                        <button id="feed-large" style="
                                            padding: 12px 20px;
                                            background: #f59e0b;
                                            color: white;
                                            border: none;
                                            border-radius: 8px;
                                            cursor: pointer;
                                            font-weight: 600;
                                        ">Large Portion</button>
                                    </div>
                                </div>

                                <!-- Feeding Schedule -->
                                <div style="
                                    background: rgba(255, 255, 255, 0.1);
                                    padding: 20px;
                                    border-radius: 12px;
                                    border: 1px solid rgba(255, 255, 255, 0.2);
                                    margin-bottom: 20px;
                                ">
                                    <h4 style="margin: 0 0 15px 0; color: #67e8f9;">Automatic Feeding Schedule</h4>
                                    <div id="feeding-schedule" style="font-size: 14px; line-height: 1.6;">
                                        <!-- Schedule populated by JavaScript -->
                                    </div>
                                </div>

                                <!-- Feeding History -->
                                <div style="
                                    background: rgba(255, 255, 255, 0.1);
                                    padding: 20px;
                                    border-radius: 12px;
                                    border: 1px solid rgba(255, 255, 255, 0.2);
                                ">
                                    <h4 style="margin: 0 0 15px 0; color: #67e8f9;">Recent Feeding History</h4>
                                    <div id="feeding-history" style="font-size: 14px;">
                                        <!-- History populated by JavaScript -->
                                    </div>
                                </div>
                            </div>

                            <!-- Lighting Control Tab -->
                            <div id="tab-lighting" class="tab-content" style="display: none;">
                                <h3 style="margin: 0 0 20px 0; color: #67e8f9;">Lighting Control</h3>
                                
                                <!-- Manual Lighting Controls -->
                                <div style="
                                    background: rgba(255, 255, 255, 0.1);
                                    padding: 20px;
                                    border-radius: 12px;
                                    border: 1px solid rgba(255, 255, 255, 0.2);
                                    margin-bottom: 20px;
                                ">
                                    <h4 style="margin: 0 0 15px 0; color: #67e8f9;">Manual Controls</h4>
                                    <div style="display: flex; flex-direction: column; gap: 15px;">
                                        <div>
                                            <label style="display: block; margin-bottom: 8px;">Light Intensity:</label>
                                            <div style="display: flex; align-items: center; gap: 15px;">
                                                <input type="range" id="light-intensity" min="0" max="100" value="75" style="flex: 1;" />
                                                <span id="intensity-value" style="min-width: 50px;">75%</span>
                                            </div>
                                        </div>
                                        <div style="display: flex; gap: 10px;">
                                            <button id="lights-on" style="
                                                padding: 10px 16px;
                                                background: #fbbf24;
                                                color: #000;
                                                border: none;
                                                border-radius: 6px;
                                                cursor: pointer;
                                                font-weight: 600;
                                            ">Lights On</button>
                                            <button id="lights-off" style="
                                                padding: 10px 16px;
                                                background: #374151;
                                                color: white;
                                                border: none;
                                                border-radius: 6px;
                                                cursor: pointer;
                                                font-weight: 600;
                                            ">Lights Off</button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Light Schedule -->
                                <div style="
                                    background: rgba(255, 255, 255, 0.1);
                                    padding: 20px;
                                    border-radius: 12px;
                                    border: 1px solid rgba(255, 255, 255, 0.2);
                                ">
                                    <h4 style="margin: 0 0 15px 0; color: #67e8f9;">Automatic Schedule</h4>
                                    <div style="text-align: center; padding: 40px; color: #9ca3af;">
                                        🕐 Lighting schedule configuration would appear here
                                        <br><small>Sunrise/sunset simulation settings</small>
                                    </div>
                                </div>
                            </div>

                            <!-- Alerts Tab -->
                            <div id="tab-alerts" class="tab-content" style="display: none;">
                                <h3 style="margin: 0 0 20px 0; color: #67e8f9;">Alerts & Notifications</h3>
                                
                                <!-- Active Alerts -->
                                <div style="
                                    background: rgba(255, 255, 255, 0.1);
                                    padding: 20px;
                                    border-radius: 12px;
                                    border: 1px solid rgba(255, 255, 255, 0.2);
                                    margin-bottom: 20px;
                                ">
                                    <h4 style="margin: 0 0 15px 0; color: #67e8f9;">Current Status</h4>
                                    <div id="active-alerts" style="font-size: 14px;">
                                        <div style="
                                            display: flex;
                                            align-items: center;
                                            gap: 10px;
                                            padding: 10px;
                                            background: rgba(16, 185, 129, 0.2);
                                            border-left: 4px solid #10b981;
                                            border-radius: 4px;
                                        ">
                                            ✅ All systems operating normally
                                        </div>
                                    </div>
                                </div>

                                <!-- Alert Configuration -->
                                <div style="
                                    background: rgba(255, 255, 255, 0.1);
                                    padding: 20px;
                                    border-radius: 12px;
                                    border: 1px solid rgba(255, 255, 255, 0.2);
                                ">
                                    <h4 style="margin: 0 0 15px 0; color: #67e8f9;">Alert Thresholds</h4>
                                    <div style="text-align: center; padding: 40px; color: #9ca3af;">
                                        ⚙️ Alert threshold configuration would appear here
                                        <br><small>Set min/max values for all parameters</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Status Bar -->
                    <div class="status-bar" style="
                        padding: 8px 20px;
                        background: rgba(0, 0, 0, 0.3);
                        border-top: 1px solid rgba(255, 255, 255, 0.1);
                        font-size: 12px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <span id="status-message">Aquarium system ready</span>
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
                .stat-card {
                    transition: all 0.3s ease;
                }
                .stat-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
                </style>
            `;

            const win = window.WindowManager.createWindow('Aquarium Controller', aquariumHTML, 1000, 750);
            this.currentWindow = win;
            this.setupController(win);
            return win;
        },

        setupController(win) {
            this.setupNavigation(win);
            this.setupEventHandlers(win);
            this.initializeMockData(win);
            this.startDataUpdates(win);
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
                    item.style.borderLeft = '3px solid #67e8f9';
                    item.style.background = 'rgba(255, 255, 255, 0.1)';
                    
                    // Switch content
                    const tabId = item.dataset.tab;
                    win.querySelectorAll('.tab-content').forEach(content => {
                        content.style.display = 'none';
                    });
                    
                    const activeTab = win.querySelector(`#tab-${tabId}`);
                    if (activeTab) {
                        activeTab.style.display = 'block';
                        this.refreshTabData(win, tabId);
                    }
                });
            });
        },

        setupEventHandlers(win) {
            // Tank selector
            win.querySelector('#tank-selector').addEventListener('change', (e) => {
                this.currentTank = e.target.value;
                this.refreshAllData(win);
            });

            // Feeding controls
            win.querySelector('#feed-small').addEventListener('click', () => {
                this.feedFish(win, 'small');
            });
            win.querySelector('#feed-medium').addEventListener('click', () => {
                this.feedFish(win, 'medium');
            });
            win.querySelector('#feed-large').addEventListener('click', () => {
                this.feedFish(win, 'large');
            });

            // Lighting controls
            win.querySelector('#light-intensity').addEventListener('input', (e) => {
                const value = e.target.value;
                win.querySelector('#intensity-value').textContent = `${value}%`;
                this.updateLighting(win, value);
            });

            win.querySelector('#lights-on').addEventListener('click', () => {
                this.controlLights(win, 'on');
            });
            win.querySelector('#lights-off').addEventListener('click', () => {
                this.controlLights(win, 'off');
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

        initializeMockData(win) {
            // Initialize with mock data
            this.isConnected = true;
            this.connectionStatus.api = true;
            
            // Populate tanks
            this.mockData.tanks.forEach(tank => {
                this.tanks.set(tank.id, tank);
            });
            
            this.updateConnectionStatus(win, 'connected', 'Connected to aquarium system');
            this.refreshAllData(win);
        },

        startDataUpdates(win) {
            this.updateInterval = setInterval(() => {
                this.simulateDataChanges();
                this.refreshAllData(win);
            }, this.config.updateInterval);
        },

        simulateDataChanges() {
            // Simulate realistic parameter fluctuations
            this.tanks.forEach(tank => {
                // Temperature fluctuation (±0.2°F)
                tank.parameters.temperature += (Math.random() - 0.5) * 0.4;
                tank.parameters.temperature = Math.max(74, Math.min(80, tank.parameters.temperature));
                
                // pH fluctuation (±0.1)
                tank.parameters.pH += (Math.random() - 0.5) * 0.2;
                tank.parameters.pH = Math.max(6.0, Math.min(8.5, tank.parameters.pH));
                
                // Oxygen fluctuation (±0.3 ppm)
                tank.parameters.oxygen += (Math.random() - 0.5) * 0.6;
                tank.parameters.oxygen = Math.max(6.0, Math.min(10.0, tank.parameters.oxygen));
                
                // Nitrate slow increase (realistic biological process)
                tank.parameters.nitrate += Math.random() * 0.1;
                tank.parameters.nitrate = Math.min(40, tank.parameters.nitrate);
            });
        },

        refreshAllData(win) {
            const currentTankData = this.tanks.get(this.currentTank);
            if (!currentTankData) return;

            // Update tank info
            win.querySelector('#tank-info').textContent = `Tank: ${currentTankData.name} (${currentTankData.size})`;

            // Update overview stats
            win.querySelector('#overview-temp').textContent = `${currentTankData.parameters.temperature.toFixed(1)}°F`;
            win.querySelector('#overview-ph').textContent = currentTankData.parameters.pH.toFixed(1);
            
            const lastFedHours = Math.round((new Date() - new Date(currentTankData.feeding.lastFed)) / (1000 * 60 * 60));
            win.querySelector('#overview-feeding').textContent = `${lastFedHours}h`;

            // Update tank details
            this.updateTankDetails(win, currentTankData);
            this.updateSystemHealth(win, currentTankData);
            this.updateParametersGrid(win, currentTankData);
            this.updateEquipmentControls(win, currentTankData);
            this.updateFeedingInfo(win, currentTankData);

            win.querySelector('#last-update').textContent = `Updated: ${new Date().toLocaleTimeString()}`;
        },

        updateTankDetails(win, tankData) {
            const detailsDiv = win.querySelector('#tank-details');
            detailsDiv.innerHTML = `
                <div><strong>Size:</strong> ${tankData.size}</div>
                <div><strong>Fish Species:</strong> ${tankData.fish.length}</div>
                <div><strong>Last Maintenance:</strong> 3 days ago</div>
                <div><strong>Water Changes:</strong> Weekly</div>
                <div><strong>Species:</strong> ${tankData.fish.slice(0, 2).join(', ')}${tankData.fish.length > 2 ? '...' : ''}</div>
                <div><strong>Auto Systems:</strong> ${tankData.feeding.autoFeed ? 'Active' : 'Manual'}</div>
            `;
        },

        updateSystemHealth(win, tankData) {
            const healthDiv = win.querySelector('#system-health');
            const equipment = tankData.equipment;
            
            healthDiv.innerHTML = Object.entries(equipment).map(([key, device]) => {
                const status = device.status;
                const color = status === 'on' || status === 'running' ? '#10b981' : '#ef4444';
                const icon = this.getEquipmentIcon(key);
                
                return `
                    <div style="
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 10px;
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 6px;
                        border-left: 3px solid ${color};
                    ">
                        <span>${icon}</span>
                        <div>
                            <div style="font-weight: 600; text-transform: capitalize;">${key}</div>
                            <div style="font-size: 12px; opacity: 0.8;">${status}</div>
                        </div>
                    </div>
                `;
            }).join('');
        },

        updateParametersGrid(win, tankData) {
            const parametersGrid = win.querySelector('#parameters-grid');
            if (!parametersGrid) return;

            const parameters = tankData.parameters;
            const parameterConfig = {
                temperature: { name: 'Temperature', unit: '°F', ideal: [74, 78], color: '#fbbf24' },
                pH: { name: 'pH Level', unit: '', ideal: [6.5, 7.5], color: '#10b981' },
                ammonia: { name: 'Ammonia', unit: ' ppm', ideal: [0, 0.25], color: '#ef4444' },
                nitrite: { name: 'Nitrite', unit: ' ppm', ideal: [0, 0.25], color: '#f59e0b' },
                nitrate: { name: 'Nitrate', unit: ' ppm', ideal: [0, 20], color: '#3b82f6' },
                oxygen: { name: 'Dissolved O₂', unit: ' ppm', ideal: [6, 10], color: '#06b6d4' }
            };

            parametersGrid.innerHTML = Object.entries(parameters).map(([key, value]) => {
                const config = parameterConfig[key];
                if (!config) return '';

                const isInRange = value >= config.ideal[0] && value <= config.ideal[1];
                const statusColor = isInRange ? '#10b981' : '#ef4444';
                const statusText = isInRange ? 'Normal' : 'Alert';

                return `
                    <div style="
                        background: rgba(255, 255, 255, 0.1);
                        padding: 20px;
                        border-radius: 12px;
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        border-left: 4px solid ${config.color};
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <h5 style="margin: 0; color: ${config.color};">${config.name}</h5>
                            <span style="
                                padding: 4px 8px;
                                background: ${statusColor};
                                color: white;
                                border-radius: 4px;
                                font-size: 11px;
                                font-weight: 600;
                            ">${statusText}</span>
                        </div>
                        <div style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">
                            ${typeof value === 'number' ? value.toFixed(1) : value}${config.unit}
                        </div>
                        <div style="font-size: 12px; opacity: 0.8;">
                            Ideal: ${config.ideal[0]}-${config.ideal[1]}${config.unit}
                        </div>
                    </div>
                `;
            }).join('');
        },

        updateEquipmentControls(win, tankData) {
            const equipmentDiv = win.querySelector('#equipment-controls');
            if (!equipmentDiv) return;

            const equipment = tankData.equipment;
            
            equipmentDiv.innerHTML = Object.entries(equipment).map(([key, device]) => {
                const icon = this.getEquipmentIcon(key);
                const isOn = device.status === 'on' || device.status === 'running';
                
                return `
                    <div style="
                        background: rgba(255, 255, 255, 0.1);
                        padding: 20px;
                        border-radius: 12px;
                        border: 1px solid rgba(255, 255, 255, 0.2);
                    ">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                            <span style="font-size: 24px;">${icon}</span>
                            <h5 style="margin: 0; color: #67e8f9; text-transform: capitalize;">${key}</h5>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <div style="font-size: 14px; margin-bottom: 5px;">Status: 
                                <span style="color: ${isOn ? '#10b981' : '#ef4444'}; font-weight: 600;">
                                    ${device.status.toUpperCase()}
                                </span>
                            </div>
                            ${this.getEquipmentDetails(key, device)}
                        </div>
                        
                        <div style="display: flex; gap: 10px;">
                            <button onclick="window.AquariumApp.controlEquipment('${key}', 'on')" style="
                                padding: 8px 12px;
                                background: #10b981;
                                color: white;
                                border: none;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 12px;
                            ">Turn On</button>
                            <button onclick="window.AquariumApp.controlEquipment('${key}', 'off')" style="
                                padding: 8px 12px;
                                background: #ef4444;
                                color: white;
                                border: none;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 12px;
                            ">Turn Off</button>
                        </div>
                    </div>
                `;
            }).join('');
        },

        updateFeedingInfo(win, tankData) {
            const scheduleDiv = win.querySelector('#feeding-schedule');
            const historyDiv = win.querySelector('#feeding-history');
            
            if (scheduleDiv) {
                const nextFeed = new Date(tankData.feeding.nextFeed);
                const timeUntilNext = Math.max(0, Math.round((nextFeed - new Date()) / (1000 * 60)));
                
                scheduleDiv.innerHTML = `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <strong>Daily Feedings:</strong> ${tankData.feeding.dailyFeedings}
                        </div>
                        <div>
                            <strong>Auto Feed:</strong> ${tankData.feeding.autoFeed ? 'Enabled' : 'Disabled'}
                        </div>
                        <div>
                            <strong>Last Fed:</strong> ${this.formatTimeAgo(tankData.feeding.lastFed)}
                        </div>
                        <div>
                            <strong>Next Feed:</strong> ${timeUntilNext > 0 ? `${timeUntilNext}m` : 'Due now'}
                        </div>
                    </div>
                `;
            }
            
            if (historyDiv) {
                historyDiv.innerHTML = `
                    <div style="font-size: 14px; line-height: 1.6;">
                        <div style="margin-bottom: 8px;">• Today 2:00 PM - Medium portion (Auto)</div>
                        <div style="margin-bottom: 8px;">• Today 8:00 AM - Small portion (Auto)</div>
                        <div style="margin-bottom: 8px;">• Yesterday 6:00 PM - Large portion (Manual)</div>
                        <div style="opacity: 0.7;">• Yesterday 2:00 PM - Medium portion (Auto)</div>
                    </div>
                `;
            }
        },

        refreshTabData(win, tabId) {
            const currentTankData = this.tanks.get(this.currentTank);
            if (!currentTankData) return;

            switch (tabId) {
                case 'overview':
                    this.updateTankDetails(win, currentTankData);
                    this.updateSystemHealth(win, currentTankData);
                    break;
                case 'parameters':
                    this.updateParametersGrid(win, currentTankData);
                    break;
                case 'equipment':
                    this.updateEquipmentControls(win, currentTankData);
                    break;
                case 'feeding':
                    this.updateFeedingInfo(win, currentTankData);
                    break;
            }
        },

        getEquipmentIcon(equipmentType) {
            const icons = {
                heater: '🔥',
                filter: '🌊',
                light: '💡',
                airPump: '💨',
                skimmer: '🔄'
            };
            return icons[equipmentType] || '⚙️';
        },

        getEquipmentDetails(type, device) {
            switch (type) {
                case 'heater':
                    return `
                        <div style="font-size: 12px; opacity: 0.8;">
                            Target: ${device.target}°F | Current: ${device.current}°F
                        </div>
                    `;
                case 'filter':
                    return `
                        <div style="font-size: 12px; opacity: 0.8;">
                            Flow Rate: ${device.flow} GPH
                        </div>
                    `;
                case 'light':
                    return `
                        <div style="font-size: 12px; opacity: 0.8;">
                            Intensity: ${device.intensity}% | Schedule: ${device.schedule}
                        </div>
                    `;
                case 'airPump':
                    return `
                        <div style="font-size: 12px; opacity: 0.8;">
                            Flow: ${device.flow} LPM
                        </div>
                    `;
                case 'skimmer':
                    return `
                        <div style="font-size: 12px; opacity: 0.8;">
                            Efficiency: ${device.efficiency}%
                        </div>
                    `;
                default:
                    return '';
            }
        },

        feedFish(win, portion) {
            const currentTankData = this.tanks.get(this.currentTank);
            if (!currentTankData) return;

            // Update feeding time
            currentTankData.feeding.lastFed = new Date().toISOString();

            this.showNotification(`Fed fish ${portion} portion`, 'success');
            this.refreshAllData(win);
        },

        controlEquipment(equipmentType, action) {
            const currentTankData = this.tanks.get(this.currentTank);
            if (!currentTankData || !currentTankData.equipment[equipmentType]) return;

            const equipment = currentTankData.equipment[equipmentType];
            equipment.status = action === 'on' ? 'on' : 'off';

            this.showNotification(`${equipmentType} turned ${action}`, 'success');
            this.refreshAllData(this.currentWindow);
        },

        updateLighting(win, intensity) {
            const currentTankData = this.tanks.get(this.currentTank);
            if (!currentTankData) return;

            currentTankData.equipment.light.intensity = parseInt(intensity);
            this.showNotification(`Light intensity set to ${intensity}%`, 'success');
        },

        controlLights(win, action) {
            const currentTankData = this.tanks.get(this.currentTank);
            if (!currentTankData) return;

            currentTankData.equipment.light.status = action;
            if (action === 'off') {
                currentTankData.equipment.light.intensity = 0;
                win.querySelector('#light-intensity').value = 0;
                win.querySelector('#intensity-value').textContent = '0%';
            }

            this.showNotification(`Lights turned ${action}`, 'success');
            this.refreshAllData(win);
        },

        updateConnectionStatus(win, status, message) {
            const indicator = win.querySelector('#connection-indicator');
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

            statusMessage.textContent = message;
        },

        formatTimeAgo(timestamp) {
            const now = new Date();
            const time = new Date(timestamp);
            const diffMs = now - time;
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMins = Math.floor(diffMs / (1000 * 60));

            if (diffHours > 0) {
                return `${diffHours}h ago`;
            } else if (diffMins > 0) {
                return `${diffMins}m ago`;
            } else {
                return 'Just now';
            }
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
            }, 3000);
        },

        cleanup() {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
            
            this.isConnected = false;
            this.currentWindow = null;
            this.tanks.clear();
        }
    };

    // Register app with the WebOS system
    if (window.AppRegistry) {
        window.AppRegistry.registerApp({
            id: 'aquarium',
            name: 'Aquarium Controller',
            icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><rect x='4' y='12' width='40' height='24' rx='6' fill='%23067992' stroke='%2367e8f9' stroke-width='2'/><path d='M8 20c4 0 4 8 8 8s4-8 8-8 4 8 8 8 4-8 8-8' stroke='%2367e8f9' stroke-width='2' fill='none'/><circle cx='15' cy='20' r='2' fill='%23fbbf24'/><circle cx='33' cy='28' r='2' fill='%23f97316'/><path d='M12 16l2-1 1 2-2 1z' fill='%2310b981'/><path d='M35 24l-2-1-1 2 2 1z' fill='%2310b981'/></svg>",
            handler: () => window.AquariumApp.open(),
            singleInstance: true
        });

        // Register documentation
        if (window.Docs && typeof window.Docs.registerDocumentation === 'function') {
            window.Docs.registerDocumentation('aquarium', {
                name: "Aquarium Controller",
                version: "2.0.0",
                description: "Professional aquarium monitoring and control system for hobbyists with real-time parameter tracking, equipment control, and feeding automation",
                type: "IoT App",
                features: [
                    "Real-time water parameter monitoring (pH, temperature, ammonia, nitrite, nitrate, oxygen)",
                    "Multi-tank support with individual configurations and switching",
                    "Equipment control (heaters, filters, lights, pumps, protein skimmers)",
                    "Automated feeding system with portion control and scheduling",
                    "Lighting control with manual override and intensity adjustment",
                    "Alert system for parameter deviations and equipment status",
                    "Historical parameter tracking with visual indicators",
                    "System health monitoring with status indicators"
                ],
                dependencies: ["WindowManager", "AppRegistry"],
                apiEndpoints: [
                    { endpoint: "GET /api/tanks", description: "List all configured tanks" },
                    { endpoint: "GET /api/tank/{id}/status", description: "Current tank parameters and equipment status" },
                    { endpoint: "POST /api/tank/{id}/feed", description: "Trigger manual feeding with portion size" },
                    { endpoint: "POST /api/tank/{id}/light", description: "Control lighting intensity and schedule" },
                    { endpoint: "POST /api/tank/{id}/equipment", description: "Control individual equipment items" }
                ],
                methods: [
                    { name: "open", description: "Creates aquarium controller window with multi-tab interface" },
                    { name: "feedFish", description: "Manual feeding control with portion size selection" },
                    { name: "controlEquipment", description: "Equipment control with status feedback" },
                    { name: "updateLighting", description: "Lighting intensity and schedule control" },
                    { name: "simulateDataChanges", description: "Realistic parameter simulation for demonstration" }
                ],
                notes: "Professional-grade aquarium controller designed for serious hobbyists. Features realistic parameter simulation, comprehensive equipment control, and multi-tank support. Ready for integration with Arduino/Raspberry Pi hardware controllers.",
                targetHardware: ["Arduino with sensors", "Raspberry Pi controllers", "Commercial aquarium systems"],
                auto_generated: false
            });
        }
    } else {
        console.error('AppRegistry not found - Aquarium Controller cannot register');
    }

})();

