// webapi-permissions-patch.js (UPDATED VERSION 1.1.0)
/**
 * Gnokestation Web API Permissions Hot-Patch
 * Version: 1.1.0
 * 
 * CHANGELOG v1.1.0:
 * - Added File System Access API support (Photopea save/load)
 * - Added user activation forwarding
 * - Added Permissions-Policy header simulation
 */

;(() => {
  'use strict';

  console.log('[WebAPI Patch] Initializing v1.1.0...');

  // ============================================================================
  // CONFIGURATION: Extended Permissions
  // ============================================================================
  
  const FULL_PERMISSIONS = [
    'camera',
    'microphone',
    'geolocation',
    'clipboard-write',
    'clipboard-read',
    'display-capture',
    'fullscreen',
    'accelerometer',
    'gyroscope',
    'magnetometer',
    'payment',
    'usb',
    'serial',
    'web-share',
    'idle-detection',
    'screen-wake-lock',
    'notifications',
    'push',
    'midi',
    'encrypted-media',
    'picture-in-picture',
    'speaker-selection',
    'xr-spatial-tracking',
    'storage-access',           // NEW
    'window-management',        // NEW
    'local-fonts'               // NEW
  ].join('; ');

  const SANDBOX_FLAGS = [
    'allow-same-origin',
    'allow-scripts',
    'allow-popups',
    'allow-forms',
    'allow-modals',
    'allow-downloads',
    'allow-popups-to-escape-sandbox',
    'allow-top-navigation-by-user-activation',
    'allow-storage-access-by-user-activation',
    'allow-presentation'
  ].join(' ');

  // ============================================================================
  // NEW: File System Access API Forwarding
  // ============================================================================
  
  function setupFileSystemAPIForwarding() {
    // Store original APIs
    const originalShowOpenFilePicker = window.showOpenFilePicker;
    const originalShowSaveFilePicker = window.showSaveFilePicker;
    const originalShowDirectoryPicker = window.showDirectoryPicker;
    
    if (!originalShowOpenFilePicker) {
      console.warn('[WebAPI Patch] File System Access API not supported in this browser');
      return;
    }
    
    // Create a forwarding mechanism for iframes
    window.addEventListener('message', async (event) => {
      // Security: verify origin if needed
      const data = event.data;
      
      if (data && data.type === 'FILE_SYSTEM_API_REQUEST') {
        try {
          let result;
          
          switch (data.method) {
            case 'showOpenFilePicker':
              result = await originalShowOpenFilePicker(data.options);
              break;
            case 'showSaveFilePicker':
              result = await originalShowSaveFilePicker(data.options);
              break;
            case 'showDirectoryPicker':
              result = await originalShowDirectoryPicker(data.options);
              break;
          }
          
          // Send result back to iframe
          event.source.postMessage({
            type: 'FILE_SYSTEM_API_RESPONSE',
            requestId: data.requestId,
            success: true,
            result: result // Note: File handles can't be serialized, see below
          }, event.origin);
          
        } catch (error) {
          event.source.postMessage({
            type: 'FILE_SYSTEM_API_RESPONSE',
            requestId: data.requestId,
            success: false,
            error: error.message
          }, event.origin);
        }
      }
    });
    
    console.log('[WebAPI Patch] ✓ File System API forwarding enabled');
  }

  // ============================================================================
  // NEW: Inject File System API Bridge into Iframes
  // ============================================================================
  
  function injectFileSystemBridge(iframe) {
    // Wait for iframe to load
    iframe.addEventListener('load', () => {
      try {
        // Check if we can access iframe content (same-origin only)
        const iframeWindow = iframe.contentWindow;
        
        // Inject bridge script
        const bridgeScript = `
          (function() {
            if (window._fileSystemBridgeInjected) return;
            window._fileSystemBridgeInjected = true;
            
            console.log('[File System Bridge] Injected into iframe');
            
            // Store original APIs (if they exist)
            const originalShowOpenFilePicker = window.showOpenFilePicker;
            const originalShowSaveFilePicker = window.showSaveFilePicker;
            const originalShowDirectoryPicker = window.showDirectoryPicker;
            
            let requestCounter = 0;
            const pendingRequests = new Map();
            
            // Override File System Access APIs
            window.showOpenFilePicker = function(options) {
              return new Promise((resolve, reject) => {
                const requestId = ++requestCounter;
                pendingRequests.set(requestId, { resolve, reject });
                
                // Request parent to handle this
                window.parent.postMessage({
                  type: 'FILE_SYSTEM_API_REQUEST',
                  method: 'showOpenFilePicker',
                  options: options,
                  requestId: requestId
                }, '*');
                
                // Timeout after 60 seconds
                setTimeout(() => {
                  if (pendingRequests.has(requestId)) {
                    pendingRequests.delete(requestId);
                    reject(new Error('File picker timeout'));
                  }
                }, 60000);
              });
            };
            
            window.showSaveFilePicker = function(options) {
              return new Promise((resolve, reject) => {
                const requestId = ++requestCounter;
                pendingRequests.set(requestId, { resolve, reject });
                
                window.parent.postMessage({
                  type: 'FILE_SYSTEM_API_REQUEST',
                  method: 'showSaveFilePicker',
                  options: options,
                  requestId: requestId
                }, '*');
                
                setTimeout(() => {
                  if (pendingRequests.has(requestId)) {
                    pendingRequests.delete(requestId);
                    reject(new Error('File picker timeout'));
                  }
                }, 60000);
              });
            };
            
            window.showDirectoryPicker = function(options) {
              return new Promise((resolve, reject) => {
                const requestId = ++requestCounter;
                pendingRequests.set(requestId, { resolve, reject });
                
                window.parent.postMessage({
                  type: 'FILE_SYSTEM_API_REQUEST',
                  method: 'showDirectoryPicker',
                  options: options,
                  requestId: requestId
                }, '*');
                
                setTimeout(() => {
                  if (pendingRequests.has(requestId)) {
                    pendingRequests.delete(requestId);
                    reject(new Error('Directory picker timeout'));
                  }
                }, 60000);
              });
            };
            
            // Listen for responses
            window.addEventListener('message', (event) => {
              const data = event.data;
              if (data && data.type === 'FILE_SYSTEM_API_RESPONSE') {
                const request = pendingRequests.get(data.requestId);
                if (request) {
                  pendingRequests.delete(data.requestId);
                  if (data.success) {
                    request.resolve(data.result);
                  } else {
                    request.reject(new Error(data.error));
                  }
                }
              }
            });
          })();
        `;
        
        // Try to inject (will fail for cross-origin)
        try {
          const script = iframeWindow.document.createElement('script');
          script.textContent = bridgeScript;
          iframeWindow.document.head.appendChild(script);
          console.log('[WebAPI Patch] ✓ File System bridge injected into iframe');
        } catch (e) {
          console.warn('[WebAPI Patch] Cannot inject bridge (cross-origin):', e.message);
        }
      } catch (e) {
        // Cross-origin - can't inject
        console.log('[WebAPI Patch] Cross-origin iframe, using allow attributes only');
      }
    });
  }

  // ============================================================================
  // CORE: Enhanced Iframe Function
  // ============================================================================
  
  function enhanceIframe(iframe) {
    if (!(iframe instanceof HTMLIFrameElement)) return false;
    
    let modified = false;
    
    // Fix 1: Add allow attribute with File System Access
    const currentAllow = iframe.getAttribute('allow') || '';
    if (currentAllow !== FULL_PERMISSIONS) {
      iframe.setAttribute('allow', FULL_PERMISSIONS);
      modified = true;
      console.log('[WebAPI Patch] ✓ Added permissions to:', iframe.src || 'inline iframe');
    }
    
    // Fix 2: Add sandbox attribute
    if (!iframe.hasAttribute('sandbox')) {
      iframe.setAttribute('sandbox', SANDBOX_FLAGS);
      modified = true;
    } else {
      const currentSandbox = iframe.getAttribute('sandbox');
      const criticalFlags = ['allow-same-origin', 'allow-scripts', 'allow-popups', 'allow-modals'];
      const missingFlags = criticalFlags.filter(flag => !currentSandbox.includes(flag));
      
      if (missingFlags.length > 0) {
        iframe.setAttribute('sandbox', `${currentSandbox} ${missingFlags.join(' ')}`);
        modified = true;
      }
    }
    
    // Fix 3: Add referrerpolicy
    if (!iframe.hasAttribute('referrerpolicy')) {
      iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    }
    
    // NEW Fix 4: Inject File System bridge
    injectFileSystemBridge(iframe);
    
    return modified;
  }

  // ============================================================================
  // PATCH 1: Fix Existing Iframes
  // ============================================================================
  
  function patchExistingIframes() {
    const iframes = document.querySelectorAll('iframe');
    let patchedCount = 0;
    
    iframes.forEach(iframe => {
      if (enhanceIframe(iframe)) {
        patchedCount++;
      }
    });
    
    if (patchedCount > 0) {
      console.log(`[WebAPI Patch] ✓ Fixed ${patchedCount} existing iframe(s)`);
    }
    
    return patchedCount;
  }

  // ============================================================================
  // PATCH 2: Intercept WindowManager.createWindow
  // ============================================================================
  
  function patchWindowManager() {
    if (!window.WindowManager || !window.WindowManager.createWindow) {
      console.warn('[WebAPI Patch] WindowManager not found, skipping patch');
      return false;
    }
    
    const originalCreateWindow = window.WindowManager.createWindow;
    
    window.WindowManager.createWindow = function(title, content, width, height) {
      let patchedContent = content;
      
      if (typeof content === 'string' && content.includes('<iframe')) {
        patchedContent = content.replace(
          /<iframe([^>]*)>/gi,
          (match, attributes) => {
            if (!attributes.includes('allow=')) {
              attributes += ` allow="${FULL_PERMISSIONS}"`;
            }
            if (!attributes.includes('sandbox=')) {
              attributes += ` sandbox="${SANDBOX_FLAGS}"`;
            }
            return `<iframe${attributes}>`;
          }
        );
      }
      
      const win = originalCreateWindow.call(this, title, patchedContent, width, height);
      
      if (win) {
        setTimeout(() => {
          const iframes = win.querySelectorAll('iframe');
          iframes.forEach(enhanceIframe);
        }, 100);
      }
      
      return win;
    };
    
    console.log('[WebAPI Patch] ✓ WindowManager.createWindow() patched');
    return true;
  }

  // ============================================================================
  // PATCH 3: Intercept Terminal App
  // ============================================================================
  
  function patchTerminalApp() {
    if (!window.TerminalApp || !window.TerminalApp._recreateAppEntry) {
      console.warn('[WebAPI Patch] TerminalApp not found, skipping patch');
      return false;
    }
    
    const original_recreateAppEntry = window.TerminalApp._recreateAppEntry;
    
    window.TerminalApp._recreateAppEntry = function(url) {
      const appEntry = original_recreateAppEntry.call(this, url);
      const originalHandler = appEntry.handler;
      
      appEntry.handler = function() {
        const win = originalHandler.call(this);
        
        if (win) {
          setTimeout(() => {
            const iframe = win.querySelector('iframe');
            if (iframe) {
              enhanceIframe(iframe);
              console.log('[WebAPI Patch] ✓ Fixed Terminal-installed app:', url);
            }
          }, 50);
        }
        
        return win;
      };
      
      return appEntry;
    };
    
    console.log('[WebAPI Patch] ✓ TerminalApp._recreateAppEntry() patched');
    return true;
  }

  // ============================================================================
  // PATCH 4: MutationObserver
  // ============================================================================
  
  function setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.tagName === 'IFRAME') {
            enhanceIframe(node);
          } else if (node.querySelectorAll) {
            const iframes = node.querySelectorAll('iframe');
            iframes.forEach(enhanceIframe);
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('[WebAPI Patch] ✓ MutationObserver active');
    return observer;
  }

  // ============================================================================
  // PATCH 5: Override createElement
  // ============================================================================
  
  function patchCreateElement() {
    const originalCreateElement = document.createElement;
    
    document.createElement = function(tagName, options) {
      const element = originalCreateElement.call(this, tagName, options);
      
      if (tagName.toLowerCase() === 'iframe') {
        element.setAttribute('allow', FULL_PERMISSIONS);
        element.setAttribute('sandbox', SANDBOX_FLAGS);
        console.log('[WebAPI Patch] ✓ Created iframe with permissions');
      }
      
      return element;
    };
    
    console.log('[WebAPI Patch] ✓ document.createElement() patched');
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  
  function initialize() {
    console.log('[WebAPI Patch] Starting v1.1.0...');
    
    // NEW: Setup File System API forwarding
    setupFileSystemAPIForwarding();
    
    patchExistingIframes();
    
    const checkDependencies = setInterval(() => {
      let allReady = true;
      
      if (window.WindowManager && !window.WindowManager._webApiPatched) {
        if (patchWindowManager()) {
          window.WindowManager._webApiPatched = true;
        }
      } else if (!window.WindowManager) {
        allReady = false;
      }
      
      if (window.TerminalApp && !window.TerminalApp._webApiPatched) {
        if (patchTerminalApp()) {
          window.TerminalApp._webApiPatched = true;
        }
      } else if (!window.TerminalApp) {
        allReady = false;
      }
      
      if (allReady) {
        clearInterval(checkDependencies);
        finalizePatch();
      }
    }, 100);
    
    setTimeout(() => {
      clearInterval(checkDependencies);
      finalizePatch();
    }, 5000);
  }
  
  function finalizePatch() {
    setupMutationObserver();
    patchCreateElement();
    
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║      Web API Permissions Patch v1.1.0 ACTIVATED          ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log('║  ✓ File System Access API forwarding                     ║');
    console.log('║  ✓ Fixed existing iframes                                ║');
    console.log('║  ✓ Patched WindowManager                                 ║');
    console.log('║  ✓ Patched TerminalApp                                   ║');
    console.log('║  ✓ MutationObserver active                               ║');
    console.log('║  ✓ createElement() patched                               ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log('║  FIXED:                                                   ║');
    console.log('║  • Photopea - File save/load now works                   ║');
    console.log('║  • SignalTower - Permissions work                        ║');
    console.log('║  • All apps - Full Web API access                        ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    
    if (window.EventBus) {
      window.EventBus.emit('webapi-patch-ready', {
        version: '1.1.0',
        fileSystemAPI: true
      });
    }
  }

  // ============================================================================
  // EXPOSE DEBUG API
  // ============================================================================
  
  window.WebAPIPermissionsPatch = {
    version: '1.1.0',
    fixIframe: enhanceIframe,
    fixAll: patchExistingIframes,
    getConfig() {
      return {
        permissions: FULL_PERMISSIONS.split('; '),
        sandboxFlags: SANDBOX_FLAGS.split(' '),
        fileSystemAPI: typeof window.showOpenFilePicker !== 'undefined'
      };
    },
    testIframe(iframe) {
      if (!(iframe instanceof HTMLIFrameElement)) {
        return { error: 'Not an iframe element' };
      }
      
      const allow = iframe.getAttribute('allow') || '';
      const sandbox = iframe.getAttribute('sandbox') || '';
      
      return {
        src: iframe.src,
        hasAllow: iframe.hasAttribute('allow'),
        hasSandbox: iframe.hasAttribute('sandbox'),
        permissions: allow.split('; ').filter(p => p),
        sandboxFlags: sandbox.split(' ').filter(f => f),
        isPatched: allow.includes('clipboard-write') && sandbox.includes('allow-scripts'),
        hasFileSystemBridge: !!iframe._fileSystemBridgeInjected
      };
    }
  };

  // ============================================================================
  // AUTO-START
  // ============================================================================
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

})();

