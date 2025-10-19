// hue.js - Philips Hue Light Controller
// FILE: applications/hue.js
// VERSION: 1.0.0
// BUILD DATE: 2025-09-30
//
// PURPOSE:
//   Control Philips Hue lights on local network via bridge API.
//
// SETUP:
//   1. Press link button on Hue bridge
//   2. Click "Connect Bridge" within 30 seconds
//   3. App will discover bridge and authenticate
//
// ARCHITECTURE:
//   IIFE / window.HueApp, renders via WindowManager, single instance.

(function(){
  window.HueApp = {
    metadata: {
        name: 'Hue Controller',
        version: '1.0.0',
        icon: '💡',
        author: 'edmundsparrow',
        description: 'Control Philips Hue lights on your network'
    },

    state: {
        bridge: null,
        username: localStorage.getItem('hue_username') || null,
        lights: {},
        groups: {},
        selectedLight: null,
        view: 'setup', // 'setup', 'lights', 'detail'
        currentWindow: null,
        loading: false,
        discovering: false
    },

    open() {
        const html = `<div id="hue-app-container" style="display:flex;flex-direction:column;height:100%;"></div>`;
        const win = window.WindowManager.createWindow('Hue Controller', html, 400, 550);
        this.state.currentWindow = win;

        if (window.EventBus) {
            const cleanup = (data) => {
                if (data.windowId === win.id) {
                    this.cleanup();
                    window.EventBus.off('window-closed', cleanup);
                }
            };
            window.EventBus.on('window-closed', cleanup);
        }

        this.init(win.querySelector('#hue-app-container'));
        return win;
    },

    init(container) {
        this.container = container;
        
        if (this.state.username) {
            this.discoverBridge();
        } else {
            this.state.view = 'setup';
        }
        
        this.render();
    },

    cleanup() {
        if (this.container) this.container.innerHTML = '';
        this.state.currentWindow = null;
    },

    // Bridge Discovery & Authentication
    async discoverBridge() {
        this.state.discovering = true;
        this.render();

        try {
            const response = await fetch('https://discovery.meethue.com/');
            const bridges = await response.json();
            
            if (bridges.length === 0) {
                throw new Error('No Hue bridge found on network');
            }

            this.state.bridge = bridges[0].internalipaddress;
            
            if (this.state.username) {
                await this.loadLights();
                this.state.view = 'lights';
            } else {
                this.state.view = 'setup';
            }
        } catch (error) {
            this.showError('Failed to discover bridge. Check network connection.');
            console.error('Bridge discovery error:', error);
            this.state.view = 'setup';
        } finally {
            this.state.discovering = false;
            this.render();
        }
    },

    async connectBridge() {
        if (!this.state.bridge) {
            await this.discoverBridge();
            if (!this.state.bridge) return;
        }

        this.state.loading = true;
        this.render();

        try {
            const response = await fetch(`http://${this.state.bridge}/api`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ devicetype: 'gnokestation#hue' })
            });

            const data = await response.json();
            
            if (data[0].error) {
                if (data[0].error.type === 101) {
                    this.showError('Press the link button on your bridge first!');
                } else {
                    throw new Error(data[0].error.description);
                }
                return;
            }

            this.state.username = data[0].success.username;
            localStorage.setItem('hue_username', this.state.username);
            
            await this.loadLights();
            this.state.view = 'lights';
        } catch (error) {
            this.showError('Connection failed. Check bridge is accessible.');
            console.error('Bridge connection error:', error);
        } finally {
            this.state.loading = false;
            this.render();
        }
    },

    async loadLights() {
        try {
            const response = await fetch(`http://${this.state.bridge}/api/${this.state.username}/lights`);
            const lights = await response.json();
            
            if (lights.error) throw new Error(lights.error.description);
            
            this.state.lights = lights;
        } catch (error) {
            this.showError('Failed to load lights');
            console.error('Load lights error:', error);
        }
    },

    async setLightState(lightId, state) {
        try {
            await fetch(`http://${this.state.bridge}/api/${this.state.username}/lights/${lightId}/state`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(state)
            });
            
            await this.loadLights();
            this.render();
        } catch (error) {
            this.showError('Failed to control light');
            console.error('Light control error:', error);
        }
    },

    disconnect() {
        this.state.username = null;
        this.state.bridge = null;
        this.state.lights = {};
        this.state.view = 'setup';
        localStorage.removeItem('hue_username');
        this.render();
    },

    // Utility
    hsvToRgb(h, s, v) {
        const hue = h / 65535;
        const sat = s / 254;
        const val = v / 254;
        
        let r, g, b;
        const i = Math.floor(hue * 6);
        const f = hue * 6 - i;
        const p = val * (1 - sat);
        const q = val * (1 - f * sat);
        const t = val * (1 - (1 - f) * sat);

        switch (i % 6) {
            case 0: r = val; g = t; b = p; break;
            case 1: r = q; g = val; b = p; break;
            case 2: r = p; g = val; b = t; break;
            case 3: r = p; g = q; b = val; break;
            case 4: r = t; g = p; b = val; break;
            case 5: r = val; g = p; b = q; break;
        }

        return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
    },

    showError(message) {
        const winEl = this.state.currentWindow;
        if (!winEl) return;
        
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position:absolute;top:10px;right:10px;background:#ef4444;color:white;padding:10px 15px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.5);z-index:1000;font-size:12px;';
        errorDiv.textContent = message;
        winEl.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 4000);
    },

    // Rendering
    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div style="display:flex;flex-direction:column;height:100%;background:#18181b;color:#fafafa;font-family:system-ui,-apple-system,sans-serif;">
                ${this.renderHeader()}
                ${this.state.view === 'setup' ? this.renderSetup() : 
                  this.state.view === 'lights' ? this.renderLights() : 
                  this.renderDetail()}
            </div>
        `;

        this.attachEventListeners();
    },

    renderHeader() {
        return `
            <div style="background:#27272a;padding:20px;border-bottom:2px solid #3f3f46;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <h2 style="margin:0;font-size:24px;font-weight:700;color:#fbbf24;">💡 Hue Controller</h2>
                    ${this.state.view === 'lights' ? `
                        <button data-action="disconnect" style="background:#ef4444;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:12px;">
                            Disconnect
                        </button>
                    ` : ''}
                    ${this.state.view === 'detail' ? `
                        <button data-action="back" style="background:#fbbf24;color:#18181b;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600;">
                            ← Back
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    },

    renderSetup() {
        return `
            <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:30px;text-align:center;">
                <div style="max-width:300px;">
                    <div style="font-size:64px;margin-bottom:20px;">💡</div>
                    <h3 style="margin:0 0 15px 0;font-size:20px;color:#fafafa;">Connect to Hue Bridge</h3>
                    <p style="margin:0 0 25px 0;color:#a1a1aa;line-height:1.6;font-size:14px;">
                        Press the link button on your Philips Hue bridge, then click Connect below within 30 seconds.
                    </p>
                    <button data-action="connect" 
                        ${this.state.loading || this.state.discovering ? 'disabled' : ''}
                        style="width:100%;padding:12px;background:#fbbf24;color:#18181b;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-size:16px;
                        ${this.state.loading || this.state.discovering ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                        ${this.state.loading ? 'Connecting...' : this.state.discovering ? 'Discovering...' : 'Connect Bridge'}
                    </button>
                    ${this.state.bridge ? `
                        <div style="margin-top:15px;font-size:12px;color:#71717a;">
                            Bridge found: ${this.state.bridge}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    renderLights() {
        const lightsList = Object.entries(this.state.lights);
        
        if (lightsList.length === 0) {
            return `
                <div style="flex:1;display:flex;align-items:center;justify-content:center;color:#71717a;">
                    <div style="text-align:center;">
                        <div style="font-size:48px;margin-bottom:15px;">💡</div>
                        <div>No lights found</div>
                    </div>
                </div>
            `;
        }

        return `
            <div style="flex:1;overflow-y:auto;padding:20px;">
                <div style="display:grid;gap:12px;">
                    ${lightsList.map(([id, light]) => this.renderLightCard(id, light)).join('')}
                </div>
            </div>
        `;
    },

    renderLightCard(id, light) {
        const isOn = light.state.on;
        const bri = light.state.bri || 0;
        const color = light.state.hue !== undefined ? 
            this.hsvToRgb(light.state.hue, light.state.sat, light.state.bri) : '#fbbf24';

        return `
            <div style="background:#27272a;border:2px solid #3f3f46;border-radius:12px;padding:16px;cursor:pointer;transition:border-color 0.2s;"
                 data-action="select-light"
                 data-light-id="${id}"
                 onmouseover="this.style.borderColor='#fbbf24'"
                 onmouseout="this.style.borderColor='#3f3f46'">
                
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <div style="width:40px;height:40px;border-radius:50%;background:${isOn ? color : '#3f3f46'};
                            box-shadow:${isOn ? `0 0 20px ${color}` : 'none'};transition:all 0.3s;"></div>
                        <div>
                            <div style="font-weight:700;font-size:16px;color:#fafafa;">${light.name}</div>
                            <div style="font-size:12px;color:#71717a;">${light.type}</div>
                        </div>
                    </div>
                    <label style="position:relative;display:inline-block;width:50px;height:26px;">
                        <input type="checkbox" 
                            ${isOn ? 'checked' : ''}
                            data-action="toggle-light"
                            data-light-id="${id}"
                            onclick="event.stopPropagation()"
                            style="opacity:0;width:0;height:0;">
                        <span style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:#3f3f46;
                            border-radius:26px;transition:0.3s;
                            ${isOn ? 'background:#fbbf24;' : ''}">
                            <span style="position:absolute;height:20px;width:20px;left:3px;bottom:3px;background:white;
                                border-radius:50%;transition:0.3s;${isOn ? 'transform:translateX(24px);' : ''}"></span>
                        </span>
                    </label>
                </div>

                ${isOn ? `
                    <div style="margin-top:12px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                            <span style="font-size:12px;color:#a1a1aa;">Brightness</span>
                            <span style="font-size:12px;color:#fafafa;font-weight:600;">${Math.round((bri / 254) * 100)}%</span>
                        </div>
                        <input type="range" 
                            min="1" 
                            max="254" 
                            value="${bri}"
                            data-action="set-brightness"
                            data-light-id="${id}"
                            onclick="event.stopPropagation()"
                            style="width:100%;height:6px;border-radius:3px;background:#3f3f46;outline:none;
                                -webkit-appearance:none;appearance:none;">
                    </div>
                ` : ''}
            </div>
        `;
    },

    renderDetail() {
        if (!this.state.selectedLight) return '';
        
        const [id, light] = this.state.selectedLight;
        const isOn = light.state.on;
        const bri = light.state.bri || 0;
        const hue = light.state.hue || 0;
        const sat = light.state.sat || 0;

        return `
            <div style="flex:1;overflow-y:auto;padding:20px;">
                <div style="max-width:400px;margin:0 auto;">
                    <div style="background:#27272a;border:2px solid #3f3f46;border-radius:12px;padding:24px;margin-bottom:20px;">
                        <div style="text-align:center;margin-bottom:20px;">
                            <div style="width:80px;height:80px;margin:0 auto 15px;border-radius:50%;
                                background:${isOn ? this.hsvToRgb(hue, sat, bri) : '#3f3f46'};
                                box-shadow:${isOn ? `0 0 40px ${this.hsvToRgb(hue, sat, bri)}` : 'none'}"></div>
                            <h3 style="margin:0 0 5px 0;font-size:22px;color:#fafafa;">${light.name}</h3>
                            <div style="font-size:14px;color:#71717a;">${light.type}</div>
                        </div>

                        <div style="margin-bottom:20px;">
                            <label style="display:flex;align-items:center;justify-content:space-between;cursor:pointer;">
                                <span style="font-weight:600;color:#fafafa;">Power</span>
                                <input type="checkbox" 
                                    ${isOn ? 'checked' : ''}
                                    data-action="toggle-light"
                                    data-light-id="${id}"
                                    style="width:50px;height:26px;">
                            </label>
                        </div>

                        ${isOn && light.state.colormode ? `
                            <div style="margin-bottom:20px;">
                                <label style="display:block;margin-bottom:8px;font-weight:600;color:#fafafa;">Brightness</label>
                                <input type="range" 
                                    min="1" 
                                    max="254" 
                                    value="${bri}"
                                    data-action="set-brightness"
                                    data-light-id="${id}"
                                    style="width:100%;height:8px;border-radius:4px;background:#3f3f46;">
                                <div style="text-align:right;margin-top:4px;font-size:12px;color:#a1a1aa;">
                                    ${Math.round((bri / 254) * 100)}%
                                </div>
                            </div>

                            <div style="margin-bottom:20px;">
                                <label style="display:block;margin-bottom:8px;font-weight:600;color:#fafafa;">Color</label>
                                <input type="range" 
                                    min="0" 
                                    max="65535" 
                                    value="${hue}"
                                    data-action="set-hue"
                                    data-light-id="${id}"
                                    style="width:100%;height:8px;border-radius:4px;
                                        background:linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000);">
                            </div>

                            <div>
                                <label style="display:block;margin-bottom:8px;font-weight:600;color:#fafafa;">Saturation</label>
                                <input type="range" 
                                    min="0" 
                                    max="254" 
                                    value="${sat}"
                                    data-action="set-sat"
                                    data-light-id="${id}"
                                    style="width:100%;height:8px;border-radius:4px;background:#3f3f46;">
                                <div style="text-align:right;margin-top:4px;font-size:12px;color:#a1a1aa;">
                                    ${Math.round((sat / 254) * 100)}%
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    attachEventListeners() {
        // Connect button
        const connectBtn = this.container.querySelector('[data-action="connect"]');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.connectBridge());
        }

        // Disconnect button
        const disconnectBtn = this.container.querySelector('[data-action="disconnect"]');
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => this.disconnect());
        }

        // Back button
        const backBtn = this.container.querySelector('[data-action="back"]');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.state.view = 'lights';
                this.state.selectedLight = null;
                this.render();
            });
        }

        // Light selection
        this.container.querySelectorAll('[data-action="select-light"]').forEach(card => {
            card.addEventListener('click', () => {
                const lightId = card.dataset.lightId;
                this.state.selectedLight = [lightId, this.state.lights[lightId]];
                this.state.view = 'detail';
                this.render();
            });
        });

        // Toggle lights
        this.container.querySelectorAll('[data-action="toggle-light"]').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const lightId = toggle.dataset.lightId;
                this.setLightState(lightId, { on: e.target.checked });
            });
        });

        // Brightness controls
        this.container.querySelectorAll('[data-action="set-brightness"]').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const lightId = slider.dataset.lightId;
                this.setLightState(lightId, { bri: parseInt(e.target.value) });
            });
        });

        // Hue controls
        this.container.querySelectorAll('[data-action="set-hue"]').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const lightId = slider.dataset.lightId;
                this.setLightState(lightId, { hue: parseInt(e.target.value) });
            });
        });

        // Saturation controls
        this.container.querySelectorAll('[data-action="set-sat"]').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const lightId = slider.dataset.lightId;
                this.setLightState(lightId, { sat: parseInt(e.target.value) });
            });
        });
    }
  };

  if (window.AppRegistry) {
    window.AppRegistry.registerApp({
      id: 'hue',
      name: 'Hue Controller',
      icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%23fbbf24' stroke-width='2'><circle cx='12' cy='12' r='5'/><line x1='12' y1='1' x2='12' y2='3'/><line x1='12' y1='21' x2='12' y2='23'/><line x1='4.22' y1='4.22' x2='5.64' y2='5.64'/><line x1='18.36' y1='18.36' x2='19.78' y2='19.78'/><line x1='1' y1='12' x2='3' y2='12'/><line x1='21' y1='12' x2='23' y2='12'/><line x1='4.22' y1='19.78' x2='5.64' y2='18.36'/><line x1='18.36' y1='5.64' x2='19.78' y2='4.22'/></svg>",
      handler: () => window.HueApp.open(),
      singleInstance: true
    });
  }

  if (window.Docs && window.Docs.registerDocumentation) {
    window.Docs.registerDocumentation('hue-controller', {
      name: "Hue Controller",
      version: "1.0.0",
      description: "Control Philips Hue lights on your local network via bridge API",
      type: "User App",
      features: [
        "Auto-discover Hue bridges on local network",
        "One-click authentication with bridge",
        "Toggle lights on/off",
        "Adjust brightness with real-time feedback",
        "Full color control (hue and saturation)",
        "Individual light control",
        "Persistent connection (saved username)"
      ],
      dependencies: ["WindowManager", "AppRegistry"],
      notes: "Requires Philips Hue bridge on same local network. Press bridge button to authenticate.",
      cudos: "edmundsparrow.netlify.app | whatsappme @ 09024054758 | webaplications5050@gmail.com",
      auto_generated: false
    });
  }

})();


