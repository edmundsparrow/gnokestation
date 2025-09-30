/* ========================================
 * FILE: core/window-manager.js
 * VERSION: 1.0.0
 * BUILD DATE: 2025-09-29
 *
 * PURPOSE:
 * Core service for managing the lifecycle, position, and
 * interaction of all desktop-style windows in Unity Station.
 *
 * ARCHITECTURE:
 * - Singleton object exposed as window.WindowManager
 * - Manages active window Map, z-index, and window IDs.
 * - Handles UI element creation, dragging, and control events.
 *
 * DEPENDENCIES:
 * - EventBus (for emitting lifecycle events)
 *
 * LIFECYCLE:
 * 1. Loaded after EventBus.
 * 2. Initialized once, runs throughout environment lifetime.
 * 3. Registers itself with the Docs service.
 *
 * FEATURES:
 * - Window creation with title, content, size.
 * - Minimize, Maximize/Restore, Close functions.
 * - Drag-and-drop movement.
 * - Auto-focus (bring to front) on click.
 * - Emits key lifecycle events via EventBus.
 *
 * EXAMPLE USAGE:
 * WindowManager.createWindow('Terminal', '<pre>Loading...</pre>', 600, 400);
 *
 * AUTHOR:
 *   edmundsparrow.netlify.app | whatsappme @ 09024054758 | webaplications5050@gmail.com
 * ======================================== */

