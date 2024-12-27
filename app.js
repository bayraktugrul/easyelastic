import ElasticsearchService from './src/services/ElasticsearchService.js';
import ClusterHealth from './src/components/ClusterHealth.js';
import { formatBytes, formatNumber } from './src/utils/formatters.js';
import Toast from './src/utils/Toast.js';

class ESMonitor {
    constructor() {
        this.service = null;
        this.components = {
            clusterHealth: new ClusterHealth('clusterHealth')
        };
        this.initializeEventListeners();
        this.initializeModalHandlers();
    }

    initializeEventListeners() {
        document.getElementById('connectBtn').addEventListener('click', () => this.connect());
        document.getElementById('testBtn').addEventListener('click', () => this.testConnection());
    }

    initializeModalHandlers() {
        const modal = document.getElementById('createIndexModal');
        const createBtn = document.getElementById('createIndexBtn');
        const closeBtn = modal.querySelector('.close-modal');
        const cancelBtn = document.getElementById('cancelCreateIndex');
        const confirmBtn = document.getElementById('confirmCreateIndex');

        createBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
        });

        [closeBtn, cancelBtn].forEach(btn => {
            btn.addEventListener('click', () => {
                modal.classList.add('hidden');
                this.resetIndexForm();
            });
        });

        confirmBtn.addEventListener('click', () => this.handleCreateIndex());
    }

    resetIndexForm() {
        document.getElementById('indexName').value = '';
        document.getElementById('shardCount').value = '1';
        document.getElementById('replicaCount').value = '1';
    }

    async handleCreateIndex() {
        const indexName = document.getElementById('indexName').value.trim();
        const shards = document.getElementById('shardCount').value;
        const replicas = document.getElementById('replicaCount').value;

        if (!indexName) {
            Toast.show('Please enter an index name', 'error');
            return;
        }

        try {
            const settings = {
                settings: {
                    index: {
                        number_of_shards: parseInt(shards),
                        number_of_replicas: parseInt(replicas)
                    }
                }
            };

            await this.service.createIndex(indexName, settings);
            Toast.show(`Index "${indexName}" created successfully`, 'success');
            document.getElementById('createIndexModal').classList.add('hidden');
            this.resetIndexForm();
            await this.updateDashboard();
        } catch (error) {
            Toast.show(`Failed to create index: ${error.message}`, 'error');
        }
    }

    async testConnection() {
        const url = document.getElementById('esUrl').value.trim();
        if (!url) {
            Toast.show('Please enter Elasticsearch URL', 'error');
            return;
        }

        try {
            const service = new ElasticsearchService(url);
            const isConnected = await service.checkConnection();
            
            if (isConnected) {
                Toast.show('Successfully connected to Elasticsearch', 'success');
            } else {
                Toast.show('Failed to connect to Elasticsearch', 'error');
            }
        } catch (error) {
            Toast.show(`Connection error: ${error.message}`, 'error');
        }
    }

    async connect() {
        const url = document.getElementById('esUrl').value.trim();
        if (!url) {
            Toast.show('Please enter Elasticsearch URL', 'error');
            return;
        }

        try {
            this.service = new ElasticsearchService(url);
            const isConnected = await this.service.checkConnection();
            
            if (isConnected) {
                document.getElementById('dashboard').classList.remove('hidden');
                await this.updateDashboard();
                Toast.show('Connected and data loaded successfully', 'success');
            } else {
                Toast.show('Failed to connect to Elasticsearch', 'error');
            }
        } catch (error) {
            Toast.show(`Connection error: ${error.message}`, 'error');
        }
    }

    async updateDashboard() {
        try {
            const [health, stats, indices] = await Promise.all([
                this.service.getClusterHealth(),
                this.service.getClusterStats(),
                this.service.getIndicesInfo()
            ]);

            this.components.clusterHealth.render(health);
            this.updateMetrics(stats);
            this.updateIndices(indices);
        } catch (error) {
            this.showError(`Failed to update dashboard: ${error.message}`);
        }
    }

    updateMetrics(stats) {
        document.getElementById('indicesCount').textContent = stats.indices.count;
        document.getElementById('totalSize').textContent = formatBytes(stats.indices.store.size_in_bytes);
        document.getElementById('docCount').textContent = formatNumber(stats.indices.docs.count);
    }

    updateIndices(indices) {
        const indicesList = document.getElementById('indicesList');
        indicesList.innerHTML = this.generateIndicesTable(indices);
    }

    generateIndicesTable(indices) {
        return `
            <div class="index-item header">
                <strong>Index</strong>
                <strong>Docs</strong>
                <strong>Size</strong>
                <strong>Health</strong>
            </div>
            ${indices.map(index => this.generateIndexRow(index)).join('')}
        `;
    }

    generateIndexRow(index) {
        return `
            <div class="index-item">
                <span>${index.index}</span>
                <span>${formatNumber(index.docs?.count || 0)}</span>
                <span>${index.store?.size || '0b'}</span>
                <span class="health-${index.health}">${index.health}</span>
            </div>
        `;
    }

    showError(message) {
        alert(message);
        console.error(message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.esMonitor = new ESMonitor();
}); 