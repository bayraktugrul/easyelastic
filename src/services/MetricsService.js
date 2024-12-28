import { formatBytes, formatNumber } from '../utils/formatters.js';

class MetricsService {
    constructor() {
        this.elementUpdater = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        };
    }

    updateClusterMetrics(stats) {
        this.updateIndicesMetrics(stats);
        this.updateNodesMetrics(stats);
        this.updateShardsMetrics(stats);
        this.updateSystemMetrics(stats);
    }

    updateIndicesMetrics(stats) {
        this.elementUpdater('indicesCount', stats.indices.count);
        this.elementUpdater('docCount', formatNumber(stats.indices.docs.count));
        this.elementUpdater('usedStorage', formatBytes(stats.nodes.storage.used_bytes));
        this.elementUpdater('totalStorage', formatBytes(stats.nodes.storage.total_bytes));
        this.elementUpdater('storagePercent', `${stats.nodes.storage.percent}%`);
    }

    updateNodesMetrics(stats) {
        this.elementUpdater('nodeCount', stats.nodes.total);
        this.elementUpdater('masterNodes', stats.nodes.master);
        this.elementUpdater('dataNodes', stats.nodes.data);
    }

    updateShardsMetrics(stats) {
        this.elementUpdater('shardCount', stats.shards.total);
        this.elementUpdater('activeShards', stats.shards.active);
        this.elementUpdater('relocatingShards', stats.shards.relocating);
    }

    updateSystemMetrics(stats) {
        this.elementUpdater('cpuUsage', `${stats.nodes.cpu_percent}%`);
        this.elementUpdater('memoryUsage', formatBytes(stats.nodes.memory.used_bytes));
        this.elementUpdater('heapUsage', formatBytes(stats.nodes.memory.total_bytes));
        this.elementUpdater('systemMemoryUsed', formatBytes(stats.nodes.memory.system_used_bytes));
        this.elementUpdater('systemMemory', formatBytes(stats.nodes.memory.system_total_bytes));
        this.elementUpdater('systemMemoryPercent', `${stats.nodes.memory.system_percent}%`);
    }
}

export default MetricsService; 