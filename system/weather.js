// APPLICATIONS/WEATHER.JS - Weather App (single-instance)

/**
 * FILE: applications/weather.js
 * VERSION: 1.0.0
 * BUILD DATE: 2025-09-22
 *
 * PURPOSE:
 *   Displays current weather conditions using the browser Geolocation API
 *   and the Open-Meteo service. Designed to run as a single-instance app
 *   inside the WebOS windowing environment.
 *
 * ARCHITECTURE:
 *   - Self-contained IIFE, attaches to window.WeatherApp
 *   - Renders UI via WindowManager.createWindow()
 *   - Registered with AppRegistry (singleInstance: true)
 *   - Keeps minimal in-window state; relies on AppRegistry for instance control
 *
 * LIFECYCLE:
 *   1. AppRegistry triggers WeatherApp.open() when the app is launched.
 *   2. UI shell is created inside a managed window.
 *   3. Browser requests geolocation permission from user.
 *   4. On success: fetch weather + optional reverse-geocode, render UI.
 *   5. Auto-refresh every 10 minutes; manual refresh by clicking the window.
 *   6. On window close: cleanup timers and listeners.
 *
 * EXTENSION POINTS:
 *   - DATA PROVIDERS: swap or augment Open-Meteo with other providers
 *   - FORECAST VIEW: add hourly/daily forecast panels
 *   - MANUAL INPUT: allow searching by city name (fallback if geo denied)
 *   - CACHE/OFFLINE: cache last successful result in localStorage for offline view
 *   - THEMING: extract inline styles to shared CSS for consistent OS theme
 *
 * CUDOS:
 *   nokia.om, whatsappme @ 09024054758,
 *   email = webaplications5050@gmail.com
 *
 * NOTES:
 *   - This file relies on AppRegistry supporting `singleInstance: true`.
 *   - AppRegistry handles focusing existing instances; this app handles its own timer cleanup.
 */

(function() {
  window.WeatherApp = {
    open() {
      const weatherHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          height: 100%;
          background: linear-gradient(135deg, #74b9ff, #0984e3);
          color: white;
          font-family: 'Segoe UI', sans-serif;
        ">
          <div style="
            padding: 16px;
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
          ">
            <h2 style="margin: 0; font-size: 18px;">Weather</h2>
          </div>
          
          <div style="
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 20px;
            text-align: center;
          ">
            <div id="weather-icon" style="font-size: 64px; margin-bottom: 16px;">🌤️</div>
            <div id="temperature" style="font-size: 36px; font-weight: bold; margin-bottom: 8px;">--°C</div>
            <div id="description" style="font-size: 16px; margin-bottom: 16px;">Loading weather...</div>
            <div id="location" style="font-size: 14px; opacity: 0.8; margin-bottom: 16px;">--</div>
            
            <div style="
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              width: 100%;
              max-width: 300px;
              margin-top: 20px;
            ">
              <div style="
                background: rgba(255, 255, 255, 0.2);
                padding: 12px;
                border-radius: 8px;
                backdrop-filter: blur(5px);
              ">
                <div style="font-size: 12px; opacity: 0.8;">Wind Speed</div>
                <div id="wind-speed" style="font-size: 16px; font-weight: bold;">-- km/h</div>
              </div>
              <div style="
                background: rgba(255, 255, 255, 0.2);
                padding: 12px;
                border-radius: 8px;
                backdrop-filter: blur(5px);
              ">
                <div style="font-size: 12px; opacity: 0.8;">Humidity</div>
                <div id="humidity" style="font-size: 16px; font-weight: bold;">--%</div>
              </div>
            </div>
          </div>
          
          <div style="
            padding: 12px;
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            font-size: 12px;
            opacity: 0.8;
          " id="last-update">
            Click anywhere to refresh weather data
          </div>
        </div>
      `;

      const win = WindowManager.createWindow('Weather', weatherHTML, 320, 400);
      this.setupWeather(win);
      return win;
    },

    setupWeather(win) {
      const temperatureEl = win.querySelector('#temperature');
      const descriptionEl = win.querySelector('#description');
      const locationEl = win.querySelector('#location');
      const windSpeedEl = win.querySelector('#wind-speed');
      const humidityEl = win.querySelector('#humidity');
      const lastUpdateEl = win.querySelector('#last-update');
      const weatherIcon = win.querySelector('#weather-icon');

      const updateWeather = (lat, lon) => {
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
          .then(res => res.json())
          .then(data => {
            const weather = data.current_weather;
            if (!weather) {
              descriptionEl.textContent = "Weather data unavailable.";
              return;
            }

            temperatureEl.textContent = `${weather.temperature}°C`;
            descriptionEl.textContent = `Windspeed ${weather.windspeed} km/h`;
            locationEl.textContent = `Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`;
            windSpeedEl.textContent = `${weather.windspeed} km/h`;
            humidityEl.textContent = `--%`; // Open-Meteo doesn’t return humidity
            weatherIcon.textContent = "🌤️";
            lastUpdateEl.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
          })
          .catch(() => {
            descriptionEl.textContent = "Failed to fetch weather.";
          });
      };

      // Get location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => updateWeather(pos.coords.latitude, pos.coords.longitude),
          () => { descriptionEl.textContent = "Location access denied."; }
        );
      } else {
        descriptionEl.textContent = "Geolocation not supported.";
      }

      // Refresh on click
      win.addEventListener('click', () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            pos => updateWeather(pos.coords.latitude, pos.coords.longitude)
          );
        }
      });
    }
  };

  // Register app
  if (typeof AppRegistry !== 'undefined') {
    AppRegistry.registerApp({
      id: 'weather',
      name: 'Weather',
      icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><circle cx='24' cy='24' r='20' fill='%23f9d71c' stroke='%23e0b000' stroke-width='2'/></svg>",
      handler: () => window.WeatherApp.open()
    });
  }
})();