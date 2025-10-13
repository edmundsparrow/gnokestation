/*
 * Gnokestation Shell
 * Copyright (C) 2025 Ekong Ikpe <ekongmikpe@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Gnoke Station Auto-Injection Language System
 * Automatically translates ALL apps without modifying individual app code
 */

const GnokeTranslations = {
    en: {
        // System
        systemName: "Gnoke Station",
        desktop: "Desktop",
        taskbar: "Taskbar",
        
        // Actions
        open: "Open", close: "Close", minimize: "Minimize", maximize: "Maximize",
        save: "Save", cancel: "Cancel", delete: "Delete", edit: "Edit",
        add: "Add", remove: "Remove", refresh: "Refresh", back: "Back",
        next: "Next", previous: "Previous", submit: "Submit", reset: "Reset",
        
        // Auth
        username: "Username", password: "Password", login: "Login", logout: "Logout",
        
        // Apps
        calculator: "Calculator", clock: "Clock", weather: "Weather",
        news: "News", aiChat: "AI Chat", terminal: "Terminal",
        settings: "Settings", appStore: "App Store", gpio: "GPIO Controller",
        wled: "WLED Controller", sensors: "Industrial Sensors",
        
        // Settings
        display: "Display", language: "Language", network: "Network",
        system: "System", appearance: "Appearance", brightness: "Brightness",
        theme: "Theme", light: "Light", dark: "Dark",
        
        // Status
        loading: "Loading...", error: "Error", success: "Success",
        warning: "Warning", connected: "Connected", disconnected: "Disconnected",
        online: "Online", offline: "Offline",
        
        // Time
        today: "Today", yesterday: "Yesterday", tomorrow: "Tomorrow",
        hour: "Hour", minute: "Minute", second: "Second",
        
        // Industrial
        emergency: "Emergency", emergencyStop: "Emergency Stop",
        temperature: "Temperature", pressure: "Pressure",
        sensors: "Sensors", control: "Control", monitoring: "Monitoring",
        deviceStatus: "Device Status", safetyWarning: "Safety Warning",
        
        // Numbers
        zero: "0", one: "1", two: "2", three: "3", four: "4",
        five: "5", six: "6", seven: "7", eight: "8", nine: "9",
    },
    
    fr: {
        systemName: "Gnoke Station",
        desktop: "Bureau",
        taskbar: "Barre des tâches",
        
        open: "Ouvrir", close: "Fermer", minimize: "Réduire", maximize: "Agrandir",
        save: "Enregistrer", cancel: "Annuler", delete: "Supprimer", edit: "Modifier",
        add: "Ajouter", remove: "Retirer", refresh: "Actualiser", back: "Retour",
        next: "Suivant", previous: "Précédent", submit: "Soumettre", reset: "Réinitialiser",
        
        username: "Nom d'utilisateur", password: "Mot de passe", login: "Connexion", logout: "Déconnexion",
        
        calculator: "Calculatrice", clock: "Horloge", weather: "Météo",
        news: "Actualités", aiChat: "Chat IA", terminal: "Terminal",
        settings: "Paramètres", appStore: "Magasin", gpio: "Contrôleur GPIO",
        wled: "Contrôleur WLED", sensors: "Capteurs industriels",
        
        display: "Affichage", language: "Langue", network: "Réseau",
        system: "Système", appearance: "Apparence", brightness: "Luminosité",
        theme: "Thème", light: "Clair", dark: "Sombre",
        
        loading: "Chargement...", error: "Erreur", success: "Succès",
        warning: "Avertissement", connected: "Connecté", disconnected: "Déconnecté",
        online: "En ligne", offline: "Hors ligne",
        
        today: "Aujourd'hui", yesterday: "Hier", tomorrow: "Demain",
        hour: "Heure", minute: "Minute", second: "Seconde",
        
        emergency: "Urgence", emergencyStop: "Arrêt d'urgence",
        temperature: "Température", pressure: "Pression",
        sensors: "Capteurs", control: "Contrôle", monitoring: "Surveillance",
        deviceStatus: "État du dispositif", safetyWarning: "Avertissement de sécurité",
        
        zero: "0", one: "1", two: "2", three: "3", four: "4",
        five: "5", six: "6", seven: "7", eight: "8", nine: "9",
    },
    
    es: {
        systemName: "Gnoke Station",
        desktop: "Escritorio",
        taskbar: "Barra de tareas",
        
        open: "Abrir", close: "Cerrar", minimize: "Minimizar", maximize: "Maximizar",
        save: "Guardar", cancel: "Cancelar", delete: "Eliminar", edit: "Editar",
        add: "Añadir", remove: "Quitar", refresh: "Actualizar", back: "Atrás",
        next: "Siguiente", previous: "Anterior", submit: "Enviar", reset: "Restablecer",
        
        username: "Usuario", password: "Contraseña", login: "Entrar", logout: "Salir",
        
        calculator: "Calculadora", clock: "Reloj", weather: "Clima",
        news: "Noticias", aiChat: "Chat IA", terminal: "Terminal",
        settings: "Configuración", appStore: "Tienda", gpio: "Controlador GPIO",
        wled: "Controlador WLED", sensors: "Sensores industriales",
        
        display: "Pantalla", language: "Idioma", network: "Red",
        system: "Sistema", appearance: "Apariencia", brightness: "Brillo",
        theme: "Tema", light: "Claro", dark: "Oscuro",
        
        loading: "Cargando...", error: "Error", success: "Éxito",
        warning: "Advertencia", connected: "Conectado", disconnected: "Desconectado",
        online: "En línea", offline: "Fuera de línea",
        
        today: "Hoy", yesterday: "Ayer", tomorrow: "Mañana",
        hour: "Hora", minute: "Minuto", second: "Segundo",
        
        emergency: "Emergencia", emergencyStop: "Parada de emergencia",
        temperature: "Temperatura", pressure: "Presión",
        sensors: "Sensores", control: "Control", monitoring: "Monitoreo",
        deviceStatus: "Estado del dispositivo", safetyWarning: "Advertencia de seguridad",
        
        zero: "0", one: "1", two: "2", three: "3", four: "4",
        five: "5", six: "6", seven: "7", eight: "8", nine: "9",
    }
};

