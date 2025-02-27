export default class ThemeManager {
    constructor() {
        this.init();
    }

    async init() {
        await this.loadTheme();
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    async loadTheme() {
        try {
            const result = await new Promise(resolve => {
                chrome.storage.local.get(['theme'], resolve);
            });
            this.theme = result.theme || 'light';
            this.applyTheme();
        } catch (error) {
            this.theme = 'light';
            this.applyTheme();
        }
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        chrome.storage.local.set({ theme: this.theme });
    }

    async toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme();
        
        document.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: this.theme } 
        }));
    }
} 