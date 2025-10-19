/* ========================================
 * FILE: system/store/vibration-monitor.js
 * PURPOSE: Industrial Vibration Monitoring - Predictive Maintenance Dashboard
 * AUTHOR: Edmund Sparrow
 * VERSION: 1.0.0
 * CATEGORY: Industrial / Monitoring
 * THEME: Dark (Tech Blue)
 * ======================================== */

if (window.AppRegistry) {
    window.AppRegistry.registerApp({
        id: 'vibration-monitor',
        name: 'Vibration Monitor',
        icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' rx='8' fill='%231a1a2e'/><path d='M12 24 Q18 18 24 24 Q30 30 36 24' stroke='%23e74c3c' stroke-width='3' fill='none'/><path d='M12 32 Q18 26 24 32 Q30 38 36 32' stroke='%23f39c12' stroke-width='3' fill='none'/><circle cx='24' cy='16' r='3' fill='%2327ae60'/></svg>",
        handler: () => window.VibrationMonitor.open(),
        singleInstance: true
    });

    if (window.Docs && typeof window.Docs.registerDocumentation === 'function') {
        window.Docs.registerDocumentation('vibration-monitor', {
            name: "Industrial Vibration Monitor",
            version: "1.0.0",
            description: "Predictive maintenance dashboard for Bluetooth vibration sensors. Monitors rotating equipment to prevent unplanned downtime.",
            type: "Industrial App",
            features: [
                "Real-time vibration monitoring (RMS & peak velocity)",
                "Color-coded status indicators (Normal/Warning/Critical)",
                "Trend analysis and bearing condition assessment",
                "Filtering and sorting for quick triage",
                "Maintenance scheduling recommendations",
                "Multi-machine dashboard view"
            ],
            dependencies: ["WindowManager", "AppRegistry"],
            hardwareRequired: "Bluetooth vibration sensors (e.g., SKF QuickCollect, Fluke 3563, Schaeffler OPTIME)",
            roi: "Prevents unplanned downtime ($5K–50K per incident). Typical payback: 2–6 months.",
            thresholds: {
                normal: "RMS < 5.0 mm/s",
                warning: "RMS 5.0–8.0 mm/s",
                critical: "RMS > 8.0 mm/s"
            },
            notes: "Demo uses simulated data. Production deployment requires Bluetooth sensor integration via backend API.",
            kudos: "edmundsparrow.netlify.app",
            auto_generated: false
        });
    }
}

