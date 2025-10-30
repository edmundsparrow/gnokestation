/**
 * FILE: core/apps/GnokeDrive_UI.js
 * VERSION: 5.3.0 (Navigation Cleanup)
 * BUILD DATE: 2025-10-30
 *
 * PURPOSE:
 * Frontend/UI layer for the "Gnoke Drive" application.
 * Contains HTML, CSS, and the application registration logic.
 *
 * CHANGES:
 * 1. Removed Back (◄) and Forward (►) buttons from the toolbar.
 *
 * AUTHOR: Edmund Sparrow | edmundsparrow.netlify.app
 */

(function () {
  'use strict';

  window.GnokeDriveUI = {
    // --- UI Generation ---
    generateHTML() {
      return `
        <style>
          /* Base Styles (CSS remains the same) */
          .gf-toolbar { display:flex; gap:4px; padding:6px 8px; background:#f0f0f0; border-bottom:1px solid #d0d0d0; }
          .gf-btn { 
            padding:5px 10px; 
            background:linear-gradient(180deg,#fff,#e5e5e5); 
            border:1px solid #adadad; 
            border-radius:2px; 
            font-size:11px; 
            cursor:pointer; 
            white-space: nowrap;
          }
          .gf-btn:hover { background:linear-gradient(180deg,#fff,#f5f5f5); }
          .gf-btn:active { background:#e5e5e5; }
          .gf-addressbar { flex:1; padding:4px 8px; border:1px solid #7da2ce; background:white; font-size:12px; }
          .gf-sidebar { width:220px; background:#f6f6f6; border-right:1px solid #d0d0d0; overflow-y:auto; padding-top: 8px;}
          .gf-main { flex:1; display:flex; flex-direction:column; }
          .gf-view { flex:1; overflow:auto; padding:8px; background:white; }
          .gf-file-item { 
            padding:6px 10px; 
            border-bottom:1px solid #f0f0f0; 
            display:flex; 
            justify-content:space-between; 
            cursor:pointer; 
            font-size:12px; 
            user-select: none;
            transition: background-color 0.1s;
          }
          .gf-file-item:hover { background:#e5f3ff; }
          .gf-file-item.selected { background:#cce8ff; border-left: 3px solid #0078d7; padding-left: 7px; }
          .gf-statusbar { padding:4px 10px; background:#f0f0f0; border-top:1px solid #d0d0d0; font-size:11px; color:#555; }
          
          /* Dropdown Styles */
          .gf-dropdown { position: relative; display: inline-block; }
          .gf-dropdown-content { display: none; position: absolute; top: 100%; left: 0; background-color: #f9f9f9; min-width: 160px; box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2); z-index: 100; padding: 4px 0; border: 1px solid #adadad; border-radius: 2px; }
          .gf-dropdown-item { display: block; width: 100%; text-align: left; border: none !important; background: none !important; padding: 6px 10px; cursor: pointer; line-height: 1.5; }
          .gf-dropdown-item:hover { background-color: #e5f3ff !important; }

          /* Treeview Styles */
          .gf-tree-root { list-style: none; padding: 0; margin: 0; }
          .gf-tree-item { 
            font-size: 12px; 
            white-space: nowrap; 
            display: flex; 
            flex-direction: column;
          }
          .gf-tree-line {
            display: flex;
            align-items: center;
          }
          .gf-tree-item-content {
            padding: 2px 0px 2px 4px; 
            cursor: pointer; 
            flex-grow: 1;
            display: flex;
            align-items: center;
            width: 100%;
          }
          .gf-tree-item-content:hover { background: #e5f3ff; }
          .gf-tree-item.selected > .gf-tree-line > .gf-tree-item-content { background: #cce8ff; }
          
          .gf-toggle { 
            cursor: pointer; 
            width: 16px; 
            height: 16px; 
            line-height: 16px; 
            text-align: center; 
            font-weight: bold;
            color: #555;
            flex-shrink: 0;
          }
          .gf-toggle-icon { margin-right: 4px; }
          .gf-tree-children { padding-left: 16px; list-style: none; display: none; margin: 0;}
          .gf-tree-item[data-expanded="true"] > .gf-tree-children { display: block; }
          .gf-tree-item[data-kind="cloud"] .gf-toggle { visibility: hidden; }
        </style>
        
        <div style="display:flex;flex-direction:column;height:100%;font-family:'Segoe UI',Tahoma,sans-serif;background:#fff;">
          <div class="gf-toolbar">
            <button id="gf-up" class="gf-btn">▲ Up</button>
            <input type="text" id="gf-address" class="gf-addressbar" readonly placeholder="Select a location...">
            <button id="gf-refresh" class="gf-btn">🔄 Refresh</button>
          </div>
          
          <div class="gf-toolbar" style="padding:4px 8px; justify-content: flex-start;">
            <button id="gf-mode-toggle" class="gf-btn">📂 Local Mode</button>
            
            <div class="gf-dropdown">
              <button id="gf-actions-menu" class="gf-btn">Organize ▼</button>
              <div id="gf-dropdown-content" class="gf-dropdown-content">
                <button id="gf-newfolder" class="gf-btn gf-dropdown-item">📁 New Folder</button>
                <button id="gf-newfile" class="gf-btn gf-dropdown-item">📄 New File</button>
                <hr style="border:0;border-top:1px solid #ddd;margin:4px 0;">
                <button id="gf-upload" class="gf-btn gf-dropdown-item">📤 Upload</button>
                <button id="gf-download" class="gf-btn gf-dropdown-item">💾 Download</button>
                <hr style="border:0;border-top:1px solid #ddd;margin:4px 0;">
                <button id="gf-copy" class="gf-btn gf-dropdown-item">📋 Copy</button>
                <button id="gf-cut" class="gf-btn gf-dropdown-item">✂️ Cut</button>
                <button id="gf-paste" class="gf-btn gf-dropdown-item">📌 Paste</button>
                <hr style="border:0;border-top:1px solid #ddd;margin:4px 0;">
                <button id="gf-rename" class="gf-btn gf-dropdown-item">✍️ Rename</button>
                <button id="gf-delete" class="gf-btn gf-dropdown-item">🗑️ Delete</button>
              </div>
            </div>

            <button id="gf-drive-select" class="gf-btn">💿 Drive</button>
            
          </div>
          
          <div style="display:flex;flex:1;overflow:hidden;">
            <div class="gf-sidebar">
              <div style="padding:0px 10px 8px 10px;font-weight:600;font-size:11px;color:#555;border-bottom:1px solid #d0d0d0; margin-bottom: 8px;">Navigation</div>
              <ul class="gf-tree-root" id="gf-tree-root">
                
                <li id="gf-open-cloud" class="gf-tree-item" data-kind="cloud">
                  <div class="gf-tree-line">
                    <span class="gf-toggle"></span>
                    <div class="gf-tree-item-content">☁️ Cloud Storage</div>
                  </div>
                </li>

                <li id="gf-local-root-item" class="gf-tree-item" data-kind="local-root">
                  <div class="gf-tree-line">
                    <span class="gf-toggle" id="gf-local-toggle">▶</span>
                    <div class="gf-tree-item-content" id="gf-selectdrive">💾 Gnoke Drive</div>
                  </div>
                  <ul class="gf-tree-children" id="gf-local-tree-children"></ul>
                </li>
              </ul>
            </div>
            
            <div class="gf-main">
              <div class="gf-view" id="gf-view">
                ${this.getEmptyViewContent('local')}
              </div>
            </div>
          </div>
          
          <div class="gf-statusbar">
            <span id="gf-status">Ready</span>
          </div>
        </div>
      `;
    },

    getEmptyViewContent(mode) {
      if (mode === 'local') {
        return `
          <div id="gf-empty-view-local" style="text-align:center;padding:80px 20px;color:#999;">
            <div style="font-size:64px;margin-bottom:16px;">📁</div>
            <p style="font-size:14px;">No local folder opened</p>
            <p style="font-size:12px;">Click the "💿 Drive" button to select a folder and begin.</p>
          </div>
        `;
      } else if (mode === 'cloud') {
         return `
          <div id="gf-empty-view-cloud" style="text-align:center;padding:80px 20px;color:#999;">
            <div style="font-size:64px;margin-bottom:16px;">☁️</div>
            <p style="font-size:14px;">Cloud Mode Activated</p>
            <p style="font-size:12px;">Please connect or open the dedicated Cloud Storage app for file listing.</p>
          </div>
        `;
      }
      return '';
    },
    
    async open() {
        const html = this.generateHTML();
        if (window.GnokeDriveApp && typeof window.GnokeDriveApp.open === 'function') {
            return window.GnokeDriveApp.open(html);
        } else {
            console.error('GnokeDriveApp core logic not found. Cannot launch Gnoke Drive.');
        }
    }
  };
  
  // Register app with the system
  if (window.AppRegistry) {
    window.AppRegistry.registerApp({
      id: 'gnokedrive',
      name: 'Gnoke Drive',
      icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><path fill='%23009688' d='M40 12H22l-4-4H8c-2.2 0-4 1.8-4 4v24c0 2.2 1.8 4 4 4h32c2.2 0 4-1.8 4-4V16c0-2.2-1.8-4-4-4z'/></svg>",
      handler: () => window.GnokeDriveUI.open(),
      singleInstance: true
    });
  }

})();
