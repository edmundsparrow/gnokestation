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

/**
 * BROWSER-CHECK.JS - Inline Version for index.html
 * Gnoke Station Browser Compatibility Guard
 * VERSION: 1.0.0
 * 
 * USAGE: Place this INLINE in <head> BEFORE any other scripts
 * This prevents boot sequence from running on incompatible browsers
 */

(function() {
    'use strict';
    
    // Feature detection for minimum requirements
    var checks = {
        promise: typeof Promise !== 'undefined',
        fetch: typeof fetch !== 'undefined',
        arrayFind: Array.prototype.find !== undefined,
        arrayIncludes: Array.prototype.includes !== undefined,
        objectAssign: typeof Object.assign !== 'undefined',
        symbol: typeof Symbol !== 'undefined'
    };

    var allChecksPassed = checks.promise && checks.fetch && checks.arrayFind && 
                          checks.arrayIncludes && checks.objectAssign && checks.symbol;

    // ES6 syntax check
    var hasES6 = true;
    try {
        new Function('const arrow = () => {};')();
    } catch (e) {
        hasES6 = false;
    }

    // Browser detection
    var ua = navigator.userAgent;
    var browserInfo = {
        name: 'Unknown',
        version: 0,
        os: ''
    };

    // Detect OS
    if (ua.indexOf('Windows Phone') > -1) {
        browserInfo.os = 'Windows Phone';
        browserInfo.name = 'IE Mobile';
    } else if (ua.indexOf('Android') > -1) {
        browserInfo.os = 'Android';
    } else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) {
        browserInfo.os = 'iOS';
    } else if (ua.indexOf('Windows') > -1) {
        browserInfo.os = 'Windows';
    } else if (ua.indexOf('Mac') > -1) {
        browserInfo.os = 'macOS';
    } else if (ua.indexOf('Linux') > -1) {
        browserInfo.os = 'Linux';
    }

    // Detect browser
    if (ua.indexOf('Edg/') > -1 || ua.indexOf('Edge/') > -1) {
        browserInfo.name = 'Edge';
        var edgeMatch = ua.match(/(?:Edg|Edge)\/(\d+)/);
        browserInfo.version = edgeMatch ? parseInt(edgeMatch[1]) : 0;
    } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
        browserInfo.name = 'Chrome';
        var chromeMatch = ua.match(/Chrome\/(\d+)/);
        browserInfo.version = chromeMatch ? parseInt(chromeMatch[1]) : 0;
    } else if (ua.indexOf('Firefox') > -1) {
        browserInfo.name = 'Firefox';
        var ffMatch = ua.match(/Firefox\/(\d+)/);
        browserInfo.version = ffMatch ? parseInt(ffMatch[1]) : 0;
    } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
        browserInfo.name = 'Safari';
        var safariMatch = ua.match(/Version\/(\d+)/);
        browserInfo.version = safariMatch ? parseInt(safariMatch[1]) : 0;
    } else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1) {
        browserInfo.name = 'Internet Explorer';
        var ieMatch = ua.match(/(?:MSIE |rv:)(\d+)/);
        browserInfo.version = ieMatch ? parseInt(ieMatch[1]) : 0;
    }

    // Check minimum versions
    var minVersions = {
        'Chrome': 49,
        'Firefox': 44,
        'Safari': 10,
        'Edge': 14
    };

    var versionSupported = true;
    if (minVersions[browserInfo.name]) {
        versionSupported = browserInfo.version >= minVersions[browserInfo.name];
    } else if (browserInfo.name === 'Internet Explorer' || 
               browserInfo.name === 'IE Mobile' || 
               browserInfo.os === 'Windows Phone') {
        versionSupported = false;
    }

    // Final decision
    var isCompatible = allChecksPassed && hasES6 && versionSupported;

    if (!isCompatible) {
        // Block further execution
        document.addEventListener('DOMContentLoaded', function(e) {
            e.stopImmediatePropagation();
        }, true);

        // Show upgrade message ASAP
        showUpgradeScreen();
    }

    function showUpgradeScreen() {
        // Remove any existing content
        var removeExisting = function() {
            if (document.body) {
                document.body.innerHTML = '';
                document.body.style.cssText = 'margin:0;padding:0;overflow:hidden;';
            }
        };

        var createScreen = function() {
            if (!document.body) {
                setTimeout(createScreen, 10);
                return;
            }

            removeExisting();

            var container = document.createElement('div');
            container.style.cssText = 
                'position:fixed;top:0;left:0;right:0;bottom:0;' +
                'background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);' +
                'color:#fff;font-family:Arial,Helvetica,sans-serif;' +
                'display:flex;align-items:center;justify-content:center;' +
                'padding:20px;box-sizing:border-box;';

            var card = document.createElement('div');
            card.style.cssText = 
                'max-width:600px;width:100%;padding:40px;text-align:center;' +
                'background:#16213e;border-radius:12px;' +
                'box-shadow:0 20px 60px rgba(0,0,0,0.5);';

            card.innerHTML = 
                '<div style="font-size:72px;margin-bottom:20px;">⚠️</div>' +
                '<h1 style="margin:0 0 15px 0;font-size:32px;color:#e94560;font-weight:bold;">Browser Not Supported</h1>' +
                '<p style="font-size:18px;line-height:1.6;margin-bottom:25px;color:#ddd;">' +
                'Gnoke Station requires a modern browser (2016+) to function properly.' +
                '</p>' +
                
                '<div style="background:#0f3460;padding:20px;border-radius:8px;margin-bottom:25px;text-align:left;">' +
                '<h3 style="margin:0 0 12px 0;font-size:16px;color:#67e8f9;">Your Browser:</h3>' +
                '<p style="margin:0 0 15px 0;color:#ccc;font-size:14px;">' +
                browserInfo.name + ' ' + (browserInfo.version || 'Unknown') + 
                (browserInfo.os ? ' on ' + browserInfo.os : '') +
                '</p>' +
                '<h3 style="margin:15px 0 12px 0;font-size:16px;color:#67e8f9;">Missing Features:</h3>' +
                '<ul style="list-style:none;padding:0;margin:0;font-size:13px;color:#ccc;">' +
                (!checks.promise ? '<li style="padding:5px 0;">✗ JavaScript Promises</li>' : '') +
                (!checks.fetch ? '<li style="padding:5px 0;">✗ Fetch API</li>' : '') +
                (!hasES6 ? '<li style="padding:5px 0;">✗ ES6 Syntax Support</li>' : '') +
                (!versionSupported ? '<li style="padding:5px 0;">✗ Browser Version Too Old</li>' : '') +
                '</ul>' +
                '</div>' +

                '<div style="background:#0f3460;padding:20px;border-radius:8px;margin-bottom:30px;">' +
                '<h3 style="margin:0 0 15px 0;font-size:18px;color:#67e8f9;">Minimum Requirements</h3>' +
                '<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;font-size:13px;">' +
                '<div style="flex:1;min-width:120px;background:#1a1a2e;padding:10px;border-radius:6px;">' +
                '<strong style="color:#67e8f9;">Chrome</strong><br>v49+ (2016)' +
                '</div>' +
                '<div style="flex:1;min-width:120px;background:#1a1a2e;padding:10px;border-radius:6px;">' +
                '<strong style="color:#67e8f9;">Firefox</strong><br>v44+ (2016)' +
                '</div>' +
                '<div style="flex:1;min-width:120px;background:#1a1a2e;padding:10px;border-radius:6px;">' +
                '<strong style="color:#67e8f9;">Safari</strong><br>v10+ (2016)' +
                '</div>' +
                '<div style="flex:1;min-width:120px;background:#1a1a2e;padding:10px;border-radius:6px;">' +
                '<strong style="color:#67e8f9;">Edge</strong><br>v14+ (2016)' +
                '</div>' +
                '</div>' +
                '</div>' +

                '<h3 style="margin:0 0 15px 0;font-size:18px;color:#67e8f9;">Get a Modern Browser</h3>' +
                '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:25px;">' +
                '<a href="https://www.google.com/chrome/" target="_blank" style="' +
                'display:inline-block;padding:12px 20px;background:#4285f4;color:#fff;' +
                'text-decoration:none;border-radius:6px;font-weight:bold;font-size:14px;' +
                'transition:background 0.3s;">Chrome</a>' +
                '<a href="https://www.mozilla.org/firefox/" target="_blank" style="' +
                'display:inline-block;padding:12px 20px;background:#ff7139;color:#fff;' +
                'text-decoration:none;border-radius:6px;font-weight:bold;font-size:14px;' +
                'transition:background 0.3s;">Firefox</a>' +
                '<a href="https://www.microsoft.com/edge/" target="_blank" style="' +
                'display:inline-block;padding:12px 20px;background:#0078d4;color:#fff;' +
                'text-decoration:none;border-radius:6px;font-weight:bold;font-size:14px;' +
                'transition:background 0.3s;">Edge</a>' +
                '</div>' +

                '<div style="padding-top:20px;border-top:1px solid #0f3460;">' +
                '<p style="font-size:12px;color:#888;margin:0 0 10px 0;line-height:1.5;">' +
                '<strong>For Embedded/Industrial Systems:</strong><br>' +
                'Use Chromium-based browsers or update device firmware to support modern web standards.' +
                '</p>' +
                '<p style="font-size:11px;color:#666;margin:0;">' +
                'Gnoke Station v2.0 - Ultra-Lightweight Industrial Interface Platform<br>' +
                '<a href="https://github.com/edmundsparrow/gnokestation" target="_blank" style="color:#67e8f9;text-decoration:none;">Documentation</a> | ' +
                '<a href="mailto:ekongmikpe@gmail.com" style="color:#67e8f9;text-decoration:none;">Support</a>' +
                '</p>' +
                '</div>';

            container.appendChild(card);
            document.body.appendChild(container);

            // Prevent any other scripts from running
            var scripts = document.querySelectorAll('script');
            for (var i = 0; i < scripts.length; i++) {
                if (scripts[i].src || scripts[i].textContent.indexOf('browser-check') === -1) {
                    scripts[i].type = 'text/disabled';
                    scripts[i].remove();
                }
            }
        };

        // Try immediate, or wait for body
        if (document.body) {
            createScreen();
        } else {
            if (document.addEventListener) {
                document.addEventListener('DOMContentLoaded', createScreen);
            } else {
                window.onload = createScreen;
            }
        }
    }

    // Log for debugging
    if (window.console && console.log) {
        console.log('Gnoke Browser Check:', {
            browser: browserInfo.name + ' ' + browserInfo.version,
            os: browserInfo.os,
            compatible: isCompatible,
            checks: checks,
            es6: hasES6
        });
    }
})();

