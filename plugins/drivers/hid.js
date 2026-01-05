// hid.js
// Gnokestation HID Driver v1.1 (Persistent Access)
// Author: Gnokestation
// License: GPL-3.0

;(() => {
  'use strict';

  const DB_NAME = 'gnoke_hid_db';
  const DB_STORE = 'handles';

  // --- IndexedDB helper ---
  const db = {
    async open() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = e => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(DB_STORE)) {
            db.createObjectStore(DB_STORE);
          }
        };
        request.onsuccess = e => resolve(e.target.result);
        request.onerror = e => reject(e.target.error);
      });
    },

    async save(key, value) {
      const database = await this.open();
      const tx = database.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).put(value, key);
      return tx.complete;
    },

    async get(key) {
      const database = await this.open();
      return new Promise((resolve, reject) => {
        const tx = database.transaction(DB_STORE, 'readonly');
        const req = tx.objectStore(DB_STORE).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
  };

  // --- Permission helpers ---
  async function verifyPermission(device) {
    // HID devices are already permitted once selected
    return device !== null && device.opened !== undefined;
  }

  // --- Device picker ---
  const pickDevice = async () => {
    try {
      const devices = await navigator.hid.requestDevice({ filters: [] });
      const device = devices[0];
      
      if (!device) {
        throw new Error('No device selected');
      }
      
      // Store device info for reconnection attempts
      await db.save('hid_device_info', {
        vendorId: device.vendorId,
        productId: device.productId,
        productName: device.productName
      });
      
      return device;
    } catch (err) {
      console.warn('[HIDDriver] Picker error:', err);
      throw err;
    }
  };

  // --- Try to restore from previously paired devices ---
  const restoreHandle = async () => {
    try {
      const deviceInfo = await db.get('hid_device_info');
      if (!deviceInfo) return null;
      
      // Get all paired devices
      const devices = await navigator.hid.getDevices();
      
      // Find matching device
      const device = devices.find(d => 
        d.vendorId === deviceInfo.vendorId && 
        d.productId === deviceInfo.productId
      );
      
      if (device && (await verifyPermission(device))) {
        return device;
      }
    } catch (err) {
      console.warn('[HIDDriver] No stored device');
    }
    return null;
  };

  // --- HAL registration ---
  window.HardwareDrivers?.register({
    name: 'hid',
    type: 'hybrid',
    version: '1.1.0',

    async detect() {
      return 'hid' in navigator;
    },

    async connect() {
      try {
        let device = await restoreHandle();
        if (!device) {
          device = await pickDevice();
        }

        // Open the device
        if (!device.opened) {
          await device.open();
        }

        const driver = window.HardwareDrivers.get('hid');
        driver.handle = device;
        driver.connected = true;
        driver.inputListener = null;

        // Setup input report listener
        device.addEventListener('inputreport', (event) => {
          if (driver.inputListener) {
            const data = new Uint8Array(event.data.buffer);
            driver.inputListener({
              reportId: event.reportId,
              data: Array.from(data),
              timestamp: event.timeStamp
            });
          }
        });

        if (window.EventBus) {
          window.EventBus.emit('driver-connected', { driver: 'hid', method: 'webapi' });
        }

        console.log('[HIDDriver] Connected (persistent)');
        return { 
          success: true, 
          device: {
            name: device.productName || 'Unknown HID Device',
            vendorId: device.vendorId.toString(16).toUpperCase().padStart(4, '0'),
            productId: device.productId.toString(16).toUpperCase().padStart(4, '0'),
            collections: device.collections.length
          }
        };
      } catch (err) {
        console.error('[HIDDriver] Connection failed:', err);
        throw err;
      }
    },

    async disconnect() {
      const driver = window.HardwareDrivers.get('hid');
      
      // Remove input listener
      driver.inputListener = null;
      
      // Close device
      if (driver.handle && driver.handle.opened) {
        try {
          await driver.handle.close();
        } catch (err) {
          console.warn('[HIDDriver] Close error:', err);
        }
      }
      
      driver.handle = null;
      driver.connected = false;
      
      if (window.EventBus) {
        window.EventBus.emit('driver-disconnected', { driver: 'hid' });
      }
      console.log('[HIDDriver] Disconnected');
      return { success: true };
    },

    async read(callback) {
      const driver = window.HardwareDrivers.get('hid');
      if (!driver.handle) throw new Error('HID not connected');
      if (!driver.handle.opened) throw new Error('Device not opened');
      
      // Set up input report listener
      if (typeof callback === 'function') {
        driver.inputListener = callback;
        return {
          success: true,
          message: 'Input listener registered. Will receive reports automatically.'
        };
      } else {
        throw new Error('Callback function required for HID read');
      }
    },

    async write(reportId, data) {
      const driver = window.HardwareDrivers.get('hid');
      if (!driver.handle) throw new Error('HID not connected');
      if (!driver.handle.opened) throw new Error('Device not opened');
      
      try {
        // Convert data to Uint8Array if needed
        let buffer;
        if (typeof data === 'string') {
          buffer = new TextEncoder().encode(data);
        } else if (Array.isArray(data)) {
          buffer = new Uint8Array(data);
        } else if (data instanceof Uint8Array) {
          buffer = data;
        } else {
          throw new Error('Invalid data format. Use string, array, or Uint8Array');
        }
        
        // Send output report
        await driver.handle.sendReport(reportId, buffer);
        
        return {
          success: true,
          reportId,
          bytes: buffer.length
        };
      } catch (err) {
        console.error('[HIDDriver] Write error:', err);
        throw err;
      }
    },

    // Additional HID-specific methods
    async sendFeatureReport(reportId, data) {
      const driver = window.HardwareDrivers.get('hid');
      if (!driver.handle) throw new Error('HID not connected');
      
      try {
        let buffer;
        if (Array.isArray(data)) {
          buffer = new Uint8Array(data);
        } else if (data instanceof Uint8Array) {
          buffer = data;
        } else {
          throw new Error('Feature report data must be array or Uint8Array');
        }
        
        await driver.handle.sendFeatureReport(reportId, buffer);
        
        return {
          success: true,
          reportId,
          bytes: buffer.length
        };
      } catch (err) {
        console.error('[HIDDriver] Feature report error:', err);
        throw err;
      }
    },

    async receiveFeatureReport(reportId) {
      const driver = window.HardwareDrivers.get('hid');
      if (!driver.handle) throw new Error('HID not connected');
      
      try {
        const dataView = await driver.handle.receiveFeatureReport(reportId);
        const data = new Uint8Array(dataView.buffer);
        
        return {
          success: true,
          reportId,
          data: Array.from(data),
          bytes: data.length
        };
      } catch (err) {
        console.error('[HIDDriver] Receive feature report error:', err);
        throw err;
      }
    }
  });

  console.log('[Driver] HID Driver v1.1 (persistent) loaded');
})();