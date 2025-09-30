// Single Instance On-Screen Keyboard - Simplified
(function() {
    window.KeyboardApp = {
        currentValue: '',
        currentCallback: null,
        currentMode: 'qwerty',
        isShiftActive: false,
        activeWindow: null,
        
        open(callback = null, options = {}) {
            if (this.activeWindow && this.activeWindow.parentNode) {
                this.bringToFront();
                if (callback) {
                    this.currentCallback = callback;
                    if (options.initialValue !== undefined) {
                        this.currentValue = options.initialValue;
                        this.updateDisplay(this.activeWindow);
                    }
                    if (options.inputType === 'number' || options.inputType === 'tel') {
                        this.switchMode(this.activeWindow, 'numeric');
                    } else if (options.inputType === 'text') {
                        this.switchMode(this.activeWindow, 'qwerty');
                    }
                }
                return this.activeWindow;
            }

            this.currentCallback = callback;
            this.currentValue = options.initialValue || '';
            this.currentMode = (options.inputType === 'number' || options.inputType === 'tel') ? 'numeric' : 'qwerty';

            const html = `
                <div style="height:100%;display:flex;flex-direction:column;font-family:Arial,sans-serif;background:#e8e8e8;">
                    <div style="padding:10px;background:#f5f5f5;border-bottom:1px solid #ccc;">
                        <div id="display" style="background:#fff;border:1px solid #999;padding:10px;font-size:16px;min-height:20px;overflow-x:auto;white-space:pre-wrap;">${this.currentValue}</div>
                    </div>

                    <div style="flex:1;padding:5px;">
                        <div id="qwerty-layout" style="${this.currentMode === 'qwerty' ? 'display:block;' : 'display:none;'}">
                            <div style="display:flex;gap:2px;margin-bottom:2px;">
                                <button class="key" data-value="q">q</button>
                                <button class="key" data-value="w">w</button>
                                <button class="key" data-value="e">e</button>
                                <button class="key" data-value="r">r</button>
                                <button class="key" data-value="t">t</button>
                                <button class="key" data-value="y">y</button>
                                <button class="key" data-value="u">u</button>
                                <button class="key" data-value="i">i</button>
                                <button class="key" data-value="o">o</button>
                                <button class="key" data-value="p">p</button>
                            </div>
                            <div style="display:flex;gap:2px;margin-bottom:2px;padding-left:15px;">
                                <button class="key" data-value="a">a</button>
                                <button class="key" data-value="s">s</button>
                                <button class="key" data-value="d">d</button>
                                <button class="key" data-value="f">f</button>
                                <button class="key" data-value="g">g</button>
                                <button class="key" data-value="h">h</button>
                                <button class="key" data-value="j">j</button>
                                <button class="key" data-value="k">k</button>
                                <button class="key" data-value="l">l</button>
                            </div>
                            <div style="display:flex;gap:2px;margin-bottom:2px;">
                                <button class="key shift-key" data-action="shift" style="flex:1.5;">⇧</button>
                                <button class="key" data-value="z">z</button>
                                <button class="key" data-value="x">x</button>
                                <button class="key" data-value="c">c</button>
                                <button class="key" data-value="v">v</button>
                                <button class="key" data-value="b">b</button>
                                <button class="key" data-value="n">n</button>
                                <button class="key" data-value="m">m</button>
                                <button class="key" data-action="backspace" style="flex:1.5;">⌫</button>
                            </div>
                            <div style="display:flex;gap:2px;">
                                <button class="key mode-switch" data-mode="numeric">?123</button>
                                <button class="key" data-value=",">,</button>
                                <button class="key" data-action="space" style="flex:3;">space</button>
                                <button class="key" data-value=".">.</button>
                                <button class="key send-key" data-action="enter" style="flex:1.5;">Send</button>
                            </div>
                        </div>

                        <div id="numeric-layout" style="${this.currentMode === 'numeric' ? 'display:block;' : 'display:none;'}">
                            <div style="display:flex;gap:2px;margin-bottom:2px;">
                                <button class="key" data-value="1">1</button>
                                <button class="key" data-value="2">2</button>
                                <button class="key" data-value="3">3</button>
                                <button class="key" data-value="4">4</button>
                                <button class="key" data-value="5">5</button>
                                <button class="key" data-value="6">6</button>
                                <button class="key" data-value="7">7</button>
                                <button class="key" data-value="8">8</button>
                                <button class="key" data-value="9">9</button>
                                <button class="key" data-value="0">0</button>
                            </div>
                            <div style="display:flex;gap:2px;margin-bottom:2px;">
                                <button class="key" data-value="@">@</button>
                                <button class="key" data-value="#">#</button>
                                <button class="key" data-value="$">$</button>
                                <button class="key" data-value="_">_</button>
                                <button class="key" data-value="&">&</button>
                                <button class="key" data-value="-">-</button>
                                <button class="key" data-value="+">+</button>
                                <button class="key" data-value="(">(</button>
                                <button class="key" data-value=")">)</button>
                                <button class="key" data-value="/">/</button>
                            </div>
                            <div style="display:flex;gap:2px;margin-bottom:2px;">
                                <button class="key" data-value="*">*</button>
                                <button class="key" data-value='"'>"</button>
                                <button class="key" data-value="'">'</button>
                                <button class="key" data-value=":">:</button>
                                <button class="key" data-value=";">;</button>
                                <button class="key" data-value="!">!</button>
                                <button class="key" data-value="?">?</button>
                                <button class="key" data-value="=">=</button>
                                <button class="key" data-value=".">.</button>
                                <button class="key" data-action="backspace">⌫</button>
                            </div>
                            <div style="display:flex;gap:2px;">
                                <button class="key mode-switch" data-mode="qwerty">ABC</button>
                                <button class="key" data-value=",">,</button>
                                <button class="key" data-action="space" style="flex:3;">space</button>
                                <button class="key" data-value=".">.</button>
                                <button class="key send-key" data-action="enter" style="flex:1.5;">Send</button>
                            </div>
                        </div>
                    </div>
                </div>

                <style>
                .key {
                    flex: 1;
                    padding: 12px 4px;
                    border: 1px solid #999;
                    background: #fff;
                    cursor: pointer;
                    font-size: 14px;
                    border-radius: 2px;
                    min-height: 40px;
                }
                .key:hover { background: #f0f0f0; }
                .key:active { background: #e0e0e0; }
                .shift-key.active { background: #4a90e2 !important; color: white; }
                .mode-switch { background: #666 !important; color: white; }
                .send-key { background: #28a745 !important; color: white; font-weight: bold; }
                </style>
            `;

            const win = window.WindowManager.createWindow('Keyboard', html, 600, 300);
            this.activeWindow = win;
            this.setupEvents(win);
            this.updateDisplay(win);
            this.setupCleanup(win);
            return win;
        },

        setupEvents(win) {
            win.addEventListener('click', (e) => {
                const key = e.target.closest('.key');
                if (!key) return;

                const value = key.dataset.value;
                const action = key.dataset.action;
                const mode = key.dataset.mode;

                if (mode) {
                    this.switchMode(win, mode);
                } else if (value) {
                    this.addCharacter(win, value);
                } else if (action) {
                    this.handleAction(win, action);
                }
            });
        },

        handleAction(win, action) {
            switch (action) {
                case 'space':
                    this.currentValue += ' ';
                    this.updateDisplay(win);
                    break;
                case 'backspace':
                    this.currentValue = this.currentValue.slice(0, -1);
                    this.updateDisplay(win);
                    break;
                case 'shift':
                    this.isShiftActive = !this.isShiftActive;
                    win.querySelector('.shift-key').classList.toggle('active', this.isShiftActive);
                    break;
                case 'enter':
                    if (this.currentCallback) {
                        this.currentCallback(this.currentValue);
                    }
                    
                    // Emit global event for any app to listen to
                    if (window.EventBus) {
                        window.EventBus.emit('keyboard-send', {
                            text: this.currentValue,
                            timestamp: new Date()
                        });
                    }
                    
                    // Also try to send to focused input element
                    const activeElement = document.activeElement;
                    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                        activeElement.value = this.currentValue;
                        // Trigger input event
                        activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                        // Trigger enter key event
                        activeElement.dispatchEvent(new KeyboardEvent('keydown', { 
                            key: 'Enter', 
                            bubbles: true 
                        }));
                    }
                    
                    this.currentValue = '';
                    this.updateDisplay(win);
                    break;
            }
        },

        addCharacter(win, char) {
            if (this.currentMode === 'qwerty' && this.isShiftActive) {
                char = char.toUpperCase();
                this.isShiftActive = false;
                win.querySelector('.shift-key').classList.remove('active');
            }
            this.currentValue += char;
            this.updateDisplay(win);
        },

        switchMode(win, mode) {
            this.currentMode = mode;
            win.querySelector('#qwerty-layout').style.display = mode === 'qwerty' ? 'block' : 'none';
            win.querySelector('#numeric-layout').style.display = mode === 'numeric' ? 'block' : 'none';
        },

        updateDisplay(win) {
            const display = win.querySelector('#display');
            display.textContent = this.currentValue;
            display.scrollLeft = display.scrollWidth;
            display.scrollTop = display.scrollHeight;
        },

        setupCleanup(win) {
            if (window.EventBus) {
                const cleanup = (data) => {
                    if (data.windowId === win.id) {
                        this.activeWindow = null;
                        this.currentValue = '';
                        this.currentCallback = null;
                        this.isShiftActive = false;
                        window.EventBus.off('window-closed', cleanup);
                    }
                };
                window.EventBus.on('window-closed', cleanup);
            }
        },

        bringToFront() {
            if (this.activeWindow && window.WindowManager) {
                const windowData = window.WindowManager.getWindow(this.activeWindow.id);
                if (windowData && windowData.isMinimized) {
                    window.WindowManager.restoreWindow(this.activeWindow.id);
                } else {
                    window.WindowManager.bringToFront(this.activeWindow);
                }
            }
        },

        promptForText(options = {}) {
            return new Promise(resolve => {
                this.open(resolve, { ...options, inputType: 'text' });
            });
        },

        promptForNumber(options = {}) {
            return new Promise(resolve => {
                this.open(resolve, { ...options, inputType: 'number' });
            });
        },

        isOpen() {
            return this.activeWindow && this.activeWindow.parentNode;
        },

        forceClose() {
            if (this.isOpen()) {
                this.activeWindow.querySelector('.close-btn').click();
            }
        }
    };

    if (window.AppRegistry) {
        window.AppRegistry.registerApp({
            id: 'keyboard',
            name: 'Keyboard',
            icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><rect width='24' height='24' rx='2' fill='%23666'/><rect x='2' y='16' width='20' height='6' rx='1' fill='%23fff'/><rect x='2' y='8' width='20' height='6' rx='1' fill='%23fff'/><rect x='6' y='2' width='12' height='4' rx='1' fill='%23fff'/></svg>",
            handler: () => window.KeyboardApp.open(),
            singleInstance: true
        });
    }
})();
