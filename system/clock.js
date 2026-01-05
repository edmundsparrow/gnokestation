/**
FILE: system/clock.js
VERSION: 2.1.0
BUILD DATE: 2025-10-10
PURPOSE:
Enhanced clock application featuring SVG analog clock display on Clock tab
and digital stopwatch functionality, styled with Windows 7 Aero theme.
ARCHITECTURE:
IIFE pattern with window.ClockApp namespace
Tabbed interface with Clock (SVG analog) and Stopwatch (digital) views
Real-time SVG analog clock with smooth-moving hands
Full stopwatch with start/pause/reset functionality
LIFECYCLE:
AppRegistry launches ClockApp.open() (single instance)
Window created with tabbed interface
Analog clock starts automatically with real-time updates
User can switch between Clock and Stopwatch tabs
Proper cleanup on window close
FEATURES:
Beautiful, SVG-based analog clock with high-fidelity marks and smooth hand movement (like compass)
Windows 7 Aero styling with gradients and shadows
Stopwatch with millisecond precision
Single instance enforcement
Clean tab switching interface
CREDITS:
edmundsparrow.netlify.app | whatsappme @ 09024054758 | webaplications5050@gmail.com
*/

(function() {
window.ClockApp = {
// Clock and stopwatch intervals
clockInterval: null,
stopwatchInterval: null,
stopwatchStart: 0,
stopwatchElapsed: 0,
stopwatchRunning: false,

// Windows 7 Aero Colors
colors: { 
    background: '#DEE8F5', 
    dark: '#1F4765', 
    text: '#333333', 
    border: '#C4D3E3', 
    primary: '#E4EAF2', 
    white: '#FFFFFF', 
    blue: '#4D8BC1', 
    accent: '#e74c3c', // Red accent for second hand and center dot
    tabActive: 'linear-gradient(to bottom, #F7F9FB, #EAEFF7)', 
    tabInactive: 'linear-gradient(to bottom, #DDE6F0, #C4D3E3)', 
    btnPrimary: 'linear-gradient(to bottom, #89B6D7, #4D8BC1)', 
    btnSecondary: 'linear-gradient(to bottom, #F0F5F9, #DDE6F0)' 
}, 

open() { 
    const c = this.colors; 
    // SVG Clock Markup - using a 260x260 viewBox centered at 130,130 for the face, similar to your compass
    const clockSVG = `
        <svg viewBox="0 0 260 260" class="clock-face-svg" style="
            width: 220px; 
            height: 220px; 
            border-radius: 50%; 
            background: #fff; /* SVG background doesn't need to be in the parent div */
            border: 6px solid ${c.dark}; 
            box-shadow: 0 6px 20px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.8);
            overflow: visible; /* For shadows/glows if added later */
        ">
            <defs>
                <radialGradient id="clock-grad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#fff"/>
                    <stop offset="100%" stop-color="#f0f0f0"/>
                </radialGradient>
                <filter id="hand-shadow">
                    <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="rgba(0,0,0,0.3)"/>
                </filter>
            </defs>

            <circle cx="130" cy="130" r="110" fill="url(#clock-grad)"/>

            <g transform="translate(130,130)" stroke-linecap="round">
                ${Array.from({length: 60}).map((_, i) => {
                    const isHour = i % 5 === 0;
                    const len = isHour ? 12 : 6;
                    const thick = isHour ? 2 : 1;
                    const color = isHour ? c.dark : '#999';
                    const y1 = isHour ? -108 : -106;
                    const y2 = y1 + len;
                    return `
                        <line x1="0" y1="${y1}" x2="0" y2="${y2}" 
                            stroke="${color}" stroke-width="${thick}" 
                            transform="rotate(${i * 6})"/>
                    `;
                }).join('')}
            </g>

            ${Array.from({length: 12}).map((_, i) => {
                const hour = i + 1;
                // Polar coordinates: radius 90px, angle in radians
                const angle = (hour * 30 - 90) * (Math.PI / 180); 
                const x = 130 + 90 * Math.cos(angle);
                const y = 130 + 90 * Math.sin(angle) + 5; // +5 to vertically center
                return `
                    <text x="${x}" y="${y}" text-anchor="middle" font-size="16" font-weight="600" fill="${c.dark}" style="font-family: 'Segoe UI', sans-serif;">${hour}</text>
                `;
            }).join('')}

            <g transform="translate(130,130)">
                <path class="hour-hand" d="M -4 -45 L 4 -45 L 3 10 L -3 10 Z" 
                    fill="${c.dark}" filter="url(#hand-shadow)" 
                    transform="rotate(0)"/>
                <path class="minute-hand" d="M -3 -75 L 3 -75 L 2 10 L -2 10 Z" 
                    fill="${c.dark}" filter="url(#hand-shadow)" 
                    transform="rotate(0)"/>
                <line class="second-hand" x1="0" y1="15" x2="0" y2="-90" 
                    stroke="${c.accent}" stroke-width="1.5" 
                    stroke-linecap="round" 
                    transform="rotate(0)"/>

                <circle cx="0" cy="0" r="6" fill="${c.accent}" stroke="${c.dark}" stroke-width="1.5"/>
            </g>
        </svg>
    `;

    const html = ` 
        <div style=" display: flex; flex-direction: column; height: 100%; font-family: 'Segoe UI', sans-serif; background: ${c.background}; overflow: hidden; "> 
            <div style=" display: flex; background: ${c.primary}; border-bottom: 1px solid ${c.border}; "> 
                <button class="clock-tab-btn" data-tab="clock" style="${this.getTabStyle(true)}"> 
                    <span style="margin-right: 6px;">🕐</span> Analog Clock 
                </button> 
                <button class="clock-tab-btn" data-tab="stopwatch" style="${this.getTabStyle(false)}"> 
                    <span style="margin-right: 6px;">⏱️</span> Stopwatch 
                </button> 
            </div> 
            <div style=" flex: 1; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: ${c.white}; border-top: 1px solid ${c.white}; "> 
                <div id="clock-content-clock" class="clock-content-tab" style=" display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; width: 100%; "> 
                    <div style="margin-bottom: 20px;">
                        ${clockSVG}
                    </div>
                    <div id="digital-time" style=" font-size: 24px; font-weight: 300; color: ${c.text}; padding: 10px 20px; background: linear-gradient(to bottom, #f8f9fa, ${c.white}); border: 1px solid ${c.border}; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); ">--:--:--</div> 
                </div> 

                <div id="clock-content-stopwatch" class="clock-content-tab" style=" display: none; flex-direction: column; align-items: center; justify-content: center; height: 100%; width: 100%; "> 
                    <div id="stopwatch-display" style=" font-size: 48px; font-weight: 100; color: ${c.text}; padding: 20px 40px; border: 1px solid ${c.border}; border-radius: 5px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); background: linear-gradient(to bottom, #f8f9fa, ${c.white}); margin-bottom: 30px; ">00:00:00.00</div> 
                    <div style="display: flex; gap: 15px;"> 
                        <button id="stopwatch-start-btn" style="${this.getButtonStyle(c.btnPrimary)}; width: 100px;">Start</button> 
                        <button id="stopwatch-pause-btn" style="${this.getButtonStyle(c.btnSecondary)}; width: 100px; display: none;">Pause</button> 
                        <button id="stopwatch-reset-btn" style="${this.getButtonStyle(c.btnSecondary)}; width: 100px;">Reset</button> 
                    </div> 
                </div> 
            </div> 
        </div> `; 
    
    const win = WindowManager.createWindow('Clock', html, 340, 420); 
    this.setupClock(win); 
    return win; 
}, 

setupClock(win) { 
    // Tab switching 
    win.querySelectorAll('.clock-tab-btn').forEach(btn => { 
        btn.addEventListener('click', () => this.switchTab(win, btn.dataset.tab)); 
    }); 
    // Stopwatch controls 
    win.querySelector('#stopwatch-start-btn').addEventListener('click', () => this.stopwatchAction(win, 'start')); 
    win.querySelector('#stopwatch-pause-btn').addEventListener('click', () => this.stopwatchAction(win, 'pause')); 
    win.querySelector('#stopwatch-reset-btn').addEventListener('click', () => this.stopwatchAction(win, 'reset')); 
    // Start the clock 
    this.startClock(win); 
    // Cleanup on window close 
    win.addEventListener('windowClosed', () => this.cleanup()); 
}, 

cleanup() { 
    if (this.clockInterval) clearInterval(this.clockInterval); 
    if (this.stopwatchInterval) clearInterval(this.stopwatchInterval); 
    this.stopwatchRunning = false; 
    this.stopwatchElapsed = 0; 
}, 

startClock(win) { 
    const updateClock = () => { 
        const now = new Date(); 
        const hours = now.getHours(); 
        const minutes = now.getMinutes(); 
        const seconds = now.getSeconds(); 
        
        // Calculate degrees for smooth movement
        // Hour: 30deg/hr + 0.5deg/min
        const hourDeg = (hours % 12) * 30 + (minutes / 60) * 30 + (seconds / 3600) * 30;
        // Minute: 6deg/min + 0.1deg/sec
        const minuteDeg = (minutes * 6) + (seconds / 60) * 6;
        // Second: 6deg/sec
        const secondDeg = seconds * 6;

        // Get SVG elements
        const hourHand = win.querySelector('.hour-hand'); 
        const minuteHand = win.querySelector('.minute-hand'); 
        const secondHand = win.querySelector('.second-hand'); 
        
        if (hourHand && minuteHand && secondHand) { 
            // SVG transform is relative to its group (which is translated to the center 130,130)
            hourHand.setAttribute('transform', `rotate(${hourDeg})`);
            minuteHand.setAttribute('transform', `rotate(${minuteDeg})`);
            secondHand.setAttribute('transform', `rotate(${secondDeg})`);
        } 

        // Update digital time 
        const digitalTime = win.querySelector('#digital-time'); 
        if (digitalTime) { 
            digitalTime.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); 
        } 
    }; 
    
    // Update every 100ms for smoother second hand illusion, though time calculation is only to the second
    updateClock(); 
    this.clockInterval = setInterval(updateClock, 1000); 
}, 

stopwatchAction(win, action) { 
    const display = win.querySelector('#stopwatch-display'); 
    const startBtn = win.querySelector('#stopwatch-start-btn'); 
    const pauseBtn = win.querySelector('#stopwatch-pause-btn'); 
    
    if (action === 'start') { 
        if (!this.stopwatchRunning) { 
            this.stopwatchRunning = true; 
            this.stopwatchStart = Date.now() - this.stopwatchElapsed; 
            this.stopwatchInterval = setInterval(() => { 
                this.stopwatchElapsed = Date.now() - this.stopwatchStart; 
                display.textContent = this.formatStopwatchTime(this.stopwatchElapsed); 
            }, 10); 
            startBtn.style.display = 'none'; 
            pauseBtn.style.display = 'inline-block'; 
        } 
    } else if (action === 'pause') { 
        if (this.stopwatchRunning) { 
            clearInterval(this.stopwatchInterval); 
            this.stopwatchRunning = false; 
            startBtn.textContent = 'Resume'; 
            startBtn.style.display = 'inline-block'; 
            pauseBtn.style.display = 'none'; 
        } 
    } else if (action === 'reset') { 
        clearInterval(this.stopwatchInterval); 
        this.stopwatchRunning = false; 
        this.stopwatchElapsed = 0; 
        display.textContent = '00:00:00.00'; 
        startBtn.textContent = 'Start'; 
        startBtn.style.display = 'inline-block'; 
        pauseBtn.style.display = 'none'; 
    } 
}, 

formatStopwatchTime(ms) { 
    const totalSeconds = Math.floor(ms / 1000); 
    const milliseconds = Math.floor((ms % 1000) / 10); 
    const seconds = totalSeconds % 60; 
    const minutes = Math.floor(totalSeconds / 60) % 60; 
    const hours = Math.floor(totalSeconds / 3600); 
    const pad = (n, length = 2) => String(n).padStart(length, '0'); 
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(milliseconds)}`; 
}, 

getTabStyle(isActive) { 
    const c = this.colors; 
    const base = ` border: none; padding: 12px 20px; font-size: 14px; font-weight: 600; cursor: pointer; color: ${isActive ? c.dark : c.text}; transition: background 0.2s; border-right: 1px solid ${c.border}; margin-left: -1px; `; 
    const active = ` background: ${c.tabActive}; border-top: 3px solid ${c.blue}; padding-top: 9px; box-shadow: inset 0 -1px 2px rgba(0,0,0,0.05); `; 
    const inactive = ` background: ${c.tabInactive}; border-top: 3px solid transparent; `; 
    return base + (isActive ? active : inactive); 
}, 

getButtonStyle(background) { 
    return ` background: ${background}; color: white; border: 1px solid #336699; font-size: 16px; font-weight: bold; cursor: pointer; transition: all 0.2s; border-radius: 3px; padding: 10px 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); `; 
}, 

switchTab(win, targetTab) { 
    // Update tab buttons 
    win.querySelectorAll('.clock-tab-btn').forEach(btn => { 
        btn.style.cssText = this.getTabStyle(btn.dataset.tab === targetTab); 
    }); 
    // Show/hide content 
    win.querySelectorAll('.clock-content-tab').forEach(content => { 
        content.style.display = content.id === `clock-content-${targetTab}` ? 'flex' : 'none'; 
    }); 
    // Manage clock interval based on active tab 
    if (targetTab === 'clock') { 
        if (!this.clockInterval) this.startClock(win); 
    } else { 
        if (this.clockInterval) { 
            clearInterval(this.clockInterval); 
            this.clockInterval = null; 
        } 
    } 
} 

};

