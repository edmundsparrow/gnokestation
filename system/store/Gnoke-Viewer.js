(function(){
    const V = {
        db: null,
        ref: null,
        iv: null,
        sid: null,
        app: null,
        bnds: null,
        zm: 14,
        
        async initFB(){
            if(!window.firebase) await this.loadFB();
            const c = {
                apiKey: "AIzaSyBJfIsGRnFyOGAXQn38JA0EkNYrA30gtUw",
                authDomain: "gnokestation.firebaseapp.com",
                projectId: "gnokestation",
                databaseURL: "https://gnokestation-default-rtdb.firebaseio.com"
            };
            this.app = firebase.apps.length ? firebase.apps[0] : firebase.initializeApp(c);
            this.db = firebase.database();
        },
        
        loadFB(){
            return new Promise((resolve,reject)=>{
                if(window.firebase) return resolve();
                const s1 = document.createElement('script');
                s1.src='https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js';
                s1.onload=()=>{
                    const s2=document.createElement('script');
                    s2.src='https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js';
                    s2.onload=resolve;
                    s2.onerror=reject;
                    document.head.appendChild(s2);
                };
                s1.onerror=reject;
                document.head.appendChild(s1);
            });
        },

        open(){
            const h = `<style>
.tc{font-family:Arial,sans-serif;background:#1a1a3e;color:#fff;padding:0;display:flex;flex-direction:column;align-items:center;height:100%;overflow-y:auto}
.hd{width:100%;padding:16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,.1)}
.nm{font-size:20px;font-weight:700}
.bt{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:18px;border:1px solid rgba(32,201,151,.3);background:rgba(32,201,151,.12)}
.bti{font-size:16px;color:#20c997}
.btp{font-weight:700;color:#20c997;font-size:14px}
.mbtg{padding:6px 10px;font-size:14px;background:rgba(32,201,151,.12);border:none;border-radius:6px;color:#20c997;cursor:pointer}
.sc{position:relative;width:100%;max-width:340px;height:170px;margin:20px 0 10px}
.sf{width:100%;height:100%;border-radius:170px 170px 0 0;background:radial-gradient(ellipse at 50% 100%,#2a2a4a 0%,#1a1a3e 100%);border:5px solid #3a3a5a;border-bottom:none;overflow:hidden;position:relative}
.sn{position:absolute;bottom:0;left:50%;width:4px;height:120px;background:linear-gradient(to top,#ff4757,#ff6b7a);transform-origin:50% 100%;border-radius:2px 2px 0 0;box-shadow:0 0 10px rgba(255,71,87,.6);transform:translate(-50%,0) rotate(-90deg);transition:transform .6s cubic-bezier(.4,0,.2,1);z-index:10}
.sp{position:absolute;bottom:-8px;left:50%;width:16px;height:16px;border-radius:50%;background:radial-gradient(circle,#ff4757,#cc3846);border:3px solid #1a1a3e;transform:translateX(-50%);box-shadow:0 0 10px rgba(255,71,87,.8);z-index:11}
.gm{position:absolute;width:100%;height:100%;top:0;left:0;pointer-events:none}
.sd{position:absolute;bottom:15px;left:50%;transform:translateX(-50%);text-align:center;background:rgba(26,26,62,.85);padding:8px 18px;border-radius:10px;border:1px solid rgba(32,201,151,.3)}
.sv{font-size:48px;font-weight:700;color:#20c997;line-height:1;letter-spacing:-1px}
.su{font-size:12px;color:#7a7a9a;margin-top:2px;font-weight:600}
.lc{margin:10px 16px;text-align:center;background:rgba(32,201,151,.08);padding:12px 16px;border-radius:10px;border:1px solid rgba(32,201,151,.2)}
.ll{font-size:11px;color:#7a7a9a;font-weight:600;text-transform:uppercase;letter-spacing:1px}
.lv{font-weight:700;font-size:16px;color:#20c997}
.lt{font-size:14px;color:#7a7a9a;margin-top:4px;font-weight:500}
.mc{position:relative;width:320px;height:180px;margin:10px auto;border-radius:12px;overflow:hidden;border:2px solid rgba(32,201,151,.3);background:#2a2a4a}
.mi{width:100%;height:100%;object-fit:cover;display:block}
.dt{position:absolute;width:12px;height:12px;border-radius:50%;background:red;transform:translate(-50%,-50%);box-shadow:0 0 6px rgba(255,0,0,.7);transition:left .5s,top .5s;z-index:5}
.mcs{display:flex;justify-content:center;gap:15px;margin-top:15px;padding-top:15px;border-top:1px dashed rgba(78,204,163,.3)}
.mb{padding:8px 12px;font-size:14px;border-radius:6px;background:rgba(32,201,151,.15);color:#20c997;border:1px solid rgba(32,201,151,.3);cursor:pointer;font-weight:600;transition:background .3s}
.stb{width:100%;padding:14px;background:#4ecca3;color:#000;border:none;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;margin-bottom:12px}
.st{padding:12px;background:#16213e;border-radius:8px;color:#aaa}
.inp{width:100%;padding:12px;background:#16213e;border:2px solid rgba(78,204,163,.3);border-radius:8px;color:#4ecca3;font-size:18px;text-align:center;letter-spacing:3px;font-weight:600;margin-bottom:12px;text-transform:uppercase}
</style>

<div class="tc">
    <div id="ss" class="su" style="width:100%;padding:20px;box-sizing:border-box">
        <h3 style="margin:0 0 16px 0;color:#4ecca3;text-align:center">Gnoke Viewer</h3>
        <input id="ci" class="inp" placeholder="ENTER CODE" maxlength="8">
        <button id="cb" class="stb">Connect</button>
        <div id="stx" class="st">Enter tracking code to view...</div>
    </div>
    <div id="bs" style="display:none;width:100%">
        <div class="hd">
            <div class="nm" id="dm">VIEWING</div>
            <div style="display:flex;align-items:center;gap:8px">
                <div class="bt">
                    <svg class="bti" width="16" height="16" viewBox="0 0 24 24">
                        <rect x="2" y="6" width="18" height="12" rx="2" fill="none" stroke="#20c997" stroke-width="2"/>
                        <rect x="20" y="10" width="2" height="4" fill="#20c997"/>
                    </svg>
                    <span class="btp" id="bl">--</span>
                </div>
                <button class="mbtg" id="tgb">👁️</button>
            </div>
        </div>
        <div class="sc">
            <div class="sf">
                <svg class="gm" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid meet">
                    <text x="12" y="92" fill="#7a7a9a" font-size="10" font-weight="600">0</text>
                    <text x="35" y="50" fill="#7a7a9a" font-size="10" font-weight="600">20</text>
                    <text x="65" y="25" fill="#7a7a9a" font-size="10" font-weight="600">40</text>
                    <text x="95" y="15" fill="#7a7a9a" font-size="10" font-weight="600">60</text>
                    <text x="125" y="25" fill="#7a7a9a" font-size="10" font-weight="600">80</text>
                    <text x="155" y="50" fill="#7a7a9a" font-size="10" font-weight="600">100</text>
                    <text x="178" y="92" fill="#7a7a9a" font-size="10" font-weight="600">120</text>
                </svg>
                <div class="sn" id="sn"></div>
                <div class="sp"></div>
                <div class="sd">
                    <div class="sv" id="svl">0</div>
                    <div class="su">KM/H</div>
                </div>
            </div>
        </div>
        <div class="lc" id="gsc">
            <span class="ll">GPS Speed</span>
            <div class="lv" id="gs">0 km/h</div>
            <div class="lt" id="ga">Accuracy: --</div>
        </div>
        <div class="lc">
            <span class="ll">Location</span>
            <div class="lv" id="lv">Waiting for data...</div>
            <div class="lt" id="ltn">Connecting...</div>
        </div>
        <div class="mc" id="mpc">
            <img id="mi" class="mi" src="" alt="Map">
            <div id="md" class="dt"></div>
        </div>
        <div class="mcs">
            <button class="mb" id="rb">🔄 Refresh</button>
            <button class="mb" id="zo">Zoom -</button>
            <button class="mb" id="zi">Zoom +</button>
            <button class="mb" id="stpb" style="background:rgba(231,76,60,.2);color:#e74c3c;border-color:rgba(231,76,60,.4)">⏸ Stop</button>
        </div>
    </div>
</div>`;

            const w = window.WindowManager.createWindow('Gnoke Viewer', h, 400, 720);
            w.querySelector('#cb').onclick = () => this.connect(w);
            w.querySelector('#ci').addEventListener('keypress', (e) => {
                if(e.key === 'Enter') this.connect(w);
            });
            return w;
        },

        async connect(w){
            const code = w.querySelector('#ci').value.trim().toUpperCase();
            if(!code || code.length < 6){
                this.upSt(w, 'Please enter a valid code');
                return;
            }
            try{
                this.upSt(w, 'Connecting...');
                await this.initFB();
                this.sid = code;
                this.ref = this.db.ref('tracker-sessions/'+this.sid);
                
                const snap = await this.ref.once('value');
                if(!snap.exists()){
                    this.upSt(w, 'Invalid code. Session not found.');
                    return;
                }
                
                const data = snap.val();
                if(data.status === 'ended'){
                    this.upSt(w, 'This session has ended.');
                    return;
                }

                w.querySelector('#ss').style.display = 'none';
                w.querySelector('#bs').style.display = 'block';
                w.querySelector('#dm').textContent = 'VIEWING';
                w.querySelector('#stpb').onclick = () => this.stop(w);
                w.querySelector('#rb').onclick = () => this.rec(w);
                w.querySelector('#zi').onclick = () => this.chz(w,1);
                w.querySelector('#zo').onclick = () => this.chz(w,-1);
                w.querySelector('#tgb').onclick = () => this.toggle(w);
                
                this.watch(w);
            } catch(e){
                this.upSt(w, 'Error: '+e.message);
                console.error(e);
            }
        },

        watch(w){
            this.ref.child('data').on('value', (snap)=>{
                const d = snap.val();
                if(!d) return;
                
                if(d.battery !== null){
                    w.querySelector('#bl').textContent = d.battery+'%';
                }
                
                if(d.device){
                    w.querySelector('#dm').textContent = d.device;
                }
                
                if(d.gps){
                    const lt = d.gps.lat;
                    const ln = d.gps.lon;
                    const acc = d.gps.accuracy;
                    const s = d.speed || 0;
                    
                    w.querySelector('#gs').textContent = s + ' km/h';
                    w.querySelector('#ga').textContent = 'Accuracy: ' + (acc ? acc.toFixed(1) + 'm' : 'N/A');
                    
                    const r = -90+(Math.min(s,120)/120)*180;
                    w.querySelector('#sn').style.transform=`translate(-50%,0) rotate(${r}deg)`;
                    w.querySelector('#svl').textContent = s;
                    
                    const cp={lat:lt,lng:ln};
                    if(!this.bnds || !this.inB(cp,this.bnds)) this.upM(w,lt,ln);
                    const {x,y} = this.l2p(cp,this.bnds);
                    w.querySelector('#md').style.left=`${x}px`;
                    w.querySelector('#md').style.top=`${y}px`;
                    
                    if(Math.random()<.2) this.getLoc(w,lt,ln);
                    else{
                        w.querySelector('#lv').textContent=`Lat:${lt.toFixed(6)}, Lng:${ln.toFixed(6)}`;
                    }
                }
            });
            
            this.ref.child('status').on('value', (snap)=>{
                if(snap.val() === 'ended'){
                    w.querySelector('#ltn').textContent = 'Session ended by broadcaster';
                    if(this.iv) clearInterval(this.iv);
                }
            });
        },

        stop(w){
            if(this.ref){
                this.ref.off();
                this.ref = null;
            }
            if(this.iv){
                clearInterval(this.iv);
                this.iv=null;
            }
            w.querySelector('#ss').style.display='block';
            w.querySelector('#bs').style.display='none';
            w.querySelector('#ci').value = '';
            this.sid = null;
            this.bnds = null;
            this.zm = 14;
            this.upSt(w,'Disconnected');
        },

        toggle(w){
            const gsc = w.querySelector('#gsc');
            const mpc = w.querySelector('#mpc');
            const isHidden = gsc.style.display === 'none';
            gsc.style.display = isHidden ? 'block' : 'none';
            mpc.style.display = isHidden ? 'block' : 'none';
        },

        rec(w){
            this.bnds=null;
            if(this.ref){
                this.ref.child('data/gps').once('value').then(s=>{
                    const g=s.val();
                    if(g) this.upM(w,g.lat,g.lon);
                });
            }
        },

        chz(w,d){
            this.zm=Math.max(1,Math.min(18,this.zm+d));
            if(this.ref){
                this.ref.child('data/gps').once('value').then(s=>{
                    const g=s.val();
                    if(g) this.upM(w,g.lat,g.lon);
                });
            }
        },

        upM(w,lt,ln){
            this.bnds=this.getB(lt,ln,this.zm);
            w.querySelector('#mi').src=this.getU(lt,ln,this.zm);
        },

        async getLoc(w,lt,ln){
            try{
                const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lt}&lon=${ln}&zoom=18`);
                const d = await r.json();
                const a=d.address||{};
                let p='', s='';
                const rd=a.road||a.street;
                const h=a.house_number||a.building;
                if(rd) p=h?`${h}, ${rd}`:rd;
                if(!p) p=a.neighbourhood||a.suburb||a.village||a.town||a.city||'Unknown Area';
                const tc=a.town||a.city||a.suburb;
                const lg=a.county||a.state||'';
                s = tc&&lg?`${tc}, ${lg.replace('LGA','').trim()}`:tc||lg.replace('LGA','').trim()||'Area Identified';
                w.querySelector('#lv').textContent=p;
                w.querySelector('#ltn').textContent=s;
            }catch(e){
                console.error(e);
                w.querySelector('#lv').textContent=`Lat:${lt.toFixed(6)}, Lng:${ln.toFixed(6)}`;
                w.querySelector('#ltn').textContent='Location lookup failed';
            }
        },

        upSt(w,m){
            const s=w.querySelector('#stx');
            if(s) s.textContent=m;
        },

        getU(lt,ln,z){
            const x=Math.floor((ln+180)/360*Math.pow(2,z));
            const y=Math.floor((1-Math.log(Math.tan(lt*Math.PI/180)+1/Math.cos(lt*Math.PI/180))/Math.PI)/2*Math.pow(2,z));
            return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
        },

        getB(lt,ln,z){
            const d = 360 / (256 * Math.pow(2,z));
            const dlg = 160 * d;
            const dla = 90 * d;
            return {
                latMin: lt - dla,
                latMax: lt + dla,
                lngMin: ln - dlg,
                lngMax: ln + dlg
            };
        },

        inB(p,b){
            return p.lat >= b.latMin && p.lat <= b.latMax && p.lng >= b.lngMin && p.lng <= b.lngMax;
        },

        l2p(p,b){
            const x = ((p.lng - b.lngMin) / (b.lngMax - b.lngMin)) * 320;
            const y = (1 - (p.lat - b.latMin) / (b.latMax - b.latMin)) * 180;
            return { x, y };
        }
    };

    window.P2PViewerApp = V;

    if(window.AppRegistry){
        window.AppRegistry.registerApp({
            id: 'gnoke-viewer',
            name: 'GNOKE VIEWER',
            icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect x='8' y='12' width='32' height='24' rx='2' fill='%23e74c3c'/><circle cx='24' cy='24' r='6' fill='%23fff'/><path d='M24 18 L24 14 M24 34 L24 30 M18 24 L14 24 M34 24 L30 24' stroke='%23fff' stroke-width='2'/></svg>",
            handler: () => V.open(),
            singleInstance: true
        });
    }
})();
