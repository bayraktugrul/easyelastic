class ElasticsearchService {
    
    constructor(baseUrl) {
        this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    }

    async makeRequest(endpoint) {
        try {
            const response = await fetch(this.baseUrl + endpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            throw error;
        }
    }

    async checkConnection() {
        try {
            const response = await fetch(this.baseUrl);
            const data = await response.json();
            return data.tagline === "You Know, for Search";
        } catch (error) {
            console.error('Connection check failed:', error);
            return false;
        }
    }

    async getClusterHealth() {
        const response = await fetch(`${this.baseUrl}/_cluster/health`);
        if (!response.ok) throw new Error('Failed to fetch cluster health');
        return await response.json();
    }

    async getClusterStats() {
        try {
            const [stats, health, nodes] = await Promise.all([
                fetch(`${this.baseUrl}/_cluster/stats`).then(r => r.json()),
                fetch(`${this.baseUrl}/_cluster/health`).then(r => r.json()),
                fetch(`${this.baseUrl}/_nodes/stats/os,jvm,fs`).then(r => r.json())
            ]);

            let totalMemory = 0;
            let usedMemory = 0;
            let cpuPercent = 0;
            let nodeCount = 0;
            let totalSystemMemory = 0;
            let usedSystemMemory = 0;
            let totalDiskSpace = 0;
            let usedDiskSpace = 0;

            Object.values(nodes.nodes).forEach(node => {
                // JVM Memory
                totalMemory += node.jvm.mem.heap_max_in_bytes;
                usedMemory += node.jvm.mem.heap_used_in_bytes;
                
                // CPU
                cpuPercent += node.process?.cpu?.percent || 0;
                
                // System Memory
                if (node.os && node.os.mem) {
                    const systemTotal = node.os.mem.total_in_bytes || 0;
                    const systemFree = node.os.mem.free_in_bytes || 0;
                    const systemUsed = node.os.mem.used_in_bytes || (systemTotal - systemFree);
                    
                    totalSystemMemory += systemTotal;
                    usedSystemMemory += systemUsed;
                }

                // Disk Space
                if (node.fs && node.fs.total) {
                    totalDiskSpace += node.fs.total.total_in_bytes || 0;
                    usedDiskSpace += node.fs.total.total_in_bytes - (node.fs.total.free_in_bytes || 0);
                }
                
                nodeCount++;
            });

            // Yüzde hesaplamaları
            const jvmPercent = totalMemory > 0 ? ((usedMemory / totalMemory) * 100).toFixed(1) : "0.0";
            const systemPercent = totalSystemMemory > 0 ? ((usedSystemMemory / totalSystemMemory) * 100).toFixed(1) : "0.0";
            const diskPercent = totalDiskSpace > 0 ? ((usedDiskSpace / totalDiskSpace) * 100).toFixed(1) : "0.0";

            return {
                ...stats,
                health,
                nodes: {
                    total: nodeCount,
                    master: stats.nodes.master,
                    data: stats.nodes.data,
                    cpu_percent: nodeCount ? (cpuPercent / nodeCount).toFixed(1) : "0.0",
                    memory: {
                        total_bytes: totalMemory,
                        used_bytes: usedMemory,
                        system_total_bytes: totalSystemMemory,
                        system_used_bytes: usedSystemMemory,
                        percent: jvmPercent,
                        system_percent: systemPercent
                    },
                    storage: {
                        total_bytes: totalDiskSpace,
                        used_bytes: usedDiskSpace,
                        percent: diskPercent
                    }
                },
                shards: {
                    total: health.active_shards,
                    active: health.active_shards,
                    relocating: health.relocating_shards,
                    initializing: health.initializing_shards,
                    unassigned: health.unassigned_shards
                }
            };
        } catch (error) {
            console.error('Error fetching cluster stats:', error);
            throw new Error('Failed to fetch cluster stats');
        }
    }

    async getIndicesInfo() {
        const response = await fetch(`${this.baseUrl}/_cat/indices?format=json&bytes=b`);
        if (!response.ok) throw new Error('Failed to fetch indices info');
        return await response.json();
    }

    async createIndex(indexName, settings) {
        const response = await fetch(`${this.baseUrl}/${indexName}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(settings)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error.reason || 'Failed to create index');
        }

        return await response.json();
    }

    async deleteIndex(indexName) {
        const response = await fetch(`${this.baseUrl}/${indexName}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error.reason || 'Failed to delete index');
        }

        return await response.json();
    }

    async getAliases(indexName) {
        try {
            const response = await fetch(`${this.baseUrl}/${indexName}/_alias`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch aliases');
            }

            const data = await response.json();
            return Object.keys(data[indexName].aliases || {});
        } catch (error) {
            console.error('Error fetching aliases:', error);
            throw new Error('Failed to fetch aliases');
        }
    }

    async addAlias(indexName, aliasName) {
        const response = await fetch(`${this.baseUrl}/_aliases`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "actions": [
                    { "add": { "index": indexName, "alias": aliasName } }
                ]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.reason || 'Failed to add alias');
        }

        return await response.json();
    }

    async removeAlias(indexName, aliasName) {
        const response = await fetch(`${this.baseUrl}/_aliases`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "actions": [
                    { "remove": { "index": indexName, "alias": aliasName } }
                ]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.reason || 'Failed to remove alias');
        }

        return await response.json();
    }
}

export default ElasticsearchService; 