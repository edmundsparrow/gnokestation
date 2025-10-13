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

// Simplified Start Menu - Theme Compatible Version
// Gnokestation by edmundsparrow

(function() {
  window.StartMenuApp = {
    searchQuery: '',
    expandedCategories: new Set(['recent', 'productivity']),
    recentApps: JSON.parse(localStorage.getItem('webos-recent-apps') || '[]'),
    maxRecent: 6,

    categories: {
      'recent': { name: 'Recently Used', icon: '🕑' },
      'productivity': { name: 'Office & Productivity', icon: '📊', keywords: ['office', 'text', 'note', 'calculator', 'word', 'pad'] },
      'system': { name: 'System & Tools', icon: '⚙️', keywords: ['system', 'settings', 'file', 'info', 'about', 'docs'] },
      'multimedia': { name: 'Multimedia', icon: '🎭', keywords: ['media', 'audio', 'video', 'music', 'image', 'photo', 'gallery'] },
      'games': { name: 'Games', icon: '🎮', keywords: ['game', 'puzzle', 'fun', 'play'] },
      'internet': { name: 'Internet', icon: '🌐', keywords: ['web', 'browser', 'email', 'weather', 'contacts'] },
      'other': { name: 'Other Applications', icon: '📦' }
    },

    createMenuHTML() {
      // Get current theme colors or use fallback
      const primary1 = getComputedStyle(document.documentElement).getPropertyValue('--theme-primary-1').trim() || '#2c5282';
      const primary2 = getComputedStyle(document.documentElement).getPropertyValue('--theme-primary-2').trim() || '#5b2c82';
      const bg1 = getComputedStyle(document.documentElement).getPropertyValue('--theme-bg-1').trim() || '#e8e4f3';
      const bg2 = getComputedStyle(document.documentElement).getPropertyValue('--theme-bg-2').trim() || '#d8d4e8';
      const bg3 = getComputedStyle(document.documentElement).getPropertyValue('--theme-bg-3').trim() || '#c8c4dd';
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--theme-accent').trim() || '#5b2c82';

      return `
        <div class="start-menu-app" style="
          display: flex;
          flex-direction: column;
          height: 100%;
          background: linear-gradient(180deg, ${bg1} 0%, ${bg2} 50%, ${bg3} 100%);
          font-family: 'Segoe UI', Arial, sans-serif;
          font-size: 13px;
        ">
          <div class="menu-header" style="
            background: linear-gradient(135deg, ${primary1} 0%, ${primary2} 100%);
            color: white;
            padding: 12px 16px;
            font-weight: bold;
            font-size: 16px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
          ">
            <span>🪟 GnokeStation</span>
          </div>

          <div class="menu-search" style="
            padding: 12px 16px;
            background: rgba(255,255,255,0.5);
          ">
            <input type="text" id="start-search" placeholder="Search programs..." style="
              width: 100%;
              padding: 8px 12px;
              border: 1px solid #ccc;
              border-radius: 4px;
              font-size: 13px;
              outline: none;
              background: white;
              box-sizing: border-box;
            ">
          </div>

          <div class="menu-content" id="start-content" style="
            flex-grow: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 8px;
            max-height: 350px;
          "></div>

          <div class="menu-footer" style="
            background: rgba(${this.hexToRgb(accent)}, 0.1);
            padding: 8px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            <div class="menu-stats" id="start-stats" style="font-size: 10px; color: #666;">
              0 programs available
            </div>
            <div class="view-toggle">
              <button class="toggle-btn active" data-view="categories" style="
                padding: 4px 8px; font-size: 10px; background: rgba(${this.hexToRgb(accent)}, 0.3);
                color: white; border: none; cursor: pointer; border-radius: 3px; margin-right: 2px;
              ">Categories</button>
              <button class="toggle-btn" data-view="all" style="
                padding: 4px 8px; font-size: 10px; background: transparent;
                color: ${accent}; border: none; cursor: pointer; border-radius: 3px;
              ">All Programs</button>
            </div>
          </div>
        </div>
      `;
    },

    hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? 
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
        '91, 44, 130';
    },

    setupEventHandlers() {
      if (!this.currentWindow) return;

      const searchInput = this.currentWindow.querySelector('#start-search');
      const contentArea = this.currentWindow.querySelector('#start-content');

      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.renderApps();
      });

      contentArea.addEventListener('click', (e) => {
        e.stopPropagation();
        
        const appItem = e.target.closest('.menu-app-item');
        if (appItem) {
          this.launchApp(appItem.dataset.appId);
          return;
        }

        const categoryHeader = e.target.closest('.category-header');
        if (categoryHeader) {
          const categoryId = categoryHeader.dataset.category;
          if (this.expandedCategories.has(categoryId)) {
            this.expandedCategories.delete(categoryId);
          } else {
            this.expandedCategories.add(categoryId);
          }
          this.renderApps();
        }
      });

      this.currentWindow.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('.toggle-btn');
        if (toggleBtn) {
          const accent = getComputedStyle(document.documentElement).getPropertyValue('--theme-accent').trim() || '#5b2c82';
          
          this.currentWindow.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.style.background = 'transparent';
            btn.style.color = accent;
          });
          toggleBtn.classList.add('active');
          toggleBtn.style.background = `rgba(${this.hexToRgb(accent)}, 0.3)`;
          toggleBtn.style.color = 'white';
          this.viewMode = toggleBtn.dataset.view;
          this.renderApps();
        }
      });
    },

    refreshApps() {
      if (this.currentWindow) this.renderApps();
    },

    renderApps() {
      const contentArea = this.currentWindow.querySelector('#start-content');
      const statsArea = this.currentWindow.querySelector('#start-stats');
      
      const apps = this.getAllApps();
      const processedApps = apps.map(app => ({
        ...app,
        category: this.categorizeApp(app),
        description: this.getAppDescription(app.id)
      }));

      statsArea.textContent = `${apps.length} programs in ${Object.keys(this.categories).length - 1} categories`;

      let filteredApps = this.searchQuery ? 
        processedApps.filter(app => (app.name + ' ' + app.description + ' ' + app.id).toLowerCase().includes(this.searchQuery)) : 
        processedApps;

      if (filteredApps.length === 0) {
        contentArea.innerHTML = '<div style="text-align:center;padding:40px;color:#666;">No programs found</div>';
        return;
      }

      if (!this.searchQuery && (!this.viewMode || this.viewMode === 'categories')) {
        this.renderCategoryView(contentArea, filteredApps);
      } else {
        this.renderAllView(contentArea, filteredApps);
      }
    },

    getAllApps() {
      const apps = [];
      if (window.AppRegistry && window.AppRegistry.registeredApps) {
        window.AppRegistry.registeredApps.forEach((app, id) => {
          if (id !== 'startmenu') {
            apps.push({ id, name: app.name, icon: app.icon || this.getDefaultIcon() });
          }
        });
      }
      return apps;
    },

    categorizeApp(app) {
      const searchText = (app.name + ' ' + app.id).toLowerCase();
      for (const [categoryId, category] of Object.entries(this.categories)) {
        if (categoryId === 'recent' || categoryId === 'other') continue;
        if (category.keywords && category.keywords.some(keyword => searchText.includes(keyword))) {
          return categoryId;
        }
      }
      return 'other';
    },

    getAppDescription(appId) {
      const descriptions = {
        'calculator': 'Perform arithmetic calculations',
        'clock': 'Analog clock with utilities',
        'contacts': 'Manage contact information',
        'weather': 'Weather conditions and forecasts',
        'about': 'System information and docs',
        'gallery': 'View and manage photos',
        'calendar': 'Calendar and scheduling',
        'desktop-settings': 'Customize desktop settings'
      };
      return descriptions[appId] || `${appId} application`;
    },

    renderCategoryView(container, apps) {
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--theme-accent').trim() || '#5b2c82';
      const categorized = this.groupAppsByCategory(apps);
      
      if (this.recentApps.length > 0) {
        const recentAppData = this.recentApps.map(id => apps.find(app => app.id === id)).filter(app => app);
        if (recentAppData.length > 0) categorized.recent = recentAppData;
      }

      let html = '';
      Object.entries(categorized).forEach(([categoryId, categoryApps]) => {
        if (categoryApps.length === 0) return;
        const category = this.categories[categoryId];
        const isExpanded = this.expandedCategories.has(categoryId);

        html += `
          <div class="menu-category" style="margin-bottom: 8px; background: rgba(255,255,255,0.3); border-radius: 6px;">
            <div class="category-header" data-category="${categoryId}" style="
              display: flex; align-items: center; padding: 8px 12px;
              background: rgba(255,255,255,0.6); cursor: pointer; user-select: none;
            ">
              <span style="font-size: 16px; margin-right: 8px;">${category.icon}</span>
              <span style="flex-grow: 1; font-weight: 600; color: ${accent};">${category.name}</span>
              <span style="background: rgba(${this.hexToRgb(accent)}, 0.2); color: ${accent}; padding: 2px 6px; border-radius: 10px; font-size: 10px; margin-right: 6px;">${categoryApps.length}</span>
              <span style="color: ${accent}; ${isExpanded ? 'transform: rotate(90deg);' : ''}">▶</span>
            </div>
            <div style="${isExpanded ? 'display: block;' : 'display: none;'} padding: 4px; background: rgba(255,255,255,0.2);">
              ${categoryApps.map(app => this.renderAppItem(app, categoryId === 'recent')).join('')}
            </div>
          </div>
        `;
      });
      container.innerHTML = html;
    },

    renderAllView(container, apps) {
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--theme-accent').trim() || '#5b2c82';
      
      const html = `
        <div class="menu-category" style="margin-bottom: 8px; background: rgba(255,255,255,0.3); border-radius: 6px;">
          <div style="display: flex; align-items: center; padding: 8px 12px; background: rgba(255,255,255,0.6);">
            <span style="font-size: 16px; margin-right: 8px;">📋</span>
            <span style="flex-grow: 1; font-weight: 600; color: ${accent};">All Programs</span>
            <span style="background: rgba(${this.hexToRgb(accent)}, 0.2); color: ${accent}; padding: 2px 6px; border-radius: 10px; font-size: 10px;">${apps.length}</span>
          </div>
          <div style="padding: 4px; background: rgba(255,255,255,0.2);">
            ${apps.sort((a, b) => a.name.localeCompare(b.name)).map(app => this.renderAppItem(app)).join('')}
          </div>
        </div>
      `;
      container.innerHTML = html;
    },

    renderAppItem(app, isRecent = false) {
      const highlightedName = this.searchQuery ? 
        app.name.replace(new RegExp(`(${this.searchQuery})`, 'gi'), '<span style="background: yellow;">$1</span>') : 
        app.name;

      return `
        <div class="menu-app-item" data-app-id="${app.id}" style="
          display: flex; align-items: center; padding: 6px 8px; margin: 2px 0; border-radius: 4px;
          cursor: pointer; background: rgba(255,255,255,0.4); ${isRecent ? 'border-left: 3px solid #4caf50;' : ''}
        " onmouseover="this.style.background='rgba(255,255,255,0.7)'" onmouseout="this.style.background='rgba(255,255,255,0.4)'">
          <img src="${app.icon}" style="width: 24px; height: 24px; margin-right: 10px; border-radius: 2px;">
          <div>
            <div style="font-size: 13px; font-weight: 500; color: #333;">${highlightedName}</div>
            <div style="font-size: 10px; color: #666;">${app.description}</div>
          </div>
        </div>
      `;
    },

    groupAppsByCategory(apps) {
      const grouped = {};
      Object.keys(this.categories).forEach(categoryId => {
        if (categoryId !== 'recent') grouped[categoryId] = [];
      });
      apps.forEach(app => {
        if (grouped[app.category]) grouped[app.category].push(app);
      });
      Object.keys(grouped).forEach(categoryId => {
        if (grouped[categoryId].length === 0) delete grouped[categoryId];
      });
      return grouped;
    },

    launchApp(appId) {
      if (window.AppRegistry) {
        window.AppRegistry.openApp(appId);
        this.addToRecent(appId);
      }
    },

    addToRecent(appId) {
      this.recentApps = this.recentApps.filter(id => id !== appId);
      this.recentApps.unshift(appId);
      if (this.recentApps.length > this.maxRecent) {
        this.recentApps = this.recentApps.slice(0, this.maxRecent);
      }
      localStorage.setItem('webos-recent-apps', JSON.stringify(this.recentApps));
    },

    getDefaultIcon() {
      return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><rect width='24' height='24' fill='%23ccc'/></svg>";
    }
  };

  if (window.AppRegistry) {
    window.AppRegistry.registerApp({
      id: 'startmenu',
      name: 'Start Menu',
      icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><rect width='24' height='24' fill='%234a90e2'/></svg>",
      handler: () => window.StartMenuApp.open(),
      singleInstance: true
    });
  }
})();
