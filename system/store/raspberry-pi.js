/**
 * FILE: applications/raspberry-pi-controller.js
 * VERSION: 1.0.0
 * BUILD DATE: 2025-10-08
 *
 * PURPOSE:
 *   Raspberry Pi Hardware Controller & Monitoring Dashboard
 *   Real-time sensor monitoring, GPIO control, media playback, and system stats.
 *   Designed for embedded Raspberry Pi deployments with hardware access.
 *
 * FEATURES:
 *   - Live sensor data (Temperature, Humidity)
 *   - GPIO pin control (LED toggles, relays)
 *   - Media player with volume control
 *   - System monitoring (Wi-Fi, Battery, Clock)
 *   - Responsive widget-based UI
 *
 * ARCHITECTURE:
 *   - Single-instance application
 *   - Mock data for demo (replace with HAL API calls)
 *   - Widget-based modular design
 *   - Real-time updates via intervals
 *
 * BACKEND REQUIREMENTS:
 *   For production, connect to HAL (Hardware Abstraction Layer):
 *   - GPIO: POST /api/gpio/{pin}/toggle
 *   - Sensors: GET /api/sensors/temperature
 *   - Media: POST /api/media/play
 *
 * AUTHOR:
 *   edmundsparrow.netlify.app | whatsappme @ 09024054758 | webaplications5050@gmail.com
 */