// Register app with single instance
if (typeof AppRegistry !== 'undefined') {
    AppRegistry.registerApp({
        id: 'clock',
        name: 'Clock',
icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><circle cx='24' cy='24' r='20' fill='%23f8f9fa' stroke='%231F4765' stroke-width='3'/><circle cx='24' cy='24' r='2' fill='%23e74c3c'/><path d='M24 8v4M24 36v4M40 24h-4M12 24H8' stroke='%231F4765' stroke-width='2' stroke-linecap='round'/><line x1='24' y1='24' x2='24' y2='14' stroke='%231F4765' stroke-width='4' stroke-linecap='round'/><line x1='24' y1='24' x2='32' y2='28' stroke='%231F4765' stroke-width='3' stroke-linecap='round'/><line x1='24' y1='24' x2='28' y2='16' stroke='%23e74c3c' stroke-width='2' stroke-linecap='round'/></svg>",
        handler: () => window.ClockApp.open(),
        singleInstance: true
    });
}

// Register documentation
if (window.Docs && typeof window.Docs.registerDocumentation === 'function') {
    window.Docs.registerDocumentation('clock', {
        name: "Clock",
        version: "2.1.0",
        description: "Enhanced clock application with beautiful SVG analog clock display and digital stopwatch functionality, styled with Windows 7 Aero theme",
        type: "User App",
        features: [
            "High-fidelity SVG analog clock with smooth-moving hands",
            "Real-time moving clock hands with angular accuracy",
            "Digital time display below analog clock",
            "Full-featured stopwatch with start/pause/reset",
            "Windows 7 Aero styling with gradients and shadows",
            "Single instance enforcement",
            "Tabbed interface for Clock and Stopwatch views"
        ],
        dependencies: ["WindowManager", "AppRegistry"],
        methods: [
            { name: "open", description: "Creates clock window with analog display and stopwatch tabs" },
            { name: "startClock", description: "Initializes real-time SVG analog clock with moving hands" },
            { name: "stopwatchAction", description: "Manages stopwatch start/pause/reset functionality" },
            { name: "switchTab", description: "Handles tab switching between Clock and Stopwatch views" }
        ],
        notes: "Updated version featuring a high-fidelity analog clock using SVG, mirroring the aesthetic of the compass component.",
        cudos: "edmundsparrow.netlify.app | whatsappme @ 09024054758 | webaplications5050@gmail.com",
        auto_generated: false
    });
}
})();
