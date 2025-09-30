// APPLICATIONS/CONTACTS.JS - System Contacts Manager
/**
 * FILE: applications/contacts.js
 * VERSION: 1.0.0-beta
 * BUILD DATE: 2025-09-22
 *
 * PURPOSE:
 *   Lightweight contacts management application with system dialer integration.
 *   Provides CRUD operations for contacts with persistent localStorage storage
 *   and native calling capabilities through system dialer.
 *
 * ARCHITECTURE:
 *   - IIFE pattern with window.ContactsApp namespace
 *   - Single window interface with inline form toggle
 *   - localStorage for contact persistence
 *   - System dialer integration via tel: protocol
 *
 * LIFECYCLE:
 *   1. AppRegistry launches ContactsApp.open() on user interaction
 *   2. Window created with contact list and hidden form interface
 *   3. Contacts loaded from localStorage and rendered
 *   4. User can add/edit/delete contacts and initiate calls
 *   5. All changes automatically persisted to localStorage
 *
 * EXTENSION POINTS:
 *   - SYNC: Cloud synchronization with external contact services
 *   - IMPORT/EXPORT: vCard import/export functionality
 *   - GROUPS: Contact categorization and grouping
 *   - PHOTOS: Avatar/photo support for contacts
 *   - HISTORY: Call history integration and tracking
 *   - SEARCH: Advanced search with filters and sorting
 *
 * CUDOS:
 *   edmundsparrow.netlify.app | whatsappme @ 09024054758 | webaplications5050@gmail.com
 *
 * NOTES:
 *   - Uses tel: protocol for system dialer integration
 *   - Supports USSD codes and international number formats
 *   - Minimal UI focused on essential contact management
 *   - Auto-sorts contacts alphabetically by name
 */

