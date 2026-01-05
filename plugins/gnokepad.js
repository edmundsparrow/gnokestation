/*
 * GnokePad v4.1 - Professional Multi-Format Editor with FileSys Integration
 * Supports: TXT, MD, CSV, HTML, RTF
 * File System Access API + Rich Text Editing
 * FIXED: Now works seamlessly with Gnokefiles "Open With" feature
 * Author: ekong ikpe
 * VERSION: 4.1.0
 */

(function() {
    'use strict';
    
    const CONFIG = {
        APP_NAME: 'GnokePad',
        STORAGE_KEY: 'gnokepad_autosave_v4',
        AUTOSAVE_INTERVAL_MS: 5000,
        colors: {
            primary: '#1a73e8',
            primaryDark: '#1765cc',
            primaryLight: '#e8f0fe',
            background: '#ffffff',
            border: '#e5e7eb',
            borderDark: '#d1d5db',
            text: '#111827',
            textLight: '#6b7280',
            editorBg: '#ffffff',
            headerBg: '#f8fafc',
            danger: '#ef4444',
            warning: '#f59e0b',
            success: '#10b981'
        }
    };
    
    const supportsFileApi = 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
    
    // Toast notification system
    class Toast {
        constructor(container) {
            this.container = container;
        }

        show(message, type = 'info', duration = 3000) {
            const toast = document.createElement('div');
            toast.className = `gnp-toast gnp-toast-${type}`;
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                bottom: 80px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 8px;
                background: ${type === 'error' ? CONFIG.colors.danger : type === 'warning' ? CONFIG.colors.warning : type === 'success' ? CONFIG.colors.success : CONFIG.colors.primary};
                color: white;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                animation: slideIn 0.3s ease-out;
                max-width: 300px;
            `;

            this.container.appendChild(toast);

            setTimeout(() => {
                toast.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
    }
    
    // Format Converters
    const Converters = {
        htmlToMd(html) {
            return html
                .replace(/<strong>|<b>/gi, '**').replace(/<\/strong>|<\/b>/gi, '**')
                .replace(/<em>|<i>/gi, '*').replace(/<\/em>|<\/i>/gi, '*')
                .replace(/<u>/gi, '__').replace(/<\/u>/gi, '__')
                .replace(/<s>/gi, '~~').replace(/<\/s>/gi, '~~')
                .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n')
                .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n')
                .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n')
                .replace(/<li[^>]*>(.*?)<\/li>/gi, '* $1\n')
                .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<[^>]+>/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/\n{3,}/g, '\n\n')
                .trim();
        },
        
        mdToHtml(md) {
            return md
                .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/__(.*?)__/g, '<u>$1</u>')
                .replace(/~~(.*?)~~/g, '<s>$1</s>')
                .replace(/^\* (.*$)/gim, '<li>$1</li>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>')
                .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
                .replace(/<\/p><p>/g, '</p>\n<p>');
        },
        
        htmlToText(html) {
            return html
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<\/p>/gi, '\n\n')
                .replace(/<[^>]+>/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&')
                .trim();
        },
        
        textToHtml(text) {
            if (text.trim().startsWith('{\\rtf1')) {
                return `<div style="font-family:monospace;white-space:pre-wrap;color:#666;padding:12px;background:#f9fafb;border-radius:6px;margin:8px 0;">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`;
            }

            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>');
        },
        
        csvToHtml(csv) {
            const rows = csv.split('\n').filter(r => r.trim());
            if (!rows.length) return '<p>Empty CSV</p>';
            
            let html = '<table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;margin:12px 0;">';
            rows.forEach((row, i) => {
                const cells = row.split(',').map(c => c.trim());
                const tag = i === 0 ? 'th' : 'td';
                html += '<tr>' + cells.map(c => `<${tag}>${c}</${tag}>`).join('') + '</tr>';
            });
            html += '</table>';
            return html;
        },
        
        htmlToCsv(html) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const rows = doc.querySelectorAll('tr');
            
            return Array.from(rows).map(row => {
                const cells = row.querySelectorAll('th, td');
                return Array.from(cells)
                    .map(c => `"${c.textContent.trim().replace(/"/g, '""')}"`)
                    .join(',');
            }).join('\n') || this.htmlToText(html);
        },
        
        rtfToText(rtf) {
            return rtf
                .replace(/\{\\rtf[0-9]\}/g, '')
                .replace(/\\ansi/g, '')
                .replace(/\\par\s*/g, '\n')
                .replace(/\{?\}?/g, '')
                .replace(/\\plain/g, '')
                .replace(/\\[a-z]+(-?[0-9]+)?\s?/g, '')
                .replace(/\\/g, '')
                .trim();
        },
        
        textToRtf(text) {
            if (text.trim().startsWith('{\\rtf1')) {
                return text;
            }
            return `{\\rtf1\\ansi\\deff0 ${text.replace(/\n/g, '\\par ')}}`;
        }
    };
    
    // File Type Handlers
    const getHandler = (filename) => {
        const ext = (filename.split('.').pop() || '').toLowerCase();
        
        const handlers = {
            txt: { read: Converters.textToHtml, write: Converters.htmlToText, contentType: 'text/plain' },
            md: { read: Converters.mdToHtml, write: Converters.htmlToMd, contentType: 'text/markdown' },
            markdown: { read: Converters.mdToHtml, write: Converters.htmlToMd, contentType: 'text/markdown' },
            csv: { read: Converters.csvToHtml, write: Converters.htmlToCsv, contentType: 'text/csv' },
            html: { read: c => c, write: c => c, contentType: 'text/html' },
            htm: { read: c => c, write: c => c, contentType: 'text/html' },
            rtf: { 
                read: Converters.textToHtml,
                write: (html) => {
                    const text = Converters.htmlToText(html);
                    return Converters.textToRtf(text);
                },
                contentType: 'text/rtf'
            }
        };
        
        return handlers[ext] || handlers.txt;
    };
    
    const FILE_TYPES = [{
        description: 'All Text Files',
        accept: { 
            'text/plain': ['.txt'],
            'text/markdown': ['.md', '.markdown'],
            'text/csv': ['.csv'],
            'text/rtf': ['.rtf'],
            'text/log': ['.log'],
        }
    }];
    
    window.GNOKEPADApp = {
        currentWindow: null,
        
        /**
         * Open the editor window
         * Can be called directly or with a file object
         */
        open(fileObj) {
            if (!supportsFileApi) {
                alert('File System Access API not supported. Use Chrome, Edge, or Safari.');
                return;
            }

            const c = CONFIG.colors;
            const html = `
                <style>
                    @keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }
                    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                    
                    .gnp-root { 
                        display: flex;
                        flex-direction: column;
                        height: 100%;
                        background: ${c.background};
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        color: ${c.text};
                    }
                    
                    .gnp-toolbar { 
                        padding: 10px 12px;
                        background: ${c.headerBg};
                        border-bottom: 2px solid ${c.border};
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        flex-wrap: wrap;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    }
                    
                    .gnp-section { 
                        display: flex;
                        gap: 6px;
                        padding-right: 8px;
                        border-right: 1px solid ${c.border};
                    }
                    
                    .gnp-section:last-child { border-right: none; }
                    
                    select.gnp-select { 
                        padding: 7px 32px 7px 10px;
                        border: 1px solid ${c.border};
                        border-radius: 6px;
                        background: white;
                        font-size: 14px;
                        cursor: pointer;
                        transition: all 0.2s;
                        font-weight: 500;
                        appearance: none;
                        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23111827' d='M6 8L2 4h8z'/%3E%3C/svg%3E");
                        background-repeat: no-repeat;
                        background-position: right 10px center;
                    }
                    
                    select.gnp-select:hover {
                        border-color: ${c.primary};
                        box-shadow: 0 0 0 3px ${c.primaryLight};
                    }
                    
                    select.gnp-select:focus {
                        outline: none;
                        border-color: ${c.primary};
                        box-shadow: 0 0 0 3px ${c.primaryLight};
                    }
                    
                    .gnp-btn { 
                        padding: 7px 12px;
                        border-radius: 6px;
                        border: 1px solid ${c.border};
                        background: white;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                        transition: all 0.2s;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                    }
                    
                    .gnp-btn:hover:not(:disabled) {
                        background: ${c.headerBg};
                        border-color: ${c.borderDark};
                        transform: translateY(-1px);
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    
                    .gnp-btn:active:not(:disabled) {
                        transform: translateY(0);
                        box-shadow: none;
                    }
                    
                    .gnp-btn.active {
                        background: ${c.primaryLight};
                        border-color: ${c.primary};
                        color: ${c.primary};
                    }
                    
                    .gnp-color { 
                        width: 32px;
                        height: 32px;
                        border: 1px solid ${c.border};
                        border-radius: 6px;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    
                    .gnp-color:hover {
                        transform: scale(1.05);
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    
                    .gnp-editor { 
                        flex: 1;
                        padding: 24px 32px;
                        font-size: 15px;
                        line-height: 1.6;
                        overflow-y: auto;
                        outline: none;
                        background: ${c.editorBg};
                    }
                    
                    .gnp-editor:focus { outline: none; }
                    
                    .gnp-statusbar { 
                        padding: 10px 16px;
                        border-top: 2px solid ${c.border};
                        font-size: 13px;
                        background: white;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        box-shadow: 0 -1px 3px rgba(0,0,0,0.05);
                    }
                    
                    .gnp-status-left {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }
                    
                    .gnp-filename { 
                        font-weight: 600;
                        color: ${c.primary};
                    }
                    
                    .gnp-mod { 
                        color: ${c.danger};
                        font-weight: 700;
                        font-size: 16px;
                    }
                    
                    .gnp-autosave-indicator {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        font-size: 12px;
                        color: ${c.textLight};
                    }
                    
                    .gnp-autosave-dot {
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        background: ${c.success};
                    }
                    
                    .gnp-autosave-dot.saving {
                        animation: pulse 1.5s infinite;
                    }
                    
                    @media (max-width: 768px) { 
                        .gnp-toolbar {
                            padding: 8px;
                            gap: 6px;
                        }
                        
                        .gnp-section {
                            padding-right: 6px;
                        }
                        
                        .gnp-btn {
                            padding: 6px 10px;
                            font-size: 13px;
                        }
                        
                        .gnp-editor {
                            padding: 16px 20px;
                            font-size: 14px;
                        }
                    }
                </style>
                <div class="gnp-root">
                    <div class="gnp-toolbar" role="toolbar">
                        <div class="gnp-section">
                            <select id="file-select" class="gnp-select" aria-label="File menu">
                                <option value="">📄 File</option>
                                <option value="new">New Document</option>
                                <option value="open">Open...</option>
                                <option value="save">Save</option>
                                <option value="saveas">Save As...</option>
                            </select>
                        </div>
                        
                        <div class="gnp-section">
                            <select id="fontsize-select" class="gnp-select" aria-label="Font size">
                                <option value="12px">12px</option>
                                <option value="14px">14px</option>
                                <option value="15px" selected>15px</option>
                                <option value="16px">16px</option>
                                <option value="18px">18px</option>
                                <option value="20px">20px</option>
                            </select>
                        </div>
                        
                        <div class="gnp-section">
                            <button class="gnp-btn" data-cmd="bold" title="Bold (Ctrl+B)"><b>B</b></button>
                            <button class="gnp-btn" data-cmd="italic" title="Italic (Ctrl+I)"><i>I</i></button>
                            <button class="gnp-btn" data-cmd="underline" title="Underline (Ctrl+U)"><u>U</u></button>
                            <button class="gnp-btn" data-cmd="strikeThrough" title="Strikethrough"><s>S</s></button>
                        </div>
                        
                        <div class="gnp-section">
                            <button class="gnp-btn" data-cmd="justifyLeft" title="Align Left">←</button>
                            <button class="gnp-btn" data-cmd="justifyCenter" title="Center">↔</button>
                            <button class="gnp-btn" data-cmd="justifyRight" title="Align Right">→</button>
                        </div>
                        
                        <div class="gnp-section">
                            <button class="gnp-btn" data-cmd="insertUnorderedList" title="Bullet List">• List</button>
                            <button class="gnp-btn" data-cmd="insertOrderedList" title="Numbered">1. List</button>
                        </div>
                        
                        <div class="gnp-section">
                            <input type="color" id="text-color" class="gnp-color" title="Text Color" value="#000000">
                            <input type="color" id="bg-color" class="gnp-color" title="Highlight" value="#ffff00">
                        </div>
                        
                        <div class="gnp-section">
                            <button class="gnp-btn" data-action="link" title="Insert Link">🔗</button>
                            <button class="gnp-btn" data-cmd="removeFormat" title="Clear Format">🧹</button>
                        </div>
                    </div>
                    
                    <div class="gnp-editor" id="editor" contenteditable="true"></div>
                    
                    <div class="gnp-statusbar">
                        <div class="gnp-status-left">
                            <span class="gnp-filename" id="filename">Untitled</span>
                            <span class="gnp-mod" id="mod-indicator" style="display:none">●</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:16px;">
                            <div class="gnp-autosave-indicator">
                                <span class="gnp-autosave-dot" id="autosave-dot"></span>
                                <span>Autosave: On</span>
                            </div>
                            <span id="status" style="color:${c.textLight};font-size:12px;">Ready</span>
                        </div>
                    </div>
                </div>
            `;
            
            const win = window.WindowManager.createWindow(CONFIG.APP_NAME, html, 900, 650);
            this.currentWindow = win;
            this.setupWindow(win, fileObj);
            return win;
        },

        /**
         * CRITICAL: openFile method for FileSys integration
         * This is called when a file is opened from Gnokefiles
         */
        async openFile(fileData) {
            console.log('[GNOKEPADApp] openFile called with:', fileData);
            
            // Open window if not already open
            if (!this.currentWindow || !this.currentWindow.parentNode) {
                this.open(fileData);
            } else {
                // Window already open, load the file into it
                this.loadFileIntoWindow(this.currentWindow, fileData);
            }
        },

        async loadFileIntoWindow(win, fileData) {
            try {
                let handle, content, filename;

                // Handle FileSystemFileHandle from Gnokefiles
                if (fileData.handle && typeof fileData.handle.getFile === 'function') {
                    handle = fileData.handle;
                    const file = await handle.getFile();
                    content = await file.text();
                    filename = file.name;
                }
                // Handle content passed directly
                else if (fileData.content) {
                    content = fileData.content;
                    filename = fileData.name || 'Untitled';
                    handle = null;
                }
                // Handle direct File object
                else if (fileData instanceof File) {
                    content = await fileData.text();
                    filename = fileData.name;
                    handle = null;
                }
                else {
                    console.error('[GNOKEPADApp] Invalid file data format:', fileData);
                    return;
                }

                const editor = win.querySelector('#editor');
                const filenameEl = win.querySelector('#filename');
                const handler = getHandler(filename);
                
                // Convert content to HTML for display
                const html = handler.read(content);
                editor.innerHTML = html;
                
                // Update window state
                filenameEl.textContent = filename;
                win.querySelector('.window-title').textContent = `${filename} - ${CONFIG.APP_NAME}`;
                
                // Store handle for saving
                if (handle) {
                    win._fileHandle = handle;
                }
                win._filename = filename;
                win._originalHtml = html;
                
                console.log('[GNOKEPADApp] Loaded file:', filename);
                
            } catch (error) {
                console.error('[GNOKEPADApp] Error loading file:', error);
                alert(`Failed to load file: ${error.message}`);
            }
        },
        
        setupWindow(win, fileObj) {
            const editor = win.querySelector('#editor');
            const filenameEl = win.querySelector('#filename');
            const modEl = win.querySelector('#mod-indicator');
            const statusEl = win.querySelector('#status');
            const autosaveDot = win.querySelector('#autosave-dot');
            
            let currentHandle = null;
            let currentName = 'Untitled';
            let isModified = false;
            let originalHtml = '<p>Start typing...</p>';
            let autosaveTimer = null;
            
            const toast = new Toast(win);

            editor.innerHTML = originalHtml;
            
            const updateTitle = () => {
                const title = `${currentName}${isModified ? ' •' : ''} - ${CONFIG.APP_NAME}`;
                const titleBar = win.querySelector('.window-title');
                if (titleBar) titleBar.textContent = title;
                filenameEl.textContent = currentName;
                modEl.style.display = isModified ? 'inline' : 'none';
            };
            
            const markModified = () => {
                const changed = editor.innerHTML !== originalHtml;
                if (changed !== isModified) {
                    isModified = changed;
                    updateTitle();
                }
            };
            
            const setStatus = (msg) => {
                statusEl.textContent = msg;
            };
            
            const startAutosave = () => {
                if (autosaveTimer) clearInterval(autosaveTimer);
                
                autosaveTimer = setInterval(() => {
                    if (isModified) {
                        try {
                            autosaveDot.classList.add('saving');
                            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify({
                                name: currentName,
                                content: editor.innerHTML
                            }));
                            setTimeout(() => autosaveDot.classList.remove('saving'), 500);
                        } catch (e) {
                            console.error('Autosave failed:', e);
                        }
                    }
                }, CONFIG.AUTOSAVE_INTERVAL_MS);
            };
            
            const newFile = () => {
                if (isModified && !confirm('Discard unsaved changes?')) return;
                currentHandle = null;
                currentName = 'Untitled';
                originalHtml = '<p>Start typing...</p>';
                editor.innerHTML = originalHtml;
                isModified = false;
                updateTitle();
                editor.focus();
                toast.show('New document created', 'success');
            };

            const writeFile = async (handle, html) => {
                try {
                    const handler = getHandler(handle.name);
                    const content = handler.write(html);
                    
                    const writable = await handle.createWritable();
                    await writable.write(content);
                    await writable.close();
                    
                    currentHandle = handle;
                    currentName = handle.name;
                    originalHtml = html;
                    isModified = false;
                    updateTitle();
                    
                    setStatus('Saved');
                    toast.show(`Saved: ${handle.name}`, 'success');
                    setTimeout(() => setStatus('Ready'), 2000);
                    return true;
                } catch (e) {
                    if (e.name !== 'AbortError') {
                        toast.show(`Error saving: ${e.message}`, 'error');
                    }
                    return false;
                }
            };

            const saveFile = async () => {
                if (currentHandle) {
                    await writeFile(currentHandle, editor.innerHTML);
                } else {
                    await saveFileAs();
                }
            };

            const saveFileAs = async () => {
                try {
                    const suggestedName = currentName === 'Untitled' 
                        ? 'document.txt' 
                        : currentName;

                    const handle = await window.showSaveFilePicker({
                        types: FILE_TYPES,
                        suggestedName: suggestedName
                    });
                    
                    await writeFile(handle, editor.innerHTML);
                } catch (e) {
                    if (e.name !== 'AbortError') {
                        toast.show(`Error: ${e.message}`, 'error');
                    }
                }
            };

            const openFile = async (handle = null) => {
                if (isModified && !confirm('Discard unsaved changes?')) return;
                
                try {
                    if (!handle) {
                        [handle] = await window.showOpenFilePicker({
                            types: FILE_TYPES,
                            multiple: false
                        });
                    }
                    
                    const file = await handle.getFile();
                    const handler = getHandler(file.name);
                    
                    setStatus(`Loading ${file.name}...`);
                    const rawContent = await file.text();
                    const html = handler.read(rawContent);

                    currentHandle = handle;
                    currentName = file.name;
                    originalHtml = html;
                    editor.innerHTML = html;
                    isModified = false;
                    updateTitle();
                    editor.focus();
                    
                    toast.show(`Opened: ${file.name}`, 'success');
                    setStatus('Ready');
                } catch (e) {
                    if (e.name !== 'AbortError') {
                        toast.show(`Error opening: ${e.message}`, 'error');
                    }
                }
            };

            const execCmd = (cmd, value = null) => {
                document.execCommand(cmd, false, value);
                editor.focus();
                updateBtnStates();
            };

            const updateBtnStates = () => {
                win.querySelectorAll('[data-cmd]').forEach(btn => {
                    const cmd = btn.dataset.cmd;
                    btn.classList.toggle('active', document.queryCommandState(cmd));
                });
            };
            
            // File menu
            const fileSelect = win.querySelector('#file-select');
            fileSelect.addEventListener('change', (e) => {
                const action = e.target.value;
                if (action === 'new') newFile();
                else if (action === 'open') openFile();
                else if (action === 'save') saveFile();
                else if (action === 'saveas') saveFileAs();
                fileSelect.value = '';
            });

            // Formatting buttons
            win.querySelectorAll('[data-cmd]').forEach(btn => {
                btn.onclick = () => execCmd(btn.dataset.cmd);
            });

            win.querySelector('[data-action="link"]').onclick = () => {
                const url = prompt('Enter URL:');
                if (url) execCmd('createLink', url);
            };

            // Font size
            win.querySelector('#fontsize-select').onchange = (e) => {
                editor.style.fontSize = e.target.value;
            };

            // Colors
            win.querySelector('#text-color').onchange = (e) => execCmd('foreColor', e.target.value);
            win.querySelector('#bg-color').onchange = (e) => execCmd('backColor', e.target.value);

            // Editor events
            editor.oninput = markModified;
            editor.onkeyup = updateBtnStates;
            editor.onclick = updateBtnStates;
            
            editor.onkeydown = (e) => {
                if (e.ctrlKey || e.metaKey) {
                    if (e.key === 's') { e.preventDefault(); saveFile(); }
                    else if (e.key === 'o') { e.preventDefault(); openFile(); }
                    else if (e.key === 'n') { e.preventDefault(); newFile(); }
                }
            };
            
            // Load autosave if available
            try {
                const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
                if (saved) {
                    const data = JSON.parse(saved);
                    if (data.content && !fileObj?.handle) {
                        editor.innerHTML = data.content;
                        currentName = data.name || 'Untitled';
                        originalHtml = data.content;
                        updateTitle();
                        toast.show('Restored from autosave', 'info');
                    }
                }
            } catch (e) {
                console.error('Failed to load autosave:', e);
            }
            
            // Load initial file if provided
            if (fileObj?.handle) {
                openFile(fileObj.handle);
            } else if (fileObj) {
                // Handle file data passed from FileSys
                this.loadFileIntoWindow(win, fileObj);
            }
            
            startAutosave();
            updateTitle();
            editor.focus();
            
            // Cleanup on window close
            const originalClose = win.close;
            if (originalClose) {
                win.close = function() {
                    if (autosaveTimer) clearInterval(autosaveTimer);
                    originalClose.call(win);
                };
            }
        }
    };
    
    if (window.AppRegistry) {
        window.AppRegistry.registerApp({
            id: 'gnokepad',
            name: 'Gnoke Pad',
            icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' rx='8' fill='%231a73e8'/%3E%3Crect x='10' y='10' width='28' height='28' rx='3' fill='white'/%3E%3Cpath fill='%231a73e8' d='M15 18h18M15 24h18M15 30h14' stroke='%231a73e8' stroke-width='2'/%3E%3C/svg%3E",
            handler: () => window.GNOKEPADApp.open(),
            singleInstance: false
        });
        
        console.log('[GNOKEPADApp] Registered with AppRegistry');
    }
})();
        