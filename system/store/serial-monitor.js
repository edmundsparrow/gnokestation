/* ========================================
 * FILE: core/apps/serial-monitor.js
 * VERSION: 1.0.0
 * Web Serial API interface for real hardware
 * Works with Arduino, ESP32, PLCs, sensors, etc.
 * ======================================== */

window.SerialMonitorApp = {
    port: null,
    reader: null,
    writer: null,
    isConnected: false,
    
    open() {
        const html = `
            <div style="height:100%;display:flex;flex-direction:column;background:#1e1e1e;color:#d4d4d4;font-family:'Consolas','Monaco',monospace;">
                <!-- Toolbar -->
                <div style="padding:12px;background:#2d2d30;border-bottom:1px solid #3e3e42;display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                    <button id="connectBtn" style="padding:8px 16px;background:#0e639c;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:600;">
                        Connect Device
                    </button>
                    <button id="disconnectBtn" disabled style="padding:8px 16px;background:#555;color:#999;border:none;border-radius:4px;cursor:not-allowed;">
                        Disconnect
                    </button>
                    <select id="baudRate" style="padding:8px;background:#3c3c3c;color:#d4d4d4;border:1px solid #555;border-radius:4px;">
                        <option value="9600">9600 baud</option>
                        <option value="19200">19200 baud</option>
                        <option value="38400">38400 baud</option>
                        <option value="57600">57600 baud</option>
                        <option value="115200" selected>115200 baud</option>
                    </select>
                    <button id="clearBtn" style="padding:8px 16px;background:#3c3c3c;color:#d4d4d4;border:1px solid #555;border-radius:4px;cursor:pointer;">
                        Clear
                    </button>
                    <div id="statusIndicator" style="margin-left:auto;padding:6px 12px;background:#555;border-radius:4px;font-size:12px;">
                        ⚫ Disconnected
                    </div>
                </div>
                
                <!-- Monitor Output -->
                <div id="serialOutput" style="flex:1;overflow-y:auto;padding:12px;font-size:13px;line-height:1.6;background:#1e1e1e;"></div>
                
                <!-- Input Area -->
                <div style="padding:12px;background:#2d2d30;border-top:1px solid #3e3e42;display:flex;gap:8px;">
                    <input type="text" id="commandInput" placeholder="Type command and press Enter..." 
                        style="flex:1;padding:10px;background:#3c3c3c;color:#d4d4d4;border:1px solid #555;border-radius:4px;font-family:'Consolas',monospace;">
                    <button id="sendBtn" disabled style="padding:10px 20px;background:#555;color:#999;border:none;border-radius:4px;cursor:not-allowed;font-weight:600;">
                        Send
                    </button>
                </div>
                
                <!-- Device Info Panel -->
                <div id="deviceInfo" style="padding:8px 12px;background:#252526;border-top:1px solid #3e3e42;font-size:11px;color:#858585;display:none;">
                    <strong>Device:</strong> <span id="deviceName">-</span> | 
                    <strong>Vendor:</strong> <span id="deviceVendor">-</span> | 
                    <strong>Product:</strong> <span id="deviceProduct">-</span>
                </div>
            </div>
        `;
        
        const win = window.WindowManager.createWindow('Serial Monitor', html, 700, 500);
        this.setupHandlers(win);
        this.checkWebSerialSupport(win);
        return win;
    },
    
    checkWebSerialSupport(win) {
        if (!('serial' in navigator)) {
            this.log(win, '⚠️ Web Serial API not supported in this browser', 'warning');
            this.log(win, 'Please use Chrome, Edge, or Opera (version 89+)', 'warning');
            this.log(win, 'Enable chrome://flags/#enable-experimental-web-platform-features', 'info');
            win.querySelector('#connectBtn').disabled = true;
        } else {
            this.log(win, '✓ Web Serial API available', 'success');
            this.log(win, 'Click "Connect Device" to select a serial port', 'info');
        }
    },
    
    setupHandlers(win) {
        const connectBtn = win.querySelector('#connectBtn');
        const disconnectBtn = win.querySelector('#disconnectBtn');
        const clearBtn = win.querySelector('#clearBtn');
        const sendBtn = win.querySelector('#sendBtn');
        const commandInput = win.querySelector('#commandInput');
        
        connectBtn.onclick = () => this.connect(win);
        disconnectBtn.onclick = () => this.disconnect(win);
        clearBtn.onclick = () => win.querySelector('#serialOutput').innerHTML = '';
        sendBtn.onclick = () => this.sendCommand(win);
        
        commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.isConnected) {
                this.sendCommand(win);
            }
        });
    },
    
    async connect(win) {
        try {
            const baudRate = parseInt(win.querySelector('#baudRate').value);
            
            this.log(win, 'Opening port selector...', 'info');
            this.port = await navigator.serial.requestPort();
            
            await this.port.open({ baudRate });
            
            const info = this.port.getInfo();
            win.querySelector('#deviceName').textContent = `USB Serial`;
            win.querySelector('#deviceVendor').textContent = info.usbVendorId ? `0x${info.usbVendorId.toString(16)}` : 'Unknown';
            win.querySelector('#deviceProduct').textContent = info.usbProductId ? `0x${info.usbProductId.toString(16)}` : 'Unknown';
            win.querySelector('#deviceInfo').style.display = 'block';
            
            this.isConnected = true;
            this.updateUI(win, true);
            this.log(win, `✓ Connected at ${baudRate} baud`, 'success');
            
            this.startReading(win);
            
        } catch (error) {
            this.log(win, `❌ Connection failed: ${error.message}`, 'error');
        }
    },
    
    async disconnect(win) {
        if (this.reader) {
            await this.reader.cancel();
            this.reader = null;
        }
        
        if (this.port) {
            await this.port.close();
            this.port = null;
        }
        
        this.isConnected = false;
        this.updateUI(win, false);
        this.log(win, '⚫ Disconnected', 'info');
        win.querySelector('#deviceInfo').style.display = 'none';
    },
    
    async startReading(win) {
        const decoder = new TextDecoderStream();
        const readableStreamClosed = this.port.readable.pipeTo(decoder.writable);
        const reader = decoder.readable.getReader();
        this.reader = reader;
        
        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                if (value) {
                    this.log(win, value.trim(), 'data');
                }
            }
        } catch (error) {
            if (error.name !== 'NetworkError') {
                this.log(win, `Read error: ${error.message}`, 'error');
            }
        } finally {
            reader.releaseLock();
        }
    },
    
    async sendCommand(win) {
        const input = win.querySelector('#commandInput');
        const command = input.value.trim();
        
        if (!command || !this.isConnected) return;
        
        try {
            const encoder = new TextEncoder();
            const writer = this.port.writable.getWriter();
            await writer.write(encoder.encode(command + '\n'));
            writer.releaseLock();
            
            this.log(win, `> ${command}`, 'sent');
            input.value = '';
            
        } catch (error) {
            this.log(win, `Send error: ${error.message}`, 'error');
        }
    },
    
    log(win, message, type = 'info') {
        const output = win.querySelector('#serialOutput');
        const timestamp = new Date().toLocaleTimeString();
        
        const colors = {
            info: '#569cd6',
            success: '#4ec9b0',
            warning: '#dcdcaa',
            error: '#f48771',
            data: '#d4d4d4',
            sent: '#c586c0'
        };
        
        const line = document.createElement('div');
        line.style.cssText = `color:${colors[type]};margin-bottom:4px;`;
        line.innerHTML = `<span style="color:#858585">[${timestamp}]</span> ${this.escapeHtml(message)}`;
        
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
    },
    
    updateUI(win, connected) {
        const connectBtn = win.querySelector('#connectBtn');
        const disconnectBtn = win.querySelector('#disconnectBtn');
        const sendBtn = win.querySelector('#sendBtn');
        const statusIndicator = win.querySelector('#statusIndicator');
        const baudRate = win.querySelector('#baudRate');
        
        if (connected) {
            connectBtn.disabled = true;
            connectBtn.style.background = '#555';
            connectBtn.style.color = '#999';
            connectBtn.style.cursor = 'not-allowed';
            
            disconnectBtn.disabled = false;
            disconnectBtn.style.background = '#d32f2f';
            disconnectBtn.style.color = 'white';
            disconnectBtn.style.cursor = 'pointer';
            
            sendBtn.disabled = false;
            sendBtn.style.background = '#0e639c';
            sendBtn.style.color = 'white';
            sendBtn.style.cursor = 'pointer';
            
            statusIndicator.innerHTML = '🟢 Connected';
            statusIndicator.style.background = '#1e4620';
            
            baudRate.disabled = true;
        } else {
            connectBtn.disabled = false;
            connectBtn.style.background = '#0e639c';
            connectBtn.style.color = 'white';
            connectBtn.style.cursor = 'pointer';
            
            disconnectBtn.disabled = true;
            disconnectBtn.style.background = '#555';
            disconnectBtn.style.color = '#999';
            disconnectBtn.style.cursor = 'not-allowed';
            
            sendBtn.disabled = true;
            sendBtn.style.background = '#555';
            sendBtn.style.color = '#999';
            sendBtn.style.cursor = 'not-allowed';
            
            statusIndicator.innerHTML = '⚫ Disconnected';
            statusIndicator.style.background = '#555';
            
            baudRate.disabled = false;
        }
    },
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

