// solar-hmi.js - Solar Energy Management System (SEMS)
// VERSION: 2.0.0 (MODERN UI)
// BUILD DATE: 2025-10-03
//
// PURPOSE:
//   Complete solar energy monitoring and control interface with modern glassmorphism UI
//   Integrates with HAL backend for real-time data (Modbus/TCP, WebSocket)

(function(){
  window.SolarHMIApp = {
    metadata: {
      name: 'Solar HMI',
      version: '2.0.0',
      icon: '☀️',
      author: 'Gnokestation',
      description: 'Solar Energy Management System Interface'
    },

    state: {
      currentWindow: null,
      updateInterval: null,
      activeTab: 'flow',
      // System State (Simulated Tags from HAL Backend)
      TAG_SOLAR_KW: 0,
      TAG_LOAD_KW: 0,
      TAG_GRID_FLOW: 0,
      TAG_BATT_SOC: 50,
      TAG_BATT_AMPS: 0,
      TAG_BATT_TEMP: 25.5,
      TAG_PORT_AC1_STAT: true,
      TAG_PORT_USB_STAT: false,
      TAG_BATT_SOH_PCT: 95,
      TAG_BATT_CYCLES: 450,
      SET_LOW_BATT_WARN: 30,
      SET_EMS_MODE: 1,
      CMD_SYSTEM_ON_OFF: true,
      LOG_SOLAR_KWH_DAILY: 15.5,
      LOG_LOAD_KWH_DAILY: 12.0,
      USER_GRID_RATE: 0.15
    },

    // --- Core Window Management ---
    open() {
      const solarHTML = `<div id="solar-app-container" style="display:flex;flex-direction:column;height:100%;"></div>`;
      const win = window.WindowManager.createWindow('Solar HMI', solarHTML, 650, 750);
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

      this.init(win.querySelector('#solar-app-container'));
      return win;
    },

    init(container) {
      this.container = container;
      this.fetchRealtimeData();
      this.render();
      this.startDataUpdates();
    },

    cleanup() {
      if (this.state.updateInterval) {
        clearInterval(this.state.updateInterval);
        this.state.updateInterval = null;
      }
      if (this.container) this.container.innerHTML = '';
      this.state.currentWindow = null;
    },

    // --- Data Management ---
    fetchRealtimeData() {
      const now = new Date();
      const hour = now.getHours();
      
      // Simulate Solar Production (peak around 12-4 PM)
      const sunFactor = Math.sin(Math.PI * (hour - 6) / 10);
      this.state.TAG_SOLAR_KW = hour >= 7 && hour <= 17 ? Math.round(Math.max(0, 5 * sunFactor) * 10) / 10 : 0;
      
      // Simulate Home Load
      this.state.TAG_LOAD_KW = hour < 7 || hour > 18 ? 3.5 : 1.2;
      
      // Simulate Battery/Grid Logic
      if (this.state.TAG_SOLAR_KW > 2 && this.state.TAG_BATT_SOC < 90) {
        this.state.TAG_BATT_AMPS = 10;
        this.state.TAG_GRID_FLOW = this.state.TAG_SOLAR_KW > this.state.TAG_LOAD_KW ? 0.5 : 0;
        this.state.TAG_BATT_SOC = Math.min(100, this.state.TAG_BATT_SOC + 0.1);
      } else if (this.state.TAG_SOLAR_KW < 0.5 && this.state.TAG_LOAD_KW > 1.5 && this.state.TAG_BATT_SOC > 15) {
        this.state.TAG_BATT_AMPS = -5;
        this.state.TAG_GRID_FLOW = 0;
        this.state.TAG_BATT_SOC = Math.max(0, this.state.TAG_BATT_SOC - 0.05);
      } else {
        this.state.TAG_BATT_AMPS = 0;
        this.state.TAG_GRID_FLOW = this.state.TAG_LOAD_KW > 1 ? -1 : 0;
      }

      this.state.TAG_BATT_SOC = Math.round(this.state.TAG_BATT_SOC);
    },

    startDataUpdates() {
      this.state.updateInterval = setInterval(() => {
        this.fetchRealtimeData();
        if (this.state.activeTab === 'flow') {
          this.render();
        }
      }, 5000);
    },

    sendCommand(tag, value) {
      console.log(`[HMI CMD] ${tag} = ${value}`);
      this.state[tag] = value;
      this.showNotification(`Command sent: ${tag}`, 'success');
      this.render();
    },

    calculateBatteryMetrics() {
      const NOMINAL_VOLTAGE = 50;
      const CAPACITY_KWH = 10;
      const currentWatts = this.state.TAG_BATT_AMPS * NOMINAL_VOLTAGE;
      const remainingCapacity = CAPACITY_KWH * 1000 * (100 - this.state.TAG_BATT_SOC) / 100;
      const consumedCapacity = CAPACITY_KWH * 1000 * this.state.TAG_BATT_SOC / 100;

      let timeToFull = 'N/A';
      let timeToEmpty = 'N/A';
      
      if (this.state.TAG_BATT_AMPS > 1) {
        timeToFull = (remainingCapacity / currentWatts).toFixed(1);
      } else if (this.state.TAG_BATT_AMPS < -1) {
        timeToEmpty = (consumedCapacity / Math.abs(currentWatts)).toFixed(1);
      }
      
      return { timeToFull, timeToEmpty };
    },

    // --- Rendering ---
    render() {
      if (!this.container) return;

      this.container.innerHTML = `
        <div style="display:flex;flex-direction:column;height:100%;background:linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);color:#e2e8f0;font-family:system-ui;">
          ${this.renderHeader()}
          ${this.renderTabs()}
          ${this.state.activeTab === 'flow' ? this.renderFlowTab() : 
            this.state.activeTab === 'battery' ? this.renderBatteryTab() : 
            this.renderHistoricalTab()}
        </div>
      `;

      this.attachEventListeners();
    },

    renderHeader() {
      const alarmActive = this.state.TAG_BATT_SOC <= this.state.SET_LOW_BATT_WARN;
      
      return `
        <div style="background:rgba(30, 41, 59, 0.6);backdrop-filter:blur(10px);padding:20px;border-bottom:1px solid rgba(255,255,255,0.1);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <h2 style="margin:0;font-size:24px;font-weight:700;">☀️ Solar HMI</h2>
            <div style="display:flex;gap:12px;align-items:center;">
              <div style="width:12px;height:12px;border-radius:50%;background:${this.state.CMD_SYSTEM_ON_OFF ? '#10b981' : '#ef4444'};box-shadow:0 0 10px ${this.state.CMD_SYSTEM_ON_OFF ? '#10b981' : '#ef4444'};"></div>
              <span style="font-size:12px;color:#94a3b8;">${this.state.CMD_SYSTEM_ON_OFF ? 'System ON' : 'System OFF'}</span>
            </div>
          </div>
          ${alarmActive ? `
            <div style="background:rgba(239, 68, 68, 0.2);border-left:4px solid #ef4444;padding:12px;border-radius:8px;margin-top:12px;">
              <div style="color:#fecaca;font-size:14px;font-weight:600;">⚠️ CRITICAL: Battery Low (${this.state.TAG_BATT_SOC}%)</div>
            </div>
          ` : ''}
        </div>
      `;
    },

    renderTabs() {
      return `
        <div style="background:rgba(30, 41, 59, 0.4);display:flex;gap:8px;padding:12px 20px;border-bottom:1px solid rgba(255,255,255,0.1);">
          ${this.renderTab('flow', '📊 System Flow')}
          ${this.renderTab('battery', '🔋 Battery Control')}
          ${this.renderTab('historical', '📈 Historical')}
        </div>
      `;
    },

    renderTab(id, label) {
      const isActive = this.state.activeTab === id;
      return `
        <button data-tab="${id}" style="
          padding:10px 20px;
          background:${isActive ? 'rgba(59, 130, 246, 0.3)' : 'transparent'};
          color:${isActive ? '#3b82f6' : '#94a3b8'};
          border:1px solid ${isActive ? '#3b82f6' : 'rgba(255,255,255,0.1)'};
          border-radius:8px;
          cursor:pointer;
          font-weight:${isActive ? '700' : '600'};
          font-size:14px;
          transition:all 0.3s;
        ">${label}</button>
      `;
    },

    renderFlowTab() {
      const battMetrics = this.calculateBatteryMetrics();
      const gridStatus = this.state.TAG_GRID_FLOW > 0.1 ? 'Exporting' : 
                        this.state.TAG_GRID_FLOW < -0.1 ? 'Importing' : 'Holding';
      const gridColor = this.state.TAG_GRID_FLOW > 0.1 ? '#10b981' : 
                       this.state.TAG_GRID_FLOW < -0.1 ? '#ef4444' : '#94a3b8';

      return `
        <div style="flex:1;overflow-y:auto;padding:20px;">
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:20px;">
            ${this.renderMetricCard('☀️', 'Solar Production', `${this.state.TAG_SOLAR_KW.toFixed(1)}`, 'kW', '#fbbf24')}
            ${this.renderMetricCard('🏠', 'Home Load', `${this.state.TAG_LOAD_KW.toFixed(1)}`, 'kW', '#3b82f6')}
            ${this.renderMetricCard('🔋', 'Battery SOC', `${this.state.TAG_BATT_SOC}`, '%', this.getBatteryColor(this.state.TAG_BATT_SOC))}
            ${this.renderMetricCard('⚡', 'Battery Flow', `${this.state.TAG_BATT_AMPS.toFixed(1)}`, 'A', this.state.TAG_BATT_AMPS > 0 ? '#10b981' : '#ef4444')}
          </div>

          <div style="background:rgba(30, 41, 59, 0.4);backdrop-filter:blur(10px);border-radius:16px;padding:20px;border:1px solid rgba(255,255,255,0.1);margin-bottom:20px;">
            <h3 style="margin:0 0 16px 0;font-size:18px;font-weight:700;">Grid Status</h3>
            <div style="display:flex;align-items:center;gap:12px;">
              <div style="font-size:32px;">🔌</div>
              <div style="flex:1;">
                <div style="font-size:14px;color:#94a3b8;margin-bottom:4px;">Status</div>
                <div style="font-size:20px;font-weight:700;color:${gridColor};">${gridStatus}</div>
              </div>
              <div style="font-size:24px;font-weight:700;color:${gridColor};">
                ${Math.abs(this.state.TAG_GRID_FLOW).toFixed(1)} kW
              </div>
            </div>
          </div>

          <div style="background:rgba(30, 41, 59, 0.4);backdrop-filter:blur(10px);border-radius:16px;padding:20px;border:1px solid rgba(255,255,255,0.1);">
            <h3 style="margin:0 0 16px 0;font-size:18px;font-weight:700;">Battery Status</h3>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div>
                <div style="font-size:12px;color:#94a3b8;margin-bottom:4px;">Time to Full</div>
                <div style="font-size:16px;font-weight:600;color:#10b981;">
                  ${this.state.TAG_BATT_AMPS > 1 ? `${battMetrics.timeToFull} hrs` : 'N/A'}
                </div>
              </div>
              <div>
                <div style="font-size:12px;color:#94a3b8;margin-bottom:4px;">Time to Empty</div>
                <div style="font-size:16px;font-weight:600;color:#ef4444;">
                  ${this.state.TAG_BATT_AMPS < -1 ? `${battMetrics.timeToEmpty} hrs` : 'N/A'}
                </div>
              </div>
              <div>
                <div style="font-size:12px;color:#94a3b8;margin-bottom:4px;">Temperature</div>
                <div style="font-size:16px;font-weight:600;">${this.state.TAG_BATT_TEMP.toFixed(1)}°C</div>
              </div>
              <div>
                <div style="font-size:12px;color:#94a3b8;margin-bottom:4px;">Ports Active</div>
                <div style="font-size:16px;font-weight:600;">
                  ${this.state.TAG_PORT_AC1_STAT ? '✓ AC1' : ''} 
                  ${this.state.TAG_PORT_USB_STAT ? '✓ USB' : ''}
                  ${!this.state.TAG_PORT_AC1_STAT && !this.state.TAG_PORT_USB_STAT ? 'None' : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    renderBatteryTab() {
      const modes = ['Self-Consumption', 'Time-of-Use', 'Backup Only'];
      
      return `
        <div style="flex:1;overflow-y:auto;padding:20px;">
          <div style="background:rgba(30, 41, 59, 0.4);backdrop-filter:blur(10px);border-radius:16px;padding:20px;border:1px solid rgba(255,255,255,0.1);margin-bottom:20px;">
            <h3 style="margin:0 0 16px 0;font-size:18px;font-weight:700;">Battery Health</h3>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
              <div>
                <div style="font-size:12px;color:#94a3b8;margin-bottom:4px;">State of Health</div>
                <div style="font-size:20px;font-weight:700;color:#10b981;">${this.state.TAG_BATT_SOH_PCT}%</div>
              </div>
              <div>
                <div style="font-size:12px;color:#94a3b8;margin-bottom:4px;">Cycles</div>
                <div style="font-size:20px;font-weight:700;">${this.state.TAG_BATT_CYCLES}</div>
              </div>
              <div>
                <div style="font-size:12px;color:#94a3b8;margin-bottom:4px;">Temperature</div>
                <div style="font-size:20px;font-weight:700;">${this.state.TAG_BATT_TEMP.toFixed(1)}°C</div>
              </div>
            </div>
          </div>

          <div style="background:rgba(30, 41, 59, 0.4);backdrop-filter:blur(10px);border-radius:16px;padding:20px;border:1px solid rgba(255,255,255,0.1);margin-bottom:20px;">
            <h3 style="margin:0 0 16px 0;font-size:18px;font-weight:700;">System Control</h3>
            
            <div style="margin-bottom:20px;">
              <label style="display:block;font-size:14px;color:#94a3b8;margin-bottom:8px;">EMS Mode</label>
              <select data-control="ems-mode" style="width:100%;padding:12px;background:rgba(15, 23, 42, 0.6);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#e2e8f0;font-size:14px;">
                ${modes.map((mode, idx) => `
                  <option value="${idx + 1}" ${this.state.SET_EMS_MODE === idx + 1 ? 'selected' : ''}>${mode}</option>
                `).join('')}
              </select>
            </div>

            <div style="margin-bottom:20px;">
              <label style="display:block;font-size:14px;color:#94a3b8;margin-bottom:8px;">Low Battery Warning (%)</label>
              <input data-control="low-batt-warn" type="number" min="5" max="50" value="${this.state.SET_LOW_BATT_WARN}" 
                style="width:100%;padding:12px;background:rgba(15, 23, 42, 0.6);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#e2e8f0;font-size:14px;">
            </div>

            <button data-action="master-power" style="width:100%;padding:14px;background:${this.state.CMD_SYSTEM_ON_OFF ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'};color:white;border:none;border-radius:10px;font-weight:700;font-size:16px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3);">
              ${this.state.CMD_SYSTEM_ON_OFF ? '⏸️ Turn System OFF' : '▶️ Turn System ON'}
            </button>
          </div>

          <div style="background:rgba(30, 41, 59, 0.4);backdrop-filter:blur(10px);border-radius:16px;padding:20px;border:1px solid rgba(255,255,255,0.1);">
            <h3 style="margin:0 0 16px 0;font-size:18px;font-weight:700;">Battery Commands</h3>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
              <button data-action="force-charge" style="padding:12px;background:rgba(16, 185, 129, 0.2);color:#10b981;border:1px solid rgba(16, 185, 129, 0.3);border-radius:8px;cursor:pointer;font-weight:600;font-size:14px;">Force Charge</button>
              <button data-action="hold" style="padding:12px;background:rgba(59, 130, 246, 0.2);color:#3b82f6;border:1px solid rgba(59, 130, 246, 0.3);border-radius:8px;cursor:pointer;font-weight:600;font-size:14px;">Hold</button>
              <button data-action="force-discharge" style="padding:12px;background:rgba(239, 68, 68, 0.2);color:#ef4444;border:1px solid rgba(239, 68, 68, 0.3);border-radius:8px;cursor:pointer;font-weight:600;font-size:14px;">Force Discharge</button>
            </div>
          </div>
        </div>
      `;
    },

    renderHistoricalTab() {
      const costAvoided = (this.state.LOG_SOLAR_KWH_DAILY * this.state.USER_GRID_RATE).toFixed(2);
      const co2Offset = (this.state.LOG_SOLAR_KWH_DAILY * 0.4).toFixed(1);

      return `
        <div style="flex:1;overflow-y:auto;padding:20px;">
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:20px;">
            ${this.renderMetricCard('🌞', 'Daily Production', `${this.state.LOG_SOLAR_KWH_DAILY.toFixed(1)}`, 'kWh', '#fbbf24')}
            ${this.renderMetricCard('🏡', 'Daily Consumption', `${this.state.LOG_LOAD_KWH_DAILY.toFixed(1)}`, 'kWh', '#3b82f6')}
            ${this.renderMetricCard('💵', 'Cost Avoided', `$${costAvoided}`, '', '#10b981')}
            ${this.renderMetricCard('🌱', 'CO₂ Offset', `${co2Offset}`, 'kg', '#22c55e')}
          </div>

          <div style="background:rgba(30, 41, 59, 0.4);backdrop-filter:blur(10px);border-radius:16px;padding:20px;border:1px solid rgba(255,255,255,0.1);">
            <h3 style="margin:0 0 16px 0;font-size:18px;font-weight:700;">Grid Rate Settings</h3>
            <div>
              <label style="display:block;font-size:14px;color:#94a3b8;margin-bottom:8px;">Electricity Rate ($/kWh)</label>
              <input data-control="grid-rate" type="number" step="0.01" value="${this.state.USER_GRID_RATE}" 
                style="width:100%;padding:12px;background:rgba(15, 23, 42, 0.6);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#e2e8f0;font-size:14px;">
            </div>
          </div>
        </div>
      `;
    },

    renderMetricCard(icon, label, value, unit, color) {
      return `
        <div style="background:rgba(30, 41, 59, 0.4);backdrop-filter:blur(10px);border-radius:16px;padding:16px;border:1px solid rgba(255,255,255,0.1);">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="font-size:32px;">${icon}</div>
            <div style="flex:1;">
              <div style="font-size:12px;color:#94a3b8;margin-bottom:4px;">${label}</div>
              <div style="font-size:24px;font-weight:700;color:${color};">
                ${value}<span style="font-size:14px;margin-left:4px;color:#94a3b8;">${unit}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    getBatteryColor(soc) {
      if (soc > 60) return '#10b981';
      if (soc > 30) return '#fbbf24';
      return '#ef4444';
    },

    attachEventListeners() {
      // Tab switching
      this.container.querySelectorAll('[data-tab]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.state.activeTab = e.target.dataset.tab;
          this.render();
        });
      });

      // Controls
      const emsModeSelect = this.container.querySelector('[data-control="ems-mode"]');
      if (emsModeSelect) {
        emsModeSelect.addEventListener('change', (e) => {
          this.sendCommand('SET_EMS_MODE', parseInt(e.target.value));
        });
      }

      const lowBattWarn = this.container.querySelector('[data-control="low-batt-warn"]');
      if (lowBattWarn) {
        lowBattWarn.addEventListener('change', (e) => {
          const value = parseInt(e.target.value);
          if (value >= 5 && value <= 50) {
            this.sendCommand('SET_LOW_BATT_WARN', value);
          }
        });
      }

      const gridRate = this.container.querySelector('[data-control="grid-rate"]');
      if (gridRate) {
        gridRate.addEventListener('change', (e) => {
          this.sendCommand('USER_GRID_RATE', parseFloat(e.target.value));
        });
      }

      // Action buttons
      const masterPowerBtn = this.container.querySelector('[data-action="master-power"]');
      if (masterPowerBtn) {
        masterPowerBtn.addEventListener('click', () => {
          this.sendCommand('CMD_SYSTEM_ON_OFF', !this.state.CMD_SYSTEM_ON_OFF);
        });
      }

      const forceChargeBtn = this.container.querySelector('[data-action="force-charge"]');
      if (forceChargeBtn) {
        forceChargeBtn.addEventListener('click', () => {
          this.showNotification('Force Charge command sent', 'success');
        });
      }

      const holdBtn = this.container.querySelector('[data-action="hold"]');
      if (holdBtn) {
        holdBtn.addEventListener('click', () => {
          this.showNotification('Battery Hold command sent', 'info');
        });
      }

      const forceDischargeBtn = this.container.querySelector('[data-action="force-discharge"]');
      if (forceDischargeBtn) {
        forceDischargeBtn.addEventListener('click', () => {
          this.showNotification('Force Discharge command sent', 'warning');
        });
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
      notification.style.cssText = `position:fixed;top:20px;right:20px;background:${colors[type]};color:white;padding:16px 24px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.4);z-index:10000;font-size:14px;font-weight:600;`;
      notification.textContent = message;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }
  };

  // Register app
  if (window.AppRegistry) {
    window.AppRegistry.registerApp({
      id: 'solar-hmi',
      name: 'Solar HMI',
      icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' rx='8' fill='%230f172a'/><circle cx='24' cy='16' r='8' fill='%23fbbf24'/><path d='M24 8v4M24 20v4M12 16h4M32 16h4M16 11l2 2M32 11l-2 2M16 21l2-2M32 21l-2-2' stroke='%23fbbf24' stroke-width='2'/><rect x='8' y='28' width='32' height='12' rx='2' fill='%2310b981'/><path d='M12 34h4M20 34h8M32 34h4' stroke='%230f172a' stroke-width='2'/></svg>",
      handler: () => window.SolarHMIApp.open(),
      singleInstance: true
    });
  }
})();
