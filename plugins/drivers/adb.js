// adb.js
// Gnokestation ADB Driver v1.1 (Persistent Access)
// Author: Gnokestation
// License: GPL-3.0
// Note: Requires phone to have USB debugging enabled and authorize this device

;(() => {
  'use strict';

  const DB_NAME = 'gnoke_adb_db';
  const DB_STORE = 'handles';

  // ADB Protocol Constants
  const ADB_CLASS = 0xFF;
  const ADB_SUBCLASS = 0x42;
  const ADB_PROTOCOL = 0x01;
  const ADB_MSG_CONNECT = 0x4e584e43; // "CNXN"
  const ADB_MSG_AUTH = 0x48545541; // "AUTH"
  const ADB_MSG_OKAY = 0x59414b4f; // "OKAY"
  const ADB_MSG_CLSE = 0x45534c43; // "CLSE"
  const ADB_MSG_WRTE = 0x45545257; // "WRTE"
  const VERSION = 0x01000000;
  const MAX_PAYLOAD = 4096;

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

  // --- ADB Protocol Helpers ---
  function createADBMessage(command, arg0, arg1, data = new Uint8Array(0)) {
    const message = new Uint8Array(24 + data.length);
    const view = new DataView(message.buffer);
    
    view.setUint32(0, command, true);
    view.setUint32(4, arg0, true);
    view.setUint32(8, arg1, true);
    view.setUint32(12, data.length, true);
    view.setUint32(16, checksum(data), true);
    view.setUint32(20, command ^ 0xffffffff, true);
    
    message.set(data, 24);
    return message;
  }

  function checksum(data) {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return sum & 0xffffffff;
  }

  function parseADBMessage(buffer) {
    const view = new DataView(buffer);
    return {
      command: view.getUint32(0, true),
      arg0: view.getUint32(4, true),
      arg1: view.getUint32(8, true),
      length: view.getUint32(12, true),
      checksum: view.getUint32(16, true),
      magic: view.getUint32(20, true),
      data: new Uint8Array(buffer, 24)
    };
  }

  // --- Permission helpers ---
  async function verifyPermission(device) {
    return device !== null && device.opened !== undefined;
  }

  // --- Device picker ---
  const pickDevice = async () => {
    try {
      // Filter for ADB devices
      const filters = [
        { classCode: ADB_CLASS, subclassCode: ADB_SUBCLASS, protocolCode: ADB_PROTOCOL },
        { vendorId: 0x18d1 }, // Google
        { vendorId: 0x04e8 }, // Samsung
        { vendorId: 0x22b8 }, // Motorola
        { vendorId: 0x0bb4 }, // HTC
      ];
      
      const device = await navigator.usb.requestDevice({ filters });
      
      if (!device) {
        throw new Error('No ADB device selected');
      }
      
      // Store device info
      await db.save('adb_device_info', {
        vendorId: device.vendorId,
        productId: device.productId,
        productName: device.productName,
        manufacturerName: device.manufacturerName
      });
      
      return device;
    } catch (err) {
      console.warn('[ADBDriver] Picker error:', err);
      throw err;
    }
  };

  // --- Try to restore from previously paired devices ---
  const restoreHandle = async () => {
    try {
      const deviceInfo = await db.get('adb_device_info');
      if (!deviceInfo) return null;
      
      const devices = await navigator.usb.getDevices();
      const device = devices.find(d => 
        d.vendorId === deviceInfo.vendorId && 
        d.productId === deviceInfo.productId
      );
      
      if (device && (await verifyPermission(device))) {
        return device;
      }
    } catch (err) {
      console.warn('[ADBDriver] No stored device');
    }
    return null;
  };

  // --- Find ADB endpoints ---
  function findADBEndpoints(device) {
    for (const iface of device.configuration.interfaces) {
      const alt = iface.alternates.find(a => 
        a.interfaceClass === ADB_CLASS &&
        a.interfaceSubclass === ADB_SUBCLASS &&
        a.interfaceProtocol === ADB_PROTOCOL
      );
      
      if (alt) {
        const endpoints = {
          in: alt.endpoints.find(e => e.direction === 'in'),
          out: alt.endpoints.find(e => e.direction === 'out'),
          interfaceNumber: iface.interfaceNumber
        };
        
        if (endpoints.in && endpoints.out) {
          return endpoints;
        }
      }
    }
    return null;
  }

  // --- HAL registration ---
  window.HardwareDrivers?.register({
    name: 'adb',
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

        // Open device
        if (!device.opened) {
          await device.open();
          if (device.configuration === null) {
            await device.selectConfiguration(1);
          }
        }

        // Find ADB endpoints
        const endpoints = findADBEndpoints(device);
        if (!endpoints) {
          throw new Error('No ADB interface found. Ensure USB debugging is enabled.');
        }

        // Claim interface
        await device.claimInterface(endpoints.interfaceNumber);

        const driver = window.HardwareDrivers.get('adb');
        driver.handle = device;
        driver.endpoints = endpoints;
        driver.authenticated = false;
        driver.connected = true;

        // Send CONNECT message
        const connectString = `host::features=shell_v2,cmd,stat_v2,ls_v2,fixed_push_mkdir,apex,abb,fixed_push_symlink_timestamp,abb_exec,remount_shell,track_app,sendrecv_v2,sendrecv_v2_brotli,sendrecv_v2_lz4,sendrecv_v2_zstd,sendrecv_v2_dry_run_send\0`;
        const connectData = new TextEncoder().encode(connectString);
        const connectMsg = createADBMessage(ADB_MSG_CONNECT, VERSION, MAX_PAYLOAD, connectData);
        
        await device.transferOut(endpoints.out.endpointNumber, connectMsg);
        console.log('[ADBDriver] CONNECT message sent');

        // Wait for response
        const response = await device.transferIn(endpoints.in.endpointNumber, 24);
        const msg = parseADBMessage(response.data.buffer);
        
        if (msg.command === ADB_MSG_AUTH) {
          console.warn('[ADBDriver] Device requires authentication. Please authorize on your phone.');
          driver.authenticated = false;
        } else if (msg.command === ADB_MSG_CONNECT) {
          console.log('[ADBDriver] Device connected successfully!');
          driver.authenticated = true;
        }

        if (window.EventBus) {
          window.EventBus.emit('driver-connected', { driver: 'adb', method: 'webapi' });
        }

        console.log('[ADBDriver] Connected (persistent)');
        return { 
          success: true, 
          device: {
            name: device.productName || 'Android Device',
            manufacturer: device.manufacturerName,
            vendorId: device.vendorId.toString(16).toUpperCase(),
            productId: device.productId.toString(16).toUpperCase(),
            authenticated: driver.authenticated,
            warning: driver.authenticated ? null : 'Check your phone for authorization prompt'
          }
        };
      } catch (err) {
        console.error('[ADBDriver] Connection failed:', err);
        throw err;
      }
    },

    async disconnect() {
      const driver = window.HardwareDrivers.get('adb');
      
      if (driver.handle && driver.handle.opened) {
        try {
          // Send CLOSE message if authenticated
          if (driver.authenticated && driver.endpoints) {
            const closeMsg = createADBMessage(ADB_MSG_CLSE, 0, 0);
            await driver.handle.transferOut(driver.endpoints.out.endpointNumber, closeMsg);
          }
          
          await driver.handle.close();
        } catch (err) {
          console.warn('[ADBDriver] Close error:', err);
        }
      }
      
      driver.handle = null;
      driver.endpoints = null;
      driver.authenticated = false;
      driver.connected = false;
      
      if (window.EventBus) {
        window.EventBus.emit('driver-disconnected', { driver: 'adb' });
      }
      console.log('[ADBDriver] Disconnected');
      return { success: true };
    },

    async read(timeout = 5000) {
      const driver = window.HardwareDrivers.get('adb');
      if (!driver.handle) throw new Error('ADB not connected');
      if (!driver.authenticated) throw new Error('Device not authenticated. Check your phone.');
      
      try {
        const result = await driver.handle.transferIn(driver.endpoints.in.endpointNumber, 1024);
        const msg = parseADBMessage(result.data.buffer);
        
        return {
          success: true,
          command: msg.command.toString(16),
          data: new TextDecoder().decode(msg.data),
          rawData: Array.from(msg.data)
        };
      } catch (err) {
        console.error('[ADBDriver] Read error:', err);
        throw err;
      }
    },

    async write(command) {
      const driver = window.HardwareDrivers.get('adb');
      if (!driver.handle) throw new Error('ADB not connected');
      if (!driver.authenticated) throw new Error('Device not authenticated. Check your phone.');
      
      try {
        // This is a simplified shell command sender
        // Full ADB implementation would need proper stream handling
        const data = new TextEncoder().encode(command);
        const msg = createADBMessage(ADB_MSG_WRTE, 0, 1, data);
        
        await driver.handle.transferOut(driver.endpoints.out.endpointNumber, msg);
        
        return {
          success: true,
          command,
          bytes: data.length
        };
      } catch (err) {
        console.error('[ADBDriver] Write error:', err);
        throw err;
      }
    }
  });

  console.log('[Driver] ADB Driver v1.1 (persistent) loaded');
  console.log('[ADBDriver] Requirements: USB debugging enabled, phone unlocked, authorize prompt accepted');
})();

