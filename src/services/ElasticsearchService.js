class ElasticsearchService {
    
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
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
            const response = await this.makeRequest('');
            return response.tagline === "You Know, for Search";
        } catch {
            return false;
        }
    }

    async getClusterHealth() {
        return await this.makeRequest('/_cluster/health');
    }

    async getClusterStats() {
        return await this.makeRequest('/_cluster/stats');
    }

    async getIndicesInfo() {
        return await this.makeRequest('/_cat/indices?format=json');
    }
}

export default ElasticsearchService; 