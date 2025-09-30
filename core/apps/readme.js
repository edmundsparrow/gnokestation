/* ========================================
 * FILE: core/apps/readme.js
 * PURPOSE: Dedicated application to view the Project README/Briefing (SYSTEM APP)
 * DEPENDENCIES: WindowManager, AppRegistry
 * ======================================== */

window.ReadmeApp = {
    currentWindow: null,
    // CORRECTED: Updated the URL to GnokeStation repository
    GITHUB_README_URL: "https://github.com/edmundsparrow/gnokestation/blob/main/README.md",

    open() {
        // Prevent multiple instances if singleInstance is set to true in registration, 
        // though we allow it here for simplicity in case the registration missed it.
        if (this.currentWindow && this.currentWindow.isOpen) {
            window.WindowManager.focusWindow(this.currentWindow.id);
            return this.currentWindow;
        }

        const content = this.createContent();
        this.currentWindow = window.WindowManager.createWindow('Project README', content, 450, 350);

        // Add a handler to clear the reference when the window closes
        this.currentWindow.onClose = () => {
            this.currentWindow = null;
        };

        return this.currentWindow;
    },

    createContent() {
        // Using inline styles to match the structure of other applications
        return `
            <div class="readme-container" style="padding: 20px; text-align: center; height: 100%; overflow-y: auto; font-family: 'Segoe UI', sans-serif;">
                
                <h2 style="color: #34495e; margin-bottom: 5px;">Gnoke Station Project</h2>
                <p style="color: #7f8c8d; font-size: 14px; margin-bottom: 25px;">
                    One familiar desktop interface for all devices.
                </p>

                <div style="text-align: left; margin-bottom: 30px;">
                    <h4 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px; margin-bottom: 10px;">
                        Brief Overview
                    </h4>
                    <p style="font-size: 13px; line-height: 1.6; color: #555;">
    **Gnoke Station** is an ultra-lightweight interface platform designed for hardware manufacturers 
    seeking cost-effective UI solutions. Built on standard web technologies, it eliminates 
    the complexity and expense of custom embedded interface development while providing 
    production-ready applications for industrial, IoT, and control system integration.
</p>
                </div>

                <a href="${this.GITHUB_README_URL}" target="_blank" style="
                    display: inline-block;
                    padding: 10px 20px;
                    background: #2ecc71;
                    color: white;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: 14px;
                    transition: background 0.2s;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                ">
                    Open Full README.md on GitHub ↗
                </a>

                <div style="font-size: 12px; color: #95a5a6; margin-top: 25px;">
                    License: GPLv3.0 • Source code available on GitHub.
                </div>

            </div>
        `;
    }
};

// Register ReadmeApp with AppRegistry as a System app
if (window.AppRegistry) {
    window.AppRegistry.registerApp({
        id: 'readme-app',
        name: 'Project README',
        // Simple document/info icon (Material Design style)
        icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='%233498db' d='M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-3 15v-1h4v1h-4zm-1-3h6v-1h-6v1zm6-3h-6v-1h6v1z'/></svg>",
        handler: () => window.ReadmeApp.open(),
        singleInstance: true, // Allow multiple README windows if desired
        documentation: {
            name: 'Project README',
            version: '1.0',
            description: 'Provides quick access to the main project documentation and link to the external README.md file.',
            type: 'System',
            features: [
                'Displays project brief and value statement.',
                'Direct link to the external GitHub README file.'
            ]
        }
    });
}
