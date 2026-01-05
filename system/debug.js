/*
 * Gnoke Station Debug Viewer
 * System state inspector, console logger, and diagnostic tool
 */

window.DebugViewerApp = (function() {
    'use strict';

    const MAX_LOGS = 500;
    const logs = [];

    // Capture console logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
        logs.push({ type: 'log', time: new Date(), args });
        if (logs.length > MAX_LOGS) logs.shift();
        originalLog.apply(console, args);
    };

    console.error = (...args) => {
        logs.push({ type: 'error', time: new Date(), args });
        if (logs.length > MAX_LOGS) logs.shift();
        originalError.apply(console, args);
    };

    console.warn = (...args) => {
        logs.push({ type: 'warn', time: new Date(), args });
        if (logs.length > MAX_LOGS) logs.shift();
        originalWarn.apply(console, args);
    };

    const HTML_TEMPLATE = `
        <div style="height:100%;display:flex;flex-direction:column;background:#1e1e1e;">
            <style>
                .debug-wrapper {
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    background: #1e1e1e;
                    color: #d4d4d4;
                    padding: 15px;
                    overflow: hidden;
                }

                .debug-toolbar {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 15px;
                    flex-wrap: wrap;
                }

                .debug-btn {
                    border: none;
                    padding: 8px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 600;
                    transition: opacity 0.2s, transform 0.1s;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .debug-btn:hover {
                    opacity: 0.9;
                    transform: translateY(-1px);
                }

                .debug-btn:active {
                    transform: translateY(0);
                }

                .debug-btn-refresh {
                    background: #0e639c;
                    color: white;
                }

                .debug-btn-copy {
                    background: #4caf50;
                    color: white;
                }

                .debug-btn-copy-info {
                    background: #ff9800;
                    color: white;
                }

                .debug-btn-clear {
                    background: #f44336;
                    color: white;
                }

                .debug-btn.success {
                    background: #10b981 !important;
                }

                .debug-content {
                    flex: 1;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .debug-section {
                    background: #252526;
                    padding: 10px;
                    border-radius: 4px;
                    border: 1px solid #3e3e42;
                }

                .debug-section-title {
                    color: #86b4e4;
                    font-weight: bold;
                    margin-bottom: 8px;
                    font-size: 13px;
                }

                .debug-section-subtitle {
                    color: #888;
                    font-size: 11px;
                }

                .debug-info-pre {
                    margin: 0;
                    white-space: pre-wrap;
                    color: #ce9178;
                    line-height: 1.5;
                }

                .debug-logs-container {
                    max-height: 400px;
                    overflow-y: auto;
                    background: #1e1e1e;
                    padding: 8px;
                    border-radius: 4px;
                }

                .debug-log-entry {
                    margin-bottom: 4px;
                    padding: 4px 8px;
                    border-radius: 2px;
                    line-height: 1.4;
                }

                .debug-log-entry.log {
                    color: #d4d4d4;
                    border-left: 2px solid #d4d4d4;
                }

                .debug-log-entry.error {
                    color: #f48771;
                    border-left: 2px solid #f48771;
                    background: rgba(244, 135, 113, 0.1);
                }

                .debug-log-entry.warn {
                    color: #dcdcaa;
                    border-left: 2px solid #dcdcaa;
                    background: rgba(220, 220, 170, 0.1);
                }

                .debug-stat {
                    display: inline-block;
                    margin-right: 16px;
                    margin-bottom: 8px;
                }

                .debug-stat-label {
                    color: #888;
                    font-size: 10px;
                    text-transform: uppercase;
                }

                .debug-stat-value {
                    color: #4ec9b0;
                    font-weight: bold;
                    font-size: 14px;
                }

                /* Scrollbar styling */
                .debug-content::-webkit-scrollbar,
                .debug-logs-container::-webkit-scrollbar {
                    width: 8px;
                }

                .debug-content::-webkit-scrollbar-track,
                .debug-logs-container::-webkit-scrollbar-track {
                    background: #1e1e1e;
                }

                .debug-content::-webkit-scrollbar-thumb,
                .debug-logs-container::-webkit-scrollbar-thumb {
                    background: #424242;
                    border-radius: 4px;
                }

                .debug-content::-webkit-scrollbar-thumb:hover,
                .debug-logs-container::-webkit-scrollbar-thumb:hover {
                    background: #4e4e4e;
                }
            </style>

            <div class="debug-wrapper">
                <div class="debug-toolbar">
                    <button class="debug-btn debug-btn-refresh" id="debugRefresh">
                        🔄 Refresh
                    </button>
                    <button class="debug-btn debug-btn-copy" id="debugCopyLogs">
                        📋 Copy Logs
                    </button>
                    <button class="debug-btn debug-btn-copy-info" id="debugCopyInfo">
                        📋 Copy Info
                    </button>
                    <button class="debug-btn debug-btn-clear" id="debugClear">
                        🗑️ Clear Logs
                    </button>
                </div>

                <div class="debug-content">
                    <div class="debug-section">
                        <div class="debug-section-title">
                            System Information
                        </div>
                        <div id="debugStats"></div>
                        <pre class="debug-info-pre" id="debugInfo"></pre>
                    </div>

                    <div class="debug-section">
                        <div class="debug-section-title">
                            Console Logs 
                            <span class="debug-section-subtitle">(Last ${MAX_LOGS})</span>
                        </div>
                        <div class="debug-logs-container" id="debugLogs"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    function getSystemInfo() {
        return {
            version: window.WebDesktop?.version || 'Unknown',
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            userAgent: navigator.userAgent,
            services: {
                EventBus: !!window.EventBus,
                WindowManager: !!window.WindowManager,
                AppRegistry: !!window.AppRegistry,
                DesktopIconManager: !!window.DesktopIconManager,
                DisplayManager: !!window.DisplayManager,
                Taskbar: !!window.Taskbar
            },
            apps: window.AppRegistry ? window.AppRegistry.getAllApps().map(a => a.name) : [],
            windows: window.WindowManager ? window.WindowManager.getAllWindows().length : 0,
            plugins: window.PluginLoader?.stats() || { loaded: 0, failed: 0, total: 0 }
        };
    }

    function formatLog(log) {
        const time = log.time.toLocaleTimeString();
        const content = log.args.map(arg => {
            if (typeof arg === 'object') {
                try { 
                    return JSON.stringify(arg, null, 2); 
                } catch { 
                    return String(arg); 
                }
            }
            return String(arg);
        }).join(' ');
        return `[${time}] ${content}`;
    }

    async function copyToClipboard(text, button) {
        try {
            await navigator.clipboard.writeText(text);
            const originalText = button.textContent;
            button.textContent = '✓ Copied!';
            button.classList.add('success');
            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('success');
            }, 2000);
        } catch (e) {
            console.error('Failed to copy:', e);
            button.textContent = '✗ Failed';
            setTimeout(() => {
                button.textContent = button.dataset.originalText || 'Copy';
            }, 2000);
        }
    }

    function updateInfo(container) {
        const info = getSystemInfo();
        const infoEl = container.querySelector('#debugInfo');
        const statsEl = container.querySelector('#debugStats');
        
        if (infoEl) {
            infoEl.textContent = JSON.stringify(info, null, 2);
        }

        if (statsEl) {
            const stats = `
                <div class="debug-stat">
                    <div class="debug-stat-label">Windows</div>
                    <div class="debug-stat-value">${info.windows}</div>
                </div>
                <div class="debug-stat">
                    <div class="debug-stat-label">Apps</div>
                    <div class="debug-stat-value">${info.apps.length}</div>
                </div>
                <div class="debug-stat">
                    <div class="debug-stat-label">Logs</div>
                    <div class="debug-stat-value">${logs.length}</div>
                </div>
                <div class="debug-stat">
                    <div class="debug-stat-label">Viewport</div>
                    <div class="debug-stat-value">${info.viewport}</div>
                </div>
            `;
            statsEl.innerHTML = stats;
        }
    }

    function updateLogs(container) {
        const logsEl = container.querySelector('#debugLogs');
        if (!logsEl) return;

        logsEl.innerHTML = logs.slice().reverse().map(log => {
            return `<div class="debug-log-entry ${log.type}">${formatLog(log)}</div>`;
        }).join('');
        logsEl.scrollTop = 0;
    }

    function setupEventListeners(container) {
        const refreshBtn = container.querySelector('#debugRefresh');
        const copyLogsBtn = container.querySelector('#debugCopyLogs');
        const copyInfoBtn = container.querySelector('#debugCopyInfo');
        const clearBtn = container.querySelector('#debugClear');

        if (refreshBtn) {
            refreshBtn.onclick = () => {
                updateInfo(container);
                updateLogs(container);
            };
        }

        if (copyLogsBtn) {
            copyLogsBtn.dataset.originalText = copyLogsBtn.textContent;
            copyLogsBtn.onclick = () => {
                const text = logs.map(formatLog).join('\n');
                copyToClipboard(text, copyLogsBtn);
            };
        }

        if (copyInfoBtn) {
            copyInfoBtn.dataset.originalText = copyInfoBtn.textContent;
            copyInfoBtn.onclick = () => {
                const info = getSystemInfo();
                copyToClipboard(JSON.stringify(info, null, 2), copyInfoBtn);
            };
        }

        if (clearBtn) {
            clearBtn.onclick = () => {
                logs.length = 0;
                updateLogs(container);
                updateInfo(container);
            };
        }
    }

    function open() {
        if (!window.WindowManager) {
            console.error('WindowManager not available');
            return;
        }

        const win = window.WindowManager.createWindow('Debug', HTML_TEMPLATE, 800, 600);
        const container = win.querySelector('.debug-wrapper');

        if (container) {
            setupEventListeners(container);
            updateInfo(container);
            updateLogs(container);
        }

        return win;
    }

    // Public API
    return {
        open: open,
        getLogs: () => [...logs],
        getInfo: getSystemInfo,
        clearLogs: () => { logs.length = 0; }
    };
})();

// ---------------------------------------------------------
// Registration Block: Register Debug Viewer as System App
// ---------------------------------------------------------

if (window.AppRegistry) {
    window.AppRegistry.registerApp({
        id: "debug",
        name: "Debugger",
        icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23007AFF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='14' rx='2'/><path d='M8 21h8'/><path d='M12 17v4'/><path d='M8 9l2 2-2 2M16 9l-2 2 2 2'/></svg>",
        handler: () => window.DebugViewerApp.open(),
        singleInstance: true
    });
    console.log('[Debug Viewer] App registered successfully');
}