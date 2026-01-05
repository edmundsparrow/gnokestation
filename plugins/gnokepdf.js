// FILE: gnokesuiteapps/gnokepdf.js
// VERSION: 1.2.0
// BUILD DATE: 2025-11-16
//
// GNOKEPDF.JS - PDF DOCUMENT VIEWER APPLICATION
//
// PURPOSE:
//   Lightweight PDF viewing application providing document rendering,
//   navigation, and basic viewing controls. Designed for devices where
//   native PDF support is limited or unavailable, extending functionality
//   of basic browser environments with proper document handling.
//
// CHANGES FROM v1.1.0:
//   - Added openFile() method for FileSys integration
//   - Handles FileSystemFileHandle objects from Gnokefiles
//   - Maintains backward compatibility with direct file loading
//   - Fixed "Open With" functionality
//
// ARCHITECTURE:
//   - IIFE pattern with window.GNOKEPDFApp namespace (matches other apps)
//   - Single window interface with embedded controls
//   - Progressive PDF.js library loading with fallback
//   - Canvas-based rendering for optimal performance
//   - Event-driven navigation with keyboard shortcuts
//   - FileSys integration for file opening
//
// INTEGRATION:
//   Requires: AppRegistry, WindowManager, FileSys
//   Optional: PDF.js library (loaded dynamically from CDN)
//   Provides: PDF viewing capabilities via openFile() method
//   Exports: GNOKEPDFApp namespace
//
// CREDITS:
//   edmundsparrow.netlify.app | whatsappme @ 09024054758 | 
//   webaplications5050@gmail.com
//
// ---------------------------------------------------------------------

