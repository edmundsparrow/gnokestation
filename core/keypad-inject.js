// keypad-inject.js - Smart Keypad Injection System with Hardware Detection
/**
 * FILE: system/keypad-inject.js
 * VERSION: 2.0.0
 * BUILD DATE: 2025-09-27
 *
 * PURPOSE:
 * Intelligently detects hardware input capabilities and automatically provides
 * on-screen keyboard functionality only when needed. Respects native input methods.
 *
 * FEATURES:
 * - Auto-detects mobile devices with native soft keyboards
 * - Detects desktop environments with physical keyboards
 * - User-configurable override settings
 * - Taskbar toggle for temporary enable/disable
 * - Per-app exclusion capability
 */

window.KeypadInject = {
    initialized: false,
    enabled: false,
    activeField: null,
    keypadWindow: null,
    injectedFields: new WeakSet(),
    rescanTimeout: null,
    
    // Configuration
    config: {
        triggerIcon: '🔢',
        buttonSize: '24px',
        animationDuration: 200,
        keypadOptions: {
            allowDecimal: true,
            allowNegative: true,
            maxDigits: 15,
            decimalPlaces: 6
        }
    },

    init() {
        if (this.initialized) return;
        
        console.log('Smart Keypad Injection System initializing...');
        
        // Determine if OSK should be enabled
        this.enabled = this.shouldEnableInjection();
        
        if (!this.enabled) {
            console.log('OSK injection disabled - hardware input detected or user preference');
            this.setupTaskbarToggle(); // Still allow manual enable
            this.initialized = true;
            return;
        }
        
        console.log('OSK injection enabled - no hardware keyboard detected');
        
        this.setupGlobalStyles();
        this.startFieldScanning();
        this.setupEventListeners();
        this.setupTaskbarToggle();
        
        this.initialized = true;
        console.log('Keypad Injection System ready');
        
        if (window.EventBus) {
            window.EventBus.emit('keypad-inject-ready', { enabled: this.enabled });
        }
    },

    // Hardware Detection Logic
    detectInputCapability() {
        // Check for mobile devices with native soft keyboards
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobile = /android|iphone|ipad|ipod|blackberry|windows phone/.test(userAgent);
        const isTablet = /ipad|android.*tablet|kindle/.test(userAgent) && !/mobile/.test(userAgent);
        
        if (isMobile || isTablet) {
            console.log('Mobile/tablet device detected - has native soft keyboard');
            return 'native-soft';
        }
        
        // Check for physical keyboard indicators
        // Note: navigator.keyboard is experimental and not widely supported
        if (window.navigator.keyboard) {
            console.log('Physical keyboard API detected');
            return 'physical';
        }
        
        // Check screen size as indicator (very large screens likely have keyboards)
        const screenArea = screen.width * screen.height;
        if (screenArea > 2000000) { // Roughly 1600x1200 or larger
            console.log('Large screen detected - likely has physical keyboard');
            return 'physical-likely';
        }
        
        // Check for touch capability (touch-only devices likely need OSK)
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (hasTouch && screenArea < 1000000) { // Touch device with smaller screen
            console.log('Small touch device detected - might need OSK');
            return 'needs-osk';
        }
        
        // Default assumption for desktop environments
        console.log('Desktop environment detected - assuming physical keyboard available');
        return 'physical-assumed';
    },

    shouldEnableInjection() {
        const capability = this.detectInputCapability();
        const userPreference = localStorage.getItem('webos-osk-preference') || 'auto';
        
        console.log('Input capability:', capability, 'User preference:', userPreference);
        
        // User overrides
        if (userPreference === 'always-on') return true;
        if (userPreference === 'always-off') return false;
        
        // Auto mode decision logic
        switch (capability) {
            case 'native-soft':
                return false; // Mobile devices have better native keyboards
            case 'physical':
            case 'physical-likely':
            case 'physical-assumed':
                return false; // Physical keyboards available
            case 'needs-osk':
                return true;  // Touch devices without good alternatives
            default:
                return false; // Conservative default
        }
    },

    setupTaskbarToggle() {
        // Add OSK toggle to taskbar
        if (!document.getElementById('taskbar')) return;
        
        const taskbar = document.getElementById('taskbar');
        const oskToggle = document.createElement('button');
        oskToggle.id = 'osk-toggle';
        oskToggle.innerHTML = this.enabled ? '⌨️' : '⌨️';
        oskToggle.title = this.enabled ? 'Disable On-Screen Keyboard' : 'Enable On-Screen Keyboard';
        oskToggle.style.cssText = `
            background: ${this.enabled ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            padding: 6px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            margin-right: 8px;
        `;
        
        oskToggle.onclick = () => this.toggleOSK();
        
        // Insert before clock
        const clock = document.getElementById('clock');
        if (clock && clock.parentNode) {
            clock.parentNode.insertBefore(oskToggle, clock);
        }
    },

    toggleOSK() {
        this.enabled = !this.enabled;
        
        // Update preference
        localStorage.setItem('webos-osk-preference', this.enabled ? 'always-on' : 'always-off');
        
        // Update UI
        const toggle = document.getElementById('osk-toggle');
        if (toggle) {
            toggle.style.background = this.enabled ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 255, 255, 0.1)';
            toggle.title = this.enabled ? 'Disable On-Screen Keyboard' : 'Enable On-Screen Keyboard';
        }
        
        if (this.enabled) {
            // Enable injection
            if (!this.initialized || !document.getElementById('keypad-inject-styles')) {
                this.setupGlobalStyles();
                this.startFieldScanning();
                this.setupEventListeners();
            }
            this.scanForNumericFields();
            this.showNotification('On-Screen Keyboard enabled');
        } else {
            // Disable injection - remove existing injections
            this.removeAllInjections();
            this.showNotification('On-Screen Keyboard disabled');
        }
        
        if (window.EventBus) {
            window.EventBus.emit('osk-toggled', { enabled: this.enabled });
        }
    },

    removeAllInjections() {
        document.querySelectorAll('.keypad-inject-container').forEach(container => {
            const input = container.querySelector('.keypad-inject-field');
            if (input) {
                container.parentNode.insertBefore(input, container);
                input.classList.remove('keypad-inject-field', 'keypad-inject-active');
                this.injectedFields.delete(input);
            }
            container.remove();
        });
    },

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(52, 152, 219, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            font-family: 'Segoe UI', sans-serif;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            opacity: 0;
            transform: translateX(100px);
            transition: all 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        });
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 2000);
    },

    setupGlobalStyles() {
        // Remove existing styles if they exist
        const existingStyles = document.getElementById('keypad-inject-styles');
        if (existingStyles) existingStyles.remove();
        
        const style = document.createElement('style');
        style.id = 'keypad-inject-styles';
        style.textContent = `
            .keypad-inject-container {
                position: relative;
                display: inline-block;
            }
            
            .keypad-inject-trigger {
                position: absolute;
                right: 4px;
                top: 50%;
                transform: translateY(-50%);
                width: ${this.config.buttonSize};
                height: ${this.config.buttonSize};
                background: linear-gradient(135deg, #3498db, #2980b9);
                border: none;
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                color: white;
                z-index: 1000;
                transition: all ${this.config.animationDuration}ms ease;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            
            .keypad-inject-trigger:hover {
                transform: translateY(-50%) scale(1.1);
                box-shadow: 0 3px 6px rgba(0,0,0,0.3);
            }
            
            .keypad-inject-trigger:active {
                transform: translateY(-50%) scale(0.95);
            }
            
            .keypad-inject-field {
                padding-right: 32px !important;
            }
            
            .keypad-inject-active {
                border-color: #3498db !important;
                box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.3) !important;
            }
        `;
        
        document.head.appendChild(style);
    },

    startFieldScanning() {
        if (!this.enabled) return;
        
        // Initial scan
        this.scanForNumericFields();
        
        // Continuous monitoring for dynamically added fields
        const observer = new MutationObserver((mutations) => {
            let needsRescan = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.tagName === 'INPUT' || node.querySelector('input')) {
                                needsRescan = true;
                            }
                        }
                    });
                }
            });
            
            if (needsRescan) {
                clearTimeout(this.rescanTimeout);
                this.rescanTimeout = setTimeout(() => {
                    this.scanForNumericFields();
                }, 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    },

    scanForNumericFields() {
        if (!this.enabled) return;
        
        const inputs = document.querySelectorAll('input, textarea');
        
        inputs.forEach(input => {
            if (this.shouldInjectKeypad(input) && !this.injectedFields.has(input)) {
                this.injectKeypad(input);
            }
        });
    },

    shouldInjectKeypad(input) {
        // Skip if not enabled
        if (!this.enabled) return false;
        
        // Skip if already processed
        if (this.injectedFields.has(input)) return false;
        
        // Skip if disabled or readonly
        if (input.disabled || input.readOnly) return false;
        
        // Skip if hidden or password fields
        if (['hidden', 'password'].includes(input.type)) return false;
        
        // Skip if explicitly excluded
        if (input.dataset.keypadExclude === 'true') return false;
        
        // Skip if inside keyboard window itself
        if (input.closest('.professional-keypad') || input.closest('[id*="keyboard"]')) return false;
        
        // Include all text input types that benefit from on-screen keyboard
        const supportedTypes = [
            'text', 'textarea', 'search', 'email', 'url', 
            'number', 'tel', 'range'
        ];
        
        // Check input type or tag name
        if (supportedTypes.includes(input.type) || input.tagName.toLowerCase() === 'textarea') {
            return true;
        }
        
        // Always include if explicitly marked
        if (input.dataset.keypad === 'true') return true;
        
        // Include contentEditable elements
        if (input.contentEditable === 'true') return true;
        
        return false;
    },

    injectKeypad(input) {
        this.injectedFields.add(input);
        
        // Wrap input in container
        const container = document.createElement('div');
        container.className = 'keypad-inject-container';
        
        // Insert container before input
        input.parentNode.insertBefore(container, input);
        container.appendChild(input);
        
        // Add padding to input for button space
        input.classList.add('keypad-inject-field');
        
        // Create trigger button
        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'keypad-inject-trigger';
        trigger.innerHTML = this.config.triggerIcon;
        trigger.title = 'Open numeric keypad';
        
        // Add trigger to container
        container.appendChild(trigger);
        
        // Setup trigger click handler
        trigger.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.openKeypadForField(input);
        };
        
        // Focus/blur handlers
        input.addEventListener('focus', () => {
            trigger.style.opacity = '1';
            input.classList.add('keypad-inject-active');
        });
        
        input.addEventListener('blur', () => {
            setTimeout(() => {
                if (document.activeElement !== trigger) {
                    trigger.style.opacity = '0.7';
                    input.classList.remove('keypad-inject-active');
                }
            }, 100);
        });
        
        // Initially semi-transparent
        trigger.style.opacity = '0.7';
        
        console.log('Keypad injected for:', input.name || input.id || input.placeholder || 'unnamed field');
    },

    openKeypadForField(input) {
        if (!window.KeyboardApp) {
            console.error('KeyboardApp not available');
            return;
        }
        
        this.activeField = input;
        
        // Parse field configuration
        const options = this.parseFieldOptions(input);
        
        // Determine input type - numeric fields get numeric mode
        const isNumeric = ['number', 'tel', 'range'].includes(input.type) || 
                         this.shouldInjectKeypad(input);
        
        if (isNumeric && window.KeyboardApp.promptForNumber) {
            this.keypadWindow = window.KeyboardApp.promptForNumber(options)
                .then(value => this.handleKeypadResult(value));
        } else if (window.KeyboardApp.promptForText) {
            this.keypadWindow = window.KeyboardApp.promptForText(options)
                .then(value => this.handleKeypadResult(value));
        } else {
            // Fallback to basic open method
            this.keypadWindow = window.KeyboardApp.open(
                (value) => this.handleKeypadResult(value),
                { ...options, inputType: isNumeric ? 'number' : 'text' }
            );
        }
    },

    parseFieldOptions(input) {
        const options = { ...this.config.keypadOptions };
        
        // Basic options
        options.title = this.generateTitle(input);
        options.initialValue = input.value;
        
        // Parse from input attributes
        if (input.min !== '') options.minValue = parseFloat(input.min);
        if (input.max !== '') options.maxValue = parseFloat(input.max);
        if (input.step !== '') {
            const step = parseFloat(input.step);
            if (step < 1) {
                options.decimalPlaces = step.toString().split('.')[1]?.length || 2;
            } else {
                options.allowDecimal = false;
            }
        }
        
        // Parse from data attributes
        if (input.dataset.keypadTitle) options.title = input.dataset.keypadTitle;
        if (input.dataset.keypadUnits) options.units = input.dataset.keypadUnits;
        if (input.dataset.keypadDecimal) options.allowDecimal = input.dataset.keypadDecimal === 'true';
        if (input.dataset.keypadNegative) options.allowNegative = input.dataset.keypadNegative === 'true';
        if (input.dataset.keypadMin) options.minValue = parseFloat(input.dataset.keypadMin);
        if (input.dataset.keypadMax) options.maxValue = parseFloat(input.dataset.keypadMax);
        if (input.dataset.keypadDigits) options.maxDigits = parseInt(input.dataset.keypadDigits);
        if (input.dataset.keypadDecimals) options.decimalPlaces = parseInt(input.dataset.keypadDecimals);
        
        // Input type specific adjustments
        if (input.type === 'tel') {
            options.allowDecimal = false;
            options.allowNegative = false;
        } else if (input.type === 'range') {
            options.allowDecimal = false;
        }
        
        return options;
    },

    generateTitle(input) {
        // Try to find a label
        const label = input.labels?.[0] || 
                     document.querySelector(`label[for="${input.id}"]`) ||
                     input.closest('label');
        
        if (label) {
            return label.textContent.replace(/[:*]/g, '').trim();
        }
        
        // Use placeholder or name
        return input.placeholder || 
               this.formatFieldName(input.name) || 
               this.formatFieldName(input.id) || 
               'Enter Value';
    },

    formatFieldName(name) {
        if (!name) return '';
        
        return name
            .replace(/[_-]/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .replace(/\b\w/g, c => c.toUpperCase())
            .trim();
    },

    handleKeypadResult(value) {
        if (!this.activeField) return;
        
        if (value !== null) {
            // Set the value
            this.activeField.value = value;
            
            // Trigger change events
            this.activeField.dispatchEvent(new Event('input', { bubbles: true }));
            this.activeField.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Custom event for advanced integrations
            this.activeField.dispatchEvent(new CustomEvent('keypad-input', {
                bubbles: true,
                detail: { value, source: 'keypad' }
            }));
        }
        
        // Clean up
        this.activeField = null;
        this.keypadWindow = null;
    },

    setupEventListeners() {
        // Listen for new windows being created
        if (window.EventBus) {
            window.EventBus.on('window-created', () => {
                setTimeout(() => {
                    this.scanForNumericFields();
                }, 200);
            });
            
            window.EventBus.on('app-launched', () => {
                setTimeout(() => {
                    this.scanForNumericFields();
                }, 300);
            });
        }
        
        // Handle dynamic form additions
        document.addEventListener('DOMContentLoaded', () => {
            this.scanForNumericFields();
        });
    },

    // Public API methods
    injectField(input, options = {}) {
        if (!this.enabled) return;
        
        if (this.shouldInjectKeypad(input)) {
            // Override options if provided
            Object.keys(options).forEach(key => {
                input.dataset[`keypad${key.charAt(0).toUpperCase() + key.slice(1)}`] = options[key];
            });
            
            this.injectKeypad(input);
        }
    },

    excludeField(input) {
        input.dataset.keypadExclude = 'true';
        
        // Remove existing injection
        if (this.injectedFields.has(input)) {
            const container = input.closest('.keypad-inject-container');
            if (container) {
                container.parentNode.insertBefore(input, container);
                container.remove();
                input.classList.remove('keypad-inject-field', 'keypad-inject-active');
            }
            this.injectedFields.delete(input);
        }
    },

    // Force enable/disable (for testing or special cases)
    forceEnable() {
        localStorage.setItem('webos-osk-preference', 'always-on');
        location.reload(); // Restart with new preference
    },

    forceDisable() {
        localStorage.setItem('webos-osk-preference', 'always-off');
        location.reload(); // Restart with new preference
    },

    // Get current status
    getStatus() {
        return {
            initialized: this.initialized,
            enabled: this.enabled,
            inputCapability: this.detectInputCapability(),
            userPreference: localStorage.getItem('webos-osk-preference') || 'auto',
            injectedFieldsCount: this.injectedFields ? this.injectedFields.size : 0
        };
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.KeypadInject.init();
        }, 500);
    });
} else {
    setTimeout(() => {
        window.KeypadInject.init();
    }, 500);
}

// Debug helper (remove in production)
window.oskDebug = () => {
    console.log('OSK Status:', window.KeypadInject.getStatus());
};
