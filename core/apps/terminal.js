/* ========================================
 * FILE: system/terminal.js
 * PURPOSE: Simple Terminal app for WebDesktop
 * DEPENDENCIES: AppRegistry, WindowManager
 * ======================================== */

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

        this.print("WebDesktop Terminal v1.0");
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

    runCommand(cmd) {
        if (!cmd) return;

        const parts = cmd.split(" ");
        const base = parts[0].toLowerCase();

        switch (base) {
            case "help":
                this.print("Available commands:");
                this.print("  help          - Show this help");
                this.print("  apps          - List registered apps");
                this.print("  open <appId>  - Launch app by ID");
                this.print("  about         - System info");
                this.print("  clear         - Clear terminal");
                break;

            case "apps":
                if (!window.AppRegistry) {
                    this.print("AppRegistry not available.");
                    break;
                }
                const apps = window.AppRegistry.getAllApps();
                this.print("Registered apps:");
                apps.forEach(a => this.print(`  ${a.id} - ${a.name}`));
                break;

            case "open":
                if (!parts[1]) {
                    this.print("Usage: open <appId>");
                    break;
                }
                const appId = parts[1];
                const app = window.AppRegistry.getAllApps().find(a => a.id === appId);
                if (app) {
                    window.AppRegistry.openApp(appId);
                    this.print(`Opening ${appId}...`);
                } else {
                    this.print(`App '${appId}' not found.`);
                }
                break;

            case "about":
                this.print("WebDesktop Terminal");
                this.print(`Version: 1.0`);
                this.print(`Time: ${new Date().toLocaleString()}`);
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