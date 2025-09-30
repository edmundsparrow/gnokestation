// gallery.js - Image Gallery with Folder Selection
(function() {
  window.GalleryApp = {
    currentImages: [],
    currentIndex: 0,
    viewMode: 'grid', // 'grid' or 'viewer'

    open() {
      const galleryHTML = `
        <div style="display:flex;flex-direction:column;height:100%;background:#f0f0f0;">
          <div class="gallery-toolbar" style="
            background:#e8e8e8;
            border-bottom:1px solid #ccc;
            padding:8px;
            display:flex;
            gap:8px;
            align-items:center;
          ">
            <button id="gallery-select" style="
              padding:6px 12px;
              border:1px solid #999;
              background:#f5f5f5;
              cursor:pointer;
              border-radius:3px;
            ">Select Folder</button>
            
            <div style="width:1px;height:20px;background:#ccc;margin:0 4px;"></div>
            
            <button id="gallery-grid" class="view-btn active" style="
              padding:4px 8px;
              border:1px solid #999;
              background:#d0d0d0;
              cursor:pointer;
              border-radius:3px;
              font-size:12px;
            ">Grid</button>
            
            <button id="gallery-viewer" class="view-btn" style="
              padding:4px 8px;
              border:1px solid #999;
              background:#f5f5f5;
              cursor:pointer;
              border-radius:3px;
              font-size:12px;
            ">Viewer</button>
            
            <span id="gallery-count" style="margin-left:auto;font-size:12px;color:#666;">
              0 images
            </span>
          </div>
          
          <div id="gallery-content" style="flex:1;overflow:auto;background:#fff;">
            <div class="gallery-placeholder" style="
              display:flex;
              align-items:center;
              justify-content:center;
              height:100%;
              color:#666;
              font-size:16px;
            ">
              <div style="text-align:center;">
                <div style="font-size:48px;margin-bottom:16px;">📁</div>
                <div>Click "Select Folder" to load images</div>
                <div style="font-size:12px;margin-top:8px;color:#999;">
                  Supports: JPG, PNG, GIF, WebP, SVG, HEIC
                </div>
              </div>
            </div>
          </div>
          
          <div class="gallery-status" style="
            background:#f8f8f8;
            border-top:1px solid #ccc;
            padding:4px 8px;
            font-size:11px;
            color:#666;
            display:flex;
            justify-content:space-between;
          ">
            <span id="gallery-status-text">Ready</span>
            <span id="gallery-current-info"></span>
          </div>
        </div>
      `;

      // The window manager now creates the buttons, so we just call the function.
      const win = WindowManager.createWindow('Gallery', galleryHTML, 800, 600);
      
      // Setup app functionality
      this.setupGallery(win);
      
      return win;
    },

    setupGallery(win) {
      const selectBtn = win.querySelector('#gallery-select');
      const gridBtn = win.querySelector('#gallery-grid');
      const viewerBtn = win.querySelector('#gallery-viewer');
      const content = win.querySelector('#gallery-content');
      const statusText = win.querySelector('#gallery-status-text');
      const currentInfo = win.querySelector('#gallery-current-info');
      const countSpan = win.querySelector('#gallery-count');

      // Folder selection
      selectBtn.onclick = () => {
        this.selectFolder(win);
      };

      // View mode switching
      gridBtn.onclick = () => {
        this.setViewMode(win, 'grid');
      };

      viewerBtn.onclick = () => {
        this.setViewMode(win, 'viewer');
      };

      // Keyboard shortcuts
      win.addEventListener('keydown', (e) => {
        if (this.viewMode === 'viewer' && this.currentImages.length > 0) {
          if (e.key === 'ArrowLeft') {
            this.previousImage(win);
          } else if (e.key === 'ArrowRight') {
            this.nextImage(win);
          } else if (e.key === 'Escape') {
            this.setViewMode(win, 'grid');
          }
        }
      });

      win.setAttribute('tabindex', '0'); // Make window focusable for keyboard events
    },

    selectFolder(win) {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.webkitdirectory = true; // Allow folder selection
      input.accept = 'image/*';
      
      input.onchange = (e) => {
        const files = Array.from(e.target.files);
        this.loadImages(win, files);
      };
      
      input.click();
    },

    loadImages(win, files) {
      const statusText = win.querySelector('#gallery-status-text');
      statusText.textContent = 'Loading images...';
      
      // Filter for image files only
      const imageFiles = files.filter(file => {
        const ext = file.name.toLowerCase().split('.').pop();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'heic'].includes(ext);
      });

      if (imageFiles.length === 0) {
        statusText.textContent = 'No supported images found';
        return;
      }

      this.currentImages = [];
      let loaded = 0;

      imageFiles.forEach((file, index) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          this.currentImages[index] = {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            dataUrl: event.target.result,
            file: file
          };
          
          loaded++;
          statusText.textContent = `Loading images... ${loaded}/${imageFiles.length}`;
          
          if (loaded === imageFiles.length) {
            // Remove empty slots and sort by name
            this.currentImages = this.currentImages
              .filter(img => img)
              .sort((a, b) => a.name.localeCompare(b.name));
            
            this.updateImageCount(win);
            this.renderGridView(win);
            statusText.textContent = `Loaded ${this.currentImages.length} images`;
          }
        };
        
        reader.onerror = () => {
          loaded++;
          if (loaded === imageFiles.length) {
            this.currentImages = this.currentImages.filter(img => img);
            this.updateImageCount(win);
            this.renderGridView(win);
            statusText.textContent = `Loaded ${this.currentImages.length} images`;
          }
        };
        
        reader.readAsDataURL(file);
      });
    },

    updateImageCount(win) {
      const countSpan = win.querySelector('#gallery-count');
      countSpan.textContent = `${this.currentImages.length} images`;
    },

    setViewMode(win, mode) {
      this.viewMode = mode;
      
      const gridBtn = win.querySelector('#gallery-grid');
      const viewerBtn = win.querySelector('#gallery-viewer');
      
      // Update button states
      if (mode === 'grid') {
        gridBtn.classList.add('active');
        gridBtn.style.background = '#d0d0d0';
        viewerBtn.classList.remove('active');
        viewerBtn.style.background = '#f5f5f5';
        this.renderGridView(win);
      } else {
        viewerBtn.classList.add('active');
        viewerBtn.style.background = '#d0d0d0';
        gridBtn.classList.remove('active');
        gridBtn.style.background = '#f5f5f5';
        this.renderViewerMode(win);
      }
    },

    renderGridView(win) {
      const content = win.querySelector('#gallery-content');
      
      if (this.currentImages.length === 0) {
        content.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;">
            No images to display
          </div>
        `;
        return;
      }

      let html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;padding:16px;">';
      
      this.currentImages.forEach((image, index) => {
        html += `
          <div class="gallery-item" data-index="${index}" style="
            border:1px solid #ddd;
            border-radius:4px;
            overflow:hidden;
            cursor:pointer;
            transition:transform 0.2s, box-shadow 0.2s;
            background:#fff;
          ">
            <img src="${image.dataUrl}" alt="${image.name}" style="
              width:100%;
              height:120px;
              object-fit:cover;
              display:block;
            ">
            <div style="padding:8px;font-size:11px;color:#666;text-align:center;">
              <div style="font-weight:bold;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;">
                ${image.name}
              </div>
              <div>${this.formatFileSize(image.size)}</div>
            </div>
          </div>
        `;
      });
      
      html += '</div>';
      content.innerHTML = html;

      // Add click handlers and hover effects
      content.addEventListener('click', (e) => {
        const item = e.target.closest('.gallery-item');
        if (item) {
          this.currentIndex = parseInt(item.dataset.index);
          this.setViewMode(win, 'viewer');
        }
      });

      content.addEventListener('mouseover', (e) => {
        const item = e.target.closest('.gallery-item');
        if (item) {
          item.style.transform = 'scale(1.05)';
          item.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        }
      });

      content.addEventListener('mouseout', (e) => {
        const item = e.target.closest('.gallery-item');
        if (item) {
          item.style.transform = 'scale(1)';
          item.style.boxShadow = 'none';
        }
      });
    },

    renderViewerMode(win) {
      if (this.currentImages.length === 0) return;
      
      const content = win.querySelector('#gallery-content');
      const image = this.currentImages[this.currentIndex];
      
      content.innerHTML = `
        <div style="display:flex;height:100%;background:#000;">
          <button id="prev-btn" style="
            position:absolute;
            left:10px;
            top:50%;
            transform:translateY(-50%);
            background:rgba(0,0,0,0.7);
            color:white;
            border:none;
            padding:10px;
            cursor:pointer;
            border-radius:50%;
            font-size:18px;
            z-index:10;
          ">‹</button>
          
          <button id="next-btn" style="
            position:absolute;
            right:10px;
            top:50%;
            transform:translateY(-50%);
            background:rgba(0,0,0,0.7);
            color:white;
            border:none;
            padding:10px;
            cursor:pointer;
            border-radius:50%;
            font-size:18px;
            z-index:10;
          ">›</button>
          
          <div style="
            flex:1;
            display:flex;
            align-items:center;
            justify-content:center;
            position:relative;
          ">
            <img src="${image.dataUrl}" alt="${image.name}" style="
              max-width:100%;
              max-height:100%;
              object-fit:contain;
            ">
          </div>
          
          <div style="
            width:250px;
            background:#f0f0f0;
            padding:16px;
            overflow-y:auto;
            border-left:1px solid #ccc;
          ">
            <h3 style="margin:0 0 16px 0;font-size:14px;">${image.name}</h3>
            <div style="font-size:12px;color:#666;line-height:1.4;">
              <div><strong>Size:</strong> ${this.formatFileSize(image.size)}</div>
              <div><strong>Type:</strong> ${image.type}</div>
              <div><strong>Modified:</strong> ${new Date(image.lastModified).toLocaleDateString()}</div>
              <div style="margin-top:12px;"><strong>Position:</strong> ${this.currentIndex + 1} of ${this.currentImages.length}</div>
            </div>
            
            <button style="
              margin-top:16px;
              padding:8px 16px;
              background:#2b5797;
              color:white;
              border:none;
              border-radius:4px;
              cursor:pointer;
              width:100%;
            " onclick="window.GalleryApp.setViewMode(arguments[0].target.closest('.window'), 'grid')">
              Back to Grid
            </button>
          </div>
        </div>
      `;
      
      // Setup navigation
      const prevBtn = content.querySelector('#prev-btn');
      const nextBtn = content.querySelector('#next-btn');
      
      prevBtn.onclick = () => this.previousImage(win);
      nextBtn.onclick = () => this.nextImage(win);
      
      // Update current info
      const currentInfo = win.querySelector('#gallery-current-info');
      currentInfo.textContent = `${this.currentIndex + 1} / ${this.currentImages.length}`;
    },

    previousImage(win) {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.renderViewerMode(win);
      }
    },

    nextImage(win) {
      if (this.currentIndex < this.currentImages.length - 1) {
        this.currentIndex++;
        this.renderViewerMode(win);
      }
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
  };

  // Register app with the system
  if (typeof AppRegistry !== 'undefined') {
    AppRegistry.registerApp({
      id: 'gallery',
      name: 'Gallery',
      icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect x='6' y='6' width='36' height='36' rx='2' fill='%23fff' stroke='%23666'/><path d='M12 18l6-6 4 4 8-8v20H12z' fill='%234a90e2'/><circle cx='16' cy='16' r='2' fill='%23fff'/></svg>",
      handler: () => window.GalleryApp.open()
    });
  }
})();
/*
//documentation
{
  "name": "Gallery",
  "version": "1.0",
  "description": "An image gallery application that allows users to view images from a selected folder in a grid or full-screen viewer mode.",
  "features": [
    "Folder selection via a native file dialog.",
    "Grid view for browsing multiple images.",
    "Full-screen viewer for single-image display.",
    "Navigation between images using arrow keys in viewer mode.",
    "Displays image metadata: name, size, type, and modification date.",
    "Responsive layout that adapts to window size."
  ],
  "dependencies": [
    "WindowManager",
    "AppRegistry"
  ],
  "public_methods": [
    {
      "name": "open",
      "description": "Initializes and opens the main application window."
    }
  ],
  "notes": "This app adheres to the WindowManager's conventions for title bar controls (minimize, maximize, and close) and is registered with the system via AppRegistry."
}
*/
