// car-hmi.js - Car Human-Machine Interface (fixed, polished, HAL-ready)
// VERSION: 1.0.1
// AUTHOR: Gnokestation (adapted & corrected)

(function () {
  // Expose app namespace
  window.CarHMI = {
    open() {
      const html = `
        <style>
          /* Layout & theme */
          .car-wrap { display:flex;flex-direction:column;height:100%;
                     font-family:system-ui,-apple-system,Segoe UI,Roboto,'Inter',sans-serif;
                     background: linear-gradient(180deg,#0f1724 0%, #111827 55%, #0b1220 100%);
                     color: #e6eef8; overflow: hidden; }
          .car-header {
            display:flex;align-items:center;justify-content:space-between;
            padding:12px 16px;background:linear-gradient(180deg,#111827,#0f1724);
            border-bottom:1px solid rgba(255,255,255,0.04);
            box-shadow: 0 6px 20px rgba(2,6,23,0.6);
          }
          .car-title { display:flex;align-items:center;gap:12px;font-weight:700;font-size:1.05rem; color:#dbeafe; }
          .car-meta { font-size:0.9rem;color:#9fb0d9; }

          /* Main content */
          .car-main { display:flex;flex-direction:column;padding:14px;gap:14px;height:100%;box-sizing:border-box;overflow:auto; }

          /* Gauges row */
          .car-gauges { display:flex;gap:14px;flex-wrap:wrap;align-items:stretch; justify-content:space-between; }
          .gauge-card {
            background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02));
            border: 1px solid rgba(255,255,255,0.03);
            border-radius:12px;padding:12px;min-width:140px;flex:1 1 160px;
            box-shadow: 0 6px 18px rgba(2,6,23,0.6);
            transition: transform .18s ease, box-shadow .18s ease;
          }
          .gauge-card:hover { transform: translateY(-6px); box-shadow:0 12px 28px rgba(2,6,23,0.7); }
          .gauge-label { font-size:0.85rem;color:#9fb0d9;text-transform:uppercase;letter-spacing:0.6px; }
          .gauge-value { font-size:1.9rem;font-weight:800;color:#bfdbfe;margin-top:6px; display:flex;align-items:baseline;justify-content:center; gap:8px;}
          .gauge-sub { font-size:0.95rem;color:#9fb0d9;margin-top:6px;text-align:center; }

          /* Status / alerts */
          .car-status { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
          .status-panel {
            background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
            border-radius:12px;padding:12px;border:1px solid rgba(255,255,255,0.03);
          }
          .status-title { font-weight:700;color:#e6eef8;margin-bottom:8px; }
          .status-list { display:flex;flex-direction:column;gap:8px; }
          .status-item { display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px dashed rgba(255,255,255,0.03); }
          .status-item:last-child { border-bottom:none; }
          .status-label { color:#9fb0d9; font-size:0.95rem; }
          .status-value { font-weight:700; font-size:0.95rem; }

          /* Status color classes */
          .status-ok { color:#34d399; }   /* green */
          .status-warn { color:#fbbf24; } /* amber */
          .status-fault { color:#fb7185; animation:blink 1s infinite; } /* pink/red */
          @keyframes blink { 50% { opacity: 0.35; } }

          /* Controls */
          .car-controls { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:12px; margin-top:8px; }
          .control-btn {
            background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
            border:1px solid rgba(255,255,255,0.03); color:#e6eef8;
            padding:10px 12px;border-radius:10px;font-weight:700;cursor:pointer;
            display:flex;align-items:center;justify-content:center;gap:8px;transition:transform .12s ease, box-shadow .12s ease;
          }
          .control-btn:hover { transform: translateY(-3px); box-shadow:0 10px 24px rgba(2,6,23,0.6); }
          .control-btn.on { background: linear-gradient(180deg,#0ea5e9,#0369a1); box-shadow:0 8px 22px rgba(8,145,178,0.28); }
          .control-btn.alert { background: linear-gradient(180deg,#fb7185,#b91c1c); box-shadow:0 8px 24px rgba(185,28,28,0.28); color:white; }

          /* small helpers */
          .muted { color:#9fb0d9; font-weight:600; font-size:0.9rem; }
          .unit { font-size:0.6rem;color:#9fb0d9;margin-left:6px; }
          @media (max-width:900px) {
            .gauge-value { font-size:1.5rem; }
            .car-gauges { gap:10px; }
          }
        </style>

        <div class="car-wrap" role="application" aria-label="Car HMI">
          <div class="car-header">
            <div class="car-title">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
                <path d="M3 13l1-4a2 2 0 0 1 2-1.4l2-.4 1-2h6l1 2 2 .4a2 2 0 0 1 2 1.4l1 4v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H6v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5z" fill="#60a5fa"/>
              </svg>
              Car HMI
            </div>
            <div class="car-meta">
              Status: <span id="car-overall-status" class="status-ok">OK</span>
              &nbsp;|&nbsp; Outside: <span id="car-ext-temp" class="muted">--°C</span>
            </div>
          </div>

          <div class="car-main">
            <!-- Gauges -->
            <div class="car-gauges" role="region" aria-label="Vehicle gauges">
              <div class="gauge-card" title="Vehicle speed">
                <div class="gauge-label">Speed</div>
                <div class="gauge-value" id="car-speed">--<span class="unit">km/h</span></div>
                <div class="gauge-sub" id="car-rpm">-- RPM</div>
              </div>

              <div class="gauge-card" title="Fuel level">
                <div class="gauge-label">Fuel</div>
                <div class="gauge-value" id="car-fuel">--<span class="unit">%</span></div>
                <div class="gauge-sub" id="car-range">-- km range</div>
              </div>

              <div class="gauge-card" title="Engine temperature">
                <div class="gauge-label">Engine Temp</div>
                <div class="gauge-value" id="car-eng-temp">--<span class="unit">°C</span></div>
                <div class="gauge-sub" id="car-oil-press">-- bar oil</div>
              </div>

              <div class="gauge-card" title="12V / traction battery">
                <div class="gauge-label">Battery</div>
                <div class="gauge-value" id="car-battery">--<span class="unit">V</span></div>
                <div class="gauge-sub" id="car-charge">-- %</div>
              </div>

              <div class="gauge-card" title="Tire pressures">
                <div class="gauge-label">Tire Pressure (FL)</div>
                <div class="gauge-value" id="car-tpms-fl">--<span class="unit">psi</span></div>
                <div class="gauge-sub" id="car-tpms-all">FL:-- FR:-- RL:-- RR:--</div>
              </div>

              <div class="gauge-card" title="Odometer and trip">
                <div class="gauge-label">Odometer</div>
                <div class="gauge-value" id="car-odometer">--<span class="unit">km</span></div>
                <div class="gauge-sub" id="car-trip">-- km trip</div>
              </div>
            </div>

            <!-- Status panels -->
            <div class="car-status" role="region" aria-label="System status">
              <div class="status-panel" aria-live="polite">
                <div class="status-title">System Status & Alerts</div>
                <div class="status-list">
                  <div class="status-item"><div class="status-label">Lights:</div><div id="car-lights" class="status-value status-ok">Off</div></div>
                  <div class="status-item"><div class="status-label">Wipers:</div><div id="car-wipers" class="status-value status-ok">Off</div></div>
                  <div class="status-item"><div class="status-label">Doors:</div><div id="car-doors" class="status-value status-ok">All Closed</div></div>
                  <div class="status-item"><div class="status-label">Parking Brake:</div><div id="car-park-brake" class="status-value status-warn">Engaged</div></div>
                  <div class="status-item"><div class="status-label">Engine Check:</div><div id="car-engine-check" class="status-value status-ok">No Faults</div></div>
                </div>
              </div>

              <div class="status-panel">
                <div class="status-title">Controls</div>
                <div style="display:flex;flex-direction:column;gap:8px">
                  <div class="car-controls" role="toolbar" aria-label="Vehicle controls">
                    <button class="control-btn" data-control="lights" aria-pressed="false">💡 Lights Off</button>
                    <button class="control-btn" data-control="wipers" aria-pressed="false">🌧️ Wipers Off</button>
                    <button class="control-btn" data-control="lock" aria-pressed="false">🔒 Unlock</button>
                    <button class="control-btn" data-control="media" aria-pressed="false">▶️ Media</button>
                    <button class="control-btn" data-control="climate" aria-pressed="false">🌡️ Climate Off</button>
                    <button class="control-btn alert" id="car-emergency" aria-pressed="false">🚨 SOS</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Create window using your WindowManager (case-sensitive)
      const win = (typeof WindowManager !== 'undefined')
        ? WindowManager.createWindow('Car HMI', html, 840, 620)
        : (function fallback() {
            // If WindowManager isn't available, render into body for quick testing
            const wrapper = document.createElement('div');
            wrapper.innerHTML = html;
            wrapper.style.position = 'relative';
            document.body.appendChild(wrapper);
            return wrapper;
          })();

      // Run setup (attach handlers, polling, cleanup)
      this.setup(win);
      return win;
    },

    setup(win) {
      // Small helpers that use the window-scoped element
      const qs = (sel) => win.querySelector(sel);
      const qsa = (sel) => Array.from(win.querySelectorAll(sel));
      const setVal = (sel, val, unit = '') => {
        const el = qs(sel);
        if (!el) return;
        el.textContent = (val !== null && val !== undefined) ? String(val) + (unit ? unit : '') : '--' + (unit || '');
      };
      const setStatus = (sel, text, cls) => {
        const el = qs(sel);
        if (!el) return;
        el.textContent = text;
        el.className = 'status-value ' + cls;
      };
      const safeFetchJson = (url, opts) =>
        fetch(url, opts).then(r => { if (!r.ok) throw new Error('network'); return r.json(); });

      // Data refresh (tries HAL endpoint, falls back to demo values)
      const refresh = () => {
        safeFetchJson('/api/car/status')
          .then(d => {
            // expected payload shape: see mock below
            setVal('#car-speed', d.speed, ''); // unit in span
            setVal('#car-rpm', d.rpm + ' RPM', '');
            setVal('#car-fuel', d.fuel, '');
            setVal('#car-range', d.range + ' km range', '');
            setVal('#car-eng-temp', d.engTemp, '');
            setVal('#car-oil-press', d.oilPress + ' bar oil', '');
            setVal('#car-battery', d.battery, '');
            setVal('#car-charge', d.charge + ' %', '');
            setVal('#car-tpms-fl', d.tpmsFl, '');
            const tpmsAll = `FL:${d.tpmsFl} FR:${d.tpmsFr} RL:${d.tpmsRl} RR:${d.tpmsRr}`;
            const tpmsEl = qs('#car-tpms-all'); if (tpmsEl) tpmsEl.textContent = tpmsAll;
            setVal('#car-odometer', d.odometer, '');
            setVal('#car-trip', d.trip + ' km trip', '');
            setVal('#car-ext-temp', d.extTemp + '°C', '');

            // statuses
            const overallCls = (d.engineCheck !== 'No Faults' || d.doors !== 'All Closed') ? 'status-warn' : 'status-ok';
            setStatus('#car-overall-status', (d.engineCheck !== 'No Faults' || d.doors !== 'All Closed') ? 'WARN' : 'OK', overallCls);

            setStatus('#car-lights', d.lights, (d.lights && d.lights !== 'Off') ? 'status-ok' : 'status-warn');
            setStatus('#car-wipers', d.wipers, (d.wipers && d.wipers !== 'Off') ? 'status-ok' : 'status-ok');
            setStatus('#car-doors', d.doors, (d.doors === 'All Closed') ? 'status-ok' : 'status-fault');
            setStatus('#car-park-brake', d.parkBrake, (d.parkBrake === 'Engaged') ? 'status-warn' : 'status-ok');
            setStatus('#car-engine-check', d.engineCheck, (d.engineCheck === 'No Faults') ? 'status-ok' : 'status-fault');
          })
          .catch(() => {
            // Demo fallback
            const mock = {
              speed: (Math.random() * 120).toFixed(0),
              rpm: (900 + Math.random() * 4500).toFixed(0),
              fuel: (10 + Math.random() * 80).toFixed(0),
              range: (50 + Math.random() * 500).toFixed(0),
              engTemp: (70 + Math.random() * 40).toFixed(0),
              oilPress: (1 + Math.random() * 4).toFixed(1),
              battery: (12.0 + Math.random() * 1.6).toFixed(1),
              charge: (40 + Math.random() * 60).toFixed(0),
              tpmsFl: (28 + Math.random() * 6).toFixed(0),
              tpmsFr: (28 + Math.random() * 6).toFixed(0),
              tpmsRl: (28 + Math.random() * 6).toFixed(0),
              tpmsRr: (28 + Math.random() * 6).toFixed(0),
              odometer: (20000 + Math.random() * 120000).toFixed(0),
              trip: (Math.random() * 500).toFixed(1),
              extTemp: (5 + Math.random() * 30).toFixed(0),
              lights: Math.random() > 0.75 ? 'High Beam' : (Math.random() > 0.45 ? 'Low Beam' : 'Off'),
              wipers: Math.random() > 0.85 ? 'Fast' : (Math.random() > 0.5 ? 'Intermittent' : 'Off'),
              doors: Math.random() > 0.94 ? 'Driver Open' : 'All Closed',
              parkBrake: Math.random() > 0.6 ? 'Engaged' : 'Released',
              engineCheck: Math.random() > 0.96 ? 'Fault!' : 'No Faults'
            };

            setVal('#car-speed', mock.speed, '');
            setVal('#car-rpm', mock.rpm + ' RPM', '');
            setVal('#car-fuel', mock.fuel, '');
            setVal('#car-range', mock.range + ' km range', '');
            setVal('#car-eng-temp', mock.engTemp, '');
            setVal('#car-oil-press', mock.oilPress + ' bar oil', '');
            setVal('#car-battery', mock.battery, '');
            setVal('#car-charge', mock.charge + ' %', '');
            setVal('#car-tpms-fl', mock.tpmsFl, '');
            const tpmsAll = `FL:${mock.tpmsFl} FR:${mock.tpmsFr} RL:${mock.tpmsRl} RR:${mock.tpmsRr}`;
            const tpmsEl = qs('#car-tpms-all'); if (tpmsEl) tpmsEl.textContent = tpmsAll;
            setVal('#car-odometer', mock.odometer, '');
            setVal('#car-trip', mock.trip + ' km trip', '');
            setVal('#car-ext-temp', mock.extTemp + '°C', '');

            const overallCls = (mock.engineCheck !== 'No Faults' || mock.doors !== 'All Closed') ? 'status-warn' : 'status-ok';
            setStatus('#car-overall-status', (mock.engineCheck !== 'No Faults' || mock.doors !== 'All Closed') ? 'WARN' : 'OK', overallCls);
            setStatus('#car-lights', mock.lights, (mock.lights !== 'Off') ? 'status-ok' : 'status-warn');
            setStatus('#car-wipers', mock.wipers, 'status-ok');
            setStatus('#car-doors', mock.doors, (mock.doors === 'All Closed') ? 'status-ok' : 'status-fault');
            setStatus('#car-park-brake', mock.parkBrake, (mock.parkBrake === 'Engaged') ? 'status-warn' : 'status-ok');
            setStatus('#car-engine-check', mock.engineCheck, (mock.engineCheck === 'No Faults') ? 'status-ok' : 'status-fault');
          });
      };

      // Initial refresh + periodic polling
      refresh();
      const pollId = setInterval(refresh, 3000);

      // Cleanup when window removed from DOM to avoid leaking timers.
      const observer = new MutationObserver(() => {
        if (!document.body.contains(win)) {
          clearInterval(pollId);
          observer.disconnect();
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });

      // Controls wiring
      qsa('.control-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const control = btn.dataset.control;
          // Emergency button handled separately
          if (btn.id === 'car-emergency') return;
          const isOn = btn.classList.toggle('on');
          // Update text for common controls
          switch (control) {
            case 'lights':
              btn.textContent = isOn ? '🔆 Lights On' : '💡 Lights Off';
              break;
            case 'wipers':
              btn.textContent = isOn ? '💧 Wipers On' : '🌧️ Wipers Off';
              break;
            case 'lock':
              btn.textContent = isOn ? '🔐 Lock' : '🔒 Unlock';
              break;
            case 'media':
              btn.textContent = isOn ? '⏸ Media' : '▶️ Media';
              break;
            case 'climate':
              btn.textContent = isOn ? '❄️ Climate On' : '🌡️ Climate Off';
              break;
            default:
              btn.textContent = (isOn ? 'On' : 'Off') + ' ' + (control || '');
          }
          // Send control to HAL (best-effort; ignore errors)
          fetch('/api/car/control', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ control, state: isOn ? 'on' : 'off' })
          }).catch(() => { /* silent fail for offline/demo */ });
        });
      });

      // Emergency button: confirm and POST
      const emerg = qs('#car-emergency');
      if (emerg) {
        emerg.addEventListener('click', () => {
          if (!confirm('Trigger emergency call / SOS?')) return;
          emerg.classList.add('on');
          emerg.textContent = '🚨 SOS Sent';
          fetch('/api/car/emergency', { method: 'POST' }).catch(() => { /* offline */ });
          setTimeout(() => { emerg.classList.remove('on'); emerg.textContent = '🚨 SOS'; }, 3000);
        });
      }

      // Expose a small API on the element for debugging/testing
      try {
        win._carhmi = { pollId };
      } catch (e) { /* ignore if win is not object-like */ }
    }
  };

  // Register the app with AppRegistry (case-sensitive)
  if (typeof AppRegistry !== 'undefined' && typeof AppRegistry.registerApp === 'function') {
    AppRegistry.registerApp({
      id: 'car-hmi',
      name: 'Car HMI',
      size: '32KB',
      category: 'hal',
      url: 'system/store/car-hmi.js',
      description: 'Touch interface for vehicle diagnostics and dashboard controls',
      icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24'><rect x='2' y='8' width='20' height='8' rx='2' fill='%23142b43'/><circle cx='7.5' cy='17.5' r='1.5' fill='%23bfdbfe'/><circle cx='16.5' cy='17.5' r='1.5' fill='%23bfdbfe'/></svg>",
      handler: () => window.CarHMI.open()
    });
  } else {
    // If AppRegistry is not present, attach a quick global for manual testing
    window.registerCarHMITest = () => {
      console.warn('AppRegistry not found; calling CarHMI.open() directly for test.');
      window.CarHMI.open();
    };
  }
})();

/* =========================================================
   HAL MOCK BACKEND (Node.js + Express)
   Copy this block into a separate file (e.g. car-hmi-hal.js)
   and run with: node car-hmi-hal.js
   =========================================================

const express = require('express');
const app = express();
app.use(express.json());

let controls = { lights:'off', wipers:'off', lock:'off', media:'off', climate:'off' };

app.get('/api/car/status', (req, res) => {
  res.json({
    speed: 76,
    rpm: 2900,
    fuel: 58,
    range: 420,
    engTemp: 88,
    oilPress: 2.6,
    battery: 12.6,
    charge: 82,
    tpmsFl: 32, tpmsFr: 32, tpmsRl: 30, tpmsRr: 31,
    odometer: 45230,
    trip: 123.4,
    extTemp: 24,
    lights: controls.lights === 'on' ? 'Low Beam' : 'Off',
    wipers: controls.wipers === 'on' ? 'Intermittent' : 'Off',
    doors: 'All Closed',
    parkBrake: 'Released',
    engineCheck: 'No Faults'
  });
});

app.post('/api/car/control', (req, res) => {
  const { control, state } = req.body;
  if (control && typeof state === 'string') {
    controls[control] = state === 'on' ? 'on' : 'off';
    console.log('Control set:', control, controls[control]);
    return res.json({ ok: true, controls });
  }
  res.status(400).json({ ok: false });
});

app.post('/api/car/emergency', (req, res) => {
  console.log('Emergency triggered via HMI');
  // integrate with telematics / SOS provider here
  res.json({ ok:true });
});

app.listen(3001, () => console.log('Car HMI HAL mock listening on :3001'));
   =========================================================
*/