// Industrial Vibration Monitoring - Predictive Maintenance Dashboard
(function() {
    'use strict';

    const s = {
        card: "background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:16px",
        btn: "padding:10px 20px;border:none;border-radius:6px;font-weight:600;cursor:pointer;font-size:14px;transition:all 0.3s"
    };

    window.VibrationMonitor = {
        state: {
            machines: [
                { id: 'M1', name: 'Main Compressor', rms: 2.1, peak: 4.2, temp: 68, rpm: 3600, bearing: 'Good', status: 'normal', trend: 'stable' },
                { id: 'M2', name: 'Hydraulic Pump #1', rms: 5.8, peak: 12.3, temp: 82, rpm: 1800, bearing: 'Warning', status: 'warning', trend: 'rising' },
                { id: 'M3', name: 'Conveyor Motor A', rms: 1.8, peak: 3.5, temp: 65, rpm: 1200, bearing: 'Good', status: 'normal', trend: 'stable' },
                { id: 'M4', name: 'Cooling Fan #2', rms: 9.2, peak: 18.7, temp: 95, rpm: 900, bearing: 'Critical', status: 'critical', trend: 'rising' },
                { id: 'M5', name: 'Mixer Drive', rms: 3.4, peak: 7.1, temp: 72, rpm: 600, bearing: 'Good', status: 'normal', trend: 'stable' },
                { id: 'M6', name: 'Exhaust Blower', rms: 6.5, peak: 13.2, temp: 78, rpm: 2400, bearing: 'Warning', status: 'warning', trend: 'rising' }
            ],
            filter: 'all',
            sorting: 'status'
        },
        win: null,
        simTimer: null,

        open() {
            const html = `
                <div style="height:100%;display:flex;flex-direction:column;font-family:Inter,sans-serif;background:linear-gradient(135deg,#1a1a2e,#16213e,#0f3460);color:#ecf0f1;overflow:hidden">
                    <div style="padding:16px 20px;background:rgba(231,76,60,0.9);border-bottom:2px solid rgba(192,57,43,0.8);display:flex;justify-content:space-between;align-items:center">
                        <div>
                            <h2 style="margin:0;font-size:20px;color:#fff">Vibration Monitoring</h2>
                            <div style="font-size:12px;opacity:0.9">Predictive Maintenance System</div>
                        </div>
                        <div style="display:flex;gap:12px;align-items:center">
                            <span style="font-size:12px">Last Update: <span id="lastUpdate">--:--:--</span></span>
                            <div id="connStatus" style="width:10px;height:10px;border-radius:50%;background:#27ae60;box-shadow:0 0 8px #27ae60"></div>
                        </div>
                    </div>

                    <div style="flex:1;overflow-y:auto;padding:20px">
                        <!-- Summary Stats -->
                        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
                            <div style="${s.card}">
                                <div style="font-size:11px;opacity:0.7;margin-bottom:8px">TOTAL MACHINES</div>
                                <div style="font-size:32px;font-weight:700;color:#3498db" id="totalMachines">6</div>
                            </div>
                            <div style="${s.card}">
                                <div style="font-size:11px;opacity:0.7;margin-bottom:8px">NORMAL</div>
                                <div style="font-size:32px;font-weight:700;color:#27ae60" id="normalCount">3</div>
                            </div>
                            <div style="${s.card}">
                                <div style="font-size:11px;opacity:0.7;margin-bottom:8px">WARNING</div>
                                <div style="font-size:32px;font-weight:700;color:#f39c12" id="warningCount">2</div>
                            </div>
                            <div style="${s.card}">
                                <div style="font-size:11px;opacity:0.7;margin-bottom:8px">CRITICAL</div>
                                <div style="font-size:32px;font-weight:700;color:#e74c3c" id="criticalCount">1</div>
                            </div>
                        </div>

                        <!-- Filters & Controls -->
                        <div style="${s.card};margin-bottom:20px">
                            <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
                                <div style="display:flex;gap:8px">
                                    <button class="filter-btn active" data-filter="all" style="${s.btn};background:rgba(52,152,219,0.2);color:#3498db;border:1px solid #3498db">All</button>
                                    <button class="filter-btn" data-filter="normal" style="${s.btn};background:rgba(39,174,96,0.1);color:#27ae60;border:1px solid rgba(39,174,96,0.3)">Normal</button>
                                    <button class="filter-btn" data-filter="warning" style="${s.btn};background:rgba(243,156,18,0.1);color:#f39c12;border:1px solid rgba(243,156,18,0.3)">Warning</button>
                                    <button class="filter-btn" data-filter="critical" style="${s.btn};background:rgba(231,76,60,0.1);color:#e74c3c;border:1px solid rgba(231,76,60,0.3)">Critical</button>
                                </div>
                                <div style="display:flex;gap:8px">
                                    <select id="sortBy" style="padding:8px 12px;border:1px solid rgba(255,255,255,0.2);border-radius:6px;background:rgba(255,255,255,0.05);color:#ecf0f1;font-size:13px">
                                        <option value="status">Sort: Status</option>
                                        <option value="rms">Sort: RMS Level</option>
                                        <option value="name">Sort: Name</option>
                                    </select>
                                    <button id="simToggle" style="${s.btn};background:#3498db;color:white">Start Simulation</button>
                                </div>
                            </div>
                        </div>

                        <!-- Machine Grid -->
                        <div id="machineGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:16px"></div>
                    </div>

                    <div style="padding:12px 20px;background:rgba(0,0,0,0.3);border-top:1px solid rgba(255,255,255,0.1);font-size:12px;display:flex;justify-content:space-between">
                        <span>Bluetooth Connected: 6 sensors active</span>
                        <span id="status">System Ready</span>
                    </div>
                </div>
            `;

            this.win = window.WindowManager.createWindow('Vibration Monitor', html, 1100, 750);
            this.setup();
            this.render();
            return this.win;
        },

        setup() {
            const w = this.win;

            w.querySelectorAll('.filter-btn').forEach(btn => {
                btn.onclick = e => {
                    w.querySelectorAll('.filter-btn').forEach(b => {
                        b.style.background = b.dataset.filter === 'all' ? 'rgba(52,152,219,0.1)' : `rgba(${b.dataset.filter === 'normal' ? '39,174,96' : b.dataset.filter === 'warning' ? '243,156,18' : '231,76,60'},0.1)`;
                        b.classList.remove('active');
                    });
                    e.target.style.background = e.target.dataset.filter === 'all' ? 'rgba(52,152,219,0.2)' : `rgba(${e.target.dataset.filter === 'normal' ? '39,174,96' : e.target.dataset.filter === 'warning' ? '243,156,18' : '231,76,60'},0.2)`;
                    e.target.classList.add('active');
                    this.state.filter = e.target.dataset.filter;
                    this.render();
                };
            });

            w.querySelector('#sortBy').onchange = e => {
                this.state.sorting = e.target.value;
                this.render();
            };

            w.querySelector('#simToggle').onclick = () => this.toggleSim();
        },

        render() {
            const w = this.win;
            if (!w) return;

            let machines = [...this.state.machines];
            
            // Filter
            if (this.state.filter !== 'all') {
                machines = machines.filter(m => m.status === this.state.filter);
            }

            // Sort
            if (this.state.sorting === 'status') {
                const order = { critical: 0, warning: 1, normal: 2 };
                machines.sort((a, b) => order[a.status] - order[b.status]);
            } else if (this.state.sorting === 'rms') {
                machines.sort((a, b) => b.rms - a.rms);
            } else {
                machines.sort((a, b) => a.name.localeCompare(b.name));
            }

            // Update counts
            const counts = { normal: 0, warning: 0, critical: 0 };
            this.state.machines.forEach(m => counts[m.status]++);
            w.querySelector('#totalMachines').textContent = this.state.machines.length;
            w.querySelector('#normalCount').textContent = counts.normal;
            w.querySelector('#warningCount').textContent = counts.warning;
            w.querySelector('#criticalCount').textContent = counts.critical;

            // Render machines
            const grid = w.querySelector('#machineGrid');
            grid.innerHTML = machines.map(m => this.machineCard(m)).join('');

            // Update timestamp
            w.querySelector('#lastUpdate').textContent = new Date().toLocaleTimeString();
        },

        machineCard(m) {
            const colors = {
                normal: { bg: 'rgba(39,174,96,0.1)', border: '#27ae60', text: '#27ae60' },
                warning: { bg: 'rgba(243,156,18,0.1)', border: '#f39c12', text: '#f39c12' },
                critical: { bg: 'rgba(231,76,60,0.1)', border: '#e74c3c', text: '#e74c3c' }
            };
            const c = colors[m.status];

            return `
                <div style="${s.card};border-color:${c.border};background:${c.bg}">
                    <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">
                        <div>
                            <div style="font-weight:700;font-size:16px;color:#ecf0f1">${m.name}</div>
                            <div style="font-size:11px;opacity:0.6;margin-top:2px">${m.id} • ${m.rpm} RPM</div>
                        </div>
                        <div style="padding:4px 10px;background:${c.bg};border:1px solid ${c.border};border-radius:12px;font-size:11px;font-weight:600;color:${c.text};text-transform:uppercase">
                            ${m.status}
                        </div>
                    </div>

                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
                        <div>
                            <div style="font-size:10px;opacity:0.6;margin-bottom:4px">RMS VELOCITY</div>
                            <div style="font-size:24px;font-weight:700;color:${c.text}">${m.rms.toFixed(1)}</div>
                            <div style="font-size:10px;opacity:0.6">mm/s</div>
                        </div>
                        <div>
                            <div style="font-size:10px;opacity:0.6;margin-bottom:4px">PEAK VELOCITY</div>
                            <div style="font-size:24px;font-weight:700;color:${c.text}">${m.peak.toFixed(1)}</div>
                            <div style="font-size:10px;opacity:0.6">mm/s</div>
                        </div>
                    </div>

                    <div style="height:6px;background:rgba(0,0,0,0.3);border-radius:3px;margin-bottom:12px;overflow:hidden">
                        <div style="height:100%;width:${Math.min((m.rms / 10) * 100, 100)}%;background:${c.text};border-radius:3px;transition:width 0.5s"></div>
                    </div>

                    <div style="display:flex;justify-content:space-between;font-size:12px">
                        <div>
                            <span style="opacity:0.6">Temp:</span> <span style="font-weight:600">${m.temp}°C</span>
                        </div>
                        <div>
                            <span style="opacity:0.6">Bearing:</span> <span style="font-weight:600;color:${c.text}">${m.bearing}</span>
                        </div>
                        <div>
                            <span style="opacity:0.6">Trend:</span> <span style="font-weight:600">${m.trend === 'rising' ? '↗' : '→'}</span>
                        </div>
                    </div>

                    ${m.status === 'critical' ? `
                        <div style="margin-top:12px;padding:10px;background:rgba(231,76,60,0.2);border:1px solid #e74c3c;border-radius:6px;font-size:11px">
                            <strong>ACTION REQUIRED:</strong> Schedule immediate maintenance. Bearing failure imminent (2-4 weeks).
                        </div>
                    ` : m.status === 'warning' ? `
                        <div style="margin-top:12px;padding:10px;background:rgba(243,156,18,0.2);border:1px solid #f39c12;border-radius:6px;font-size:11px">
                            <strong>PLAN MAINTENANCE:</strong> Vibration trending upward. Schedule inspection within 30 days.
                        </div>
                    ` : ''}
                </div>
            `;
        },

        toggleSim() {
            if (this.simTimer) {
                clearInterval(this.simTimer);
                this.simTimer = null;
                this.win.querySelector('#simToggle').textContent = 'Start Simulation';
                this.win.querySelector('#status').textContent = 'System Ready';
            } else {
                this.simTimer = setInterval(() => {
                    this.state.machines.forEach(m => {
                        // Simulate vibration changes
                        const drift = (Math.random() - 0.5) * 0.3;
                        m.rms = Math.max(0.5, Math.min(12, m.rms + drift));
                        m.peak = m.rms * (1.8 + Math.random() * 0.4);
                        m.temp = Math.max(60, Math.min(100, m.temp + (Math.random() - 0.5) * 2));

                        // Update status based on thresholds
                        if (m.rms > 8) {
                            m.status = 'critical';
                            m.bearing = 'Critical';
                            m.trend = 'rising';
                        } else if (m.rms > 5) {
                            m.status = 'warning';
                            m.bearing = 'Warning';
                            m.trend = 'rising';
                        } else {
                            m.status = 'normal';
                            m.bearing = 'Good';
                            m.trend = 'stable';
                        }
                    });
                    this.render();
                }, 2000);
                this.win.querySelector('#simToggle').textContent = 'Stop Simulation';
                this.win.querySelector('#status').textContent = 'Simulation Running';
            }
        }
    };

    if (window.AppRegistry) {
        window.AppRegistry.registerApp({
            id: 'vibration-monitor',
            name: 'Vibration Monitor',
            icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' rx='8' fill='%231a1a2e'/><path d='M12 24 Q18 18 24 24 Q30 30 36 24' stroke='%23e74c3c' stroke-width='3' fill='none'/><path d='M12 32 Q18 26 24 32 Q30 38 36 32' stroke='%23f39c12' stroke-width='3' fill='none'/><circle cx='24' cy='16' r='3' fill='%2327ae60'/></svg>",
            handler: () => window.VibrationMonitor.open(),
            singleInstance: true
        });

        if (window.Docs && typeof window.Docs.registerDocumentation === 'function') {
            window.Docs.registerDocumentation('vibration-monitor', {
                name: "Industrial Vibration Monitor",
                version: "1.0.0",
                description: "Predictive maintenance dashboard for Bluetooth vibration sensors. Monitors rotating equipment to prevent unplanned downtime.",
                type: "Industrial App",
                features: [
                    "Real-time vibration monitoring (RMS & peak velocity)",
                    "Color-coded status indicators (Normal/Warning/Critical)",
                    "Trend analysis and bearing condition assessment",
                    "Filtering and sorting for quick triage",
                    "Maintenance scheduling recommendations",
                    "Multi-machine dashboard view"
                ],
                dependencies: ["WindowManager", "AppRegistry"],
                hardwareRequired: "Bluetooth vibration sensors (e.g., SKF QuickCollect, Fluke 3563, Schaeffler OPTIME)",
                roi: "Prevents unplanned downtime ($5K-50K per incident). Typical payback: 2-6 months.",
                thresholds: {
                    normal: "RMS < 5.0 mm/s",
                    warning: "RMS 5.0-8.0 mm/s",
                    critical: "RMS > 8.0 mm/s"
                },
                notes: "Demo uses simulated data. Production deployment requires Bluetooth sensor integration via backend API.",
                kudos: "edmundsparrow.netlify.app",
                auto_generated: false
            });
        }
    }
})();