(function() {
  window.GNOKEPDFApp = {
    currentDocument: null,
    currentPage: 1,
    totalPages: 0,
    currentZoom: 1.0,
    currentWindow: null,
    isLibraryLoaded: false,

    /**
     * Open the PDF reader window
     * Can be called directly or via AppRegistry
     */
    open() {
      const readerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          height: 100%;
          font-family: 'Segoe UI', Arial, sans-serif;
          background: #2c3e50;
          color: white;
        ">
          <div style="
            display: flex;
            align-items: center;
            padding: 8px 12px;
            background: #34495e;
            border-bottom: 1px solid #3a4f66;
            gap: 8px;
            flex-wrap: wrap;
          ">
            <input type="file" id="pdf-file-input" accept=".pdf" style="display: none;">
            <button id="load-file-btn" style="
              background: #3498db;
              border: none;
              color: white;
              padding: 6px 12px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            ">Load PDF</button>
            
            <div style="width: 1px; height: 20px; background: #3a4f66; margin: 0 4px;"></div>
            
            <button id="prev-page-btn" disabled style="
              background: #7f8c8d;
              border: none;
              color: white;
              padding: 6px 10px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            ">Previous</button>
            
            <div style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
              <input id="page-input" type="number" min="1" value="1" style="
                width: 50px;
                padding: 4px;
                border: 1px solid #3a4f66;
                border-radius: 3px;
                background: #2c3e50;
                color: white;
                text-align: center;
                font-size: 12px;
              ">
              <span>/</span>
              <span id="total-pages">0</span>
            </div>
            
            <button id="next-page-btn" disabled style="
              background: #7f8c8d;
              border: none;
              color: white;
              padding: 6px 10px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            ">Next</button>
            
            <div style="width: 1px; height: 20px; background: #3a4f66; margin: 0 4px;"></div>
            
            <button id="zoom-out-btn" disabled style="
              background: #7f8c8d;
              border: none;
              color: white;
              padding: 6px 10px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            ">-</button>
            
            <span id="zoom-level" style="font-size: 12px; min-width: 40px; text-align: center;">100%</span>
            
            <button id="zoom-in-btn" disabled style="
              background: #7f8c8d;
              border: none;
              color: white;
              padding: 6px 10px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            ">+</button>
            
            <button id="fit-width-btn" disabled style="
              background: #7f8c8d;
              border: none;
              color: white;
              padding: 6px 8px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 10px;
            ">Fit Width</button>
          </div>

          <div id="pdf-viewer" style="
            flex: 1;
            overflow: auto;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 16px;
            background: #34495e;
          ">
            <div id="pdf-content" style="
              background: white;
              box-shadow: 0 4px 8px rgba(0,0,0,0.3);
              border-radius: 4px;
              display: none;
            ">
              <canvas id="pdf-canvas"></canvas>
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
              <div style="font-size: 48px; margin-bottom: 16px;">📄</div>
              <h3 style="margin: 0 0 16px 0; color: white;">GNOKE PDF</h3>
              <p id="status-message" style="margin: 0 0 20px 0; line-height: 1.5;">
                Click "Load PDF" to open a document
              </p>
            </div>
          </div>

          <div style="
            padding: 6px 12px;
            background: #2c3e50;
            border-top: 1px solid #3a4f66;
            font-size: 11px;
            color: #bdc3c7;
            display: flex;
            justify-content: space-between;
          ">
            <span id="status-text">Ready</span>
            <span id="document-info"></span>
          </div>
        </div>
      `;

      const win = window.WindowManager.createWindow('GNOKE PDF', readerHTML, 700, 500, 'gnokepdf');
      this.currentWindow = win;
      this.setupReader(win);
      return win;
    },

    /**
     * Open a file from the file system (called by FileSys)
     * @param {Object} fileData - File data object containing handle, name, etc.
     */
    async openFile(fileData) {
      console.log('[GNOKEPDFApp] openFile called with:', fileData);
      
      // Open window if not already open
      if (!this.currentWindow || !this.currentWindow.parentNode) {
        this.open();
      }

      // Ensure library is loaded
      if (!this.isLibraryLoaded) {
        this.updateStatus('Loading PDF library...');
        try {
          await this.loadPDFLibrary();
        } catch (error) {
          this.updateStatus('Failed to load PDF library');
          console.error('[GNOKEPDFApp] Library load error:', error);
          return;
        }
      }

      try {
        // Handle FileSystemFileHandle from Gnokefiles
        if (fileData.handle && typeof fileData.handle.getFile === 'function') {
          const file = await fileData.handle.getFile();
          await this.loadPDF(file);
        }
        // Handle direct File object
        else if (fileData instanceof File) {
          await this.loadPDF(fileData);
        }
        // Handle content passed directly (backward compatibility)
        else if (fileData.content) {
          const blob = new Blob([fileData.content], { type: 'application/pdf' });
          const file = new File([blob], fileData.name || 'document.pdf', { type: 'application/pdf' });
          await this.loadPDF(file);
        }
        else {
          console.error('[GNOKEPDFApp] Invalid file data format:', fileData);
          this.updateStatus('Error: Invalid file format');
        }
      } catch (error) {
        console.error('[GNOKEPDFApp] Error opening file:', error);
        this.updateStatus('Failed to open PDF file');
      }
    },

    setupReader(win) {
      // Get UI elements
      const fileInput = win.querySelector('#pdf-file-input');
      const loadBtn = win.querySelector('#load-file-btn');
      const prevBtn = win.querySelector('#prev-page-btn');
      const nextBtn = win.querySelector('#next-page-btn');
      const pageInput = win.querySelector('#page-input');
      const zoomInBtn = win.querySelector('#zoom-in-btn');
      const zoomOutBtn = win.querySelector('#zoom-out-btn');
      const fitWidthBtn = win.querySelector('#fit-width-btn');

      // File loading
      loadBtn.onclick = () => {
        if (!this.isLibraryLoaded) {
          this.updateStatus('Loading PDF library...');
          this.loadPDFLibrary().then(() => {
            fileInput.click();
          }).catch(error => {
            this.updateStatus('Failed to load PDF library. Check internet connection.');
            console.error('PDF.js loading error:', error);
          });
        } else {
          fileInput.click();
        }
      };

      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
          this.loadPDF(file);
        } else {
          this.updateStatus('Please select a valid PDF file.');
        }
      };

      // Navigation
      prevBtn.onclick = () => this.previousPage();
      nextBtn.onclick = () => this.nextPage();
      
      pageInput.onchange = () => {
        const page = parseInt(pageInput.value);
        if (page >= 1 && page <= this.totalPages) {
          this.goToPage(page);
        } else {
          pageInput.value = this.currentPage;
        }
      };

      // Zoom controls
      zoomInBtn.onclick = () => this.zoomIn();
      zoomOutBtn.onclick = () => this.zoomOut();
      fitWidthBtn.onclick = () => this.fitToWidth();

      // Keyboard shortcuts
      win.addEventListener('keydown', (e) => {
        if (!this.currentDocument) return;
        
        switch(e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            this.previousPage();
            break;
          case 'ArrowRight':
            e.preventDefault();
            this.nextPage();
            break;
          case '+':
          case '=':
            e.preventDefault();
            this.zoomIn();
            break;
          case '-':
            e.preventDefault();
            this.zoomOut();
            break;
        }
      });

      win.tabIndex = 0;
      win.focus();
    },

    async loadPDFLibrary() {
      if (this.isLibraryLoaded || window.pdfjsLib) {
        this.isLibraryLoaded = true;
        return Promise.resolve();
      }

      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        
        script.onload = () => {
          if (window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
              'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            this.isLibraryLoaded = true;
            resolve();
          } else {
            reject(new Error('PDF.js failed to initialize'));
          }
        };
        
        script.onerror = () => reject(new Error('Failed to load PDF.js'));
        document.head.appendChild(script);
      });
    },

    async loadPDF(file) {
      if (!this.isLibraryLoaded) {
        this.updateStatus('PDF library not ready');
        return;
      }

      try {
        this.updateStatus('Loading PDF document...');
        
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = window.pdfjsLib.getDocument(arrayBuffer);
        
        this.currentDocument = await loadingTask.promise;
        this.totalPages = this.currentDocument.numPages;
        this.currentPage = 1;

        // Update UI
        this.currentWindow.querySelector('#total-pages').textContent = this.totalPages;
        this.currentWindow.querySelector('#page-input').value = this.currentPage;
        this.currentWindow.querySelector('#page-input').max = this.totalPages;
        this.currentWindow.querySelector('#document-info').textContent = 
          `${Math.round(file.size / 1024)}KB`;

        // Update window title with filename
        const titleBar = this.currentWindow.querySelector('.window-title');
        if (titleBar) {
          titleBar.textContent = `GNOKE PDF - ${file.name}`;
        }

        // Enable controls
        this.enableControls();
        
        // Hide loading screen and render first page
        this.currentWindow.querySelector('#loading-screen').style.display = 'none';
        await this.renderPage(this.currentPage);
        
        this.updateStatus(`Loaded: ${file.name} (${this.totalPages} pages)`);

      } catch (error) {
        console.error('PDF loading error:', error);
        this.updateStatus('Failed to load PDF. File may be corrupted.');
      }
    },

    async renderPage(pageNumber) {
      if (!this.currentDocument || pageNumber < 1 || pageNumber > this.totalPages) {
        return;
      }

      try {
        this.updateStatus(`Rendering page ${pageNumber}...`);

        const page = await this.currentDocument.getPage(pageNumber);
        const canvas = this.currentWindow.querySelector('#pdf-canvas');
        const context = canvas.getContext('2d');

        // Calculate viewport
        const viewport = page.getViewport({ scale: this.currentZoom });

        // Set canvas size
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Show canvas
        this.currentWindow.querySelector('#pdf-content').style.display = 'block';

        // Render
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        await page.render(renderContext).promise;

        this.currentPage = pageNumber;
        this.updateNavigation();
        this.updateStatus(`Page ${pageNumber} of ${this.totalPages}`);

      } catch (error) {
        console.error('Render error:', error);
        this.updateStatus('Failed to render page');
      }
    },

    // Navigation methods
    previousPage() {
      if (this.currentPage > 1) {
        this.goToPage(this.currentPage - 1);
      }
    },

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.goToPage(this.currentPage + 1);
      }
    },

    goToPage(pageNumber) {
      if (pageNumber >= 1 && pageNumber <= this.totalPages) {
        this.currentWindow.querySelector('#page-input').value = pageNumber;
        this.renderPage(pageNumber);
      }
    },

    // Zoom methods
    zoomIn() {
      if (this.currentZoom < 3.0) {
        this.currentZoom = Math.min(3.0, this.currentZoom * 1.2);
        this.updateZoomDisplay();
        this.renderPage(this.currentPage);
      }
    },

    zoomOut() {
      if (this.currentZoom > 0.3) {
        this.currentZoom = Math.max(0.3, this.currentZoom / 1.2);
        this.updateZoomDisplay();
        this.renderPage(this.currentPage);
      }
    },

    fitToWidth() {
      if (!this.currentDocument) return;

      this.currentDocument.getPage(this.currentPage).then(page => {
        const container = this.currentWindow.querySelector('#pdf-viewer');
        const containerWidth = container.clientWidth - 32;
        const viewport = page.getViewport({ scale: 1.0 });
        
        this.currentZoom = containerWidth / viewport.width;
        this.updateZoomDisplay();
        this.renderPage(this.currentPage);
      });
    },

    // UI update methods
    updateNavigation() {
      const prevBtn = this.currentWindow.querySelector('#prev-page-btn');
      const nextBtn = this.currentWindow.querySelector('#next-page-btn');

      prevBtn.disabled = this.currentPage <= 1;
      nextBtn.disabled = this.currentPage >= this.totalPages;

      prevBtn.style.background = prevBtn.disabled ? '#7f8c8d' : '#3498db';
      nextBtn.style.background = nextBtn.disabled ? '#7f8c8d' : '#3498db';
    },

    updateZoomDisplay() {
      const zoomLevel = this.currentWindow.querySelector('#zoom-level');
      zoomLevel.textContent = Math.round(this.currentZoom * 100) + '%';
    },

    enableControls() {
      const buttons = this.currentWindow.querySelectorAll('button');
      buttons.forEach(btn => {
        if (btn.id !== 'load-file-btn') {
          btn.disabled = false;
          if (!btn.style.background.includes('#7f8c8d')) {
            btn.style.background = '#3498db';
          }
        }
      });
      this.updateNavigation();
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
      id: 'gnokepdf',
      name: 'Gnoke PDF',
      icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23e74c3c' stroke-width='2'><path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/><polyline points='14,2 14,8 20,8'/><line x1='16' y1='13' x2='8' y2='13'/><line x1='16' y1='17' x2='8' y2='17'/><polyline points='10,9 9,9 8,9'/></svg>",
      handler: () => window.GNOKEPDFApp.open(),
      singleInstance: true
    });
    
    console.log('[GNOKEPDFApp] Registered with AppRegistry');
  }
})();