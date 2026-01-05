// serial.js
// Gnokestation Serial Driver v1.1 (Persistent Access)
// Author: Gnokestation
// License: GPL-3.0

;(() => {
  'use strict';

  const DB_NAME = 'gnoke_serial_db';
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
  async function verifyPermission(port) {
    // Serial ports are already permitted once selected
    return port !== null && port.readable !== undefined;
  }

  // --- Port picker ---
  const pickPort = async (options = {}) => {
    try {
      const port = await navigator.serial.requestPort();
      if (!port) {
        throw new Error('No port selected');
      }
      
      // Store port info for reconnection attempts
      const info = port.getInfo();
      await db.save('serial_port_info', {
        usbVendorId: info.usbVendorId,
        usbProductId: info.usbProductId,
        baudRate: options.baudRate || 115200
      });
      
      return port;
    } catch (err) {
      console.warn('[SerialDriver] Picker error:', err);
      throw err;
    }
  };

  // --- Try to restore from previously paired ports ---
  const restoreHandle = async () => {
    try {
      const portInfo = await db.get('serial_port_info');
      if (!portInfo) return null;
      
      // Get all paired ports
      const ports = await navigator.serial.getPorts();
      
      // Find matching port
      const port = ports.find(p => {
        const info = p.getInfo();
        return info.usbVendorId === portInfo.usbVendorId && 
               info.usbProductId === portInfo.usbProductId;
      });
      
      if (port && (await verifyPermission(port))) {
        return { port, baudRate: portInfo.baudRate };
      }
    } catch (err) {
      console.warn('[SerialDriver] No stored port');
    }
    return null;
  };

  // --- HAL registration ---
  window.HardwareDrivers?.register({
    name: 'serial',
    type: 'hybrid',
    version: '1.1.0',

    async detect() {
      return 'serial' in navigator;
    },

    async connect(options = {}) {
      try {
        let port, baudRate;
        
        const restored = await restoreHandle();
        if (restored) {
          port = restored.port;
          baudRate = restored.baudRate;
        } else {
          port = await pickPort(options);
          baudRate = options.baudRate || 115200;
        }

        // Open the port
        if (!port.readable) {
          await port.open({ baudRate });
        }

        const driver = window.HardwareDrivers.get('serial');
        driver.handle = port;
        driver.baudRate = baudRate;
        driver.reader = null;
        driver.writer = null;
        driver.connected = true;

        if (window.EventBus) {
          window.EventBus.emit('driver-connected', { driver: 'serial', method: 'webapi' });
        }

        const info = port.getInfo();
        console.log('[SerialDriver] Connected (persistent) at', baudRate, 'baud');
        return { 
          success: true, 
          port: {
            vendorId: info.usbVendorId?.toString(16).toUpperCase() || 'N/A',
            productId: info.usbProductId?.toString(16).toUpperCase() || 'N/A',
            baudRate
          }
        };
      } catch (err) {
        console.error('[SerialDriver] Connection failed:', err);
        throw err;
      }
    },

    async disconnect() {
      const driver = window.HardwareDrivers.get('serial');
      
      // Cancel reader if active
      if (driver.reader) {
        try {
          await driver.reader.cancel();
        } catch (err) {
          console.warn('[SerialDriver] Reader cancel error:', err);
        }
        driver.reader = null;
      }
      
      // Release writer if active
      if (driver.writer) {
        try {
          await driver.writer.releaseLock();
        } catch (err) {
          console.warn('[SerialDriver] Writer release error:', err);
        }
        driver.writer = null;
      }
      
      // Close port
      if (driver.handle && driver.handle.readable) {
        try {
          await driver.handle.close();
        } catch (err) {
          console.warn('[SerialDriver] Close error:', err);
        }
      }
      
      driver.handle = null;
      driver.connected = false;
      
      if (window.EventBus) {
        window.EventBus.emit('driver-disconnected', { driver: 'serial' });
      }
      console.log('[SerialDriver] Disconnected');
      return { success: true };
    },

    async read(timeout = 5000) {
      const driver = window.HardwareDrivers.get('serial');
      if (!driver.handle) throw new Error('Serial not connected');
      if (!driver.handle.readable) throw new Error('Port not readable');
      
      try {
        // Create reader if not exists
        if (!driver.reader) {
          const decoder = new TextDecoderStream();
          driver.handle.readable.pipeTo(decoder.writable);
          driver.reader = decoder.readable.getReader();
        }
        
        // Read with timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Read timeout')), timeout)
        );
        
        const readPromise = driver.reader.read();
        const { value, done } = await Promise.race([readPromise, timeoutPromise]);
        
        if (done) {
          driver.reader = null;
          throw new Error('Stream closed');
        }
        
        return {
          success: true,
          data: value,
          length: value?.length || 0
        };
      } catch (err) {
        console.error('[SerialDriver] Read error:', err);
        throw err;
      }
    },

    async write(data) {
      const driver = window.HardwareDrivers.get('serial');
      if (!driver.handle) throw new Error('Serial not connected');
      if (!driver.handle.writable) throw new Error('Port not writable');
      
      try {
        // Create writer
        const writer = driver.handle.writable.getWriter();
        
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
        
        await writer.write(buffer);
        writer.releaseLock();
        
        return {
          success: true,
          bytes: buffer.length
        };
      } catch (err) {
        console.error('[SerialDriver] Write error:', err);
        throw err;
      }
    }
  });

  console.log('[Driver] Serial Driver v1.1 (persistent) loaded');
})();