// powerdb.js - Power Distribution Board HMI
// VERSION: 1.4.0 (Expanded + Polished + HAL Mock)
// AUTHOR: Gnokestation

(function () {
  window.PowerDB = {
    open() {
      const html = `
 
              <style>
          .pdb-wrap {
            display:flex;flex-direction:column;height:100%;
            font-family:system-ui,sans-serif;
            /* IMPROVED: Dark background for a modern HMI look */
            background:#1e2730; 
            color:#ecf0f1; 
          }
          .pdb-header {
            /* IMPROVED: Primary accent color for the header */
            padding:14px;background:#3498db;color:#fff;
            font-weight:700;font-size:18px;text-align:center;
            letter-spacing:1px;
            box-shadow:0 3px 8px rgba(0,0,0,0.3);
          }
          .pdb-grid {
            flex:1;display:grid;
            grid-template-columns:repeat(3,1fr);
            gap:14px;padding:14px;
          }
          .pdb-card {
            /* IMPROVED: Dark card background, subtle border, lighter shadow */
            background:#2c3e50;
            border-radius:8px; 
            padding:15px 12px; /* Increased vertical padding */
            box-shadow:0 4px 15px rgba(0,0,0,0.4);
            text-align:center;
            font-size:14px; /* Slightly larger font */
            color:#bdc3c7; /* Lighter grey for label */
            transition:transform .2s ease, box-shadow .2s ease;
          }
          .pdb-card:hover { 
            transform:translateY(-2px); 
            box-shadow:0 6px 20px rgba(0,0,0,0.5); /* Stronger lift effect */
          }
          .pdb-card div:last-child {
            /* IMPROVED: High-contrast white for the main value */
            font-size:24px; 
            font-weight:700;
            margin-top:8px;
            color:#fff;
            text-shadow:0 0 5px rgba(255,255,255,0.2); /* Subtle glow for readability */
          }
          .pdb-footer {
            /* IMPROVED: Separated footer background */
            padding:16px;
            background:#22303c; 
            border-top:1px solid #34495e;
            display:flex;flex-wrap:wrap;gap:12px;justify-content:center;
          }
          .breaker-btn {
            flex:1 1 20%;padding:12px;border:none;border-radius:6px;
            /* IMPROVED: Default dark grey button */
            background:#34495e; 
            color:#ecf0f1;
            font-weight:600;font-size:14px;
            cursor:pointer;transition:all .25s ease;
          }
          .breaker-btn.on {
            /* IMPROVED: More vibrant green for ON state */
            background:#2ecc71;
            color:#1e2730; /* Dark text on bright background */
            box-shadow:0 0 12px rgba(46,204,113,0.6);
          }
          .breaker-btn:active { transform:scale(0.97); }
          .btn-emergency {
            /* IMPROVED: Deeper red and clear contrast */
            background:#c0392b; 
            color:#fff;font-weight:800;
            padding:14px 20px;
            border-radius:6px;cursor:pointer;
            flex:1 1 100%;text-align:center;
            font-size:16px;
            box-shadow:0 0 15px rgba(192,57,43,0.6);
            transition:all .2s ease;
          }
          .btn-emergency:hover { 
            background:#e74c3c; /* Brighter red on hover */
            box-shadow:0 0 20px rgba(231,76,60,0.8);
          }
          /* STATUS COLORS - Keep the same high-contrast colors */
          .status-ok { color:#2ecc71;font-weight:700; }
          .status-warn { color:#f1c40f;font-weight:700; } /* Slightly brighter yellow/gold */
          .status-fault { color:#e74c3c;font-weight:700;animation:blink 1s infinite; }
          @keyframes blink { 50%{opacity:0.3;} }
        </style>

        <div class="pdb-wrap">
          <div class="pdb-header">⚡ Power Distribution Board</div>
          <div class="pdb-grid">
            <div class="pdb-card"><div>Voltage</div><div id="pdb-voltage">-- V</div></div>
            <div class="pdb-card"><div>Current</div><div id="pdb-current">-- A</div></div>
            <div class="pdb-card"><div>Power</div><div id="pdb-power">-- kW</div></div>
            <div class="pdb-card"><div>Frequency</div><div id="pdb-freq">-- Hz</div></div>
            <div class="pdb-card"><div>V-L1</div><div id="pdb-vl1">-- V</div></div>
            <div class="pdb-card"><div>V-L2</div><div id="pdb-vl2">-- V</div></div>
            <div class="pdb-card"><div>V-L3</div><div id="pdb-vl3">-- V</div></div>
            <div class="pdb-card"><div>I-L1</div><div id="pdb-i1">-- A</div></div>
            <div class="pdb-card"><div>I-L2</div><div id="pdb-i2">-- A</div></div>
            <div class="pdb-card"><div>I-L3</div><div id="pdb-i3">-- A</div></div>
            <div class="pdb-card"><div>Power Factor</div><div id="pdb-pf">--</div></div>
            <div class="pdb-card"><div>Energy</div><div id="pdb-kwh">-- kWh</div></div>
            <div class="pdb-card"><div>Grid</div><div id="pdb-grid">--</div></div>
            <div class="pdb-card"><div>Status</div><div id="pdb-status" class="status-ok">OK</div></div>
          </div>

          <div class="pdb-footer">
            ${['Main','AC','Lights','Sockets','Gen','Aux'].map(n=>`
              <button class="breaker-btn" data-name="${n}">${n}: OFF</button>
            `).join('')}
            <button class="btn-emergency" id="pdb-estop">🛑 Emergency Stop</button>
            <button class="breaker-btn" id="pdb-mode">Mode: Auto</button>
          </div>
        </div>
      `;
      const win = WindowManager.createWindow('PowerDB', html, 620, 520);
      this.setup(win);
      return win;
    },

    setup(win) {
      const setVal = (id, val, unit="")=>{
        const el = win.querySelector(id);
        if(el) el.textContent = val!==null ? val+" "+unit : "-- "+unit;
      };

      const fetchData = () => {
        fetch('/api/powerdb/status')
          .then(r=>r.json())
          .then(d=>{
            setVal('#pdb-voltage',d.voltage,"V");
            setVal('#pdb-current',d.current,"A");
            setVal('#pdb-power',d.power,"kW");
            setVal('#pdb-freq',d.freq,"Hz");
            setVal('#pdb-vl1',d.vl1,"V");
            setVal('#pdb-vl2',d.vl2,"V");
            setVal('#pdb-vl3',d.vl3,"V");
            setVal('#pdb-i1',d.i1,"A");
            setVal('#pdb-i2',d.i2,"A");
            setVal('#pdb-i3',d.i3,"A");
            setVal('#pdb-pf',d.pf);
            setVal('#pdb-kwh',d.kwh,"kWh");
            win.querySelector('#pdb-grid').textContent = d.grid?"Connected":"Island";
            const statusEl = win.querySelector('#pdb-status');
            statusEl.textContent = d.status;
            statusEl.className = d.status==="OK"?"status-ok":d.status==="Warning"?"status-warn":"status-fault";
          })
          .catch(()=>{
            // Demo values if HAL not available
            setVal('#pdb-voltage',(220+Math.random()*5).toFixed(1),"V");
            setVal('#pdb-current',(10+Math.random()*3).toFixed(1),"A");
            setVal('#pdb-power',(2+Math.random()*0.5).toFixed(2),"kW");
            setVal('#pdb-freq',(50+Math.random()*0.1).toFixed(2),"Hz");
            setVal('#pdb-vl1',231,"V");
            setVal('#pdb-vl2',229,"V");
            setVal('#pdb-vl3',230,"V");
            setVal('#pdb-i1',12.1,"A");
            setVal('#pdb-i2',11.9,"A");
            setVal('#pdb-i3',12.3,"A");
            setVal('#pdb-pf',0.97);
            setVal('#pdb-kwh',1250,"kWh");
            win.querySelector('#pdb-grid').textContent = "Connected";
            const statusEl = win.querySelector('#pdb-status');
            statusEl.textContent = "OK";
            statusEl.className = "status-ok";
          });
      };
      fetchData(); setInterval(fetchData,5000);

      // Breakers
      win.querySelectorAll('.breaker-btn').forEach(btn=>{
        if(btn.id==="pdb-mode") return;
        btn.onclick=()=>{
          const isOn = btn.classList.contains("on");
          const newState = isOn?"OFF":"ON";
          btn.textContent = btn.dataset.name+": "+newState;
          btn.classList.toggle("on",!isOn);
          fetch('/api/powerdb/breaker',{
            method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({breaker:btn.dataset.name,state:newState})
          });
        };
      });

      // Emergency Stop
      win.querySelector('#pdb-estop').onclick=()=>{
        alert("⚠ Emergency Stop Activated!");
        fetch('/api/powerdb/estop',{method:'POST'});
      };

      // Mode toggle
      const modeBtn = win.querySelector('#pdb-mode');
      modeBtn.onclick=()=>{
        const isAuto = modeBtn.textContent.includes("Auto");
        modeBtn.textContent = "Mode: "+(isAuto?"Manual":"Auto");
        modeBtn.classList.toggle("on",!isAuto);
        fetch('/api/powerdb/mode',{
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({mode:isAuto?"Manual":"Auto"})
        });
      };
    }
  };

  if(window.AppRegistry){
    AppRegistry.registerApp({
      id:'powerdb',
      name:'PowerDB',
      icon:"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect x='4' y='8' width='40' height='28' rx='4' fill='%232c3e50'/><circle cx='16' cy='22' r='6' fill='%23e74c3c'/><circle cx='32' cy='22' r='6' fill='%232ecc71'/></svg>",
      handler:()=>window.PowerDB.open()
    });
  }
})();

