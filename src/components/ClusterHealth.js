class ClusterHealth {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        this.languageManager = null;
    }

    setLanguageManager(languageManager) {
        this.languageManager = languageManager;
    }

    getStatusConfig(status) {
        const configs = {
            green: {
                icon: 'check-circle',
                class: 'health-green'
            },
            yellow: {
                icon: 'exclamation-circle',
                class: 'health-yellow'
            },
            red: {
                icon: 'times-circle',
                class: 'health-red'
            }
        };
        return configs[status.toLowerCase()] || configs.red;
    }

    getHealthStatusTranslation(status) {
        if (!this.languageManager) return status.toUpperCase();
        
        const statusKey = `cluster.health${status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}`;
        return this.languageManager.getSafeTranslation(statusKey, status.toUpperCase());
    }

    createHealthTemplate(health) {
        const config = this.getStatusConfig(health.status);
        const statusText = this.getHealthStatusTranslation(health.status);
        
        return `
            <div class="health-status ${config.class}">
                <div class="status-icon">
                    <i class="fas fa-${config.icon}"></i>
                </div>
                <div class="status-details">
                    <div class="status-label" data-translate="cluster.clusterStatus">Cluster Status</div>
                    <div class="status-value">${health.cluster_name}</div>
                    <div class="status-info">${statusText}</div>
                </div>
            </div>
        `;
    }

    render(health) {
        this.element.innerHTML = this.createHealthTemplate(health);
        
        if (this.languageManager) {
            setTimeout(() => {
                this.languageManager.updateUI();
            }, 10);
        }
    }
}

export default ClusterHealth; 