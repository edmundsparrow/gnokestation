/* ========================================
 * FILE: system/sysinfo.js
 * PURPOSE: System Information viewer (like msinfo32)
 * DEPENDENCIES: AppRegistry, WindowManager, GnokeStation
 * ======================================== */

window.SysInfoApp = {
    open() {
        const infoHTML = `
            <div style="height:100%;overflow-y:auto;padding:16px;font-family:'Segoe UI',sans-serif;background:#f8f9fa;">
                <h2 style="margin-top:0;">System Information</h2>
                <div id="sysinfo-content" style="font-family:monospace;font-size:13px;white-space:pre-wrap;"></div>
            </div>
        `;

        const win = window.WindowManager.createWindow("System Information", infoHTML, 600, 500);
        this.contentEl = win.querySelector("#sysinfo-content");
        this.loadInfo();
        return win;
    },

    loadInfo() {
        const info = {
            "GnokeStation Version": window.GnokeStation ? window.GnokeStation.version : "Unknown",
            "Initialized": window.GnokeStation ? window.GnokeStation.initialized : false,
            "Timestamp": new Date().toLocaleString(),
            "Browser": navigator.userAgent,
            "Platform": navigator.platform,
            "Language": navigator.language,
            "Viewport": `${window.innerWidth} x ${window.innerHeight}`,
            "Screen": `${screen.width} x ${screen.height}`,
            "Color Depth": screen.colorDepth + " bits",
            "Online": navigator.onLine,
            "Cookies Enabled": navigator.cookieEnabled,
            "Memory": navigator.deviceMemory ? navigator.deviceMemory + " GB" : "Unknown",
            "Cores": navigator.hardwareConcurrency || "Unknown",
            "Services": {
                EventBus: !!window.EventBus,
                WindowManager: !!window.WindowManager,
                AppRegistry: !!window.AppRegistry,
                DesktopManager: !!window.DesktopManager,
                Taskbar: !!window.Taskbar,
                StartMenu: !!window.StartMenu,
                DesktopIcons: !!window.DesktopIconManager
            },
            "Registered Apps": window.AppRegistry ? window.AppRegistry.getAllApps().map(a => `${a.id} (${a.name})`).join(", ") : "None"
        };

        let output = "";
        for (const key in info) {
            if (typeof info[key] === "object") {
                output += `${key}:\n`;
                for (const sub in info[key]) {
                    output += `  ${sub}: ${info[key][sub]}\n`;
                }
            } else {
                output += `${key}: ${info[key]}\n`;
            }
        }

        this.contentEl.textContent = output;
    }
};

// Register as system app
if (window.AppRegistry) {
    window.AppRegistry.registerApp({
        id: "sysinfo",
        name: "System Info",
        icon: "data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjMDA3YmY3IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTIgMmE5Ljk0IDkuOTQgMCAxIDAgMCAxOS45OCA5Ljk0IDkuOTQgMCAwIDAgMC0xOS45OHptMCAxOGE4IDggMCAxIDEgMC0xNiA4IDggMCAwIDEgMCAxNnoiLz48cGF0aCBkPSJNMTIgMTRhMSAxIDAgMCAwIDAtMmExIDEgMCAwIDAgMCAyem0tMS01aDJ2LTJoLTJ6Ii8+PC9zdmc+",
        handler: () => window.SysInfoApp.open(),
        singleInstance: true
    });
}