/**
 * Auto-Injection Language Manager
 */
window.LanguageManager = {
    lang: 'en',
    observer: null,
    
    init() {
        const saved = localStorage.getItem('gnokeLanguage');
        const browser = navigator.language.split('-')[0];
        this.lang = saved || (GnokeTranslations[browser] ? browser : 'en');
        
        // Start watching for new elements
        this.startWatching();
        // Translate everything currently on page
        this.translateAll();
    },
    
    t(key) {
        return GnokeTranslations[this.lang][key] || GnokeTranslations.en[key] || key;
    },
    
    /**
     * Auto-translate text content by matching against English dictionary
     */
    autoTranslate(text) {
        if (!text || text.trim() === '') return text;
        
        const trimmed = text.trim().toLowerCase();
        
        // Find matching English key
        for (let key in GnokeTranslations.en) {
            if (GnokeTranslations.en[key].toLowerCase() === trimmed) {
                return GnokeTranslations[this.lang][key] || text;
            }
        }
        
        return text; // No translation found, return original
    },
    
    /**
     * Translate a single element
     */
    translateElement(el) {
        // Skip script, style, and already processed elements
        if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.dataset.translated) {
            return;
        }
        
        // Handle input placeholders
        if (el.placeholder) {
            el.placeholder = this.autoTranslate(el.placeholder);
        }
        
        // Handle button/label text
        if (el.value && (el.tagName === 'BUTTON' || el.tagName === 'INPUT')) {
            el.value = this.autoTranslate(el.value);
        }
        
        // Handle text content (only direct text nodes, not children)
        if (el.childNodes.length > 0) {
            el.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                    const translated = this.autoTranslate(node.textContent);
                    if (translated !== node.textContent) {
                        node.textContent = translated;
                    }
                }
            });
        }
        
        el.dataset.translated = 'true';
    },
    
    /**
     * Translate all elements on page
     */
    translateAll() {
        const elements = document.querySelectorAll('button, label, h1, h2, h3, h4, h5, h6, p, span, a, input, select, option, th, td');
        elements.forEach(el => this.translateElement(el));
    },
    
    /**
     * Watch for new elements added to DOM (like opened apps)
     */
    startWatching() {
        if (this.observer) this.observer.disconnect();
        
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.translateElement(node);
                        // Also translate all children
                        const children = node.querySelectorAll('button, label, h1, h2, h3, h4, h5, h6, p, span, a, input');
                        children.forEach(child => this.translateElement(child));
                    }
                });
            });
        });
        
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    },
    
    /**
     * Switch language and retranslate everything
     */
    setLanguage(code) {
        if (!GnokeTranslations[code]) return false;
        
        this.lang = code;
        localStorage.setItem('gnokeLanguage', code);
        
        // Clear all translation flags and retranslate
        document.querySelectorAll('[data-translated]').forEach(el => {
            delete el.dataset.translated;
        });
        
        this.translateAll();
        
        // Notify apps
        if (window.EventBus) {
            window.EventBus.emit('language-changed', { language: code });
        }
        
        return true;
    },
    
    getLanguages() {
        return [
            { code: 'en', name: 'English', flag: '🇬🇧' },
            { code: 'fr', name: 'Français', flag: '🇫🇷' },
            { code: 'es', name: 'Español', flag: '🇪🇸' }
        ];
    }
};

/**
 * Language Switcher UI
 */
window.createLanguageSwitcher = function() {
    const container = document.createElement('div');
    container.style.cssText = 'padding: 15px; background: #f9f9f9; border-radius: 8px;';
    
    const title = document.createElement('h3');
    title.textContent = window.LanguageManager.t('language');
    title.style.marginBottom = '10px';
    container.appendChild(title);
    
    const btnGroup = document.createElement('div');
    btnGroup.style.cssText = 'display: flex; gap: 10px;';
    
    window.LanguageManager.getLanguages().forEach(lang => {
        const btn = document.createElement('button');
        const isCurrent = window.LanguageManager.lang === lang.code;
        
        btn.innerHTML = `${lang.flag} ${lang.name}`;
        btn.style.cssText = `
            padding: 10px 20px;
            border: 2px solid ${isCurrent ? '#667eea' : '#ddd'};
            background: ${isCurrent ? '#667eea' : 'white'};
            color: ${isCurrent ? 'white' : '#333'};
            border-radius: 6px;
            cursor: pointer;
            font-size: 15px;
            font-weight: 600;
            transition: all 0.2s;
        `;
        
        btn.onclick = () => {
            window.LanguageManager.setLanguage(lang.code);
        };
        
        btnGroup.appendChild(btn);
    });
    
    container.appendChild(btnGroup);
    return container;
};

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.LanguageManager.init());
} else {
    window.LanguageManager.init();
}

/**
 * USAGE - NO CODE CHANGES NEEDED IN APPS!
 * 
 * 1. Load this file: <script src="js/languages.js"></script>
 * 2. Add switcher to Settings: settingsPanel.appendChild(createLanguageSwitcher());
 * 3. Done! All apps auto-translate
 * 
 * The system watches for:
 * - Buttons, labels, headings, paragraphs
 * - Input placeholders
 * - New elements added to DOM (newly opened apps)
 * 
 * It matches English text against the dictionary and replaces with translations
 */