if (window.AppRegistry) {
    window.AppRegistry.registerApp({
        id: 'serial-monitor',
        name: 'Serial Monitor',
        icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect x='4' y='12' width='40' height='24' rx='2' fill='%23424242'/><circle cx='12' cy='24' r='2' fill='%234CAF50'/><rect x='18' y='22' width='24' height='4' rx='1' fill='%23666'/><path d='M8 36 L16 36 L12 40 Z' fill='%23FFC107'/><path d='M32 36 L40 36 L36 32 Z' fill='%232196F3'/></svg>",
        handler: () => window.SerialMonitorApp.open(),
        singleInstance: false,
        documentation: {
            name: 'Serial Monitor',
            version: '1.0.0',
            description: 'Real hardware serial communication interface using Web Serial API. Connect to Arduino, ESP32, PLCs, sensors, and other serial devices.',
            type: 'Hardware controller',
            features: [
                'Web Serial API integration',
                'Multiple baud rate support',
                'Real-time data monitoring',
                'Send commands to devices',
                'Device information display',
                'Timestamped output',
                'Works with real hardware'
            ],
            requirements: [
                'Chrome/Edge/Opera 89+',
                'Web Serial API enabled',
                'USB serial device connected'
            ],
            compatibleDevices: [
                'Arduino (Uno, Mega, Nano, etc.)',
                'ESP32/ESP8266',
                'Raspberry Pi Pico',
                'PLCs with serial interface',
                'Industrial sensors',
                'GPS modules',
                'MODBUS devices',
                'Any USB-to-Serial adapter'
            ]
        }
    });
}

