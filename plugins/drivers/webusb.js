// webusb.js
// Gnokestation WebUSB Driver v1.1 (Persistent Access)
// Author: Gnokestation
// License: GPL-3.0

;(() => {
  'use strict';

  const DB_NAME = 'gnoke_webusb_db';
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
    // USB devices are already permitted once selected
    return device !== null && device.opened !== undefined;
  }

  // --- Device picker ---
  const pickDevice = async () => {
    try {
      const device = await navigator.usb.requestDevice({ filters: [] });
      if (!device) {
        throw new Error('No device selected');
      }
      
      // Store device info for reconnection attempts
      await db.save('usb_device_info', {
        vendorId: device.vendorId,
        productId: device.productId,
        productName: device.productName,
        manufacturerName: device.manufacturerName
      });
      
      return device;
    } catch (err) {
      console.warn('[WebUSBDriver] Picker error:', err);
      throw err;
    }
  };

  // --- Try to restore from previously paired devices ---
  const restoreHandle = async () => {
    try {
      const deviceInfo = await db.get('usb_device_info');
      if (!deviceInfo) return null;
      
      // Get all paired devices
      const devices = await navigator.usb.getDevices();
      
      // Find matching device
      const device = devices.find(d => 
        d.vendorId === deviceInfo.vendorId && 
        d.productId === deviceInfo.productId
      );
      
      if (device && (await verifyPermission(device))) {
        return device;
      }
    } catch (err) {
      console.warn('[WebUSBDriver] No stored device');
    }
    return null;
  };

  // --- HAL registration ---
  window.HardwareDrivers?.register({
    name: 'webusb',
    type: 'hybrid',
    version: '1.1.0',

    async detect() {
      return !!navigator.usb;
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
          if (device.configuration === null) {
            await device.selectConfiguration(1);
          }
          // Try to claim first interface
          try {
            await device.claimInterface(0);
          } catch (err) {
            console.warn('[WebUSBDriver] Could not claim interface 0:', err);
          }
        }

        const driver = window.HardwareDrivers.get('webusb');
        driver.handle = device;
        driver.connected = true;

        if (window.EventBus) {
          window.EventBus.emit('driver-connected', { driver: 'webusb', method: 'webapi' });
        }

        console.log('[WebUSBDriver] Connected (persistent)');
        return { 
          success: true, 
          device: {
            name: device.productName || 'Unknown Device',
            manufacturer: device.manufacturerName,
            vendorId: device.vendorId.toString(16).toUpperCase(),
            productId: device.productId.toString(16).toUpperCase()
          }
        };
      } catch (err) {
        console.error('[WebUSBDriver] Connection failed:', err);
        throw err;
      }
    },

    async disconnect() {
      const driver = window.HardwareDrivers.get('webusb');
      if (driver.handle && driver.handle.opened) {
        try {
          await driver.handle.close();
        } catch (err) {
          console.warn('[WebUSBDriver] Close error:', err);
        }
      }
      driver.handle = null;
      driver.connected = false;
      
      if (window.EventBus) {
        window.EventBus.emit('driver-disconnected', { driver: 'webusb' });
      }
      console.log('[WebUSBDriver] Disconnected');
      return { success: true };
    },

    async read(endpoint = 1, length = 64) {
      const driver = window.HardwareDrivers.get('webusb');
      if (!driver.handle) throw new Error('WebUSB not connected');
      if (!driver.handle.opened) throw new Error('Device not opened');
      
      try {
        const result = await driver.handle.transferIn(endpoint, length);
        const data = new Uint8Array(result.data.buffer);
        const text = new TextDecoder().decode(data);
        
        return {
          success: true,
          endpoint,
          bytes: data.length,
          data: Array.from(data),
          text: text.replace(/\0/g, '').trim()
        };
      } catch (err) {
        console.error('[WebUSBDriver] Read error:', err);
        throw err;
      }
    },

    async write(data, endpoint = 1) {
      const driver = window.HardwareDrivers.get('webusb');
      if (!driver.handle) throw new Error('WebUSB not connected');
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
        
        const result = await driver.handle.transferOut(endpoint, buffer);
        
        return {
          success: true,
          endpoint,
          bytes: result.bytesWritten,
          status: result.status
        };
      } catch (err) {
        console.error('[WebUSBDriver] Write error:', err);
        throw err;
      }
    }
  });

  console.log('[Driver] WebUSB Driver v1.1 (persistent) loaded');
})();