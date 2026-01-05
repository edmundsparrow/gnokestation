/**
 * Gnokefiles + FileSys - Fixed File Opening Integration
 * Copyright (C) 2025 Ekong Ikpe <ekongmikpe@gmail.com>
 * LICENSE: GPL-3.0
 * VERSION: 6.1.2 (Fixed File Opening)
 */

(function() {
'use strict';

// ============================================================================
// 1. APP METADATA REGISTRY (Single Source of Truth)
// ============================================================================
const APP_META = {
     gnokepad: {name:'Gnokepad', icon:'📝', ext:['.txt','.md','.markdown','.log','.rtf','.csv']},
//  gnokeeditor: {name:'GnokeEditor', icon:'🧩', ext:['.txt','.md','.svg','.log','.rtf','.csv','.html','.htm','.css','.scss','.js','.mjs','.json','.php','.py','.rb','.sh','.bat','.ps1','.xml','.yaml','.yml','.ini','.conf','.c','.cpp','.h','.hpp','.java','.kt','.cs','.go','.rs','.swift','.ts','.tsx','.jsx','.env','.gitignore']},
  gnokebrowser: {name:'Browser', icon:'🌐', ext:['.html','.htm','.xhtml','.xml','.svg','.mhtml','.php','.asp','.aspx','.jsp','.json','.txt']},
  gallery: {name:'Gallery', icon:'🖼️', ext:['.jpg','.png','.gif','.svg','.webp','.jpeg']},
  // video: {name:'Video Player', icon:'🎬', ext:['.mp4','.webm','.avi','.mov']},
//  audioplayer: {name:'Audio Player', icon:'🎵', ext:['.mp3','.wav','.ogg','.m4a']},
  gnokepdf: {name:'Gnoke PDF', icon:'📕', ext:['.pdf']},
 // calculator: {name:'Calculator', icon:'🔢', ext:[]},
 // terminal: {name:'Terminal', icon:'⌨️', ext:['.sh','.bat','.cmd']}
};

// ============================================================================
// 2. UTILITY FUNCTIONS
// ============================================================================
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => [...ctx.querySelectorAll(sel)];
const el = (tag, cls='', html='') => {
  const e = document.createElement(tag);
  if(cls) e.className = cls;
  if(html) e.innerHTML = html;
  return e;
};
const ext = name => (name.match(/\.[^.]+$/) || [''])[0].toLowerCase();
const clickOut = (elem, fn) => setTimeout(() => {
  const h = e => { if(!elem.contains(e.target)) { fn(); document.removeEventListener('click',h); }};
  document.addEventListener('click', h);
}, 10);

// ============================================================================
// 3. FILESYS - Enhanced File Association Service
// ============================================================================
window.FileSys = {
  handlers: new Map(),
  defaults: new Map(),
  
  init() {
    console.log('[FileSys] Init with metadata registry');
    Object.entries(APP_META).forEach(([id, meta]) => {
      meta.ext?.forEach(e => this.reg(e, id));
    });
    this.load();
  },
  
  reg(type, id) {
    const t = type.toLowerCase();
    if(!this.handlers.has(t)) this.handlers.set(t, []);
    const list = this.handlers.get(t);
    if(!list.includes(id)) {
      list.push(id);
      if(!this.defaults.has(t)) this.defaults.set(t, id);
    }
  },
  
  async open(file) {
    const e = ext(file.name);
    const id = this.defaults.get(e);
    return id ? this.openWith(file, id) : this.showNone(file);
  },
  
  async openWith(file, id) {
    if(!window.AppRegistry?.getApp(id)) {
      console.error('[FileSys] App not found:', id);
      return false;
    }
    
    // Get the app handler directly from AppRegistry
    const appConfig = window.AppRegistry.getApp(id);
    
    try {
      // Check if app has openFile method
      const appNamespace = id.toUpperCase().replace(/-/g, '') + 'App';
      const appInstance = window[appNamespace];
      
      if (appInstance?.openFile) {
        // Read file content
        const h = file.handle;
        const f = await h.getFile();
        const content = await f.text();
        
        // Call app's openFile method
        appInstance.openFile({
          name: file.name,
          content: content,
          handle: h,
          type: f.type,
          size: f.size
        });
        
        console.log('[FileSys] Opened', file.name, 'with', id);
        return true;
      } else {
        // Fallback: just open the app
        console.log('[FileSys] App has no openFile method, opening app:', id);
        if (appConfig.handler) {
          appConfig.handler();
          return true;
        }
      }
    } catch(err) {
      console.error('[FileSys] Open error:', err);
      alert(`Failed to open ${file.name}: ${err.message}`);
    }
    
    return false;
  },
  
  showDialog(file) {
    const e = ext(file.name);
    const apps = this.handlers.get(e) || [];
    if(!apps.length) return this.showNone(file);
    
    const items = apps.map(id => {
      const m = APP_META[id] || {name:id, icon:'📄'};
      const def = this.defaults.get(e) === id;
      return `
        <div class="fs-app" data-id="${id}" style="padding:10px;margin:4px 0;border:1px solid ${def?'#07f':'#ddd'};
          border-radius:4px;cursor:pointer;background:${def?'#e7f3ff':'white'};display:flex;align-items:center;gap:10px">
          <span style="font-size:24px">${m.icon}</span>
          <div style="flex:1"><b>${m.name}</b>${def?'<div style="font-size:11px;color:#666">Default</div>':''}</div>
        </div>`;
    }).join('');
    
    const html = `
      <div style="padding:20px;font-family:'Segoe UI',sans-serif">
        <h3 style="margin:0 0 10px">Open "${file.name}" with:</h3>
        <div style="max-height:300px;overflow-y:auto;border:1px solid #ddd;border-radius:4px;padding:8px">${items}</div>
        <div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end">
          <label style="flex:1;font-size:12px;display:flex;align-items:center;gap:6px">
            <input type="checkbox" id="fs-def">Set default for ${e}
          </label>
          <button id="fs-cancel" style="padding:8px 16px;border:1px solid #ddd;border-radius:4px;background:white;cursor:pointer">Cancel</button>
        </div>
      </div>`;
    
    const win = window.WindowManager.createWindow('Open With', html, 450, 400);
    
    $$('.fs-app', win).forEach(el => {
      el.onclick = async () => {
        const id = el.dataset.id;
        if($('#fs-def', win).checked) this.setDef(e, id);
        await this.openWith(file, id);
        $('.close-btn', win)?.click();
      };
      el.onmouseenter = () => el.style.background = '#f0f0f0';
      el.onmouseleave = () => el.style.background = this.defaults.get(e)===el.dataset.id ? '#e7f3ff' : 'white';
    });
    
    $('#fs-cancel', win).onclick = () => $('.close-btn', win)?.click();
  },
  
  showNone(file) {
    const e = ext(file.name);
    const html = `
      <div style="padding:20px;text-align:center;font-family:'Segoe UI',sans-serif">
        <div style="font-size:48px;margin-bottom:16px">📄</div>
        <h3 style="margin:0 0 10px">No App Found</h3>
        <p style="color:#666">No app can open <b>${e}</b> files</p>
        <button onclick="this.closest('.window').querySelector('.close-btn').click()" 
          style="margin-top:20px;padding:10px 20px;background:#07f;color:white;border:none;border-radius:4px;cursor:pointer">OK</button>
      </div>`;
    window.WindowManager.createWindow('Cannot Open', html, 350, 250);
  },
  
  setDef(type, id) {
    this.defaults.set(type.toLowerCase(), id);
    this.save();
    console.log('[FileSys] Default:', type, '→', id);
  },
  
  save() {
    try {
      localStorage.setItem('filesys-prefs', JSON.stringify({defaults:[...this.defaults]}));
    } catch(e) { console.error('[FileSys] Save failed:', e); }
  },
  
  load() {
    try {
      const data = localStorage.getItem('filesys-prefs');
      if(data) this.defaults = new Map(JSON.parse(data).defaults || []);
    } catch(e) { console.error('[FileSys] Load failed:', e); }
  }
};

// ============================================================================
// 4. GNOKEFILESYSTEM - The Core Move/Cut Logic
// ============================================================================
window.GnokeFileSystem = (function() {
  
  async function recursiveCopy(sourceDirHandle, destDirHandle) {
    for await (const [name, entry] of sourceDirHandle.entries()) {
      if (entry.kind === 'file') {
        const sourceFileHandle = await sourceDirHandle.getFileHandle(name);
        const file = await sourceFileHandle.getFile();
        const destFileHandle = await destDirHandle.getFileHandle(name, { create: true });
        const writable = await destFileHandle.createWritable();
        await writable.write(file);
        await writable.close();
      } else if (entry.kind === 'directory') {
        const destSubDirHandle = await destDirHandle.getDirectoryHandle(name, { create: true });
        await recursiveCopy(entry, destSubDirHandle);
      }
    }
  }

  return {
    recursiveCopy,
    async moveEntry(sourceHandle, sourceParentDirHandle, destDirHandle, newName) {
      const sourceEntryName = sourceHandle.name;
      const finalName = newName || sourceEntryName;
      
      if (sourceParentDirHandle === destDirHandle && finalName === sourceEntryName) return;

      if (sourceHandle.kind === 'file') {
        const file = await sourceHandle.getFile();
        const destFileHandle = await destDirHandle.getFileHandle(finalName, { create: true });
        const writable = await destFileHandle.createWritable();
        await writable.write(file);
        await writable.close();

      } else if (sourceHandle.kind === 'directory') {
        const destSubDirHandle = await destDirHandle.getDirectoryHandle(finalName, { create: true });
        await recursiveCopy(sourceHandle, destSubDirHandle);
      }

      await sourceParentDirHandle.removeEntry(sourceEntryName, { recursive: sourceHandle.kind === 'directory' });
    }
  };
})();

// ============================================================================
// 5. GNOKEfiles CORE
// ============================================================================
window.GnokefilesApp = {
  mode: 'local',
  root: null,
  path: [],
  clipboard: null,
  clipboardAction: null,
  
  async open(html) {
    const w = window.WindowManager.createWindow('Gnoke files', html, 800, 600);
    this.setup(w);
    this.setMode(w, 'local');
    return w;
  },
  
  setMode(w, m) {
    this.mode = m;
    const btn = $('#gf-mode', w);
    const view = $('#gf-view', w);
    
    if(m === 'cloud') {
      btn.textContent = '☁️ Cloud';
      btn.style.cssText = 'background:#07f;color:white';
      view.innerHTML = this.empty('cloud');
      this.status(w, 'Cloud mode (not implemented)');
      $('#gf-cloud', w).classList.add('sel');
      $('#gf-root', w).classList.remove('sel');
    } else {
      btn.textContent = '📂 Local';
      btn.style.cssText = 'background:#d0e0ff;color:#000';
      $('#gf-cloud', w).classList.remove('sel');
      if(this.root) {
        $('#gf-root', w).classList.add('sel');
        this.refresh(w);
      } else {
        view.innerHTML = this.empty('local');
        this.status(w, 'Click files to select folder');
      }
    }
  },
  
  setup(w) {
    $('#gf-cloud', w).onclick = () => this.setMode(w, 'cloud');
    $('#gf-up', w).onclick = () => this.goUp(w);
    $('#gf-refresh', w).onclick = () => this.refresh(w);
    $('#gf-mode', w).onclick = () => this.setMode(w, this.mode==='local'?'cloud':'local');
    $('#gf-files', w).onclick = () => this.selectfiles(w);
    $('#gf-root', w).onclick = () => this.root ? this.goRoot(w) : this.selectfiles(w);
    $('#gf-toggle', w).onclick = (e) => this.toggleDir(w, e.target.closest('.gf-tree'));
    
    const menu = $('#gf-menu', w), drop = $('#gf-drop', w);
    menu.onclick = e => { e.stopPropagation(); drop.style.display = drop.style.display==='block'?'none':'block'; };
    w.onclick = () => drop.style.display = 'none';
    
    $('#gf-newfolder', w).onclick = () => this.action(w, 'newfolder');
    $('#gf-newfile', w).onclick = () => this.action(w, 'newfile');
    $('#gf-copy', w).onclick = () => this.action(w, 'copy');
    $('#gf-cut', w).onclick = () => this.action(w, 'cut');
    $('#gf-paste', w).onclick = () => this.action(w, 'paste');
    $('#gf-rename', w).onclick = () => this.action(w, 'rename');
    $('#gf-delete', w).onclick = () => this.action(w, 'delete');
  },
  
  action(w, a) {
    $('#gf-drop', w).style.display = 'none';
    if(this.mode !== 'local' || !this.root) return this.status(w, 'Select files first');
    
    switch(a) {
      case 'newfolder': return this.newFolder(w);
      case 'newfile': return this.newFile(w);
      case 'copy': return this.copy(w);
      case 'cut': return this.cut(w);
      case 'paste': return this.paste(w);
      case 'rename': return this.rename(w);
      case 'delete': return this.delete(w);
    }
  },
  
  async selectfiles(w) {
    try {
      const h = await window.showDirectoryPicker({mode:'readwrite'});
      this.root = h;
      this.path = [{name:'Gnoke files', handle:h}];
      $('#gf-label', w).innerHTML = '💾 <b>Gnoke files</b>';
      this.setMode(w, 'local');
      const root = $('#gf-root', w);
      if(root.dataset.exp !== 'true') await this.toggleDir(w, root, h, []);
    } catch(e) {
      this.status(w, 'files selection cancelled');
    }
  },
  
  goRoot(w) {
    if(this.root) {
      this.path = [{name:'Gnoke files', handle:this.root}];
      this.refresh(w);
    }
  },
  
  async toggleDir(w, item, handle, path=[]) {
    if(!this.root && item.id==='gf-root') return this.status(w, 'Select files first');
    if(!this.root) return;
    
    const exp = item.dataset.exp === 'true';
    const children = $('.gf-children', item);
    const toggle = $('.gf-toggle', item);
    
    if(exp) {
      item.dataset.exp = 'false';
      children.style.display = 'none';
      toggle.textContent = '▶';
    } else {
      let h = this.root;
      if(path.length > 0) {
        try {
          for(const n of path) h = await h.getDirectoryHandle(n);
        } catch(e) {
          children.innerHTML = '<li style="padding:4px 0 4px 16px;color:#d33">Access Denied</li>';
          return;
        }
      }
      
      if(!children.children.length || children.firstElementChild.textContent.includes('Access')) {
        await this.renderTree(w, h, children, path);
      }
      
      item.dataset.exp = 'true';
      children.style.display = 'block';
      toggle.textContent = '▼';
    }
  },
  
  async renderTree(w, h, parent, path) {
    parent.innerHTML = '';
    const items = [];
    try {
      for await(const e of h.values()) if(e.kind==='directory') items.push(e);
      items.sort((a,b) => a.name.localeCompare(b.name));
      
      for(const e of items) {
        const p = path.concat(e.name);
        const li = el('li', 'gf-tree', `
          <div class="gf-line">
            <span class="gf-toggle">▶</span>
            <div class="gf-tree-content">📁 ${e.name}</div>
          </div>
          <ul class="gf-children"></ul>`);
        li.dataset.kind = 'directory';
        li.dataset.path = p.join('/');
        
        $('.gf-toggle', li).onclick = ev => { ev.stopPropagation(); this.toggleDir(w, li, h, p); };
        $('.gf-tree-content', li).onclick = () => this.navTree(w, li, p);
        parent.appendChild(li);
      }
    } catch(e) {
      parent.innerHTML = '<li style="padding:4px 0 4px 16px;color:#d33">Access Denied</li>';
    }
  },
  
  async navTree(w, item, path) {
    $$('.gf-tree', w).forEach(e => e.classList.remove('sel'));
    item.classList.add('sel');
    
    try {
      let h = this.root;
      let arr = [{name:'Gnoke files', handle:h}];
      for(const n of path) {
        h = await h.getDirectoryHandle(n);
        arr.push({name:n, handle:h});
      }
      this.path = arr;
      this.refresh(w, h);
    } catch(e) {
      this.status(w, 'Navigation error');
    }
  },
  
  async refresh(w) {
    if(this.mode !== 'local' || !this.root) return;
    
    const h = this.path[this.path.length-1]?.handle;
    if(!h) return;
    
    const view = $('#gf-view', w);
    view.innerHTML = '';
    
    try {
      const items = [];
      for await(const e of h.values()) items.push(e);
      items.sort((a,b) => {
        if(a.kind !== b.kind) return a.kind==='directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      
      if(!items.length) {
        view.innerHTML = '<div style="text-align:center;padding:40px;color:#999;font-style:italic">Empty folder</div>';
      } else {
        items.forEach(e => {
          const icon = e.kind==='directory' ? '📁' : '📄';
          const div = el('div', 'gf-item', `<span>${icon} ${e.name}</span><span style="color:#999">${e.kind}</span>`);
          div.dataset.name = e.name;
          div.dataset.kind = e.kind;
          
          div.oncontextmenu = ev => {
            ev.preventDefault();
            this.ctxMenu(ev, e, h, w);
          };
          
          div.onclick = ev => {
            $$('.gf-item', w).forEach(i => i.classList.remove('sel'));
            div.classList.add('sel');
            if(ev.detail === 2) {
              e.kind==='directory' ? this.openFolder(w, e) : this.openFile(e, h);
            }
          };
          
          view.appendChild(div);
        });
      }
      
      this.updateAddr(w);
      this.status(w, `${items.length} items`);
      
      const ps = this.path.map(p=>p.name).slice(1).join('/');
      $$('.gf-tree', w).forEach(e => e.classList.remove('sel'));
      if(!ps) $('#gf-root', w).classList.add('sel');
      else $('.gf-tree[data-path="'+ps+'"]', w)?.classList.add('sel');
      
    } catch(e) {
      view.innerHTML = `<div style="text-align:center;padding:40px;color:#d33">Access denied</div>`;
      this.status(w, 'Read error');
    }
  },
  
  ctxMenu(e, entry, h, w) {
    $$('.gf-ctx').forEach(m => m.remove());
    
    const m = el('div', 'gf-ctx');
    m.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;background:white;
      border:1px solid #ccc;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.2);z-index:10000;
      min-width:150px;padding:4px 0`;
    
    const items = [
      {label:'📂 Open', fn:()=>entry.kind === 'file' ? this.openFile(entry, h) : this.openFolder(w, entry)},
      entry.kind === 'file' ? {label:'📋 Open With...', fn:()=>this.openWith(entry, h)} : null,
      {label:'', sep:true},
      {label:'📄 Copy', fn:()=>this.copy(w)},
      {label:'✂️ Cut', fn:()=>this.cut(w)},
      {label:'📌 Paste', fn:()=>this.paste(w)},
      {label:'', sep:true},
      {label:'✏️ Rename', fn:()=>{$$('.gf-item',w).forEach(i=>i.classList.remove('sel'));w.querySelector(`[data-name="${entry.name}"]`)?.classList.add('sel');this.rename(w)}},
      {label:'🗑️ Delete', fn:()=>{$$('.gf-item',w).forEach(i=>i.classList.remove('sel'));w.querySelector(`[data-name="${entry.name}"]`)?.classList.add('sel');this.delete(w)}}
    ].filter(i => i !== null);
    
    items.forEach(i => {
      if(i.sep) {
        m.appendChild(el('hr', '', '')).style.cssText = 'border:0;border-top:1px solid #ddd;margin:4px 0';
      } else {
        const d = el('div', '', i.label);
        d.style.cssText = 'padding:8px 12px;cursor:pointer;font-size:13px';
        d.onmouseenter = () => d.style.background = '#e5f3ff';
        d.onmouseleave = () => d.style.background = 'white';
        d.onclick = () => { i.fn(); m.remove(); };
        m.appendChild(d);
      }
    });
    
    document.body.appendChild(m);
    clickOut(m, () => m.remove());
  },
  
  async openFile(e, h) {
    if(!window.FileSys) {
      alert('FileSys not loaded');
      return;
    }
    
    try {
      const fh = await h.getFileHandle(e.name);
      console.log('[Gnokefiles] Opening file:', e.name);
      
      // Pass file info to FileSys
      await window.FileSys.open({
        name: e.name,
        handle: fh,
        kind: 'file'
      });
      
    } catch(err) {
      console.error('[Gnokefiles] Open failed:', err);
      alert(`Failed to open ${e.name}: ${err.message}`);
    }
  },
  
  async openWith(e, h) {
    if(!window.FileSys) {
      alert('FileSys not loaded');
      return;
    }
    
    try {
      const fh = await h.getFileHandle(e.name);
      window.FileSys.showDialog({name:e.name, handle:fh, kind:'file'});
    } catch(err) {
      console.error('[Gnokefiles] Open With failed:', err);
    }
  },
  
  async openFolder(w, e) {
    try {
      const h = this.path[this.path.length-1].handle;
      const nh = await h.getDirectoryHandle(e.name);
      this.path.push({name:e.name, handle:nh});
      this.refresh(w);
    } catch(e) {
      this.status(w, 'Cannot open folder');
    }
  },
  
  goUp(w) {
    if(this.path.length > 1) {
      this.path.pop();
      this.refresh(w);
    } else {
      this.status(w, 'At root');
    }
  },
  
  async newFolder(w) {
    const n = prompt('Folder name:');
    if(!n) return;
    try {
      const h = this.path[this.path.length-1].handle;
      await h.getDirectoryHandle(n, {create:true});
      this.refresh(w);
      this.status(w, `Created: ${n}`);
    } catch(e) {
      this.status(w, 'Cannot create folder');
    }
  },
  
  async newFile(w) {
    const n = prompt('File name (e.g., test.txt):');
    if(!n) return;
    try {
      const h = this.path[this.path.length-1].handle;
      const fh = await h.getFileHandle(n, {create:true});
      const wr = await fh.createWritable();
      await wr.close();
      this.refresh(w);
      this.status(w, `Created: ${n}`);
    } catch(e) {
      this.status(w, 'Cannot create file');
    }
  },
  
  copy(w) {
    const sel = $('.gf-item.sel', w);
    if(!sel) return this.status(w, 'Select item to copy');
    const currentHandle = this.path[this.path.length-1].handle; 
    
    this.clipboard = {
        name: sel.dataset.name, 
        kind: sel.dataset.kind,
        sourceParentHandle: currentHandle
    };
    this.clipboardAction = 'copy';
    this.status(w, `Copied: ${sel.dataset.name}`);
  },
  
  cut(w) {
    const sel = $('.gf-item.sel', w);
    if(!sel) return this.status(w, 'Select item to cut');
    const currentHandle = this.path[this.path.length-1].handle; 
    if(!currentHandle) return this.status(w, 'Cannot cut: Current directory handle unavailable');

    this.clipboard = {
        name: sel.dataset.name, 
        kind: sel.dataset.kind,
        sourceParentHandle: currentHandle
    };
    this.clipboardAction = 'cut';
    this.status(w, `Cut: ${sel.dataset.name}`);
  },
  
  async paste(w) {
    if (!this.clipboard) return this.status(w, 'Nothing to paste');
    
    const srcName = this.clipboard.name;
    const srcKind = this.clipboard.kind;
    const dstDirHandle = this.path[this.path.length-1].handle;

    if (!dstDirHandle) return this.status(w, 'Destination directory handle unavailable');

    try {
      if (this.clipboardAction === 'cut') {
        const srcParentHandle = this.clipboard.sourceParentHandle;
        if (!srcParentHandle) throw new Error("Missing source directory handle for cut operation.");
        
        let sourceHandle;
        if (srcKind === 'file') {
            sourceHandle = await srcParentHandle.getFileHandle(srcName);
        } else {
            sourceHandle = await srcParentHandle.getDirectoryHandle(srcName);
        }

        await window.GnokeFileSystem.moveEntry(sourceHandle, srcParentHandle, dstDirHandle);

        this.clipboard = null;
        this.clipboardAction = null;
        this.refresh(w);
        this.status(w, `Moved (Cut): ${srcName}`);

      } else if (this.clipboardAction === 'copy') {
        const sourceParentHandle = this.clipboard.sourceParentHandle;
        let sourceHandle;
        if (srcKind === 'file') {
            sourceHandle = await sourceParentHandle.getFileHandle(srcName);
        } else {
            sourceHandle = await sourceParentHandle.getDirectoryHandle(srcName);
        }
        
        let targetName = srcName;
        
        if (srcKind === 'file') {
          const file = await sourceHandle.getFile();
          try {
              await dstDirHandle.getFileHandle(targetName);
              const baseName = targetName.replace(/(\.[^.]+)?$/, '');
              const extension = targetName.match(/\.[^.]+$/)?.[0] || '';
              let counter = 1;
              while(true) {
                  targetName = `${baseName} (${counter})${extension}`;
                  try {
                      await dstDirHandle.getFileHandle(targetName);
                      counter++;
                  } catch(e) {
                      break;
                  }
              }
          } catch(e) {}
          
          const dstFile = await dstDirHandle.getFileHandle(targetName, {create:true});
          const wr = await dstFile.createWritable();
          await wr.write(file);
          await wr.close();
            
        } else if (srcKind === 'directory') {
          const destSubDirHandle = await dstDirHandle.getDirectoryHandle(targetName, { create: true });
          await window.GnokeFileSystem.recursiveCopy(sourceHandle, destSubDirHandle);
        }
        
        this.refresh(w);
        this.status(w, `Copied: ${targetName}`);
      }

    } catch (e) {
      console.error('Paste error:', e);
      this.status(w, `Paste failed: ${e.message}`);
    }
  },
  
  async rename(w) {
    const sel = $('.gf-item.sel', w);
    if(!sel) return this.status(w, 'Select item');
    
    const old = sel.dataset.name;
    const name = prompt(`Rename "${old}" to:`, old);
    if(!name || name === old) return;
    
    try {
      const h = this.path[this.path.length-1].handle;
      const kind = sel.dataset.kind;
      
      if(kind === 'file') {
        const fh = await h.getFileHandle(old);
        const f = await fh.getFile();
        const nfh = await h.getFileHandle(name, {create:true});
        const wr = await nfh.createWritable();
        await wr.write(f);
        await wr.close();
        await h.removeEntry(old);
      } else {
        const sourceHandle = await h.getDirectoryHandle(old);
        await window.GnokeFileSystem.moveEntry(sourceHandle, h, h, name);
      }
      
      this.refresh(w);
      this.status(w, `Renamed to ${name}`);
    } catch(e) {
      this.status(w, `Rename failed: ${e.message || 'Error'}`);
    }
  },
  
  async delete(w) {
    const sel = $('.gf-item.sel', w);
    if(!sel) return this.status(w, 'Select item');
    
    if(!confirm(`Delete "${sel.dataset.name}"?`)) return;
    
    try {
      const h = this.path[this.path.length-1].handle;
      await h.removeEntry(sel.dataset.name, {recursive:true});
      this.refresh(w);
      this.status(w, `Deleted: ${sel.dataset.name}`);
    } catch(e) {
      this.status(w, 'Delete failed');
    }
  },
  
  updateAddr(w) {
    const p = this.path.map(p=>p.name).join(' > ');
    $('#gf-addr', w).value = this.mode==='local' ? (p || 'Select files...') : 'Cloud Storage';
  },
  
  status(w, msg) {
    $('#gf-status', w).textContent = msg;
  },
  
  empty(mode) {
    if(mode === 'local') {
      return `<div style="text-align:center;padding:80px 20px;color:#999">
        <div style="font-size:64px;margin-bottom:16px">📁</div>
        <p style="font-size:14px">No folder opened</p>
        <p style="font-size:12px">Click files button to begin</p>
      </div>`;
    } else {
      return `<div style="text-align:center;padding:80px 20px;color:#999">
        <div style="font-size:64px;margin-bottom:16px">☁️</div>
        <p style="font-size:14px">Cloud Mode</p>
        <p style="font-size:12px">Feature coming soon</p>
      </div>`;
    }
  }
};

// ============================================================================
// 6. UI GENERATION
// ============================================================================
window.GnokefilesUI = {
  html() {
    return `<style>
.gf-toolbar{display:flex;gap:4px;padding:6px 8px;background:#f0f0f0;border-bottom:1px solid #d0d0d0}
.gf-btn{padding:5px 10px;background:linear-gradient(180deg,#fff,#e5e5e5);border:1px solid #adadad;border-radius:2px;font-size:11px;cursor:pointer;white-space:nowrap}
.gf-btn:hover{background:linear-gradient(180deg,#fff,#f5f5f5)}
.gf-addressbar{flex:1;padding:4px 8px;border:1px solid #7da2ce;background:white;font-size:12px}
.gf-sidebar{width:220px;background:#f6f6f6;border-right:1px solid #d0d0d0;overflow-y:auto;padding-top:8px}
.gf-main{flex:1;display:flex;flex-direction:column}
.gf-view{flex:1;overflow:auto;padding:8px;background:white}
.gf-item{padding:6px 10px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;cursor:pointer;font-size:12px;user-select:none;transition:background 0.1s}
.gf-item:hover{background:#e5f3ff}
.gf-item.sel{background:#cce8ff;border-left:3px solid #0078d7;padding-left:7px}
.gf-statusbar{padding:4px 10px;background:#f0f0f0;border-top:1px solid #d0d0d0;font-size:11px;color:#555}
.gf-dropdown{position:relative;display:inline-block}
.gf-dropdown-content{display:none;position:absolute;top:100%;left:0;background:#f9f9f9;min-width:160px;box-shadow:0 8px 16px rgba(0,0,0,0.2);z-index:100;padding:4px 0;border:1px solid #adadad;border-radius:2px}
.gf-dropdown-item{display:block;width:100%;text-align:left;border:none!important;background:none!important;padding:6px 10px;cursor:pointer}
.gf-dropdown-item:hover{background:#e5f3ff!important}
.gf-tree-root{list-style:none;padding:0;margin:0}
.gf-tree{font-size:12px;white-space:nowrap;display:flex;flex-direction:column}
.gf-line{display:flex;align-items:center}
.gf-tree-content{padding:2px 0 2px 4px;cursor:pointer;flex-grow:1;display:flex;align-items:center;width:100%}
.gf-tree-content:hover{background:#e5f3ff}
.gf-tree.sel>.gf-line>.gf-tree-content{background:#cce8ff}
.gf-toggle{cursor:pointer;width:16px;height:16px;line-height:16px;text-align:center;font-weight:bold;color:#555;flex-shrink:0}
.gf-children{padding-left:16px;list-style:none;display:none;margin:0}
.gf-tree[data-exp="true"]>.gf-children{display:block}
</style>

<div style="display:flex;flex-direction:column;height:100%;font-family:'Segoe UI',sans-serif;background:#fff">
  <div class="gf-toolbar">
    <button id="gf-up" class="gf-btn">▲ Up</button>
    <input type="text" id="gf-addr" class="gf-addressbar" readonly placeholder="Select location...">
    <button id="gf-refresh" class="gf-btn">🔄 Refresh</button>
  </div>
  
  <div class="gf-toolbar" style="padding:4px 8px;justify-content:flex-start">
    <button id="gf-mode" class="gf-btn">📂 Local</button>
    
    <div class="gf-dropdown">
      <button id="gf-menu" class="gf-btn">Organize ▼</button>
      <div id="gf-drop" class="gf-dropdown-content">
        <button id="gf-newfolder" class="gf-btn gf-dropdown-item">📁 New Folder</button>
        <button id="gf-newfile" class="gf-btn gf-dropdown-item">📄 New File</button>
        <hr style="border:0;border-top:1px solid #ddd;margin:4px 0">
        <button id="gf-copy" class="gf-btn gf-dropdown-item">📄 Copy</button>
        <button id="gf-cut" class="gf-btn gf-dropdown-item">✂️ Cut</button>
        <button id="gf-paste" class="gf-btn gf-dropdown-item">📌 Paste</button>
        <hr style="border:0;border-top:1px solid #ddd;margin:4px 0">
        <button id="gf-rename" class="gf-btn gf-dropdown-item">✏️ Rename</button>
        <button id="gf-delete" class="gf-btn gf-dropdown-item">🗑️ Delete</button>
      </div>
    </div>
    
    <button id="gf-files" class="gf-btn">💿 files</button>
  </div>
  
  <div style="display:flex;flex:1;overflow:hidden">
    <div class="gf-sidebar">
      <div style="padding:0 10px 8px 10px;font-weight:600;font-size:11px;color:#555;border-bottom:1px solid #d0d0d0;margin-bottom:8px">Navigation</div>
      <ul class="gf-tree-root">
        <li id="gf-cloud" class="gf-tree" data-kind="cloud">
          <div class="gf-line">
            <span class="gf-toggle"></span>
            <div class="gf-tree-content">☁️ Cloud Storage</div>
          </div>
        </li>
        
        <li id="gf-root" class="gf-tree" data-kind="local-root">
          <div class="gf-line">
            <span class="gf-toggle" id="gf-toggle">▶</span>
            <div class="gf-tree-content" id="gf-label">💾 Gnoke files</div>
          </div>
          <ul class="gf-children" id="gf-tree"></ul>
        </li>
      </ul>
    </div>
    
    <div class="gf-main">
      <div class="gf-view" id="gf-view"></div>
    </div>
  </div>
  
  <div class="gf-statusbar">
    <span id="gf-status">Ready</span>
  </div>
</div>`;
  },
  
  async open() {
    if(window.GnokefilesApp && typeof window.GnokefilesApp.open === 'function') {
      return window.GnokefilesApp.open(this.html());
    } else {
      console.error('GnokefilesApp not loaded');
    }
  }
};

// ============================================================================
// 7. REGISTRATION
// ============================================================================
if(window.AppRegistry) {
  window.AppRegistry.registerApp({
    id: 'gnokefiles',
    name: 'Gnoke files',
    icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><path fill='%23009688' d='M40 12H22l-4-4H8c-2.2 0-4 1.8-4 4v24c0 2.2 1.8 4 4 4h32c2.2 0 4-1.8 4-4V16c0-2.2-1.8-4-4-4z'/></svg>",
    handler: () => window.GnokefilesUI.open(),
    singleInstance: true
  });
}

// ============================================================================
// 8. AUTO-INIT
// ============================================================================
if(document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => window.FileSys.init(), 100);
  });
} else {
  setTimeout(() => window.FileSys.init(), 100);
}

console.log('[Gnokefiles] v6.1.2 loaded - Fixed File Opening Integration');

})();