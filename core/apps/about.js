/*
 * Gnokestation Shell
 * Copyright (C) 2025 Ekong Ikpe <ekongmikpe@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

window.AboutApp = {
    currentWindow: null,
    docsReady: false,

    open() {
        const content = this.createContent();
        this.currentWindow = window.WindowManager.createWindow('About System', content, 600, 450);

        this.showProjectInfo();
        // ------------------------------------------------------------------

        // Wait for Docs to initialize before setting up handlers
        if (window.Docs && window.Docs.initialized) {
            this.docsReady = true;
            this.setupEventHandlers();
        } else {
            const onDocsReady = () => {
                this.docsReady = true;
                this.setupEventHandlers();
                if (window.EventBus) window.EventBus.off('docs-ready', onDocsReady);
            };
            if (window.EventBus) {
                window.EventBus.on('docs-ready', onDocsReady);
            } else {
                // fallback: poll until Docs is ready
                const poll = setInterval(() => {
                    if (window.Docs && window.Docs.initialized) {
                        clearInterval(poll);
                        this.docsReady = true;
                        this.setupEventHandlers();
                    }
                }, 50);
            }
        }

        return this.currentWindow;
    },

    createContent() {
        return `
            <div class="about-container" style="display: flex; height: 100%; font-family: 'Segoe UI', sans-serif;">
                <div class="sidebar" style="width: 200px; background: #f8f9fa; border-right: 1px solid #dee2e6; display: flex; flex-direction: column;">
                    <div style="padding: 10px; background: #343a40; color: white; text-align: left;">
                        <h3 style="margin: 0 0 2px 0; font-size: 16px;">Gnoke-Station</h3>
                        <p style="margin: 0; font-size: 12px; opacity: 0.8;">Documentation Browser</p>
                    </div>
                    <div style="padding: 10px;">
                        <input type="text" id="doc-search" placeholder="Search..." style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 12px; box-sizing: border-box;">
                    </div>
                    <div class="filter-buttons" style="padding: 0 10px 10px;">
                        <button class="filter-btn active" data-filter="all" style="width: 100%; padding: 6px; margin: 2px 0; border: none; background: #007bff; color: white; border-radius: 3px; font-size: 11px; cursor: pointer;">All Apps</button>
                        <button class="filter-btn" data-filter="system" style="width: 100%; padding: 6px; margin: 2px 0; border: 1px solid #ccc; background: white; color: #333; border-radius: 3px; font-size: 11px; cursor: pointer;">System</button>
                        <button class="filter-btn" data-filter="user" style="width: 100%; padding: 6px; margin: 2px 0; border: 1px solid #ccc; background: white; color: #333; border-radius: 3px; font-size: 11px; cursor: pointer;">User Apps</button>
                    </div>
                    <div id="app-list" style="flex: 1; overflow-y: auto; padding: 5px;"></div>
                </div>
                <div class="main-content" style="flex: 1; background: white; padding: 20px; overflow-y: auto;">
                    <div id="app-details">
                        </div>
                </div>
            </div>
        `;
    },

        showProjectInfo() {
        if (!this.currentWindow) return;
        const detailsDiv = this.currentWindow.querySelector('#app-details');
        
        // Minor style alignment changes for better presentation
        detailsDiv.innerHTML = `
            <div style="padding: 0; border-bottom: 1px solid #eee; margin-bottom: 20px;">
                <h1 style="margin: 0; color: #343a40;">Gnoke-Station Project Info</h1>
                <p style="color: #7f8c8d; font-size: 14px; margin-top: 5px;">
                    One familiar desktop interface for all devices.
                </p>
            </div>
            
            <div style="margin-bottom: 20px; padding: 0;">
                <h3 style="color:#495057; margin-bottom: 10px;">Project Overview</h3>
                <p style="color:#666; line-height:1.6; text-align: justify;">
                    Gnoke-Station is an **ultra-lightweight, browser-based interface** designed as a consistent and extendable desktop environment for all devices with a modern browser. It's an ideal, cost-effective UI solution for screens on IoT devices, kiosks, and low-power hardware.
                </p>
                <p style="color:#666; line-height:1.6; margin-top: 10px; text-align: justify;">
                    Crucially, it is **mobile and tablet friendly by design**, built on standard web technologies to avoid the complexity and overhead often associated with traditional C++ or embedded interface solutions.
                </p>
            </div>

            <div style="margin-bottom: 20px; padding: 0;">
                <h3 style="color:#495057; margin-bottom: 10px;">Documentation & Source</h3>
                <p style="color:#666; line-height:1.6; text-align: justify;">
                    For comprehensive details on the project's **architecture, value statement, use cases, and contribution guidelines**, please refer to the main repository documentation.
                </p>
                <p style="text-align: center; margin-top: 25px;">
                    <a href="https://github.com/edmundsparrow/gnokestation/blob/main/README.md" target="_blank" style="
                        display: inline-block;
                        padding: 10px 20px;
                        background: #007bff;
                        color: white;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: 500;
                        font-size: 14px;
                        transition: background 0.2s;
                    ">
                        View Full README.md on GitHub 🚀
                    </a>
                </p>
            </div>
            
            <div style="background:#f0f0f0; padding:15px; border-radius:4px; margin-top:20px; font-family:'Segoe UI', sans-serif; font-size:12px; color:#495057;">
                <div><strong>License:</strong> GNU General Public License v3.0 (GPL-3.0)</div>
                <div><strong>Project URL:</strong> <a href="https://gnokestation.netlify.app/" target="_blank" style="color:#007bff; text-decoration:none;">gnokestation.netlify.app</a></div>
            </div>
        `;
    },
    
    setupEventHandlers() {
        // ... (rest of setupEventHandlers remains the same)
        if (!this.currentWindow || !this.docsReady) return;

        const searchInput = this.currentWindow.querySelector('#doc-search');
        const filterBtns = this.currentWindow.querySelectorAll('.filter-btn');
        const appList = this.currentWindow.querySelector('#app-list');

        searchInput.addEventListener('input', () => this.updateAppList());
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => { b.classList.remove('active'); b.style.background='white'; b.style.color='#333'; b.style.border='1px solid #ccc'; });
                btn.classList.add('active'); btn.style.background='#007bff'; btn.style.color='white'; btn.style.border='none';
                this.updateAppList();
            });
        });
        appList.addEventListener('click', e => {
            const appItem = e.target.closest('.app-item');
            if (!appItem) return;
            this.currentWindow.querySelectorAll('.app-item').forEach(item => item.style.background='#f8f9fa');
            appItem.style.background='#e3f2fd';
            this.showAppDetails(appItem.dataset.appId);
        });

        this.updateAppList();
    },
    // ... (updateAppList and showAppDetails remain the same)

    updateAppList() {
        if (!this.currentWindow || !window.Docs || !this.docsReady) return;

        const query = this.currentWindow.querySelector('#doc-search').value.trim();
        const filter = this.currentWindow.querySelector('.filter-btn.active')?.dataset.filter || 'all';
        let docs = query ? window.Docs.search(query) : window.Docs.getAllDocs();

        if (filter === 'system') docs = docs.filter(d => d.type === 'System' || d.type === 'System Service');
        else if (filter === 'user') docs = docs.filter(d => d.type === 'User');

        const appList = this.currentWindow.querySelector('#app-list');
        appList.innerHTML = docs.length > 0
            ? docs.map(d => `<div class="app-item" data-app-id="${d.id}" style="padding:8px;margin:2px 0;background:#f8f9fa;border-radius:4px;cursor:pointer;border-left:3px solid ${this.getTypeColor(d.type)};">
                <div style="font-weight:500;font-size:13px;">${d.name}</div>
                <div style="font-size:11px;color:#666;">v${d.version} • ${d.type}</div>
            </div>`).join('')
            : '<div style="padding:20px;text-align:center;color:#666;">No apps found</div>';
    },

    showAppDetails(appId) {
        if (!window.Docs || !this.docsReady) return;
        const doc = window.Docs.getDoc(appId); if (!doc) return;

        const detailsDiv = this.currentWindow.querySelector('#app-details');
        detailsDiv.innerHTML = `
            <div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                    <div><h1 style="margin:0;color:#333;">${doc.name}</h1><p style="margin:5px 0 0 0;color:#666;">Version ${doc.version}</p></div>
                    <span style="background:${this.getTypeColor(doc.type)};color:white;padding:4px 8px;border-radius:12px;font-size:12px;font-weight:500;">${doc.type}</span>
                </div>
                <div style="margin-bottom:20px;">
                    <h3 style="color:#495057;margin-bottom:10px;">Description</h3>
                    <p style="color:#666;line-height:1.5;text-align: justify;">${doc.description}</p>
                </div>
                ${doc.features?.length ? `<div style="margin-bottom:20px;"><h3 style="color:#495057;margin-bottom:10px;">Features</h3><ul style="color:#666;line-height:1.5;">${doc.features.map(f=>`<li>${f}</li>`).join('')}</ul></div>` : ''}
                ${doc.methods?.length ? `<div style="margin-bottom:20px;"><h3 style="color:#495057;margin-bottom:10px;">Methods</h3><div>${doc.methods.map(m=>`<div style="background:#f8f9fa;padding:10px;margin:5px 0;border-radius:4px;border-left:3px solid #007bff;"><code style="font-weight:bold;color:#007bff;">${m.name}</code><p style="margin:5px 0 0 0;color:#666;font-size:14px;text-align: justify;">${m.description||''}</p></div>`).join('')}</div></div>` : ''}
                ${doc.autoGenerated ? `<div style="background:#fff3cd;border:1px solid #ffeaa7;padding:10px;border-radius:4px;margin:20px 0;color:#856404;"><strong>Note:</strong> This documentation was auto-generated.</div>` : ''}
                <div style="background:#f0f0f0;padding:15px;border-radius:4px;margin-top:20px;font-family:monospace;font-size:12px;color:#495057;">
                    <div><strong>App ID:</strong> ${doc.id}</div>
                    <div><strong>Last Updated:</strong> ${new Date(doc.lastUpdated).toLocaleString()}</div>
                    <div><strong>Source:</strong> ${doc.autoGenerated?'Auto-generated':'Manual'}</div>
                </div>
            </div>
        `;
    },

    getTypeColor(type) {
        return { 'System':'#dc3545', 'System Service':'#6f42c1', 'User':'#28a745' }[type] || '#6c757d';
    }
};

// Register AboutApp with AppRegistry
if (window.AppRegistry) {
    window.AppRegistry.registerApp({
        id: 'about',
        name: 'About System',
        icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><circle cx='24' cy='24' r='20' fill='%234a90e2'/><path d='M24 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm-2 12v16h4V20h-4z' fill='white'/></svg>",
        handler: () => window.AboutApp.open(),
        singleInstance: true,
        documentation: {
            name: 'About System',
            version: '1.0',
            description: 'Documentation viewer for all system and user applications',
            type: 'System',
            features: [
                'Browse all app documentation',
                'Search apps by name and description',
                'Filter by app type (System/User)',
                'View detailed app information and methods'
            ],
            methods: [
                { name: 'open', description: 'Opens the documentation browser window' }
            ]
        }
    });
}

