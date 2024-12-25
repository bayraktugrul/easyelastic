class ClusterHealth {
    
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    render(health) {
        const statusIcon = this.getStatusIcon(health.status);
        const responseIcon = health.timed_out ? 'fa-exclamation-triangle' : 'fa-check-circle';
        const responseClass = health.timed_out ? 'warning' : 'success';

        this.container.innerHTML = `
            <div class="health-card health-${health.status}">
                <div class="health-header">
                    ${statusIcon} 
                    <span class="status-text">${health.status.toUpperCase()}</span>
                </div>
                
                <div class="health-metrics">
                    <div class="metric">
                        <div class="metric-icon">
                            <i class="fas fa-server"></i>
                        </div>
                        <div class="metric-info">
                            <span class="metric-label">Nodes</span>
                            <span class="metric-value">${health.number_of_nodes}</span>
                        </div>
                    </div>

                    <div class="metric">
                        <div class="metric-icon">
                            <i class="fas fa-puzzle-piece"></i>
                        </div>
                        <div class="metric-info">
                            <span class="metric-label">Active Shards</span>
                            <span class="metric-value">${health.active_shards}</span>
                        </div>
                    </div>

                    <div class="metric">
                        <div class="metric-icon">
                            <i class="fas ${responseIcon} ${responseClass}"></i>
                        </div>
                        <div class="metric-info">
                            <span class="metric-label">Response Time</span>
                            <span class="metric-value ${responseClass}">
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