// FILE: applications/installer.js - Gnokestation Quick Installer (Driver-style, No App Registration)
// Similar to hardware drivers - provides functionality without appearing in app lists

(function() {
  'use strict';

  /**
   * Quick Installer Service - Utility only, not a registered app
   * Can be called directly by other components like App Manager
   */
  window.InstallerApp = {
    /**
     * Opens a simple popup for quick URL installation
     * @returns {HTMLElement} The created popup overlay
     */
    open() {
      // Create a centered popup overlay
      const overlay = document.createElement('div');
      overlay.id = 'installer-popup-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.2s ease-in-out;
      `;

      const popup = document.createElement('div');
      popup.style.cssText = `
        background: white;
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        padding: 24px;
        width: 90%;
        max-width: 450px;
        animation: slideIn 0.3s ease-out;
      `;

      popup.innerHTML = `
        <style>
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        </style>
        <h3 style="margin: 0 0 8px 0; color: #2C3E50; font-size: 18px; font-family: 'Segoe UI', sans-serif;">
          Install Web App
        </h3>
        <p style="margin: 0 0 20px 0; color: #7F8C8D; font-size: 13px; font-family: 'Segoe UI', sans-serif;">
          Enter any website URL to add it as an app
        </p>
        <form id="quick-install-form">
          <input 
            type="text" 
            id="quick-url-input" 
            placeholder="https://example.com or example.com" 
            style="
              width: 100%; 
              padding: 12px; 
              border: 2px solid #BDC3C7; 
              border-radius: 6px; 
              font-size: 14px; 
              font-family: 'Segoe UI', sans-serif;
              box-sizing: border-box;
              margin-bottom: 16px;
              outline: none;
              transition: border-color 0.2s;
            "
            autofocus
            required
          />
          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button 
              type="button" 
              id="cancel-install-btn"
              style="
                padding: 10px 20px; 
                background: #ECF0F1; 
                color: #2C3E50; 
                border: none; 
                border-radius: 6px; 
                cursor: pointer; 
                font-size: 14px;
                font-weight: 600;
                font-family: 'Segoe UI', sans-serif;
                transition: background 0.2s;
              "
            >
              Cancel
            </button>
            <button 
              type="submit"
              style="
                padding: 10px 20px; 
                background: #2563eb; 
                color: white; 
                border: none; 
                border-radius: 6px; 
                cursor: pointer; 
                font-size: 14px;
                font-weight: 600;
                font-family: 'Segoe UI', sans-serif;
                transition: background 0.2s;
              "
            >
              Install
            </button>
          </div>
        </form>
      `;

      overlay.appendChild(popup);
      document.body.appendChild(overlay);

      // Add hover effects
      const buttons = popup.querySelectorAll('button');
      buttons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
          if (btn.id === 'cancel-install-btn') {
            btn.style.background = '#BDC3C7';
          } else {
            btn.style.background = '#1d4ed8';
          }
        });
        btn.addEventListener('mouseleave', () => {
          if (btn.id === 'cancel-install-btn') {
            btn.style.background = '#ECF0F1';
          } else {
            btn.style.background = '#2563eb';
          }
        });
      });

      // Input focus effect
      const input = popup.querySelector('#quick-url-input');
      input.addEventListener('focus', () => {
        input.style.borderColor = '#2563eb';
      });
      input.addEventListener('blur', () => {
        input.style.borderColor = '#BDC3C7';
      });

      // Handle form submission
      const form = popup.querySelector('#quick-install-form');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const urlInput = popup.querySelector('#quick-url-input');
        let url = urlInput.value.trim();

        if (!url) {
          alert('Please enter a URL');
          return;
        }

        // Auto-add https:// if no protocol
        if (!/^[a-z]+:\/\//i.test(url)) {
          url = 'https://' + url;
        }

        // Validate URL
        try {
          new URL(url);
        } catch (e) {
          alert('Invalid URL. Please enter a valid website address.');
          return;
        }

        // Install the app
        const success = this.installFromUrl(url);
        
        if (success) {
          // Close popup
          overlay.remove();
        }
      });

      // Handle cancel button
      const cancelBtn = popup.querySelector('#cancel-install-btn');
      cancelBtn.addEventListener('click', () => {
        overlay.remove();
      });

      // Close on overlay click (outside popup)
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.remove();
        }
      });

      // Close on Escape key
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          overlay.remove();
          document.removeEventListener('keydown', escapeHandler);
        }
      };
      document.addEventListener('keydown', escapeHandler);

      return overlay;
    },

    /**
     * Install an app from a URL
     * @param {string} url - The URL to install
     * @returns {boolean} Success status
     */
    installFromUrl(url) {
      // Generate ID from URL
      const id = this._makeId(url);
      
      // Check if already exists
      if (window.AppRegistry) {
        const existing = window.AppRegistry.getApp?.(id);
        if (existing) {
          alert(`This website is already installed as "${existing.name}"`);
          return false;
        }
      }

      // Generate friendly name
      const name = this._friendlyNameFromUrl(url);

      // Create app object
      const appObj = {
        id: id,
        name: name,
        icon: this._faviconFor(url) || this._createFallbackIcon(name),
        url: url,
        handler: () => this._createWebAppWindow(name, url),
        singleInstance: true
      };

      // Register the app
      const registered = this._registerAppObject(appObj);

      if (registered) {
        // Save to localStorage
        const registry = JSON.parse(localStorage.getItem('gnokeRegistry') || '{}');
        registry[id] = {
          id: id,
          name: name,
          url: url,
          showOnDesktop: true,
          installedAt: new Date().toISOString()
        };
        localStorage.setItem('gnokeRegistry', JSON.stringify(registry));

        // Show success message
        this._showToast(`✓ Installed "${name}"`, 'success');

        // Force refresh
        if (window.StartMenuApp?.refreshApps) {
          setTimeout(() => window.StartMenuApp.refreshApps(), 100);
        }
        if (window.DesktopIconManager?.refreshIcons) {
          setTimeout(() => window.DesktopIconManager.refreshIcons(), 100);
        }
        if (window.EventBus) {
          window.EventBus.emit('desktop-icon-add', {
            id: id,
            name: name,
            icon: appObj.icon,
            handler: appObj.handler
          });
        }

        return true;
      } else {
        alert('Failed to install app. Please try again.');
        return false;
      }
    },

    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type of toast ('success' or 'error')
     */
    _showToast(message, type = 'success') {
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        bottom: 60px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        font-family: 'Segoe UI', sans-serif;
        font-size: 14px;
        z-index: 10001;
        animation: slideInUp 0.3s ease-out;
      `;
      toast.innerHTML = `
        <style>
          @keyframes slideInUp {
            from { transform: translateY(100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        </style>
        ${message}
      `;

      document.body.appendChild(toast);

      setTimeout(() => {
        toast.style.animation = 'slideInUp 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    },

    // Helper: Generate ID from URL
    _makeId(str) {
      return String(str || '')
        .toLowerCase()
        .replace(/^(https?:\/\/|file:\/\/\/?)/, '')
        .replace(/[^\w\-\.\/]/g, '-')
        .replace(/[\/\.]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 64)
        || ('app_' + Math.random().toString(36).slice(2, 8));
    },

    // Helper: Generate friendly name from URL
    _friendlyNameFromUrl(input) {
      try {
        const u = new URL(input);
        const host = u.hostname.replace(/^www\./, '');
        const firstSegment = (u.pathname.split('/').filter(Boolean)[0] || '')
          .replace(/\.[a-z0-9]+$/i, '');
        return (firstSegment ? `${firstSegment} – ${host}` : host).replace(/[_\-]/g, ' ');
      } catch (e) {
        const parts = input.split(/[/\\]/).filter(Boolean);
        const base = parts[parts.length - 1] || input;
        return base.replace(/\.[a-z0-9]+$/i, '').replace(/[_\-]/g, ' ');
      }
    },

    // Helper: Get favicon URL
    _faviconFor(url) {
      try {
        const u = new URL(url);
        return `https://icon.horse/icon/${u.hostname}`;
      } catch (e) {
        return null;
      }
    },

    // Helper: Generate color from string
    _stringToColor(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      const hue = hash % 360;
      return `hsl(${hue}, 65%, 50%)`;
    },

    // Helper: Create fallback icon
    _createFallbackIcon(name) {
      const letter = name.charAt(0).toUpperCase();
      const color = this._stringToColor(name);
      return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><rect width='48' height='48' rx='8' fill='${encodeURIComponent(color)}'/><text x='24' y='32' text-anchor='middle' font-size='24' font-weight='bold' fill='white' font-family='Arial'>${letter}</text></svg>`;
    },

    // Helper: Create web app window with iframe
    _createWebAppWindow(appName, url) {
      const faviconUrl = this._faviconFor(url);
      let fallbackIcon;
      try {
        fallbackIcon = this._createFallbackIcon(new URL(url).hostname);
      } catch (e) {
        fallbackIcon = this._createFallbackIcon(appName);
      }

      const iframeHTML = `
        <div style="height:100%;display:flex;flex-direction:column;background:#fff;">
          <div style="padding:8px 10px;border-bottom:1px solid #ddd;background:#f7f7f7;display:flex;align-items:center;gap:8px;">
            <img src="${faviconUrl}" style="width:16px;height:16px;" onerror="this.src='${fallbackIcon}'"/>
            <strong style="font-family:Segoe UI, sans-serif;flex:1;">${appName}</strong>
            <button onclick="window.open('${url}', '_blank')" style="padding:4px 8px;border:1px solid #ddd;border-radius:3px;background:white;cursor:pointer;font-size:11px;">Open in New Tab</button>
          </div>
          <iframe src="${url}" style="flex:1;border:0;width:100%;height:100%;" sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"></iframe>
        </div>
      `;
      return window.WindowManager.createWindow(appName, iframeHTML, 900, 600);
    },

    // Helper: Register app object with AppRegistry
    _registerAppObject(appObj) {
      let registered = false;
      
      if (window.AppRegistry && typeof window.AppRegistry.registerApp === 'function') {
        registered = window.AppRegistry.registerApp(appObj);
      } else if (window.AppRegistry && window.AppRegistry.registeredApps instanceof Map) {
        window.AppRegistry.registeredApps.set(appObj.id, appObj);
        registered = true;
      }

      if (registered && window.EventBus) {
        window.EventBus.emit('app-registered', appObj);
      }
      
      return registered;
    }
  };

  // --- NO APP REGISTRATION ---
  // This service works like hardware drivers - it provides functionality
  // without appearing in the app list or start menu.
  // Components can call window.InstallerApp.open() directly.

  console.log('[InstallerApp] Quick installer service loaded (driver-style, no app registration)');

})();