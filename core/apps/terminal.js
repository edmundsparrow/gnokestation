/*
 * Gnokestation Shell - Terminal with Enhanced Favicon Support
 * Persistence added using localStorage.
 */

window.TerminalApp = {
    // 🔹 NEW: Key for localStorage
    _STORAGE_KEY: 'gnokestation_installed_urls',

    open() {
        const termHTML = `
            <div class="terminal-container" style="
                height:100%;
                background:black;
                color:lime;
                font-family:monospace;
                padding:10px;
                display:flex;
                flex-direction:column;
            ">
                <div id="terminal-output" style="flex:1; overflow-y:auto; white-space:pre-wrap;"></div>
                <div style="display:flex; align-items:center;">
                    <span style="color:lime;">$</span>
                    <input id="terminal-input" type="text" 
                        style="flex:1; background:black; color:lime; border:none; outline:none; font-family:monospace; padding:5px;" 
                        autofocus />
                </div>
            </div>
        `;

        const win = window.WindowManager.createWindow("Terminal", termHTML, 600, 400);
        this.outputEl = win.querySelector("#terminal-output");
        this.inputEl = win.querySelector("#terminal-input");

        this.print("WebDesktop Terminal v1.1 (Enhanced Favicon Support, Persistence)");
        this.print("Type 'help' to see available commands.\n");

        this.inputEl.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const cmd = this.inputEl.value.trim();
                this.inputEl.value = "";
                this.print("$ " + cmd);
                this.runCommand(cmd);
            }
        });

        return win;
    },

    print(msg) {
        this.outputEl.innerHTML += msg + "\n";
        this.outputEl.scrollTop = this.outputEl.scrollHeight;
    },

    // Helpers ------------------------------------------------

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

    _friendlyNameFromUrlOrPath(input) {
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

    _faviconFor(url) {
        try {
            const u = new URL(url);
            const domain = u.hostname;
            return this._createFaviconDataUrl(domain, url);
        } catch (e) {
            return null;
        }
    },

    _createFaviconDataUrl(domain, fullUrl) {
        const googleFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        return googleFavicon;
    },

    _stringToColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = hash % 360;
        return `hsl(${hue}, 65%, 50%)`;
    },

    _createFallbackIcon(domain) {
        const letter = domain.charAt(0).toUpperCase();
        const color = this._stringToColor(domain);
        
        return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><rect width='48' height='48' rx='8' fill='${encodeURIComponent(color)}'/><text x='24' y='32' text-anchor='middle' font-size='24' font-weight='bold' fill='white' font-family='Arial'>${letter}</text></svg>`;
    },
    
    // 🔹 NEW: Function to recreate the AppRegistry object from a stored URL
    _recreateAppEntry(url) {
        let id, name, icon, handler, urlForIframe = url;

        try {
            const u = new URL(url);
            urlForIframe = u.href;
            id = this._makeId(u.hostname + (u.pathname || ''));
            name = this._friendlyNameFromUrlOrPath(u.href);
            icon = this._faviconFor(u.href) || this._createFallbackIcon(u.hostname);
        } catch (err) {
            id = this._makeId(url);
            name = this._friendlyNameFromUrlOrPath(url);
            icon = this._createFallbackIcon(id);
        }

        handler = () => this._createWebAppWindow(name, urlForIframe);

        return {
            id: id,
            name: (name || id),
            icon: icon,
            handler: handler,
            singleInstance: false,
            // 🔹 CRITICAL: Store the URL on the object for later use by uninstall/re-registration
            url: urlForIframe 
        };
    },

    _createWebAppWindow(appName, url) {
        const iframeHTML = `
            <div style="height:100%;display:flex;flex-direction:column;background:#fff;">
                <div style="padding:8px 10px;border-bottom:1px solid #ddd;background:#f7f7f7;display:flex;align-items:center;gap:8px;">
                    <img src="${this._faviconFor(url)}" style="width:16px;height:16px;" onerror="this.style.display='none'"/>
                    <strong style="font-family:Segoe UI, sans-serif;flex:1;">${appName}</strong>
                    <button onclick="window.open('${url}', '_blank')" style="padding:4px 8px;border:1px solid #ddd;border-radius:3px;background:white;cursor:pointer;font-size:11px;">Open in New Tab</button>
                </div>
                <iframe src="${url}" style="flex:1;border:0;width:100%;height:100%;" sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"></iframe>
            </div>
        `;
        return window.WindowManager.createWindow(appName, iframeHTML, 900, 600);
    },

    _registerAppObject(appObj) {
        let registered = false;
        if (window.AppRegistry && typeof window.AppRegistry.registerApp === 'function') {
            registered = window.AppRegistry.registerApp(appObj);
        } else if (window.AppRegistry && window.AppRegistry.registeredApps instanceof Map) {
            window.AppRegistry.registeredApps.set(appObj.id, appObj);
            registered = true;
        }

        if (registered) {
            if (window.EventBus) window.EventBus.emit('app-registered', appObj);
            // 🔹 CRITICAL: Force desktop icons refresh
            if (window.DesktopIconManager && typeof window.DesktopIconManager.refreshIcons === 'function') {
                setTimeout(() => window.DesktopIconManager.refreshIcons(), 100);
            }
        }
        return registered;
    },

    _unregisterAppId(appId) {
        if (!window.AppRegistry) return false;

        // 1. Get the app object BEFORE unregistering to find its URL
        const allApps = (window.AppRegistry.getAllApps 
            ? window.AppRegistry.getAllApps() 
            : (window.AppRegistry.registeredApps ? Array.from(window.AppRegistry.registeredApps.values()) : [])
        );
        const app = allApps.find(a => a.id === appId);

        let removed = false;
        if (typeof window.AppRegistry.unregisterApp === 'function') {
            try {
                window.AppRegistry.unregisterApp(appId);
                removed = true;
            } catch (e) {
                console.warn('Unregister via API failed:', e);
            }
        } else if (window.AppRegistry.registeredApps && typeof window.AppRegistry.registeredApps.delete === 'function') {
            removed = window.AppRegistry.registeredApps.delete(appId);
        }

        if (removed) {
            if (window.EventBus) {
                window.EventBus.emit('app-unregistered', appId);
                window.EventBus.emit('display-force-refresh');
            }
            // 🔹 CRITICAL: Remove URL from persistence
            if (app && app.url) {
                this._removeInstalledUrl(app.url);
            }
        }

        return removed;
    },
    
    // ---------------------------------------------------------
    // 🔹 PERSISTENCE FUNCTIONS
    // ---------------------------------------------------------

    _loadInstalledUrls() {
        try {
            const stored = localStorage.getItem(this._STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error("Failed to load installed URLs from localStorage:", e);
            return [];
        }
    },

    _saveInstalledUrls(urls) {
        try {
            localStorage.setItem(this._STORAGE_KEY, JSON.stringify(urls));
        } catch (e) {
            console.error("Failed to save installed URLs to localStorage:", e);
        }
    },

    _addInstalledUrl(url) {
        const urls = this._loadInstalledUrls();
        if (!urls.includes(url)) {
            urls.push(url);
            this._saveInstalledUrls(urls);
        }
    },

    _removeInstalledUrl(url) {
        let urls = this._loadInstalledUrls();
        const initialLength = urls.length;
        // Filter out the specific URL
        urls = urls.filter(u => u !== url); 
        if (urls.length !== initialLength) {
            this._saveInstalledUrls(urls);
        }
    },

    // Commands ------------------------------------------------
    // 🔹 CRITICAL: THIS SECTION MUST BE COMPLETE FOR COMMANDS TO WORK

    runCommand(cmd) {
        if (!cmd) return;

        const parts = cmd.split(" ").filter(Boolean);
        const base = (parts[0] || '').toLowerCase();

        switch (base) {
            case "help":
                this.print("Available commands:");
                this.print("  help             - Show this help");
                this.print("  apps             - List registered apps");
                this.print("  open <appId>     - Launch app by ID");
                this.print("  install <url|path> - Register an app from a URL or local path");
                this.print("  uninstall <appId> - Remove a registered app");
                this.print("  testicon <url>   - Test favicon retrieval for a URL");
                this.print("  about            - System info");
                this.print("  clear            - Clear terminal");
                break;

            case "apps":
                if (!window.AppRegistry || typeof window.AppRegistry.getAllApps !== 'function') {
                    this.print("AppRegistry not available.");
                    break;
                }
                const apps = window.AppRegistry.getAllApps();
                this.print("Registered apps:");
                if (!apps || apps.length === 0) {
                    this.print("  (none)");
                } else {
                    // Filter out the terminal itself for a cleaner list
                    apps.filter(a => a.id !== 'terminal').forEach(a => this.print(`  ${a.id} - ${a.name} (${a.url || 'System'})`));
                }
                break;

            case "open":
                if (!parts[1]) {
                    this.print("Usage: open <appId>");
                    break;
                }
                {
                    const appId = parts[1];
                    const all = (window.AppRegistry && typeof window.AppRegistry.getAllApps === 'function')
                        ? window.AppRegistry.getAllApps()
                        : [];
                    const app = all.find(a => a.id === appId);
                    if (app) {
                        if (window.AppRegistry && typeof window.AppRegistry.openApp === 'function') {
                            window.AppRegistry.openApp(appId);
                        } else if (typeof app.handler === 'function') {
                            try { app.handler(); } catch (e) { this.print(`Failed to open ${appId}: ${e}`); }
                        } else {
                            this.print(`App '${appId}' has no handler.`);
                        }
                        this.print(`Opening ${appId}...`);
                    } else {
                        this.print(`App '${appId}' not found.`);
                    }
                }
                break;

            case "testicon":
                if (!parts[1]) {
                    this.print("Usage: testicon <url>");
                    this.print("Example: testicon https://github.com");
                    break;
                }
                {
                    const testUrl = parts[1];
                    try {
                        const faviconUrl = this._faviconFor(testUrl);
                        const fallbackIcon = this._createFallbackIcon(new URL(testUrl).hostname);
                        this.print(`Testing favicon for: ${testUrl}`);
                        this.print(`Favicon URL: ${faviconUrl}`);
                        this.print(`Fallback icon: ${fallbackIcon.substring(0, 100)}...`);
                        this.print(`\nYou can test the URL directly in a browser to verify it works.`);
                    } catch (e) {
                        this.print(`Error testing icon: ${e.message}`);
                    }
                }
                break;

            case "install":
                if (!parts[1]) {
                    this.print("Usage: install <url|file-path>");
                    this.print("Examples:");
                    this.print("  install https://www.photopea.com");
                    this.print("  install github.com (auto-adds https://)");
                    break;
                }
                {
                    const input = parts.slice(1).join(' ');
                    let urlForIframe = input;

                    // URL resolution logic
                    try {
                        const maybeUrl = (/^[\w\-]+(\.[\w\-]+)+/).test(input) && !/^[a-z]+:\/\//i.test(input)
                            ? ('https://' + input)
                            : input;
                        urlForIframe = new URL(maybeUrl).href;
                    } catch (err) {
                        urlForIframe = input; // Treat as local path
                        this.print(`Treating as local path/unresolved URL: ${urlForIframe}`);
                    }

                    // Create the app object
                    const appObj = this._recreateAppEntry(urlForIframe);
                    const id = appObj.id;
                    const name = appObj.name;

                    const existing = (window.AppRegistry && typeof window.AppRegistry.getAllApps === 'function')
                        ? window.AppRegistry.getAllApps().find(a => a.id === id)
                        : null;
                        
                    if (existing) {
                        this.print(`App '${id}' already installed as '${existing.name}'.`);
                        break;
                    }

                    const registered = this._registerAppObject(appObj);
                    if (registered) {
                        // 🔹 CRITICAL: Persist the URL
                        this._addInstalledUrl(appObj.url); 
                        
                        this.print(`✓ App '${appObj.name}' installed successfully as id '${appObj.id}'.`);
                        this.print(`  Desktop icon should now show website favicon and persist on refresh.`);
                    } else {
                        this.print("Failed to register app. AppRegistry unavailable.");
                    }
                }
                break;

            case "uninstall":
                if (!parts[1]) {
                    this.print("Usage: uninstall <appId>");
                    break;
                }
                {
                    const targetId = parts[1];
                    // _unregisterAppId handles removal from AppRegistry AND localStorage
                    const removed = this._unregisterAppId(targetId); 
                    if (removed) {
                        this.print(`✓ App '${targetId}' uninstalled and removed from persistence.`);
                    } else {
                        this.print(`App '${targetId}' not found or could not be uninstalled.`);
                    }
                }
                break;
                
            case "about":
                this.print("WebDesktop Terminal");
                this.print(`Version: 1.1 (Enhanced Favicon Support)`);
                this.print(`Persistence: Enabled via localStorage`);
                this.print(`Time: ${new Date().toLocaleString()}`);
                this.print(`Favicon Service: Google Favicon API`);
                break;

            case "clear":
                this.outputEl.innerHTML = "";
                break;

            default:
                this.print(`Unknown command: ${base}`);
                this.print("Type 'help' for a list of commands.");
        }
    }
};

// ---------------------------------------------------------
// 🔹 INITIALIZATION BLOCK: Register System App & Load Persisted Apps
// ---------------------------------------------------------

// Register terminal as system app
if (window.AppRegistry) {
    window.AppRegistry.registerApp({
        id: "terminal",
        name: "Terminal",
        icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' rx='4' fill='%231e1e1e'/><path d='M12 16l8 8-8 8M24 30h12' stroke='%234ec9b0' stroke-width='2' fill='none' stroke-linecap='round'/></svg>",
        handler: () => window.TerminalApp.open(),
        singleInstance: false
    });

    // Load and register persisted web apps on startup
    const persistedUrls = window.TerminalApp._loadInstalledUrls();
    persistedUrls.forEach(url => {
        const appObj = window.TerminalApp._recreateAppEntry(url);
        // Only register if the ID doesn't conflict with system apps
        if (appObj.id !== 'terminal') {
            window.TerminalApp._registerAppObject(appObj);
        }
    });
}
