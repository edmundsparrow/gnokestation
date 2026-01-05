/* BEGIN boot/window-manager.js */
window.WindowManager = {
    activeWindows: new Map(),
    nextWindowId: 0,
    highestZIndex: 1000,
    
    // Create new window - now with fullscreen button
    createWindow(title, content, width = 400, height = 300) {
        const windowId = `win-${++this.nextWindowId}`;
        
        if (!title || !content) {
            console.error('WindowManager.createWindow: Title and content required');
            return null;
        }
        
        const win = document.createElement('div');
        win.className = 'window';
        win.id = windowId;
        
        // Build window HTML with fullscreen button added
        win.innerHTML = `
            <div class="window-title-bar">
                <span class="window-title">${this.escapeHtml(title)}</span>
                <div class="window-controls">
                    <button class="minimize-btn" title="Minimize">_</button>
                    <button class="maximize-btn" title="Maximize">□</button>
                    <button class="fullscreen-btn" title="Fullscreen">⛶</button>
                    <button class="close-btn" title="Close">×</button>
                </div>
            </div>
            <div class="window-content">${content}</div>
        `;
        
        const viewport = this.getViewportConstraints();
        const safeWidth = Math.min(width, viewport.maxWidth);
        const safeHeight = Math.min(height, viewport.maxHeight);
        
        const position = this.calculatePosition(safeWidth, safeHeight);
        
        win.style.cssText = `
            position: absolute;
            width: ${safeWidth}px;
            height: ${safeHeight}px;
            left: ${position.x}px;
            top: ${position.y}px;
            z-index: ${++this.highestZIndex};
            pointer-events: auto;
        `;
        
        this.activeWindows.set(windowId, {
            element: win,
            title: title,
            isMinimized: false,
            isMaximized: false,
            isFullscreen: false,
            originalWidth: safeWidth,
            originalHeight: safeHeight,
            originalX: position.x,
            originalY: position.y
        });
        
        this.appendToContainer(win);
        
        this.setupWindowControls(win, windowId);
        this.makeWindowDraggable(win);
        
        if (window.EventBus) {
            window.EventBus.emit('window-created', { windowId, title });
        }
        
        return win;
    },
    
    // Window control handlers - now includes fullscreen
    setupWindowControls(win, windowId) {
        const minimizeBtn = win.querySelector('.minimize-btn');
        const maximizeBtn = win.querySelector('.maximize-btn');
        const fullscreenBtn = win.querySelector('.fullscreen-btn');
        const closeBtn = win.querySelector('.close-btn');
        
        minimizeBtn.onclick = (e) => {
            e.stopPropagation();
            this.minimizeWindow(windowId);
        };
        
        maximizeBtn.onclick = (e) => {
            e.stopPropagation();
            this.toggleMaximize(windowId);
        };
        
        // NEW: Fullscreen button handler
        fullscreenBtn.onclick = (e) => {
            e.stopPropagation();
            this.toggleFullscreen(windowId);
        };
        
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            this.closeWindow(windowId);
        };
        
        win.addEventListener('mousedown', () => this.bringToFront(win));
        win.addEventListener('touchstart', () => this.bringToFront(win));
        
        // Listen for fullscreen changes
        this.setupFullscreenListeners(win, windowId);
    },
    
    // NEW: Toggle fullscreen using browser Fullscreen API
    toggleFullscreen(windowId) {
        const windowData = this.activeWindows.get(windowId);
        if (!windowData) return;
        
        const win = windowData.element;
        
        if (!windowData.isFullscreen) {
            // Enter fullscreen
            if (win.requestFullscreen) {
                win.requestFullscreen().catch(err => {
                    console.error('Fullscreen request failed:', err);
                });
            } else if (win.webkitRequestFullscreen) {
                win.webkitRequestFullscreen();
            } else if (win.mozRequestFullScreen) {
                win.mozRequestFullScreen();
            } else if (win.msRequestFullscreen) {
                win.msRequestFullscreen();
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    },
    
    // NEW: Setup fullscreen event listeners
    setupFullscreenListeners(win, windowId) {
        const handleFullscreenChange = () => {
            const windowData = this.activeWindows.get(windowId);
            if (!windowData) return;
            
            const isFullscreen = document.fullscreenElement === win ||
                                document.webkitFullscreenElement === win ||
                                document.mozFullScreenElement === win ||
                                document.msFullscreenElement === win;
            
            windowData.isFullscreen = isFullscreen;
            
            const fullscreenBtn = win.querySelector('.fullscreen-btn');
            if (fullscreenBtn) {
                fullscreenBtn.textContent = isFullscreen ? '⛶' : '⛶';
                fullscreenBtn.title = isFullscreen ? 'Exit Fullscreen' : 'Fullscreen';
            }
            
            // Update window styling
            if (isFullscreen) {
                win.classList.add('fullscreen');
            } else {
                win.classList.remove('fullscreen');
            }
            
            if (window.EventBus) {
                window.EventBus.emit(isFullscreen ? 'window-fullscreen-enter' : 'window-fullscreen-exit', { windowId });
            }
        };
        
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    },
    
    minimizeWindow(windowId) {
        const windowData = this.activeWindows.get(windowId);
        if (!windowData || windowData.isMinimized) return;
        
        const win = windowData.element;
        win.style.display = 'none';
        windowData.isMinimized = true;
        
        if (window.EventBus) {
            window.EventBus.emit('window-minimized', { windowId, title: windowData.title });
        }
    },
    
    restoreWindow(windowId) {
        const windowData = this.activeWindows.get(windowId);
        if (!windowData || !windowData.isMinimized) return;
        
        const win = windowData.element;
        win.style.display = 'block';
        windowData.isMinimized = false;
        this.bringToFront(win);
        
        if (window.EventBus) {
            window.EventBus.emit('window-restored', { windowId });
        }
    },
    
    toggleMaximize(windowId) {
        const windowData = this.activeWindows.get(windowId);
        if (!windowData) return;
        
        const win = windowData.element;
        const viewport = this.getViewportConstraints();
        
        if (!windowData.isMaximized) {
            const rect = win.getBoundingClientRect();
            windowData.restoreX = rect.left;
            windowData.restoreY = rect.top;
            windowData.restoreWidth = rect.width;
            windowData.restoreHeight = rect.height;
            
            win.style.left = '0px';
            win.style.top = '0px';
            win.style.width = viewport.width + 'px';
            win.style.height = viewport.availableHeight + 'px';
            win.classList.add('maximized');
            
            windowData.isMaximized = true;
        } else {
            win.style.left = windowData.restoreX + 'px';
            win.style.top = windowData.restoreY + 'px';
            win.style.width = windowData.restoreWidth + 'px';
            win.style.height = windowData.restoreHeight + 'px';
            win.classList.remove('maximized');
            
            windowData.isMaximized = false;
        }
        
        this.bringToFront(win);
    },
    
    closeWindow(windowId) {
        const windowData = this.activeWindows.get(windowId);
        if (!windowData) return;
        
        const win = windowData.element;
        
        if (window.EventBus) {
            window.EventBus.emit('window-closing', { windowId });
        }
        
        win.remove();
        this.activeWindows.delete(windowId);
        
        if (window.EventBus) {
            window.EventBus.emit('window-closed', { windowId });
        }
    },
    
    makeWindowDraggable(win) {
        const titleBar = win.querySelector('.window-title-bar');
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };
        
        const startDrag = (clientX, clientY, e) => {
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
        
        titleBar.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY, e));
        document.addEventListener('mousemove', (e) => performDrag(e.clientX, e.clientY));
        document.addEventListener('mouseup', endDrag);
        
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
    
    bringToFront(win) {
        win.style.zIndex = ++this.highestZIndex;
    },
    
    getViewportConstraints() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            availableHeight: window.innerHeight - 40,
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
    
    getAllWindows() {
        return Array.from(this.activeWindows.values());
    },
    
    getWindow(windowId) {
        return this.activeWindows.get(windowId);
    }
};
/* END window-manager.js */