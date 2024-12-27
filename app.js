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
        this.loadSavedConnection();
    }

    initializeEventListeners() {
        document.getElementById('connectBtn').addEventListener('click', () => this.connect());
        document.getElementById('testBtn').addEventListener('click', () => this.testConnection());
        document.getElementById('disconnectBtn').addEventListener('click', () => this.clearConnection());
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

        const deleteModal = document.getElementById('deleteIndexModal');
        const closeDeleteBtn = deleteModal.querySelector('.close-modal');
        const cancelDeleteBtn = document.getElementById('cancelDeleteIndex');
        const confirmDeleteBtn = document.getElementById('confirmDeleteIndex');

        document.addEventListener('click', (e) => {
            if (e.target.closest('.delete-index')) {
                const indexName = e.target.closest('.delete-index').dataset.index;
                this.showDeleteConfirmation(indexName);
            }
        });

        [closeDeleteBtn, cancelDeleteBtn].forEach(btn => {
            btn.addEventListener('click', () => {
                deleteModal.classList.add('hidden');
            });
        });

        confirmDeleteBtn.addEventListener('click', () => this.handleDeleteIndex());
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
                localStorage.setItem('esUrl', url);
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
                localStorage.setItem('esUrl', url);
                
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
        const flattenedIndices = indices.map(index => ({
            index: index.index,
            docs_count: index.docs?.count || 0,
            store_size: index.store?.size || '0b',
            health: index.health
        }));

        if (!$.fn.DataTable.isDataTable('#indicesTable')) {
            $('#indicesTable').DataTable({
                data: flattenedIndices,
                responsive: true,
                columns: [
                    { 
                        data: 'index',
                        render: function(data) {
                            return `<span class="font-medium">${data}</span>`;
                        }
                    },
                    { 
                        data: 'docs_count',
                        render: function(data) {
                            return formatNumber(data);
                        }
                    },
                    { 
                        data: 'store_size',
                        render: function(data) {
                            return data;
                        }
                    },
                    { 
                        data: 'health',
                        render: function(data) {
                            const healthClass = `health-badge ${data.toLowerCase()}`;
                            const icon = data === 'green' ? 'check-circle' : 
                                       data === 'yellow' ? 'exclamation-circle' : 'times-circle';
                            return `
                                <span class="${healthClass}">
                                    <i class="fas fa-${icon}"></i>
                                    ${data}
                                </span>`;
                        }
                    },
                    {
                        data: null,
                        render: function(data) {
                            return `
                                <div class="action-buttons">
                                    <button class="action-button delete-index" title="Delete" data-index="${data.index}">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>`;
                        }
                    }
                ],
                language: {
                    search: "Search:",
                    lengthMenu: "Show _MENU_ entries",
                    info: "Showing _START_ to _END_ of _TOTAL_ entries",
                    infoEmpty: "No entries available",
                    infoFiltered: "(filtered from _MAX_ total entries)",
                    paginate: {
                        first: "First",
                        last: "Last",
                        next: "Next",
                        previous: "Previous"
                    }
                },
                order: [[1, 'desc']],
                dom: "<'dt-controls'<'dataTables_length'l><'dataTables_filter'f>>" +
                     "rt" +
                     "<'dt-bottom'<'dataTables_info'i><'dataTables_paginate'p>>"
            });
        } else {
            const table = $('#indicesTable').DataTable();
            table.clear().rows.add(flattenedIndices).draw();
        }
    }

    showError(message) {
        alert(message);
        console.error(message);
    }

    async loadSavedConnection() {
        const savedUrl = localStorage.getItem('esUrl');
        if (savedUrl) {
            const urlInput = document.getElementById('esUrl');
            urlInput.value = savedUrl;
            
            await this.connect();
        }
    }

    clearConnection() {
        localStorage.removeItem('esUrl');
        document.getElementById('esUrl').value = '';
        document.getElementById('dashboard').classList.add('hidden');
        this.service = null;
        Toast.show('Connection cleared', 'info');
    }

    showDeleteConfirmation(indexName) {
        const modal = document.getElementById('deleteIndexModal');
        document.getElementById('deleteIndexName').textContent = indexName;
        modal.dataset.indexName = indexName;
        modal.classList.remove('hidden');
    }

    async handleDeleteIndex() {
        const modal = document.getElementById('deleteIndexModal');
        const indexName = modal.dataset.indexName;

        try {
            await this.service.deleteIndex(indexName);
            Toast.show(`Index "${indexName}" deleted successfully`, 'success');
            modal.classList.add('hidden');
            await this.updateDashboard();
        } catch (error) {
            Toast.show(`Failed to delete index: ${error.message}`, 'error');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.esMonitor = new ESMonitor();
}); 