window.WindowManager = {
    activeWindows: new Map(),
    nextWindowId: 0,
    highestZIndex: 1000,
    
    // Create new window - core functionality that never changes
    createWindow(title, content, width = 400, height = 300) {
        const windowId = `win-${++this.nextWindowId}`;
        
        // Input validation
        if (!title || !content) {
            console.error('WindowManager.createWindow: Title and content required');
            return null;
        }
        
        // Create window element
        const win = document.createElement('div');
        win.className = 'window';
        win.id = windowId;
        
        // Build window HTML
        win.innerHTML = `
            <div class="window-title-bar">
                <span class="window-title">${this.escapeHtml(title)}</span>
                <div class="window-controls">
                    <button class="minimize-btn" title="Minimize">_</button>
                    <button class="maximize-btn" title="Maximize">□</button>
                    <button class="close-btn" title="Close">×</button>
                </div>
            </div>
            <div class="window-content">${content}</div>
        `;
        
        // Calculate safe dimensions
        const viewport = this.getViewportConstraints();
        const safeWidth = Math.min(width, viewport.maxWidth);
        const safeHeight = Math.min(height, viewport.maxHeight);
        
        // Position window (cascade effect)
        const position = this.calculatePosition(safeWidth, safeHeight);
        
        // Apply styles
        win.style.cssText = `
            position: absolute;
            width: ${safeWidth}px;
            height: ${safeHeight}px;
            left: ${position.x}px;
            top: ${position.y}px;
            z-index: ${++this.highestZIndex};
            pointer-events: auto;
        `;
        
        // Store window data
        this.activeWindows.set(windowId, {
            element: win,
            title: title,
            isMinimized: false,
            isMaximized: false,
            originalWidth: safeWidth,
            originalHeight: safeHeight,
            originalX: position.x,
            originalY: position.y
        });
        
        // Add to DOM
        this.appendToContainer(win);
        
        // Setup window functionality
        this.setupWindowControls(win, windowId);
        this.makeWindowDraggable(win);
        
        // Emit event
        if (window.EventBus) {
            window.EventBus.emit('window-created', { windowId, title });
        }
        
        return win;
    },
    
    // Window control handlers
    setupWindowControls(win, windowId) {
        const minimizeBtn = win.querySelector('.minimize-btn');
        const maximizeBtn = win.querySelector('.maximize-btn');
        const closeBtn = win.querySelector('.close-btn');
        
        minimizeBtn.onclick = (e) => {
            e.stopPropagation();
            this.minimizeWindow(windowId);
        };
        
        maximizeBtn.onclick = (e) => {
            e.stopPropagation();
            this.toggleMaximize(windowId);
        };
        
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            this.closeWindow(windowId);
        };
        
        // Focus handling
        win.addEventListener('mousedown', () => this.bringToFront(win));
        win.addEventListener('touchstart', () => this.bringToFront(win));
    },
    
    // Minimize window
    minimizeWindow(windowId) {
        const windowData = this.activeWindows.get(windowId);
        if (!windowData || windowData.isMinimized) return;
        
        const win = windowData.element;
        win.style.display = 'none';
        windowData.isMinimized = true;
        
        // Emit event for taskbar
        if (window.EventBus) {
            window.EventBus.emit('window-minimized', { windowId, title: windowData.title });
        }
    },
    
    // Restore window
    restoreWindow(windowId) {
        const windowData = this.activeWindows.get(windowId);
        if (!windowData || !windowData.isMinimized) return;
        
        const win = windowData.element;
        win.style.display = 'block';
        windowData.isMinimized = false;
        this.bringToFront(win);
        
        // Emit event
        if (window.EventBus) {
            window.EventBus.emit('window-restored', { windowId });
        }
    },
    
    // Toggle maximize
    toggleMaximize(windowId) {
        const windowData = this.activeWindows.get(windowId);
        if (!windowData) return;
        
        const win = windowData.element;
        const viewport = this.getViewportConstraints();
        
        if (!windowData.isMaximized) {
            // Store current position/size
            const rect = win.getBoundingClientRect();
            windowData.restoreX = rect.left;
            windowData.restoreY = rect.top;
            windowData.restoreWidth = rect.width;
            windowData.restoreHeight = rect.height;
            
            // Maximize
            win.style.left = '0px';
            win.style.top = '0px';
            win.style.width = viewport.width + 'px';
            win.style.height = viewport.availableHeight + 'px';
            win.classList.add('maximized');
            
            windowData.isMaximized = true;
        } else {
            // Restore
            win.style.left = windowData.restoreX + 'px';
            win.style.top = windowData.restoreY + 'px';
            win.style.width = windowData.restoreWidth + 'px';
            win.style.height = windowData.restoreHeight + 'px';
            win.classList.remove('maximized');
            
            windowData.isMaximized = false;
        }
        
        this.bringToFront(win);
    },
    
    // Close window
    closeWindow(windowId) {
        const windowData = this.activeWindows.get(windowId);
        if (!windowData) return;
        
        const win = windowData.element;
        
        // Emit close event
        if (window.EventBus) {
            window.EventBus.emit('window-closing', { windowId });
        }
        
        // Remove from DOM and tracking
        win.remove();
        this.activeWindows.delete(windowId);
        
        // Emit closed event
        if (window.EventBus) {
            window.EventBus.emit('window-closed', { windowId });
        }
    },
    
    // Drag functionality
    makeWindowDraggable(win) {
        const titleBar = win.querySelector('.window-title-bar');
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };
        
        const startDrag = (clientX, clientY, e) => {
            // Don't drag if clicking controls or if maximized
            if (e.target.closest('.window-controls')) return;
            
            const windowData = this.activeWindows.get(win.id);
            if (windowData && windowData.isMaximized) return;
            
            isDragging = true;
            const rect = win.getBoundingClientRect();
            dragOffset.x = clientX - rect.left;
            dragOffset.y = clientY - rect.top;
            
            titleBar.style.cursor = 'grabbing';
            this.bringToFront(win);
            e.preventDefault();
        };
        
        const performDrag = (clientX, clientY) => {
            if (!isDragging) return;
            
            const viewport = this.getViewportConstraints();
            let newX = clientX - dragOffset.x;
            let newY = clientY - dragOffset.y;
            
            // Constrain to viewport
            const minVisible = 50;
            newX = Math.max(-win.offsetWidth + minVisible, Math.min(newX, viewport.width - minVisible));
            newY = Math.max(0, Math.min(newY, viewport.availableHeight - 30));
            
            win.style.left = newX + 'px';
            win.style.top = newY + 'px';
        };
        
        const endDrag = () => {
            if (isDragging) {
                isDragging = false;
                titleBar.style.cursor = 'grab';
            }
        };
        
        // Mouse events
        titleBar.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY, e));
        document.addEventListener('mousemove', (e) => performDrag(e.clientX, e.clientY));
        document.addEventListener('mouseup', endDrag);
        
        // Touch events
        titleBar.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startDrag(touch.clientX, touch.clientY, e);
        });
        document.addEventListener('touchmove', (e) => {
            if (e.touches[0]) performDrag(e.touches[0].clientX, e.touches[0].clientY);
        });
        document.addEventListener('touchend', endDrag);
        
        titleBar.style.cursor = 'grab';
    },
    
    // Bring window to front
    bringToFront(win) {
        win.style.zIndex = ++this.highestZIndex;
    },
    
    // Utility methods
    getViewportConstraints() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            availableHeight: window.innerHeight - 40, // Account for taskbar
            maxWidth: Math.max(300, window.innerWidth - 40),
            maxHeight: Math.max(200, window.innerHeight - 80)
        };
    },
    
    calculatePosition(width, height) {
        const viewport = this.getViewportConstraints();
        const cascade = (this.nextWindowId - 1) * 25;
        const baseX = 50 + cascade;
        const baseY = 50 + cascade;
        
        return {
            x: Math.min(baseX, viewport.width - width - 20),
            y: Math.min(baseY, viewport.availableHeight - height - 20)
        };
    },
    
    appendToContainer(win) {
        const container = document.getElementById('windows-container');
        if (container) {
            container.appendChild(win);
        } else {
            const desktop = document.getElementById('desktop');
            if (desktop) {
                desktop.appendChild(win);
            } else {
                document.body.appendChild(win);
            }
        }
    },
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // Public API
    getAllWindows() {
        return Array.from(this.activeWindows.values());
    },
    
    getWindow(windowId) {
        return this.activeWindows.get(windowId);
    }
};

