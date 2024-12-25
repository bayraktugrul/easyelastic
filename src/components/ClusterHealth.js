class ClusterHealth {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    render(health) {
        this.container.innerHTML = `
            <div class="health-${health.status}">
                <p><i class="fas fa-circle"></i> Status: ${health.status.toUpperCase()}</p>
                <p><i class="fas fa-server"></i> Nodes: ${health.number_of_nodes}</p>
                <p><i class="fas fa-puzzle-piece"></i> Active Shards: ${health.active_shards}</p>
                <p><i class="fas fa-clock"></i> Response Time: ${health.timed_out ? 'Timed Out' : 'Normal'}</p>
            </div>
        `;
    }
}

export default ClusterHealth; 