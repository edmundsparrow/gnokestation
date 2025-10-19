// network-device-controller.js - Multi-vendor Network Device Controller
(function() {
    window.NetworkDeviceController = {
        currentVendor: 'generic',
        
        // Vendor-specific API configurations
        vendors: {
            generic: {
                name: 'Generic Device',
                endpoints: {
                    status: '/api/status',
                    reboot: '/api/reboot',
                    devices: '/api/connected-devices'
                }
            },
            huawei: {
                name: 'Huawei MiFi',
                baseURL: 'http://192.168.8.1',
                endpoints: {
                    status: '/api/monitoring/status',
                    reboot: '/api/device/control',
                    devices: '/api/wlan/host-list'
                }
            },
            zte: {
                name: 'ZTE MiFi',
                baseURL: 'http://192.168.0.1',
                endpoints: {
                    status: '/goform/goform_get_cmd_process?cmd=wan_ipaddr,network_type',
                    reboot: '/goform/goform_set_cmd_process',
                    devices: '/goform/goform_get_cmd_process?cmd=station_list'
                }
            },
            tplink: {
                name: 'TP-Link Router',
                baseURL: 'http://192.168.1.1',
                endpoints: {
                    status: '/cgi-bin/luci/admin/status',
                    reboot: '/cgi-bin/luci/admin/system/reboot',
                    devices: '/cgi-bin/luci/admin/network/wireless_status'
                }
            }
        },

        open() {
            const html = `
                <div style="height:100%;display:flex;flex-direction:column;font-family:'Segoe UI',sans-serif;background:#1e1e1e;color:#e0e0e0;">
                    
                    <!-- Header -->
                    <div style="padding:16px;background:#2d2d2d;border-bottom:2px solid #007acc;">
                        <h2 style="margin:0 0 8px 0;color:#61dafb;">Network Device Controller</h2>
                        <div style="display:flex;gap:12px;align-items:center;">
                            <label style="font-size:13px;color:#aaa;">Device Type:</label>
                            <select id="vendor-select" style="padding:6px 12px;background:#3c3c3c;color:#fff;border:1px solid #555;border-radius:4px;font-size:13px;">
                                <option value="generic">Generic Network Device</option>
                                <option value="huawei">Huawei MiFi (192.168.8.1)</option>
                                <option value="zte">ZTE MiFi (192.168.0.1)</option>
                                <option value="tplink">TP-Link Router (192.168.1.1)</option>
                            </select>
                        </div>
                    </div>

                    <!-- Main Content -->
                    <div style="flex:1;overflow-y:auto;padding:16px;">
                        
                        <!-- Status Panel -->
                        <div style="background:#2d2d2d;border-radius:8px;padding:16px;margin-bottom:16px;border:1px solid #444;">
                            <h3 style="margin:0 0 12px 0;color:#61dafb;font-size:16px;">Device Status</h3>
                            <div id="status-display" style="font-size:13px;line-height:1.8;color:#ccc;">
                                <div>⚪ Connection: <span id="conn-status">Unknown</span></div>
                                <div>📡 Signal: <span id="signal-status">--</span></div>
                                <div>🌐 Network Type: <span id="network-type">--</span></div>
                                <div>📊 Data Usage: <span id="data-usage">--</span></div>
                            </div>
                            <button id="refresh-btn" style="margin-top:12px;padding:8px 16px;background:#007acc;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;">
                                🔄 Refresh Status
                            </button>
                        </div>

                        <!-- Connected Devices -->
                        <div style="background:#2d2d2d;border-radius:8px;padding:16px;margin-bottom:16px;border:1px solid #444;">
                            <h3 style="margin:0 0 12px 0;color:#61dafb;font-size:16px;">Connected Devices</h3>
                            <div id="devices-list" style="font-size:13px;color:#ccc;">
                                <div style="color:#888;font-style:italic;">Click refresh to load devices...</div>
                            </div>
                        </div>

                        <!-- Control Panel -->
                        <div style="background:#2d2d2d;border-radius:8px;padding:16px;border:1px solid #444;">
                            <h3 style="margin:0 0 12px 0;color:#61dafb;font-size:16px;">Device Control</h3>
                            <div style="display:flex;gap:12px;">
                                <button id="reboot-btn" style="padding:10px 20px;background:#dc3545;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;font-weight:600;">
                                    🔌 Reboot Device
                                </button>
                                <button id="demo-btn" style="padding:10px 20px;background:#28a745;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;font-weight:600;">
                                    🎭 Load Demo Data
                                </button>
                            </div>
                        </div>

                        <!-- API Configuration (for testing) -->
                        <div style="background:#2d2d2d;border-radius:8px;padding:16px;margin-top:16px;border:1px solid #444;">
                            <h3 style="margin:0 0 8px 0;color:#61dafb;font-size:14px;">API Configuration</h3>
                            <div style="font-size:12px;color:#888;font-family:monospace;">
                                <div>Base URL: <span id="api-base">--</span></div>
                                <div>Status Endpoint: <span id="api-status">--</span></div>
                            </div>
                        </div>

                    </div>

                    <!-- Footer -->
                    <div style="padding:12px;background:#2d2d2d;border-top:1px solid #444;text-align:center;font-size:11px;color:#666;">
                        ⚠️ Demo Mode - Replace API calls with your HAL backend for production
                    </div>

                </div>
            `;

            const win = window.WindowManager.createWindow('Network Device Controller', html, 500, 650);
            this.setupHandlers(win);
            this.updateAPIDisplay(win);
            return win;
        },

        setupHandlers(win) {
            const vendorSelect = win.querySelector('#vendor-select');
            const refreshBtn = win.querySelector('#refresh-btn');
            const rebootBtn = win.querySelector('#reboot-btn');
            const demoBtn = win.querySelector('#demo-btn');

            // Vendor change
            vendorSelect.addEventListener('change', (e) => {
                this.currentVendor = e.target.value;
                this.updateAPIDisplay(win);
                this.showNotification(win, `Switched to ${this.vendors[this.currentVendor].name}`, 'info');
            });

            // Refresh status
            refreshBtn.addEventListener('click', () => {
                this.fetchStatus(win);
            });

            // Reboot device
            rebootBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to reboot the device?')) {
                    this.rebootDevice(win);
                }
            });

            // Load demo data
            demoBtn.addEventListener('click', () => {
                this.loadDemoData(win);
            });
        },

        updateAPIDisplay(win) {
            const vendor = this.vendors[this.currentVendor];
            win.querySelector('#api-base').textContent = vendor.baseURL || 'N/A';
            win.querySelector('#api-status').textContent = vendor.endpoints.status;
        },

        async fetchStatus(win) {
            const vendor = this.vendors[this.currentVendor];
            const statusURL = (vendor.baseURL || '') + vendor.endpoints.status;

            this.showNotification(win, 'Fetching device status...', 'info');

            try {
                // In production, this would be: const response = await fetch(statusURL);
                // For demo, we simulate the call
                throw new Error('CORS/Network - use demo data or configure HAL backend');
            } catch (error) {
                this.showNotification(win, `Cannot reach device. ${error.message}`, 'error');
                this.showNotification(win, 'Click "Load Demo Data" to see interface', 'info');
            }
        },

        loadDemoData(win) {
            // Simulated device data
            const demoData = {
                connection: 'Connected',
                signal: '4/5 bars (Good)',
                networkType: '4G LTE',
                dataUsage: '2.3 GB / 10 GB',
                devices: [
                    { name: 'iPhone 12', ip: '192.168.8.101', mac: 'A1:B2:C3:D4:E5:F6', signal: 'Good' },
                    { name: 'Laptop-Dell', ip: '192.168.8.102', mac: 'B2:C3:D4:E5:F6:A1', signal: 'Excellent' },
                    { name: 'Android-Samsung', ip: '192.168.8.103', mac: 'C3:D4:E5:F6:A1:B2', signal: 'Fair' }
                ]
            };

            win.querySelector('#conn-status').textContent = demoData.connection;
            win.querySelector('#conn-status').style.color = '#28a745';
            
            win.querySelector('#signal-status').textContent = demoData.signal;
            win.querySelector('#network-type').textContent = demoData.networkType;
            win.querySelector('#data-usage').textContent = demoData.dataUsage;

            // Render devices
            const devicesList = win.querySelector('#devices-list');
            devicesList.innerHTML = demoData.devices.map(device => `
                <div style="padding:8px;background:#1e1e1e;border-radius:4px;margin-bottom:8px;border-left:3px solid #007acc;">
                    <div style="font-weight:600;margin-bottom:4px;">📱 ${device.name}</div>
                    <div style="font-size:11px;color:#888;">
                        IP: ${device.ip} • MAC: ${device.mac} • Signal: ${device.signal}
                    </div>
                </div>
            `).join('');

            this.showNotification(win, 'Demo data loaded successfully', 'success');
        },

        async rebootDevice(win) {
            const vendor = this.vendors[this.currentVendor];
            const rebootURL = (vendor.baseURL || '') + vendor.endpoints.reboot;

            this.showNotification(win, 'Sending reboot command...', 'info');

            try {
                // In production: await fetch(rebootURL, { method: 'POST', body: ... });
                await new Promise(resolve => setTimeout(resolve, 1000));
                this.showNotification(win, 'Reboot command sent (simulated)', 'success');
            } catch (error) {
                this.showNotification(win, 'Reboot failed: ' + error.message, 'error');
            }
        },

        showNotification(win, message, type) {
            const colors = {
                success: '#28a745',
                error: '#dc3545',
                info: '#007acc'
            };

            const notification = document.createElement('div');
            notification.style.cssText = `
                position:absolute;top:60px;right:16px;background:${colors[type]};color:#fff;
                padding:10px 16px;border-radius:4px;font-size:12px;z-index:1000;
                box-shadow:0 4px 12px rgba(0,0,0,0.3);opacity:0;transition:opacity 0.3s;
            `;
            notification.textContent = message;
            
            win.appendChild(notification);
            requestAnimationFrame(() => notification.style.opacity = '1');
            
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
    };

    // Register with AppRegistry
    if (window.AppRegistry) {
        window.AppRegistry.registerApp({
            id: 'mini-routers',
            name: 'Mini Routers',
            icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' rx='8' fill='%23007acc'/><circle cx='24' cy='24' r='8' fill='white'/><circle cx='12' cy='18' r='3' fill='white'/><circle cx='36' cy='18' r='3' fill='white'/><circle cx='18' cy='32' r='3' fill='white'/><circle cx='30' cy='32' r='3' fill='white'/></svg>",
            handler: () => window.NetworkDeviceController.open(),
            singleInstance: true,
            documentation: {
                name: 'Mini Routers',
                version: '1.0',
                description: 'Multi-vendor network device controller with vendor-specific API configurations',
                type: 'IoT Control',
                features: [
                    'Multi-vendor support (Huawei, ZTE, TP-Link, Generic)',
                    'Device status monitoring',
                    'Connected devices list',
                    'Reboot control',
                    'Demo mode for testing without hardware'
                ]
            }
        });
    }
})();

