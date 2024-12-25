class ESMonitor {
    constructor() {
        this.esUrl = '';
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('connectBtn').addEventListener('click', () => this.connect());
    }

    async connect() {
        this.esUrl = document.getElementById('esUrl').value.trim();
        if (!this.esUrl) {
            alert('Please enter Elasticsearch URL');
            return;
        }

        try {
            const isConnected = await this.checkConnection();
            if (isConnected) {
                document.getElementById('dashboard').classList.remove('hidden');
                await this.updateData();
            } else {
                alert('Failed to connect to Elasticsearch');
            }
        } catch (error) {
            alert('Failed to connect to Elasticsearch: ' + error.message);
        }
    }

    async checkConnection() {
        try {
            const response = await fetch(this.esUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            });
            
            if (response.ok) {
                console.log('Elasticsearch bağlantısı başarılı');
                return true;
            } else {
                console.error('Elasticsearch bağlantı hatası:', response.statusText);
                return false;
            }
        } catch (error) {
            console.error('Bağlantı hatası:', error);
            return false;
        }
    }

    async updateData() {
        try {
            await Promise.all([
                this.updateClusterHealth(),
                this.updateClusterStats(),
                this.updateIndicesInfo()
            ]);
        } catch (error) {
            console.error('Error updating data:', error);
        }
    }

    async updateClusterHealth() {
        const health = await this.fetchJSON('/_cluster/health');
        const healthDiv = document.getElementById('clusterHealth');
        healthDiv.innerHTML = `
            <div class="health-${health.status}">
                <p><i class="fas fa-circle"></i> Status: ${health.status.toUpperCase()}</p>
                <p><i class="fas fa-server"></i> Nodes: ${health.number_of_nodes}</p>
                <p><i class="fas fa-puzzle-piece"></i> Active Shards: ${health.active_shards}</p>
                <p><i class="fas fa-clock"></i> Response Time: ${health.timed_out ? 'Timed Out' : 'Normal'}</p>
            </div>
        `;
    }

    async updateClusterStats() {
        const stats = await this.fetchJSON('/_cluster/stats');
        
        document.getElementById('indicesCount').textContent = stats.indices.count;
        document.getElementById('totalSize').textContent = this.formatBytes(stats.indices.store.size_in_bytes);
        document.getElementById('docCount').textContent = this.formatNumber(stats.indices.docs.count);
    }

    async updateIndicesInfo() {
        const stats = await this.fetchJSON('/_cat/indices?format=json');
        const indicesList = document.getElementById('indicesList');
        
        indicesList.innerHTML = `
            <div class="index-item">
                <strong>Index</strong>
                <strong>Docs</strong>
                <strong>Size</strong>
                <strong>Health</strong>
            </div>
            ${stats.map(index => `
                <div class="index-item">
                    <span>${index.index}</span>
                    <span>${this.formatNumber(index.docs?.count || 0)}</span>
                    <span>${index.store?.size || '0b'}</span>
                    <span class="health-${index.health}">${index.health}</span>
                </div>
            `).join('')}
        `;
    }

    async fetchJSON(endpoint) {
        const response = await fetch(this.esUrl + endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            mode: 'cors'
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    }
}

// Initialize the monitor
const monitor = new ESMonitor(); 