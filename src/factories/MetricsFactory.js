class MetricsFactory {
    static createMetric(type, data) {
        switch(type) {
            case 'cluster':
                return {
                    type: 'cluster',
                    health: data.health,
                    status: data.status,
                    nodes: data.nodes
                };
            case 'indices':
                return {
                    type: 'indices',
                    count: data.count,
                    docs: data.docs,
                    size: data.size
                };
            case 'system':
                return {
                    type: 'system',
                    cpu: data.cpu_percent,
                    memory: data.memory,
                    storage: data.storage
                };
            default:
                throw new Error(`Unknown metric type: ${type}`);
        }
    }
}

export default MetricsFactory; 