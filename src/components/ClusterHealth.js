class ClusterHealth {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
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

    createHealthTemplate(health) {
        const config = this.getStatusConfig(health.status);
        return `
            <div class="health-status ${config.class}">
                <div class="status-icon">
                    <i class="fas fa-${config.icon}"></i>
                </div>
                <div class="status-details">
                    <div class="status-label">Cluster Status</div>
                    <div class="status-value">${health.cluster_name}</div>
                    <div class="status-info">${health.status.toUpperCase()}</div>
                </div>
            </div>
        `;
    }

    render(health) {
        this.element.innerHTML = this.createHealthTemplate(health);
    }
}

export default ClusterHealth; 