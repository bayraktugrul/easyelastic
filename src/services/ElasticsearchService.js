class ElasticsearchService {
    constructor(baseUrl) {
        this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    }

    async fetchWithOptions(url, options = {}) {
        const defaultOptions = {
            headers: { 'Content-Type': 'application/json' },
            mode: 'cors'
        };

        const requestOptions = {
            ...defaultOptions,
            ...options,
            headers: { ...defaultOptions.headers, ...options.headers }
        };

        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.reason || `Request failed with status ${response.status}`);
        }

        return response;
    }

    async checkConnection() {
        try {
            const response = await this.fetchWithOptions(this.baseUrl);
            const data = await response.json();
            return data.tagline === "You Know, for Search";
        } catch (error) {
            console.error('Connection check failed:', error);
            return false;
        }
    }

    async getClusterHealth() {
        const response = await this.fetchWithOptions(`${this.baseUrl}/_cluster/health`);
        return await response.json();
    }

    async getClusterStats() {
        try {
            const [stats, health, nodes] = await Promise.all([
                fetch(`${this.baseUrl}/_cluster/stats`).then(r => r.json()),
                fetch(`${this.baseUrl}/_cluster/health`).then(r => r.json()),
                fetch(`${this.baseUrl}/_nodes/stats/os,jvm,fs`).then(r => r.json())
            ]);

            return this.processClusterStats(stats, health, nodes);
        } catch (error) {
            console.error('Error fetching cluster stats:', error);
            throw new Error('Failed to fetch cluster stats');
        }
    }

    processClusterStats(stats, health, nodes) {
        const nodeMetrics = this.calculateNodeMetrics(nodes);
        
        return {
            ...stats,
            health,
            nodes: {
                total: nodeMetrics.count,
                master: stats.nodes.master,
                data: stats.nodes.data,
                cpu_percent: this.calculateAverageCpu(nodeMetrics),
                memory: this.calculateMemoryStats(nodeMetrics),
                storage: this.calculateStorageStats(nodeMetrics)
            },
            shards: this.extractShardStats(health)
        };
    }

    calculateNodeMetrics(nodes) {
        const metrics = {
            count: 0,
            totalMemory: 0,
            usedMemory: 0,
            cpuPercent: 0,
            totalDiskSpace: 0,
            usedDiskSpace: 0
        };

        Object.values(nodes.nodes).forEach(node => {
            metrics.count++;
            metrics.totalMemory += node.jvm.mem.heap_max_in_bytes;
            metrics.usedMemory += node.jvm.mem.heap_used_in_bytes;
            metrics.cpuPercent += node.process?.cpu?.percent || 0;
            
            if (node.fs?.total) {
                metrics.totalDiskSpace += node.fs.total.total_in_bytes || 0;
                metrics.usedDiskSpace += node.fs.total.total_in_bytes - (node.fs.total.free_in_bytes || 0);
            }
        });

        return metrics;
    }

    calculateAverageCpu(metrics) {
        return metrics.count ? (metrics.cpuPercent / metrics.count).toFixed(1) : "0.0";
    }

    calculateMemoryStats(metrics) {
        return {
            total_bytes: metrics.totalMemory,
            used_bytes: metrics.usedMemory,
            percent: metrics.totalMemory > 0 ? 
                ((metrics.usedMemory / metrics.totalMemory) * 100).toFixed(1) : "0.0"
        };
    }

    calculateStorageStats(metrics) {
        return {
            total_bytes: metrics.totalDiskSpace,
            used_bytes: metrics.usedDiskSpace,
            percent: metrics.totalDiskSpace > 0 ? 
                ((metrics.usedDiskSpace / metrics.totalDiskSpace) * 100).toFixed(1) : "0.0"
        };
    }

    extractShardStats(health) {
        return {
            total: health.active_shards,
            active: health.active_shards,
            relocating: health.relocating_shards,
            initializing: health.initializing_shards,
            unassigned: health.unassigned_shards
        };
    }

    async getIndicesInfo() {
        const response = await fetch(`${this.baseUrl}/_cat/indices?format=json&bytes=b`);
        if (!response.ok) throw new Error('Failed to fetch indices info');
        return await response.json();
    }

    async createIndex(indexName, settings) {
        try {
            const exists = await fetch(`${this.baseUrl}/${indexName}`);
            if (exists.ok) {
                throw new Error('Index already exists');
            }

            console.log('Creating index:', indexName);
            console.log('Settings object:', settings);
            console.log('Settings JSON:', JSON.stringify(settings, null, 2));

            const response = await fetch(`${this.baseUrl}/${indexName}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
                body: JSON.stringify(settings)
            });

            const responseData = await response.json();

            if (!response.ok) {
                console.error('Elasticsearch error response:', responseData);
                throw new Error(responseData.error?.reason || 'Failed to create index');
            }

            return responseData;
        } catch (error) {
            console.error('Error creating index:', error);
            throw error;
        }
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

    async getIndexSettings(indexName) {
        const response = await fetch(`${this.baseUrl}/${indexName}/_settings`);
        if (!response.ok) throw new Error('Failed to fetch index settings');
        return await response.json();
    }

    async getIndexMapping(indexName) {
        const response = await fetch(`${this.baseUrl}/${indexName}/_mapping`);
        if (!response.ok) throw new Error('Failed to fetch index mapping');
        return await response.json();
    }

    async getClusterInfo() {
        try {
            const response = await fetch(this.baseUrl);
            if (!response.ok) {
                throw new Error('Failed to fetch cluster info');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching cluster info:', error);
            throw error;
        }
    }

    async updateMapping(indexName, mapping) {
        try {
            const response = await fetch(`${this.baseUrl}/${indexName}/_mapping`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(mapping)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error.reason || 'Failed to update mapping');
            }

            return await response.json();
        } catch (error) {
            throw new Error(`Failed to update mapping: ${error.message}`);
        }
    }

    async addDocument(indexName, docData, id = null) {
        try {
            const method = id ? 'PUT' : 'POST';
            const url = id ? 
                `${this.baseUrl}/${indexName}/_doc/${id}` : 
                `${this.baseUrl}/${indexName}/_doc`;

            console.log('Adding document:', {
                url,
                method,
                docData
            });

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(docData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.reason || 'Failed to add document');
            }

            const result = await response.json();
            console.log('Document added response:', result);
            return result;
        } catch (error) {
            console.error('Error adding document:', error);
            throw new Error(`Failed to add document: ${error.message}`);
        }
    }

    async refreshIndex(indexName) {
        try {
            const response = await fetch(`${this.baseUrl}/${indexName}/_refresh`, {
                method: 'POST'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.reason || 'Failed to refresh index');
            }

            return await response.json();
        } catch (error) {
            throw new Error(`Failed to refresh index: ${error.message}`);
        }
    }

    async searchDocuments(indexName, params = {}) {
        try {
            const indexExists = await fetch(`${this.baseUrl}/${indexName}`);
            if (!indexExists.ok) {
                throw new Error(`Index ${indexName} not found`);
            }

            const searchParams = {
                query: { match_all: {} },
                ...params,
                track_total_hits: true
            };

            console.log('Search request:', {
                url: `${this.baseUrl}/${indexName}/_search`,
                params: searchParams
            });

            const response = await fetch(`${this.baseUrl}/${indexName}/_search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(searchParams)
            });

            const result = await response.json();

            if (!response.ok) {
                console.error('Search error response:', result);
                if (result.error?.root_cause?.[0]?.reason) {
                    throw new Error(result.error.root_cause[0].reason);
                }
                throw new Error(result.error?.reason || 'Failed to search documents');
            }

            console.log('Search response:', result);
            return result;
        } catch (error) {
            console.error('Search error:', error);
            throw error;
        }
    }

    async executeQuery(method, endpoint, body = null) {
        try {
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (body) {
                options.body = JSON.stringify(body);
            }

            const response = await fetch(`${this.baseUrl}/${endpoint}`, options);
            
            if (endpoint.startsWith('_cat')) {
                const text = await response.text();
                if (!response.ok) {
                    throw new Error(text || 'Query execution failed');
                }
                return { result: text };
            }

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error?.reason || 'Query execution failed');
            }

            return data;
        } catch (error) {
            throw new Error(`Failed to execute query: ${error.message}`);
        }
    }
}

export default ElasticsearchService; 