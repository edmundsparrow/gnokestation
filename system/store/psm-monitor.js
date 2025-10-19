// FILE: applications/psm-monitor.js
// VERSION: 1.0.0
// BUILD DATE: 2025-01-06
//
// PURPOSE:
//   Real-time Process Safety Monitoring Dashboard for industrial environments.
//   Displays critical safety parameters with live alerts and trend monitoring.
//
// ARCHITECTURE:
//   - IIFE pattern with window.PSMMonitorApp namespace
//   - Single instance enforcement via AppRegistry
//   - Real-time data simulation with configurable parameters
//   - Alert logging and visual status indicators
//
// LIFECYCLE:
//   1. AppRegistry launches PSMMonitorApp.open()
//   2. Window created with parameter cards and alert log
//   3. Auto-refresh every 4 seconds with safety checks
//   4. Cleanup on window close
//
// CREDITS:
//   Gnokestation Automation Suite | edmundsparrow.netlify.app

(function() {
  window.PSMMonitorApp = {
    // State management
    updateInterval: null,
    currentWindow: null,
    alerts: [],
    data: [],
    
    // Safety parameters configuration
    parameters: [
      { name: 'Reactor Pressure', unit: 'bar', min: 1.0, max: 5.0, safe: [1.5, 4.5], icon: '⚗️' },
      { name: 'Tank Temperature', unit: '°C', min: 20, max: 120, safe: [30, 90], icon: '🌡️' },
      { name: 'Gas Detector (H₂S)', unit: 'ppm', min: 0, max: 50, safe: [0, 10], icon: '💨' },
      { name: 'Pump Vibration', unit: 'mm/s', min: 0, max: 10, safe: [0, 6], icon: '📳' },
      { name: 'Flow Rate', unit: 'm³/h', min: 50, max: 250, safe: [80, 200], icon: '💧' },
      { name: 'Cooling Water Pressure', unit: 'bar', min: 1, max: 6, safe: [2, 5], icon: '❄️' }
    ],

    open() {
      const dashboardHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          height: 100%;
          background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
          color: #e0e7ff;
          font-family: 'Segoe UI', sans-serif;
          overflow: hidden;
        ">
          <!-- Header -->
          <div style="
            padding: 16px 20px;
            background: rgba(20, 184, 166, 0.1);
            border-bottom: 2px solid #14b8a6;
            backdrop-filter: blur(10px);
          ">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h2 style="margin: 0 0 4px 0; font-size: 20px; color: #14b8a6;">⚙️ Process Safety Monitor</h2>
                <p style="margin: 0; font-size: 12px; opacity: 0.8;">Real-time industrial parameter tracking</p>
              </div>
              <div style="
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 12px;
                background: rgba(20, 184, 166, 0.2);
                border-radius: 6px;
              ">
                <div id="statusIndicator" style="
                  width: 10px;
                  height: 10px;
                  border-radius: 50%;
                  background: #10b981;
                  box-shadow: 0 0 10px #10b981;
                  animation: pulse 2s infinite;
                "></div>
                <span style="font-size: 12px; font-weight: 600;">LIVE</span>
              </div>
            </div>
          </div>

          <!-- Parameter Cards Grid -->
          <div style="
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 16px;
            align-content: start;
          " id="parameterGrid">
            <!-- Cards rendered dynamically -->
          </div>

          <!-- Alert Log Section -->
          <div style="
            height: 180px;
            background: rgba(15, 23, 42, 0.8);
            border-top: 2px solid #ef4444;
            padding: 16px 20px;
            display: flex;
            flex-direction: column;
          ">
            <h3 style="
              margin: 0 0 12px 0;
              font-size: 14px;
              color: #ef4444;
              display: flex;
              align-items: center;
              gap: 8px;
            ">
              ⚠️ Active Safety Alerts
              <span id="alertCount" style="
                background: #ef4444;
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
              ">0</span>
            </h3>
            <div id="alertLog" style="
              flex: 1;
              overflow-y: auto;
              background: rgba(0, 0, 0, 0.3);
              border-radius: 6px;
              padding: 8px;
              font-size: 12px;
              line-height: 1.8;
            ">
              <div style="text-align: center; padding: 20px; color: #6b7280;">
                No alerts - All parameters within safe range
              </div>
            </div>
          </div>

          <style>
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
            #alertLog::-webkit-scrollbar {
              width: 6px;
            }
            #alertLog::-webkit-scrollbar-track {
              background: rgba(0, 0, 0, 0.2);
              border-radius: 3px;
            }
            #alertLog::-webkit-scrollbar-thumb {
              background: #14b8a6;
              border-radius: 3px;
            }
            #parameterGrid::-webkit-scrollbar {
              width: 8px;
            }
            #parameterGrid::-webkit-scrollbar-track {
              background: rgba(0, 0, 0, 0.2);
            }
            #parameterGrid::-webkit-scrollbar-thumb {
              background: #14b8a6;
              border-radius: 4px;
            }
          </style>
        </div>
      `;

      const win = WindowManager.createWindow('PSM Monitor', dashboardHTML, 900, 650);
      this.currentWindow = win;
      
      this.setupMonitoring(win);
      return win;
    },

    setupMonitoring(win) {
      // Initial render
      this.generateData();
      this.renderCards(win);
      
      // Start auto-update cycle
      this.updateInterval = setInterval(() => {
        this.generateData();
        this.renderCards(win);
      }, 4000);

      // Cleanup on window close
      win.addEventListener('windowClosed', () => this.cleanup());
    },

    cleanup() {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }
      this.currentWindow = null;
      this.alerts = [];
      this.data = [];
    },

    generateData() {
      this.data = this.parameters.map(param => {
        const value = (Math.random() * (param.max - param.min) + param.min).toFixed(2);
        const numValue = parseFloat(value);
        const isSafe = numValue >= param.safe[0] && numValue <= param.safe[1];
        
        return {
          ...param,
          value: value,
          safe: isSafe
        };
      });
    },

    renderCards(win) {
      const grid = win.querySelector('#parameterGrid');
      if (!grid) return;

      grid.innerHTML = this.data.map(item => {
        const bgColor = item.safe 
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)'
          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)';
        
        const borderColor = item.safe ? '#10b981' : '#ef4444';
        const statusIcon = item.safe ? '✓' : '⚠️';
        const statusColor = item.safe ? '#10b981' : '#ef4444';
        const statusText = item.safe ? 'SAFE' : 'ALERT';

        return `
          <div style="
            background: ${bgColor};
            border: 2px solid ${borderColor};
            border-radius: 12px;
            padding: 16px;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
          ">
            <div style="
              display: flex;
              justify-content: space-between;
              align-items: start;
              margin-bottom: 12px;
            ">
              <div style="flex: 1;">
                <div style="
                  font-size: 24px;
                  margin-bottom: 4px;
                ">${item.icon}</div>
                <div style="
                  font-size: 13px;
                  font-weight: 600;
                  color: #14b8a6;
                  margin-bottom: 4px;
                ">${item.name}</div>
              </div>
              <div style="
                background: ${statusColor};
                color: white;
                padding: 4px 10px;
                border-radius: 6px;
                font-size: 10px;
                font-weight: 700;
                letter-spacing: 0.5px;
                display: flex;
                align-items: center;
                gap: 4px;
              ">
                <span>${statusIcon}</span>
                <span>${statusText}</span>
              </div>
            </div>

            <div style="
              font-size: 32px;
              font-weight: 700;
              color: #e0e7ff;
              margin-bottom: 8px;
            ">
              ${item.value} <span style="font-size: 16px; opacity: 0.7;">${item.unit}</span>
            </div>

            <div style="
              font-size: 11px;
              color: #94a3b8;
              padding-top: 8px;
              border-top: 1px solid rgba(148, 163, 184, 0.2);
            ">
              Safe range: ${item.safe[0]}–${item.safe[1]} ${item.unit}
            </div>
          </div>
        `;
      }).join('');

      // Log alerts for out-of-range parameters
      this.data.forEach(item => {
        if (!item.safe) {
          this.logAlert(win, item);
        }
      });
    },

    logAlert(win, item) {
      const timestamp = new Date().toLocaleTimeString();
      const message = `${item.name} OUT OF RANGE: ${item.value} ${item.unit}`;
      const alertKey = `${item.name}-${item.value}`;

      // Prevent duplicate consecutive alerts
      if (!this.alerts.some(a => a.key === alertKey)) {
        this.alerts.unshift({
          key: alertKey,
          time: timestamp,
          message: message,
          param: item.name
        });

        // Keep only last 15 alerts
        if (this.alerts.length > 15) {
          this.alerts = this.alerts.slice(0, 15);
        }

        this.renderAlerts(win);
      }
    },

    renderAlerts(win) {
      const alertLog = win.querySelector('#alertLog');
      const alertCount = win.querySelector('#alertCount');
      
      if (!alertLog || !alertCount) return;

      alertCount.textContent = this.alerts.length;

      if (this.alerts.length === 0) {
        alertLog.innerHTML = `
          <div style="text-align: center; padding: 20px; color: #6b7280;">
            No alerts - All parameters within safe range
          </div>
        `;
        return;
      }

      alertLog.innerHTML = this.alerts.map(alert => `
        <div style="
          padding: 8px 12px;
          background: rgba(239, 68, 68, 0.1);
          border-left: 3px solid #ef4444;
          margin-bottom: 6px;
          border-radius: 4px;
          font-family: 'Consolas', monospace;
          color: #fca5a5;
        ">
          <span style="color: #9ca3af;">[${alert.time}]</span> ${alert.message}
        </div>
      `).join('');
    }
  };

  // Register with AppRegistry
  if (typeof AppRegistry !== 'undefined') {
    AppRegistry.registerApp({
      id: 'psm-monitor',
      name: 'PSM Monitor',
      icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><rect width='48' height='48' rx='8' fill='%230a0e27'/><path d='M24 10 L34 18 L34 30 L24 38 L14 30 L14 18 Z' fill='none' stroke='%2314b8a6' stroke-width='2'/><circle cx='24' cy='24' r='4' fill='%2310b981'/><path d='M24 14 L24 20 M24 28 L24 34 M16 24 L22 24 M26 24 L32 24' stroke='%2314b8a6' stroke-width='2' stroke-linecap='round'/></svg>",
      handler: () => window.PSMMonitorApp.open(),
      singleInstance: true
    });
  }

  // Register documentation
  if (window.Docs && typeof window.Docs.registerDocumentation === 'function') {
    window.Docs.registerDocumentation('psm-monitor', {
      name: "PSM Monitor",
      version: "1.0.0",
      description: "Real-time Process Safety Monitoring dashboard for industrial environments with automated alerts and parameter tracking",
      type: "Industrial App",
      features: [
        "Real-time monitoring of 6 critical safety parameters",
        "Visual status indicators (safe/alert states)",
        "Automated alert logging with timestamps",
        "Safe range validation and threshold checking",
        "4-second auto-refresh cycle",
        "Industrial-grade UI with teal/red safety theme"
      ],
      dependencies: ["WindowManager", "AppRegistry"],
      methods: [
        { name: "open", description: "Creates PSM monitoring dashboard window" },
        { name: "setupMonitoring", description: "Initializes data generation and rendering cycle" },
        { name: "generateData", description: "Simulates real-time parameter readings" },
        { name: "renderCards", description: "Renders parameter cards with safety status" },
        { name: "logAlert", description: "Logs out-of-range parameters to alert system" },
        { name: "cleanup", description: "Stops monitoring and clears intervals on window close" }
      ],
      notes: "Designed for industrial process monitoring. Uses simulated data for demonstration - integrate with actual sensors via HAL backend for production use.",
      cudos: "Gnokestation Automation Suite | edmundsparrow.netlify.app",
      auto_generated: false
    });
  }
})();