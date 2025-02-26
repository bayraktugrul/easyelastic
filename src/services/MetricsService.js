import { formatBytes, formatNumber } from '../utils/formatters.js';

class MetricsService {
    constructor() {
        this.elementUpdater = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };
    }

    updateClusterMetrics(stats) {
        const updates = {
            indicesCount: stats.indices.count,
            docCount: formatNumber(stats.indices.docs.count),
            usedStorage: formatBytes(stats.nodes.storage.used_bytes),
            totalStorage: formatBytes(stats.nodes.storage.total_bytes),
            storagePercent: `${stats.nodes.storage.percent}%`,
            nodeCount: stats.nodes.total,
            masterNodes: stats.nodes.master,
            dataNodes: stats.nodes.data,
            shardCount: stats.shards.total,
            activeShards: stats.shards.active,
            relocatingShards: stats.shards.relocating,
            cpuUsage: `${stats.nodes.cpu_percent}%`,
            memoryUsage: formatBytes(stats.nodes.memory.used_bytes || 0),
            heapUsage: formatBytes(stats.nodes.memory.total_bytes || 0),
            systemMemoryUsed: formatBytes(stats.nodes.memory.system_used_bytes || 0),
            systemMemory: formatBytes(stats.nodes.memory.system_total_bytes || 0),
            systemMemoryPercent: stats.nodes.memory.system_percent ? 
                `${stats.nodes.memory.system_percent}%` : '0%'
        };

        Object.entries(updates).forEach(([id, value]) => {
            this.elementUpdater(id, value);
        });
    }
}

export default MetricsService; 