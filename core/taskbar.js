/* ========================================
 * FILE: core/taskbar.js
 * PURPOSE: Taskbar management and system tray
 * DEPENDENCIES: EventBus, WindowManager, AppRegistry
 * ======================================== */

window.Taskbar = {
    taskbarItems: new Map(),
    clockInterval: null,
    initialized: false,
    
    // Initialize taskbar
    init() {
        if (this.initialized) return;
        console.log('Taskbar initializing...');
        
        this.setupTaskbar();
        this.setupEventListeners();
        this.startClock();
        this.initialized = true;
        
        console.log('Taskbar initialized');
        
        // Emit ready event
        if (window.EventBus) {
            window.EventBus.emit('taskbar-ready');
        }
    },
    
    // Setup taskbar HTML structure or enhance existing
    setupTaskbar() {
        let taskbar = document.getElementById('taskbar');
        
        if (!taskbar) {
            // Create taskbar if it doesn't exist
            taskbar = document.createElement('div');
            taskbar.id = 'taskbar';
            taskbar.innerHTML = `
                <button class="start-button" id="start-btn">
                    <span>⊞</span> Start
                </button>
                <div class="taskbar-items" id="taskbar-items"></div>
                <div class="clock" id="clock">--:--</div>
            `;
            document.body.appendChild(taskbar);
        }
        
        // Setup click handlers for existing elements
        const startBtn = document.getElementById('start-btn') || document.getElementById('start-button');
        if (startBtn) {
            startBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleStartMenu();
            });
        }
        
        // Add network icon if not present
        if (!document.querySelector('.network-icon')) {
            const networkIcon = document.createElement('button');
            networkIcon.className = 'network-icon';
            // Desktop computer emoji as requested
            networkIcon.innerHTML = '<span style="font-size:14px;">🖥️</span>';
            networkIcon.title = 'Network Status';
            networkIcon.style.marginRight = '6px';
            networkIcon.style.background = 'transparent';
            networkIcon.style.border = 'none';
            networkIcon.style.cursor = 'pointer';
            networkIcon.addEventListener('click', () => {
                console.log('Network status clicked - script block needed');
                // Placeholder for network functionality
            });
            
            // Insert before clock
            const clock = document.getElementById('clock');
            if (clock && clock.parentNode) {
                clock.parentNode.insertBefore(networkIcon, clock);
            }
        }
        
        // Add show desktop functionality if not present
        if (!document.querySelector('.show-desktop-button')) {
            const showDesktopBtn = document.createElement('button');
            showDesktopBtn.className = 'show-desktop-button';
            // Your exact show desktop icon - taller to match PC emoji height
            showDesktopBtn.innerHTML = `<img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22'><rect x='3' y='3' width='16' height='16' rx='2' ry='2' fill='%23ffffff'/><path d='M5 15h12v2H5z' fill='%23000000'/></svg>" alt="Show Desktop" style="width:18px;height:18px;">`;
            showDesktopBtn.title = 'Show Desktop';
            showDesktopBtn.style.marginRight = '6px';
            showDesktopBtn.style.background = 'transparent';
            showDesktopBtn.style.border = 'none';
            showDesktopBtn.style.cursor = 'pointer';
            showDesktopBtn.addEventListener('click', () => this.showDesktop());
            
            // Insert before network icon
            const networkButton = document.querySelector('.network-icon');
            if (networkButton && networkButton.parentNode) {
                networkButton.parentNode.insertBefore(showDesktopBtn, networkButton);
            } else {
                // Fallback: insert before clock
                const clock = document.getElementById('clock');
                if (clock && clock.parentNode) {
                    clock.parentNode.insertBefore(showDesktopBtn, clock);
                }
            }
        }
    },
    
    // Setup event listeners
    setupEventListeners() {
        if (!window.EventBus) return;
        
        // Window events
        window.EventBus.on('window-minimized', (data) => {
            this.addTaskbarItem(data.windowId, data.title);
        });
        
        window.EventBus.on('window-restored', (data) => {
            this.removeTaskbarItem(data.windowId);
        });
        
        window.EventBus.on('window-closed', (data) => {
            this.removeTaskbarItem(data.windowId);
        });
        
        window.EventBus.on('window-created', (data) => {
            // Remove from taskbar if it was there (window restored)
            this.removeTaskbarItem(data.windowId);
        });
    },
    
    // Start the clock
    startClock() {
        this.updateClock();
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
        }
        this.clockInterval = setInterval(() => {
            this.updateClock();
        }, 1000);
    },
    
    // Update clock display
    updateClock() {
        const clock = document.getElementById('clock');
        if (clock) {
            const now = new Date();
            const timeString = now.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
            clock.textContent = timeString;
            clock.title = now.toLocaleDateString([], {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    },
    
    // Add taskbar item for minimized window
    addTaskbarItem(windowId, title) {
        const taskbarItems = document.getElementById('taskbar-items');
        if (!taskbarItems) return;
        
        // Remove existing item if present
        this.removeTaskbarItem(windowId);
        
        const item = document.createElement('div');
        item.className = 'taskbar-item';
        item.id = `taskbar-${windowId}`;
        item.title = title;
        
        // Truncate long titles
        const displayTitle = title.length > 15 ? title.substring(0, 12) + '...' : title;
        item.textContent = displayTitle;
        
        // Click handler to restore window
        item.addEventListener('click', () => {
            this.restoreWindow(windowId);
        });
        
        taskbarItems.appendChild(item);
        this.taskbarItems.set(windowId, item);
        
        // Scroll to show new item if needed
        this.scrollTaskbarItems();
    },
    
    // Remove taskbar item
    removeTaskbarItem(windowId) {
        const item = this.taskbarItems.get(windowId);
        if (item && item.parentNode) {
            item.remove();
            this.taskbarItems.delete(windowId);
        }
    },
    
    // Restore window from taskbar
    restoreWindow(windowId) {
        if (window.WindowManager) {
            window.WindowManager.restoreWindow(windowId);
        }
    },
    
    // Toggle start menu
    toggleStartMenu() {
        if (window.StartMenu) {
            window.StartMenu.toggle();
        } else {
            // Fallback for basic start menu
            const startMenu = document.getElementById('start-menu');
            if (startMenu) {
                startMenu.classList.toggle('open');
            }
        }
    },
    
    // Show desktop functionality
    showDesktop() {
        if (window.DesktopManager) {
            window.DesktopManager.showDesktop();
        } else if (window.WindowManager) {
            // Fallback: minimize all windows
            const windows = window.WindowManager.getAllWindows();
            windows.forEach(windowData => {
                if (!windowData.isMinimized) {
                    window.WindowManager.minimizeWindow(windowData.element.id);
                }
            });
        }
    },
    
    // Scroll taskbar items if overflow
    scrollTaskbarItems() {
        const taskbarItems = document.getElementById('taskbar-items');
        if (taskbarItems && taskbarItems.scrollWidth > taskbarItems.clientWidth) {
            taskbarItems.scrollLeft = taskbarItems.scrollWidth;
        }
    },
    
    // Get taskbar height
    getHeight() {
        return 40; // Standard taskbar height
    },
    
    // Update taskbar for mobile/desktop
    updateLayout(isMobile) {
        const taskbar = document.getElementById('taskbar');
        const startText = document.querySelector('.start-text') || taskbar?.querySelector('button span:last-child');
        
        if (taskbar) {
            taskbar.classList.toggle('mobile-layout', isMobile);
            taskbar.classList.toggle('desktop-layout', !isMobile);
        }
        
        // Hide start text on mobile
        if (startText && startText.textContent === 'Start') {
            startText.style.display = isMobile ? 'none' : 'inline';
        }
    },
    
    // Cleanup
    destroy() {
        if (this.clockInterval) {
            clearInterval(this.clockInterval);
            this.clockInterval = null;
        }
        this.taskbarItems.clear();
        this.initialized = false;
    }
};

// Register documentation with Docs service - wait for it to be ready
(function registerTaskbarDoc() {
  const tryRegister = () => {
    if (window.Docs && window.Docs.initialized && typeof window.Docs.register === 'function') {
      window.Docs.register('taskbar', {
        name: "Taskbar",
        version: "1.0.0",
        description: "System taskbar providing window management, system tray, clock, and quick access to system functions.",
        type: "System Service",
        features: [
          "Minimized window tracking and restoration",
          "Real-time clock display with date tooltip",
          "Start menu integration",
          "Show desktop functionality",
          "Network status indicator",
          "Dynamic window item management",
          "Mobile/desktop responsive layout",
          "Auto-scrolling for overflow items"
        ],
        methods: [
          { name: "init()", description: "Initialize the taskbar system" },
          { name: "addTaskbarItem(windowId, title)", description: "Add a minimized window to taskbar" },
          { name: "removeTaskbarItem(windowId)", description: "Remove window from taskbar" },
          { name: "restoreWindow(windowId)", description: "Restore a minimized window" },
          { name: "showDesktop()", description: "Minimize all windows to show desktop" },
          { name: "toggleStartMenu()", description: "Toggle start menu visibility" },
          { name: "updateLayout(isMobile)", description: "Update layout for mobile/desktop" },
          { name: "getHeight()", description: "Get taskbar height in pixels" }
        ],
        autoGenerated: false
      });
      console.log('Taskbar documentation registered with Docs service');
      return true;
    }
    return false;
  };

  // Try immediate registration
  if (tryRegister()) return;

  // Wait for docs-ready event
  if (window.EventBus) {
    const onDocsReady = () => {
      if (tryRegister()) {
        window.EventBus.off('docs-ready', onDocsReady);
      }
    };
    window.EventBus.on('docs-ready', onDocsReady);
  }

  // Fallback: poll for Docs initialization
  let attempts = 0;
  const pollInterval = setInterval(() => {
    if (tryRegister() || attempts++ > 50) {
      clearInterval(pollInterval);
    }
  }, 100);
})();

