/* ========================================
 * FILE: coreapps/control.js
 * VERSION: 1.0.0
 * PURPOSE: Control Panel - System apps launcher
 * Simple, clean UI to access system utilities
 * ======================================== */

window.ControlPanel = {
    name: 'Control Panel',
    version: '1.0.0',
    
    // System apps organized by category
    categories: [
        {
            name: 'System',
            apps: ['desktop-settings', 'about', 'deviceman']
        },
        {
            name: 'Development',
            apps: ['debug', 'app-manager']
        },
        {
            name: 'Utilities',
            apps: []
        }
    ],
    
    open() {
        const html = `
            <style>
                .cp-container {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    background: #f5f5f5;
                    font-family: 'Segoe UI', sans-serif;
                }
                
                .cp-header {
                    padding: 16px 20px;
                    background: linear-gradient(135deg, #2c5282, #1a365d);
                    color: white;
                    border-bottom: 2px solid rgba(0,0,0,0.1);
                }
                
                .cp-title {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 600;
                }
                
                .cp-subtitle {
                    margin: 4px 0 8px;
                    font-size: 12px;
                    opacity: 0.9;
                }
                
                .cp-search {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid rgba(255,255,255,0.3);
                    border-radius: 4px;
                    background: rgba(255,255,255,0.15);
                    color: white;
                    font-size: 13px;
                    outline: none;
                }
                
                .cp-search::placeholder {
                    color: rgba(255,255,255,0.7);
                }
                
                .cp-search:focus {
                    background: rgba(255,255,255,0.25);
                    border-color: rgba(255,255,255,0.5);
                }
                
                .cp-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                }
                
                .cp-category {
                    max-width: 800px;
                    margin: 0 auto 16px;
                    background: white;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                .cp-category.hidden {
                    display: none;
                }
                
                .cp-category-header {
                    background: linear-gradient(to right, #2c5282, #1a365d);
                    color: white;
                    padding: 12px 16px;
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    user-select: none;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                
                .cp-category-header:hover {
                    background: linear-gradient(to right, #1a365d, #0f2540);
                }
                
                .cp-category-toggle {
                    width: 0;
                    height: 0;
                    border-left: 5px solid transparent;
                    border-right: 5px solid transparent;
                    border-top: 6px solid white;
                    transition: transform 0.2s;
                }
                
                .cp-category.collapsed .cp-category-toggle {
                    transform: rotate(-90deg);
                }
                
                .cp-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                    gap: 16px;
                    padding: 20px;
                    max-height: 1000px;
                    overflow: hidden;
                    transition: max-height 0.3s ease-out, padding 0.3s ease-out;
                }
                
                .cp-category.collapsed .cp-grid {
                    max-height: 0;
                    padding: 0 20px;
                }
                
                .cp-item {
                    background: white;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 20px 16px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                
                .cp-item:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 6px 12px rgba(0,0,0,0.1);
                    border-color: #2c5282;
                }
                
                .cp-item:active {
                    transform: translateY(-2px);
                }
                
                .cp-item.unavailable {
                    opacity: 0.4;
                    cursor: not-allowed;
                }
                
                .cp-item.unavailable:hover {
                    transform: none;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    border-color: #e0e0e0;
                }
                
                .cp-item.hidden {
                    display: none;
                }
                
                .cp-icon {
                    width: 48px;
                    height: 48px;
                    margin: 0 auto 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 32px;
                }
                
                .cp-icon img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }
                
                .cp-name {
                    font-size: 13px;
                    font-weight: 600;
                    color: #1a1a1a;
                    line-height: 1.3;
                    margin-bottom: 4px;
                }
                
                .cp-desc {
                    font-size: 11px;
                    color: #666;
                    line-height: 1.3;
                }
                
                .cp-no-results {
                    text-align: center;
                    color: #999;
                    padding: 40px 20px;
                    font-size: 14px;
                }
                
                @media (max-width: 600px) {
                    .cp-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 12px;
                    }
                    
                    .cp-item {
                        padding: 16px 12px;
                    }
                    
                    .cp-icon {
                        width: 40px;
                        height: 40px;
                        font-size: 28px;
                    }
                }
            </style>
            
            <div class="cp-container">
                <div class="cp-header">
                    <h1 class="cp-title">⚙️ Control Panel</h1>
                    <p class="cp-subtitle">System settings and utilities</p>
                    <input type="text" id="cp-search" class="cp-search" placeholder="Search settings...">
                </div>
                
                <div id="cp-content" class="cp-content"></div>
            </div>
        `;
        
        const win = window.WindowManager.createWindow('Control Panel', html, 600, 500);
        this.renderItems(win);
        this.setupSearch(win);
        return win;
    },
    
    renderItems(win) {
        const content = win.querySelector('#cp-content');
        
        if (!window.AppRegistry || !window.AppRegistry.registeredApps) {
            content.innerHTML = '<p style="text-align:center;color:#999;">AppRegistry not available</p>';
            return;
        }
        
        content.innerHTML = '';
        
        this.categories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'cp-category';
            categoryDiv.dataset.categoryName = category.name.toLowerCase();
            
            const header = document.createElement('div');
            header.className = 'cp-category-header';
            header.innerHTML = `
                <span>${category.name}</span>
                <div class="cp-category-toggle"></div>
            `;
            
            const grid = document.createElement('div');
            grid.className = 'cp-grid';
            
            category.apps.forEach(appId => {
                const app = window.AppRegistry.registeredApps.get(appId);
                
                const item = document.createElement('div');
                item.className = app ? 'cp-item' : 'cp-item unavailable';
                
                if (app) {
                    let iconHTML = '';
                    if (app.icon) {
                        if (app.icon.startsWith('data:') || app.icon.startsWith('http')) {
                            iconHTML = `<img src="${app.icon}" alt="${app.name}">`;
                        } else {
                            iconHTML = app.icon;
                        }
                    } else {
                        iconHTML = '⚙️';
                    }
                    
                    let description = 'System utility';
                    if (app.documentation && app.documentation.description) {
                        description = app.documentation.description.substring(0, 50);
                        if (app.documentation.description.length > 50) {
                            description += '...';
                        }
                    }
                    
                    item.innerHTML = `
                        <div class="cp-icon">${iconHTML}</div>
                        <div class="cp-name">${app.name}</div>
                        <div class="cp-desc">${description}</div>
                    `;
                    
                    item.dataset.searchText = `${app.name} ${description}`.toLowerCase();
                    item.onclick = () => this.launchApp(app);
                } else {
                    item.innerHTML = `
                        <div class="cp-icon">❌</div>
                        <div class="cp-name">${this.formatAppId(appId)}</div>
                        <div class="cp-desc">Not available</div>
                    `;
                    item.dataset.searchText = this.formatAppId(appId).toLowerCase();
                }
                
                grid.appendChild(item);
            });
            
            categoryDiv.appendChild(header);
            categoryDiv.appendChild(grid);
            content.appendChild(categoryDiv);
            
            // Add collapse handler
            header.onclick = () => {
                categoryDiv.classList.toggle('collapsed');
            };
        });
    },
    
    setupSearch(win) {
        const searchInput = win.querySelector('#cp-search');
        const content = win.querySelector('#cp-content');
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            
            const categories = content.querySelectorAll('.cp-category');
            let hasResults = false;
            
            categories.forEach(category => {
                const items = category.querySelectorAll('.cp-item');
                let categoryHasVisible = false;
                
                items.forEach(item => {
                    const searchText = item.dataset.searchText || '';
                    if (query === '' || searchText.includes(query)) {
                        item.classList.remove('hidden');
                        categoryHasVisible = true;
                        hasResults = true;
                    } else {
                        item.classList.add('hidden');
                    }
                });
                
                // Show/hide category based on whether it has visible items
                if (categoryHasVisible) {
                    category.classList.remove('hidden');
                    category.classList.remove('collapsed'); // Expand when searching
                } else {
                    category.classList.add('hidden');
                }
            });
            
            // Show "no results" message
            let noResults = content.querySelector('.cp-no-results');
            if (!hasResults && query !== '') {
                if (!noResults) {
                    noResults = document.createElement('div');
                    noResults.className = 'cp-no-results';
                    noResults.textContent = 'No settings found matching your search';
                    content.appendChild(noResults);
                }
            } else if (noResults) {
                noResults.remove();
            }
        });
    },
    
    launchApp(app) {
        try {
            if (!app.handler) {
                this.showNotification(`${app.name} has no handler`, 'error');
                return;
            }
            
            app.handler();
            this.showNotification(`${app.name} opened`, 'success');
            
        } catch (error) {
            console.error(`Failed to launch ${app.id}:`, error);
            this.showNotification(`Failed to open ${app.name}`, 'error');
        }
    },
    
    formatAppId(id) {
        // Convert 'desktop-settings' to 'Desktop Settings'
        return id.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    },
    
    showNotification(message, type = 'info') {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#2c5282'
        };
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            font-family: 'Segoe UI', sans-serif;
            font-size: 13px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 999999;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 2000);
    }
};

// Register Control Panel with AppRegistry
if (window.AppRegistry) {
    window.AppRegistry.registerApp({
        id: 'control',
        name: 'Control Panel',
        icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%232c5282' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' fill='%232c5282' opacity='0.15'/><path d='M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z'/></svg>",
        handler: () => window.ControlPanel.open(),
        singleInstance: true,
        showOnDesktop: true,
        documentation: {
            name: 'Control Panel',
            version: '1.0.0',
            description: 'Central hub for accessing system settings and utilities',
            type: 'System',
            features: [
                'Quick access to system settings',
                'Desktop configuration',
                'Theme management',
                'Device manager',
                'System information',
                'Debug tools'
            ]
        }
    });
}

console.log('✓ Control Panel loaded');