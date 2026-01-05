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

/* ========================================
 * FILE: system/docs.js
 * PURPOSE: Documentation service with JSON block support
 * DEPENDENCIES: EventBus (optional)
 * ======================================== */

window.Docs = {
    registry: new Map(),
    initialized: false,
    
    // Initialize the service
    init() {
        if (this.initialized) return;
        
        console.log('Docs service initializing...');
        
        // Listen for app registrations
        if (window.EventBus) {
            window.EventBus.on('app-registered', (app) => {
                this.collectAppDoc(app.id, app);
            });
        }
        
        // Scan existing apps
        this.scanExistingApps();
        // Scan JSON doc blocks
        this.scanJsonDocs();
        // Register Docs service itself
        this.registerSelfDoc();
        
        this.initialized = true;
        console.log('Docs service ready');
        
        if (window.EventBus) {
            window.EventBus.emit('docs-ready');
        }
    },
    
    // Scan apps already registered
    scanExistingApps() {
        if (window.AppRegistry && window.AppRegistry.registeredApps) {
            window.AppRegistry.registeredApps.forEach((app, id) => {
                this.collectAppDoc(id, app);
            });
        }
    },

    // Scan <script type="application/json" id="doc-APPID"> blocks
    scanJsonDocs() {
        document.querySelectorAll('script[type="application/json"][id^="doc-"]').forEach(el => {
            try {
                const doc = JSON.parse(el.textContent);
                if (doc && doc.file) {
                    const appId = el.id.replace("doc-", "");
                    this.registry.set(appId, {
                        ...doc,
                        id: appId,
                        lastUpdated: new Date().toISOString(),
                        verified: true
                    });
                    console.log(`Documentation loaded from JSON for: ${appId}`);
                }
            } catch (err) {
                console.error("Failed to parse JSON doc block", el.id, err);
            }
        });
    },
    
    // Collect documentation for an app
    collectAppDoc(appId, appObj) {
        const appExists = this.verifyAppExists(appId, appObj);
        if (!appExists) {
            console.log(`Skipping documentation - app does not exist: ${appId}`);
            return;
        }
        
        let doc = null;
        
        // Check for embedded documentation (legacy style)
        if (appObj && appObj.documentation) {
            doc = appObj.documentation;
        }
        
        // Check window namespace (legacy style)
        if (!doc && window[appId + 'App'] && window[appId + 'App'].documentation) {
            doc = window[appId + 'App'].documentation;
        }
        
        if (doc) {
            this.registry.set(appId, {
                ...doc,
                id: appId,
                lastUpdated: new Date().toISOString(),
                verified: true
            });
            console.log(`Documentation collected for verified app: ${appId}`);
        } else {
            console.log(`No inline documentation for: ${appId} (JSON may still exist)`);
        }
    },
    
    // Verify an app actually exists
    verifyAppExists(appId, appObj) {
        if (appObj && typeof appObj.handler === 'function') return true;
        if (window[appId + 'App'] && typeof window[appId + 'App'] === 'object') return true;
        if (window.AppRegistry && window.AppRegistry.registeredApps && window.AppRegistry.registeredApps.has(appId)) return true;
        return false;
    },
    
    // Register self documentation
    registerSelfDoc() {
        this.registry.set('docs', {
            id: 'docs',
            name: 'Documentation Service',
            version: '2.1',
            description: 'Collects and manages application documentation (JSON or inline)',
            type: 'System Service',
            features: [
                'Collects app documentation from JSON blocks',
                'Supports legacy inline docs for backward compatibility',
                'Provides unified documentation API',
                'Strict verification - no false information'
            ],
            methods: [
                { name: 'getDoc', description: 'Get documentation for an app' },
                { name: 'getAllDocs', description: 'Get all documentation' },
                { name: 'search', description: 'Search documentation' },
                { name: 'register', description: 'Manually register documentation' }
            ],
            verified: true,
            lastUpdated: new Date().toISOString()
        });
    },
    
    // PUBLIC API
    
    getDoc(appId) {
        return this.registry.get(appId);
    },
    
    getAllDocs() {
        return Array.from(this.registry.values());
    },
    
    search(query) {
        if (!query) return [];
        
        const searchTerm = query.toLowerCase();
        const results = [];
        
        this.registry.forEach(doc => {
            let relevance = 0;
            
            if (doc.name && doc.name.toLowerCase().includes(searchTerm)) relevance += 10;
            if (doc.description && doc.description.toLowerCase().includes(searchTerm)) relevance += 5;
            if (doc.features && doc.features.some(f => f.toLowerCase().includes(searchTerm))) relevance += 3;
            
            if (relevance > 0) {
                results.push({ ...doc, relevance });
            }
        });
        
        return results.sort((a, b) => b.relevance - a.relevance);
    },
    
    register(appId, docData) {
        this.registry.set(appId, {
            ...docData,
            id: appId,
            lastUpdated: new Date().toISOString(),
            autoGenerated: false
        });
    },
    
    getStats() {
        const docs = this.getAllDocs();
        return {
            total: docs.length,
            system: docs.filter(d => d.type === 'System' || d.type === 'System Service').length,
            user: docs.filter(d => d.type === 'User').length,
            autoGenerated: docs.filter(d => d.autoGenerated).length
        };
    }
};

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => window.Docs.init(), 50);
    });
} else {
    setTimeout(() => window.Docs.init(), 50);
}