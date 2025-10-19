/* ========================================
 * FILE: system/apps/fleet-tracker.js
 * PURPOSE: Professional Fleet Tracking Dashboard (Demo UI)
 * VERSION: 1.0 - Full Featured Demo
 * ======================================== */

window.FleetTrackerApp = {
    currentWindow: null,
    activeTab: 'live',
    selectedVehicle: null,
    
    // Mock fleet data
    vehicles: [
        { 
            id: 'VH001', 
            name: 'Toyota Hilux - Lagos 1', 
            status: 'moving', 
            speed: 45, 
            location: 'Ikeja, Lagos',
            driver: 'Chidi Okonkwo',
            ignition: true,
            fuel: 68,
            lastUpdate: new Date().toLocaleTimeString(),
            coords: { lat: 6.5954, lng: 3.3377 }
        },
        { 
            id: 'VH002', 
            name: 'Mercedes Sprinter - Abuja 1', 
            status: 'parked', 
            speed: 0, 
            location: 'Garki, Abuja',
            driver: 'Amina Hassan',
            ignition: false,
            fuel: 45,
            lastUpdate: new Date(Date.now() - 300000).toLocaleTimeString(),
            coords: { lat: 9.0579, lng: 7.4951 }
        },
        { 
            id: 'VH003', 
            name: 'Sienna Bus - Port Harcourt 1', 
            status: 'moving', 
            speed: 62, 
            location: 'Trans Amadi, PH',
            driver: 'John Eze',
            ignition: true,
            fuel: 82,
            lastUpdate: new Date().toLocaleTimeString(),
            coords: { lat: 4.8156, lng: 7.0498 }
        },
        { 
            id: 'VH004', 
            name: 'Hilux Van - Lagos 2', 
            status: 'idle', 
            speed: 0, 
            location: 'Victoria Island, Lagos',
            driver: 'Blessing Nwafor',
            ignition: true,
            fuel: 34,
            lastUpdate: new Date(Date.now() - 120000).toLocaleTimeString(),
            coords: { lat: 6.4281, lng: 3.4219 }
        },
        { 
            id: 'VH005', 
            name: 'Coaster Bus - Ibadan 1', 
            status: 'offline', 
            speed: 0, 
            location: 'Last: Bodija, Ibadan',
            driver: 'Tunde Adebayo',
            ignition: false,
            fuel: 12,
            lastUpdate: new Date(Date.now() - 7200000).toLocaleTimeString(),
            coords: { lat: 7.3986, lng: 3.9093 }
        }
    ],

    // Mock trip history
    tripHistory: [
        { date: 'Today, 2:30 PM', vehicle: 'VH001', route: 'Ikeja → Victoria Island', distance: '12.3 km', duration: '45 min', driver: 'Chidi Okonkwo' },
        { date: 'Today, 10:15 AM', vehicle: 'VH003', route: 'Trans Amadi → Eleme', distance: '18.7 km', duration: '1h 12min', driver: 'John Eze' },
        { date: 'Yesterday, 4:20 PM', vehicle: 'VH002', route: 'Garki → Gwarinpa', distance: '8.4 km', duration: '32 min', driver: 'Amina Hassan' },
        { date: 'Yesterday, 11:00 AM', vehicle: 'VH001', route: 'Lekki → Ajah', distance: '15.2 km', duration: '58 min', driver: 'Chidi Okonkwo' }
    ],

    // Mock alerts
    alerts: [
        { time: '5 mins ago', type: 'speed', message: 'VH003 exceeded 80 km/h on Eleme Road', severity: 'warning' },
        { time: '12 mins ago', type: 'geofence', message: 'VH001 entered restricted zone (Airport Road)', severity: 'alert' },
        { time: '45 mins ago', type: 'fuel', message: 'VH005 fuel level critical (12%)', severity: 'critical' },
        { time: '2 hours ago', type: 'offline', message: 'VH005 lost GPS signal', severity: 'warning' },
        { time: 'Today, 9:30 AM', type: 'idle', message: 'VH004 idle for 25 minutes (engine on)', severity: 'info' }
    ],

    open() {
        const trackerHTML = `
            <div style="height:100%;display:flex;flex-direction:column;font-family:'Segoe UI',sans-serif;background:#f0f2f5;">
                <!-- Header -->
                <div style="background:#1a3a52;color:white;padding:15px 20px;display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <h2 style="margin:0 0 5px 0;font-size:20px;">Fleet Tracking Dashboard</h2>
                        <p style="margin:0;font-size:12px;opacity:0.8;">Real-time vehicle monitoring and management</p>
                    </div>
                    <div style="display:flex;gap:10px;align-items:center;">
                        <div style="background:rgba(255,255,255,0.1);padding:8px 12px;border-radius:6px;font-size:13px;">
                            <strong>5</strong> Vehicles | <strong>3</strong> Active
                        </div>
                        <button onclick="alert('Demo: Refresh data')" style="background:#28a745;border:none;color:white;padding:8px 15px;border-radius:4px;cursor:pointer;font-size:13px;">
                            ↻ Refresh
                        </button>
                    </div>
                </div>

                <!-- Tab Navigation -->
                <div style="background:white;border-bottom:2px solid #e0e0e0;padding:0 20px;">
                    <div id="tab-nav" style="display:flex;gap:5px;">
                        <button class="tab-btn active" data-tab="live" style="padding:12px 20px;border:none;background:transparent;cursor:pointer;font-size:14px;font-weight:600;border-bottom:3px solid #1a3a52;color:#1a3a52;">
                            Live Map
                        </button>
                        <button class="tab-btn" data-tab="fleet" style="padding:12px 20px;border:none;background:transparent;cursor:pointer;font-size:14px;font-weight:600;border-bottom:3px solid transparent;color:#666;">
                            Fleet Status
                        </button>
                        <button class="tab-btn" data-tab="history" style="padding:12px 20px;border:none;background:transparent;cursor:pointer;font-size:14px;font-weight:600;border-bottom:3px solid transparent;color:#666;">
                            Trip History
                        </button>
                        <button class="tab-btn" data-tab="alerts" style="padding:12px 20px;border:none;background:transparent;cursor:pointer;font-size:14px;font-weight:600;border-bottom:3px solid transparent;color:#666;">
                            Alerts
                        </button>
                        <button class="tab-btn" data-tab="setup" style="padding:12px 20px;border:none;background:transparent;cursor:pointer;font-size:14px;font-weight:600;border-bottom:3px solid transparent;color:#666;">
                            How It Works
                        </button>
                    </div>
                </div>

                <!-- Content Area -->
                <div id="content-area" style="flex:1;overflow-y:auto;padding:20px;"></div>
            </div>
        `;

        this.currentWindow = window.WindowManager.createWindow('Fleet Tracker', trackerHTML, 920, 650);
        this.setupEventHandlers();
        this.renderTab('live');
        return this.currentWindow;
    },

    setupEventHandlers() {
        const tabBtns = this.currentWindow.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                
                // Update button states
                tabBtns.forEach(b => {
                    b.classList.remove('active');
                    b.style.borderBottom = '3px solid transparent';
                    b.style.color = '#666';
                });
                e.target.classList.add('active');
                e.target.style.borderBottom = '3px solid #1a3a52';
                e.target.style.color = '#1a3a52';
                
                this.renderTab(tab);
            });
        });
    },

    renderTab(tab) {
        this.activeTab = tab;
        const content = this.currentWindow.querySelector('#content-area');
        
        switch(tab) {
            case 'live':
                content.innerHTML = this.renderLiveMap();
                break;
            case 'fleet':
                content.innerHTML = this.renderFleetStatus();
                break;
            case 'history':
                content.innerHTML = this.renderTripHistory();
                break;
            case 'alerts':
                content.innerHTML = this.renderAlerts();
                break;
            case 'setup':
                content.innerHTML = this.renderSetupGuide();
                break;
        }
    },

    renderLiveMap() {
        return `
            <div style="display:grid;grid-template-columns:300px 1fr;gap:20px;height:100%;">
                <!-- Vehicle List Sidebar -->
                <div style="background:white;border-radius:8px;padding:15px;overflow-y:auto;">
                    <h3 style="margin:0 0 15px 0;font-size:16px;color:#2c3e50;">Active Vehicles</h3>
                    ${this.vehicles.map(v => `
                        <div style="padding:12px;margin-bottom:10px;border-radius:6px;background:#f8f9fa;cursor:pointer;border-left:4px solid ${this.getStatusColor(v.status)};" onclick="alert('Demo: Show ${v.name} details')">
                            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
                                <strong style="font-size:13px;color:#2c3e50;">${v.id}</strong>
                                <span style="font-size:11px;padding:2px 6px;border-radius:3px;background:${this.getStatusColor(v.status)};color:white;">${v.status.toUpperCase()}</span>
                            </div>
                            <div style="font-size:12px;color:#666;margin-bottom:4px;">${v.name}</div>
                            <div style="display:flex;justify-content:space-between;font-size:11px;color:#999;">
                                <span>${v.speed} km/h</span>
                                <span>⛽ ${v.fuel}%</span>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Map Area -->
                <div style="background:white;border-radius:8px;padding:20px;display:flex;flex-direction:column;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                        <h3 style="margin:0;font-size:16px;color:#2c3e50;">Live Location Map</h3>
                        <div style="display:flex;gap:10px;">
                            <button onclick="alert('Demo: Zoom to fit all vehicles')" style="padding:6px 12px;border:1px solid #ddd;background:white;border-radius:4px;cursor:pointer;font-size:12px;">Fit All</button>
                            <button onclick="alert('Demo: Toggle traffic layer')" style="padding:6px 12px;border:1px solid #ddd;background:white;border-radius:4px;cursor:pointer;font-size:12px;">Traffic</button>
                        </div>
                    </div>
                    
                    <!-- Mock Map -->
                    <div style="flex:1;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);border-radius:8px;display:flex;align-items:center;justify-content:center;position:relative;min-height:400px;">
                        <div style="color:white;text-align:center;z-index:1;">
                            <div style="font-size:48px;margin-bottom:10px;">🗺️</div>
                            <h3 style="margin:0 0 10px 0;">Interactive Map View</h3>
                            <p style="margin:0;opacity:0.9;">Production version integrates Google Maps or OpenStreetMap</p>
                            <p style="margin:10px 0 0 0;font-size:13px;opacity:0.8;">Shows real-time vehicle positions with clickable markers</p>
                        </div>
                        
                        <!-- Mock vehicle markers -->
                        ${this.vehicles.slice(0, 3).map((v, i) => `
                            <div style="position:absolute;top:${30 + i * 100}px;left:${50 + i * 150}px;background:${this.getStatusColor(v.status)};color:white;padding:8px 12px;border-radius:8px;font-size:11px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
                                <strong>${v.id}</strong><br>${v.speed} km/h
                            </div>
                        `).join('')}
                    </div>

                    <!-- Map Legend -->
                    <div style="margin-top:15px;display:flex;gap:20px;font-size:12px;">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <div style="width:12px;height:12px;background:#28a745;border-radius:50%;"></div>
                            <span>Moving</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;">
                            <div style="width:12px;height:12px;background:#6c757d;border-radius:50%;"></div>
                            <span>Parked</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;">
                            <div style="width:12px;height:12px;background:#ffc107;border-radius:50%;"></div>
                            <span>Idle</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;">
                            <div style="width:12px;height:12px;background:#dc3545;border-radius:50%;"></div>
                            <span>Offline</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderFleetStatus() {
        return `
            <div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;margin-bottom:25px;">
                    <div style="background:white;padding:20px;border-radius:8px;border-left:4px solid #28a745;">
                        <div style="font-size:32px;font-weight:bold;color:#28a745;">3</div>
                        <div style="color:#666;font-size:14px;">Active Vehicles</div>
                    </div>
                    <div style="background:white;padding:20px;border-radius:8px;border-left:4px solid #6c757d;">
                        <div style="font-size:32px;font-weight:bold;color:#6c757d;">1</div>
                        <div style="color:#666;font-size:14px;">Parked</div>
                    </div>
                    <div style="background:white;padding:20px;border-radius:8px;border-left:4px solid #dc3545;">
                        <div style="font-size:32px;font-weight:bold;color:#dc3545;">1</div>
                        <div style="color:#666;font-size:14px;">Offline</div>
                    </div>
                    <div style="background:white;padding:20px;border-radius:8px;border-left:4px solid #007bff;">
                        <div style="font-size:32px;font-weight:bold;color:#007bff;">47</div>
                        <div style="color:#666;font-size:14px;">Avg. Speed (km/h)</div>
                    </div>
                </div>

                <div style="background:white;border-radius:8px;overflow:hidden;">
                    <table style="width:100%;border-collapse:collapse;">
                        <thead>
                            <tr style="background:#f8f9fa;">
                                <th style="padding:12px;text-align:left;font-size:13px;color:#666;font-weight:600;">Vehicle ID</th>
                                <th style="padding:12px;text-align:left;font-size:13px;color:#666;font-weight:600;">Name</th>
                                <th style="padding:12px;text-align:left;font-size:13px;color:#666;font-weight:600;">Driver</th>
                                <th style="padding:12px;text-align:left;font-size:13px;color:#666;font-weight:600;">Location</th>
                                <th style="padding:12px;text-align:center;font-size:13px;color:#666;font-weight:600;">Speed</th>
                                <th style="padding:12px;text-align:center;font-size:13px;color:#666;font-weight:600;">Fuel</th>
                                <th style="padding:12px;text-align:center;font-size:13px;color:#666;font-weight:600;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.vehicles.map(v => `
                                <tr style="border-bottom:1px solid #f0f0f0;">
                                    <td style="padding:12px;font-weight:600;font-size:13px;">${v.id}</td>
                                    <td style="padding:12px;font-size:13px;">${v.name}</td>
                                    <td style="padding:12px;font-size:13px;">${v.driver}</td>
                                    <td style="padding:12px;font-size:13px;color:#666;">${v.location}</td>
                                    <td style="padding:12px;text-align:center;font-size:13px;">${v.speed} km/h</td>
                                    <td style="padding:12px;text-align:center;">
                                        <div style="display:flex;align-items:center;justify-content:center;gap:6px;">
                                            <div style="width:40px;height:6px;background:#e0e0e0;border-radius:3px;overflow:hidden;">
                                                <div style="width:${v.fuel}%;height:100%;background:${v.fuel > 30 ? '#28a745' : '#dc3545'};"></div>
                                            </div>
                                            <span style="font-size:12px;">${v.fuel}%</span>
                                        </div>
                                    </td>
                                    <td style="padding:12px;text-align:center;">
                                        <span style="padding:4px 8px;border-radius:4px;font-size:11px;font-weight:600;background:${this.getStatusColor(v.status)};color:white;">
                                            ${v.status.toUpperCase()}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    renderTripHistory() {
        return `
            <div style="background:white;border-radius:8px;padding:20px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                    <h3 style="margin:0;font-size:18px;color:#2c3e50;">Recent Trips</h3>
                    <div style="display:flex;gap:10px;">
                        <select style="padding:8px 12px;border:1px solid #ddd;border-radius:4px;font-size:13px;" onchange="alert('Demo: Filter by vehicle')">
                            <option>All Vehicles</option>
                            ${this.vehicles.map(v => `<option>${v.id}</option>`).join('')}
                        </select>
                        <button onclick="alert('Demo: Export trip data')" style="padding:8px 15px;border:1px solid #ddd;background:white;border-radius:4px;cursor:pointer;font-size:13px;">
                            Export CSV
                        </button>
                    </div>
                </div>

                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr style="background:#f8f9fa;border-bottom:2px solid #e0e0e0;">
                            <th style="padding:12px;text-align:left;font-size:13px;color:#666;font-weight:600;">Date & Time</th>
                            <th style="padding:12px;text-align:left;font-size:13px;color:#666;font-weight:600;">Vehicle</th>
                            <th style="padding:12px;text-align:left;font-size:13px;color:#666;font-weight:600;">Route</th>
                            <th style="padding:12px;text-align:left;font-size:13px;color:#666;font-weight:600;">Driver</th>
                            <th style="padding:12px;text-align:center;font-size:13px;color:#666;font-weight:600;">Distance</th>
                            <th style="padding:12px;text-align:center;font-size:13px;color:#666;font-weight:600;">Duration</th>
                            <th style="padding:12px;text-align:center;font-size:13px;color:#666;font-weight:600;">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.tripHistory.map(trip => `
                            <tr style="border-bottom:1px solid #f0f0f0;">
                                <td style="padding:12px;font-size:13px;color:#666;">${trip.date}</td>
                                <td style="padding:12px;font-size:13px;font-weight:600;">${trip.vehicle}</td>
                                <td style="padding:12px;font-size:13px;">${trip.route}</td>
                                <td style="padding:12px;font-size:13px;">${trip.driver}</td>
                                <td style="padding:12px;text-align:center;font-size:13px;">${trip.distance}</td>
                                <td style="padding:12px;text-align:center;font-size:13px;">${trip.duration}</td>
                                <td style="padding:12px;text-align:center;">
                                    <button onclick="alert('Demo: Show route on map')" style="padding:4px 10px;background:#007bff;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;">
                                        View Route
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div style="margin-top:20px;padding:15px;background:#f8f9fa;border-radius:6px;font-size:13px;color:#666;">
                    💡 <strong>Tip:</strong> Click "View Route" to replay the trip on the map. Production version includes speed analysis, stops, and idle time breakdowns.
                </div>
            </div>
        `;
    },

    renderAlerts() {
        return `
            <div style="background:white;border-radius:8px;padding:20px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                    <h3 style="margin:0;font-size:18px;color:#2c3e50;">System Alerts</h3>
                    <button onclick="alert('Demo: Mark all as read')" style="padding:8px 15px;border:1px solid #ddd;background:white;border-radius:4px;cursor:pointer;font-size:13px;">
                        Mark All Read
                    </button>
                </div>

                ${this.alerts.map(alert => `
                    <div style="padding:15px;margin-bottom:12px;border-left:4px solid ${this.getAlertColor(alert.severity)};background:#f8f9fa;border-radius:4px;">
                        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
                            <div style="display:flex;align-items:center;gap:10px;">
                                <span style="font-size:20px;">${this.getAlertIcon(alert.type)}</span>
                                <span style="padding:3px 8px;border-radius:4px;font-size:11px;font-weight:600;background:${this.getAlertColor(alert.severity)};color:white;">
                                    ${alert.severity.toUpperCase()}
                                </span>
                            </div>
                            <span style="font-size:12px;color:#999;">${alert.time}</span>
                        </div>
                        <div style="font-size:14px;color:#2c3e50;margin-left:30px;">${alert.message}</div>
                    </div>
                `).join('')}

                <div style="margin-top:25px;padding:20px;background:#e3f2fd;border-radius:8px;border:1px solid #90caf9;">
                    <h4 style="margin:0 0 10px 0;color:#1976d2;">Configure Alerts</h4>
                    <p style="margin:0 0 15px 0;font-size:13px;color:#1565c0;">Set custom thresholds and notification preferences</p>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;">
                        <button onclick="alert('Demo: Configure speed alerts')" style="padding:10px;background:white;border:1px solid #90caf9;border-radius:4px;cursor:pointer;font-size:13px;">Speed Limits</button>
                        <button onclick="alert('Demo: Configure geofencing')" style="padding:10px;background:white;border:1px solid #90caf9;border-radius:4px;cursor:pointer;font-size:13px;">Geofences</button>
                        <button onclick="alert('Demo: Configure fuel alerts')" style="padding:10px;background:white;border:1px solid #90caf9;border-radius:4px;cursor:pointer;font-size:13px;">Fuel Warnings</button>
                        <button onclick="alert('Demo: Configure notifications')" style="padding:10px;background:white;border:1px solid #90caf9;border-radius:4px;cursor:pointer;font-size:13px;">Notifications</button>
                    </div>
                </div>
            </div>
        `;
    },

    renderSetupGuide() {
        return `
            <div style="max-width:800px;margin:0 auto;">
                <div style="background:linear-gradient(135deg,#1a3a52 0%,#2d5f7f 100%);color:white;padding:30px;border-radius:12px;text-align:center;margin-bottom:25px;">
                    <h2 style="margin:0 0 10px 0;font-size:24px;">How the System Works</h2>
                    <p style="margin:0;opacity:0.9;font-size:15px;">Simple architecture, professional results</p>
                </div>

                <div style="background:white;padding:25px;border-radius:8px;margin-bottom:20px;">
                    <h3 style="margin:0 0 20px 0;color:#2c3e50;font-size:18px;">System Components</h3>
                    
                    <div style="display:grid;gap:15px;">
                        <div style="display:flex;gap:15px;padding:15px;background:#f8f9fa;border-radius:6px;border-left:4px solid #28a745;">
                            <div style="font-size:32px;">📍</div>
                            <div style="flex:1;">
                                <h4 style="margin:0 0 8px 0;color:#2c3e50;font-size:15px;">1. GPS Tracker in Vehicle</h4>
                                <p style="margin:0 0 8px 0;font-size:13px;color:#666;">Small device installed in each vehicle. Sends location data via 4G/LTE network.</p>
                                <div style="font-size:12px;color:#28a745;font-weight:600;">Cost: ₦18,000 - ₦35,000 per vehicle (one-time)</div>
                            </div>
                        </div>

                        <div style="display:flex;gap:15px;padding:15px;background:#f8f9fa;border-radius:6px;border-left:4px solid #007bff;">
                            <div style="font-size:32px;">☁️</div>
                            <div style="flex:1;">
                                <h4 style="margin:0 0 8px 0;color:#2c3e50;font-size:15px;">2. Backend Server</h4>
                                <p style="margin:0 0 8px 0;font-size:13px;color:#666;">Receives data from all trackers, stores location history, handles alerts. Uses Traccar (open source).</p>
                                <div style="font-size:12px;color:#007bff;font-weight:600;">Cost: ₦15,000 - ₦40,000/month (all vehicles)</div>
                            </div>
                        </div>

                        <div style="display:flex;gap:15px;padding:15px;background:#f8f9fa;border-radius:6px;border-left:4px solid #6f42c1;">
                            <div style="font-size:32px;">💻</div>
                            <div style="flex:1;">
                                <h4 style="margin:0 0 8px 0;color:#2c3e50;font-size:15px;">3. Dashboard (This Interface)</h4>
                                <p style="margin:0 0 8px 0;font-size:13px;color:#666;">Web-based control panel you're looking at. Connects to server, displays vehicle data in real-time.</p>
                                <div style="font-size:12px;color:#6f42c1;font-weight:600;">Cost: ₦80,000 - ₦150,000 setup (one-time customization)</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="background:white;padding:25px;border-radius:8px;margin-bottom:20px;">
                    <h3 style="margin:0 0 20px 0;color:#2c3e50;font-size:18px;">Data Flow</h3>
                    <div style="background:#f8f9fa;padding:20px;border-radius:8px;font-family:monospace;font-size:13px;line-height:2;">
                        <div style="text-align:center;">
                            <div style="padding:10px;background:#28a745;color:white;border-radius:6px;display:inline-block;margin-bottom:15px;">📍 GPS Tracker in Vehicle</div>
                            <div style="margin:10px 0;">↓ sends location via 4G</div>
                            <div style="padding:10px;background:#007bff;color:white;border-radius:6px;display:inline-block;margin-bottom:15px;">☁️ Backend Server (Traccar)</div>
                            <div style="margin:10px 0;">↓ serves data via API</div>
                            <div style="padding:10px;background:#6f42c1;color:white;border-radius:6px;display:inline-block;">💻 Your Dashboard (Browser)</div>
                        </div>
                    </div>
                    <p style="margin-top:15px;font-size:13px;color:#666;text-align:center;">Updates happen automatically every 10-30 seconds while vehicles are moving</p>
                </div>

                <div style="background:white;padding:25px;border-radius:8px;margin-bottom:20px;">
                    <h3 style="margin:0 0 20px 0;color:#2c3e50;font-size:18px;">Hardware Options</h3>
                    
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:15px;">
                        <div style="border:2px solid #28a745;border-radius:8px;padding:20px;">
                            <div style="background:#28a745;color:white;padding:8px;border-radius:4px;text-align:center;font-size:12px;font-weight:600;margin-bottom:15px;">RECOMMENDED</div>
                            <h4 style="margin:0 0 10px 0;color:#2c3e50;">Budget Tracker</h4>
                            <div style="font-size:24px;font-weight:bold;color:#28a745;margin-bottom:10px;">₦18,000</div>
                            <ul style="margin:0;padding-left:20px;font-size:13px;color:#666;line-height:1.8;">
                                <li>Basic GPS + 4G module</li>
                                <li>10-30 second updates</li>
                                <li>Speed & location tracking</li>
                                <li>Ignition detection</li>
                            </ul>
                            <div style="margin-top:15px;padding:10px;background:#f0fff4;border-radius:4px;font-size:12px;color:#28a745;">
                                <strong>Best for:</strong> Small fleets, basic tracking needs
                            </div>
                        </div>

                        <div style="border:2px solid #007bff;border-radius:8px;padding:20px;">
                            <div style="background:#007bff;color:white;padding:8px;border-radius:4px;text-align:center;font-size:12px;font-weight:600;margin-bottom:15px;">STANDARD</div>
                            <h4 style="margin:0 0 10px 0;color:#2c3e50;">Advanced Tracker</h4>
                            <div style="font-size:24px;font-weight:bold;color:#007bff;margin-bottom:10px;">₦28,000</div>
                            <ul style="margin:0;padding-left:20px;font-size:13px;color:#666;line-height:1.8;">
                                <li>All budget features +</li>
                                <li>Fuel sensor input</li>
                                <li>Driver ID card reader</li>
                                <li>Panic button support</li>
                            </ul>
                            <div style="margin-top:15px;padding:10px;background:#e3f2fd;border-radius:4px;font-size:12px;color:#007bff;">
                                <strong>Best for:</strong> Commercial fleets, fuel monitoring
                            </div>
                        </div>

                        <div style="border:2px solid #6f42c1;border-radius:8px;padding:20px;">
                            <div style="background:#6f42c1;color:white;padding:8px;border-radius:4px;text-align:center;font-size:12px;font-weight:600;margin-bottom:15px;">PREMIUM</div>
                            <h4 style="margin:0 0 10px 0;color:#2c3e50;">Pro Tracker</h4>
                            <div style="font-size:24px;font-weight:bold;color:#6f42c1;margin-bottom:10px;">₦45,000</div>
                            <ul style="margin:0;padding-left:20px;font-size:13px;color:#666;line-height:1.8;">
                                <li>All advanced features +</li>
                                <li>Camera integration</li>
                                <li>Temperature sensors</li>
                                <li>Remote engine cutoff</li>
                            </ul>
                            <div style="margin-top:15px;padding:10px;background:#f3e5f5;border-radius:4px;font-size:12px;color:#6f42c1;">
                                <strong>Best for:</strong> High-value cargo, security priority
                            </div>
                        </div>
                    </div>
                </div>

                <div style="background:white;padding:25px;border-radius:8px;margin-bottom:20px;">
                    <h3 style="margin:0 0 20px 0;color:#2c3e50;font-size:18px;">Total Cost Breakdown (10 Vehicles)</h3>
                    
                    <table style="width:100%;border-collapse:collapse;">
                        <thead>
                            <tr style="background:#f8f9fa;">
                                <th style="padding:12px;text-align:left;font-size:13px;color:#666;font-weight:600;">Item</th>
                                <th style="padding:12px;text-align:right;font-size:13px;color:#666;font-weight:600;">Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="border-bottom:1px solid #f0f0f0;">
                                <td style="padding:12px;font-size:14px;">GPS Trackers (10 × ₦18,000)</td>
                                <td style="padding:12px;text-align:right;font-size:14px;">₦180,000</td>
                            </tr>
                            <tr style="border-bottom:1px solid #f0f0f0;">
                                <td style="padding:12px;font-size:14px;">Installation & SIM Cards</td>
                                <td style="padding:12px;text-align:right;font-size:14px;">₦30,000</td>
                            </tr>
                            <tr style="border-bottom:1px solid #f0f0f0;">
                                <td style="padding:12px;font-size:14px;">Custom Dashboard Setup</td>
                                <td style="padding:12px;text-align:right;font-size:14px;">₦120,000</td>
                            </tr>
                            <tr style="border-bottom:2px solid #e0e0e0;">
                                <td style="padding:12px;font-size:14px;">Server Setup & Configuration</td>
                                <td style="padding:12px;text-align:right;font-size:14px;">₦50,000</td>
                            </tr>
                            <tr style="background:#f8f9fa;">
                                <td style="padding:15px;font-size:16px;font-weight:bold;color:#2c3e50;">Initial Setup Total</td>
                                <td style="padding:15px;text-align:right;font-size:18px;font-weight:bold;color:#28a745;">₦380,000</td>
                            </tr>
                        </tbody>
                    </table>

                    <div style="margin-top:20px;padding:15px;background:#fff3cd;border-radius:6px;">
                        <h4 style="margin:0 0 10px 0;color:#856404;font-size:15px;">Monthly Running Costs</h4>
                        <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;">
                            <span>Data Plans (10 vehicles × ₦1,500)</span>
                            <span style="font-weight:600;">₦15,000/month</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;">
                            <span>Server Hosting</span>
                            <span style="font-weight:600;">₦8,000/month</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;padding-top:10px;border-top:2px solid #ffc107;font-size:16px;">
                            <strong>Total Monthly</strong>
                            <strong style="color:#856404;">₦23,000/month</strong>
                        </div>
                    </div>
                </div>

                <div style="background:linear-gradient(135deg,#28a745 0%,#20c997 100%);color:white;padding:25px;border-radius:12px;margin-bottom:20px;">
                    <h3 style="margin:0 0 15px 0;font-size:20px;">Compare: Commercial Solution</h3>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:15px;">
                        <div>
                            <div style="font-size:28px;font-weight:bold;margin-bottom:5px;">₦2,300,000</div>
                            <div style="opacity:0.9;font-size:14px;">First year cost (commercial)</div>
                        </div>
                        <div>
                            <div style="font-size:28px;font-weight:bold;margin-bottom:5px;">₦656,000</div>
                            <div style="opacity:0.9;font-size:14px;">First year cost (our solution)</div>
                        </div>
                    </div>
                    <div style="text-align:center;padding:15px;background:rgba(255,255,255,0.2);border-radius:6px;">
                        <div style="font-size:32px;font-weight:bold;margin-bottom:5px;">Save ₦1,644,000</div>
                        <div style="font-size:14px;">71% cost reduction in first year</div>
                    </div>
                </div>

                <div style="background:white;padding:25px;border-radius:8px;">
                    <h3 style="margin:0 0 20px 0;color:#2c3e50;font-size:18px;">Implementation Timeline</h3>
                    
                    <div style="position:relative;padding-left:30px;">
                        <div style="position:absolute;left:8px;top:0;bottom:0;width:2px;background:#e0e0e0;"></div>
                        
                        <div style="position:relative;margin-bottom:25px;">
                            <div style="position:absolute;left:-22px;width:16px;height:16px;background:#28a745;border-radius:50%;"></div>
                            <div style="background:#f8f9fa;padding:15px;border-radius:6px;">
                                <div style="font-weight:600;color:#2c3e50;margin-bottom:5px;">Week 1: Consultation & Design</div>
                                <div style="font-size:13px;color:#666;">Meet to understand requirements, design custom dashboard, order hardware</div>
                            </div>
                        </div>

                        <div style="position:relative;margin-bottom:25px;">
                            <div style="position:absolute;left:-22px;width:16px;height:16px;background:#28a745;border-radius:50%;"></div>
                            <div style="background:#f8f9fa;padding:15px;border-radius:6px;">
                                <div style="font-weight:600;color:#2c3e50;margin-bottom:5px;">Week 2: Server Setup</div>
                                <div style="font-size:13px;color:#666;">Configure backend server, setup API connections, prepare SIM cards</div>
                            </div>
                        </div>

                        <div style="position:relative;margin-bottom:25px;">
                            <div style="position:absolute;left:-22px;width:16px;height:16px;background:#28a745;border-radius:50%;"></div>
                            <div style="background:#f8f9fa;padding:15px;border-radius:6px;">
                                <div style="font-weight:600;color:#2c3e50;margin-bottom:5px;">Week 3: Installation & Testing</div>
                                <div style="font-size:13px;color:#666;">Install trackers in vehicles, test connections, verify data accuracy</div>
                            </div>
                        </div>

                        <div style="position:relative;">
                            <div style="position:absolute;left:-22px;width:16px;height:16px;background:#28a745;border-radius:50%;"></div>
                            <div style="background:#f8f9fa;padding:15px;border-radius:6px;">
                                <div style="font-weight:600;color:#2c3e50;margin-bottom:5px;">Week 4: Training & Launch</div>
                                <div style="font-size:13px;color:#666;">Train your team, configure alerts, go live with full monitoring</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="background:#e3f2fd;border:2px solid #1976d2;padding:25px;border-radius:12px;margin-top:25px;text-align:center;">
                    <h3 style="margin:0 0 15px 0;color:#1565c0;">Ready to Get Started?</h3>
                    <p style="margin:0 0 20px 0;color:#1976d2;font-size:14px;">Contact me for a detailed quote and free consultation</p>
                    <div style="display:flex;justify-content:center;gap:15px;flex-wrap:wrap;">
                        <a href="https://wa.me/2349024054758?text=I'm%20interested%20in%20the%20fleet%20tracking%20solution" target="_blank" style="display:inline-block;padding:12px 24px;background:#28a745;color:white;text-decoration:none;border-radius:6px;font-weight:600;">
                            WhatsApp: +234 902 405 4758
                        </a>
                        <a href="mailto:ekongmikpe@gmail.com" style="display:inline-block;padding:12px 24px;background:#1976d2;color:white;text-decoration:none;border-radius:6px;font-weight:600;">
                            Email: ekongmikpe@gmail.com
                        </a>
                    </div>
                </div>
            </div>
        `;
    },

    getStatusColor(status) {
        const colors = {
            'moving': '#28a745',
            'parked': '#6c757d',
            'idle': '#ffc107',
            'offline': '#dc3545'
        };
        return colors[status] || '#6c757d';
    },

    getAlertColor(severity) {
        const colors = {
            'critical': '#dc3545',
            'warning': '#ffc107',
            'alert': '#ff6b6b',
            'info': '#17a2b8'
        };
        return colors[severity] || '#17a2b8';
    },

    getAlertIcon(type) {
        const icons = {
            'speed': '⚡',
            'geofence': '📍',
            'fuel': '⛽',
            'offline': '📡',
            'idle': '⏸️'
        };
        return icons[type] || '🔔';
    }
};

// Register with AppRegistry
if (window.AppRegistry) {
    window.AppRegistry.registerApp({
        id: 'fleet-tracker',
        name: 'Fleet Tracker',
        icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' rx='8' fill='%231a3a52'/><path d='M24 12c-6 0-10 4-10 8s4 8 10 8 10-4 10-8-4-8-10-8z' fill='%2328a745'/><circle cx='24' cy='20' r='3' fill='white'/><path d='M20 30l-4 6h16l-4-6z' fill='white'/></svg>",
        handler: () => window.FleetTrackerApp.open(),
        singleInstance: true,
        documentation: {
            name: 'Fleet Tracker',
            version: '1.0',
            description: 'Professional GPS fleet tracking dashboard with real-time monitoring, trip history, and alerts (Demo UI)',
            type: 'hal',
            features: [
                'Live map with vehicle positions',
                'Fleet status overview',
                'Trip history and route playback',
                'Configurable alerts system',
                'Complete setup guide and pricing',
                'Hardware recommendations'
            ]
        }
    });
}