/* 
======================================================
HAL MOCK BACKEND (Node.js + Express)
======================================================
const express = require('express');
const app = express();
app.use(express.json());

let breakers = { Main:"OFF", AC:"OFF", Lights:"OFF", Sockets:"OFF", Gen:"OFF", Aux:"OFF" };
let mode = "Auto";
let estop = false;

app.get('/api/powerdb/status',(req,res)=>{
  res.json({
    voltage:230,
    current:12.5,
    power:2.8,
    freq:50.0,
    vl1:231, vl2:229, vl3:230,
    i1:12.1, i2:11.9, i3:12.3,
    pf:0.97,
    kwh:1250,
    grid:true,
    status:"OK"
  });
});

app.post('/api/powerdb/breaker',(req,res)=>{
  const { breaker, state } = req.body;
  breakers[breaker] = state;
  console.log(\`Breaker \${breaker} -> \${state}\`);
  res.json({ ok:true, breakers });
});

app.post('/api/powerdb/mode',(req,res)=>{
  mode = req.body.mode;
  console.log(\`Mode set to \${mode}\`);
  res.json({ ok:true, mode });
});

app.post('/api/powerdb/estop',(req,res)=>{
  estop = true;
  console.log("⚠ Emergency Stop Triggered");
  res.json({ ok:true, estop });
});

app.listen(3000,()=>console.log("HAL PowerDB running on :3000"));
======================================================
END HAL MOCK
======================================================
*/
