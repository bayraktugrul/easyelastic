class AutoRefresh {
    constructor(esMonitor) {
        this.esMonitor = esMonitor;
        this.refreshInterval = null;
        this.intervalTime = 5000;
        this.init();
    }

    async init() {
        const savedInterval = await this.loadRefreshInterval();
        if (savedInterval > 0) {
            this.intervalTime = savedInterval;
        }
        
        const refreshSelect = document.getElementById('refreshInterval');
        if (!refreshSelect) return;
        
        refreshSelect.addEventListener('change', (e) => this.handleIntervalChange(e));
        
        if (refreshSelect.value !== 'off' && this.esMonitor.esService) {
            this.startRefresh(this.getIntervalTime(refreshSelect.value));
        }
    }

    async handleIntervalChange(event) {
        const value = event.target.value;
        
        this.destroy();
        
        if (value !== 'off' && this.esMonitor.esService) {
            const interval = this.getIntervalTime(value);
            this.startRefresh(interval);
            
            await this.saveRefreshInterval(interval);
        } else {
            await this.saveRefreshInterval(0);
        }
    }

    getIntervalTime(value) {
        switch(value) {
            case '5s': return 5000;
            case '10s': return 10000;
            case '30s': return 30000;
            case '1m': return 60000;
            case '5m': return 300000;
            default: return 5000;
        }
    }

    async startRefresh(interval) {
        if (!this.esMonitor.esService) return;
        
        this.intervalTime = interval;
        this.refreshInterval = setInterval(async () => {
            try {
                if (this.esMonitor.esService) {
                    await this.esMonitor.updateDashboard();
                } else {
                    this.destroy();
                }
            } catch (error) {
                this.destroy();
            }
        }, this.intervalTime);
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    async saveRefreshInterval(interval) {
        try {
            await new Promise(resolve => {
                chrome.storage.local.set({ refreshInterval: interval }, resolve);
            });
        } catch (error) {
            console.error('Failed to save refresh interval:', error);
        }
    }

    async loadRefreshInterval() {
        try {
            const result = await new Promise(resolve => {
                chrome.storage.local.get(['refreshInterval'], resolve);
            });
            
            return result.refreshInterval || 0; 
        } catch (error) {
            console.error('Failed to load refresh interval:', error);
            return 0;
        }
    }
}

export default AutoRefresh; 