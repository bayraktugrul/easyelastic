class AutoRefresh {
    constructor(esMonitor) {
        this.esMonitor = esMonitor;
        this.refreshInterval = null;
        this.intervalTime = 5000;
        this.init();
    }

    init() {
        const refreshSelect = document.getElementById('refreshInterval');
        if (!refreshSelect) return;
        
        refreshSelect.addEventListener('change', (e) => this.handleIntervalChange(e));
        
        if (refreshSelect.value !== 'off' && this.esMonitor.esService) {
            this.startRefresh(this.getIntervalTime(refreshSelect.value));
        }
    }

    handleIntervalChange(event) {
        const value = event.target.value;
        
        this.destroy();
        
        if (value !== 'off' && this.esMonitor.esService) {
            this.startRefresh(this.getIntervalTime(value));
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
                console.error('Refresh failed:', error);
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
}

export default AutoRefresh; 