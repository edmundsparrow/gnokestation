// notepad.js - Rewritten for Stability and Encapsulation
(function() {
    
    // --- 1. LOCAL CSS (Minimized and Encapsulated) ---
    // Note: We won't inject this globally. It will be loaded inside the window content.
    const notepadStyle = `
        .notepad-container {
            display: flex;
            flex-direction: column;
            height: 100%;
        }
        .notepad-toolbar {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px;
            border-bottom: 1px solid #ddd;
            background: #f5f5f5;
            flex-wrap: wrap;
        }
        .notepad-btn {
            padding: 4px 8px;
            font-size: 11px;
            border: 1px solid #ccc;
            background: #fff;
            border-radius: 3px;
            cursor: pointer;
        }
        .notepad-btn:hover {
            background: #f0f0f0;
        }
        .notepad-btn.primary {
            background: #2b5797;
            color: white;
            border-color: #2b5797;
        }
        .notepad-separator {
            width: 1px;
            height: 20px;
            background: #ccc;
            margin: 0 4px;
        }
        .notepad-editor {
            flex-grow: 1;
            border: none;
            outline: none;
            resize: none;
            padding: 12px;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 13px;
            line-height: 1.5;
            background: #fff;
            white-space: pre; /* Default to no wrap */
            overflow-x: auto; /* Default for horizontal scrolling */
        }
        .notepad-status {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 4px 8px;
            border-top: 1px solid #ddd;
            background: #f5f5f5;
            font-size: 11px;
            color: #666;
        }
        .notepad-filename {
            font-weight: bold;
            color: #2b5797;
        }
        .notepad-modified {
            color: #d32f2f;
        }
        /* FILE DIALOG STYLES - Crucially nested inside the window container */
        .notepad-container .file-dialog-overlay { 
            position: absolute; /* Changed to absolute to stay inside the window */
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 10; /* Lower z-index for local window overlay */
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .notepad-container .file-dialog {
            background: white;
            border: 2px solid #2b5797;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            min-width: 300px;
            z-index: 11;
        }
        .file-dialog h4 {
            margin: 0 0 15px;
            color: #2b5797;
        }
        .file-dialog input, .file-dialog select {
            width: 100%;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
            margin-bottom: 15px;
            font-size: 13px;
            box-sizing: border-box;
        }
        .file-dialog-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
    `;

    // --- 2. VIRTUAL FILE SYSTEM UTILITIES ---

    function getVirtualFileSystem() {
        return JSON.parse(localStorage.getItem('virtual-fs') || '{}');
    }

    function saveVirtualFileSystem(fs) {
        localStorage.setItem('virtual-fs', JSON.stringify(fs));
    }

    // --- 3. APPLICATION LOGIC ---

    window.NotepadApp = {
        
        init() {
            // Check for WindowManager and register
            if (window.AppRegistry) {
                window.AppRegistry.registerApp({
                    id: 'notepad',
                    name: 'Notepad',
                    icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><rect x='8' y='6' width='32' height='36' rx='2' fill='%23fff' stroke='%232b5797' stroke-width='2'/><path d='M14 16h20M14 22h20M14 28h16' stroke='%232b5797' stroke-width='2'/></svg>",
                    handler: this.open,
                    singleInstance: false // Allow multiple notepad instances
                });
            } else {
                 console.error("AppRegistry not found. NotepadApp not registered.");
            }
        },

        open() {
            if (!window.WindowManager) {
                console.error("WindowManager not available. Cannot open Notepad.");
                return;
            }

            // Inject styles inside the HTML content for encapsulation
            const fullHTML = `
                <style>${notepadStyle}</style>
                <div class="notepad-container">
                    <div class="notepad-toolbar">
                        <button class="notepad-btn" id="new-file">New</button>
                        <button class="notepad-btn" id="open-file">Open</button>
                        <button class="notepad-btn primary" id="save-file">Save</button>
                        <button class="notepad-btn" id="save-as">Save As</button>
                        <div class="notepad-separator"></div>
                        <button class="notepad-btn" id="word-wrap">Word Wrap</button>
                        <button class="notepad-btn" id="find-replace">Find</button>
                        <div class="notepad-separator"></div>
                        <select class="notepad-btn" id="font-size">
                            <option value="11">11px</option>
                            <option value="13" selected>13px</option>
                            <option value="15">15px</option>
                            <option value="17">17px</option>
                            <option value="20">20px</option>
                        </select>
                    </div>
                    <textarea class="notepad-editor" id="notepad-editor" placeholder="Start typing..."></textarea>
                    <div class="notepad-status">
                        <span>
                            <span class="notepad-filename" id="current-filename">Untitled</span>
                            <span class="notepad-modified" id="modified-indicator" style="display:none">*</span>
                        </span>
                        <span id="cursor-position">Line 1, Column 1</span>
                    </div>
                </div>
            `;

            const win = WindowManager.createWindow('Untitled - Notepad', fullHTML, 600, 500);
            const winContent = win.querySelector('.window-content-body'); // Assuming WindowManager gives us a wrapper

            // --- Window-local state and element references ---
            const editor = win.querySelector('#notepad-editor');
            const filenameSpan = win.querySelector('#current-filename');
            const modifiedIndicator = win.querySelector('#modified-indicator');
            const cursorPosition = win.querySelector('#cursor-position');
            
            let currentFilename = 'Untitled';
            let isModified = false;
            let originalContent = '';
            let wordWrapEnabled = false;

            // --- Core Functions ---
            
            function updateTitle() {
                const title = `${currentFilename}${isModified ? ' *' : ''} - Notepad`;
                // Assuming WindowManager has a method or element structure to update the title
                if (win.setTitle) { 
                    win.setTitle(title); 
                } else {
                    win.querySelector('.title-text').textContent = title; 
                }
                
                filenameSpan.textContent = currentFilename;
                modifiedIndicator.style.display = isModified ? 'inline' : 'none';
            }

            function markAsModified() {
                if (editor.value !== originalContent) {
                    if (!isModified) {
                        isModified = true;
                        updateTitle();
                    }
                } else if (isModified) {
                    isModified = false;
                    updateTitle();
                }
            }

            function updateCursorPosition() {
                const text = editor.value.substring(0, editor.selectionStart);
                const lines = text.split('\n');
                const line = lines.length;
                const column = lines[lines.length - 1].length + 1;
                cursorPosition.textContent = `Line ${line}, Column ${column}`;
            }

            function newFile() {
                if (isModified && !confirm('You have unsaved changes. Are you sure you want to create a new file?')) {
                    return;
                }
                editor.value = '';
                originalContent = '';
                currentFilename = 'Untitled';
                isModified = false;
                updateTitle();
                editor.focus();
            }

            // --- Dialogs (Encapsulated) ---

            function showSaveDialog(callback) {
                const overlay = document.createElement('div');
                overlay.className = 'file-dialog-overlay';
                
                const dialog = document.createElement('div');
                dialog.className = 'file-dialog';
                dialog.innerHTML = `
                    <h4>Save File</h4>
                    <input type="text" id="filename-input" placeholder="Enter filename..." value="${currentFilename !== 'Untitled' ? currentFilename : ''}">
                    <div class="file-dialog-actions">
                        <button class="notepad-btn" id="dialog-cancel">Cancel</button>
                        <button class="notepad-btn primary" id="dialog-save">Save</button>
                    </div>
                `;

                overlay.appendChild(dialog);
                winContent.appendChild(overlay); // Append to the window content, not document.body!

                const filenameInput = dialog.querySelector('#filename-input');
                const saveBtn = dialog.querySelector('#dialog-save');
                const cancelBtn = dialog.querySelector('#dialog-cancel');

                filenameInput.focus();
                filenameInput.select();

                function closeDialog() {
                    winContent.removeChild(overlay);
                }

                function save() {
                    const filename = filenameInput.value.trim();
                    if (!filename) {
                        alert('Please enter a filename');
                        return;
                    }
                    closeDialog();
                    callback(filename);
                }

                saveBtn.addEventListener('click', save);
                cancelBtn.addEventListener('click', closeDialog);
                
                filenameInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') { e.preventDefault(); save(); } 
                    else if (e.key === 'Escape') { closeDialog(); }
                });
            }

            function saveFile(filename = currentFilename) {
                if (filename === 'Untitled') {
                    showSaveDialog(saveFile);
                    return;
                }

                // Ensure 'documents' folder exists in VFS
                const fs = getVirtualFileSystem();
                if (!fs['documents'] || fs['documents'].type !== 'folder') {
                    fs['documents'] = { type: 'folder', children: {} };
                }

                // Save file content
                fs['documents'].children[filename] = {
                    type: 'file',
                    content: editor.value,
                    modified: new Date().toISOString()
                };

                saveVirtualFileSystem(fs);
                
                currentFilename = filename;
                originalContent = editor.value;
                isModified = false;
                updateTitle();
                
                // Show brief save confirmation
                const status = win.querySelector('.notepad-status');
                const originalBg = status.style.backgroundColor;
                status.style.backgroundColor = '#d4edda';
                setTimeout(() => {
                    status.style.backgroundColor = originalBg;
                }, 1000);
            }

            function showOpenDialog() {
                const fs = getVirtualFileSystem();
                const documents = fs['documents']?.children || {};
                const textFiles = Object.keys(documents).filter(name => 
                    documents[name].type === 'file' && documents[name].content !== undefined
                );

                if (textFiles.length === 0) {
                    alert('No text files found in documents folder to open.');
                    return;
                }

                const overlay = document.createElement('div');
                overlay.className = 'file-dialog-overlay';
                
                const dialog = document.createElement('div');
                dialog.className = 'file-dialog';
                dialog.innerHTML = `
                    <h4>Open File</h4>
                    <select id="file-select" style="width:100%; padding:8px; margin-bottom:15px;">
                        ${textFiles.map(name => `<option value="${name}">${name}</option>`).join('')}
                    </select>
                    <div class="file-dialog-actions">
                        <button class="notepad-btn" id="dialog-cancel">Cancel</button>
                        <button class="notepad-btn primary" id="dialog-open">Open</button>
                    </div>
                `;

                overlay.appendChild(dialog);
                winContent.appendChild(overlay);

                const fileSelect = dialog.querySelector('#file-select');
                const openBtn = dialog.querySelector('#dialog-open');
                const cancelBtn = dialog.querySelector('#dialog-cancel');

                function closeDialog() {
                    winContent.removeChild(overlay);
                }

                function openFile() {
                    const filename = fileSelect.value;
                    if (!filename) return;

                    if (isModified && !confirm('You have unsaved changes. Are you sure you want to open another file?')) {
                        return;
                    }

                    const fileData = documents[filename];
                    if (fileData && fileData.content !== undefined) {
                        editor.value = fileData.content;
                        originalContent = fileData.content;
                        currentFilename = filename;
                        isModified = false;
                        updateTitle();
                        closeDialog();
                        editor.focus();
                    }
                }

                openBtn.addEventListener('click', openFile);
                cancelBtn.addEventListener('click', closeDialog);
                
                fileSelect.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') { openFile(); } 
                    else if (e.key === 'Escape') { closeDialog(); }
                });
            }

            function toggleWordWrap() {
                wordWrapEnabled = !wordWrapEnabled;
                editor.style.whiteSpace = wordWrapEnabled ? 'pre-wrap' : 'pre';
                editor.style.overflowX = wordWrapEnabled ? 'hidden' : 'auto';
                win.querySelector('#word-wrap').textContent = wordWrapEnabled ? 'No Wrap' : 'Word Wrap';
            }

            function showFindReplace() {
                // Using a simpler prompt/confirm/alert for stability over a complex custom modal
                const searchTerm = prompt('Find:');
                if (!searchTerm) return;

                const content = editor.value;
                const index = content.toLowerCase().indexOf(searchTerm.toLowerCase());
                
                if (index !== -1) {
                    editor.focus();
                    editor.setSelectionRange(index, index + searchTerm.length);
                    
                    const replace = confirm('Text found. Replace this occurrence?');
                    if (replace) {
                        const replacement = prompt('Replace with:', searchTerm);
                        if (replacement !== null) { // User didn't hit cancel
                            editor.value = content.substring(0, index) + replacement + content.substring(index + searchTerm.length);
                            markAsModified();
                        }
                    }
                } else {
                    alert('Text not found.');
                }
            }
            
            // --- Window Close Handler ---
            // Ensure the user is prompted to save before closing
            // Assumes WindowManager allows intercepting the close event
            if (win.setCloseHandler) {
                win.setCloseHandler((e) => {
                    if (isModified) {
                         const confirmClose = confirm('You have unsaved changes. Close without saving?');
                         return confirmClose; // true allows close, false prevents it
                    }
                    return true; // OK to close
                });
            }

            // --- Event Listeners ---
            win.querySelector('#new-file').addEventListener('click', newFile);
            win.querySelector('#open-file').addEventListener('click', showOpenDialog);
            win.querySelector('#save-file').addEventListener('click', () => saveFile());
            win.querySelector('#save-as').addEventListener('click', () => showSaveDialog(saveFile));
            win.querySelector('#word-wrap').addEventListener('click', toggleWordWrap);
            win.querySelector('#find-replace').addEventListener('click', showFindReplace);

            win.querySelector('#font-size').addEventListener('change', (e) => {
                editor.style.fontSize = e.target.value + 'px';
            });

            editor.addEventListener('input', markAsModified);
            editor.addEventListener('keyup', updateCursorPosition);
            editor.addEventListener('click', updateCursorPosition);

            // Keyboard shortcuts (attached to the editor for focus)
            editor.addEventListener('keydown', (e) => {
                if (e.ctrlKey) {
                    switch (e.key) {
                        case 's': e.preventDefault(); saveFile(); break;
                        case 'o': e.preventDefault(); showOpenDialog(); break;
                        case 'n': e.preventDefault(); newFile(); break;
                        case 'f': e.preventDefault(); showFindReplace(); break;
                    }
                }
            });

            // Initial setup
            updateTitle();
            updateCursorPosition();
            editor.focus();
        }
    };

    window.NotepadApp.init();
})();

