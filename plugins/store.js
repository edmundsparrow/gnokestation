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

// store.js - Category tabs, search functionality, and notification system
/*
 * Gnokestation Store UI – Light Theme + Tabs + Install Filter + Pagination
 * Clean + Functional + No SVG initials
 */

(function () {
    const PAGE_SIZE = 40; // shows 40 apps per page

    const Store = {
        currentCategory: 'all',
        searchQuery: '',
        filterMode: 'all', // all | installed | not_installed
        currentPage: 1,

        categories: ['all', 'oob', 'hal', 'recommended'],

        categoryStyles: {
            oob: { text: 'Core/OOB', color: '#28a745' },
            hal: { text: 'HAL Device', color: '#e74c3c' },
            recommended: { text: 'Recommended', color: '#007bff' },
            all: { text: 'All', color: '#6c757d' }
        },

        open() {
            const win = window.WindowManager.createWindow(
                'GnokeStation Store',
                this.renderHTML(),
                520,
                600
            );

            this.win = win;
            this.setupHandlers();
            this.renderApps();
            return win;
        },

        renderHTML() {
            const tabs = this.categories.map(cat => `
                <button class="category-tab" data-cat="${cat}"
                    style="padding:10px 16px;border:none;background:transparent;cursor:pointer;
                    color:#444;font-weight:600;">
                    ${cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
            `).join('');

            return `
            <div style="display:flex;flex-direction:column;height:100%;
                font-family:'Segoe UI',sans-serif;background:#ffffff;">

                <!-- SEARCH -->
                <div style="padding:12px;border-bottom:1px solid #ddd;">
                    <input type="text" id="store-search" placeholder="Search apps..."
                        style="width:100%;padding:8px;border-radius:6px;border:1px solid #ccc;font-size:14px;">
                </div>

                <!-- TABS -->
                <div style="display:flex;border-bottom:1px solid #ddd;padding:0 12px;gap:10px;">
                    ${tabs}
                </div>

                <!-- DROPDOWN FILTER -->
                <div style="padding:8px 12px;border-bottom:1px solid #ddd;">
                    <select id="install-filter" 
                        style="padding:6px 10px;border-radius:6px;border:1px solid #ccc;font-size:14px;width:100%;">
                        <option value="all">Show: All Apps</option>
                        <option value="installed">Show: Installed Only</option>
                        <option value="not_installed">Show: Not Installed Only</option>
                    </select>
                </div>

                <!-- APP LIST -->
                <div id="app-list" 
                    style="flex:1;overflow:auto;padding:12px;display:grid;gap:12px;background:white;"></div>

                <!-- PAGINATION -->
                <div id="pagination" 
                    style="padding:10px;text-align:center;border-top:1px solid #ddd;background:#fafafa;">
                </div>
            </div>`;
        },

        setupHandlers() {
            const search = this.win.querySelector('#store-search');
            search.addEventListener('input', e => {
                this.searchQuery = e.target.value;
                this.currentPage = 1;
                this.renderApps();
            });

            // Category Tabs
            this.win.querySelectorAll('.category-tab').forEach(tab => {
                tab.addEventListener('click', e => {
                    this.currentCategory = e.target.dataset.cat;
                    this.currentPage = 1;

                    this.win.querySelectorAll('.category-tab').forEach(t => {
                        t.style.borderBottom = 'none';
                        t.style.color = '#444';
                    });
                    e.target.style.borderBottom = '2px solid #007bff';
                    e.target.style.color = '#007bff';

                    this.renderApps();
                });
            });

            // Install Filter
            this.win.querySelector('#install-filter').addEventListener('change', e => {
                this.filterMode = e.target.value;
                this.currentPage = 1;
                this.renderApps();
            });

            // Install / Uninstall
            this.win.addEventListener('click', e => {
                if (e.target.classList.contains('install-btn')) {
                    const id = e.target.dataset.id;

                    if (window.ProgramLoader.isAppInstalled(id)) {
                        window.ProgramLoader.uninstallApp(id);
                    } else {
                        window.ProgramLoader.installApp(id);
                    }
                    this.renderApps();
                }
            });
        },

        categorizeApp(app) {
            return app.category || 'oob';
        },

        filter(apps) {
            return apps.filter(a => {
                let catMatch =
                    this.currentCategory === 'all' ||
                    this.categorizeApp(a) === this.currentCategory;

                let searchMatch =
                    (a.name + a.description)
                        .toLowerCase()
                        .includes(this.searchQuery.toLowerCase());

                let installed = window.ProgramLoader.isAppInstalled(a.id);
                let installFilter =
                    this.filterMode === 'all' ||
                    (this.filterMode === 'installed' && installed) ||
                    (this.filterMode === 'not_installed' && !installed);

                return catMatch && searchMatch && installFilter;
            });
        },

        paginate(apps) {
            const totalPages = Math.ceil(apps.length / PAGE_SIZE);
            const start = (this.currentPage - 1) * PAGE_SIZE;
            const end = start + PAGE_SIZE;
            return { totalPages, items: apps.slice(start, end) };
        },

        renderPagination(totalPages) {
            const box = this.win.querySelector('#pagination');

            if (totalPages <= 1) {
                box.innerHTML = '';
                return;
            }

            box.innerHTML = `
                <button id="prevPage"
                    style="padding:6px 10px;border:1px solid #ccc;border-radius:4px;background:white;cursor:pointer;"
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                    Prev
                </button>

                <span style="margin:0 10px;font-weight:600;">
                    Page ${this.currentPage} of ${totalPages}
                </span>

                <button id="nextPage"
                    style="padding:6px 10px;border:1px solid #ccc;border-radius:4px;background:white;cursor:pointer;"
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                    Next
                </button>
            `;

            box.querySelector('#prevPage').onclick = () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderApps();
                }
            };

            box.querySelector('#nextPage').onclick = () => {
                this.currentPage++;
                this.renderApps();
            };
        },

        renderApps() {
            const list = this.win.querySelector('#app-list');

            const filtered = this.filter(window.ProgramLoader.getAvailableApps());
            const { items, totalPages } = this.paginate(filtered);

            if (!filtered.length) {
                list.innerHTML = `
                    <div style="text-align:center;color:#888;padding:40px;">No apps found</div>`;
                this.renderPagination(0);
                return;
            }

            list.innerHTML = items.map(a => {
                const installed = window.ProgramLoader.isAppInstalled(a.id);
                const cat = this.categorizeApp(a);
                const catStyle = this.categoryStyles[cat] || { text: cat, color: '#666' };

                return `
                    <div style="padding:12px;border:1px solid #ddd;border-radius:6px;
                        display:flex;justify-content:space-between;align-items:center;background:white;">
                        
                        <div>
                            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                                <strong>${a.name}</strong>
                                <span style="font-size:11px;font-weight:600;padding:2px 6px;border-radius:4px;
                                    background:${catStyle.color};color:white;">
                                    ${catStyle.text}
                                </span>
                            </div>

                            <small>${a.description || ''}</small>
                            <div style="font-size:11px;color:#007bff;margin-top:4px;">
                                ${installed ? 'Installed' : `Available (${a.size || 'Small'})`}
                            </div>
                        </div>

                        <button class="install-btn" data-id="${a.id}"
                            style="padding:6px 14px;border:none;border-radius:4px;
                            background:${installed ? '#e74c3c' : '#28a745'};
                            color:white;font-weight:600;cursor:pointer;">
                            ${installed ? 'Uninstall' : 'Install'}
                        </button>
                    </div>
                `;
            }).join('');

            this.renderPagination(totalPages);
        }
    };

    // Register Store as app
    if (window.AppRegistry) {
        window.AppRegistry.registerApp({
            id: 'gnokestore',
            name: 'App Store',
            icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' rx='8' fill='%23007bff'/><circle cx='24' cy='20' r='6' fill='white'/><rect x='14' y='28' width='20' height='2' fill='white'/><rect x='16' y='32' width='16' height='2' fill='white'/></svg>",
            handler: () => window.GnokeStationStore.open(),
            singleInstance: true
        });
    }

    window.GnokeStationStore = Store;
})();

