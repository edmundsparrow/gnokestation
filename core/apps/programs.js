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

// programs.js - Third-party App Manager for Gnokestation
(function() {
    window.ProgramLoader = {
        // App catalog - these are the available apps that can be installed
        appCatalog: [
 /*
     
     {
  id: 'geo-compass',
  name: 'Geo Compass',
  size: '22KB',
  category: 'oob',
  url: 'system/store/geo-compass.js',
  description: 'Digital compass for precise directional navigation and orientation'
},
 
 */
       {
    id: 'vibrationmon',
    name: 'Vibration Monitor HMI',
    size: '42KB',
    category: 'hal',
    url: 'system/store/vibration-monitor.js',
    description: 'Touch interface for real-time vibration monitoring and machine diagnostics with waveform display and alert system'
},
{
  id: 'psmmonitor',
  name: 'PSM Monitor HMI',
  size: '22KB',
  category: 'hal',
  url: 'system/store/psm-monitor.js',
  description: 'Touch interface for real-time Process Safety Management monitoring and diagnostics with alert system'
},
       {
   id: 'car-hmi',
            name: 'Car HMI',
            size: '32KB',
            category: 'hal',
            url: 'system/store/car-hmi.js',
            description: 'Touch interface for vehicle diagnostics and dashboard controls'
         },
   {
    id: 'powerdb',
    name: 'Power Distribution Board HMI',
    size: '48KB',
    category: 'hal',
    url: 'system/store/powerdb.js',
    description: 'Interactive touch interface for monitoring and controlling power distribution with breakers, meters, and emergency stop'
},
       {
            id: 'keypad',
            name: 'Keypad',
             size: '16KB',
             category: 'oob',
             url: 'system/keypad.js',
             description: 'On screen keyboard for basic inouts'
           },
        {
            id: 'solar-hmi',
            name: 'Solar HMI',
            size: '28KB',
            category: 'hal',
            url: 'system/store/solar-hmi.js',
            description: 'Touch interface for monitoring and controlling solar power systems'
         },
      {
            id: 'mini-routers',
            name: 'Mini Routers',
             size: '14KB',
             category: 'network',
             url: 'system/store/mini-routers.js',
             description: 'Multi-vendor network device controller with vendor-specific API configurations'
           },
        {
            id: 'cisco-router',
            name: 'Cisco Router',
             size: '13KB',
             category: 'network-controller',
             url: 'system/store/cisco-router.js',
             description: 'Cisco router network controller'
    },
  {
            id: 'irrigation',
            name: 'Irrigation',
             size: '13KB',
             category: 'Marine',
             url: 'system/store/irrigation.js',
             description: 'Agro irrigation controller'
    },
        {
             id: 'fleet-tracker',
             name: 'Fleet Tracker',
             size: '45KB',
             category: 'hal',
             url: 'system/store/fleet-tracker.js',
             description: 'Professional GPS fleet tracking dashboard with real-time monitoring, trip history, and alerts (Demo UI)'
         },
              
        { 
            id: 'fleet-monitor',
            name: 'Fleet Monitor',
            size: '45KB', // Added standard property
            category: 'Business', // Added standard property
            url: 'system/store/fleet-monitor.js', // Added essential property
            author: 'Gnokestation',
            description: 'Real-time fleet tracking and monitoring'
        },
        {
            id: 'rssnews',
            name: 'RSS FEEDS',
            size: '18.1KB',
            category: 'News',
            url: 'system/store/rssnews.js',
            description: 'Multi-source RSS news reader with regional feeds'
        },            
        {
            id: 'hue', // Added ID for system use
            name: 'Hue Controller',
            size: '30KB', // Estimated size
            category: 'IoT', // Categorized as IoT
            url: 'system/store/hue.js', // App script path
            author: 'edmundsparrow',
            description: 'Control Philips Hue lights on your network'
        },
        {
    id: 'crypto',
    name: 'Crypto Dashboard',
    size: '26KB',
    category: 'Finance',
    url: 'system/store/crypto.js',
    description: 'Track cryptocurrency prices, market trends in real time.'
},
        {
                id: 'wled',
                name: 'WLED Controller',
                size: '33KB',
                category: 'IoT',
                url: 'system/store/wled.js',
                description: 'Control WLED-compatible LED strips with real-time effects'
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
            id: 'gnoke-tracker',
            name: 'Gnoke Tracker',
            size: '24KB',
            category: 'monitoring',
            url: 'system/store/gnoke-tracker.js',
            description: 'Real-time asset and fleet tracking dashboard'
        },
            {
            id: 'gnoke-pad',
            name: 'GnokePad',
            size: '18KB',
            category: 'productivity',
            url: 'system/store/gnokepad.js',
            description: 'Lightweight digital notebook for quick notes and memos'
        },
        {
            id: 'gnoke-viewer',
            name: 'Gnoke Viewer',
            size: '20KB',
            category: 'oob',
            url: 'system/store/gnoke-viewer.js',
            description: 'Lightweight monitoring viewer for assets and devices'
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
        },
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
