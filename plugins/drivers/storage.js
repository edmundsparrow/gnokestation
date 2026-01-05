// storage.js
// Gnokestation Storage Driver v1.1 (Persistent Access)
// Author: Gnokestation
// License: GPL-3.0

;(() => {
  'use strict';

  const DB_NAME = 'gnoke_storage_db';
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
  async function verifyPermission(handle, mode = 'readwrite') {
    const opts = { mode };
    const perm = await handle.queryPermission(opts);
    if (perm === 'granted') return true;
    if (perm === 'prompt') {
      const req = await handle.requestPermission(opts);
      return req === 'granted';
    }
    return false;
  }

  // --- Directory picker ---
  const pickDirectory = async () => {
    try {
      const handle = await window.showDirectoryPicker();
      if (!(await verifyPermission(handle))) {
        throw new Error('Permission denied');
      }
      await db.save('storage_handle', handle);
      return handle;
    } catch (err) {
      console.warn('[StorageDriver] Picker error:', err);
      throw err;
    }
  };

  // --- Try to restore from IndexedDB ---
  const restoreHandle = async () => {
    try {
      const handle = await db.get('storage_handle');
      if (handle && (await verifyPermission(handle))) {
        return handle;
      }
    } catch (err) {
      console.warn('[StorageDriver] No stored handle');
    }
    return null;
  };

  // --- HAL registration ---
  window.HardwareDrivers?.register({
    name: 'storage',
    type: 'hybrid',
    version: '1.1.0',

    async detect() {
      return !!window.showDirectoryPicker;
    },

    async connect() {
      try {
        let handle = await restoreHandle();
        if (!handle) {
          handle = await pickDirectory();
        }

        const driver = window.HardwareDrivers.get('storage');
        driver.handle = handle;
        driver.connected = true;

        if (window.EventBus) {
          window.EventBus.emit('driver-connected', { driver: 'storage', method: 'webapi' });
        }

        console.log('[StorageDriver] Connected (persistent)');
        return { success: true, handle };
      } catch (err) {
        console.error('[StorageDriver] Connection failed:', err);
        throw err;
      }
    },

    async disconnect() {
      const driver = window.HardwareDrivers.get('storage');
      driver.handle = null;
      driver.connected = false;
      if (window.EventBus) {
        window.EventBus.emit('driver-disconnected', { driver: 'storage' });
      }
      console.log('[StorageDriver] Disconnected');
      return { success: true };
    },

    async read() {
      const driver = window.HardwareDrivers.get('storage');
      if (!driver.handle) throw new Error('Storage not connected');
      const entries = [];
      for await (const [name, entry] of driver.handle.entries()) {
        entries.push({ name, kind: entry.kind });
      }
      return { entries };
    },

    async write(filename, content) {
      const driver = window.HardwareDrivers.get('storage');
      if (!driver.handle) throw new Error('Storage not connected');
      const fileHandle = await driver.handle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      return { success: true };
    }
  });

  console.log('[Driver] Storage Driver v1.1 (persistent) loaded');
})();