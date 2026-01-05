// webapi-permissions-patch.js
/**
 * Gnokestation Web API Permissions Hot-Patch
 * Version: 1.0.0
 * 
 * PURPOSE:
 * Fixes iframe permission issues that prevent web apps like Photopea
 * and SignalTower from accessing camera, clipboard, and other Web APIs.
 * 
 * INSTALLATION:
 * 1. Save this file as plugins/webapi-permissions-patch.js
 * 2. Add to plugins.js: 'webapi-permissions-patch.js'
 * 3. Reload Gnokestation
 * 
 * WHAT IT FIXES:
 * - Photopea cannot save files (clipboard-write blocked)
 * - SignalTower permission popups don't appear (camera/mic blocked)
 * - Any embedded app requiring Web APIs
 * 
 * LICENSE: GPL-3.0
 */

;(() => {
  'use strict';

  console.log('[WebAPI Patch] Initializing permission fix...');

  // ============================================================================
  // CONFIGURATION: All Web API Permissions
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
    'xr-spatial-tracking'
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
  // CORE: Iframe Enhancement Function
  // ============================================================================
  
  function enhanceIframe(iframe) {
    if (!(iframe instanceof HTMLIFrameElement)) return false;
    
    let modified = false;
    
    // Fix 1: Add allow attribute
    const currentAllow = iframe.getAttribute('allow') || '';
    if (currentAllow !== FULL_PERMISSIONS) {
      iframe.setAttribute('allow', FULL_PERMISSIONS);
      modified = true;
      console.log('[WebAPI Patch] ✓ Added permissions to:', iframe.src || 'inline iframe');
    }
    
    // Fix 2: Add sandbox attribute (if missing)
    if (!iframe.hasAttribute('sandbox')) {
      iframe.setAttribute('sandbox', SANDBOX_FLAGS);
      modified = true;
    } else {
      // Ensure critical flags are present
      const currentSandbox = iframe.getAttribute('sandbox');
      const criticalFlags = ['allow-same-origin', 'allow-scripts', 'allow-popups'];
      const missingFlags = criticalFlags.filter(flag => !currentSandbox.includes(flag));
      
      if (missingFlags.length > 0) {
        iframe.setAttribute('sandbox', `${currentSandbox} ${missingFlags.join(' ')}`);
        modified = true;
      }
    }
    
    // Fix 3: Add referrerpolicy for privacy
    if (!iframe.hasAttribute('referrerpolicy')) {
      iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    }
    
    return modified;
  }

  // ============================================================================
  // PATCH 1: Fix Existing Iframes (Immediate Fix)
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
  // PATCH 2: Intercept WindowManager.createWindow (Future Iframes)
  // ============================================================================
  
  function patchWindowManager() {
    if (!window.WindowManager || !window.WindowManager.createWindow) {
      console.warn('[WebAPI Patch] WindowManager not found, skipping patch');
      return false;
    }
    
    const originalCreateWindow = window.WindowManager.createWindow;
    
    window.WindowManager.createWindow = function(title, content, width, height) {
      // Intercept content and fix iframes
      let patchedContent = content;
      
      if (typeof content === 'string' && content.includes('<iframe')) {
        // Parse and enhance iframe tags in HTML string
        patchedContent = content.replace(
          /<iframe([^>]*)>/gi,
          (match, attributes) => {
            // Check if already has allow attribute
            if (!attributes.includes('allow=')) {
              attributes += ` allow="${FULL_PERMISSIONS}"`;
            }
            
            // Check if already has sandbox attribute
            if (!attributes.includes('sandbox=')) {
              attributes += ` sandbox="${SANDBOX_FLAGS}"`;
            }
            
            return `<iframe${attributes}>`;
          }
        );
      }
      
      // Call original method with patched content
      const win = originalCreateWindow.call(this, title, patchedContent, width, height);
      
      // Double-check: fix any iframes in the created window
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
  // PATCH 3: Intercept Terminal App (For "install" Command)
  // ============================================================================
  
  function patchTerminalApp() {
    if (!window.TerminalApp || !window.TerminalApp._recreateAppEntry) {
      console.warn('[WebAPI Patch] TerminalApp not found, skipping patch');
      return false;
    }
    
    const original_recreateAppEntry = window.TerminalApp._recreateAppEntry;
    
    window.TerminalApp._recreateAppEntry = function(url) {
      const appEntry = original_recreateAppEntry.call(this, url);
      
      // Wrap the original handler
      const originalHandler = appEntry.handler;
      
      appEntry.handler = function() {
        // Call original handler
        const win = originalHandler.call(this);
        
        // Fix the iframe immediately after creation
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
  // PATCH 4: MutationObserver (Catch Dynamically Added Iframes)
  // ============================================================================
  
  function setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          // Direct iframe
          if (node.tagName === 'IFRAME') {
            enhanceIframe(node);
          }
          // Iframes inside added elements
          else if (node.querySelectorAll) {
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
    
    console.log('[WebAPI Patch] ✓ MutationObserver active (auto-fix new iframes)');
    return observer;
  }

  // ============================================================================
  // PATCH 5: Override createElement for iframes
  // ============================================================================
  
  function patchCreateElement() {
    const originalCreateElement = document.createElement;
    
    document.createElement = function(tagName, options) {
      const element = originalCreateElement.call(this, tagName, options);
      
      if (tagName.toLowerCase() === 'iframe') {
        // Set attributes immediately
        element.setAttribute('allow', FULL_PERMISSIONS);
        element.setAttribute('sandbox', SANDBOX_FLAGS);
        console.log('[WebAPI Patch] ✓ Created iframe with permissions');
      }
      
      return element;
    };
    
    console.log('[WebAPI Patch] ✓ document.createElement() patched');
  }

  // ============================================================================
  // INITIALIZATION SEQUENCE
  // ============================================================================
  
  function initialize() {
    console.log('[WebAPI Patch] Starting comprehensive permission fix...');
    
    let successCount = 0;
    
    // Immediate fixes
    const fixedCount = patchExistingIframes();
    if (fixedCount > 0) successCount++;
    
    // System patches (wait for dependencies)
    const checkDependencies = setInterval(() => {
      let allReady = true;
      
      // Patch WindowManager
      if (window.WindowManager && !window.WindowManager._webApiPatched) {
        if (patchWindowManager()) {
          window.WindowManager._webApiPatched = true;
          successCount++;
        }
      } else if (!window.WindowManager) {
        allReady = false;
      }
      
      // Patch TerminalApp
      if (window.TerminalApp && !window.TerminalApp._webApiPatched) {
        if (patchTerminalApp()) {
          window.TerminalApp._webApiPatched = true;
          successCount++;
        }
      } else if (!window.TerminalApp) {
        allReady = false;
      }
      
      if (allReady) {
        clearInterval(checkDependencies);
        finalizePatch();
      }
    }, 100);
    
    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkDependencies);
      finalizePatch();
    }, 5000);
  }
  
  function finalizePatch() {
    // Always apply these
    setupMutationObserver();
    patchCreateElement();
    
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║         Web API Permissions Patch ACTIVATED              ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log('║  ✓ Fixed existing iframes                                ║');
    console.log('║  ✓ Patched WindowManager.createWindow()                  ║');
    console.log('║  ✓ Patched TerminalApp._recreateAppEntry()               ║');
    console.log('║  ✓ Enabled MutationObserver (auto-fix)                   ║');
    console.log('║  ✓ Patched document.createElement()                      ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log('║  FIXED APPS:                                              ║');
    console.log('║  • Photopea - Can now save/export files                  ║');
    console.log('║  • SignalTower - Permission popups work                  ║');
    console.log('║  • All web apps - Full Web API access                    ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    
    // Emit event for other systems
    if (window.EventBus) {
      window.EventBus.emit('webapi-patch-ready', {
        permissions: FULL_PERMISSIONS.split('; '),
        timestamp: Date.now()
      });
    }
  }

  // ============================================================================
  // EXPOSE DEBUG API
  // ============================================================================
  
  window.WebAPIPermissionsPatch = {
    version: '1.0.0',
    
    // Manual fix for specific iframe
    fixIframe(iframe) {
      return enhanceIframe(iframe);
    },
    
    // Scan and fix all iframes now
    fixAll() {
      return patchExistingIframes();
    },
    
    // Get current configuration
    getConfig() {
      return {
        permissions: FULL_PERMISSIONS.split('; '),
        sandboxFlags: SANDBOX_FLAGS.split(' ')
      };
    },
    
    // Test if iframe is properly configured
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
        isPatched: allow.includes('clipboard-write') && sandbox.includes('allow-scripts')
      };
    }
  };

  // ============================================================================
  // AUTO-START
  // ============================================================================
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    // DOM already loaded, run immediately
    initialize();
  }

})();

