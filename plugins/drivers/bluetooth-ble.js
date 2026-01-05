// bluetooth-ble.js
// Gnokestation Bluetooth Low Energy (BLE) Driver v1.1 (Persistent Access)
// Author: Gnokestation
// License: GPL-3.0
// For BLE devices: fitness trackers, heart rate monitors, smart lights, sensors, etc.

;(() => {
  'use strict';

  const DB_NAME = 'gnoke_bluetooth_ble_db';
  const DB_STORE = 'handles';

  // --- Common BLE Service UUIDs ---
  const SERVICES = {
    BATTERY: 'battery_service',
    HEART_RATE: 'heart_rate',
    DEVICE_INFO: 'device_information',
    GENERIC_ACCESS: 'generic_access',
    CYCLING_POWER: 'cycling_power',
    CYCLING_SPEED: 'cycling_speed_and_cadence',
    RUNNING_SPEED: 'running_speed_and_cadence',
    ENVIRONMENTAL: 'environmental_sensing',
    GLUCOSE: 'glucose',
    HEALTH_THERMOMETER: 'health_thermometer',
    BLOOD_PRESSURE: 'blood_pressure',
    WEIGHT_SCALE: 'weight_scale',
    PULSE_OXIMETER: 'pulse_oximeter'
  };

  // --- Common BLE Characteristic UUIDs ---
  const CHARACTERISTICS = {
    BATTERY_LEVEL: 'battery_level',
    HEART_RATE_MEASUREMENT: 'heart_rate_measurement',
    MANUFACTURER_NAME: 'manufacturer_name_string',
    MODEL_NUMBER: 'model_number_string',
    SERIAL_NUMBER: 'serial_number_string',
    FIRMWARE_REVISION: 'firmware_revision_string',
    HARDWARE_REVISION: 'hardware_revision_string',
    DEVICE_NAME: 'device_name',
    APPEARANCE: 'appearance',
    TEMPERATURE: 'temperature',
    HUMIDITY: 'humidity'
  };

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
    return device !== null && device.gatt !== undefined;
  }

  // --- Device picker ---
  const pickDevice = async (options = {}) => {
    try {
      const filters = options.filters || [];
      const optionalServices = options.services || Object.values(SERVICES);
      
      const device = await navigator.bluetooth.requestDevice({
        filters: filters.length > 0 ? filters : [{ services: [SERVICES.BATTERY] }],
        optionalServices: optionalServices,
        acceptAllDevices: filters.length === 0 && optionalServices.length === 0
      });
      
      if (!device) {
        throw new Error('No device selected');
      }
      
      // Store device info
      await db.save('ble_device_info', {
        id: device.id,
        name: device.name
      });
      
      return device;
    } catch (err) {
      console.warn('[BluetoothBLEDriver] Picker error:', err);
      throw err;
    }
  };

  // --- Try to restore from previously paired devices ---
  const restoreHandle = async () => {
    try {
      const deviceInfo = await db.get('ble_device_info');
      if (!deviceInfo) return null;
      
      const devices = await navigator.bluetooth.getDevices();
      const device = devices.find(d => d.id === deviceInfo.id);
      
      if (device && (await verifyPermission(device))) {
        return device;
      }
    } catch (err) {
      console.warn('[BluetoothBLEDriver] No stored device');
    }
    return null;
  };

  // --- Parse battery level ---
  function parseBatteryLevel(value) {
    return value.getUint8(0);
  }

  // --- Parse heart rate ---
  function parseHeartRate(value) {
    const flags = value.getUint8(0);
    const rate = flags & 0x01 ? value.getUint16(1, true) : value.getUint8(1);
    return rate;
  }

  // --- Parse temperature ---
  function parseTemperature(value) {
    // IEEE-11073 FLOAT format
    const mantissa = value.getInt16(0, true);
    const exponent = value.getInt8(2);
    return mantissa * Math.pow(10, exponent);
  }

  // --- HAL registration ---
  window.HardwareDrivers?.register({
    name: 'bluetooth-ble',
    type: 'hybrid',
    version: '1.1.0',

    async detect() {
      return 'bluetooth' in navigator;
    },

    async connect(options = {}) {
      try {
        let device = await restoreHandle();
        if (!device) {
          device = await pickDevice(options);
        }

        // Connect to GATT server
        if (!device.gatt.connected) {
          await device.gatt.connect();
        }

        const driver = window.HardwareDrivers.get('bluetooth-ble');
        driver.handle = device;
        driver.server = device.gatt;
        driver.services = new Map();
        driver.characteristics = new Map();
        driver.notifications = new Map();
        driver.connected = true;

        // Handle disconnection
        device.addEventListener('gattserverdisconnected', () => {
          console.log('[BluetoothBLEDriver] Device disconnected');
          driver.connected = false;
          if (window.EventBus) {
            window.EventBus.emit('bluetooth-disconnected', { device: device.name });
          }
        });

        if (window.EventBus) {
          window.EventBus.emit('driver-connected', { driver: 'bluetooth-ble', method: 'webapi' });
        }

        console.log('[BluetoothBLEDriver] Connected (persistent)');
        return { 
          success: true, 
          device: {
            id: device.id,
            name: device.name || 'Unknown BLE Device',
            connected: device.gatt.connected,
            hint: 'Use driver.discover() to find available services'
          }
        };
      } catch (err) {
        console.error('[BluetoothBLEDriver] Connection failed:', err);
        throw err;
      }
    },

    async disconnect() {
      const driver = window.HardwareDrivers.get('bluetooth-ble');
      
      // Stop all notifications
      for (const [key, characteristic] of driver.notifications) {
        try {
          await characteristic.stopNotifications();
        } catch (err) {
          console.warn('[BluetoothBLEDriver] Stop notification error:', err);
        }
      }
      driver.notifications.clear();
      
      // Disconnect GATT
      if (driver.handle && driver.handle.gatt.connected) {
        try {
          await driver.handle.gatt.disconnect();
        } catch (err) {
          console.warn('[BluetoothBLEDriver] Disconnect error:', err);
        }
      }
      
      driver.handle = null;
      driver.server = null;
      driver.services.clear();
      driver.characteristics.clear();
      driver.connected = false;
      
      if (window.EventBus) {
        window.EventBus.emit('driver-disconnected', { driver: 'bluetooth-ble' });
      }
      console.log('[BluetoothBLEDriver] Disconnected');
      return { success: true };
    },

    async read(serviceUuid, characteristicUuid) {
      const driver = window.HardwareDrivers.get('bluetooth-ble');
      if (!driver.handle) throw new Error('Bluetooth BLE not connected');
      if (!driver.server.connected) throw new Error('GATT server not connected');
      
      try {
        // Get or cache service
        let service = driver.services.get(serviceUuid);
        if (!service) {
          service = await driver.server.getPrimaryService(serviceUuid);
          driver.services.set(serviceUuid, service);
        }
        
        // Get or cache characteristic
        const charKey = `${serviceUuid}:${characteristicUuid}`;
        let characteristic = driver.characteristics.get(charKey);
        if (!characteristic) {
          characteristic = await service.getCharacteristic(characteristicUuid);
          driver.characteristics.set(charKey, characteristic);
        }
        
        // Read value
        const value = await characteristic.readValue();
        const bytes = new Uint8Array(value.buffer);
        
        // Try to parse common data types
        let parsed = null;
        if (characteristicUuid === CHARACTERISTICS.BATTERY_LEVEL) {
          parsed = parseBatteryLevel(value);
        } else if (characteristicUuid === CHARACTERISTICS.HEART_RATE_MEASUREMENT) {
          parsed = parseHeartRate(value);
        } else if (characteristicUuid === CHARACTERISTICS.TEMPERATURE) {
          parsed = parseTemperature(value);
        } else if (characteristic.properties.read && bytes.length < 64) {
          // Try to decode as text for small values
          try {
            parsed = new TextDecoder().decode(bytes);
          } catch (e) {
            parsed = null;
          }
        }
        
        return {
          success: true,
          service: serviceUuid,
          characteristic: characteristicUuid,
          value: Array.from(bytes),
          parsed: parsed,
          length: bytes.length
        };
      } catch (err) {
        console.error('[BluetoothBLEDriver] Read error:', err);
        throw err;
      }
    },

    async write(serviceUuid, characteristicUuid, data) {
      const driver = window.HardwareDrivers.get('bluetooth-ble');
      if (!driver.handle) throw new Error('Bluetooth BLE not connected');
      if (!driver.server.connected) throw new Error('GATT server not connected');
      
      try {
        // Get or cache service
        let service = driver.services.get(serviceUuid);
        if (!service) {
          service = await driver.server.getPrimaryService(serviceUuid);
          driver.services.set(serviceUuid, service);
        }
        
        // Get or cache characteristic
        const charKey = `${serviceUuid}:${characteristicUuid}`;
        let characteristic = driver.characteristics.get(charKey);
        if (!characteristic) {
          characteristic = await service.getCharacteristic(characteristicUuid);
          driver.characteristics.set(charKey, characteristic);
        }
        
        // Convert data to Uint8Array if needed
        let buffer;
        if (typeof data === 'string') {
          buffer = new TextEncoder().encode(data);
        } else if (Array.isArray(data)) {
          buffer = new Uint8Array(data);
        } else if (data instanceof Uint8Array) {
          buffer = data;
        } else if (typeof data === 'number') {
          buffer = new Uint8Array([data]);
        } else {
          throw new Error('Invalid data format. Use string, number, array, or Uint8Array');
        }
        
        // Write value
        await characteristic.writeValue(buffer);
        
        return {
          success: true,
          service: serviceUuid,
          characteristic: characteristicUuid,
          bytes: buffer.length
        };
      } catch (err) {
        console.error('[BluetoothBLEDriver] Write error:', err);
        throw err;
      }
    },

    // Discover all services and characteristics
    async discover() {
      const driver = window.HardwareDrivers.get('bluetooth-ble');
      if (!driver.handle) throw new Error('Not connected');
      
      console.log('[BluetoothBLEDriver] Discovering services...');
      
      const discovered = {
        device: driver.handle.name,
        services: []
      };
      
      try {
        const services = await driver.server.getPrimaryServices();
        
        for (const service of services) {
          const serviceInfo = {
            uuid: service.uuid,
            characteristics: []
          };
          
          try {
            const characteristics = await service.getCharacteristics();
            
            for (const char of characteristics) {
              serviceInfo.characteristics.push({
                uuid: char.uuid,
                properties: {
                  read: char.properties.read,
                  write: char.properties.write,
                  writeWithoutResponse: char.properties.writeWithoutResponse,
                  notify: char.properties.notify,
                  indicate: char.properties.indicate
                }
              });
            }
          } catch (err) {
            serviceInfo.error = err.message;
          }
          
          discovered.services.push(serviceInfo);
          driver.services.set(service.uuid, service);
        }
        
        console.log('[BluetoothBLEDriver] Discovery complete:', discovered);
        return {
          success: true,
          discovered
        };
      } catch (err) {
        console.error('[BluetoothBLEDriver] Discovery error:', err);
        throw err;
      }
    },

    // Subscribe to notifications
    async subscribe(serviceUuid, characteristicUuid, callback) {
      const driver = window.HardwareDrivers.get('bluetooth-ble');
      if (!driver.handle) throw new Error('Not connected');
      
      try {
        let service = driver.services.get(serviceUuid);
        if (!service) {
          service = await driver.server.getPrimaryService(serviceUuid);
          driver.services.set(serviceUuid, service);
        }
        
        const charKey = `${serviceUuid}:${characteristicUuid}`;
        let characteristic = driver.characteristics.get(charKey);
        if (!characteristic) {
          characteristic = await service.getCharacteristic(characteristicUuid);
          driver.characteristics.set(charKey, characteristic);
        }
        
        const handler = (event) => {
          const value = event.target.value;
          const bytes = new Uint8Array(value.buffer);
          
          let parsed = null;
          if (characteristicUuid === CHARACTERISTICS.BATTERY_LEVEL) {
            parsed = parseBatteryLevel(value);
          } else if (characteristicUuid === CHARACTERISTICS.HEART_RATE_MEASUREMENT) {
            parsed = parseHeartRate(value);
          } else if (characteristicUuid === CHARACTERISTICS.TEMPERATURE) {
            parsed = parseTemperature(value);
          }
          
          callback({
            service: serviceUuid,
            characteristic: characteristicUuid,
            value: Array.from(bytes),
            parsed: parsed,
            timestamp: Date.now()
          });
        };
        
        characteristic.addEventListener('characteristicvaluechanged', handler);
        await characteristic.startNotifications();
        
        driver.notifications.set(charKey, characteristic);
        
        return {
          success: true,
          message: 'Subscribed to notifications',
          service: serviceUuid,
          characteristic: characteristicUuid
        };
      } catch (err) {
        console.error('[BluetoothBLEDriver] Subscribe error:', err);
        throw err;
      }
    },

    // Unsubscribe from notifications
    async unsubscribe(serviceUuid, characteristicUuid) {
      const driver = window.HardwareDrivers.get('bluetooth-ble');
      const charKey = `${serviceUuid}:${characteristicUuid}`;
      const characteristic = driver.notifications.get(charKey);
      
      if (!characteristic) {
        return { success: false, message: 'Not subscribed' };
      }
      
      try {
        await characteristic.stopNotifications();
        driver.notifications.delete(charKey);
        
        return {
          success: true,
          message: 'Unsubscribed from notifications'
        };
      } catch (err) {
        console.error('[BluetoothBLEDriver] Unsubscribe error:', err);
        throw err;
      }
    },

    // Helper: Read battery level
    async getBattery() {
      try {
        const result = await this.read(SERVICES.BATTERY, CHARACTERISTICS.BATTERY_LEVEL);
        return {
          success: true,
          level: result.parsed,
          percentage: `${result.parsed}%`
        };
      } catch (err) {
        return { success: false, error: err.message };
      }
    },

    // Helper: Read device info
    async getDeviceInfo() {
      const info = {};
      const infoChars = [
        { key: 'manufacturer', uuid: CHARACTERISTICS.MANUFACTURER_NAME },
        { key: 'model', uuid: CHARACTERISTICS.MODEL_NUMBER },
        { key: 'serial', uuid: CHARACTERISTICS.SERIAL_NUMBER },
        { key: 'firmware', uuid: CHARACTERISTICS.FIRMWARE_REVISION },
        { key: 'hardware', uuid: CHARACTERISTICS.HARDWARE_REVISION }
      ];
      
      for (const { key, uuid } of infoChars) {
        try {
          const result = await this.read(SERVICES.DEVICE_INFO, uuid);
          info[key] = result.parsed || new TextDecoder().decode(new Uint8Array(result.value));
        } catch (err) {
          info[key] = 'N/A';
        }
      }
      
      return { success: true, info };
    },

    // Helper: Monitor heart rate
    async monitorHeartRate(callback) {
      return await this.subscribe(
        SERVICES.HEART_RATE, 
        CHARACTERISTICS.HEART_RATE_MEASUREMENT,
        (data) => callback(data.parsed)
      );
    }
  });

  console.log('[Driver] Bluetooth BLE Driver v1.1 (persistent) loaded');
  console.log('[BluetoothBLEDriver] For Bluetooth Low Energy devices');
  console.log('[BluetoothBLEDriver] Supported: fitness trackers, heart rate monitors, sensors, smart devices');
  console.log('[BluetoothBLEDriver] Try: driver.discover() to explore your BLE device');
})();

