class ElasticsearchService {
    constructor(baseUrl, auth = null) {
        this.baseUrl = baseUrl;
        this.auth = auth;
    }

    async fetchWithOptions(url, options = {}) {
        const defaultOptions = {
            headers: { 'Content-Type': 'application/json' },
            mode: 'cors'
        };

        if (this.auth?.username && this.auth?.password) {
            const base64Credentials = btoa(`${this.auth.username}:${this.auth.password}`);
            defaultOptions.headers['Authorization'] = `Basic ${base64Credentials}`;
        }

        const requestOptions = {
            ...defaultOptions,
            ...options,
            headers: { ...defaultOptions.headers, ...options.headers }
        };

        try {
            return new Promise((resolve, reject) => {
                chrome.runtime.sendMessage(
                    {
                        action: 'fetchElasticsearch',
                        url: url,
                        options: requestOptions
                    },
                    response => {
                        if (response.success) {
                            const mockResponse = {
                                ok: true,
                                json: () => Promise.resolve(response.data)
                            };
                            resolve(mockResponse);
                        } else {
                            reject(new Error(response.error || 'Request failed'));
                        }
                    }
                );
            });
        } catch (error) {
            console.error('Fetch error:', error);
            throw error;
        }
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
                this.fetchWithOptions(`${this.baseUrl}/_cluster/stats`).then(r => r.json()),
                this.fetchWithOptions(`${this.baseUrl}/_cluster/health`).then(r => r.json()),
                this.fetchWithOptions(`${this.baseUrl}/_nodes/stats/os,jvm,fs`).then(r => r.json())
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
        try {
            const catResponse = await this.fetchWithOptions(`${this.baseUrl}/_cat/indices?format=json&bytes=b&h=index,health,status,pri,rep,docs.count,docs.deleted,store.size,pri.store.size`);
            if (!catResponse.ok) throw new Error('Failed to fetch cat indices info');
            const catIndices = await catResponse.json();
            
            return catIndices.map(index => {
                return {
                    ...index,
                    docs: {
                        count: parseInt(index["docs.count"] || 0),
                        deleted: parseInt(index["docs.deleted"] || 0)
                    },
                    store: {
                        size: parseInt(index["store.size"] || 0),
                        size_string: this.formatBytes(parseInt(index["store.size"] || 0))
                    }
                };
            });
        } catch (error) {
            console.error('Error in getIndicesInfo:', error);
            throw error;
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0b';
        const sizes = ['b', 'kb', 'mb', 'gb', 'tb'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)}${sizes[i]}`;
    }

    async createIndex(indexName, settings) {
        try {
            const response = await this.fetchWithOptions(`${this.baseUrl}/${indexName}`, {
                method: 'PUT',
                body: JSON.stringify(settings)
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.error?.reason || 'Failed to create index');
            }

            return responseData;
        } catch (error) {
            if (error.message.includes('resource_already_exists_exception')) {
                throw new Error('Index already exists');
            }
            throw error;
        }
    }

    async deleteIndex(indexName) {
        const response = await this.fetchWithOptions(`${this.baseUrl}/${indexName}`, {
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
            const response = await this.fetchWithOptions(`${this.baseUrl}/${indexName}/_alias`);
            
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
        const response = await this.fetchWithOptions(`${this.baseUrl}/_aliases`, {
            method: 'POST',
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
        const response = await this.fetchWithOptions(`${this.baseUrl}/_aliases`, {
            method: 'POST',
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
        const response = await this.fetchWithOptions(`${this.baseUrl}/${indexName}/_settings`);
        if (!response.ok) throw new Error('Failed to fetch index settings');
        return await response.json();
    }

    async getIndexMapping(indexName) {
        const response = await this.fetchWithOptions(`${this.baseUrl}/${indexName}/_mapping`);
        if (!response.ok) throw new Error('Failed to fetch index mapping');
        return await response.json();
    }

    async getClusterInfo() {
        try {
            const response = await this.fetchWithOptions(this.baseUrl);
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
            const response = await this.fetchWithOptions(`${this.baseUrl}/${indexName}/_mapping`, {
                method: 'PUT',
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

            const response = await this.fetchWithOptions(url, {
                method: method,
                body: JSON.stringify(docData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.reason || 'Failed to add document');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            throw new Error(`Failed to add document: ${error.message}`);
        }
    }

    async refreshIndex(indexName) {
        try {
            const response = await this.fetchWithOptions(`${this.baseUrl}/${indexName}/_refresh`, {
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
            const indexExists = await this.fetchWithOptions(`${this.baseUrl}/${indexName}`);
            if (!indexExists.ok) {
                throw new Error(`Index ${indexName} not found`);
            }

            const searchParams = {
                query: { match_all: {} },
                ...params,
                track_total_hits: true
            };

            const response = await this.fetchWithOptions(`${this.baseUrl}/${indexName}/_search`, {
                method: 'POST',
                body: JSON.stringify(searchParams)
            });

            const result = await response.json();

            if (!response.ok) {
                if (result.error?.root_cause?.[0]?.reason) {
                    throw new Error(result.error.root_cause[0].reason);
                }
                throw new Error(result.error?.reason || 'Failed to search documents');
            }

            return result;
        } catch (error) {
            throw error;
        }
    }

    async executeQuery(method, endpoint, body = null) {
        try {
            const options = {
                method: method,
            };

            if (body) {
                options.body = JSON.stringify(body);
            }

            let modifiedEndpoint = endpoint;
            if (modifiedEndpoint.startsWith('_cat') && !modifiedEndpoint.includes('format=')) {
                modifiedEndpoint = modifiedEndpoint.includes('?') 
                    ? `${modifiedEndpoint}&format=json` 
                    : `${modifiedEndpoint}?format=json`;
            }

            const response = await this.fetchWithOptions(`${this.baseUrl}/${modifiedEndpoint}`, options);            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error?.reason || 'Query execution failed');
            }

            return data;
        } catch (error) {
            throw new Error(`Failed to execute query: ${error.message}`);
        }
    }

    async getShardDistribution() {
        try {
            const response = await this.fetchWithOptions(`${this.baseUrl}/_cat/shards?format=json`);
            if (!response.ok) throw new Error('Failed to fetch shard distribution');
            const shards = await response.json();
            
            const distribution = {};
            const indices = new Set();
            
            shards.forEach(shard => {
                const nodeId = shard.node || 'unassigned';
                const indexName = shard.index;
                const shardNum = shard.shard;
                const type = shard.prirep === 'p' ? 'primary' : 'replica';
                const state = shard.state;
                
                indices.add(indexName);
                
                if (!distribution[nodeId]) {
                    distribution[nodeId] = {};
                }
                
                if (!distribution[nodeId][indexName]) {
                    distribution[nodeId][indexName] = [];
                }
                
                distribution[nodeId][indexName].push({
                    number: shardNum,
                    type: type,
                    state: state
                });
            });
            
            return {
                distribution,
                indices: Array.from(indices)
            };
        } catch (error) {
            throw new Error('Failed to fetch shard distribution');
        }
    }
}

export default ElasticsearchService; 