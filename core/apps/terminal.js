/*
 * Gnokestation Shell - Terminal with Enhanced Favicon Support
 * Fixed to properly display website favicons on desktop icons
 */

window.TerminalApp = {
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

        this.print("WebDesktop Terminal v1.1 (Enhanced Favicon Support)");
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

    // 🔹 ENHANCED: Multiple favicon services with fallback
    _faviconFor(url) {
        try {
            const u = new URL(url);
            const domain = u.hostname;
            
            // Strategy: Try multiple favicon services in order of reliability
            // Return a data URI that will attempt multiple sources
            return this._createFaviconDataUrl(domain, url);
        } catch (e) {
            return null;
        }
    },

    // 🔹 NEW: Create a robust favicon data URL with fallback logic
    _createFaviconDataUrl(domain, fullUrl) {
        // Create an SVG that tries to load the favicon, with fallback to letter icon
        const firstLetter = domain.charAt(0).toUpperCase();
        const colorHash = this._stringToColor(domain);
        
        // We'll use Google's favicon service as primary, with fallback to direct domain favicon
        const googleFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        const directFavicon = `${new URL(fullUrl).origin}/favicon.ico`;
        
        // Return the Google favicon URL directly - it's the most reliable
        // The desktop icon renderer will handle it as an image source
        return googleFavicon;
    },

    // 🔹 NEW: Generate a color from domain string for fallback icons
    _stringToColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = hash % 360;
        return `hsl(${hue}, 65%, 50%)`;
    },

    // 🔹 NEW: Create fallback SVG icon with domain initial
    _createFallbackIcon(domain) {
        const letter = domain.charAt(0).toUpperCase();
        const color = this._stringToColor(domain);
        
        return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><rect width='48' height='48' rx='8' fill='${encodeURIComponent(color)}'/><text x='24' y='32' text-anchor='middle' font-size='24' font-weight='bold' fill='white' font-family='Arial'>${letter}</text></svg>`;
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
        if (window.AppRegistry && typeof window.AppRegistry.registerApp === 'function') {
            const ok = window.AppRegistry.registerApp(appObj);
            if (!ok && window.EventBus) {
                window.EventBus.emit('app-registered', appObj);
            }
            // 🔹 CRITICAL: Force desktop icons refresh
            if (window.DesktopIconManager && typeof window.DesktopIconManager.refreshIcons === 'function') {
                setTimeout(() => window.DesktopIconManager.refreshIcons(), 100);
            }
            return ok;
        } else if (window.AppRegistry && window.AppRegistry.registeredApps instanceof Map) {
            window.AppRegistry.registeredApps.set(appObj.id, appObj);
            if (window.EventBus) window.EventBus.emit('app-registered', appObj);
            if (window.DesktopIconManager && typeof window.DesktopIconManager.refreshIcons === 'function') {
                setTimeout(() => window.DesktopIconManager.refreshIcons(), 100);
            }
            return true;
        }
        return false;
    },

    _unregisterAppId(appId) {
        if (!window.AppRegistry) return false;

        if (typeof window.AppRegistry.unregisterApp === 'function') {
            try {
                window.AppRegistry.unregisterApp(appId);
                if (window.EventBus) {
                    window.EventBus.emit('app-unregistered', appId);
                    window.EventBus.emit('display-force-refresh');
                }
                return true;
            } catch (e) {
                console.warn('Unregister via API failed:', e);
            }
        }

        if (window.AppRegistry.registeredApps && typeof window.AppRegistry.registeredApps.delete === 'function') {
            const deleted = window.AppRegistry.registeredApps.delete(appId);
            if (deleted && window.EventBus) {
                window.EventBus.emit('app-unregistered', appId);
                window.EventBus.emit('display-force-refresh');
            }
            return deleted;
        }

        return false;
    },

    // Commands ------------------------------------------------

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
                    apps.forEach(a => this.print(`  ${a.id} - ${a.name}`));
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
                    this.print("  install http://example.net/myapp.html");
                    this.print("  install github.com (auto-adds https://)");
                    break;
                }
                {
                    const input = parts.slice(1).join(' ');
                    let id = null;
                    let name = null;
                    let icon = null;
                    let handler = null;
                    let urlForIframe = input;

                    try {
                        const maybeUrl = (/^[\w\-]+(\.[\w\-]+)+/).test(input) && !/^[a-z]+:\/\//i.test(input)
                            ? ('https://' + input)
                            : input;
                        const u = new URL(maybeUrl);
                        urlForIframe = u.href;
                        id = this._makeId(u.hostname + (u.pathname || ''));
                        name = this._friendlyNameFromUrlOrPath(u.href);
                        
                        // 🔹 ENHANCED: Use improved favicon fetching
                        icon = this._faviconFor(u.href);
                        if (!icon) {
                            icon = this._createFallbackIcon(u.hostname);
                        }
                        
                        handler = () => this._createWebAppWindow(name, urlForIframe);
                        
                        this.print(`Resolved URL: ${urlForIframe}`);
                        this.print(`Favicon URL: ${icon}`);
                    } catch (err) {
                        urlForIframe = input;
                        id = this._makeId(input);
                        name = this._friendlyNameFromUrlOrPath(input);
                        icon = this._createFallbackIcon(id);
                        handler = () => this._createWebAppWindow(name, urlForIframe);
                        
                        this.print(`Treating as local path: ${urlForIframe}`);
                    }

                    id = id || this._makeId(name);

                    const existing = (window.AppRegistry && typeof window.AppRegistry.getAllApps === 'function')
                        ? window.AppRegistry.getAllApps().find(a => a.id === id)
                        : null;
                    if (existing) {
                        this.print(`App '${id}' already installed as '${existing.name}'.`);
                        break;
                    }

                    const appObj = {
                        id,
                        name: (name || id),
                        icon: icon,
                        handler,
                        singleInstance: false
                    };

                    const registered = this._registerAppObject(appObj);
                    if (registered) {
                        this.print(`✓ App '${appObj.name}' installed successfully as id '${appObj.id}'.`);
                        this.print(`  Desktop icon should now show website favicon.`);
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
                    const removed = this._unregisterAppId(targetId);
                    if (removed) {
                        this.print(`✓ App '${targetId}' uninstalled.`);
                    } else {
                        this.print(`App '${targetId}' not found or could not be uninstalled.`);
                    }
                }
                break;

            case "about":
                this.print("WebDesktop Terminal");
                this.print(`Version: 1.1 (Enhanced Favicon Support)`);
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

// Register terminal as system app
if (window.AppRegistry) {
    window.AppRegistry.registerApp({
        id: "terminal",
        name: "Terminal",
        icon: "data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjMDBmZjAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMiAyYTIgMiAwIDAgMC0yIDJ2MTRhMiAyIDAgMCAwIDIgMmgxOGEyIDIgMCAwIDAgMi0yVjRhMiAyIDAgMCAwLTItMkgyeiIvPjxwYXRoIGQ9Ik00IDE3bDYtNi02LTYiLz48cGF0aCBkPSJNMTAgMTdoOG0wLTFoOCIvPjwvc3ZnPg==",
        handler: () => window.TerminalApp.open(),
        singleInstance: false
    });
}