/**
 * FILE: applications/calendar.js
 * VERSION: 1.0.0
 * BUILD DATE: 2025-09-24
 *
 * PURPOSE:
 *   Clean, modern calendar application with purple gradient theme matching
 *   WebOS design language. Provides month navigation and date selection with
 *   today highlighting and responsive design.
 *
 * ARCHITECTURE:
 *   - IIFE pattern with window.CalendarApp namespace
 *   - Month-based navigation with proper date calculations
 *   - CSS-in-JS styling for consistent theme integration
 *   - Current date highlighting and selection states
 *
 * LIFECYCLE:
 *   1. AppRegistry launches CalendarApp.open()
 *   2. Window created with calendar grid and navigation
 *   3. Month renders with proper date layout and highlighting
 *   4. User can navigate months and select dates
 *   5. Today button provides quick navigation to current date
 *
 * FEATURES:
 *   - Purple gradient theme matching WebOS design
 *   - Month navigation with arrow controls
 *   - Today date highlighting with border
 *   - Current date display at bottom
 *   - Responsive calendar grid layout
 *
 * CUDOS:
 *   edmundsparrow.netlify.app | whatsappme @ 09024054758 | webaplications5050@gmail.com
 */

(function() {
  window.CalendarApp = {
    currentDate: new Date(),
    selectedDate: new Date(),
    
    open() {
      const calendarHTML = `
        <div style="
          height: 100%;
          background: linear-gradient(180deg, #d6e2f1 0%, #c1d5f0 50%, #a6c9e2 100%);
          color: #333;
          font-family: 'Segoe UI', sans-serif;
          display: flex;
          flex-direction: column;
          border: 1px solid #b0c4de;
        ">
          <!-- Header with Navigation -->
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            background: linear-gradient(180deg, #e8f2ff 0%, #d1e7fd 100%);
            border-bottom: 1px solid #b9d3ee;
          ">
            <button id="prev-month" style="
              background: linear-gradient(180deg, #f0f7ff 0%, #d8ebf8 100%);
              border: 1px solid #9cb4d8;
              color: #2b5797;
              padding: 8px 12px;
              border-radius: 3px;
              cursor: pointer;
              font-size: 18px;
              box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            ">‹</button>
            
            <h2 id="month-year" style="
              margin: 0;
              font-size: 20px;
              font-weight: 600;
              color: #2b5797;
            ">September 2025</h2>
            
            <button id="next-month" style="
              background: linear-gradient(180deg, #f0f7ff 0%, #d8ebf8 100%);
              border: 1px solid #9cb4d8;
              color: #2b5797;
              padding: 8px 12px;
              border-radius: 3px;
              cursor: pointer;
              font-size: 18px;
              box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            ">›</button>
          </div>
          
          <!-- Calendar Grid -->
          <div style="flex: 1; padding: 16px;">
            <!-- Day Headers -->
            <div style="
              display: grid;
              grid-template-columns: repeat(7, 1fr);
              gap: 1px;
              margin-bottom: 8px;
            ">
              <div style="text-align: center; padding: 8px; font-size: 12px; font-weight: 600; color: #2b5797; background: rgba(255,255,255,0.3);">SUN</div>
              <div style="text-align: center; padding: 8px; font-size: 12px; font-weight: 600; color: #2b5797; background: rgba(255,255,255,0.3);">MON</div>
              <div style="text-align: center; padding: 8px; font-size: 12px; font-weight: 600; color: #2b5797; background: rgba(255,255,255,0.3);">TUE</div>
              <div style="text-align: center; padding: 8px; font-size: 12px; font-weight: 600; color: #2b5797; background: rgba(255,255,255,0.3);">WED</div>
              <div style="text-align: center; padding: 8px; font-size: 12px; font-weight: 600; color: #2b5797; background: rgba(255,255,255,0.3);">THU</div>
              <div style="text-align: center; padding: 8px; font-size: 12px; font-weight: 600; color: #2b5797; background: rgba(255,255,255,0.3);">FRI</div>
              <div style="text-align: center; padding: 8px; font-size: 12px; font-weight: 600; color: #2b5797; background: rgba(255,255,255,0.3);">SAT</div>
            </div>
            
            <!-- Calendar Days -->
            <div id="calendar-grid" style="
              display: grid;
              grid-template-columns: repeat(7, 1fr);
              gap: 1px;
              flex: 1;
            ">
              <!-- Days will be populated by JavaScript -->
            </div>
          </div>
          
          <!-- Footer -->
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 20px;
            background: linear-gradient(180deg, #e1ecf7 0%, #cde0f0 100%);
            border-top: 1px solid #b9d3ee;
          ">
            <button id="today-btn" style="
              background: linear-gradient(180deg, #f0f7ff 0%, #d8ebf8 100%);
              border: 1px solid #9cb4d8;
              color: #2b5797;
              padding: 6px 12px;
              border-radius: 3px;
              cursor: pointer;
              font-size: 12px;
              box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            ">Today</button>
            
            <div id="current-date" style="
              font-size: 12px;
              color: #2b5797;
              font-weight: 500;
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
        let dayStyle = `
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 40px;
          cursor: pointer;
          transition: background 0.2s;
          border-radius: 4px;
          font-size: 14px;
        `;
        
        if (i < firstDay) {
          // Previous month days
          dayNumber = prevMonthDays - (firstDay - i - 1);
          dayStyle += 'opacity: 0.4; color: #8fa4b8; background: rgba(255,255,255,0.2);';
        } else if (dayCount <= daysInMonth) {
          // Current month days
          dayNumber = dayCount;
          isCurrentMonth = true;
          
          // Check if this is today
          if (year === today.getFullYear() && 
              month === today.getMonth() && 
              dayCount === today.getDate()) {
            isToday = true;
            dayStyle += 'background: linear-gradient(180deg, #4a90e2 0%, #2b5797 100%); color: white; border: 2px solid #1e3a5f; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2);';
          } else {
            dayStyle += 'background: linear-gradient(180deg, #ffffff 0%, #f5f9ff 100%); color: #333; border: 1px solid #d6e8f5;';
          }
          
          dayCount++;
        } else {
          // Next month days
          dayNumber = dayCount - daysInMonth;
          dayStyle += 'opacity: 0.4; color: #8fa4b8; background: rgba(255,255,255,0.2);';
          dayCount++;
        }
        
        html += `
          <div style="${dayStyle}" 
               onmouseover="if(!this.style.color.includes('white')) this.style.background='linear-gradient(180deg, #e6f2ff 0%, #cce5ff 100%)'" 
               onmouseout="if(!this.style.color.includes('white')) this.style.background='${isToday ? 'linear-gradient(180deg, #4a90e2 0%, #2b5797 100%)' : 'linear-gradient(180deg, #ffffff 0%, #f5f9ff 100%)'}'">
            ${dayNumber}
          </div>
        `;
      }
      
      calendarGrid.innerHTML = html;
    }
  };
  
  // Register app
  if (typeof AppRegistry !== 'undefined') {
    AppRegistry.registerApp({
      id: 'calendar',
      name: 'Calendar',
      icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect width='48' height='48' rx='6' fill='%238e44ad'/><rect x='8' y='12' width='32' height='28' fill='white' rx='2'/><rect x='12' y='8' width='4' height='8' fill='%23666'/><rect x='32' y='8' width='4' height='8' fill='%23666'/><rect x='8' y='20' width='32' height='2' fill='%23ddd'/><text x='24' y='32' text-anchor='middle' font-size='12' fill='%238e44ad' font-weight='bold'>24</text></svg>",
      handler: () => window.CalendarApp.open()
    });
  }

  // Register documentation
  if (window.Docs && typeof window.Docs.registerDocumentation === 'function') {
    window.Docs.registerDocumentation('calendar', {
      name: "Calendar",
      version: "1.0.0",
      description: "Clean, modern calendar application with purple gradient theme for month navigation and date viewing",
      type: "User App",
      features: [
        "Purple gradient theme matching WebOS design language",
        "Month navigation with previous/next controls",
        "Today date highlighting with visual border",
        "Current date display with full day name",
        "Responsive calendar grid with 7-day week layout",
        "Today button for quick navigation to current date"
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

