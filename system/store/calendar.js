/**
 * FILE: system/store/calendar.js
 * VERSION: 1.0.0
 * BUILD DATE: 2025-09-24
 *
 * PURPOSE:
 * Clean, sharp calendar application with Windows Aero theme matching.
 * Provides month navigation and date selection with today highlighting and 
 * crisp design.
 *
 * ARCHITECTURE:
 * - IIFE pattern with window.CalendarApp namespace
 * - Month-based navigation with proper date calculations
 * - CSS-in-JS styling for consistent theme integration (Aero focus)
 * - Current date highlighting and selection states
 *
 * LIFECYCLE:
 * 1. AppRegistry launches CalendarApp.open()
 * 2. Window created with calendar grid and navigation
 * 3. Month renders with proper date layout and highlighting
 * 4. User can navigate months and select dates
 * 5. Today button provides quick navigation to current date
 *
 * FEATURES:
 * - Crisp Aero gradient theme matching
 * - Month navigation with arrow controls
 * - Today date highlighting with bold border
 * - Current date display at bottom
 * - Responsive calendar grid layout
 * - Sunday column is red.
 *
 * CUDOS:
 * edmundsparrow.netlify.app | whatsappme @ 09024054758 | webaplications5050@gmail.com
 */

(function() {
  window.CalendarApp = {
    currentDate: new Date(),
    selectedDate: new Date(),
    
    // Define Aero-like fallback colors for sharp, high-contrast look
    AeroColors: {
        bg1: '#F0F5F9',        // Lightest window background
        bg2: '#E1E9F3',
        bg3: '#D2E0EE',
        headerBg1: '#E8F2FF',  // Header top
        headerBg2: '#D1E7FD',  // Header bottom
        border: '#A5BBD9',     // Main Border
        textDark: '#1F4765',   // Dark Blue Text/Accent
        todayBg1: '#6aa3de',   // Today Highlight Top (Lighter Aero Blue)
        todayBg2: '#2b5797',   // Today Highlight Bottom (Darker Aero Blue)
        // New color constants
        red: '#D92323',        // Standard red for Sunday
        black: '#000000',      // Standard black for other text/headers
    },
    
    open() {
      const c = this.AeroColors;
        
      // Ensure theme variables are checked, falling back to Aero
      const primary1 = getComputedStyle(document.documentElement).getPropertyValue('--theme-primary-1').trim() || c.todayBg1;
      const primary2 = getComputedStyle(document.documentElement).getPropertyValue('--theme-primary-2').trim() || c.todayBg2;
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--theme-accent').trim() || c.textDark;

      const calendarHTML = `
        <div style="
          height: 100%;
          /* Light Aero Background Gradient */
          background: linear-gradient(180deg, ${c.bg1} 0%, ${c.bg2} 50%, ${c.bg3} 100%);
          color: #333;
          font-family: 'Segoe UI', sans-serif;
          display: flex;
          flex-direction: column;
          border: 1px solid ${c.border};
        ">
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 20px;
            /* Header Light Gradient */
            background: linear-gradient(180deg, ${c.headerBg1} 0%, ${c.headerBg2} 100%);
            border-bottom: 1px solid ${c.border};
          ">
            <button id="prev-month" style="
              background: linear-gradient(180deg, #f0f7ff 0%, #d8ebf8 100%);
              border: 1px solid ${c.border};
              color: ${accent};
              padding: 6px 10px;
              border-radius: 3px;
              cursor: pointer;
              font-size: 16px;
              font-weight: bold;
              box-shadow: 0 1px 1px rgba(0,0,0,0.1);
              transition: background 0.1s;
            " onmouseover="this.style.background='linear-gradient(180deg, #fff 0%, #d1e1f1 100%)'" onmouseout="this.style.background='linear-gradient(180deg, #f0f7ff 0%, #d8ebf8 100%)'">‹</button>
            
            <h2 id="month-year" style="
              margin: 0;
              font-size: 18px;
              font-weight: 700;
              color: ${accent};
              text-shadow: 0 1px 0 rgba(255,255,255,0.5);
            ">September 2025</h2>
            
            <button id="next-month" style="
              background: linear-gradient(180deg, #f0f7ff 0%, #d8ebf8 100%);
              border: 1px solid ${c.border};
              color: ${accent};
              padding: 6px 10px;
              border-radius: 3px;
              cursor: pointer;
              font-size: 16px;
              font-weight: bold;
              box-shadow: 0 1px 1px rgba(0,0,0,0.1);
              transition: background 0.1s;
            " onmouseover="this.style.background='linear-gradient(180deg, #fff 0%, #d1e1f1 100%)'" onmouseout="this.style.background='linear-gradient(180deg, #f0f7ff 0%, #d8ebf8 100%)'">›</button>
          </div>
          
          <div style="flex: 1; padding: 12px; display: flex; flex-direction: column;">
            <div style="
              display: grid;
              grid-template-columns: repeat(7, 1fr);
              gap: 1px;
              margin-bottom: 4px;
            ">
              <div style="text-align: center; padding: 6px 2px; font-size: 11px; font-weight: 700; color: ${c.red}; background: ${c.headerBg2}; border-radius: 2px;">SUN</div>
              <div style="text-align: center; padding: 6px 2px; font-size: 11px; font-weight: 700; color: ${c.black}; background: ${c.headerBg2}; border-radius: 2px;">MON</div>
              <div style="text-align: center; padding: 6px 2px; font-size: 11px; font-weight: 700; color: ${c.black}; background: ${c.headerBg2}; border-radius: 2px;">TUE</div>
              <div style="text-align: center; padding: 6px 2px; font-size: 11px; font-weight: 700; color: ${c.black}; background: ${c.headerBg2}; border-radius: 2px;">WED</div>
              <div style="text-align: center; padding: 6px 2px; font-size: 11px; font-weight: 700; color: ${c.black}; background: ${c.headerBg2}; border-radius: 2px;">THU</div>
              <div style="text-align: center; padding: 6px 2px; font-size: 11px; font-weight: 700; color: ${c.black}; background: ${c.headerBg2}; border-radius: 2px;">FRI</div>
              <div style="text-align: center; padding: 6px 2px; font-size: 11px; font-weight: 700; color: ${c.black}; background: ${c.headerBg2}; border-radius: 2px;">SAT</div>
            </div>
            
            <div id="calendar-grid" style="
              display: grid;
              grid-template-columns: repeat(7, 1fr);
              gap: 2px;
              flex: 1;
              align-content: start;
            ">
              </div>
          </div>
          
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 20px;
            background: linear-gradient(180deg, ${c.headerBg2} 0%, ${c.headerBg1} 100%);
            border-top: 1px solid ${c.border};
          ">
            <button id="today-btn" style="
              background: linear-gradient(180deg, ${primary1} 0%, ${primary2} 100%);
              border: 1px solid ${primary2};
              color: white;
              font-weight: 600;
              padding: 6px 12px;
              border-radius: 3px;
              cursor: pointer;
              font-size: 12px;
              box-shadow: 0 1px 2px rgba(0,0,0,0.15);
            ">Today</button>
            
            <div id="current-date" style="
              font-size: 12px;
              color: ${accent};
              font-weight: 600;
            ">Thursday, September 24, 2025</div>
          </div>
        </div>
      `;
      
      const win = window.WindowManager.createWindow('Calendar', calendarHTML, 420, 500);
      this.setupCalendar(win);
      return win;
    },
    
    setupCalendar(win) {
      const prevBtn = win.querySelector('#prev-month');
      const nextBtn = win.querySelector('#next-month');
      const todayBtn = win.querySelector('#today-btn');
      
      // Navigation handlers
      prevBtn.onclick = () => {
        this.selectedDate.setMonth(this.selectedDate.getMonth() - 1);
        this.renderCalendar(win);
      };
      
      nextBtn.onclick = () => {
        this.selectedDate.setMonth(this.selectedDate.getMonth() + 1);
        this.renderCalendar(win);
      };
      
      todayBtn.onclick = () => {
        this.selectedDate = new Date();
        this.renderCalendar(win);
      };
      
      // Initial render
      this.renderCalendar(win);
    },
    
    renderCalendar(win) {
      const c = this.AeroColors;
      
      // Use theme variables for today highlighting and accent
      const todayBg1 = getComputedStyle(document.documentElement).getPropertyValue('--theme-primary-1').trim() || c.todayBg1;
      const todayBg2 = getComputedStyle(document.documentElement).getPropertyValue('--theme-primary-2').trim() || c.todayBg2;
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--theme-accent').trim() || c.textDark;

      const monthYear = win.querySelector('#month-year');
      const calendarGrid = win.querySelector('#calendar-grid');
      const currentDateEl = win.querySelector('#current-date');
      
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      const year = this.selectedDate.getFullYear();
      const month = this.selectedDate.getMonth();
      
      // Update header
      monthYear.textContent = `${months[month]} ${year}`;
      
      // Update current date display
      const today = new Date();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      currentDateEl.textContent = `${dayNames[today.getDay()]}, ${months[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;
      
      // Generate calendar days
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const prevMonthDays = new Date(year, month, 0).getDate();
      
      let html = '';
      let dayCount = 1;
      
      // Calculate total cells needed (6 rows)
      const totalCells = 42;
      
      for (let i = 0; i < totalCells; i++) {
        let dayNumber = '';
        let isCurrentMonth = false;
        let isToday = false;
        // Determine if this cell is in the Sunday column (i % 7 === 0)
        const isSundayColumn = (i % 7 === 0);

        let dayStyle = `
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 40px;
          cursor: pointer;
          transition: all 0.2s;
          border-radius: 3px;
          font-size: 14px;
          font-weight: 500;
        `;
        
        if (i < firstDay) {
          // Previous month days
          dayNumber = prevMonthDays - (firstDay - i - 1);
          dayStyle += `opacity: 0.6; color: #777; background: ${c.bg3};`;
        } else if (dayCount <= daysInMonth) {
          // Current month days
          dayNumber = dayCount;
          isCurrentMonth = true;
          
          // Check if this is today
          if (year === today.getFullYear() && 
              month === today.getMonth() && 
              dayCount === today.getDate()) {
            isToday = true;
            // Bold Aero Today Highlight (Uses Theme colors for Primary)
            dayStyle += `background: linear-gradient(180deg, ${todayBg1} 0%, ${todayBg2} 100%); color: white; border: 2px solid ${todayBg2}; font-weight: 700; box-shadow: 0 2px 3px rgba(0,0,0,0.2);`;
          } else {
            // Standard Aero Day Cell
            const dayColor = isSundayColumn ? c.red : accent;
            dayStyle += `background: linear-gradient(180deg, #ffffff 0%, ${c.bg2} 100%); color: ${dayColor}; border: 1px solid ${c.border};`;
          }
          
          dayCount++;
        } else {
          // Next month days
          dayNumber = dayCount - daysInMonth;
          dayStyle += `opacity: 0.6; color: #777; background: ${c.bg3};`;
          dayCount++;
        }
        
        // Define hover/out styles using inline event handlers for simplicity
        const hoverBg = `linear-gradient(180deg, ${c.headerBg1} 0%, ${c.headerBg2} 100%)`;
        const initialBg = isToday ? `linear-gradient(180deg, ${todayBg1} 0%, ${todayBg2} 100%)` : `linear-gradient(180deg, #ffffff 0%, ${c.bg2} 100%)`;
        const initialBorder = isToday ? `2px solid ${todayBg2}` : `1px solid ${c.border}`;
        const initialColor = isToday ? 'white' : (isSundayColumn ? c.red : accent);


        // Hover color should be the primary accent for all days (or red if we want red text on Sunday hover)
        // Let's keep hover text the primary accent color for uniformity, UNLESS it's Today.
        const hoverColor = accent; 

        const onmouseover = `this.style.background='${hoverBg}'; this.style.color='${hoverColor}'; this.style.borderColor='${accent}'`;
        const onmouseout = `this.style.background='${initialBg}'; this.style.color='${initialColor}'; this.style.borderColor='${initialBorder}'`;


        // Only apply hover/out for current month days
        if (isCurrentMonth && !isToday) {
             html += `
                <div style="${dayStyle}" 
                     onmouseover="${onmouseover}" 
                     onmouseout="${onmouseout}">
                  ${dayNumber}
                </div>
              `;
        } else {
             // For Today, or days from other months, don't apply hover events
             html += `<div style="${dayStyle}">${dayNumber}</div>`;
        }
      }
      
      calendarGrid.innerHTML = html;
    }
  };
  
  // Register app
  if (typeof AppRegistry !== 'undefined') {
    AppRegistry.registerApp({
      id: 'calendar',
      name: 'Calendar',
      // Updated icon to use the dark blue accent for a more Aero look
      icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' rx='6' fill='%231F4765'/><rect x='8' y='12' width='32' height='28' fill='white' rx='2'/><rect x='12' y='8' width='4' height='8' fill='%23666'/><rect x='32' y='8' width='4' height='8' fill='%23666'/><rect x='8' y='20' width='32' height='2' fill='%23ddd'/><text x='24' y='32' text-anchor='middle' font-size='12' fill='%231F4765' font-weight='bold'>24</text></svg>",
      handler: () => window.CalendarApp.open()
    });
  }

  // Register documentation (minor update to description)
  if (window.Docs && typeof window.Docs.registerDocumentation === 'function') {
    window.Docs.registerDocumentation('calendar', {
      name: "Calendar",
      version: "1.0.0",
      description: "Clean, sharp calendar application with Windows Aero theme matching for month navigation and date viewing",
      type: "User App",
      features: [
        "Crisp Aero gradient theme matching",
        "Month navigation with previous/next controls",
        "Today date highlighting with visual border",
        "Current date display with full day name",
        "Responsive calendar grid with 7-day week layout",
        "Today button for quick navigation to current date",
        "Sunday column text is highlighted in red."
      ],
      dependencies: ["WindowManager", "AppRegistry"],
      methods: [
        { name: "open", description: "Creates calendar window with month view and navigation controls" },
        { name: "setupCalendar", description: "Initializes event handlers for month navigation and today button" },
        { name: "renderCalendar", description: "Renders calendar grid with proper date layout and today highlighting" }
      ],
      notes: "Simple calendar focused on clean design and essential functionality. Uses CSS-in-JS for consistent theme integration.",
      cudos: "edmundsparrow.netlify.app | whatsappme @ 09024054758 | webaplications5050@gmail.com",
      auto_generated: false
    });
  }
})();
