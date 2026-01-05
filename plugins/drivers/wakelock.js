// wakelock.js
// Gnokestation Wake Lock Driver v1.1 (Persistent Access)
// Author: Gnokestation
// License: GPL-3.0

;(() => {
  'use strict';

  const DB_NAME = 'gnoke_wakelock_db';
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
  async function verifyPermission(sentinel) {
    // Wake Lock doesn't have explicit permission query/request
    // We'll use the sentinel to check if lock is still active
    return sentinel !== null && !sentinel.released;
  }

  // --- Wake Lock acquirer ---
  const acquireWakeLock = async () => {
    try {
      const sentinel = await navigator.wakeLock.request('screen');
      
      // Store state in IndexedDB
      await db.save('wakelock_active', true);
      
      // Handle release events
      sentinel.addEventListener('release', () => {
        console.log('[WakeLockDriver] Lock released');
        db.save('wakelock_active', false);
      });
      
      return sentinel;
    } catch (err) {
      console.warn('[WakeLockDriver] Acquire error:', err);
      throw err;
    }
  };

  // --- Try to restore from IndexedDB ---
  const restoreHandle = async () => {
    try {
      const wasActive = await db.get('wakelock_active');
      if (wasActive) {
        // Auto-reacquire if it was previously active
        return await acquireWakeLock();
      }
    } catch (err) {
      console.warn('[WakeLockDriver] No stored state');
    }
    return null;
  };

  // --- HAL registration ---
  window.HardwareDrivers?.register({
    name: 'wakelock',
    type: 'hybrid',
    version: '1.1.0',

    async detect() {
      return !!navigator.wakeLock;
    },

    async connect() {
      try {
        let sentinel = await restoreHandle();
        if (!sentinel || sentinel.released) {
          sentinel = await acquireWakeLock();
        }

        const driver = window.HardwareDrivers.get('wakelock');
        driver.handle = sentinel;
        driver.connected = true;

        if (window.EventBus) {
          window.EventBus.emit('driver-connected', { driver: 'wakelock', method: 'webapi' });
        }

        console.log('[WakeLockDriver] Connected (persistent)');
        return { success: true, handle: sentinel };
      } catch (err) {
        console.error('[WakeLockDriver] Connection failed:', err);
        throw err;
      }
    },

    async disconnect() {
      const driver = window.HardwareDrivers.get('wakelock');
      if (driver.handle) {
        await driver.handle.release();
      }
      driver.handle = null;
      driver.connected = false;
      await db.save('wakelock_active', false);
      
      if (window.EventBus) {
        window.EventBus.emit('driver-disconnected', { driver: 'wakelock' });
      }
      console.log('[WakeLockDriver] Disconnected');
      return { success: true };
    },

    async read() {
      const driver = window.HardwareDrivers.get('wakelock');
      if (!driver.handle) throw new Error('Wake Lock not connected');
      
      return { 
        active: !driver.handle.released,
        type: driver.handle.type
      };
    },

    async write(action) {
      const driver = window.HardwareDrivers.get('wakelock');
      
      if (action === 'release') {
        if (driver.handle) {
          await driver.handle.release();
          driver.handle = null;
          driver.connected = false;
          await db.save('wakelock_active', false);
        }
        return { success: true, action: 'released' };
      } else if (action === 'acquire') {
        if (!driver.handle || driver.handle.released) {
          driver.handle = await acquireWakeLock();
          driver.connected = true;
        }
        return { success: true, action: 'acquired' };
      }
      
      throw new Error('Unknown action. Use "acquire" or "release"');
    }
  });

  console.log('[Driver] Wake Lock Driver v1.1 (persistent) loaded');
})();

