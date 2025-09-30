// programs.js - Third-party App Manager for WebDesktop
(function() {
    window.ProgramLoader = {
        // App catalog - these are the available apps that can be installed
        appCatalog: [
            // Existing Apps
            {
                id: 'wled',
                name: 'WLED Controller',
                size: '24KB',
                category: 'IoT',
                url: 'system/store/wled.js',
                description: 'Control WLED-compatible LED strips with real-time effects'
            },
            {
                id: 'notepad',
                name: 'Notepad',
                size: '21KB',
                category: 'Productivity',
                url: 'system/store/notepad.js',
                description: 'Simple text editor with file save/load capabilities. limited edition'
            },
            {
                id: 'aquarium',
                name: 'Aquarium App',
                size: '56.75 KB',
                category: 'Utility',
                url: 'system/store/aquarium.js',
                description: 'Management or display for an aquarium system.'
            },
            {
                id: 'calendar',
                name: 'Calendar',
                size: '12.12 KB',
                category: 'Productivity',
                url: 'system/store/calendar.js',
                description: 'A standard calendar application.'
            },
            {
                id: 'cloud-storage',
                name: 'Cloud Storage',
                size: '15.19 KB',
                category: 'System',
                url: 'system/store/cloud-storage.js',
                description: 'Interface for accessing cloud storage services. Under Development.'
            },
            {
                id: 'contacts',
                name: 'Contacts',
                size: '18.16 KB',
                category: 'Productivity',
                url: 'system/store/contacts.js',
                description: 'Address book and contact management tool.'
            },
            {
                id: 'gallery',
                name: 'Gallery',
                size: '15.13 KB',
                category: 'Media',
                url: 'system/store/gallery.js',
                description: 'Viewer for images and media.'
            },
            {
                id: 'gpio',
                name: 'GPIO Interface',
                size: '46.77 KB',
                category: 'IoT',
                url: 'system/store/gpio.js',
                description: 'Interface for General Purpose Input/Output (GPIO) control.'
            },
            {
                id: 'greenhouse',
                name: 'Greenhouse Controller',
                size: '31.44 KB',
                category: 'IoT',
                url: 'system/store/greenhouse.js',
                description: 'Application for monitoring and controlling a smart greenhouse.'
            },
            {
                id: 'homehub',
                name: 'Home Hub',
                size: '65.71 KB',
                category: 'System',
                url: 'system/store/homehub.js',
                description: 'Central control interface for smart home devices.'
            },
            {
                id: 'itel',
                name: 'iTel Utility',
                size: '17.77 KB',
                category: 'Utility',
                url: 'system/store/itel.js',
                description: 'Specific utility application (iTel branded or similar). Under Development'
            },
            {
                id: 'odroid',
                name: 'ODROID Utility',
                size: '59.74 KB',
                category: 'System',
                url: 'system/store/odroid.js',
                description: 'System or hardware management tool, likely for an ODROID device.'
            },
            {
                id: 'samsung-tv',
                name: 'Samsung TV Remote',
                size: '23.62 KB',
                category: 'IoT',
                url: 'system/store/samsung-tv.js',
                description: 'Remote control and management for a Samsung smart TV.'
            },
            {
                id: 'sysinfo',
                name: 'System Info',
                size: '3.29 KB',
                category: 'System',
                url: 'system/store/sysinfo.js',
                description: 'Displays detailed information about the browser system and hardware.'
            }
        ],

        installedApps: new Set(),
        loadedScripts: new Set(),
        
        init() {
            console.log('ProgramLoader initializing...');
            this.loadInstalledApps();
            this.loadInstalledScripts();
        },

        // Load list of installed apps from localStorage
        loadInstalledApps() {
            const installed = localStorage.getItem('webos-installed-programs');
            if (installed) {
                try {
                    const appList = JSON.parse(installed);
                    this.installedApps = new Set(appList);
                    console.log('Loaded installed apps:', Array.from(this.installedApps));
                } catch (error) {
                    console.error('Failed to parse installed apps:', error);
                    this.installedApps = new Set();
                }
            }
        },

        // Save installed apps list to localStorage
        saveInstalledApps() {
            const appList = Array.from(this.installedApps);
            localStorage.setItem('webos-installed-programs', JSON.stringify(appList));
            console.log('Saved installed apps:', appList);
        },

        // Load JavaScript files for installed apps
        loadInstalledScripts() {
            this.installedApps.forEach(appId => {
                const app = this.appCatalog.find(a => a.id === appId);
                if (app && !this.loadedScripts.has(appId)) {
                    this.loadScript(app);
                }
            });
        },

        // Load a single JavaScript app
        loadScript(app) {
            return new Promise((resolve, reject) => {
                if (this.loadedScripts.has(app.id)) {
                    resolve(`${app.id} already loaded`);
                    return;
                }

                console.log(`Loading script for ${app.id} from ${app.url}`);
                
                const script = document.createElement('script');
                script.src = app.url;
                script.async = true;
                
                script.onload = () => {
                    this.loadedScripts.add(app.id);
                    console.log(`✓ Successfully loaded: ${app.name} (${app.id})`);
                    
                    // Emit event for other components
                    if (window.EventBus) {
                        window.EventBus.emit('program-loaded', { appId: app.id, appName: app.name });
                    }
                    
                    resolve(`Loaded: ${app.name}`);
                };
                
                script.onerror = () => {
                    console.error(`✗ Failed to load: ${app.name} (${app.url})`);
                    // Remove from installed apps if script fails to load
                    this.installedApps.delete(app.id);
                    this.saveInstalledApps();
                    reject(new Error(`Failed to load: ${app.name}`));
                };
                
                document.body.appendChild(script);
            });
        },

        // Install an app (add to installed list and load script)
        installApp(appId) {
            const app = this.appCatalog.find(a => a.id === appId);
            if (!app) {
                console.error(`App not found in catalog: ${appId}`);
                return false;
            }

            if (this.installedApps.has(appId)) {
                console.log(`${appId} is already installed`);
                return true;
            }

            // Add to installed apps
            this.installedApps.add(appId);
            this.saveInstalledApps();

            // Load the script
            this.loadScript(app).then(() => {
                console.log(`${app.name} installed and loaded successfully`);
            }).catch(error => {
                console.error(`Failed to install ${app.name}:`, error);
                // Remove from installed if loading failed
                this.installedApps.delete(appId);
                this.saveInstalledApps();
            });

            return true;
        },

        // Uninstall an app (remove from installed list, but keep script loaded until refresh)
        uninstallApp(appId) {
            if (!this.installedApps.has(appId)) {
                console.log(`${appId} is not installed`);
                return false;
            }

            // Remove from installed apps
            this.installedApps.delete(appId);
            this.saveInstalledApps();

            // Unregister from AppRegistry if possible
            if (window.AppRegistry && window.AppRegistry.registeredApps.has(appId)) {
                window.AppRegistry.registeredApps.delete(appId);
                console.log(`Unregistered ${appId} from AppRegistry`);
                
                // Refresh desktop icons
                if (window.DesktopIconManager) {
                    window.DesktopIconManager.refreshIcons();
                }
                
                // Emit event
                if (window.EventBus) {
                    window.EventBus.emit('program-uninstalled', { appId });
                }
            }

            console.log(`${appId} uninstalled (script remains loaded until refresh)`);
            return true;
        },

        // Check if an app is installed
        isAppInstalled(appId) {
            return this.installedApps.has(appId);
        },

        // Get list of available apps for the store
        getAvailableApps() {
            return this.appCatalog.map(app => ({
                ...app,
                installed: this.isAppInstalled(app.id)
            }));
        },

        // Get list of installed apps
        getInstalledApps() {
            return Array.from(this.installedApps);
        },

        // Get app info by ID
        getAppInfo(appId) {
            return this.appCatalog.find(app => app.id === appId);
        },

        // Get statistics
        getStats() {
            return {
                totalAvailable: this.appCatalog.length,
                installed: this.installedApps.size,
                loaded: this.loadedScripts.size,
                available: this.appCatalog.length - this.installedApps.size
            };
        },

        // Debug method
        debug() {
            console.log('ProgramLoader Debug Info:');
            console.log('Available apps:', this.appCatalog.map(a => a.id));
            console.log('Installed apps:', Array.from(this.installedApps));
            console.log('Loaded scripts:', Array.from(this.loadedScripts));
            console.log('Stats:', this.getStats());
            return this.getStats();
        }
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Wait a bit for core system to be ready
            setTimeout(() => {
                window.ProgramLoader.init();
            }, 1000);
        });
    } else {
        setTimeout(() => {
            window.ProgramLoader.init();
        }, 1000);
    }

    // Debug helper (remove in production)
    if (typeof window !== 'undefined') {
        window.programsDebug = () => {
            return window.ProgramLoader.debug();
        };
    }

})();
