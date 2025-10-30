/**
 * FILE: core/apps/GnokeDrive_Core.js
 * VERSION: 5.3.0 (Navigation Cleanup)
 * BUILD DATE: 2025-10-30
 *
 * PURPOSE:
 * Core logic for the "Gnoke Drive" file manager. Handles state management,
 * File System Access API interactions, and local mode CRUD operations.
 *
 * CHANGES:
 * 1. Removed redundant Back and Forward navigation commands/logic.
 *
 * AUTHOR: Edmund Sparrow | edmundsparrow.netlify.app
 */

(function () {
  'use strict';

  // Define the core application logic object
  window.GnokeDriveApp = {
    // --- State Management ---
    mode: 'local',
    rootHandle: null, // The permanent root selected directory handle
    currentPath: [], // Array of {name, handle} representing the current view path
    clipboard: null,
    clipboardAction: null,

    // --- Public Interface (Called by GnokeDrive_UI.js) ---
    async open(html) {
      const win = window.WindowManager.createWindow('Gnoke Drive', html, 800, 600);
      this.setupHandlers(win);
      this.setMode(win, 'local');
      return win;
    },

    // --- Mode Switching ---

    setMode(win, newMode) {
      this.mode = newMode;
      const modeToggleBtn = win.querySelector('#gf-mode-toggle');
      
      // Update UI elements based on mode
      if (newMode === 'cloud') {
        modeToggleBtn.textContent = '☁️ Cloud Mode';
        modeToggleBtn.style.backgroundColor = '#007bff';
        modeToggleBtn.style.color = 'white';
        win.querySelector('#gf-view').innerHTML = window.GnokeDriveUI.getEmptyViewContent('cloud');
        this.updateStatus(win, 'Mode set to Cloud. Cloud operations disabled until connected.');
        
        win.querySelector('#gf-open-cloud').classList.add('selected');
        win.querySelector('#gf-local-root-item').classList.remove('selected');
        this.updateAddressBar(win);

        if (window.CloudStorageApp && typeof window.CloudStorageApp.open === 'function') {
             window.CloudStorageApp.open();
        }

      } else { // 'local'
        modeToggleBtn.textContent = '📂 Local Mode';
        modeToggleBtn.style.backgroundColor = '#d0e0ff';
        modeToggleBtn.style.color = '#000000';
        win.querySelector('#gf-open-cloud').classList.remove('selected');
        
        if (this.rootHandle) {
            win.querySelector('#gf-local-root-item').classList.add('selected');
            this.refresh(win);
        } else {
            win.querySelector('#gf-view').innerHTML = window.GnokeDriveUI.getEmptyViewContent('local');
            this.updateStatus(win, 'Mode set to Local. Use the Drive button to select a folder.');
        }
      }
    },

    toggleMode(win) {
        const newMode = this.mode === 'local' ? 'cloud' : 'local';
        this.setMode(win, newMode);
    },
    
    // --- UI Logic and Event Handlers ---
    setupHandlers(win) {
      // Navigation
      win.querySelector('#gf-open-cloud').onclick = () => this.setMode(win, 'cloud');
      // Removed: win.querySelector('#gf-back').onclick = () => this.goBack(win);
      // Removed: win.querySelector('#gf-forward').onclick = () => this.goForward(win);
      win.querySelector('#gf-up').onclick = () => this.goUp(win);
      win.querySelector('#gf-refresh').onclick = () => this.refresh(win);
      win.querySelector('#gf-mode-toggle').onclick = () => this.toggleMode(win);
      
      // NEW: Drive Selection Handler
      win.querySelector('#gf-drive-select').onclick = () => this.selectDrive(win);

      // Local Root Tree Item Handlers
      win.querySelector('#gf-local-root-item').querySelector('.gf-tree-item-content').onclick = () => {
          if (this.rootHandle) {
            this.goToRoot(win);
          } else {
            this.selectDrive(win);
          }
      };

      win.querySelector('#gf-local-toggle').onclick = (e) => this.toggleDirectory(win, e.target.closest('.gf-tree-item'));
      
      // Action Dropdown Logic
      const actionsMenu = win.querySelector('#gf-actions-menu');
      const dropdownContent = win.querySelector('#gf-dropdown-content');

      actionsMenu.onclick = (e) => {
          e.stopPropagation();
          dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
      };
      win.onclick = () => { dropdownContent.style.display = 'none'; };

      // CRUD Operations Dispatcher
      win.querySelector('#gf-newfolder').onclick = () => this.dispatchAction(win, 'newfolder');
      win.querySelector('#gf-newfile').onclick = () => this.dispatchAction(win, 'newfile');
      win.querySelector('#gf-upload').onclick = () => this.dispatchAction(win, 'upload');
      win.querySelector('#gf-download').onclick = () => this.dispatchAction(win, 'download');
      win.querySelector('#gf-copy').onclick = () => this.dispatchAction(win, 'copy');
      win.querySelector('#gf-cut').onclick = () => this.dispatchAction(win, 'cut');
      win.querySelector('#gf-paste').onclick = () => this.dispatchAction(win, 'paste');
      win.querySelector('#gf-rename').onclick = () => this.dispatchAction(win, 'rename');
      win.querySelector('#gf-delete').onclick = () => this.dispatchAction(win, 'delete');
    },

    // --- Action Dispatcher ---
    dispatchAction(win, action) {
      win.querySelector('#gf-dropdown-content').style.display = 'none';

      if (this.mode === 'local') {
        if (!this.rootHandle && action !== 'drive-select') {
            this.updateStatus(win, `Please select a local drive first.`);
            return;
        }

        switch (action) {
            case 'newfolder':
                return this.newFolderLocal(win);
            case 'newfile':
                return this.newFileLocal(win);
            case 'upload':
                return this.uploadLocal(win);
            case 'download':
                return this.downloadLocal(win);
            case 'rename':
                return this.renameLocal(win);
            case 'copy':
            case 'cut':
            case 'paste':
                this.updateStatus(win, `Local action '${action}' requires file/directory selection.`);
                break;
            case 'delete':
                return this.deleteLocal(win);
        }
      } else { // 'cloud'
        this.showCloudPlaceholder(action);
      }
    },
    
    showCloudPlaceholder(action) {
        const featureMap = {
            'newfolder': 'Creating Cloud Folders', 'newfile': 'Creating Cloud Files',
            'upload': 'Uploading to Cloud', 'download': 'Downloading from Cloud',
            'copy': 'Copy/Cut/Paste in Cloud', 'cut': 'Copy/Cut/Paste in Cloud',
            'paste': 'Copy/Cut/Paste in Cloud', 'delete': 'Deleting from Cloud', 'rename': 'Renaming in Cloud'
        };
        const feature = featureMap[action] || 'Cloud operations';
        
        console.log(`[Cloud Placeholder] Action: ${action} - Feature: ${feature} - Needs CloudStorageApp API implementation.`);
        this.updateStatus(document.querySelector('.window[data-app="gnokedrive"]'), `Cloud feature: '${feature}' is pending cloud backend integration.`);
        
        if (window.CloudStorageApp && typeof window.CloudStorageApp.showComingSoon === 'function') {
            window.CloudStorageApp.showComingSoon(feature);
        }
    },

    // --- Treeview Logic ---

    // 1. Select Drive (Root) - Triggered by new toolbar icon
    async selectDrive(win) {
      if (this.mode !== 'local') return;
      try {
        const handle = await window.showDirectoryPicker({ mode: 'readwrite' }); 
        this.rootHandle = handle;
        this.currentPath = [{ name: 'Gnoke Drive', handle }];
        
        // Update Root Item Display in the Tree
        win.querySelector('#gf-selectdrive').innerHTML = `💾 **Gnoke Drive**`;
        
        // Automatically set mode, expand tree, and refresh view
        this.setMode(win, 'local');
        const rootItem = win.querySelector('#gf-local-root-item');
        if (rootItem.dataset.expanded !== 'true') {
            await this.toggleDirectory(win, rootItem, handle, []);
        }

      } catch (err) {
        this.updateStatus(win, 'Drive selection cancelled or access denied.');
        console.error("Local Drive Selection Error:", err);
      }
    },
    
    // Navigation function when clicking the 'Gnoke Drive' name
    goToRoot(win) {
        if (this.rootHandle) {
            this.currentPath = [{ name: 'Gnoke Drive', handle: this.rootHandle }];
            this.refresh(win);
        }
    },

    // 2. Render Directory Tree (Recursive/Lazy Load)
    async renderDirectoryTree(win, currentHandle, parentElement, pathSegments) {
        parentElement.innerHTML = '';
        const items = [];
        
        try {
            for await (const entry of currentHandle.values()) {
                if (entry.kind === 'directory') {
                    items.push(entry);
                }
            }
            items.sort((a, b) => a.name.localeCompare(b.name));
            
            for (const entry of items) {
                const itemPath = pathSegments.concat(entry.name);
                const li = document.createElement('li');
                li.className = 'gf-tree-item';
                li.dataset.kind = 'directory';
                li.dataset.path = itemPath.join('/');
                
                li.innerHTML = `
                    <div class="gf-tree-line">
                        <span class="gf-toggle">▶</span>
                        <div class="gf-tree-item-content">
                            <span class="gf-toggle-icon">📁</span>${entry.name}
                        </div>
                    </div>
                    <ul class="gf-tree-children"></ul>
                `;
                
                li.querySelector('.gf-toggle').onclick = (e) => {
                    e.stopPropagation();
                    this.toggleDirectory(win, li, currentHandle, itemPath);
                };
                li.querySelector('.gf-tree-item-content').onclick = (e) => {
                    this.goUpInTree(win, li, itemPath);
                };
                
                parentElement.appendChild(li);
            }
        } catch (err) {
             console.error("Error reading directory for tree:", err);
             parentElement.innerHTML = '<li style="padding:4px 0 4px 16px; color:#dc3545;">Access Denied</li>';
        }
    },
    
    // 3. Toggle Directory Expansion
    async toggleDirectory(win, itemElement, parentHandle, itemPath = []) {
        if (this.mode !== 'local') return;

        if (!this.rootHandle && itemElement.id === 'gf-local-root-item') {
            this.updateStatus(win, 'Please use the Drive button to select a folder first.');
        } else if (!this.rootHandle) {
             return;
        }

        const isExpanded = itemElement.dataset.expanded === 'true';
        const childrenList = itemElement.querySelector('.gf-tree-children');
        const toggleIcon = itemElement.querySelector('.gf-toggle');

        if (isExpanded) {
            itemElement.dataset.expanded = 'false';
            childrenList.style.display = 'none';
            toggleIcon.textContent = '▶';
        } else {
            let targetHandle = this.rootHandle;
            if (itemPath.length > 0) {
                 try {
                    for(const name of itemPath) {
                        targetHandle = await targetHandle.getDirectoryHandle(name);
                    }
                 } catch (err) {
                     console.error("Error getting directory handle for expansion:", err);
                     childrenList.innerHTML = '<li style="padding:4px 0 4px 16px; color:#dc3545;">Access Denied</li>';
                 }
            }

            if (childrenList.children.length === 0 || childrenList.firstElementChild.textContent.includes('Access Denied')) {
                await this.renderDirectoryTree(win, targetHandle, childrenList, itemPath);
            }

            itemElement.dataset.expanded = 'true';
            childrenList.style.display = 'block';
            toggleIcon.textContent = '▼';
        }
    },
    
    // 4. Navigate from Treeview Click (Updates currentPath and Main View)
    async goUpInTree(win, itemElement, itemPath) {
        if (this.mode !== 'local' || !this.rootHandle) return;
        
        win.querySelectorAll('.gf-tree-item').forEach(el => el.classList.remove('selected'));
        itemElement.classList.add('selected');
        
        try {
            let currentHandle = this.rootHandle;
            let currentPathArray = [{ name: 'Gnoke Drive', handle: currentHandle }];

            for (const name of itemPath) {
                currentHandle = await currentHandle.getDirectoryHandle(name);
                currentPathArray.push({ name, handle: currentHandle });
            }
            
            this.currentPath = currentPathArray;
            this.refresh(win, currentHandle);
        } catch (err) {
            this.updateStatus(win, 'Error navigating to path: Access denied.');
        }
    },

    // --- Core View Logic ---

    // 1. Refresh View
    async refresh(win) {
      if (this.mode !== 'local' || !this.rootHandle) return;
      
      const currentHandle = this.currentPath[this.currentPath.length - 1]?.handle;
      if (!currentHandle) return;

      const view = win.querySelector('#gf-view');
      view.innerHTML = '';
      
      try {
        const items = [];
        for await (const entry of currentHandle.values()) {
          items.push(entry);
        }

        items.sort((a, b) => {
          if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
          return a.name.localeCompare(b.name);
        });

        if (items.length === 0) {
          view.innerHTML = '<div style="text-align:center;padding:40px;color:#999;font-style:italic;">This folder is empty.</div>';
        } else {
          items.forEach(entry => {
            const icon = entry.kind === 'directory' ? '📁' : '📄';
            const div = document.createElement('div');
            div.className = 'gf-file-item';
            div.dataset.name = entry.name;
            div.dataset.kind = entry.kind;
            div.dataset.path = this.currentPath.map(p => p.name).slice(1).join('/') + '/' + entry.name;
            div.innerHTML = `<span>${icon} ${entry.name}</span><span style="color:#999;">${entry.kind}</span>`;
            
            div.onclick = (e) => {
              win.querySelectorAll('.gf-file-item').forEach(el => el.classList.remove('selected'));
              div.classList.add('selected');
              
              if (e.detail === 2) { 
                if (entry.kind === 'directory') this.openFolder(win, entry);
                else this.updateStatus(win, `File: ${entry.name} opened in editor (Not implemented).`);
              }
            };
            view.appendChild(div);
          });
        }

        this.updateAddressBar(win);
        this.updateStatus(win, `Displaying ${items.length} items.`);
        
        // Treeview synchronization
        const currentPathString = this.currentPath.map(p => p.name).slice(1).join('/');
        win.querySelectorAll('.gf-tree-item').forEach(el => el.classList.remove('selected'));
        if (currentPathString === '') {
            win.querySelector('#gf-local-root-item').classList.add('selected');
        } else {
            const selectedItem = win.querySelector(`.gf-tree-item[data-path="${currentPathString}"]`);
            if (selectedItem) selectedItem.classList.add('selected');
        }

      } catch (err) {
        view.innerHTML = `<div style="text-align:center;padding:40px;color:#dc3545;">Access denied or error: ${err.message}</div>`;
        this.updateStatus(win, 'Error reading folder contents.');
        console.error("Refresh Error:", err);
      }
    },
    
    // 2. Navigation Up/Back
    async openFolder(win, entry) {
      try {
        const currentHandle = this.currentPath[this.currentPath.length - 1].handle;
        const newHandle = await currentHandle.getDirectoryHandle(entry.name);
        this.currentPath.push({ name: entry.name, handle: newHandle });
        this.refresh(win);
      } catch (err) {
        this.updateStatus(win, 'Cannot open folder: Access denied.');
        console.error("Open Folder Error:", err);
      }
    },
    
    goUp(win) {
      if (this.currentPath.length > 1) {
        this.currentPath.pop();
        this.refresh(win);
      } else if (this.currentPath.length === 1 && this.rootHandle) {
        this.updateStatus(win, "Already at the root of Gnoke Drive.");
      }
    },
    
    // Removed: goBack(win) and goForward(win)

    // --- Local Mode CRUD Operations ---
    
    async renameLocal(win) {
      const selected = win.querySelector('.gf-file-item.selected');
      if (!selected) {
        this.updateStatus(win, 'Select an item to rename.');
        return;
      }
      
      const oldName = selected.dataset.name;
      const newName = prompt(`Rename "${oldName}" to:`, oldName);
      if (!newName || newName === oldName) return;
      
      try {
        const currentHandle = this.currentPath[this.currentPath.length - 1].handle;
        
        const itemKind = selected.dataset.kind;
        let itemHandle;

        if (itemKind === 'directory') {
            itemHandle = await currentHandle.getDirectoryHandle(oldName);
        } else {
            itemHandle = await currentHandle.getFileHandle(oldName);
        }

        try {
            if (itemKind === 'directory') {
                await currentHandle.getDirectoryHandle(newName);
            } else {
                await currentHandle.getFileHandle(newName);
            }
            this.updateStatus(win, `Error: An item named "${newName}" already exists.`);
            return;
        } catch (e) { /* Expected failure: Name does not exist */ }
        
        if (itemKind === 'file') {
            const file = await itemHandle.getFile();
            const newFileHandle = await currentHandle.getFileHandle(newName, { create: true });
            const writable = await newFileHandle.createWritable();
            await writable.write(file);
            await writable.close();
        } else {
            this.updateStatus(win, 'Renaming folders is not supported in this implementation (due to API complexity).');
            return;
        }

        await currentHandle.removeEntry(oldName, { recursive: true });

        this.refresh(win);
        this.updateStatus(win, `Renamed ${oldName} to ${newName}.`);
      } catch (err) { 
        this.updateStatus(win, 'Rename failed. Check permissions.');
        console.error("Rename Error:", err);
      }
    },

    async newFolderLocal(win) {
      const name = prompt('Enter new folder name:');
      if (!name) return;
      try {
        const currentHandle = this.currentPath[this.currentPath.length - 1].handle;
        await currentHandle.getDirectoryHandle(name, { create: true });
        this.refresh(win);
        this.updateStatus(win, `Created folder: ${name}`);
      } catch (err) { 
        this.updateStatus(win, 'Cannot create folder. Check name or permissions.');
        console.error("New Folder Error:", err);
      }
    },
    
    async newFileLocal(win) {
      const name = prompt('Enter new file name (e.g., test.txt):');
      if (!name) return;
      try {
        const currentHandle = this.currentPath[this.currentPath.length - 1].handle;
        const fileHandle = await currentHandle.getFileHandle(name, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.close();
        this.refresh(win);
        this.updateStatus(win, `Created file: ${name}`);
      } catch (err) { 
        this.updateStatus(win, 'Cannot create file. Check name or permissions.');
        console.error("New File Error:", err);
      }
    },

    async uploadLocal(win) {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.style.display = 'none';

        input.onchange = async (e) => {
            const files = Array.from(e.target.files);
            const currentHandle = this.currentPath[this.currentPath.length - 1].handle;
            
            for (const file of files) {
                try {
                    const fileHandle = await currentHandle.getFileHandle(file.name, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write(file);
                    await writable.close();
                } catch (err) {
                    console.error('Upload failed:', file.name, err);
                    this.updateStatus(win, `Failed to upload ${file.name}.`);
                }
            }
            this.refresh(win);
            this.updateStatus(win, `Successfully uploaded ${files.length} file(s)`);
            document.body.removeChild(input);
        };
        document.body.appendChild(input);
        input.click();
    },

    async downloadLocal(win) {
      const selected = win.querySelector('.gf-file-item.selected');
      if (!selected || selected.dataset.kind === 'directory') {
        this.updateStatus(win, 'Please select a file to download.');
        return;
      }
      
      try {
        const currentHandle = this.currentPath[this.currentPath.length - 1].handle;
        const fileHandle = await currentHandle.getFileHandle(selected.dataset.name);
        const file = await fileHandle.getFile();
        
        const a = document.createElement('a');
        a.href = URL.createObjectURL(file);
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        this.updateStatus(win, `Downloaded: ${file.name}`);
      } catch (err) { 
        this.updateStatus(win, 'Download failed: ' + err.message); 
        console.error("Download Error:", err);
      }
    },
    
    async deleteLocal(win) {
      const selected = win.querySelector('.gf-file-item.selected');
      if (!selected) {
        this.updateStatus(win, 'Select an item to delete.');
        return;
      }
      
      const itemType = selected.dataset.kind === 'directory' ? 'folder' : 'file';
      if (!confirm(`Are you sure you want to permanently delete the ${itemType} "${selected.dataset.name}"?`)) return;
      
      try {
        const currentHandle = this.currentPath[this.currentPath.length - 1].handle;
        await currentHandle.removeEntry(selected.dataset.name, { recursive: true });
        this.refresh(win);
        this.updateStatus(win, `Deleted: ${selected.dataset.name}`);
      } catch (err) { 
        this.updateStatus(win, 'Cannot delete: ' + err.message); 
        console.error("Delete Error:", err);
      }
    },

    // --- Utility Methods ---

    updateAddressBar(win) {
      const path = this.currentPath.map(p => p.name).join(' > ');
      win.querySelector('#gf-address').value = this.mode === 'local' ? (path || 'Select a local drive/folder...') : 'Cloud Storage / (Not Connected)';
    },

    updateStatus(win, msg) {
      win.querySelector('#gf-status').textContent = msg;
    },
  };
})();