// Register documentation with Docs service - wait for it to be ready
(function registerWindowManagerDoc() {
  const tryRegister = () => {
    // Check if Docs service is available and ready
    if (window.Docs && window.Docs.initialized && typeof window.Docs.register === 'function') {
      window.Docs.register('window-manager', {
        name: "WindowManager",
        version: "1.0.0",
        description: "Core service for managing the lifecycle, position, and interaction of all windows in the Unity Station desktop environment.",
        type: "System Service",
        dependencies: ["EventBus"],
        features: [
          "Global singleton (window.WindowManager)",
          "Handles window creation, minimization, maximization, and closing.",
          "Manages z-index stacking and window focus.",
          "Implements window dragging functionality.",
          "Emits EventBus events for all key window lifecycle actions."
        ],
        methods: [
          { name: "createWindow(title, content, width, height)", description: "Creates and displays a new window." },
          { name: "minimizeWindow(windowId)", description: "Minimizes a window to the taskbar." },
          { name: "restoreWindow(windowId)", description: "Restores a minimized window." },
          { name: "closeWindow(windowId)", description: "Closes and destroys a window." },
          { name: "toggleMaximize(windowId)", description: "Toggles between maximized and restored size." },
          { name: "getAllWindows()", description: "Returns an array of all active window data objects." },
          { name: "getWindow(windowId)", description: "Returns the data object for a specific window ID." }
        ],
        events: [
          "window-created", "window-minimized", "window-restored",
          "window-closing", "window-closed", "window-focused"
        ],
        autoGenerated: false
      });
      console.log('WindowManager documentation registered with Docs service');
      return true;
    }
    return false;
  };

  // Try immediate registration
  if (tryRegister()) return;

  // Wait for docs-ready event via EventBus (WindowManager must load after EventBus)
  if (window.EventBus) {
    const onDocsReady = () => {
      if (tryRegister()) {
        window.EventBus.off('docs-ready', onDocsReady);
      }
    };
    window.EventBus.on('docs-ready', onDocsReady);
  }

  // Fallback: poll for Docs initialization (in case EventBus fails)
  let attempts = 0;
  const pollInterval = setInterval(() => {
    if (tryRegister() || attempts++ > 50) {
      clearInterval(pollInterval);
    }
  }, 100);
})();
