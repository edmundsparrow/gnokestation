// irrigation.js - Smart Irrigation Controller
(function() {
    window.IrrigationController = {
        zones: [],
        schedules: [],
        activeZone: null,
        refreshInterval: null,

        open() {
            const html = `
                <div style="height:100%;display:flex;flex-direction:column;font-family:'Segoe UI',sans-serif;background:#0a2e0a;color:#e0e0e0;">
                    
                    <!-- Header -->
                    <div style="padding:16px;background:#1a4d1a;border-bottom:2px solid #4caf50;">
                        <h2 style="margin:0 0 8px 0;color:#81c784;">Smart Irrigation System</h2>
                        <div style="font-size:13px;color:#aed581;">Zone control • Moisture monitoring • Schedule management</div>
                    </div>

                    <!-- Main Content -->
                    <div style="flex:1;overflow-y:auto;padding:16px;">
                        
                        <!-- System Overview -->
                        <div style="background:#1a4d1a;border-radius:8px;padding:16px;margin-bottom:16px;border:1px solid #2e7d32;">
                            <h3 style="margin:0 0 12px 0;color:#81c784;font-size:16px;">System Status</h3>
                            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
                                <div style="background:#0a2e0a;padding:12px;border-radius:6px;">
                                    <div style="font-size:11px;color:#aed581;">Water Pressure</div>
                                    <div style="font-size:20px;font-weight:700;color:#fff;" id="pressure">--</div>
                                </div>
                                <div style="background:#0a2e0a;padding:12px;border-radius:6px;">
                                    <div style="font-size:11px;color:#aed581;">Flow Rate</div>
                                    <div style="font-size:20px;font-weight:700;color:#fff;" id="flow-rate">--</div>
                                </div>
                                <div style="background:#0a2e0a;padding:12px;border-radius:6px;">
                                    <div style="font-size:11px;color:#aed581;">Daily Usage</div>
                                    <div style="font-size:20px;font-weight:700;color:#fff;" id="daily-usage">--</div>
                                </div>
                            </div>
                        </div>

                        <!-- Zone Control -->
                        <div style="background:#1a4d1a;border-radius:8px;padding:16px;margin-bottom:16px;border:1px solid #2e7d32;">
                            <h3 style="margin:0 0 12px 0;color:#81c784;font-size:16px;">Irrigation Zones</h3>
                            <div id="zones-container"></div>
                        </div>

                        <!-- Schedules -->
                        <div style="background:#1a4d1a;border-radius:8px;padding:16px;border:1px solid #2e7d32;">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                                <h3 style="margin:0;color:#81c784;font-size:16px;">Irrigation Schedules</h3>
                                <button id="add-schedule-btn" style="padding:6px 12px;background:#4caf50;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;">
                                    + Add Schedule
                                </button>
                            </div>
                            <div id="schedules-container"></div>
                        </div>

                    </div>

                    <!-- Footer -->
                    <div style="padding:12px;background:#1a4d1a;border-top:1px solid #2e7d32;display:flex;justify-content:space-between;align-items:center;">
                        <div style="font-size:11px;color:#666;">Last updated: <span id="last-update">--</span></div>
                        <button id="refresh-btn" style="padding:6px 12px;background:#4caf50;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;">
                            Refresh Data
                        </button>
                    </div>

                </div>
            `;

            const win = window.WindowManager.createWindow('Irrigation Controller', html, 550, 700);
            this.setupHandlers(win);
            this.fetchSystemData(win);
            return win;
        },

        setupHandlers(win) {
            const refreshBtn = win.querySelector('#refresh-btn');
            const addScheduleBtn = win.querySelector('#add-schedule-btn');

            refreshBtn.addEventListener('click', () => this.fetchSystemData(win));
            addScheduleBtn.addEventListener('click', () => this.showAddScheduleDialog(win));

            // Auto-refresh every 10 seconds
            this.refreshInterval = setInterval(() => this.fetchSystemData(win), 10000);

            // Cleanup on window close
            win.addEventListener('close', () => {
                if (this.refreshInterval) clearInterval(this.refreshInterval);
            });
        },

        async fetchSystemData(win) {
            try {
                // Real API call - replace with your HAL endpoint
                const response = await fetch('/api/irrigation/status');
                const data = await response.json();
                
                this.updateSystemStatus(win, data);
                this.renderZones(win, data.zones);
                this.renderSchedules(win, data.schedules);
                
                win.querySelector('#last-update').textContent = new Date().toLocaleTimeString();
                
            } catch (error) {
                console.error('Failed to fetch irrigation data:', error);
                this.showError(win, 'Cannot connect to irrigation system. Check HAL backend.');
            }
        },

        updateSystemStatus(win, data) {
            win.querySelector('#pressure').textContent = data.pressure + ' PSI';
            win.querySelector('#flow-rate').textContent = data.flowRate + ' GPM';
            win.querySelector('#daily-usage').textContent = data.dailyUsage + ' gal';
        },

        renderZones(win, zones) {
            const container = win.querySelector('#zones-container');
            
            container.innerHTML = zones.map(zone => {
                const isActive = zone.status === 'running';
                const statusColor = isActive ? '#4caf50' : zone.status === 'scheduled' ? '#ffc107' : '#666';
                
                return `
                    <div style="background:#0a2e0a;padding:12px;border-radius:6px;margin-bottom:8px;border-left:4px solid ${statusColor};">
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <div style="flex:1;">
                                <div style="font-weight:600;margin-bottom:4px;">${zone.name}</div>
                                <div style="font-size:12px;color:#aed581;">
                                    Moisture: ${zone.moisture}% • 
                                    ${zone.status === 'running' ? 'Time left: ' + zone.timeRemaining : 'Status: ' + zone.status}
                                </div>
                            </div>
                            <div style="display:flex;gap:6px;">
                                <button class="zone-btn" data-zone="${zone.id}" data-action="start" 
                                    style="padding:6px 12px;background:${isActive ? '#dc3545' : '#4caf50'};color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;">
                                    ${isActive ? 'Stop' : 'Start'}
                                </button>
                                <button class="zone-btn" data-zone="${zone.id}" data-action="config" 
                                    style="padding:6px 12px;background:#666;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;">
                                    ⚙
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            // Attach event listeners
            container.querySelectorAll('.zone-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const zoneId = btn.dataset.zone;
                    const action = btn.dataset.action;
                    
                    if (action === 'start') {
                        this.toggleZone(win, zoneId);
                    } else {
                        this.showZoneConfig(win, zoneId);
                    }
                });
            });
        },

        renderSchedules(win, schedules) {
            const container = win.querySelector('#schedules-container');
            
            if (!schedules || schedules.length === 0) {
                container.innerHTML = '<div style="color:#666;font-size:13px;text-align:center;padding:20px;">No schedules configured</div>';
                return;
            }

            container.innerHTML = schedules.map(schedule => `
                <div style="background:#0a2e0a;padding:10px;border-radius:6px;margin-bottom:6px;font-size:13px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <strong>${schedule.zoneName}</strong> • ${schedule.time} • ${schedule.duration} min
                            <div style="font-size:11px;color:#aed581;">${schedule.days.join(', ')}</div>
                        </div>
                        <button class="delete-schedule-btn" data-schedule="${schedule.id}" 
                            style="padding:4px 8px;background:#dc3545;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:11px;">
                            Delete
                        </button>
                    </div>
                </div>
            `).join('');

            container.querySelectorAll('.delete-schedule-btn').forEach(btn => {
                btn.addEventListener('click', () => this.deleteSchedule(win, btn.dataset.schedule));
            });
        },

        async toggleZone(win, zoneId) {
            try {
                // Real API call
                const response = await fetch('/api/irrigation/zones/' + zoneId + '/toggle', {
                    method: 'POST'
                });
                
                if (response.ok) {
                    this.fetchSystemData(win);
                }
            } catch (error) {
                this.showError(win, 'Failed to toggle zone: ' + error.message);
            }
        },

        showZoneConfig(win, zoneId) {
            // TODO: Show configuration dialog for zone settings
            alert('Zone configuration dialog - integrate with your HAL backend');
        },

        showAddScheduleDialog(win) {
            // TODO: Show schedule creation dialog
            alert('Add schedule dialog - integrate with your HAL backend');
        },

        async deleteSchedule(win, scheduleId) {
            if (!confirm('Delete this schedule?')) return;
            
            try {
                await fetch('/api/irrigation/schedules/' + scheduleId, {
                    method: 'DELETE'
                });
                this.fetchSystemData(win);
            } catch (error) {
                this.showError(win, 'Failed to delete schedule');
            }
        },

        showError(win, message) {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position:absolute;top:70px;right:16px;background:#dc3545;color:#fff;
                padding:12px 16px;border-radius:4px;font-size:13px;z-index:1000;
                box-shadow:0 4px 12px rgba(0,0,0,0.3);
            `;
            notification.textContent = message;
            win.appendChild(notification);
            setTimeout(() => notification.remove(), 4000);
        }
    };

    if (window.AppRegistry) {
        window.AppRegistry.registerApp({
            id: 'irrigation-controller',
            name: 'Irrigation Controller',
            icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' rx='8' fill='%234caf50'/><path d='M24 10 L24 20 M20 14 L24 20 L28 14' stroke='white' stroke-width='2' fill='none'/><circle cx='24' cy='32' r='6' fill='%2381c784'/></svg>",
            handler: () => window.IrrigationController.open(),
            singleInstance: true
        });
    }
})();

