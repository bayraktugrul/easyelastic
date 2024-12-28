class ClusterHealth {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
    }

    render(health) {
        const statusClass = `health-${health.status.toLowerCase()}`;
        const statusIcon = health.status === 'green' ? 'check-circle' : 
                          health.status === 'yellow' ? 'exclamation-circle' : 'times-circle';

        this.element.innerHTML = `
            <div class="health-status ${statusClass}">
                <div class="status-icon">
                    <i class="fas fa-${statusIcon}"></i>
                </div>
                <div class="status-details">
                    <div class="status-label">Cluster Status</div>
                    <div class="status-value">${health.cluster_name}</div>
                    <div class="status-info">${health.status.toUpperCase()}</div>
                </div>
            </div>
        `;
    }
}

export default ClusterHealth; 