(function(){
const P = {
    db: null, ref: null, iv: null, pos: null, spd: 0, sid: null, app: null, bnds: null, dev: 'Unknown', zm: 14,
    
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
        return new Promise((r,j)=>{
            if(window.firebase) return r();
            const s1 = document.createElement('script');
            s1.src='https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js';
            s1.onload=()=>{
                const s2=document.createElement('script');
                s2.src='https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js';
                s2.onload=r; s2.onerror=j;
                document.head.appendChild(s2);
            };
            s1.onerror=j;
            document.head.appendChild(s1);
        });
    },

    genID(){return Math.random().toString(36).substring(2,10).toUpperCase()},

    open(){
        const h = `<style>.tc{font-family:Arial,sans-serif;background:#1a1a3e;color:#fff;padding:0;display:flex;flex-direction:column;align-items:center;height:100%;overflow-y:auto}.hd{width:100%;padding:16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,.1)}.nm{font-size:20px;font-weight:700}.bt{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:18px;border:1px solid rgba(32,201,151,.3);background:rgba(32,201,151,.12)}.bti{font-size:16px;color:#20c997}.btp{font-weight:700;color:#20c997;font-size:14px}.sc{position:relative;width:100%;max-width:340px;height:170px;margin:20px 0 10px}.sf{width:100%;height:100%;border-radius:170px 170px 0 0;background:radial-gradient(ellipse at 50% 100%,#2a2a4a 0%,#1a1a3e 100%);border:5px solid #3a3a5a;border-bottom:none;overflow:hidden;position:relative}.sn{position:absolute;bottom:0;left:50%;width:4px;height:120px;background:linear-gradient(to top,#ff4757,#ff6b7a);transform-origin:50% 100%;border-radius:2px 2px 0 0;box-shadow:0 0 10px rgba(255,71,87,.6);transform:translate(-50%,0) rotate(-90deg);transition:transform .6s cubic-bezier(.4,0,.2,1);z-index:10}.sp{position:absolute;bottom:-8px;left:50%;width:16px;height:16px;border-radius:50%;background:radial-gradient(circle,#ff4757,#cc3846);border:3px solid #1a1a3e;transform:translateX(-50%);box-shadow:0 0 10px rgba(255,71,87,.8);z-index:11}.gm{position:absolute;width:100%;height:100%;top:0;left:0;pointer-events:none}.sd{position:absolute;bottom:15px;left:50%;transform:translateX(-50%);text-align:center;background:rgba(26,26,62,.85);padding:8px 18px;border-radius:10px;border:1px solid rgba(32,201,151,.3)}.sv{font-size:48px;font-weight:700;color:#20c997;line-height:1;letter-spacing:-1px}.su{font-size:12px;color:#7a7a9a;margin-top:2px;font-weight:600}.lc{margin:10px 16px;text-align:center;background:rgba(32,201,151,.08);padding:12px 16px;border-radius:10px;border:1px solid rgba(32,201,151,.2)}.ll{font-size:11px;color:#7a7a9a;font-weight:600;text-transform:uppercase;letter-spacing:1px}.lv{font-weight:700;font-size:16px;color:#20c997}.lt{font-size:14px;color:#7a7a9a;margin-top:4px;font-weight:500}.mc{position:relative;width:320px;height:180px;margin:10px auto;border-radius:12px;overflow:hidden;border:2px solid rgba(32,201,151,.3);background:#2a2a4a}.mi{width:100%;height:100%;object-fit:cover;display:block}.dt{position:absolute;width:12px;height:12px;border-radius:50%;background:red;transform:translate(-50%,-50%);box-shadow:0 0 6px rgba(255,0,0,.7);transition:left .5s,top .5s;z-index:5}.stb{width:100%;padding:14px;background:#4ecca3;color:#000;border:none;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;margin-bottom:12px}.st{padding:12px;background:#16213e;border-radius:8px;color:#aaa}.hs{font-size:24px;color:#7a7a9a;cursor:pointer;transition:color .3s}.hs.op{color:#4ecca3}.sdd{background:#0f3460;border:2px solid #4ecca3;border-radius:8px;padding:20px;margin:16px;text-align:center;display:none;margin-bottom:20px}.ct{font-size:36px;font-weight:700;color:#4ecca3;letter-spacing:4px;margin:12px 0}.cb{padding:8px 16px;background:#4ecca3;color:#000;border:none;border-radius:6px;font-weight:600;cursor:pointer;font-size:13px}.mcs{display:flex;justify-content:center;gap:15px;margin-top:15px;padding-top:15px;border-top:1px dashed rgba(78,204,163,.3)}.mb{padding:8px 12px;font-size:14px;border-radius:6px;background:rgba(32,201,151,.15);color:#20c997;border:1px solid rgba(32,201,151,.3);cursor:pointer;font-weight:600;transition:background .3s}</style>
        <div class="tc">
            <div id="ss" class="su">
                <h3 style="margin:0 0 16px 0;color:#4ecca3;text-align:center">Gnoke Tracker</h3>
                <button id="gb" class="stb">Start Broadcasting</button>
                <div id="stx" class="st">Ready to start broadcasting...</div>
            </div>
            <div id="bs" style="display:none;width:100%">
                <div class="hd">
                    <div class="nm" id="dm">DEVICE</div>
                    <div style="display:flex;align-items:center;gap:12px">
                        <div class="bt">
                            <svg class="bti" width="16" height="16" viewBox="0 0 24 24">
                                <rect x="2" y="6" width="18" height="12" rx="2" fill="none" stroke="#20c997" stroke-width="2"/>
                                <rect x="20" y="10" width="2" height="4" fill="#20c997"/>
                            </svg>
                            <span class="btp" id="bl">--</span>
                        </div>
                        <span class="hs" id="si">⚙️</span>
                    </div>
                </div>
                <div id="sdd" class="sdd">
                    <div style="font-size:13px;color:#aaa;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">Share This Code</div>
                    <div class="ct" id="dc">------</div>
                    <button class="cb" id="ccb">Copy Code</button>
                    <div class="mcs">
                                              
        
        
        <button class="mb" id="rb">🔄 Recenter</button>
                        <button class="mb" id="zo">Zoom -</button>
                        <button class="mb" id="zi">Zoom +</button>
                        <button class="mb" id="stpb" style="background:rgba(231,76,60,.2);color:#e74c3c;border-color:rgba(231,76,60,.4)">🛑 Stop</button>
                    </div>
                </div>
                <div class="sc">
                    <div class="sf">
                        <svg class="gm" viewBox="0 0 200 100">
                            <text x="20" y="85" fill="#7a7a9a" font-size="10" font-weight="600">0</text>
                            <text x="48" y="38" fill="#7a7a9a" font-size="10" font-weight="600">20</text>
                            <text x="73" y="18" fill="#7a7a9a" font-size="10" font-weight="600">40</text>
                            <text x="100" y="12" fill="#7a7a9a" font-size="10" font-weight="600">60</text>
                            <text x="127" y="18" fill="#7a7a9a" font-size="10" font-weight="600">80</text>
                            <text x="147" y="38" fill="#7a7a9a" font-size="10" font-weight="600">100</text>
                            <text x="172" y="85" fill="#7a7a9a" font-size="10" font-weight="600">120</text>
                        </svg>
                        <div class="sn" id="sn"></div>
                        <div class="sp"></div>
                        <div class="sd">
                            <div class="sv" id="svl">0</div>
                            <div class="su">KM/H</div>
                        </div>
                    </div>
                </div>
                <div class="lc">
                    <span class="ll">Location</span>
                    <div class="lv" id="lv">Acquiring GPS...</div>
                    <div class="lt" id="ltn">Loading...</div>
                </div>
                <div class="mc">
                    <img id="mi" class="mi" src="" alt="Map">
                    <div id="md" class="dt"></div>
                </div>
            </div>
        </div>`;

        const w = window.WindowManager.createWindow('Gnoke Tracker', h, 400, 680);
        w.querySelector('#gb').onclick = () => this.start(w);
        w.querySelector('#si').onclick = () => this.tog(w);
        return w;
    },

    tog(w){
        const s = w.querySelector('#sdd'), i = w.querySelector('#si');
        const h = !s.style.display || s.style.display === 'none';
        s.style.display = h ? 'block' : 'none';
        i.classList.toggle('op', h);
    },

    async start(w){
        try{
            this.upSt(w,'Initializing...');
            await this.initFB();
            this.sid = this.genID();
            this.ref = this.db.ref('tracker-sessions/'+this.sid);
            await this.ref.set({createdAt: firebase.database.ServerValue.TIMESTAMP, status:'active', data:{battery:null,gps:null,speed:0,timestamp:null}});
            this.dev = this.getDev();
            this.upSt(w,'Starting...');
            this.mon(w);
            w.querySelector('#ss').style.display = 'none';
            w.querySelector('#bs').style.display = 'block';
            w.querySelector('#dm').textContent = this.dev;
            w.querySelector('#dc').textContent = this.sid;
            w.querySelector('#ccb').onclick = () => this.copy(w);
            w.querySelector('#stpb').onclick = () => this.stop(w);
            w.querySelector('#rb').onclick = () => this.rec(w);
            w.querySelector('#zi').onclick = () => this.chz(w,1);
            w.querySelector('#zo').onclick = () => this.chz(w,-1);

            // Background-aware broadcasting using Page Visibility API
            const broadcast = async () => {
                if (!document.hidden) await this.bcast(w);
            };
            this.iv = setInterval(broadcast, 2000);

        } catch(e){
            this.upSt(w,'Error: '+e.message);
            console.error(e);
        }
    },

    copy(w){
        const c = this.sid;
        navigator.clipboard.writeText(c).then(()=>{
            const b = w.querySelector('#ccb'), t = b.textContent;
            b.textContent = 'Copied!';
            b.style.background = '#2ecc71';
            setTimeout(()=>{b.textContent=t; b.style.background='#4ecca3'},2000);
        }).catch(()=>{
            const t = document.createElement('textarea');
            t.value = c;
            document.body.appendChild(t);
            t.select();
            document.execCommand('copy');
            document.body.removeChild(t);
        });
    },

    stop(w){
        if(this.iv){clearInterval(this.iv); this.iv=null;}
        if(this.ref){this.ref.update({status:'ended'}).catch(e=>console.error(e)); this.ref=null;}
        w.querySelector('#ss').style.display='block';
        w.querySelector('#bs').style.display='none';
        this.sid = null;
        this.bnds = null;
        this.zm = 14;
        this.upSt(w,'Stopped');
    },

    async mon(w){
        if('getBattery' in navigator){
            const b = await navigator.getBattery();
            const u = ()=>w.querySelector('#bl').textContent = Math.round(b.level*100)+'%';
            u();
            b.addEventListener('levelchange', u);
        } else w.querySelector('#bl').textContent='N/A';

        if('geolocation' in navigator){
            navigator.geolocation.watchPosition((p)=>{
                this.pos = p;
                const lt = p.coords.latitude.toFixed(6), ln = p.coords.longitude.toFixed(6);
                this.spd = p.coords.speed!==null&&p.coords.speed>=0 ? p.coords.speed*3.6 : 0;
                const s = Math.min(Math.round(this.spd),120), r = -90+(s/120)*180;
                w.querySelector('#sn').style.transform=`translate(-50%,0) rotate(${r}deg)`;
                w.querySelector('#svl').textContent = s;
                const cp={lat:p.coords.latitude,lng:p.coords.longitude};
                if(!this.bnds || !this.inB(cp,this.bnds)) this.upM(w,cp.lat,cp.lng);
                const {x,y} = this.l2p(cp,this.bnds);
                w.querySelector('#md').style.left=`${x}px`;
                w.querySelector('#md').style.top=`${y}px`;
                if(Math.random()<.25) this.getLoc(w,cp.lat,cp.lng);
                else{
                    w.querySelector('#lv').textContent=`Lat:${lt}, Lng:${ln}`;
                    if(w.querySelector('#ltn').textContent==='Loading...') w.querySelector('#ltn').textContent='Acquiring location name...';
                }
            }, e=>{console.error(e); w.querySelector('#lv').textContent='GPS unavailable'; w.querySelector('#ltn').textContent='Check settings'},
            {enableHighAccuracy:true,maximumAge:0,timeout:10000});
        } else w.querySelector('#lv').textContent='Not available';
    },

    async bcast(w){
        if(!this.ref) return;
        const b = 'getBattery' in navigator ? await navigator.getBattery() : null;
        const d = {
            battery: b ? Math.round(b.level*100) : null,
            gps: this.pos ? {lat:this.pos.coords.latitude, lon:this.pos.coords.longitude, accuracy:this.pos.coords.accuracy} : null,
            speed: Math.round(this.spd),
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };
        try{await this.ref.child('data').set(d);}catch(e){console.error(e);}
    },

    rec(w){this.bnds=null; if(this.pos) this.upM(w,this.pos.coords.latitude,this.pos.coords.longitude);},
    chz(w,d){this.zm=Math.max(1,Math.min(18,this.zm+d)); if(this.pos) this.upM(w,this.pos.coords.latitude,this.pos.coords.longitude);},
    upM(w,lt,ln){this.bnds=this.getB(lt,ln,this.zm); w.querySelector('#mi').src=this.getU(lt,ln,this.zm);},

    async getLoc(w,lt,ln){
        try{
            const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lt}&lon=${ln}&zoom=18`);
            const d = await r.json(); const a=d.address||{};
            let p='', s='';
            const rd=a.road||a.street, h=a.house_number||a.building;
            if(rd) p=h?`${h}, ${rd}`:rd;
            if(!p) p=a.neighbourhood||a.suburb||a.village||a.town||a.city||'Unknown Area';
            const tc=a.town||a.city||a.suburb, lg=a.county||a.state||'';
            s = tc&&lg?`${tc}, ${lg.replace('LGA','').trim()}`:tc||lg.replace('LGA','').trim()||'Area Identified';
            w.querySelector('#lv').textContent=p;
            w.querySelector('#ltn').textContent=s;
        }catch(e){
            console.error(e);
            w.querySelector('#lv').textContent=`Lat:${lt.toFixed(6)}, Lng:${ln.toFixed(6)}`;
            w.querySelector('#ltn').textContent='Location lookup failed';
        }
    },

    getDev(){
        const u = navigator.userAgent;
        if(/Android/i.test(u)){
            const m = u.match(/Android [^;]+; ([^)]+)\)/);
            if(m&&m[1]){
                let d = m[1].split(';')[0].split('Build/')[0].trim();
                if(d.length>3 && !/Linux|Mobile|Tablet|Pixel/i.test(d)) return d;
            }
            return 'Android Device';
        }
        if(/iPhone|iPod/.test(u)) return 'iPhone';
        if(/iPad/.test(u)) return 'iPad';
        if(/Windows Phone/.test(u)) return 'Windows Phone';
        if(/Macintosh/.test(u)) return 'Mac/PC Browser';
        if(/Windows/.test(u)) return 'Windows PC Browser';
        return 'Unknown Device';
    },

    upSt(w,m){const s=w.querySelector('#stx'); if(s) s.textContent=m;},
    getU(lt,ln,z){const x=Math.floor((ln+180)/360*Math.pow(2,z)),y=Math.floor((1-Math.log(Math.tan(lt*Math.PI/180)+1/Math.cos(lt*Math.PI/180))/Math.PI)/2*Math.pow(2,z)); return`https://tile.openstreetmap.org/${z}/${x}/${y}.png`;},
    getB(lt,ln,z){const d=360/(256*Math.pow(2,z)), dlg=160*d, dla=90*d; return{latMin:lt-dla, latMax:lt+dla, lngMin:ln-dlg, lngMax:ln+dlg};},
    inB(p,b){return p.lat>=b.latMin && p.lat<=b.latMax && p.lng>=b.lngMin && p.lng<=b.lngMax;},
    l2p(p,b){const x=((p.lng-b.lngMin)/(b.lngMax-b.lngMin))*320, y=(1-(p.lat-b.latMin)/(b.latMax-b.latMin))*180; return{x,y};}
};

window.P2PHostApp = P;

// Register with AppRegistry if available
if(window.AppRegistry) window.AppRegistry.registerApp({
    id:'gnoke-tracker',
    name:'GNOKE TRACKER',
    icon:"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><circle cx='24' cy='24' r='18' fill='%234ecca3'/><path d='M24 12 L24 36 M12 24 L36 24' stroke='%23000' stroke-width='3'/><circle cx='24' cy='24' r='4' fill='%23000'/></svg>",
    handler: ()=>P.open(),
    singleInstance:true
});
})();
        