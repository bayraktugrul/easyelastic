export default class ThemeManager {
    constructor() {
        this.theme = 'dark';
        this.hideSystemIndices = true;
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const settingsToggle = document.getElementById('settingsToggle');
        const settingsDropdown = document.getElementById('settingsDropdown');

        if (settingsToggle && settingsDropdown) {
            settingsToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = settingsDropdown.classList.toggle('show');
                if (isOpen) {
                    const rect = settingsToggle.getBoundingClientRect();
                    settingsDropdown.style.top = (rect.bottom + 8) + 'px';
                    settingsDropdown.style.right = (window.innerWidth - rect.right) + 'px';
                }
            });

            document.addEventListener('click', (e) => {
                if (!e.target.closest('.settings-container') && !e.target.closest('.settings-dropdown')) {
                    settingsDropdown.classList.remove('show');
                }
            });
        }

        const themeToggle = document.getElementById('settingsThemeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('change', () => {
                this.theme = themeToggle.checked ? 'dark' : 'light';
                this.applyTheme();
                document.dispatchEvent(new CustomEvent('themeChanged', {
                    detail: { theme: this.theme }
                }));
            });
        }

        const hideSystemIndicesToggle = document.getElementById('settingsHideSystemIndices');
        if (hideSystemIndicesToggle) {
            hideSystemIndicesToggle.addEventListener('change', () => {
                this.hideSystemIndices = hideSystemIndicesToggle.checked;
                this.saveSettings();
                document.dispatchEvent(new CustomEvent('hideSystemIndicesChanged', {
                    detail: { hidden: this.hideSystemIndices }
                }));
            });
        }
    }

    async loadSettings() {
        try {
            const result = await new Promise(resolve => {
                chrome.storage.local.get(['theme', 'hideSystemIndices'], resolve);
            });
            this.theme = result.theme || 'dark';
            this.hideSystemIndices = result.hideSystemIndices !== undefined ? result.hideSystemIndices : true;
            this.applyTheme();
            this.applyHideSystemIndices();
        } catch (error) {
            this.theme = 'dark';
            this.hideSystemIndices = true;
            this.applyTheme();
            this.applyHideSystemIndices();
        }
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        const themeToggle = document.getElementById('settingsThemeToggle');
        if (themeToggle) {
            themeToggle.checked = this.theme === 'dark';
        }
        this.saveSettings();
    }

    applyHideSystemIndices() {
        const toggle = document.getElementById('settingsHideSystemIndices');
        if (toggle) {
            toggle.checked = this.hideSystemIndices;
        }
    }

    saveSettings() {
        try {
            chrome.storage.local.set({
                theme: this.theme,
                hideSystemIndices: this.hideSystemIndices
            });
        } catch (error) {
            console.warn('Failed to save settings:', error);
        }
    }

}