(function() {
    window.RaspberryPiApp = {
        sensorInterval: null,
        clockInterval: null,
        ledStates: { 1: false, 2: false },
        audioElement: null,

        open() {
            const html = `
                <div style="
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    font-family: 'Segoe UI', sans-serif;
                    background: linear-gradient(135deg, #1e1e2f 0%, #2e2e50 100%);
                    color: white;
                    overflow: hidden;
                ">
                    <!-- Header Bar -->
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        background: rgba(46, 46, 80, 0.95);
                        padding: 12px 20px;
                        border-bottom: 2px solid #f4c542;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    ">
                        <div style="font-weight: bold; font-size: 1.1rem; color: #f4c542;">
                            🥧 Raspberry Pi Controller
                        </div>
                        <div style="display: flex; gap: 20px; font-size: 0.85rem;">
                            <span id="rpi-clock" style="font-family: monospace;">00:00:00</span>
                            <span id="rpi-wifi">📡 Wi-Fi: --</span>
                            <span id="rpi-battery">🔋 Battery: --</span>
                        </div>
                    </div>

                    <!-- Workspace Grid -->
                    <div style="
                        flex: 1;
                        padding: 20px;
                        overflow-y: auto;
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                        gap: 20px;
                        align-content: start;
                    ">
                        <!-- Sensor Widget -->
                        <div class="rpi-widget" style="
                            background: rgba(51, 51, 102, 0.6);
                            padding: 20px;
                            border-radius: 12px;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                            border: 1px solid rgba(244, 197, 66, 0.3);
                        ">
                            <h3 style="margin: 0 0 15px 0; color: #f4c542; font-size: 1rem;">
                                🌡️ Environmental Sensors
                            </h3>
                            <div style="margin-bottom: 12px;">
                                <div style="font-size: 0.85rem; opacity: 0.8;">Temperature</div>
                                <div style="font-size: 1.8rem; font-weight: bold; color: #ff6b6b;" id="rpi-temp">
                                    --°C
                                </div>
                            </div>
                            <div>
                                <div style="font-size: 0.85rem; opacity: 0.8;">Humidity</div>
                                <div style="font-size: 1.8rem; font-weight: bold; color: #4dabf7;" id="rpi-humidity">
                                    --%
                                </div>
                            </div>
                        </div>

                        <!-- GPIO Control Widget -->
                        <div class="rpi-widget" style="
                            background: rgba(51, 51, 102, 0.6);
                            padding: 20px;
                            border-radius: 12px;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                            border: 1px solid rgba(244, 197, 66, 0.3);
                        ">
                            <h3 style="margin: 0 0 15px 0; color: #f4c542; font-size: 1rem;">
                                ⚡ GPIO Control
                            </h3>
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                <button class="rpi-gpio-btn" data-pin="1" style="
                                    padding: 12px;
                                    border: none;
                                    border-radius: 8px;
                                    background: linear-gradient(135deg, #51cf66, #37b24d);
                                    color: white;
                                    font-weight: bold;
                                    cursor: pointer;
                                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                                    transition: all 0.2s;
                                ">
                                    💡 LED 1: <span id="led1-status">OFF</span>
                                </button>
                                <button class="rpi-gpio-btn" data-pin="2" style="
                                    padding: 12px;
                                    border: none;
                                    border-radius: 8px;
                                    background: linear-gradient(135deg, #51cf66, #37b24d);
                                    color: white;
                                    font-weight: bold;
                                    cursor: pointer;
                                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                                    transition: all 0.2s;
                                ">
                                    💡 LED 2: <span id="led2-status">OFF</span>
                                </button>
                            </div>
                            <div style="
                                margin-top: 15px;
                                padding: 10px;
                                background: rgba(0,0,0,0.2);
                                border-radius: 6px;
                                font-size: 0.85rem;
                            ">
                                <strong>GPIO Status:</strong> <span id="gpio-global-status">Idle</span>
                            </div>
                        </div>

                        <!-- Media Player Widget -->
                        <div class="rpi-widget" style="
                            background: rgba(51, 51, 102, 0.6);
                            padding: 20px;
                            border-radius: 12px;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                            border: 1px solid rgba(244, 197, 66, 0.3);
                        ">
                            <h3 style="margin: 0 0 15px 0; color: #f4c542; font-size: 1rem;">
                                🎵 Media Player
                            </h3>
                            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                                <button id="rpi-play-btn" style="
                                    flex: 1;
                                    padding: 10px;
                                    border: none;
                                    border-radius: 8px;
                                    background: linear-gradient(135deg, #4c6ef5, #364fc7);
                                    color: white;
                                    font-weight: bold;
                                    cursor: pointer;
                                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                                ">▶ Play</button>
                                <button id="rpi-pause-btn" style="
                                    flex: 1;
                                    padding: 10px;
                                    border: none;
                                    border-radius: 8px;
                                    background: linear-gradient(135deg, #fab005, #f08c00);
                                    color: white;
                                    font-weight: bold;
                                    cursor: pointer;
                                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                                ">⏸ Pause</button>
                            </div>
                            <div>
                                <label style="font-size: 0.85rem; opacity: 0.8;">Volume</label>
                                <input type="range" id="rpi-volume" min="0" max="100" value="50" style="
                                    width: 100%;
                                    margin-top: 8px;
                                    accent-color: #f4c542;
                                ">
                                <div style="text-align: center; margin-top: 5px; font-size: 0.9rem;">
                                    <span id="rpi-volume-display">50</span>%
                                </div>
                            </div>
                            <audio id="rpi-audio" src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"></audio>
                        </div>

                        <!-- System Info Widget -->
                        <div class="rpi-widget" style="
                            background: rgba(51, 51, 102, 0.6);
                            padding: 20px;
                            border-radius: 12px;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                            border: 1px solid rgba(244, 197, 66, 0.3);
                        ">
                            <h3 style="margin: 0 0 15px 0; color: #f4c542; font-size: 1rem;">
                                📊 System Information
                            </h3>
                            <div style="font-size: 0.85rem; line-height: 1.8;">
                                <div><strong>Platform:</strong> <span id="rpi-platform">--</span></div>
                                <div><strong>CPU Cores:</strong> <span id="rpi-cores">--</span></div>
                                <div><strong>Memory:</strong> <span id="rpi-memory">--</span></div>
                                <div><strong>Connection:</strong> <span id="rpi-connection">--</span></div>
                            </div>
                        </div>
                    </div>

                    <!-- Footer Taskbar -->
                    <div style="
                        background: rgba(46, 46, 80, 0.95);
                        padding: 8px 15px;
                        display: flex;
                        gap: 10px;
                        border-top: 2px solid #f4c542;
                        box-shadow: 0 -2px 8px rgba(0,0,0,0.3);
                    ">
                        <button class="rpi-taskbar-btn" data-action="refresh" style="
                            padding: 6px 12px;
                            border: none;
                            border-radius: 6px;
                            background: #f4c542;
                            color: #000;
                            font-weight: bold;
                            cursor: pointer;
                            font-size: 0.85rem;
                        ">🔄 Refresh</button>
                        <button class="rpi-taskbar-btn" data-action="logs" style="
                            padding: 6px 12px;
                            border: none;
                            border-radius: 6px;
                            background: #f4c542;
                            color: #000;
                            font-weight: bold;
                            cursor: pointer;
                            font-size: 0.85rem;
                        ">📋 Logs</button>
                        <button class="rpi-taskbar-btn" data-action="settings" style="
                            padding: 6px 12px;
                            border: none;
                            border-radius: 6px;
                            background: #f4c542;
                            color: #000;
                            font-weight: bold;
                            cursor: pointer;
                            font-size: 0.85rem;
                        ">⚙️ Settings</button>
                    </div>
                </div>

                <style>
                .rpi-gpio-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 10px rgba(0,0,0,0.4);
                }
                .rpi-taskbar-btn:hover {
                    background: #ffd966;
                }
                </style>
            `;

            const win = window.WindowManager.createWindow('Raspberry Pi Controller', html, 800, 600);
            this.setupRaspberryPi(win);
            return win;
        },

        setupRaspberryPi(win) {
            // Initialize audio element
            this.audioElement = win.querySelector('#rpi-audio');

            // Clock update
            this.updateClock(win);
            this.clockInterval = setInterval(() => this.updateClock(win), 1000);

            // Wi-Fi & Battery monitoring
            this.monitorConnection(win);

            // Sensor updates
            this.updateSensors(win);
            this.sensorInterval = setInterval(() => this.updateSensors(win), 3000);

            // System info
            this.updateSystemInfo(win);

            // GPIO controls
            win.querySelectorAll('.rpi-gpio-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const pin = e.target.closest('.rpi-gpio-btn').dataset.pin;
                    this.toggleGPIO(win, pin);
                });
            });

            // Media controls
            win.querySelector('#rpi-play-btn').addEventListener('click', () => this.playMedia(win));
            win.querySelector('#rpi-pause-btn').addEventListener('click', () => this.pauseMedia(win));
            
            const volumeSlider = win.querySelector('#rpi-volume');
            volumeSlider.addEventListener('input', (e) => {
                const volume = e.target.value;
                this.audioElement.volume = volume / 100;
                win.querySelector('#rpi-volume-display').textContent = volume;
            });

            // Taskbar actions
            win.querySelectorAll('.rpi-taskbar-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const action = e.target.dataset.action;
                    this.handleTaskbarAction(win, action);
                });
            });

            // Cleanup on close
            win.addEventListener('windowClosed', () => this.cleanup());
        },

        updateClock(win) {
            const clockEl = win.querySelector('#rpi-clock');
            if (clockEl) {
                clockEl.textContent = new Date().toLocaleTimeString();
            }
        },

        monitorConnection(win) {
            const wifiEl = win.querySelector('#rpi-wifi');
            const batteryEl = win.querySelector('#rpi-battery');

            // Wi-Fi status
            if (wifiEl) {
                wifiEl.textContent = `📡 Wi-Fi: ${navigator.onLine ? '✅ Connected' : '❌ Offline'}`;
                window.addEventListener('online', () => {
                    wifiEl.textContent = '📡 Wi-Fi: ✅ Connected';
                });
                window.addEventListener('offline', () => {
                    wifiEl.textContent = '📡 Wi-Fi: ❌ Offline';
                });
            }

            // Battery status (if available)
            if (batteryEl && navigator.getBattery) {
                navigator.getBattery().then(battery => {
                    const updateBattery = () => {
                        const level = Math.floor(battery.level * 100);
                        const charging = battery.charging ? '⚡' : '';
                        batteryEl.textContent = `🔋 ${level}% ${charging}`;
                    };
                    updateBattery();
                    battery.addEventListener('levelchange', updateBattery);
                    battery.addEventListener('chargingchange', updateBattery);
                });
            } else if (batteryEl) {
                batteryEl.textContent = '🔋 N/A';
            }
        },

        updateSensors(win) {
            // Mock sensor data (replace with HAL API call)
            const temp = (20 + Math.random() * 10).toFixed(1);
            const humidity = (50 + Math.random() * 20).toFixed(1);

            const tempEl = win.querySelector('#rpi-temp');
            const humidityEl = win.querySelector('#rpi-humidity');

            if (tempEl) tempEl.textContent = `${temp}°C`;
            if (humidityEl) humidityEl.textContent = `${humidity}%`;

            // In production, use:
            // fetch('/api/sensors/temperature').then(r => r.json()).then(data => { ... });
        },

        toggleGPIO(win, pin) {
            this.ledStates[pin] = !this.ledStates[pin];
            const status = this.ledStates[pin] ? 'ON' : 'OFF';
            
            const statusEl = win.querySelector(`#led${pin}-status`);
            if (statusEl) {
                statusEl.textContent = status;
                statusEl.style.color = this.ledStates[pin] ? '#51cf66' : '#ff6b6b';
            }

            const globalStatus = win.querySelector('#gpio-global-status');
            if (globalStatus) {
                globalStatus.textContent = `LED ${pin} → ${status}`;
            }

            // In production, use:
            // fetch(`/api/gpio/${pin}/toggle`, { method: 'POST' });
        },

        playMedia(win) {
            if (this.audioElement) {
                this.audioElement.play();
            }
        },

        pauseMedia(win) {
            if (this.audioElement) {
                this.audioElement.pause();
            }
        },

        updateSystemInfo(win) {
            const platformEl = win.querySelector('#rpi-platform');
            const coresEl = win.querySelector('#rpi-cores');
            const memoryEl = win.querySelector('#rpi-memory');
            const connectionEl = win.querySelector('#rpi-connection');

            if (platformEl) platformEl.textContent = navigator.platform || 'Unknown';
            if (coresEl) coresEl.textContent = navigator.hardwareConcurrency || 'N/A';
            if (memoryEl) memoryEl.textContent = navigator.deviceMemory ? `${navigator.deviceMemory} GB` : 'N/A';
            if (connectionEl) {
                const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
                connectionEl.textContent = conn ? conn.effectiveType : 'Unknown';
            }
        },

        handleTaskbarAction(win, action) {
            switch (action) {
                case 'refresh':
                    this.updateSensors(win);
                    this.updateSystemInfo(win);
                    break;
                case 'logs':
                    alert('System Logs\n\n[Demo] View hardware logs here');
                    break;
                case 'settings':
                    alert('Pi Settings\n\n[Demo] Configure GPIO pins, sensors, etc.');
                    break;
            }
        },

        cleanup() {
            if (this.clockInterval) clearInterval(this.clockInterval);
            if (this.sensorInterval) clearInterval(this.sensorInterval);
            if (this.audioElement) {
                this.audioElement.pause();
                this.audioElement = null;
            }
        }
    };

    // Register with AppRegistry
    if (window.AppRegistry) {
        window.AppRegistry.registerApp({
            id: 'raspberry-pi',
            name: 'Raspberry Pi',
            icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' rx='8' fill='%23A22846'/><circle cx='14' cy='14' r='4' fill='%23FFD700'/><circle cx='34' cy='14' r='4' fill='%23FFD700'/><circle cx='14' cy='34' r='4' fill='%23FFD700'/><circle cx='34' cy='34' r='4' fill='%23FFD700'/><rect x='20' y='12' width='8' height='24' rx='2' fill='%23333'/><rect x='12' y='20' width='24' height='8' rx='2' fill='%23333'/><text x='24' y='27' font-size='14' fill='white' text-anchor='middle' font-weight='bold'>π</text></svg>",
            handler: () => window.RaspberryPiApp.open(),
            singleInstance: true
        });
    }

    // Register documentation
    if (window.Docs && typeof window.Docs.register === 'function') {
        setTimeout(() => {
            window.Docs.register('raspberry-pi', {
                name: "Raspberry Pi Controller",
                version: "1.0.0",
                description: "Hardware controller for Raspberry Pi with GPIO control, sensor monitoring, media playback, and system information display.",
                type: "Hardware Controller",
                features: [
                    "Real-time environmental sensor monitoring (Temperature, Humidity)",
                    "GPIO pin control for LEDs and relays",
                    "Media player with volume control",
                    "System information dashboard",
                    "Wi-Fi and battery monitoring",
                    "Widget-based responsive UI"
                ],
                dependencies: ["WindowManager", "AppRegistry", "HAL API (optional)"],
                methods: [
                    { name: "open()", description: "Opens Raspberry Pi controller window" },
                    { name: "toggleGPIO(win, pin)", description: "Toggles GPIO pin state" },
                    { name: "updateSensors(win)", description: "Updates sensor readings" },
                    { name: "playMedia(win)", description: "Starts media playback" }
                ],
                notes: "Uses mock data for demo. Connect to HAL API for production hardware control.",
                autoGenerated: false
            });
        }, 1500);
    }
})();


