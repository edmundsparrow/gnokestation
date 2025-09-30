// clock.js - Enhanced Clock Application with Analog Display
/**
 * FILE: applications/clock.js
 * VERSION: 2.0.0
 * BUILD DATE: 2025-09-25
 *
 * PURPOSE: 
 *   Enhanced clock application featuring analog clock display on Clock tab
 *   and digital stopwatch functionality, styled with Windows 7 Aero theme.
 *
 * ARCHITECTURE:
 *   - IIFE pattern with window.ClockApp namespace
 *   - Tabbed interface with Clock (analog) and Stopwatch (digital) views
 *   - Real-time analog clock with moving hands and tick marks
 *   - Full stopwatch with start/pause/reset functionality
 *
 * LIFECYCLE:
 *   1. AppRegistry launches ClockApp.open() (single instance)
 *   2. Window created with tabbed interface
 *   3. Analog clock starts automatically with real-time updates
 *   4. User can switch between Clock and Stopwatch tabs
 *   5. Proper cleanup on window close
 *
 * FEATURES:
 *   - Beautiful analog clock with hour marks and smooth hand movement
 *   - Windows 7 Aero styling with gradients and shadows
 *   - Stopwatch with millisecond precision
 *   - Single instance enforcement
 *   - Clean tab switching interface
 *
 * CREDITS:
 *   edmundsparrow.netlify.app | whatsappme @ 09024054758 | webaplications5050@gmail.com
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
      accent: '#e74c3c',
      tabActive: 'linear-gradient(to bottom, #F7F9FB, #EAEFF7)',
      tabInactive: 'linear-gradient(to bottom, #DDE6F0, #C4D3E3)',
      btnPrimary: 'linear-gradient(to bottom, #89B6D7, #4D8BC1)',
      btnSecondary: 'linear-gradient(to bottom, #F0F5F9, #DDE6F0)'
    },

    open() {
      const c = this.colors;
      const html = `
        <div style="
          display: flex;
          flex-direction: column;
          height: 100%;
          font-family: 'Segoe UI', sans-serif;
          background: ${c.background};
          overflow: hidden;
        ">
          
          <!-- Tab Bar -->
          <div style="
            display: flex;
            background: ${c.primary};
            border-bottom: 1px solid ${c.border};
          ">
            <button class="clock-tab-btn" data-tab="clock" style="${this.getTabStyle(true)}">
              <span style="margin-right: 6px;">🕐</span> Analog Clock
            </button>
            <button class="clock-tab-btn" data-tab="stopwatch" style="${this.getTabStyle(false)}">
              <span style="margin-right: 6px;">⏱️</span> Stopwatch
            </button>
          </div>
          
          <!-- Content Area -->
          <div style="
            flex: 1;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: ${c.white};
            border-top: 1px solid ${c.white};
          ">
            
            <!-- Analog Clock Tab -->
            <div id="clock-content-clock" class="clock-content-tab" style="
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100%;
              width: 100%;
            ">
              <!-- Analog Clock Face -->
              <div class="clock-face" style="
                position: relative;
                width: 220px;
                height: 220px;
                border-radius: 50%;
                background: radial-gradient(circle, #f8f9fa 0%, #e9ecef 100%);
                border: 6px solid ${c.dark};
                box-shadow: 0 6px 20px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.8);
                margin-bottom: 20px;
              ">
                <!-- Hour Numbers -->
                <div style="position: absolute; top: 15px; left: 50%; transform: translateX(-50%); font-size: 18px; font-weight: bold; color: ${c.dark};">12</div>
                <div style="position: absolute; top: 50%; right: 15px; transform: translateY(-50%); font-size: 18px; font-weight: bold; color: ${c.dark};">3</div>
                <div style="position: absolute; bottom: 15px; left: 50%; transform: translateX(-50%); font-size: 18px; font-weight: bold; color: ${c.dark};">6</div>
                <div style="position: absolute; top: 50%; left: 15px; transform: translateY(-50%); font-size: 18px; font-weight: bold; color: ${c.dark};">9</div>

                <!-- Hour Marks -->
                <div style="position: absolute; top: 0; left: 50%; width: 2px; height: 100%; transform-origin: center;">
                  ${Array.from({length: 12}).map((_, i) => `
                    <div style="
                      position: absolute;
                      top: 0;
                      left: 0;
                      width: 100%;
                      height: 100%;
                      transform: rotate(${i * 30}deg);
                    ">
                      <div style="
                        position: absolute;
                        top: 8px;
                        left: 50%;
                        width: 4px;
                        height: 15px;
                        background: ${c.dark};
                        transform: translateX(-50%);
                        border-radius: 2px;
                      "></div>
                    </div>
                  `).join('')}
                </div>

                <!-- Minute Marks -->
                <div style="position: absolute; top: 0; left: 50%; width: 2px; height: 100%; transform-origin: center;">
                  ${Array.from({length: 60}).map((_, i) => i % 5 !== 0 ? `
                    <div style="
                      position: absolute;
                      top: 0;
                      left: 0;
                      width: 100%;
                      height: 100%;
                      transform: rotate(${i * 6}deg);
                    ">
                      <div style="
                        position: absolute;
                        top: 12px;
                        left: 50%;
                        width: 1px;
                        height: 8px;
                        background: #999;
                        transform: translateX(-50%);
                      "></div>
                    </div>
                  ` : '').join('')}
                </div>

                <!-- Clock Hands -->
                <div class="hour-hand" style="
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  width: 6px;
                  height: 50px;
                  background: linear-gradient(to bottom, ${c.dark}, #000);
                  transform-origin: 50% 100%;
                  border-radius: 3px 3px 0 0;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  transform: translate(-50%, -100%) rotate(0deg);
                  z-index: 3;
                "></div>
                <div class="minute-hand" style="
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  width: 4px;
                  height: 70px;
                  background: linear-gradient(to bottom, ${c.dark}, #000);
                  transform-origin: 50% 100%;
                  border-radius: 2px 2px 0 0;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                  transform: translate(-50%, -100%) rotate(0deg);
                  z-index: 4;
                "></div>
                <div class="second-hand" style="
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  width: 2px;
                  height: 85px;
                  background: ${c.accent};
                  transform-origin: 50% 100%;
                  border-radius: 1px 1px 0 0;
                  transform: translate(-50%, -100%) rotate(0deg);
                  z-index: 5;
                "></div>
                
                <!-- Center Dot -->
                <div style="
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  width: 12px;
                  height: 12px;
                  background: ${c.accent};
                  border: 2px solid ${c.dark};
                  border-radius: 50%;
                  transform: translate(-50%, -50%);
                  z-index: 6;
                "></div>
              </div>
              
              <!-- Digital Time Display -->
              <div id="digital-time" style="
                font-size: 24px;
                font-weight: 300;
                color: ${c.text};
                padding: 10px 20px;
                background: linear-gradient(to bottom, #f8f9fa, ${c.white});
                border: 1px solid ${c.border};
                border-radius: 5px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              ">--:--:--</div>
            </div>
            
            <!-- Stopwatch Tab -->
            <div id="clock-content-stopwatch" class="clock-content-tab" style="
              display: none;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100%;
              width: 100%;
            ">
              <div id="stopwatch-display" style="
                font-size: 48px;
                font-weight: 100;
                color: ${c.text};
                padding: 20px 40px;
                border: 1px solid ${c.border};
                border-radius: 5px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                background: linear-gradient(to bottom, #f8f9fa, ${c.white});
                margin-bottom: 30px;
              ">00:00:00.00</div>
              
              <div style="display: flex; gap: 15px;">
                <button id="stopwatch-start-btn" style="${this.getButtonStyle(c.btnPrimary)}; width: 100px;">Start</button>
                <button id="stopwatch-pause-btn" style="${this.getButtonStyle(c.btnSecondary)}; width: 100px; display: none;">Pause</button>
                <button id="stopwatch-reset-btn" style="${this.getButtonStyle(c.btnSecondary)}; width: 100px;">Reset</button>
              </div>
            </div>
          </div>
        </div>
      `;

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

        // Update analog clock hands
        const hourDeg = (hours % 12) * 30 + (minutes / 60) * 30;
        const minuteDeg = (minutes * 6) + (seconds / 60) * 6;
        const secondDeg = (seconds * 6);

        const hourHand = win.querySelector('.hour-hand');
        const minuteHand = win.querySelector('.minute-hand');
        const secondHand = win.querySelector('.second-hand');
        
        if (hourHand && minuteHand && secondHand) {
          hourHand.style.transform = `translate(-50%, -100%) rotate(${hourDeg}deg)`;
          minuteHand.style.transform = `translate(-50%, -100%) rotate(${minuteDeg}deg)`;
          secondHand.style.transform = `translate(-50%, -100%) rotate(${secondDeg}deg)`;
        }

        // Update digital time
        const digitalTime = win.querySelector('#digital-time');
        if (digitalTime) {
          digitalTime.textContent = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          });
        }
      };
      
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
      const base = `
        border: none;
        padding: 12px 20px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        color: ${isActive ? c.dark : c.text};
        transition: background 0.2s;
        border-right: 1px solid ${c.border};
        margin-left: -1px;
      `;
      const active = `
        background: ${c.tabActive};
        border-top: 3px solid ${c.blue};
        padding-top: 9px;
        box-shadow: inset 0 -1px 2px rgba(0,0,0,0.05);
      `;
      const inactive = `
        background: ${c.tabInactive};
        border-top: 3px solid transparent;
      `;
      
      return base + (isActive ? active : inactive);
    },
    
    getButtonStyle(background) {
      return `
        background: ${background};
        color: white;
        border: 1px solid #336699;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
        border-radius: 3px;
        padding: 10px 16px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      `;
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
      version: "2.0.0",
      description: "Enhanced clock application with beautiful analog clock display and digital stopwatch functionality, styled with Windows 7 Aero theme",
      type: "User App",
      features: [
        "Beautiful analog clock with hour and minute marks",
        "Real-time moving clock hands with smooth animation", 
        "Digital time display below analog clock",
        "Full-featured stopwatch with start/pause/reset",
        "Windows 7 Aero styling with gradients and shadows",
        "Single instance enforcement",
        "Tabbed interface for Clock and Stopwatch views"
      ],
      dependencies: ["WindowManager", "AppRegistry"],
      methods: [
        { name: "open", description: "Creates clock window with analog display and stopwatch tabs" },
        { name: "startClock", description: "Initializes real-time analog clock with moving hands" },
        { name: "stopwatchAction", description: "Manages stopwatch start/pause/reset functionality" },
        { name: "switchTab", description: "Handles tab switching between Clock and Stopwatch views" }
      ],
      notes: "Enhanced version featuring beautiful analog clock with real-time hand movement. Single instance app prevents multiple clock windows.",
      cudos: "edmundsparrow.netlify.app | whatsappme @ 09024054758 | webaplications5050@gmail.com",
      auto_generated: false
    });
  }
})();



