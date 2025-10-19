// geo-compass.js - Geographic Compass Application
/**
 * FILE: applications/geo-compass.js
 * VERSION: 1.5.0
 * BUILD DATE: 2025-10-11
 *
 * PURPOSE:
 * Professional GPS compass using external compass.svg with destination bearing and city search
 *
 * FEATURES:
 * - Rich SVG compass visualization from compass.svg
 * - Real-time device orientation tracking
 * - GPS location with accuracy display
 * - Destination bearing with distance calculation
 * - Tabbed interface: Compass | Manual | Search
 * - City search with interactive map preview
 * - Mobile-responsive coordinate inputs
 *
 * ARCHITECTURE:
 * - IIFE pattern with window.GeoCompassApp namespace
 * - Uses external compass.svg asset
 * - DeviceOrientation API for heading
 * - Geolocation API for GPS
 * - Haversine formula for distance/bearing
 * - Nominatim API for geocoding
 *
 * DEPENDENCIES:
 * - WindowManager, AppRegistry
 * - compass.svg (must be in same directory or assets folder)
 *
 * CREDITS:
 * edmundsparrow.netlify.app | whatsapp @ 09024054758 | webaplications5050@gmail.com
 */

(function(){ 'use strict';

const CFG = {
  id: 'geo-compass',
  name: 'Geo Compass',
  v: '1.5.0',
  icon: '🧭'
};

const TH = {
  bg: 'linear-gradient(180deg,#efece1,#dcd6c2)',
  accent: '#1b3a4b',
  red: '#c33',
  green: '#166f45',
  blue: '#2563eb'
};

const App = {
  wins: new Map(),
  dest: null,
  searchResults: [],

  open(){
    const w = window.WindowManager.createWindow(CFG.name, this.ui(), 420, 650);
    this.setup(w);
    return w;
  },

  ui(){
    return `
    <div style="height:100%;box-sizing:border-box;padding:12px;font-family:'Segoe UI',sans-serif;background:${TH.bg};color:${TH.accent};overflow-y:auto;display:flex;flex-direction:column;">
      
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <h3 style="margin:0;font-size:16px;font-weight:600;">${CFG.name}</h3>
        <div style="font-size:24px">${CFG.icon}</div>
      </div>

      <!-- Tabs -->
      <div id="tabs" style="display:flex;gap:6px;margin-bottom:12px;">
        <button id="tabCompass" style="flex:1;padding:10px;border-radius:6px;border:1px solid rgba(0,0,0,.08);background:#fff;cursor:pointer;font-weight:700;font-size:12px;box-shadow:0 2px 4px rgba(0,0,0,.08);">
          🧭 Compass
        </button>
        <button id="tabManual" style="flex:1;padding:10px;border-radius:6px;border:1px solid rgba(0,0,0,.08);background:transparent;cursor:pointer;font-size:12px;">
          📍 Manual
        </button>
        <button id="tabSearch" style="flex:1;padding:10px;border-radius:6px;border:1px solid rgba(0,0,0,.08);background:transparent;cursor:pointer;font-size:12px;">
          🔍 Search
        </button>
      </div>

      <!-- Content Area -->
      <div id="content" style="flex:1;min-height:0;overflow:hidden;">
        
        <!-- Compass View -->
        <div id="compassView" style="display:flex;flex-direction:column;height:100%;gap:12px;">
          
          <!-- Rich SVG Compass Container -->
          <div style="flex:1;display:flex;align-items:center;justify-content:center;background:#fff;border-radius:12px;padding:20px;box-shadow:0 4px 12px rgba(0,0,0,.1);position:relative;min-height:280px;">
            <img 
              id="compassSvg" 
              src="../assets/compass.svg" 
              alt="Compass"
              style="
                width:100%;
                height:100%;
                max-width:300px;
                max-height:300px;
                object-fit:contain;
                transition:transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                transform:rotate(0deg);
              "
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
            />
            
            <!-- Fallback if compass.svg fails -->
            <div style="display:none;flex-direction:column;align-items:center;justify-content:center;color:#999;gap:8px;">
              <div style="font-size:48px;">🧭</div>
              <div style="font-size:14px;">compass.svg not found</div>
            </div>
          </div>

          <!-- Heading Display -->
          <div style="text-align:center;background:rgba(255,255,255,.9);padding:12px;border-radius:8px;border:1px solid rgba(0,0,0,.06);">
            <div id="heading" style="font-size:24px;font-weight:700;margin-bottom:4px;">0° (N)</div>
            <div id="destInfo" style="font-size:12px;opacity:.85;min-height:16px;">No destination set</div>
          </div>

          <!-- Location Info -->
          <div style="background:rgba(255,255,255,.9);padding:10px;border-radius:8px;border:1px solid rgba(0,0,0,.06);">
            <div id="loc" style="font-size:11px;opacity:.85;margin-bottom:4px;">📍 GPS: Initializing...</div>
            <div id="status" style="font-size:11px;opacity:.7;">Tap Enable to start compass</div>
          </div>

          <!-- Enable Button -->
          <button id="enable" style="width:100%;padding:12px;border-radius:8px;border:none;background:#1b3a4b;color:#fff;cursor:pointer;font-size:14px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,.15);">
            Enable Compass
          </button>
        </div>

        <!-- Manual Destination View -->
        <div id="manualView" style="display:none;flex-direction:column;height:100%;gap:12px;overflow-y:auto;padding:8px 0;">
          
          <div style="background:rgba(255,255,255,.95);padding:16px;border-radius:10px;border:1px solid rgba(0,0,0,.06);box-shadow:0 2px 8px rgba(0,0,0,.08);">
            <h4 style="margin:0 0 12px 0;font-size:14px;font-weight:600;">Set Destination Coordinates</h4>
            
            <!-- Latitude Input -->
            <div style="margin-bottom:12px;">
              <label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px;opacity:.85;">Latitude</label>
              <input 
                id="lat" 
                placeholder="e.g. 4.815600" 
                type="number" 
                step="0.000001" 
                style="width:100%;padding:10px;border:1px solid #cfc6b0;border-radius:6px;font-size:14px;box-sizing:border-box;"
              />
            </div>

            <!-- Longitude Input -->
            <div style="margin-bottom:16px;">
              <label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px;opacity:.85;">Longitude</label>
              <input 
                id="lon" 
                placeholder="e.g. 7.049800" 
                type="number" 
                step="0.000001" 
                style="width:100%;padding:10px;border:1px solid #cfc6b0;border-radius:6px;font-size:14px;box-sizing:border-box;"
              />
            </div>

            <!-- Action Buttons -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <button id="setDest" style="padding:12px;border-radius:6px;border:none;background:#166f45;color:white;font-weight:700;cursor:pointer;font-size:13px;">
                ✓ Set Destination
              </button>
              <button id="clearDest" style="padding:12px;border-radius:6px;border:1px solid #cfc6b0;background:transparent;cursor:pointer;font-size:13px;font-weight:600;">
                ✕ Clear
              </button>
            </div>
          </div>

          <!-- Current Destination Info -->
          <div id="currentDest" style="background:rgba(255,255,255,.9);padding:14px;border-radius:8px;border:1px solid rgba(0,0,0,.06);">
            <div style="font-size:12px;font-weight:600;margin-bottom:6px;">Current Destination</div>
            <div id="destDisplay" style="font-size:12px;opacity:.85;">None</div>
          </div>

          <!-- Quick Presets -->
          <div style="background:rgba(255,255,255,.9);padding:14px;border-radius:8px;border:1px solid rgba(0,0,0,.06);">
            <div style="font-size:12px;font-weight:600;margin-bottom:8px;">Quick Presets</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
              <button class="preset" data-lat="4.8156" data-lon="7.0498" style="padding:8px;border-radius:4px;border:1px solid #ddd;background:#fff;cursor:pointer;font-size:11px;">Port Harcourt</button>
              <button class="preset" data-lat="6.5244" data-lon="3.3792" style="padding:8px;border-radius:4px;border:1px solid #ddd;background:#fff;cursor:pointer;font-size:11px;">Lagos</button>
              <button class="preset" data-lat="9.0579" data-lon="7.4951" style="padding:8px;border-radius:4px;border:1px solid #ddd;background:#fff;cursor:pointer;font-size:11px;">Abuja</button>
              <button class="preset" data-lat="7.3775" data-lon="3.9470" style="padding:8px;border-radius:4px;border:1px solid #ddd;background:#fff;cursor:pointer;font-size:11px;">Ibadan</button>
            </div>
          </div>
        </div>

        <!-- Search View -->
        <div id="searchView" style="display:none;flex-direction:column;height:100%;gap:12px;overflow-y:auto;padding:8px 0;">
          
          <!-- Search Box -->
          <div style="background:rgba(255,255,255,.95);padding:16px;border-radius:10px;border:1px solid rgba(0,0,0,.06);box-shadow:0 2px 8px rgba(0,0,0,.08);">
            <h4 style="margin:0 0 12px 0;font-size:14px;font-weight:600;">Search for a City or Place</h4>
            
            <div style="display:flex;gap:8px;margin-bottom:12px;">
              <input 
                id="searchInput" 
                placeholder="Enter city name (e.g. New York, Tokyo)" 
                type="text" 
                style="flex:1;padding:10px;border:1px solid #cfc6b0;border-radius:6px;font-size:14px;box-sizing:border-box;"
              />
              <button id="searchBtn" style="padding:10px 16px;border-radius:6px;border:none;background:#2563eb;color:white;font-weight:700;cursor:pointer;font-size:13px;">
                🔍 Search
              </button>
            </div>
            
            <div id="searchStatus" style="font-size:11px;opacity:.7;min-height:16px;">Enter a location to search</div>
          </div>

          <!-- Search Results -->
          <div id="searchResults" style="flex:1;background:rgba(255,255,255,.95);border-radius:10px;border:1px solid rgba(0,0,0,.06);overflow:hidden;display:flex;flex-direction:column;">
            <div style="padding:12px;border-bottom:1px solid rgba(0,0,0,.06);background:rgba(0,0,0,.02);">
              <div style="font-size:12px;font-weight:600;">Search Results</div>
            </div>
            <div id="resultsList" style="flex:1;overflow-y:auto;padding:8px;">
              <div style="text-align:center;padding:40px 20px;opacity:.5;font-size:13px;">
                No results yet. Search for a city to see results with map preview.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <style>
      @media (max-width: 480px) {
        #lat, #lon, #searchInput {
          font-size: 16px !important;
        }
      }
      .result-item {
        padding: 10px;
        margin-bottom: 8px;
        background: #fff;
        border: 1px solid #e5e5e5;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .result-item:hover {
        background: #f8f8f8;
        border-color: #2563eb;
        box-shadow: 0 2px 4px rgba(0,0,0,.08);
      }
      .result-item.selected {
        background: #eff6ff;
        border-color: #2563eb;
      }
    </style>
    `;
  },

  setup(w){
    const id = w.id || `gc-${Date.now()}`;
    this.wins.set(id, { el: w, oh: null, pw: null, lh: 0, th: 0 });

    // Tab switching
    const tc = w.querySelector('#tabCompass');
    const tm = w.querySelector('#tabManual');
    const ts = w.querySelector('#tabSearch');
    const cv = w.querySelector('#compassView');
    const mv = w.querySelector('#manualView');
    const sv = w.querySelector('#searchView');
    
    const switchTab = (activeTab, activeView) => {
      [tc, tm, ts].forEach(t => {
        t.style.background = 'transparent';
        t.style.boxShadow = 'none';
        t.style.fontWeight = '400';
      });
      [cv, mv, sv].forEach(v => v.style.display = 'none');
      
      activeTab.style.background = '#fff';
      activeTab.style.boxShadow = '0 2px 4px rgba(0,0,0,.08)';
      activeTab.style.fontWeight = '700';
      activeView.style.display = 'flex';
    };
    
    tc.onclick = () => switchTab(tc, cv);
    tm.onclick = () => switchTab(tm, mv);
    ts.onclick = () => switchTab(ts, sv);

    // Manual destination buttons
    w.querySelector('#setDest').onclick = () => this.setDest(w);
    w.querySelector('#clearDest').onclick = () => this.clearDest(w);
    
    // Preset buttons
    w.querySelectorAll('.preset').forEach(btn => {
      btn.onclick = () => {
        const lat = parseFloat(btn.dataset.lat);
        const lon = parseFloat(btn.dataset.lon);
        this.dest = { lat, lon, name: btn.textContent };
        this.updateDestDisplay(w);
        tc.click(); // Switch to compass view
      };
    });

    // Search functionality
    const searchInput = w.querySelector('#searchInput');
    const searchBtn = w.querySelector('#searchBtn');
    
    const doSearch = () => this.searchLocation(w, searchInput.value.trim());
    searchBtn.onclick = doSearch;
    searchInput.onkeypress = (e) => {
      if (e.key === 'Enter') doSearch();
    };

    // Enable compass
    w.querySelector('#enable').onclick = () => this.enableOri(w, id);

    // Initialize GPS and animation
    this.initGeo(w, id);
    this.animate(id);
    this.cleanup(w, id);
  },

  async searchLocation(w, query){
    if (!query) {
      this.showSearchStatus(w, 'Please enter a location', TH.red);
      return;
    }

    this.showSearchStatus(w, '🔍 Searching...', TH.blue);

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=10&addressdetails=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'GeoCompassApp/1.5' }
      });

      if (!res.ok) throw new Error('Search failed');

      const results = await res.json();
      
      if (results.length === 0) {
        this.showSearchStatus(w, 'No results found. Try a different search.', TH.red);
        this.showSearchResults(w, []);
        return;
      }

      this.showSearchStatus(w, `Found ${results.length} result(s)`, TH.green);
      this.showSearchResults(w, results);
    } catch (err) {
      console.error('Search error:', err);
      this.showSearchStatus(w, '❌ Search error. Check connection.', TH.red);
      this.showSearchResults(w, []);
    }
  },

  showSearchStatus(w, msg, color){
    const status = w.querySelector('#searchStatus');
    if (status) {
      status.textContent = msg;
      status.style.color = color || TH.accent;
    }
  },

  showSearchResults(w, results){
    const list = w.querySelector('#resultsList');
    if (!list) return;

    if (results.length === 0) {
      list.innerHTML = `
        <div style="text-align:center;padding:40px 20px;opacity:.5;font-size:13px;">
          No results found. Try searching again.
        </div>
      `;
      return;
    }

    list.innerHTML = results.map((r, i) => {
      const name = r.display_name || 'Unknown';
      const lat = parseFloat(r.lat);
      const lon = parseFloat(r.lon);
      
      // Create a short name from the display name
      const parts = name.split(',');
      const shortName = parts.slice(0, 2).join(',');
      
      // Static map URL using OpenStreetMap tiles via static image service
      const zoom = 12;
      const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.05},${lat-0.05},${lon+0.05},${lat+0.05}&layer=mapnik&marker=${lat},${lon}`;
      
      return `
        <div class="result-item" data-index="${i}">
          <div style="display:flex;gap:10px;align-items:start;">
            <div style="flex:1;">
              <div style="font-size:13px;font-weight:600;margin-bottom:4px;color:${TH.accent};">
                ${this.escapeHtml(shortName)}
              </div>
              <div style="font-size:11px;opacity:.7;margin-bottom:6px;">
                ${this.escapeHtml(name)}
              </div>
              <div style="font-size:11px;font-family:monospace;opacity:.6;">
                ${lat.toFixed(6)}, ${lon.toFixed(6)}
              </div>
            </div>
            <div style="width:80px;height:60px;border-radius:4px;overflow:hidden;border:1px solid #ddd;flex-shrink:0;">
              <iframe 
                src="${mapUrl}" 
                width="80" 
                height="60" 
                style="border:none;pointer-events:none;"
                scrolling="no"
              ></iframe>
            </div>
          </div>
          <button 
            class="select-result" 
            data-lat="${lat}" 
            data-lon="${lon}" 
            data-name="${this.escapeHtml(shortName)}"
            style="width:100%;margin-top:8px;padding:8px;border-radius:4px;border:1px solid ${TH.blue};background:${TH.blue};color:white;cursor:pointer;font-size:12px;font-weight:600;"
          >
            📍 Set as Destination
          </button>
        </div>
      `;
    }).join('');

    // Add click handlers for result selection
    list.querySelectorAll('.select-result').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const lat = parseFloat(btn.dataset.lat);
        const lon = parseFloat(btn.dataset.lon);
        const name = btn.dataset.name;
        
        this.dest = { lat, lon, name };
        this.updateDestDisplay(w);
        this.showSearchStatus(w, `✓ Destination set: ${name}`, TH.green);
        
        // Switch to compass view after 1 second
        setTimeout(() => {
          w.querySelector('#tabCompass').click();
        }, 1000);
      };
    });
  },

  escapeHtml(text){
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  animate(id){
    const tick = () => {
      const s = this.wins.get(id);
      if (!s) return;
      
      // Smooth damping
      let diff = ((s.th - s.lh + 540) % 360) - 180;
      s.lh = (s.lh + diff * 0.12 + 360) % 360;

      // Rotate compass SVG (counter-rotate so north stays up)
      const compass = s.el.querySelector('#compassSvg');
      if (compass) {
        compass.style.transform = `rotate(${-s.lh}deg)`;
      }

      // Update heading text
      const h = s.el.querySelector('#heading');
      if (h) {
        const deg = Math.round(s.lh) % 360;
        h.textContent = `${deg}° (${this.card(deg)})`;
      }

      // Update destination info
      this.updateDest(s.el, s.lh, s.coords);

      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  },

  enableOri(w, id){
    const st = w.querySelector('#status');
    const btn = w.querySelector('#enable');
    
    const h = ev => {
      let hd = ev.webkitCompassHeading ?? null;
      if (hd === null && typeof ev.alpha === 'number') {
        hd = (360 - ev.alpha + 360) % 360;
      }
      if (typeof hd !== 'number' || isNaN(hd)) return;
      
      const s = this.wins.get(id);
      if (s) s.th = hd;
    };

    const add = () => {
      window.addEventListener('deviceorientationabsolute', h, true);
      window.addEventListener('deviceorientation', h, true);
      const s = this.wins.get(id);
      if (s) {
        s.oh = h;
        st.textContent = '✓ Compass active';
        btn.textContent = '✓ Compass Enabled';
        btn.style.background = '#166f45';
      }
    };

    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(p => p === 'granted' ? add() : st.textContent = '⚠️ Permission denied')
        .catch(() => st.textContent = '⚠️ Permission error');
    } else {
      add();
    }
  },

  initGeo(w, id){
    const lt = w.querySelector('#loc');
    if (!navigator.geolocation) {
      lt.textContent = '📍 GPS: Not supported';
      return;
    }

    const ok = p => {
      const { latitude: la, longitude: lo, accuracy: ac } = p.coords;
      lt.textContent = `📍 GPS: ${la.toFixed(6)}, ${lo.toFixed(6)} (±${Math.round(ac)}m)`;
      
      const d = this.wins.get(id) || {};
      d.coords = { lat: la, lon: lo };
      this.wins.set(id, d);
      
      this.updateDest(w, d.lh ?? 0, d.coords);
    };
    
    const fail = () => {
      lt.textContent = '📍 GPS: Unavailable';
    };
    
    const watch = navigator.geolocation.watchPosition(ok, fail, {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 10000
    });
    
    const d = this.wins.get(id) || {};
    d.pw = watch;
    this.wins.set(id, d);
  },

  setDest(w){
    const la = parseFloat(w.querySelector('#lat').value);
    const lo = parseFloat(w.querySelector('#lon').value);
    
    if (!isFinite(la) || !isFinite(lo)) {
      const dd = w.querySelector('#destDisplay');
      dd.textContent = '⚠️ Invalid coordinates';
      dd.style.color = TH.red;
      return;
    }
    
    this.dest = { lat: la, lon: lo, name: 'Manual Entry' };
    this.updateDestDisplay(w);
    
    // Switch back to compass view
    w.querySelector('#tabCompass').click();
  },

  clearDest(w){
    this.dest = null;
    this.updateDestDisplay(w);
    
    w.querySelector('#lat').value = '';
    w.querySelector('#lon').value = '';
  },

  updateDestDisplay(w){
    const dd = w.querySelector('#destDisplay');
    const di = w.querySelector('#destInfo');
    
    if (!this.dest) {
      dd.textContent = 'None';
      dd.style.color = TH.accent;
      if (di) di.textContent = 'No destination set';
    } else {
      const name = this.dest.name || 'Custom Location';
      dd.textContent = `${name}\n${this.dest.lat.toFixed(6)}, ${this.dest.lon.toFixed(6)}`;
      dd.style.color = TH.green;
      dd.style.whiteSpace = 'pre-line';
      if (di) di.textContent = 'Destination set - calculating bearing...';
    }
  },

  updateDest(w, ch, coords){
    const di = w.querySelector('#destInfo');
    if (!di) return;
    
    if (!this.dest) {
      di.textContent = 'No destination set';
      return;
    }
    
    if (!coords) {
      di.textContent = 'Waiting for GPS...';
      return;
    }

    const b = this.bearing(coords.lat, coords.lon, this.dest.lat, this.dest.lon);
    const dist = this.haversine(coords.lat, coords.lon, this.dest.lat, this.dest.lon);
    const rel = ((b - ch) + 360) % 360;

    const distText = dist >= 1000 
      ? `${(dist / 1000).toFixed(2)} km` 
      : `${Math.round(dist)} m`;

    di.textContent = `→ ${b.toFixed(1)}° • ${distText} away`;
  },

  haversine(lat1, lon1, lat2, lon2){
    const R = 6371e3;
    const t = d => d * Math.PI / 180;
    const dLa = t(lat2 - lat1);
    const dLo = t(lon2 - lon1);
    const a = Math.sin(dLa / 2) ** 2 + 
              Math.cos(t(lat1)) * Math.cos(t(lat2)) * Math.sin(dLo / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },

  bearing(lat1, lon1, lat2, lon2){
    const t = d => d * Math.PI / 180;
    const td = d => d * 180 / Math.PI;
    const y = Math.sin(t(lon2 - lon1)) * Math.cos(t(lat2));
    const x = Math.cos(t(lat1)) * Math.sin(t(lat2)) - 
              Math.sin(t(lat1)) * Math.cos(t(lat2)) * Math.cos(t(lon2 - lon1));
    return (td(Math.atan2(y, x)) + 360) % 360;
  },

  card(d){
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return dirs[Math.round((d % 360) / 22.5) % 16];
  },

  cleanup(w, id){
    const clean = () => {
      const d = this.wins.get(id);
      if (!d) return;
      
      if (d.oh) {
        window.removeEventListener('deviceorientationabsolute', d.oh, true);
        window.removeEventListener('deviceorientation', d.oh, true);
      }
      
      if (d.pw != null) {
        navigator.geolocation.clearWatch(d.pw);
      }
      
      this.wins.delete(id);
    };
    
    w.addEventListener('windowClosed', clean);
    
    const obs = new MutationObserver(() => {
      if (!document.body.contains(w)) clean();
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }
};

window.GeoCompassApp = App;

// AppRegistry registration
if (window.AppRegistry && typeof window.AppRegistry.registerApp === 'function') {
  window.AppRegistry.registerApp({
    id: CFG.id,
    name: CFG.name,
    icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><circle cx='24' cy='24' r='22' fill='%230b0c10' stroke='%2300bcd4' stroke-width='2'/><circle cx='24' cy='24' r='18' fill='none' stroke='%2300bcd4' stroke-width='1' opacity='0.5'/><circle cx='24' cy='24' r='14' fill='none' stroke='%2300bcd4' stroke-width='1' opacity='0.3'/><path d='M24 8 L24 40 M8 24 L40 24' stroke='%2300bcd4' stroke-width='1' opacity='0.4'/><path d='M24 6 L26 10 L24 24 L22 10 Z' fill='%23ef4444' stroke='%23dc2626' stroke-width='1'/><circle cx='24' cy='24' r='3' fill='%23fff'/><text x='24' y='12' text-anchor='middle' font-size='8' fill='%2300bcd4' font-weight='bold'>N</text></svg>",
    handler: () => window.GeoCompassApp.open(),
    category: 'utilities',
    description: 'GPS compass with rich SVG display, destination bearing, and city search with map',
    version: CFG.v,
    singleInstance: false
  });
  console.log(`[${CFG.name}] v${CFG.v} registered`);
}

// Docs registration
if (window.Docs && typeof window.Docs.registerDocumentation === 'function') {
  window.Docs.registerDocumentation(CFG.id, {
    name: CFG.name,
    version: CFG.v,
    description: 'GPS compass using external compass.svg with destination bearing calculator and city search',
    type: 'Utility',
    features: [
      'Rich SVG compass from external compass.svg file',
      'Real-time device orientation with smooth damping',
      'GPS location tracking with accuracy display',
      'Destination bearing and distance calculation',
      'Tabbed interface: Compass | Manual | Search',
      'City search with Nominatim geocoding API',
      'Interactive map preview for search results',
      'Mobile-responsive coordinate inputs',
      'Quick preset locations',
      'Haversine distance formula',
      'Support for manual coordinate entry'
    ],
    usage: [
      'Click "Enable Compass" to start device orientation tracking',
      'Use Manual tab to enter coordinates directly',
      'Use Search tab to find cities with map preview',
      'Select a search result to set as destination',
      'Compass shows bearing and distance to destination'
    ],
    dependencies: ['WindowManager', 'AppRegistry', 'compass.svg', 'Nominatim API'],
    credits: 'edmundsparrow.netlify.app | whatsapp @ 09024054758 | webaplications5050@gmail.com'
  });
}

})()