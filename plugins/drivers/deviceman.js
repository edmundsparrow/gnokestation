// deviceman.js
// Device Manager - Hardware driver management UI
// Windows 7 style device manager for Gnoke Station
// Author: Gnoke Station
// Version: 1.0.0

;(() => {
  'use strict';

  const createDeviceManager = () => {
    if (!window.WindowManager) {
      alert('WindowManager not available');
      return;
    }

    if (!window.HardwareDrivers) {
      alert('Hardware Drivers not loaded');
      return;
    }

    const contentHTML = `
    <div style="
      display: flex;
      height: 100%;
      font-family: 'Segoe UI', sans-serif;
      background: #f0f0f0;
    ">
      <!-- Left Panel - Device Tree -->
      <div style="
        width: 250px;
        background: white;
        border-right: 1px solid #ccc;
        overflow-y: auto;
      ">
        <div style="padding: 10px; background: #e8e8e8; font-weight: bold; border-bottom: 1px solid #ccc;">
          Device Categories
        </div>
        <div id="device-tree" style="padding: 5px;"></div>
      </div>

      <!-- Right Panel - Details -->
      <div style="flex: 1; display: flex; flex-direction: column;">
        <!-- Toolbar -->
        <div style="
          background: #f8f8f8;
          border-bottom: 1px solid #ccc;
          padding: 8px;
          display: flex;
          gap: 5px;
        ">
          <button id="refresh-btn" style="
            padding: 6px 12px;
            border: 1px solid #adadad;
            background: linear-gradient(#fff, #e8e8e8);
            cursor: pointer;
            border-radius: 3px;
          ">🔄 Refresh</button>
          
          <button id="connect-btn" style="
            padding: 6px 12px;
            border: 1px solid #adadad;
            background: linear-gradient(#fff, #e8e8e8);
            cursor: pointer;
            border-radius: 3px;
          " disabled>🔌 Connect</button>
          
          <button id="disconnect-btn" style="
            padding: 6px 12px;
            border: 1px solid #adadad;
            background: linear-gradient(#fff, #e8e8e8);
            cursor: pointer;
            border-radius: 3px;
          " disabled>❌ Disconnect</button>
        </div>

        <!-- Device Details -->
        <div id="device-details" style="
          flex: 1;
          padding: 15px;
          overflow-y: auto;
          background: white;
        ">
          <div style="color: #888; text-align: center; margin-top: 50px;">
            Select a device to view details
          </div>
        </div>

        <!-- Status Bar -->
        <div style="
          background: #f0f0f0;
          border-top: 1px solid #ccc;
          padding: 5px 10px;
          font-size: 11px;
          color: #666;
        " id="status-bar">
          Ready
        </div>
      </div>
    </div>
    `;

    const win = window.WindowManager.createWindow(
      '⚙️ Device Manager',
      contentHTML,
      800,
      500
    );

    const content = win.querySelector('.window-content');
    if (!content) return win;

    let selectedDriver = null;

    // Render device tree
    const renderDeviceTree = () => {
      const tree = content.querySelector('#device-tree');
      if (!tree) return;

      const drivers = window.HardwareDrivers.getAllStatus();
      const categories = {};

      // Group by category (based on driver type)
      for (const [name, info] of Object.entries(drivers)) {
        const category = getCategoryName(name);
        if (!categories[category]) categories[category] = [];
        categories[category].push({ name, ...info });
      }

      tree.innerHTML = Object.entries(categories).map(([cat, devices]) => `
        <div style="margin: 5px 0;">
          <div style="
            padding: 5px;
            font-weight: bold;
            background: #f5f5f5;
            cursor: pointer;
            user-select: none;
          " onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
            ▶ ${cat} (${devices.length})
          </div>
          <div style="padding-left: 15px;">
            ${devices.map(dev => `
              <div 
                data-driver="${dev.name}"
                style="
                  padding: 5px;
                  cursor: pointer;
                  border-left: 3px solid ${dev.connected ? '#4caf50' : '#ccc'};
                  margin: 2px 0;
                  background: ${selectedDriver === dev.name ? '#e3f2fd' : 'transparent'};
                "
                onmouseover="this.style.background='#f0f0f0'"
                onmouseout="this.style.background='${selectedDriver === dev.name ? '#e3f2fd' : 'transparent'}'"
              >
                ${dev.connected ? '🟢' : '⚪'} ${dev.name}
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');

      // Add click handlers to devices
      tree.querySelectorAll('[data-driver]').forEach(el => {
        el.onclick = () => {
          selectedDriver = el.dataset.driver;
          renderDeviceTree();
          renderDeviceDetails(selectedDriver);
          updateToolbar();
        };
      });
    };

    // Render device details
    const renderDeviceDetails = (driverName) => {
      const details = content.querySelector('#device-details');
      if (!details) return;

      const status = window.HardwareDrivers.getStatus(driverName);
      if (!status) {
        details.innerHTML = '<p style="color: #888;">Driver not found</p>';
        return;
      }

      const driver = window.HardwareDrivers.get(driverName);

      details.innerHTML = `
        <h3 style="margin: 0 0 15px 0; color: #333;">${status.name}</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #e0e0e0;">
            <td style="padding: 8px; font-weight: bold; width: 150px;">Status</td>
            <td style="padding: 8px;">
              ${status.connected ? '🟢 Connected' : '⚪ Disconnected'}
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #e0e0e0;">
            <td style="padding: 8px; font-weight: bold;">Type</td>
            <td style="padding: 8px;">${status.type}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e0e0e0;">
            <td style="padding: 8px; font-weight: bold;">Version</td>
            <td style="padding: 8px;">${status.version}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e0e0e0;">
            <td style="padding: 8px; font-weight: bold;">Available</td>
            <td style="padding: 8px;">${status.available ? 'Yes' : 'No'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e0e0e0;">
            <td style="padding: 8px; font-weight: bold;">Connection Method</td>
            <td style="padding: 8px;">
              ${status.useFallback ? 'REST/IP Fallback' : 'Web API'}
            </td>
          </tr>
          ${status.lastError ? `
          <tr style="border-bottom: 1px solid #e0e0e0;">
            <td style="padding: 8px; font-weight: bold;">Last Error</td>
            <td style="padding: 8px; color: #f44336;">${status.lastError}</td>
          </tr>
          ` : ''}
        </table>

        ${driver && driver.fallback ? `
        <div style="
          margin-top: 20px;
          padding: 10px;
          background: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 4px;
        ">
          <strong>Fallback Configuration:</strong><br>
          Endpoint: ${typeof driver.fallback === 'string' ? driver.fallback : driver.fallback.endpoint}
        </div>
        ` : ''}

        <div style="
          margin-top: 20px;
          padding: 10px;
          background: #e8f5e9;
          border-left: 3px solid #4caf50;
        ">
          <strong>Architecture:</strong><br>
          ${getArchitectureInfo(status)}
        </div>
      `;
    };

    // Get category name from driver name
    const getCategoryName = (name) => {
      const categories = {
        camera: 'Imaging Devices',
        gps: 'Location Sensors',
        webusb: 'USB Controllers',
        bluetooth: 'Bluetooth Devices',
        serial: 'Serial Ports',
        nfc: 'Near Field Communication',
        gpio: 'System Devices'
      };
      return categories[name] || 'Other Devices';
    };

    // Get architecture info
    const getArchitectureInfo = (status) => {
      let arch = `Connection Layer: ${status.type.toUpperCase()}<br>`;
      
      if (status.type === 'hybrid') {
        arch += 'Primary: Web API → Fallback: REST/IP<br>';
      } else if (status.type === 'webapi') {
        arch += 'Direct browser API access<br>';
      } else if (status.type === 'rest') {
        arch += 'Remote HTTP/REST endpoint<br>';
      }
      
      arch += `State: ${status.connected ? 'Active' : 'Idle'}`;
      return arch;
    };

    // Update toolbar button states
    const updateToolbar = () => {
      const connectBtn = content.querySelector('#connect-btn');
      const disconnectBtn = content.querySelector('#disconnect-btn');

      if (!selectedDriver) {
        connectBtn.disabled = true;
        disconnectBtn.disabled = true;
        return;
      }

      const status = window.HardwareDrivers.getStatus(selectedDriver);
      connectBtn.disabled = status.connected;
      disconnectBtn.disabled = !status.connected;
    };

    // Setup toolbar handlers
    setTimeout(() => {
      const refreshBtn = content.querySelector('#refresh-btn');
      const connectBtn = content.querySelector('#connect-btn');
      const disconnectBtn = content.querySelector('#disconnect-btn');
      const statusBar = content.querySelector('#status-bar');

      if (refreshBtn) {
        refreshBtn.onclick = () => {
          renderDeviceTree();
          if (selectedDriver) {
            renderDeviceDetails(selectedDriver);
          }
          statusBar.textContent = 'Refreshed';
          setTimeout(() => statusBar.textContent = 'Ready', 2000);
        };
      }

      if (connectBtn) {
        connectBtn.onclick = async () => {
          if (!selectedDriver) return;
          
          statusBar.textContent = `Connecting to ${selectedDriver}...`;
          
          try {
            await window.HardwareDrivers.connect(selectedDriver);
            renderDeviceTree();
            renderDeviceDetails(selectedDriver);
            updateToolbar();
            statusBar.textContent = `Connected to ${selectedDriver}`;
          } catch (err) {
            statusBar.textContent = `Failed: ${err.message}`;
            alert(`Connection failed: ${err.message}`);
          }
        };
      }

      if (disconnectBtn) {
        disconnectBtn.onclick = async () => {
          if (!selectedDriver) return;
          
          statusBar.textContent = `Disconnecting ${selectedDriver}...`;
          
          try {
            await window.HardwareDrivers.disconnect(selectedDriver);
            renderDeviceTree();
            renderDeviceDetails(selectedDriver);
            updateToolbar();
            statusBar.textContent = `Disconnected from ${selectedDriver}`;
          } catch (err) {
            statusBar.textContent = `Failed: ${err.message}`;
          }
        };
      }

      // Initial render
      renderDeviceTree();
      updateToolbar();
    }, 100);

    return win;
  };

// Register app
if (window.AppRegistry) {
  window.AppRegistry.registerApp({
    id: 'deviceman',
    name: 'Device Manager',
    icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><circle cx='24' cy='24' r='22' fill='%23007AFF'/><rect x='11' y='12' width='26' height='14' rx='2' fill='%23ffffff'/><rect x='21.5' y='28' width='5' height='4' rx='1' fill='%23ffffff'/><rect x='16' y='33.5' width='16' height='2' rx='1' fill='%23ffffff'/><circle cx='34' cy='18' r='6' fill='none' stroke='%23ffffff' stroke-width='1.6'/><circle cx='34' cy='18' r='2' fill='%23ffffff'/></svg>",
    handler: createDeviceManager,
    singleInstance: true
  });
  console.log('[DeviceMan] App registered');
} else {
  console.error('[DeviceMan] AppRegistry not available');
}

})();