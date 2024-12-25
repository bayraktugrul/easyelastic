class ClusterHealth {
    
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    render(health) {
        const statusIcon = this.getStatusIcon(health.status);
        const responseClass = health.timed_out ? 'warning' : 'success';

        this.container.innerHTML = `
            <div class="health-card health-${health.status}">
                <div class="health-status">
                    ${statusIcon}
                    <div class="status-details">
                        <span class="status-label">Cluster Status</span>
                        <span class="status-value">${health.status.toUpperCase()}</span>
                    </div>
                </div>
                
                <div class="health-grid">
                    <div class="health-item">
                        <i class="fas fa-server"></i>
                        <div class="health-item-details">
                            <span class="health-item-label">Nodes</span>
                            <span class="health-item-value">${health.number_of_nodes}</span>
                        </div>
                    </div>

                    <div class="health-item">
                        <i class="fas fa-puzzle-piece"></i>
                        <div class="health-item-details">
                            <span class="health-item-label">Active Shards</span>
                            <span class="health-item-value">${health.active_shards}</span>
                        </div>
                    </div>

                    <div class="health-item">
                        <i class="fas fa-clock ${responseClass}"></i>
                        <div class="health-item-details">
                            <span class="health-item-label">Response Time</span>
                            <span class="health-item-value ${responseClass}">
                                ${health.timed_out ? 'Timed Out' : 'Normal'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getStatusIcon(status) {
        const icons = {
            green: '<i class="fas fa-circle-check status-icon"></i>',
            yellow: '<i class="fas fa-triangle-exclamation status-icon"></i>',
            red: '<i class="fas fa-circle-xmark status-icon"></i>'
        };
        return icons[status] || icons.red;
    }
}

export default ClusterHealth; 