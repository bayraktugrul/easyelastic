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
        const response = await fetch(`${this.baseUrl}/_cluster/stats`);
        if (!response.ok) throw new Error('Failed to fetch cluster stats');
        return await response.json();
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
}

export default ElasticsearchService; 