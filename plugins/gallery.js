// FILE: gnokesuiteapps/gallery.js
// VERSION: 1.0.0
// BUILD DATE: 2025-11-16
//
// GALLERY.JS - IMAGE VIEWER APPLICATION
//
// PURPOSE:
//   Lightweight image viewing application providing image display,
//   zoom controls, and rotation capabilities. Designed for viewing
//   images from the file system with proper file handling integration.
//
// ARCHITECTURE:
//   - IIFE pattern with window.GALLERYApp namespace (matches other apps)
//   - Single window interface with embedded controls
//   - Canvas-based rendering for optimal performance
//   - Support for zoom, rotation, and fit-to-screen modes
//   - FileSys integration for file opening
//
// INTEGRATION:
//   Requires: AppRegistry, WindowManager, FileSys
//   Provides: Image viewing capabilities via openFile() method
//   Exports: GALLERYApp namespace
//
// SUPPORTED FORMATS:
//   - JPEG (.jpg, .jpeg)
//   - PNG (.png)
//   - GIF (.gif)
//   - SVG (.svg)
//   - WebP (.webp)
//
// CREDITS:
//   Based on GNOKEPDFApp structure
//   Adapted for image viewing functionality
//
// ---------------------------------------------------------------------

(function() {
  window.GALLERYApp = {
    currentImage: null,
    currentImageUrl: null,
    currentFilename: null,
    currentZoom: 1.0,
    currentRotation: 0,
    currentWindow: null,
    fitMode: 'fit', // 'fit', 'fill', 'actual'

    /**
     * Open the image viewer window
     * Can be called directly or via AppRegistry
     */
    open() {
      const viewerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          height: 100%;
          font-family: 'Segoe UI', Arial, sans-serif;
          background: #1a1a1a;
          color: white;
        ">
          <div style="
            display: flex;
            align-items: center;
            padding: 8px 12px;
            background: #2d2d2d;
            border-bottom: 1px solid #404040;
            gap: 8px;
            flex-wrap: wrap;
          ">
            <input type="file" id="image-file-input" accept="image/*" style="display: none;">
            <button id="load-file-btn" style="
              background: #3498db;
              border: none;
              color: white;
              padding: 6px 12px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            ">Load Image</button>
            
            <div style="width: 1px; height: 20px; background: #404040; margin: 0 4px;"></div>
            
            <button id="zoom-out-btn" disabled style="
              background: #7f8c8d;
              border: none;
              color: white;
              padding: 6px 10px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            ">-</button>
            
            <span id="zoom-level" style="font-size: 12px; min-width: 50px; text-align: center;">100%</span>
            
            <button id="zoom-in-btn" disabled style="
              background: #7f8c8d;
              border: none;
              color: white;
              padding: 6px 10px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            ">+</button>
            
            <button id="zoom-reset-btn" disabled style="
              background: #7f8c8d;
              border: none;
              color: white;
              padding: 6px 10px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            ">Reset</button>
            
            <div style="width: 1px; height: 20px; background: #404040; margin: 0 4px;"></div>
            
            <button id="rotate-left-btn" disabled style="
              background: #7f8c8d;
              border: none;
              color: white;
              padding: 6px 10px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            ">↶</button>
            
            <button id="rotate-right-btn" disabled style="
              background: #7f8c8d;
              border: none;
              color: white;
              padding: 6px 10px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            ">↷</button>
            
            <div style="width: 1px; height: 20px; background: #404040; margin: 0 4px;"></div>
            
            <button id="fit-btn" disabled style="
              background: #7f8c8d;
              border: none;
              color: white;
              padding: 6px 10px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            ">Fit</button>
            
            <button id="fill-btn" disabled style="
              background: #7f8c8d;
              border: none;
              color: white;
              padding: 6px 10px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            ">Fill</button>
            
            <button id="actual-btn" disabled style="
              background: #7f8c8d;
              border: none;
              color: white;
              padding: 6px 10px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            ">100%</button>
          </div>

          <div id="image-viewer" style="
            flex: 1;
            overflow: auto;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 16px;
            background: #1a1a1a;
          ">
            <div id="image-content" style="
              display: none;
              max-width: 100%;
              max-height: 100%;
            ">
              <img id="image-display" style="
                display: block;
                transition: transform 0.2s ease;
                image-rendering: auto;
              " />
            </div>
            
            <div id="loading-screen" style="
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100%;
              color: #bdc3c7;
              text-align: center;
            ">
              <div style="font-size: 48px; margin-bottom: 16px;">🖼️</div>
              <h3 style="margin: 0 0 16px 0; color: white;">Gallery</h3>
              <p id="status-message" style="margin: 0 0 20px 0; line-height: 1.5;">
                Click "Load Image" to open an image
              </p>
            </div>
          </div>

          <div style="
            padding: 6px 12px;
            background: #1a1a1a;
            border-top: 1px solid #404040;
            font-size: 11px;
            color: #bdc3c7;
            display: flex;
            justify-content: space-between;
          ">
            <span id="status-text">Ready</span>
            <span id="image-info"></span>
          </div>
        </div>
      `;

      const win = window.WindowManager.createWindow('Gallery', viewerHTML, 800, 600, 'gallery');
      this.currentWindow = win;
      this.setupViewer(win);
      return win;
    },

    /**
     * Open a file from the file system (called by FileSys)
     * @param {Object} fileData - File data object containing handle, name, etc.
     */
    async openFile(fileData) {
      console.log('[GALLERYApp] openFile called with:', fileData);
      
      // Open window if not already open
      if (!this.currentWindow || !this.currentWindow.parentNode) {
        this.open();
      }

      try {
        // Handle FileSystemFileHandle from Gnokefiles
        if (fileData.handle && typeof fileData.handle.getFile === 'function') {
          const file = await fileData.handle.getFile();
          await this.loadImage(file);
        }
        // Handle direct File object
        else if (fileData instanceof File) {
          await this.loadImage(fileData);
        }
        // Handle content passed directly (backward compatibility)
        else if (fileData.content) {
          const blob = new Blob([fileData.content], { type: fileData.type || 'image/png' });
          const file = new File([blob], fileData.name || 'image.png', { type: fileData.type });
          await this.loadImage(file);
        }
        else {
          console.error('[GALLERYApp] Invalid file data format:', fileData);
          this.updateStatus('Error: Invalid file format');
        }
      } catch (error) {
        console.error('[GALLERYApp] Error opening file:', error);
        this.updateStatus('Failed to open image file');
      }
    },

    setupViewer(win) {
      // Get UI elements
      const fileInput = win.querySelector('#image-file-input');
      const loadBtn = win.querySelector('#load-file-btn');
      const zoomInBtn = win.querySelector('#zoom-in-btn');
      const zoomOutBtn = win.querySelector('#zoom-out-btn');
      const zoomResetBtn = win.querySelector('#zoom-reset-btn');
      const rotateLeftBtn = win.querySelector('#rotate-left-btn');
      const rotateRightBtn = win.querySelector('#rotate-right-btn');
      const fitBtn = win.querySelector('#fit-btn');
      const fillBtn = win.querySelector('#fill-btn');
      const actualBtn = win.querySelector('#actual-btn');

      // File loading
      loadBtn.onclick = () => fileInput.click();

      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
          this.loadImage(file);
        } else {
          this.updateStatus('Please select a valid image file.');
        }
      };

      // Zoom controls
      zoomInBtn.onclick = () => this.zoomIn();
      zoomOutBtn.onclick = () => this.zoomOut();
      zoomResetBtn.onclick = () => this.resetZoom();

      // Rotation controls
      rotateLeftBtn.onclick = () => this.rotateLeft();
      rotateRightBtn.onclick = () => this.rotateRight();

      // Fit mode controls
      fitBtn.onclick = () => this.setFitMode('fit');
      fillBtn.onclick = () => this.setFitMode('fill');
      actualBtn.onclick = () => this.setFitMode('actual');

      // Keyboard shortcuts
      win.addEventListener('keydown', (e) => {
        if (!this.currentImage) return;
        
        switch(e.key) {
          case '+':
          case '=':
            e.preventDefault();
            this.zoomIn();
            break;
          case '-':
            e.preventDefault();
            this.zoomOut();
            break;
          case '0':
            e.preventDefault();
            this.resetZoom();
            break;
          case 'ArrowLeft':
            e.preventDefault();
            this.rotateLeft();
            break;
          case 'ArrowRight':
            e.preventDefault();
            this.rotateRight();
            break;
          case 'f':
            e.preventDefault();
            this.setFitMode('fit');
            break;
          case 'a':
            e.preventDefault();
            this.setFitMode('actual');
            break;
        }
      });

      win.tabIndex = 0;
      win.focus();
    },

    async loadImage(file) {
      try {
        this.updateStatus('Loading image...');
        
        // Clean up previous image URL
        if (this.currentImageUrl) {
          URL.revokeObjectURL(this.currentImageUrl);
        }

        // Create object URL for the image
        this.currentImageUrl = URL.createObjectURL(file);
        this.currentFilename = file.name;

        // Load the image
        const img = this.currentWindow.querySelector('#image-display');
        
        img.onload = () => {
          this.currentImage = {
            width: img.naturalWidth,
            height: img.naturalHeight,
            size: file.size,
            type: file.type
          };

          // Reset view parameters
          this.currentZoom = 1.0;
          this.currentRotation = 0;

          // Update UI
          const infoText = `${img.naturalWidth}×${img.naturalHeight} • ${Math.round(file.size / 1024)}KB`;
          this.currentWindow.querySelector('#image-info').textContent = infoText;

          // Update window title with filename
          const titleBar = this.currentWindow.querySelector('.window-title');
          if (titleBar) {
            titleBar.textContent = `Gallery - ${file.name}`;
          }

          // Enable controls
          this.enableControls();
          
          // Hide loading screen and show image
          this.currentWindow.querySelector('#loading-screen').style.display = 'none';
          this.currentWindow.querySelector('#image-content').style.display = 'block';
          
          // Apply initial fit mode
          this.setFitMode('fit');
          
          this.updateStatus(`Loaded: ${file.name}`);
        };

        img.onerror = () => {
          this.updateStatus('Failed to load image. File may be corrupted.');
          console.error('Image load error');
        };

        img.src = this.currentImageUrl;

      } catch (error) {
        console.error('Image loading error:', error);
        this.updateStatus('Failed to load image.');
      }
    },

    // Zoom methods
    zoomIn() {
      if (this.currentZoom < 5.0) {
        this.currentZoom = Math.min(5.0, this.currentZoom * 1.2);
        this.applyTransform();
        this.updateZoomDisplay();
      }
    },

    zoomOut() {
      if (this.currentZoom > 0.1) {
        this.currentZoom = Math.max(0.1, this.currentZoom / 1.2);
        this.applyTransform();
        this.updateZoomDisplay();
      }
    },

    resetZoom() {
      this.currentZoom = 1.0;
      this.currentRotation = 0;
      this.applyTransform();
      this.updateZoomDisplay();
    },

    // Rotation methods
    rotateLeft() {
      this.currentRotation = (this.currentRotation - 90) % 360;
      this.applyTransform();
    },

    rotateRight() {
      this.currentRotation = (this.currentRotation + 90) % 360;
      this.applyTransform();
    },

    // Fit mode methods
    setFitMode(mode) {
      this.fitMode = mode;
      const img = this.currentWindow.querySelector('#image-display');
      const container = this.currentWindow.querySelector('#image-viewer');

      // Reset button states
      this.currentWindow.querySelector('#fit-btn').style.background = '#7f8c8d';
      this.currentWindow.querySelector('#fill-btn').style.background = '#7f8c8d';
      this.currentWindow.querySelector('#actual-btn').style.background = '#7f8c8d';

      if (mode === 'fit') {
        // Fit to container (maintain aspect ratio)
        const containerWidth = container.clientWidth - 32;
        const containerHeight = container.clientHeight - 32;
        const imgAspect = this.currentImage.width / this.currentImage.height;
        const containerAspect = containerWidth / containerHeight;

        if (imgAspect > containerAspect) {
          // Image is wider
          img.style.maxWidth = containerWidth + 'px';
          img.style.maxHeight = 'none';
          img.style.width = containerWidth + 'px';
          img.style.height = 'auto';
        } else {
          // Image is taller
          img.style.maxWidth = 'none';
          img.style.maxHeight = containerHeight + 'px';
          img.style.width = 'auto';
          img.style.height = containerHeight + 'px';
        }
        
        this.currentWindow.querySelector('#fit-btn').style.background = '#3498db';
        this.updateStatus('Fit to window');

      } else if (mode === 'fill') {
        // Fill container (may crop)
        img.style.maxWidth = 'none';
        img.style.maxHeight = 'none';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        
        this.currentWindow.querySelector('#fill-btn').style.background = '#3498db';
        this.updateStatus('Fill window');

      } else if (mode === 'actual') {
        // Actual size (100%)
        img.style.maxWidth = 'none';
        img.style.maxHeight = 'none';
        img.style.width = this.currentImage.width + 'px';
        img.style.height = this.currentImage.height + 'px';
        img.style.objectFit = 'none';
        
        this.currentWindow.querySelector('#actual-btn').style.background = '#3498db';
        this.updateStatus('Actual size (100%)');
      }

      this.applyTransform();
    },

    applyTransform() {
      const img = this.currentWindow.querySelector('#image-display');
      img.style.transform = `scale(${this.currentZoom}) rotate(${this.currentRotation}deg)`;
    },

    // UI update methods
    updateZoomDisplay() {
      const zoomLevel = this.currentWindow.querySelector('#zoom-level');
      zoomLevel.textContent = Math.round(this.currentZoom * 100) + '%';
    },

    enableControls() {
      const buttons = this.currentWindow.querySelectorAll('button');
      buttons.forEach(btn => {
        if (btn.id !== 'load-file-btn') {
          btn.disabled = false;
          if (btn.id === 'fit-btn') {
            btn.style.background = '#3498db';
          } else if (!btn.style.background.includes('#3498db')) {
            btn.style.background = '#7f8c8d';
          }
        }
      });
      this.updateZoomDisplay();
    },

    updateStatus(message) {
      const statusText = this.currentWindow.querySelector('#status-text');
      const statusMessage = this.currentWindow.querySelector('#status-message');
      
      if (statusText) statusText.textContent = message;
      if (statusMessage) statusMessage.textContent = message;
    }
  };

  // Register with AppRegistry
  if (window.AppRegistry) {
    window.AppRegistry.registerApp({
      id: 'gallery',
      name: 'Gallery',
      icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%239b59b6' stroke-width='2'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21,15 16,10 5,21'/></svg>",
      handler: () => window.GALLERYApp.open(),
      singleInstance: false
    });
    
    console.log('[GALLERYApp] Registered with AppRegistry');
  }
})();