(function() {
  window.ContactsApp = {
    contacts: [],
    currentWindow: null,

    open() {
      const contactsHTML = `
        <div style="display:flex;flex-direction:column;height:100%;font-family:'Segoe UI',sans-serif;background:#f8f9fa">
          
          <div style="padding:12px;border-bottom:1px solid #dee2e6;background:white;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
            <div style="display:flex;gap:10px;align-items:center">
              <input type="text" id="search-contacts" placeholder="Search contacts..." 
                style="flex:1;padding:8px 12px;border:1px solid #ced4da;border-radius:6px;font-size:14px">
              <button id="add-contact-btn" 
                style="padding:8px 16px;background:#007bff;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600">
                + Add
              </button>
            </div>
          </div>
          
          <div id="contacts-list" style="flex:1;overflow-y:auto;padding:10px">
            <div style="text-align:center;color:#6c757d;padding:60px 20px;font-style:italic">
              No contacts yet. Click "Add" to create your first contact.
            </div>
          </div>
          
          <div id="contact-form" style="display:none;padding:15px;border-top:1px solid #dee2e6;background:white">
            <div style="margin-bottom:12px">
              <input type="text" id="contact-name" placeholder="Full Name" required
                style="width:100%;padding:10px;border:1px solid #ced4da;border-radius:6px;font-size:14px;box-sizing:border-box">
            </div>
            <div style="margin-bottom:12px">
              <input type="tel" id="contact-phone" placeholder="Phone Number"
                style="width:100%;padding:10px;border:1px solid #ced4da;border-radius:6px;font-size:14px;box-sizing:border-box">
            </div>
            <div style="margin-bottom:15px">
              <input type="email" id="contact-email" placeholder="Email Address"
                style="width:100%;padding:10px;border:1px solid #ced4da;border-radius:6px;font-size:14px;box-sizing:border-box">
            </div>
            <div style="display:flex;gap:10px;justify-content:flex-end">
              <button id="cancel-contact" 
                style="padding:8px 16px;border:1px solid #6c757d;background:white;border-radius:6px;cursor:pointer">
                Cancel
              </button>
              <button id="save-contact" 
                style="padding:8px 16px;background:#28a745;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600">
                Save
              </button>
            </div>
          </div>
        </div>
      `;

      const win = window.WindowManager.createWindow('Contacts', contactsHTML, 400, 500);
      this.currentWindow = win;
      this.setupContacts(win);
      return win;
    },

    setupContacts(win) {
      this.loadContacts();
      
      const contactsList = win.querySelector('#contacts-list');
      const contactForm = win.querySelector('#contact-form');
      const searchBox = win.querySelector('#search-contacts');
      
      // Ensure form is hidden on startup
      contactForm.style.display = 'none';
      
      let editingContactId = null;

      const renderContacts = (contacts = this.contacts) => {
        if (contacts.length === 0) {
          contactsList.innerHTML = `
            <div style="text-align:center;color:#6c757d;padding:60px 20px;font-style:italic">
              No contacts yet. Click "Add" to create your first contact.
            </div>`;
          return;
        }

        contactsList.innerHTML = contacts.map(contact => `
          <div style="background:white;border:1px solid #dee2e6;border-radius:8px;padding:12px;margin-bottom:8px;box-shadow:0 1px 3px rgba(0,0,0,0.05)">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div style="flex:1">
                <div style="font-weight:600;font-size:16px;color:#212529;margin-bottom:4px">${this.escapeHtml(contact.name)}</div>
                ${contact.phone ? `<div style="font-size:14px;color:#6c757d;margin-bottom:2px">${this.escapeHtml(contact.phone)}</div>` : ''}
                ${contact.email ? `<div style="font-size:14px;color:#6c757d">${this.escapeHtml(contact.email)}</div>` : ''}
              </div>
              <div style="display:flex;gap:6px;margin-left:10px">
                ${contact.phone ? `<button onclick="window.ContactsApp.callContact('${contact.phone}')" title="Call ${this.escapeHtml(contact.name)}"
                  style="padding:6px 10px;background:#28a745;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px">📞</button>` : ''}
                <button onclick="window.ContactsApp.editContact('${contact.id}')" title="Edit"
                  style="padding:6px 10px;background:#007bff;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px">✏️</button>
                <button onclick="window.ContactsApp.deleteContact('${contact.id}')" title="Delete"
                  style="padding:6px 10px;background:#dc3545;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px">🗑️</button>
              </div>
            </div>
          </div>
        `).join('');
      };

      const showForm = (contact = null) => {
        editingContactId = contact?.id || null;
        win.querySelector('#contact-name').value = contact?.name || '';
        win.querySelector('#contact-phone').value = contact?.phone || '';
        win.querySelector('#contact-email').value = contact?.email || '';
        contactForm.style.display = 'block';
        win.querySelector('#contact-name').focus();
      };

      const hideForm = () => {
        contactForm.style.display = 'none';
        editingContactId = null;
      };

      const saveContact = () => {
        const name = win.querySelector('#contact-name').value.trim();
        if (!name) {
          this.showNotification('Name is required', 'warning');
          return;
        }

        const contactData = {
          name,
          phone: win.querySelector('#contact-phone').value.trim(),
          email: win.querySelector('#contact-email').value.trim(),
        };

        if (editingContactId) {
          const index = this.contacts.findIndex(c => c.id === editingContactId);
          if (index !== -1) {
            this.contacts[index] = { ...this.contacts[index], ...contactData };
            this.showNotification('Contact updated successfully', 'success');
          }
        } else {
          this.contacts.push({
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            ...contactData,
            created: new Date().toISOString()
          });
          this.showNotification('Contact added successfully', 'success');
        }

        this.contacts.sort((a, b) => a.name.localeCompare(b.name));
        this.saveContacts();
        renderContacts();
        hideForm();
      };

      // Event handlers
      win.querySelector('#add-contact-btn').onclick = () => showForm();
      win.querySelector('#cancel-contact').onclick = hideForm;
      win.querySelector('#save-contact').onclick = saveContact;

      searchBox.oninput = (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (!query) {
          renderContacts();
          return;
        }
        const filtered = this.contacts.filter(contact => 
          contact.name.toLowerCase().includes(query) ||
          (contact.phone && contact.phone.toLowerCase().includes(query)) ||
          (contact.email && contact.email.toLowerCase().includes(query))
        );
        renderContacts(filtered);
      };

      // Form submission on Enter
      contactForm.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          saveContact();
        }
      });

      renderContacts();
    },

    // Global methods for onclick handlers
    editContact(id) {
      if (!this.currentWindow) return;
      const contact = this.contacts.find(c => c.id === id);
      if (contact) {
        const showForm = () => {
          const form = this.currentWindow.querySelector('#contact-form');
          this.currentWindow.querySelector('#contact-name').value = contact.name;
          this.currentWindow.querySelector('#contact-phone').value = contact.phone || '';
          this.currentWindow.querySelector('#contact-email').value = contact.email || '';
          form.style.display = 'block';
          
          // Update save handler for editing
          this.currentWindow.querySelector('#save-contact').onclick = () => {
            const name = this.currentWindow.querySelector('#contact-name').value.trim();
            if (!name) {
              this.showNotification('Name is required', 'warning');
              return;
            }
            
            const index = this.contacts.findIndex(c => c.id === id);
            if (index !== -1) {
              this.contacts[index] = {
                ...this.contacts[index],
                name,
                phone: this.currentWindow.querySelector('#contact-phone').value.trim(),
                email: this.currentWindow.querySelector('#contact-email').value.trim()
              };
              
              this.contacts.sort((a, b) => a.name.localeCompare(b.name));
              this.saveContacts();
              this.renderContactsList();
              form.style.display = 'none';
              this.showNotification('Contact updated successfully', 'success');
            }
          };
        };
        showForm();
      }
    },

    deleteContact(id) {
      const contact = this.contacts.find(c => c.id === id);
      if (contact && confirm(`Delete ${contact.name}?`)) {
        this.contacts = this.contacts.filter(c => c.id !== id);
        this.saveContacts();
        this.renderContactsList();
        this.showNotification('Contact deleted', 'info');
      }
    },

    callContact(phoneNumber) {
      if (!phoneNumber) return;
      
      // Use tel: protocol to invoke system dialer
      // This works with regular numbers, international formats, and USSD codes
      window.location.href = `tel:${encodeURIComponent(phoneNumber)}`;
      
      this.showNotification(`Calling ${phoneNumber}...`, 'info');
    },

    renderContactsList() {
      if (!this.currentWindow) return;
      const contactsList = this.currentWindow.querySelector('#contacts-list');
      
      if (this.contacts.length === 0) {
        contactsList.innerHTML = `
          <div style="text-align:center;color:#6c757d;padding:60px 20px;font-style:italic">
            No contacts yet. Click "Add" to create your first contact.
          </div>`;
        return;
      }

      contactsList.innerHTML = this.contacts.map(contact => `
        <div style="background:white;border:1px solid #dee2e6;border-radius:8px;padding:12px;margin-bottom:8px;box-shadow:0 1px 3px rgba(0,0,0,0.05)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div style="flex:1">
              <div style="font-weight:600;font-size:16px;color:#212529;margin-bottom:4px">${this.escapeHtml(contact.name)}</div>
              ${contact.phone ? `<div style="font-size:14px;color:#6c757d;margin-bottom:2px">${this.escapeHtml(contact.phone)}</div>` : ''}
              ${contact.email ? `<div style="font-size:14px;color:#6c757d">${this.escapeHtml(contact.email)}</div>` : ''}
            </div>
            <div style="display:flex;gap:6px;margin-left:10px">
              ${contact.phone ? `<button onclick="window.ContactsApp.callContact('${contact.phone}')" title="Call ${this.escapeHtml(contact.name)}"
                style="padding:6px 10px;background:#28a745;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px">📞</button>` : ''}
              <button onclick="window.ContactsApp.editContact('${contact.id}')" title="Edit"
                style="padding:6px 10px;background:#007bff;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px">✏️</button>
              <button onclick="window.ContactsApp.deleteContact('${contact.id}')" title="Delete"
                style="padding:6px 10px;background:#dc3545;color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px">🗑️</button>
            </div>
          </div>
        </div>
      `).join('');
    },

    loadContacts() {
      try {
        this.contacts = JSON.parse(localStorage.getItem('webos-contacts') || '[]');
      } catch (e) {
        this.contacts = [];
      }
    },

    saveContacts() {
      try {
        localStorage.setItem('webos-contacts', JSON.stringify(this.contacts));
      } catch (e) {
        this.showNotification('Failed to save contacts', 'warning');
      }
    },

    showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      const colors = {
        success: '#28a745',
        warning: '#ffc107',
        info: '#007bff'
      };
      
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        font-family: 'Segoe UI', Arial, sans-serif;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        opacity: 0;
        transform: translateX(100px);
        transition: all 0.3s ease;
        max-width: 300px;
      `;
      
      notification.textContent = message;
      document.body.appendChild(notification);
      
      requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
      });
      
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100px)';
        setTimeout(() => {
          if (notification.parentNode) {
            document.body.removeChild(notification);
          }
        }, 300);
      }, 3000);
    },

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  };

  // Register app
  if (typeof AppRegistry !== 'undefined') {
    AppRegistry.registerApp({
      id: 'contacts',
      name: 'Contacts',
      icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><circle cx='24' cy='18' r='8' fill='%23007bff'/><path d='M8 38c0-8 7.2-14 16-14s16 6 16 14' fill='%23007bff'/></svg>",
      handler: () => window.ContactsApp.open()
    });
  }

  // Register documentation
  if (window.Docs && typeof window.Docs.registerDocumentation === 'function') {
    window.Docs.registerDocumentation('contacts', {
      name: "Contacts",
      version: "1.0.0-beta",
      description: "Lightweight contacts management application with system dialer integration and persistent storage",
      type: "User App",
      features: [
        "Add, edit, and delete contacts with name, phone, and email fields",
        "Real-time search across all contact fields",
        "System dialer integration via tel: protocol for calling",
        "USSD code support and international number formats",
        "Automatic alphabetical sorting by contact name",
        "Persistent localStorage storage with error handling"
      ],
      dependencies: ["WindowManager", "AppRegistry"],
      methods: [
        { name: "open", description: "Creates the contacts window with list and form interface" },
        { name: "callContact", description: "Initiates system dialer call using tel: protocol" },
        { name: "editContact", description: "Opens contact for editing with pre-filled form data" },
        { name: "deleteContact", description: "Removes contact after user confirmation" },
        { name: "loadContacts", description: "Loads contacts from localStorage with error handling" },
        { name: "saveContacts", description: "Persists contacts to localStorage with error handling" }
      ],
      notes: "Beta version focused on essential contact management. Uses tel: protocol for native dialer integration supporting regular numbers, international formats, and USSD codes.",
      cudos: "edmundsparrow.netlify.app | whatsappme @ 09024054758 | webaplications5050@gmail.com",
      auto_generated: false
    });
  }
})();