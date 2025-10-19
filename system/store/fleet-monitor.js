// fleet-monitor.js - Fleet Tracking Dashboard
// VERSION: 2.0.0 (MODERN UI)
// BUILD DATE: 2025-10-02
//
// PURPOSE:
//   Monitor vehicle fleet locations, status, and alerts with modern glassmorphism UI.
//   Supports both DEMO simulation and real API mode (e.g., Traccar).
//
// AUTHOR: Gnokestation

(function(){
  window.FleetMonitorApp = {
    metadata: {
      name: 'Fleet Monitor',
      version: '2.0.0',
      icon: '🚗',
      author: 'Gnokestation',
      description: 'Real-time fleet tracking and monitoring (Demo + API)'
    },

    state: {
      vehicles: [],
      selectedVehicle: null,
      view: 'list', // 'list', 'detail', 'settings'
      alerts: [],
      updateInterval: null,
      currentWindow: null,
      filter: 'all',
      mode: 'simulation', // "simulation" or "api"
      api: {
        baseUrl: "http://localhost:8082/api",
        username: "demo",
        password: "demo"
      }
    },

    // --- Load saved config ---
    loadConfig() {
      try {
        const saved = JSON.parse(localStorage.getItem("fleetConfig"));
        if (saved) {
          this.state.mode = saved.mode || "simulation";
          this.state.api = saved.api || this.state.api;
        }
      } catch (e) {
        console.warn("No saved config, using defaults");
      }
    },

    saveConfig() {
      localStorage.setItem("fleetConfig", JSON.stringify({
        mode: this.state.mode,
        api: this.state.api
      }));
    },

    // --- Core Window Management ---
    open() {
      this.loadConfig();
      const monitorHTML = `<div id="fleet-app-container" style="display:flex;flex-direction:column;height:100%;"></div>`;
      const win = window.WindowManager.createWindow('Fleet Monitor', monitorHTML, 550, 700);
      this.state.currentWindow = win;

      if (window.EventBus) {
        const cleanup = (data) => {
          if (data.windowId === win.id) {
            this.cleanup();
            window.EventBus.off('window-closed', cleanup);
          }
        };
        window.EventBus.on('window-closed', cleanup);
      }

      this.init(win.querySelector('#fleet-app-container'));
      return win;
    },

    init(container) {
      this.container = container;
      if (this.state.mode === 'simulation') {
        this.initializeFleet();
        this.startSimulation();
      } else {
        this.startApiPolling();
      }
      this.render();
    },

    cleanup() {
      this.stopSimulation();
      if (this.container) this.container.innerHTML = '';
      this.state.currentWindow = null;
    },

    // --- DEMO Fleet Data ---
    initializeFleet() {
      this.state.vehicles = [
        { id: 'V001', name: 'Delivery Van 1', driver: 'John Smith', status: 'moving',
          location: { lat: 6.5244, lng: 3.3792, address: 'Victoria Island, Lagos' },
          speed: 45, fuel: 68, battery: 85, lastUpdate: new Date(), odometer: 45820, route: [] },
        { id: 'V002', name: 'Cargo Truck 1', driver: 'Mary Johnson', status: 'idle',
          location: { lat: 6.4541, lng: 3.3947, address: 'Ikeja, Lagos' },
          speed: 0, fuel: 82, battery: 92, lastUpdate: new Date(), odometer: 72340, route: [] },
        { id: 'V003', name: 'Service Van 2', driver: 'David Wilson', status: 'moving',
          location: { lat: 6.4698, lng: 3.5852, address: 'Lekki, Lagos' },
          speed: 62, fuel: 45, battery: 50, lastUpdate: new Date(), odometer: 38920, route: [] }
      ];
    },

    // --- Simulation ---
    startSimulation() {
      this.stopSimulation();
      this.state.updateInterval = setInterval(() => {
        this.simulateVehicleMovement();
        this.checkAlerts();
        if (this.state.view !== 'settings') {
          this.render();
        }
      }, 3000);
    },

    stopSimulation() {
      if (this.state.updateInterval) {
        clearInterval(this.state.updateInterval);
        this.state.updateInterval = null;
      }
    },

    simulateVehicleMovement() {
      this.state.vehicles.forEach(vehicle => {
        if (vehicle.status === 'moving') {
          vehicle.location.lat += (Math.random() - 0.5) * 0.002;
          vehicle.location.lng += (Math.random() - 0.5) * 0.002;
          vehicle.speed = Math.max(0, Math.min(80, vehicle.speed + (Math.random() - 0.5) * 10));
          vehicle.fuel = Math.max(0, vehicle.fuel - 0.2);
          vehicle.battery = Math.max(0, vehicle.battery - 0.1);
          vehicle.odometer += (vehicle.speed / 60) * 0.05;
          vehicle.lastUpdate = new Date();
        }
      });
    },

    // --- API Mode ---
    async fetchFleetFromApi() {
      try {
        const authHeader = "Basic " + btoa(this.state.api.username + ":" + this.state.api.password);
        const res = await fetch(this.state.api.baseUrl + "/devices", {
          headers: { "Authorization": authHeader }
        });
        if (!res.ok) throw new Error("API error " + res.status);
        const devices = await res.json();

        this.state.vehicles = devices.map(d => ({
          id: d.id,
          name: d.name || `Vehicle ${d.id}`,
          driver: d.category || "Unknown",
          status: d.status || "offline",
          location: { lat: d.latitude || 0, lng: d.longitude || 0, address: d.address || "N/A" },
          speed: d.speed || 0,
          fuel: d.attributes?.fuel || 100,
          battery: d.attributes?.battery || 100,
          odometer: d.attributes?.odometer || 0,
          lastUpdate: new Date(d.lastUpdate || Date.now()),
          route: []
        }));

        this.checkAlerts();
        if (this.state.view !== 'settings') {
          this.render();
        }
      } catch (err) {
        console.error("Fleet API fetch failed:", err);
      }
    },

    startApiPolling() {
      this.stopSimulation();
      this.fetchFleetFromApi();
      this.state.updateInterval = setInterval(() => {
        if (this.state.view !== 'settings') {
          this.fetchFleetFromApi();
        }
      }, 5000);
    },

    // --- Alerts ---
    checkAlerts() {
      const newAlerts = [];
      this.state.vehicles.forEach(vehicle => {
        if (vehicle.fuel < 20) {
          newAlerts.push({ id: `fuel-${vehicle.id}`, vehicleId: vehicle.id, type: 'fuel',
            severity: 'high', message: `${vehicle.name}: Low fuel (${vehicle.fuel.toFixed(0)}%)`,
            timestamp: new Date() });
        }
        if (vehicle.speed > 70) {
          newAlerts.push({ id: `speed-${vehicle.id}`, vehicleId: vehicle.id, type: 'speed',
            severity: 'medium', message: `${vehicle.name}: Speeding (${vehicle.speed.toFixed(0)} km/h)`,
            timestamp: new Date() });
        }
      });
      this.state.alerts = newAlerts;
    },

    // --- Helper Functions ---
    getBatteryColor(level) {
      if (level > 60) return { bg: 'rgba(34, 197, 94, 0.2)', text: '#22c55e', border: '#22c55e' };
      if (level > 30) return { bg: 'rgba(234, 179, 8, 0.2)', text: '#eab308', border: '#eab308' };
      return { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444', border: '#ef4444' };
    },

    getStatusColor(status) {
      if (status === 'moving') return { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6' };
      if (status === 'idle') return { bg: 'rgba(234, 179, 8, 0.2)', text: '#eab308' };
      return { bg: 'rgba(107, 114, 128, 0.2)', text: '#6b7280' };
    },

    getSpeedColor(speed) {
      if (speed > 70) return { bg: 'rgba(168, 85, 247, 0.2)', text: '#a855f7' };
      if (speed > 40) return { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6' };
      return { bg: 'rgba(107, 114, 128, 0.2)', text: '#6b7280' };
    },

    // --- Rendering ---
    render() {
      if (!this.container) return;

      this.container.innerHTML = `
        <div style="display:flex;flex-direction:column;height:100%;background:linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);color:#e2e8f0;font-family:system-ui;overflow:hidden;">
          ${this.renderHeader()}
          ${this.state.view === 'list' ? this.renderList() : 
            this.state.view === 'settings' ? this.renderSettings() : 
            this.renderDetail()}
        </div>
      `;

      this.attachEventListeners();
    },

    renderHeader() {
      return `
        <div style="background:rgba(30, 41, 59, 0.6);backdrop-filter:blur(10px);padding:20px;border-bottom:1px solid rgba(255,255,255,0.1);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <h2 style="margin:0;font-size:24px;font-weight:700;">🚗 Fleet Monitor</h2>
            <div style="display:flex;gap:8px;">
              ${this.state.view !== 'list' ? `
                <button data-action="back-to-list" style="background:rgba(59, 130, 246, 0.2);color:#3b82f6;border:1px solid rgba(59, 130, 246, 0.3);padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;backdrop-filter:blur(10px);transition:all 0.3s;">
                  ← Back
                </button>
              ` : ''}
              ${this.state.view !== 'settings' ? `
                <button data-action="settings" style="background:rgba(59, 130, 246, 0.2);color:#3b82f6;border:1px solid rgba(59, 130, 246, 0.3);padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;backdrop-filter:blur(10px);transition:all 0.3s;">
                  ⚙️ Settings
                </button>
              ` : ''}
            </div>
          </div>
          <div style="font-size:12px;color:#94a3b8;">
            Mode: <span style="color:#3b82f6;font-weight:600;">${this.state.mode}</span>
            ${this.state.vehicles.length > 0 ? ` • ${this.state.vehicles.length} vehicles` : ''}
          </div>
        </div>
      `;
    },

    renderList() {
      return `
        <div style="flex:1;overflow-y:auto;padding:20px;">
          ${this.state.vehicles.map(v => `
            <div data-action="select-vehicle" data-vehicle-id="${v.id}" 
              style="background:rgba(30, 41, 59, 0.4);backdrop-filter:blur(10px);padding:16px;margin-bottom:12px;border-radius:16px;cursor:pointer;border:1px solid rgba(255,255,255,0.1);transition:all 0.3s;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <div>
                  <div style="font-size:18px;font-weight:700;margin-bottom:4px;">${v.name}</div>
                  <div style="font-size:13px;color:#94a3b8;">👤 ${v.driver}</div>
                </div>
                <div style="background:${this.getStatusColor(v.status).bg};color:${this.getStatusColor(v.status).text};padding:6px 12px;border-radius:8px;font-size:11px;font-weight:600;text-transform:uppercase;">
                  ${v.status}
                </div>
              </div>
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
                ${this.renderMiniMetric('🔋', `${v.battery?.toFixed(0) || 0}%`, this.getBatteryColor(v.battery || 0))}
                ${this.renderMiniMetric('📍', v.location.address.split(',')[0], { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6' })}
                ${this.renderMiniMetric('⚡', `${v.speed.toFixed(0)} km/h`, this.getSpeedColor(v.speed))}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    },

    renderMiniMetric(icon, value, colors) {
      return `
        <div style="background:${colors.bg};padding:8px;border-radius:8px;text-align:center;">
          <div style="font-size:16px;margin-bottom:2px;">${icon}</div>
          <div style="font-size:11px;color:${colors.text};font-weight:600;">${value}</div>
        </div>
      `;
    },

    renderDetail() {
      const vehicle = this.state.vehicles.find(v => v.id === this.state.selectedVehicle);
      if (!vehicle) return '<div style="padding:20px;">Vehicle not found</div>';
      
      const batteryColors = this.getBatteryColor(vehicle.battery || 0);
      const speedColors = this.getSpeedColor(vehicle.speed);
      const statusColors = this.getStatusColor(vehicle.status);

      return `
        <div style="flex:1;overflow-y:auto;padding:20px;">
          <div style="background:rgba(30, 41, 59, 0.4);backdrop-filter:blur(10px);border-radius:20px;padding:20px;border:1px solid rgba(255,255,255,0.1);margin-bottom:16px;">
            <h3 style="margin:0 0 12px 0;font-size:24px;font-weight:700;">${vehicle.name}</h3>
            <div style="display:flex;gap:12px;align-items:center;margin-bottom:8px;">
              <span style="font-size:14px;color:#94a3b8;">👤 ${vehicle.driver}</span>
              <span style="background:${statusColors.bg};color:${statusColors.text};padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;text-transform:uppercase;">
                ${vehicle.status}
              </span>
            </div>
            <div style="font-size:12px;color:#64748b;">Last update: ${new Date(vehicle.lastUpdate).toLocaleTimeString()}</div>
          </div>

          ${this.renderMetricCard('🔋', 'Battery Level', `${(vehicle.battery || 0).toFixed(0)}%`, batteryColors, vehicle.battery || 0)}
          ${this.renderMetricCard('📍', 'Location', vehicle.location.address, { bg: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6', border: '#3b82f6' }, null)}
          ${this.renderMetricCard('⚡', 'Speed', `${vehicle.speed.toFixed(0)}`, speedColors, null, 'km/h')}
          ${this.renderMetricCard('⛽', 'Fuel Level', `${vehicle.fuel.toFixed(0)}%`, this.getBatteryColor(vehicle.fuel), vehicle.fuel)}
          ${this.renderMetricCard('🛣️', 'Odometer', `${vehicle.odometer.toFixed(1)}`, { bg: 'rgba(107, 114, 128, 0.2)', text: '#9ca3af', border: '#9ca3af' }, null, 'km')}
        </div>
      `;
    },

    renderMetricCard(icon, label, value, colors, progressValue, unit) {
      return `
        <div style="background:rgba(30, 41, 59, 0.4);backdrop-filter:blur(10px);border-radius:16px;padding:16px;margin-bottom:12px;border:1px solid rgba(255,255,255,0.1);transition:all 0.3s;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:12px;flex:1;">
              <div style="background:${colors.bg};padding:12px;border-radius:12px;font-size:24px;">
                ${icon}
              </div>
              <div style="flex:1;">
                <div style="color:#94a3b8;font-size:12px;margin-bottom:4px;">${label}</div>
                <div style="color:${colors.text};font-size:22px;font-weight:700;">
                  ${value}${unit ? `<span style="font-size:14px;margin-left:4px;color:#94a3b8;">${unit}</span>` : ''}
                </div>
              </div>
            </div>
            ${progressValue !== null ? `
              <div style="width:56px;height:56px;border-radius:50%;border:4px solid ${colors.border};display:flex;align-items:center;justify-content:center;position:relative;">
                <span style="color:${colors.text};font-weight:700;font-size:14px;">${progressValue.toFixed(0)}</span>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    },

    renderSettings() {
      return `
        <div style="padding:20px;flex:1;overflow-y:auto;">
          <div style="background:rgba(30, 41, 59, 0.4);backdrop-filter:blur(10px);border-radius:20px;padding:24px;border:1px solid rgba(255,255,255,0.1);">
            <h3 style="margin:0 0 24px 0;font-size:20px;font-weight:700;color:#3b82f6;">⚙️ Fleet Monitor Settings</h3>
            
            <div style="margin-bottom:20px;">
              <label style="display:block;margin-bottom:8px;font-weight:600;font-size:14px;">Data Source Mode:</label>
              <select data-config="mode" style="width:100%;padding:12px;border:1px solid rgba(255,255,255,0.1);border-radius:10px;background:rgba(15, 23, 42, 0.6);color:#e2e8f0;font-size:14px;cursor:pointer;">
                <option value="simulation" ${this.state.mode === "simulation" ? "selected" : ""}>🎮 Simulation (Demo)</option>
                <option value="api" ${this.state.mode === "api" ? "selected" : ""}>🔌 Real API (Traccar)</option>
              </select>
              <div style="margin-top:6px;font-size:12px;color:#94a3b8;">Choose between demo data or real hardware API</div>
            </div>

            <div style="margin-bottom:20px;">
              <label style="display:block;margin-bottom:8px;font-weight:600;font-size:14px;">API Base URL:</label>
              <input data-config="url" type="text" value="${this.state.api.baseUrl}" 
                style="width:100%;padding:12px;border:1px solid rgba(255,255,255,0.1);border-radius:10px;background:rgba(15, 23, 42, 0.6);color:#e2e8f0;font-size:14px;"
                placeholder="http://localhost:8082/api">
              <div style="margin-top:6px;font-size:12px;color:#94a3b8;">Example: http://your-server:8082/api</div>
            </div>

            <div style="margin-bottom:20px;">
              <label style="display:block;margin-bottom:8px;font-weight:600;font-size:14px;">API Username:</label>
              <input data-config="username" type="text" value="${this.state.api.username}" 
                style="width:100%;padding:12px;border:1px solid rgba(255,255,255,0.1);border-radius:10px;background:rgba(15, 23, 42, 0.6);color:#e2e8f0;font-size:14px;"
                placeholder="demo">
            </div>

            <div style="margin-bottom:30px;">
              <label style="display:block;margin-bottom:8px;font-weight:600;font-size:14px;">API Password:</label>
              <input data-config="password" type="password" value="${this.state.api.password}" 
                style="width:100%;padding:12px;border:1px solid rgba(255,255,255,0.1);border-radius:10px;background:rgba(15, 23, 42, 0.6);color:#e2e8f0;font-size:14px;"
                placeholder="demo">
            </div>

            <button data-action="save-config" style="width:100%;background:linear-gradient(135deg, #10b981 0%, #059669 100%);color:white;padding:14px 16px;border:none;border-radius:10px;cursor:pointer;font-size:14px;font-weight:700;transition:all 0.3s;box-shadow:0 4px 12px rgba(16, 185, 129, 0.3);">
              💾 Save Configuration & Apply
            </button>

            <div style="margin-top:20px;padding:16px;background:rgba(59, 130, 246, 0.1);border-left:4px solid #3b82f6;border-radius:10px;">
              <div style="font-size:13px;line-height:1.6;color:#cbd5e1;">
                <strong>Note:</strong> After saving, the app will restart with your new configuration. 
                For API mode, ensure your Traccar or compatible server is accessible at the specified URL.
              </div>
            </div>
          </div>
        </div>
      `;
    },

    attachEventListeners() {
      const settingsBtn = this.container.querySelector('[data-action="settings"]');
      if (settingsBtn) {
        settingsBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.state.view = 'settings';
          this.render();
        });
      }

      const backBtn = this.container.querySelector('[data-action="back-to-list"]');
      if (backBtn) {
        backBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.state.view = 'list';
          this.state.selectedVehicle = null;
          this.render();
        });
      }

      const saveBtn = this.container.querySelector('[data-action="save-config"]');
      if (saveBtn) {
        saveBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const modeSelect = this.container.querySelector('[data-config="mode"]');
          const urlInput = this.container.querySelector('[data-config="url"]');
          const usernameInput = this.container.querySelector('[data-config="username"]');
          const passwordInput = this.container.querySelector('[data-config="password"]');

          this.state.mode = modeSelect.value;
          this.state.api.baseUrl = urlInput.value.trim();
          this.state.api.username = usernameInput.value.trim();
          this.state.api.password = passwordInput.value;

          this.saveConfig();
          this.stopSimulation();

          if (this.state.mode === 'simulation') {
            this.initializeFleet();
            this.startSimulation();
          } else {
            this.startApiPolling();
          }

          this.state.view = 'list';
          this.render();
          this.showNotification('✅ Configuration saved and applied successfully!');
        });
      }

      this.container.querySelectorAll('[data-action="select-vehicle"]').forEach(card => {
        card.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.state.selectedVehicle = card.dataset.vehicleId;
          this.state.view = 'detail';
          this.render();
        });
      });

      // Add hover effects
      this.container.querySelectorAll('[data-action="select-vehicle"]').forEach(card => {
        card.addEventListener('mouseenter', (e) => {
          e.target.style.background = 'rgba(30, 41, 59, 0.6)';
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
        });
        card.addEventListener('mouseleave', (e) => {
          e.target.style.background = 'rgba(30, 41, 59, 0.4)';
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = 'none';
        });
      });
    },

    showNotification(message) {
      const notification = document.createElement('div');
      notification.style.cssText = 'position:fixed;top:20px;right:20px;background:linear-gradient(135deg, #10b981 0%, #059669 100%);color:white;padding:16px 24px;border-radius:12px;box-shadow:0 8px 24px rgba(16, 185, 129, 0.4);z-index:10000;font-size:14px;font-weight:600;backdrop-filter:blur(10px);';
      notification.textContent = message;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }
  };

  if (window.AppRegistry) {
    window.AppRegistry.registerApp({
      id: 'fleet-monitor',
      name: 'Fleet Monitor',
      icon: "🚗",
      handler: () => window.FleetMonitorApp.open(),
      singleInstance: true
    });
  }
})();