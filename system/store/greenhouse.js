// greenhouse.js - Greenhouse Management Interface
/**
 * FILE: apps/greenhouse.js
 * VERSION: 1.0.0
 * BUILD DATE: 2025-09-28
 *
 * PURPOSE:
 *   Greenhouse environmental control and monitoring system for small to medium
 *   agricultural operations. Provides real-time monitoring and control of
 *   temperature, humidity, irrigation, and ventilation systems.
 *
 * FEATURES:
 *   - Real-time environmental monitoring
 *   - Equipment control (fans, heaters, irrigation, lights)
 *   - Alert system for critical conditions
 *   - Data logging and basic analytics
 *   - Schedule management for automated operations
 *
 * TARGET HARDWARE:
 *   Raspberry Pi + sensor modules, relay boards for equipment control
 *   Compatible with DHT22, DS18B20, soil moisture sensors
 *
 * API ENDPOINTS (Backend integration):
 *   GET  /api/greenhouse/sensors - Current sensor readings
 *   POST /api/greenhouse/control - Equipment control commands
 *   GET  /api/greenhouse/schedule - Current schedules
 *   POST /api/greenhouse/schedule - Update schedules
 */

(function() {
    window.GreenhouseApp = {
        isConnected: false,
        currentWindow: null,
        updateInterval: null,
        
        // Mock data for demonstration
        sensorData: {
            temperature: 22.5,
            humidity: 65,
            soilMoisture: 45,
            lightLevel: 75,
            co2Level: 400,
            lastUpdate: new Date()
        },
        
        equipmentStatus: {
            ventFan: false,
            heater: false,
            irrigation: false,
            growLights: true,
            co2Generator: false
        },
        
        thresholds: {
            tempMin: 18,
            tempMax: 28,
            humidityMin: 60,
            humidityMax: 80,
            soilMoistureMin: 40
        },

        open() {
            const greenhouseHTML = `
                <div class="greenhouse-app" style="
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    font-family: 'Segoe UI', sans-serif;
                    background: linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%);
                    color: white;
                ">
                    <!-- Header -->
                    <div class="greenhouse-header" style="
                        padding: 16px 20px;
                        background: rgba(255, 255, 255, 0.1);
                        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                        backdrop-filter: blur(10px);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <div>
                            <h2 style="margin: 0; font-size: 20px;">Greenhouse Control</h2>
                            <div style="font-size: 12px; opacity: 0.8;" id="last-update">Last update: --:--:--</div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div id="alert-indicator" style="
                                width: 12px;
                                height: 12px;
                                border-radius: 50%;
                                background: #10b981;
                                box-shadow: 0 0 10px #10b981;
                            "></div>
                            <span style="font-size: 12px;" id="system-status">All systems normal</span>
                        </div>
                    </div>

                    <!-- Main Content -->
                    <div style="flex: 1; overflow-y: auto; padding: 20px;">
                        
                        <!-- Environmental Sensors Grid -->
                        <div style="margin-bottom: 30px;">
                            <h3 style="margin: 0 0 15px 0; color: #fef3c7;">Environmental Conditions</h3>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                                
                                <div class="sensor-card" style="
                                    background: rgba(255, 255, 255, 0.1);
                                    padding: 15px;
                                    border-radius: 10px;
                                    border: 1px solid rgba(255, 255, 255, 0.2);
                                    text-align: center;
                                ">
                                    <div style="font-size: 32px; margin-bottom: 8px;">🌡️</div>
                                    <div style="font-size: 24px; font-weight: bold;" id="temp-reading">22.5°C</div>
                                    <div style="font-size: 12px; opacity: 0.8;">Temperature</div>
                                    <div style="font-size: 10px; margin-top: 4px;" id="temp-status">Normal</div>
                                </div>

                                <div class="sensor-card" style="
                                    background: rgba(255, 255, 255, 0.1);
                                    padding: 15px;
                                    border-radius: 10px;
                                    border: 1px solid rgba(255, 255, 255, 0.2);
                                    text-align: center;
                                ">
                                    <div style="font-size: 32px; margin-bottom: 8px;">💧</div>
                                    <div style="font-size: 24px; font-weight: bold;" id="humidity-reading">65%</div>
                                    <div style="font-size: 12px; opacity: 0.8;">Humidity</div>
                                    <div style="font-size: 10px; margin-top: 4px;" id="humidity-status">Normal</div>
                                </div>

                                <div class="sensor-card" style="
                                    background: rgba(255, 255, 255, 0.1);
                                    padding: 15px;
                                    border-radius: 10px;
                                    border: 1px solid rgba(255, 255, 255, 0.2);
                                    text-align: center;
                                ">
                                    <div style="font-size: 32px; margin-bottom: 8px;">🌱</div>
                                    <div style="font-size: 24px; font-weight: bold;" id="soil-reading">45%</div>
                                    <div style="font-size: 12px; opacity: 0.8;">Soil Moisture</div>
                                    <div style="font-size: 10px; margin-top: 4px;" id="soil-status">Normal</div>
                                </div>

                                <div class="sensor-card" style="
                                    background: rgba(255, 255, 255, 0.1);
                                    padding: 15px;
                                    border-radius: 10px;
                                    border: 1px solid rgba(255, 255, 255, 0.2);
                                    text-align: center;
                                ">
                                    <div style="font-size: 32px; margin-bottom: 8px;">☀️</div>
                                    <div style="font-size: 24px; font-weight: bold;" id="light-reading">75%</div>
                                    <div style="font-size: 12px; opacity: 0.8;">Light Level</div>
                                    <div style="font-size: 10px; margin-top: 4px;" id="light-status">Good</div>
                                </div>
                            </div>
                        </div>

                        <!-- Equipment Controls -->
                        <div style="margin-bottom: 30px;">
                            <h3 style="margin: 0 0 15px 0; color: #fef3c7;">Equipment Control</h3>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                                
                                <div class="equipment-control" style="
                                    background: rgba(255, 255, 255, 0.1);
                                    padding: 15px;
                                    border-radius: 10px;
                                    border: 1px solid rgba(255, 255, 255, 0.2);
                                ">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                        <span style="font-weight: 600;">🌀 Ventilation Fan</span>
                                        <div class="status-indicator" id="fan-indicator" style="
                                            width: 12px;
                                            height: 12px;
                                            border-radius: 50%;
                                            background: #ef4444;
                                        "></div>
                                    </div>
                                    <button class="control-btn" data-equipment="ventFan" style="
                                        width: 100%;
                                        padding: 10px;
                                        border: 1px solid rgba(255, 255, 255, 0.3);
                                        background: rgba(255, 255, 255, 0.1);
                                        color: white;
                                        border-radius: 6px;
                                        cursor: pointer;
                                        font-weight: 600;
                                    ">Turn ON</button>
                                </div>

                                <div class="equipment-control" style="
                                    background: rgba(255, 255, 255, 0.1);
                                    padding: 15px;
                                    border-radius: 10px;
                                    border: 1px solid rgba(255, 255, 255, 0.2);
                                ">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                        <span style="font-weight: 600;">🔥 Heater</span>
                                        <div class="status-indicator" id="heater-indicator" style="
                                            width: 12px;
                                            height: 12px;
                                            border-radius: 50%;
                                            background: #ef4444;
                                        "></div>
                                    </div>
                                    <button class="control-btn" data-equipment="heater" style="
                                        width: 100%;
                                        padding: 10px;
                                        border: 1px solid rgba(255, 255, 255, 0.3);
                                        background: rgba(255, 255, 255, 0.1);
                                        color: white;
                                        border-radius: 6px;
                                        cursor: pointer;
                                        font-weight: 600;
                                    ">Turn ON</button>
                                </div>

                                <div class="equipment-control" style="
                                    background: rgba(255, 255, 255, 0.1);
                                    padding: 15px;
                                    border-radius: 10px;
                                    border: 1px solid rgba(255, 255, 255, 0.2);
                                ">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                        <span style="font-weight: 600;">💦 Irrigation</span>
                                        <div class="status-indicator" id="irrigation-indicator" style="
                                            width: 12px;
                                            height: 12px;
                                            border-radius: 50%;
                                            background: #ef4444;
                                        "></div>
                                    </div>
                                    <button class="control-btn" data-equipment="irrigation" style="
                                        width: 100%;
                                        padding: 10px;
                                        border: 1px solid rgba(255, 255, 255, 0.3);
                                        background: rgba(255, 255, 255, 0.1);
                                        color: white;
                                        border-radius: 6px;
                                        cursor: pointer;
                                        font-weight: 600;
                                    ">Turn ON</button>
                                </div>

                                <div class="equipment-control" style="
                                    background: rgba(255, 255, 255, 0.1);
                                    padding: 15px;
                                    border-radius: 10px;
                                    border: 1px solid rgba(255, 255, 255, 0.2);
                                ">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                        <span style="font-weight: 600;">💡 Grow Lights</span>
                                        <div class="status-indicator" id="growLights-indicator" style="
                                            width: 12px;
                                            height: 12px;
                                            border-radius: 50%;
                                            background: #10b981;
                                        "></div>
                                    </div>
                                    <button class="control-btn" data-equipment="growLights" style="
                                        width: 100%;
                                        padding: 10px;
                                        border: 1px solid rgba(255, 255, 255, 0.3);
                                        background: rgba(255, 255, 255, 0.1);
                                        color: white;
                                        border-radius: 6px;
                                        cursor: pointer;
                                        font-weight: 600;
                                    ">Turn OFF</button>
                                </div>
                            </div>
                        </div>

                        <!-- Quick Actions -->
                        <div>
                            <h3 style="margin: 0 0 15px 0; color: #fef3c7;">Quick Actions</h3>
                            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                                <button class="quick-action-btn" data-action="emergency-vent" style="
                                    padding: 10px 16px;
                                    border: 1px solid #fbbf24;
                                    background: rgba(251, 191, 36, 0.2);
                                    color: #fbbf24;
                                    border-radius: 6px;
                                    cursor: pointer;
                                    font-weight: 600;
                                    font-size: 12px;
                                ">🚨 Emergency Ventilation</button>
                                
                                <button class="quick-action-btn" data-action="water-now" style="
                                    padding: 10px 16px;
                                    border: 1px solid #3b82f6;
                                    background: rgba(59, 130, 246, 0.2);
                                    color: #3b82f6;
                                    border-radius: 6px;
                                    cursor: pointer;
                                    font-weight: 600;
                                    font-size: 12px;
                                ">💧 Water Now (5min)</button>
                                
                                <button class="quick-action-btn" data-action="all-off" style="
                                    padding: 10px 16px;
                                    border: 1px solid #ef4444;
                                    background: rgba(239, 68, 68, 0.2);
                                    color: #ef4444;
                                    border-radius: 6px;
                                    cursor: pointer;
                                    font-weight: 600;
                                    font-size: 12px;
                                ">❌ All Equipment OFF</button>
                                
                                <button class="quick-action-btn" data-action="auto-mode" style="
                                    padding: 10px 16px;
                                    border: 1px solid #10b981;
                                    background: rgba(16, 185, 129, 0.2);
                                    color: #10b981;
                                    border-radius: 6px;
                                    cursor: pointer;
                                    font-weight: 600;
                                    font-size: 12px;
                                ">🤖 Auto Mode</button>
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
                        <span id="connection-status">Connected to greenhouse systems</span>
                        <span id="active-alerts">No active alerts</span>
                    </div>
                </div>
            `;

            const win = window.WindowManager.createWindow('Greenhouse Control', greenhouseHTML, 800, 700);
            this.currentWindow = win;
            this.setupGreenhouseControls(win);
            return win;
        },

        setupGreenhouseControls(win) {
            // Equipment control buttons
            win.querySelectorAll('.control-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const equipment = btn.dataset.equipment;
                    this.toggleEquipment(equipment, win);
                });
            });

            // Quick action buttons
            win.querySelectorAll('.quick-action-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.executeQuickAction(btn.dataset.action, win);
                });
            });

            // Start monitoring
            this.startMonitoring(win);
            
            // Initial update
            this.updateDisplay(win);
        },

        toggleEquipment(equipment, win) {
            // Toggle equipment state
            this.equipmentStatus[equipment] = !this.equipmentStatus[equipment];
            
            // In real implementation, send command to backend:
            // this.sendControlCommand(equipment, this.equipmentStatus[equipment]);
            
            this.updateEquipmentDisplay(win);
            this.showNotification(`${equipment} turned ${this.equipmentStatus[equipment] ? 'ON' : 'OFF'}`, 'success');
        },

        executeQuickAction(action, win) {
            switch (action) {
                case 'emergency-vent':
                    this.equipmentStatus.ventFan = true;
                    this.equipmentStatus.heater = false;
                    this.showNotification('Emergency ventilation activated!', 'warning');
                    break;
                
                case 'water-now':
                    this.equipmentStatus.irrigation = true;
                    setTimeout(() => {
                        this.equipmentStatus.irrigation = false;
                        this.updateEquipmentDisplay(win);
                        this.showNotification('5-minute watering completed', 'success');
                    }, 5000); // 5 seconds for demo, would be 5 minutes in real use
                    this.showNotification('Starting 5-minute watering cycle', 'info');
                    break;
                
                case 'all-off':
                    Object.keys(this.equipmentStatus).forEach(key => {
                        this.equipmentStatus[key] = false;
                    });
                    this.showNotification('All equipment turned OFF', 'warning');
                    break;
                
                case 'auto-mode':
                    this.autoControlMode(win);
                    this.showNotification('Auto mode activated', 'info');
                    break;
            }
            
            this.updateEquipmentDisplay(win);
        },

        autoControlMode(win) {
            // Simple auto control logic based on sensor readings
            const temp = this.sensorData.temperature;
            const humidity = this.sensorData.humidity;
            const soilMoisture = this.sensorData.soilMoisture;
            
            // Temperature control
            if (temp > this.thresholds.tempMax) {
                this.equipmentStatus.ventFan = true;
                this.equipmentStatus.heater = false;
            } else if (temp < this.thresholds.tempMin) {
                this.equipmentStatus.heater = true;
                this.equipmentStatus.ventFan = false;
            }
            
            // Humidity control
            if (humidity > this.thresholds.humidityMax) {
                this.equipmentStatus.ventFan = true;
            }
            
            // Soil moisture control
            if (soilMoisture < this.thresholds.soilMoistureMin) {
                this.equipmentStatus.irrigation = true;
            }
        },

        startMonitoring(win) {
            this.updateInterval = setInterval(() => {
                this.updateSensorData();
                this.updateDisplay(win);
                this.checkAlerts(win);
            }, 3000);

            // Cleanup on window close
            if (window.EventBus) {
                window.EventBus.on('window-closed', (data) => {
                    if (data.windowId === win.id) {
                        this.cleanup();
                    }
                });
            }
        },

        updateSensorData() {
            // Simulate changing sensor data
            this.sensorData.temperature += (Math.random() - 0.5) * 2;
            this.sensorData.temperature = Math.max(15, Math.min(35, this.sensorData.temperature));
            
            this.sensorData.humidity += (Math.random() - 0.5) * 10;
            this.sensorData.humidity = Math.max(30, Math.min(90, this.sensorData.humidity));
            
            this.sensorData.soilMoisture += (Math.random() - 0.5) * 5;
            this.sensorData.soilMoisture = Math.max(20, Math.min(80, this.sensorData.soilMoisture));
            
            this.sensorData.lastUpdate = new Date();
        },

        updateDisplay(win) {
            // Update sensor readings
            win.querySelector('#temp-reading').textContent = `${this.sensorData.temperature.toFixed(1)}°C`;
            win.querySelector('#humidity-reading').textContent = `${Math.round(this.sensorData.humidity)}%`;
            win.querySelector('#soil-reading').textContent = `${Math.round(this.sensorData.soilMoisture)}%`;
            win.querySelector('#light-reading').textContent = `${this.sensorData.lightLevel}%`;
            
            // Update sensor status
            this.updateSensorStatus(win);
            this.updateEquipmentDisplay(win);
            
            // Update timestamp
            win.querySelector('#last-update').textContent = 
                `Last update: ${this.sensorData.lastUpdate.toLocaleTimeString()}`;
        },

        updateSensorStatus(win) {
            const temp = this.sensorData.temperature;
            const humidity = this.sensorData.humidity;
            const soilMoisture = this.sensorData.soilMoisture;
            
            // Temperature status
            let tempStatus = 'Normal';
            if (temp < this.thresholds.tempMin) tempStatus = 'Low';
            else if (temp > this.thresholds.tempMax) tempStatus = 'High';
            win.querySelector('#temp-status').textContent = tempStatus;
            win.querySelector('#temp-status').style.color = tempStatus === 'Normal' ? '#10b981' : '#fbbf24';
            
            // Humidity status  
            let humidityStatus = 'Normal';
            if (humidity < this.thresholds.humidityMin) humidityStatus = 'Low';
            else if (humidity > this.thresholds.humidityMax) humidityStatus = 'High';
            win.querySelector('#humidity-status').textContent = humidityStatus;
            win.querySelector('#humidity-status').style.color = humidityStatus === 'Normal' ? '#10b981' : '#fbbf24';
            
            // Soil moisture status
            let soilStatus = soilMoisture < this.thresholds.soilMoistureMin ? 'Dry' : 'Good';
            win.querySelector('#soil-status').textContent = soilStatus;
            win.querySelector('#soil-status').style.color = soilStatus === 'Good' ? '#10b981' : '#fbbf24';
        },

        updateEquipmentDisplay(win) {
            Object.keys(this.equipmentStatus).forEach(equipment => {
                const indicator = win.querySelector(`#${equipment}-indicator`);
                const button = win.querySelector(`[data-equipment="${equipment}"]`);
                
                if (indicator && button) {
                    const isOn = this.equipmentStatus[equipment];
                    indicator.style.background = isOn ? '#10b981' : '#ef4444';
                    indicator.style.boxShadow = `0 0 10px ${isOn ? '#10b981' : '#ef4444'}`;
                    button.textContent = isOn ? 'Turn OFF' : 'Turn ON';
                    button.style.background = isOn ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)';
                }
            });
        },

        checkAlerts(win) {
            const alerts = [];
            const temp = this.sensorData.temperature;
            const humidity = this.sensorData.humidity;
            const soilMoisture = this.sensorData.soilMoisture;
            
            if (temp > this.thresholds.tempMax + 5) alerts.push('Critical: Temperature too high!');
            if (temp < this.thresholds.tempMin - 5) alerts.push('Critical: Temperature too low!');
            if (soilMoisture < 25) alerts.push('Warning: Soil very dry');
            
            const alertIndicator = win.querySelector('#alert-indicator');
            const systemStatus = win.querySelector('#system-status');
            const activeAlerts = win.querySelector('#active-alerts');
            
            if (alerts.length > 0) {
                alertIndicator.style.background = '#fbbf24';
                alertIndicator.style.boxShadow = '0 0 10px #fbbf24';
                systemStatus.textContent = 'Alerts active';
                activeAlerts.textContent = `${alerts.length} active alerts`;
            } else {
                alertIndicator.style.background = '#10b981';
                alertIndicator.style.boxShadow = '0 0 10px #10b981';
                systemStatus.textContent = 'All systems normal';
                activeAlerts.textContent = 'No active alerts';
            }
        },

        showNotification(message, type = 'info') {
            const colors = {
                success: '#10b981',
                warning: '#fbbf24', 
                error: '#ef4444',
                info: '#3b82f6'
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
                max-width: 300px;
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
        },

        // Backend integration methods (to be implemented)
        async fetchSensorData() {
            // GET /api/greenhouse/sensors
            // return fetch('/api/greenhouse/sensors').then(r => r.json());
        },

        async sendControlCommand(equipment, state) {
            // POST /api/greenhouse/control
            // return fetch('/api/greenhouse/control', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ equipment, state })
            // });
        }
    };

    // Register app
    if (window.AppRegistry) {
        window.AppRegistry.registerApp({
            id: 'greenhouse',
            name: 'Greenhouse Control',
            icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><path d='M8 40h32v4H8z' fill='%23059669'/><path d='M24 8l16 24H8z' fill='none' stroke='%23059669' stroke-width='3' stroke-linejoin='round'/><path d='M16 24h16v8H16z' fill='%2316a34a'/><circle cx='20' cy='28' r='2' fill='%23fbbf24'/><circle cx='28' cy='28' r='2' fill='%23fbbf24'/></svg>",
            handler: () => window.GreenhouseApp.open(),
            singleInstance: true
        });
    }

})();