// cisco-router.js - Cisco Router Management Interface
(function() {
    window.CiscoRouterController = {
        routerIP: '192.168.1.1',
        authToken: null,
        pollInterval: null,

        open() {
            const html = `
                <div style="height:100%;display:flex;flex-direction:column;font-family:'Segoe UI',sans-serif;background:#1a1a2e;color:#e0e0e0;">
                    
                    <!-- Header -->
                    <div style="padding:16px;background:#16213e;border-bottom:2px solid #0f3460;">
                        <h2 style="margin:0 0 8px 0;color:#5dade2;">Cisco Router Manager</h2>
                        <div style="display:flex;gap:12px;align-items:center;">
                            <label style="font-size:13px;color:#aaa;">Router IP:</label>
                            <input id="router-ip" type="text" value="192.168.1.1" 
                                style="padding:6px;background:#0f3460;color:#fff;border:1px solid #1f4068;border-radius:4px;width:150px;">
                            <button id="connect-btn" style="padding:6px 12px;background:#0f3460;color:#fff;border:1px solid #1f4068;border-radius:4px;cursor:pointer;">
                                Connect
                            </button>
                        </div>
                    </div>

                    <!-- Main Content -->
                    <div style="flex:1;overflow-y:auto;padding:16px;">
                        
                        <!-- System Info -->
                        <div style="background:#16213e;border-radius:8px;padding:16px;margin-bottom:16px;border:1px solid #1f4068;">
                            <h3 style="margin:0 0 12px 0;color:#5dade2;font-size:16px;">System Information</h3>
                            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;font-size:13px;">
                                <div>
                                    <div style="color:#aaa;">Model:</div>
                                    <div id="model" style="font-weight:600;">--</div>
                                </div>
                                <div>
                                    <div style="color:#aaa;">Firmware:</div>
                                    <div id="firmware" style="font-weight:600;">--</div>
                                </div>
                                <div>
                                    <div style="color:#aaa;">Uptime:</div>
                                    <div id="uptime" style="font-weight:600;">--</div>
                                </div>
                                <div>
                                    <div style="color:#aaa;">CPU Load:</div>
                                    <div id="cpu" style="font-weight:600;">--</div>
                                </div>
                            </div>
                        </div>

                        <!-- Interface Status -->
                        <div style="background:#16213e;border-radius:8px;padding:16px;margin-bottom:16px;border:1px solid #1f4068;">
                            <h3 style="margin:0 0 12px 0;color:#5dade2;font-size:16px;">Network Interfaces</h3>
                            <div id="interfaces-container"></div>
                        </div>

                        <!-- Routing Table -->
                        <div style="background:#16213e;border-radius:8px;padding:16px;margin-bottom:16px;border:1px solid #1f4068;">
                            <h3 style="margin:0 0 12px 0;color:#5dade2;font-size:16px;">Active Routes</h3>
                            <div id="routes-container" style="font-size:12px;font-family:monospace;"></div>
                        </div>

                        <!-- Connected Clients -->
                        <div style="background:#16213e;border-radius:8px;padding:16px;border:1px solid #1f4068;">
                            <h3 style="margin:0 0 12px 0;color:#5dade2;font-size:16px;">DHCP Clients</h3>
                            <div id="clients-container"></div>
                        </div>

                    </div>

                    <!-- Footer Controls -->
                    <div style="padding:12px;background:#16213e;border-top:1px solid #1f4068;display:flex;gap:8px;">
                        <button id="refresh-btn" style="padding:8px 16px;background:#0f3460;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;">
                            Refresh
                        </button>
                        <button id="reboot-btn" style="padding:8px 16px;background:#dc3545;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;">
                            Reboot Router
                        </button>
                        <button id="config-btn" style="padding:8px 16px;background:#0f3460;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;">
                            View Config
                        </button>
                    </div>

                </div>
            `;

            const win = window.WindowManager.createWindow('Cisco Router Manager', html, 600, 700);
            this.setupHandlers(win);
            return win;
        },

        setupHandlers(win) {
            const connectBtn = win.querySelector('#connect-btn');
            const refreshBtn = win.querySelector('#refresh-btn');
            const rebootBtn = win.querySelector('#reboot-btn');
            const configBtn = win.querySelector('#config-btn');
            const ipInput = win.querySelector('#router-ip');

            connectBtn.addEventListener('click', () => {
                this.routerIP = ipInput.value;
                this.connect(win);
            });

            refreshBtn.addEventListener('click', () => this.fetchRouterData(win));
            rebootBtn.addEventListener('click', () => this.rebootRouter(win));
            configBtn.addEventListener('click', () => this.showConfig(win));

            // Cleanup on close
            win.addEventListener('close', () => {
                if (this.pollInterval) clearInterval(this.pollInterval);
            });
        },

        async connect(win) {
            try {
                // Cisco IOS-XE RESTCONF API authentication
                const response = await fetch(`https://${this.routerIP}/restconf/data/ietf-system:system-state`, {
                    headers: {
                        'Accept': 'application/yang-data+json',
                        'Authorization': 'Basic ' + btoa('admin:password') // Replace with actual credentials
                    }
                });

                if (response.ok) {
                    this.authToken = response.headers.get('X-Auth-Token');
                    this.showNotification(win, 'Connected to router', 'success');
                    this.fetchRouterData(win);
                    
                    // Start polling
                    this.pollInterval = setInterval(() => this.fetchRouterData(win), 10000);
                } else {
                    throw new Error('Authentication failed');
                }
            } catch (error) {
                this.showNotification(win, 'Connection failed: ' + error.message, 'error');
            }
        },

        async fetchRouterData(win) {
            try {
                // Fetch system info
                const sysResponse = await fetch(`https://${this.routerIP}/restconf/data/Cisco-IOS-XE-native:native/version`, {
                    headers: {
                        'Accept': 'application/yang-data+json',
                        'Authorization': 'Basic ' + btoa('admin:password')
                    }
                });
                const sysData = await sysResponse.json();
                this.updateSystemInfo(win, sysData);

                // Fetch interfaces
                const intResponse = await fetch(`https://${this.routerIP}/restconf/data/ietf-interfaces:interfaces`, {
                    headers: {
                        'Accept': 'application/yang-data+json',
                        'Authorization': 'Basic ' + btoa('admin:password')
                    }
                });
                const intData = await intResponse.json();
                this.renderInterfaces(win, intData['ietf-interfaces:interfaces'].interface);

                // Fetch routing table
                const routeResponse = await fetch(`https://${this.routerIP}/restconf/data/ietf-routing:routing/routing-instance=default/ribs/rib=ipv4-default`, {
                    headers: {
                        'Accept': 'application/yang-data+json',
                        'Authorization': 'Basic ' + btoa('admin:password')
                    }
                });
                const routeData = await routeResponse.json();
                this.renderRoutes(win, routeData['ietf-routing:rib'].routes.route);

            } catch (error) {
                this.showNotification(win, 'Data fetch failed: ' + error.message, 'error');
            }
        },

        updateSystemInfo(win, data) {
            win.querySelector('#model').textContent = data['Cisco-IOS-XE-native:version'] || 'Unknown';
            win.querySelector('#firmware').textContent = data.software || 'Unknown';
            win.querySelector('#uptime').textContent = this.formatUptime(data.uptime);
            win.querySelector('#cpu').textContent = data.cpu + '%' || '--';
        },

        renderInterfaces(win, interfaces) {
            const container = win.querySelector('#interfaces-container');
            
            container.innerHTML = interfaces.map(iface => {
                const status = iface['oper-status'] === 'up' ? '#28a745' : '#dc3545';
                return `
                    <div style="padding:10px;background:#0f3460;border-radius:4px;margin-bottom:8px;border-left:4px solid ${status};">
                        <div style="display:flex;justify-content:space-between;">
                            <div>
                                <div style="font-weight:600;">${iface.name}</div>
                                <div style="font-size:12px;color:#aaa;">
                                    ${iface['ipv4-address'] || 'No IP'} • 
                                    ${iface['admin-status']} / ${iface['oper-status']}
                                </div>
                            </div>
                            <div style="font-size:12px;color:#aaa;">
                                ${iface.speed || '--'}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        },

        renderRoutes(win, routes) {
            const container = win.querySelector('#routes-container');
            
            container.innerHTML = '<div style="color:#aaa;margin-bottom:8px;">Destination | Gateway | Metric</div>' +
                routes.map(route => `
                    <div style="padding:6px;background:#0f3460;border-radius:4px;margin-bottom:4px;">
                        ${route['destination-prefix']} via ${route['next-hop']} (${route.metric})
                    </div>
                `).join('');
        },

        async rebootRouter(win) {
            if (!confirm('Reboot router? This will disconnect all clients.')) return;

            try {
                await fetch(`https://${this.routerIP}/restconf/operations/cisco-ia:reload`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/yang-data+json',
                        'Authorization': 'Basic ' + btoa('admin:password')
                    },
                    body: JSON.stringify({ 'cisco-ia:input': { 'save-config': true } })
                });
                
                this.showNotification(win, 'Reboot initiated', 'success');
            } catch (error) {
                this.showNotification(win, 'Reboot failed: ' + error.message, 'error');
            }
        },

        showConfig(win) {
            // Opens running-config in new window
            fetch(`https://${this.routerIP}/restconf/data/Cisco-IOS-XE-native:native`, {
                headers: {
                    'Accept': 'application/yang-data+json',
                    'Authorization': 'Basic ' + btoa('admin:password')
                }
            })
            .then(r => r.json())
            .then(config => {
                const configWin = window.WindowManager.createWindow(
                    'Router Configuration',
                    `<pre style="font-family:monospace;font-size:12px;padding:16px;background:#0a0a0a;color:#0f0;overflow:auto;height:100%;">${JSON.stringify(config, null, 2)}</pre>`,
                    600, 500
                );
            });
        },

        formatUptime(seconds) {
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            return `${days}d ${hours}h`;
        },

        showNotification(win, message, type) {
            const colors = { success: '#28a745', error: '#dc3545', info: '#0f3460' };
            const notification = document.createElement('div');
            notification.style.cssText = `
                position:absolute;top:70px;right:16px;background:${colors[type]};color:#fff;
                padding:10px 16px;border-radius:4px;font-size:13px;z-index:1000;
                box-shadow:0 4px 12px rgba(0,0,0,0.3);
            `;
            notification.textContent = message;
            win.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        }
    };

    if (window.AppRegistry) {
        window.AppRegistry.registerApp({
            id: 'cisco-router-controller',
            name: 'Cisco Router Manager',
            icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' rx='8' fill='%230f3460'/><rect x='10' y='18' width='28' height='12' rx='2' fill='%235dade2'/><circle cx='16' cy='24' r='2' fill='%230f3460'/><circle cx='24' cy='24' r='2' fill='%230f3460'/><circle cx='32' cy='24' r='2' fill='%230f3460'/></svg>",
            handler: () => window.CiscoRouterController.open(),
            singleInstance: true
        });
    }
})();

