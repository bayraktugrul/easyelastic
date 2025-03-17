import ElasticsearchService from './src/services/ElasticsearchService.js';
import EventBus from './src/utils/EventBus.js';
import MetricsFactory from './src/factories/MetricsFactory.js';
import IndicesRepository from './src/repositories/IndicesRepository.js';
import { CreateIndexOperation, DeleteIndexOperation } from './src/strategies/IndexOperationStrategy.js';
import MetricsService from './src/services/MetricsService.js';
import IndicesService from './src/services/IndicesService.js';
import ClusterHealth from './src/components/ClusterHealth.js';
import Toast from './src/utils/Toast.js';
import { formatNumber } from './src/utils/formatters.js';
import initParticles from './src/utils/background.js';
import QuickFilter from './src/components/QuickFilter.js';
import ThemeManager from './src/utils/ThemeManager.js';
import Search from './src/components/Search.js';
import AutoRefresh from './src/components/AutoRefresh.js';
import ShardDistribution from './src/components/ShardDistribution.js';

class ESMonitor {
    constructor() {
        this.esService = null;
        this.metricsService = new MetricsService();
        this.indicesRepository = null;
        this.eventBus = EventBus;
        this.components = {
            clusterHealth: new ClusterHealth('clusterHealth'),
            shardDistribution: new ShardDistribution('shards')
        };
        
        this.initializeEventListeners();
        this.initializeModalHandlers();
        this.initializePasswordToggle();
        this.initializePanelToggles();
        this.subscribeToEvents();
        this.loadSavedConnection();
        this.loadSavedConnections();
        this.initializeConnectionHandlers();
        this.search = null;
        this.autoRefresh = null;
    }

    subscribeToEvents() {
        this.eventBus.subscribe('index:created', () => this.updateDashboard());
        this.eventBus.subscribe('index:deleted', () => this.updateDashboard());
        this.eventBus.subscribe('alias:added', () => this.updateDashboard());
        this.eventBus.subscribe('alias:removed', () => this.updateDashboard());
    }

    initializeEventListeners() {
        document.getElementById('connectBtn').addEventListener('click', () => this.connect());
        document.getElementById('testBtn').addEventListener('click', () => this.testConnection());
        document.getElementById('disconnectBtn').addEventListener('click', () => this.clearConnection());

        const refreshBtn = document.getElementById('refreshIntervalBtn');
        const refreshMenu = document.getElementById('refreshDropdownMenu');
        
        refreshBtn.addEventListener('click', () => {
            refreshMenu.classList.toggle('show');
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.refresh-control')) {
                refreshMenu.classList.remove('show');
            }
        });

        refreshMenu.querySelectorAll('.connection-item').forEach(item => {
            item.addEventListener('click', () => {
                const value = item.dataset.value;
                document.getElementById('selectedRefreshText').textContent = item.textContent;
                refreshMenu.classList.remove('show');
                if (this.autoRefresh) {
                    this.autoRefresh.setInterval(value);
                }
            });
        });
    }

    initializeModalHandlers() {
        const modal = document.getElementById('createIndexModal');
        const createBtn = document.getElementById('createIndexBtn');
        const closeBtn = modal.querySelector('.close-modal');
        const cancelBtn = document.getElementById('cancelCreateIndex');
        const confirmBtn = document.getElementById('confirmCreateIndex');

        createBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
            const shardsInput = document.getElementById('shardCount');
            const replicasInput = document.getElementById('replicaCount');
            
            if (shardsInput) shardsInput.value = '1';
            if (replicasInput) replicasInput.value = '1';
        });

        [closeBtn, cancelBtn].forEach(btn => {
            btn.addEventListener('click', () => {
                modal.classList.add('hidden');
                this.resetIndexForm();
            });
        });

        confirmBtn.addEventListener('click', () => this.handleCreateIndex());

        const deleteModal = document.getElementById('deleteConfirmationModal');
        const closeDeleteBtn = deleteModal.querySelector('.close-modal');
        const cancelDeleteBtn = document.getElementById('cancelDelete');
        const confirmDeleteBtn = document.getElementById('confirmDelete');

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

        confirmDeleteBtn.addEventListener('click', () => {
            const type = deleteModal.dataset.type;
            if (type === 'index') {
                this.handleDeleteIndex();
            }
        });

        const aliasModal = document.getElementById('aliasModal');
        const closeAliasBtn = document.getElementById('closeAliasModal');
        const closeAliasModalBtn = aliasModal.querySelector('.close-modal');
        const addAliasBtn = document.getElementById('addAliasBtn');

        document.addEventListener('click', async (e) => {
            if (e.target.closest('.manage-aliases')) {
                const indexName = e.target.closest('.manage-aliases').dataset.index;
                await this.showAliasManager(indexName);
            }
            if (e.target.closest('.remove-alias')) {
                e.preventDefault();
                const button = e.target.closest('.remove-alias');
                const indexName = button.dataset.index;
                const aliasName = button.dataset.alias;
                
                const modal = document.getElementById('deleteAliasModal');
                document.getElementById('deleteAliasName').textContent = aliasName;
                document.getElementById('deleteAliasIndexName').textContent = indexName;
                modal.dataset.indexName = indexName;
                modal.dataset.aliasName = aliasName;
                modal.classList.remove('hidden');
            }
        });

        [closeAliasBtn, closeAliasModalBtn].forEach(btn => {
            btn.addEventListener('click', () => {
                aliasModal.classList.add('hidden');
            });
        });

        addAliasBtn.addEventListener('click', () => this.handleAddAlias());

        const detailsModal = document.getElementById('indexDetailsModal');
        const closeDetailsBtn = document.getElementById('closeIndexDetails');
        const tabButtons = document.querySelectorAll('.tab-button');

        document.addEventListener('click', (e) => {
            if (e.target.closest('.show-details')) {
                const indexName = e.target.closest('.show-details').dataset.index;
                this.showIndexDetails(indexName);
            }
        });

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                document.querySelectorAll('.tab-pane').forEach(pane => {
                    pane.classList.remove('active');
                });
                document.getElementById(`${tabId}Tab`).classList.add('active');
            });
        });

        [closeDetailsBtn, detailsModal.querySelector('.close-modal')].forEach(btn => {
            btn.addEventListener('click', () => {
                detailsModal.classList.add('hidden');
            });
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.action-dropdown')) {
                document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                    menu.classList.remove('show');
                });
            }
            
            const toggleBtn = e.target.closest('.dropdown-toggle');
            if (toggleBtn) {
                e.stopPropagation();
                const menu = toggleBtn.nextElementSibling;
                
                document.querySelectorAll('.dropdown-menu.show').forEach(openMenu => {
                    if (openMenu !== menu) {
                        openMenu.classList.remove('show');
                    }
                });
                
                menu.classList.toggle('show');
            }
            
            if (e.target.closest('.dropdown-item')) {
                const item = e.target.closest('.dropdown-item');
                const menu = item.closest('.dropdown-menu');
                menu.classList.remove('show');
            }

            if (e.target.closest('.update-mapping')) {
                const indexName = e.target.closest('.update-mapping').dataset.index;
                this.showUpdateMapping(indexName);
            }

            if (e.target.closest('.add-document')) {
                const indexName = e.target.closest('.add-document').dataset.index;
                this.showAddDocument(indexName);
            }
        });

        document.getElementById('cancelDeleteAlias').addEventListener('click', () => {
            document.getElementById('deleteAliasModal').classList.add('hidden');
        });

        document.getElementById('confirmDeleteAlias').addEventListener('click', async () => {
            const modal = document.getElementById('deleteAliasModal');
            const indexName = modal.dataset.indexName;
            const aliasName = modal.dataset.aliasName;
            
            try {
                await this.esService.removeAlias(indexName, aliasName);
                Toast.show(`Alias "${aliasName}" removed successfully`, 'success');
                
                modal.classList.add('hidden');
                await this.refreshAliasesList(indexName);
                await this.updateDashboard();
            } catch (error) {
                Toast.show(`Failed to remove alias: ${error.message}`, 'error');
            }
        });

        document.getElementById('indexSelector').addEventListener('change', async (e) => {
            const selectedIndex = e.target.value;
            if (selectedIndex) {
                await this.showSampleDataPreview(selectedIndex);
            } else {
                document.querySelector('.sample-records').innerHTML = `
                    <div class="no-records">
                        <p>Please select an index to view documents.</p>
                    </div>
                `;
                document.querySelector('.record-count').textContent = 'No index selected';
            }
        });
    }

    initializePasswordToggle() {
        const passwordToggle = document.querySelector('.password-toggle');
        const passwordInput = document.getElementById('esPassword');
        
        if (passwordToggle && passwordInput) {
            passwordToggle.addEventListener('click', () => {
                const type = passwordInput.type === 'password' ? 'text' : 'password';
                passwordInput.type = type;
                passwordToggle.classList.toggle('visible');
            });
        }
    }

    resetIndexForm() {
        document.getElementById('indexName').value = '';
        document.getElementById('shardCountInput').value = '1';
        document.getElementById('replicaCountInput').value = '1';
    }

    async handleCreateIndex() {
        try {
            const indexName = document.getElementById('indexName').value.trim();
            const shardsInput = document.getElementById('shardCountInput');
            const replicasInput = document.getElementById('replicaCountInput');

            const shards = parseInt(shardsInput.value) || 1;
            const replicas = parseInt(replicasInput.value) || 1;

            if (!indexName) {
                Toast.show('Please enter an index name', 'error');
                return;
            }

            if (isNaN(shards) || shards < 1) {
                Toast.show('Number of shards must be at least 1', 'error');
                return;
            }

            if (isNaN(replicas) || replicas < 0) {
                Toast.show('Number of replicas must be 0 or greater', 'error');
                return;
            }

            const settings = {
                settings: {
                    index: {
                        number_of_shards: shards,
                        number_of_replicas: replicas
                    }
                }
            };

            await this.esService.createIndex(indexName, settings);
            Toast.show('Index created successfully', 'success');
            document.getElementById('createIndexModal').classList.add('hidden');
            this.resetIndexForm();
            this.eventBus.publish('index:created');
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
                await new Promise(resolve => {
                    chrome.storage.local.set({ esUrl: url }, resolve);
                });
                Toast.show('Successfully connected to Elasticsearch', 'success');
            } else {
                Toast.show('Failed to connect to Elasticsearch', 'error');
            }
        } catch (error) {
            Toast.show(`Connection error: ${error.message}`, 'error');
        }
    }

    async connect() {
        try {
            const url = document.getElementById('esUrl').value.trim();
            const username = document.getElementById('esUsername').value.trim();
            const password = document.getElementById('esPassword').value.trim();
            if (!url) {
                Toast.show('Please enter Elasticsearch URL', 'error');
                return;
            }

            if (this.esService) {
                this.esService = null;
                this.indicesRepository = null;
                this.quickFilter = null;
                this.search = null;
            }

            const auth = username && password ? { username, password } : null;

            this.esService = new ElasticsearchService(url, auth);
            this.indicesRepository = new IndicesRepository(this.esService);

            const isConnected = await this.esService.checkConnection();
            if (isConnected) {
                await new Promise(resolve => {
                    chrome.storage.local.set({ esUrl: url }, resolve);
                });
                
                const name = document.getElementById('connectionName').value.trim();
                if (name) {
                    await new Promise(resolve => {
                        chrome.storage.local.set({ lastConnection: name }, resolve);
                    });
                }
                
                document.getElementById('dashboard').classList.remove('hidden');

                this.quickFilter = new QuickFilter(this.esService);
                this.search = new Search(this.esService);

                await this.updateDashboard();

                if (this.autoRefresh) {
                    this.autoRefresh.destroy();
                }
                this.autoRefresh = new AutoRefresh(this);

                Toast.show('Connected and data loaded successfully', 'success');
            } else {
                this.esService = null;
                this.indicesRepository = null;
                this.quickFilter = null;
                this.search = null;
                document.getElementById('dashboard').classList.add('hidden');
                Toast.show('Failed to connect to Elasticsearch', 'error');
            }
        } catch (error) {
            this.esService = null;
            this.indicesRepository = null;
            this.quickFilter = null;
            this.search = null;
            document.getElementById('dashboard').classList.add('hidden');
            Toast.show(`Connection error: ${error.message}`, 'error');
        }
    }

    async updateDashboard() {
        try {
            const [clusterInfo, health, stats, indices, shardDistribution] = await Promise.all([
                this.esService.getClusterInfo(),
                this.esService.getClusterHealth(),
                this.esService.getClusterStats(),
                this.esService.getIndicesInfo(),
                this.esService.getShardDistribution()
            ]);

            document.getElementById('clusterName').textContent = clusterInfo.cluster_name || '-';
            document.getElementById('nodeName').textContent = clusterInfo.name || '-';
            document.getElementById('esVersion').textContent = clusterInfo.version?.number || '-';
            document.getElementById('luceneVersion').textContent = clusterInfo.version?.lucene_version || '-';

            this.components.clusterHealth.render(health);
            this.metricsService.updateClusterMetrics(stats);
            await this.updateIndicesTable(indices);
            
            const indexSelector = document.getElementById('indexSelector');
            const currentValue = indexSelector.value;
            
            indexSelector.innerHTML = `
                <option value="">Select an index</option>
                ${indices.map(index => `
                    <option value="${index.index}" ${currentValue === index.index ? 'selected' : ''}>
                        ${index.index}
                    </option>
                `).join('')}
            `;

            if (!currentValue && indices.length > 0) {
                indexSelector.value = indices[0].index;
                if (document.querySelector('#sample-data:not(.hidden)')) {
                    await this.showSampleDataPreview(indices[0].index);
                }
            }

            this.components.shardDistribution.render(shardDistribution);

        } catch (error) {
            Toast.show(`Failed to update dashboard: ${error.message}`, 'error');
        }
    }

    async updateIndicesTable(indices) {
        const formattedIndices = await this.indicesRepository.getAllIndices();

        if (!$.fn.DataTable.isDataTable('#indicesTable')) {
            $('#indicesTable').DataTable({
                data: formattedIndices,
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
                        data: 'creation_date',
                        render: function(data) {
                            const date = new Date(parseInt(data));
                            return date.toLocaleString();
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
                        data: 'aliases',
                        render: function(data) {
                            if (!data || data.length === 0) {
                                return '<span class="no-aliases">No aliases</span>';
                            }
                            return data.map(alias => `
                                <span class="alias-badge">
                                    ${alias}
                                </span>
                            `).join('');
                        }
                    },
                    {
                        data: null,
                        render: function(data) {
                            return `
                                <div class="action-dropdown">
                                    <button class="action-button dropdown-toggle" title="Actions">
                                        <i class="fas fa-ellipsis-v"></i>
                                    </button>
                                    <div class="dropdown-menu">
                                        <button class="dropdown-item show-details" data-index="${data.index}">
                                            <i class="fas fa-info-circle"></i> Details
                                        </button>
                                        <button class="dropdown-item manage-aliases" data-index="${data.index}">
                                            <i class="fas fa-tags"></i> Manage Aliases
                                        </button>
                                        <button class="dropdown-item update-mapping" data-index="${data.index}">
                                            <i class="fas fa-code"></i> Update Mapping
                                        </button>
                                        <button class="dropdown-item add-document" data-index="${data.index}">
                                            <i class="fas fa-file-circle-plus"></i> Add Document
                                        </button>
                                        <button class="dropdown-item delete-index" data-index="${data.index}">
                                            <i class="fas fa-trash-alt"></i> Delete
                                        </button>
                                    </div>
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
            table.clear().rows.add(formattedIndices).draw();
        }
    }

    showError(message) {
        alert(message);
    }

    async loadSavedConnection() {
        try {
            const result = await new Promise(resolve => {
                chrome.storage.local.get(['lastConnection'], resolve);
            });
            
            const lastConnectionName = result.lastConnection;
            
            if (lastConnectionName) {
                const connections = await this.getSavedConnections();
                const lastConnection = connections.find(c => c.name === lastConnectionName);
                
                if (lastConnection) {
                    document.getElementById('connectionName').value = lastConnection.name;
                    document.getElementById('esUrl').value = lastConnection.url;
                    document.getElementById('esUsername').value = lastConnection.auth?.username || '';
                    document.getElementById('esPassword').value = lastConnection.auth?.password || '';
                    document.getElementById('selectedConnectionText').textContent = lastConnection.name;
                    
                    this.esService = new ElasticsearchService(lastConnection.url, lastConnection.auth);
                    this.indicesRepository = new IndicesRepository(this.esService);
                    
                    const isConnected = await this.esService.checkConnection();
                    if (isConnected) {
                        document.getElementById('dashboard').classList.remove('hidden');
                        this.quickFilter = new QuickFilter(this.esService);
                        this.search = new Search(this.esService);
                        
                        await this.updateDashboard();
                        
                        if (this.autoRefresh) {
                            this.autoRefresh.destroy();
                        }
                        this.autoRefresh = new AutoRefresh(this);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load saved connection:', error);
        }
    }

    async clearConnection() {
        try {
            await new Promise(resolve => {
                chrome.storage.local.remove(['lastConnection'], resolve);
            });
            
            document.getElementById('esUrl').value = '';
            document.getElementById('connectionName').value = '';
            document.getElementById('esUsername').value = '';
            document.getElementById('esPassword').value = '';
            document.getElementById('selectedConnectionText').textContent = 'Select a connection';
            document.getElementById('dashboard').classList.add('hidden');
            this.esService = null;
            this.quickFilter = null;
            this.search = null;
            if (this.autoRefresh) {
                this.autoRefresh.destroy();
                this.autoRefresh = null;
            }
            Toast.show('Connection cleared', 'info');
        } catch (error) {
            console.error('Failed to clear connection:', error);
            Toast.show('Failed to clear connection', 'error');
        }
    }

    showDeleteConfirmation(itemName) {
        const modal = document.getElementById('deleteConfirmationModal');
        const modalTitle = document.getElementById('deleteConfirmationModalTitle');
        const modalItemType = document.getElementById('deleteConformationModalItemType');
        
        modalTitle.textContent = 'Delete Index';
        modalItemType.textContent = 'index';
        document.getElementById('deleteConformationModalItemName').textContent = itemName;
        modal.dataset.indexName = itemName;
        modal.dataset.type = 'index';
        modal.classList.remove('hidden');
    }

    async handleDeleteIndex() {
        const modal = document.getElementById('deleteConfirmationModal');
        const indexName = modal.dataset.indexName;

        try {
            await this.esService.deleteIndex(indexName);
            Toast.show(`Index "${indexName}" deleted successfully`, 'success');
            modal.classList.add('hidden');
            await this.updateDashboard();
        } catch (error) {
            Toast.show(`Failed to delete index: ${error.message}`, 'error');
        }
    }

    async showAliasManager(indexName) {
        const modal = document.getElementById('aliasModal');
        const closeBtn = document.getElementById('closeAliasModal');
        const closeModalBtn = modal.querySelector('.close-modal');
        const addAliasBtn = document.getElementById('addAliasBtn');
        
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        
        const newCloseModalBtn = closeModalBtn.cloneNode(true);
        closeModalBtn.parentNode.replaceChild(newCloseModalBtn, closeModalBtn);
        
        const newAddAliasBtn = addAliasBtn.cloneNode(true);
        addAliasBtn.parentNode.replaceChild(newAddAliasBtn, addAliasBtn);
        
        modal.dataset.indexName = indexName;
        
        await this.refreshAliasesList(indexName);
        modal.classList.remove('hidden');
        
        [newCloseBtn, newCloseModalBtn].forEach(btn => {
            btn.addEventListener('click', () => {
                modal.classList.add('hidden');
            });
        });
        
        newAddAliasBtn.addEventListener('click', () => this.handleAddAlias());
    }

    async refreshAliasesList(indexName) {
        try {
            const aliases = await this.esService.getAliases(indexName);
            const aliasesList = document.getElementById('currentAliasesList');
            
            if (aliases.length === 0) {
                aliasesList.innerHTML = '<span class="no-aliases">No aliases defined</span>';
                return;
            }

            aliasesList.innerHTML = aliases.map(alias => `
                <span class="alias-badge">
                    ${alias}
                    <button class="remove-alias" data-index="${indexName}" data-alias="${alias}" type="button">
                        <i class="fas fa-times"></i>
                    </button>
                </span>
            `).join('');
        } catch (error) {
            Toast.show(`Failed to fetch aliases: ${error.message}`, 'error');
        }
    }

    async handleAddAlias() {
        const modal = document.getElementById('aliasModal');
        const indexName = modal.dataset.indexName;
        const aliasInput = document.getElementById('newAlias');
        const aliasName = aliasInput.value.trim();

        if (!aliasName) {
            Toast.show('Please enter an alias name', 'error');
            return;
        }

        try {
            await this.esService.addAlias(indexName, aliasName);
            Toast.show(`Alias "${aliasName}" added successfully`, 'success');
            aliasInput.value = '';
            
            await this.refreshAliasesList(indexName);
            await this.updateDashboard();
        } catch (error) {
            Toast.show(`Failed to add alias: ${error.message}`, 'error');
        }
    }

    async removeAlias(indexName, aliasName) {
        try {
            await this.esService.removeAlias(indexName, aliasName);
            Toast.show(`Alias "${aliasName}" removed successfully`, 'success');
            
            await this.refreshAliasesList(indexName);
            await this.updateDashboard();
        } catch (error) {
            Toast.show(`Failed to remove alias: ${error.message}`, 'error');
        }
    }

    async showIndexDetails(indexName) {
        const modal = document.getElementById('indexDetailsModal');
        try {
            const details = await this.indicesRepository.getIndexDetails(indexName);
            
            document.getElementById('indexSettings').textContent = 
                JSON.stringify(details.settings, null, 2);
            document.getElementById('indexMapping').textContent = 
                JSON.stringify(details.mapping, null, 2);
            
            modal.classList.remove('hidden');
        } catch (error) {
            Toast.show(`Failed to fetch index details: ${error.message}`, 'error');
        }
    }

    async showUpdateMapping(indexName) {
        const modal = document.getElementById('updateMappingModal');
        const modalTitle = modal.querySelector('.modal-header h3');
        const mappingTabs = modal.querySelectorAll('.mapping-tabs .tab-button');
        const closeBtn = modal.querySelector('.close-modal');
        const cancelBtn = document.getElementById('cancelUpdateMapping');
        const confirmBtn = document.getElementById('confirmUpdateMapping');
        const addFieldBtn = document.getElementById('addFieldBtn');
        
        if (modalTitle) {
            modalTitle.innerHTML = `<i class="fas fa-code"></i> Update Mapping: <span class="index-name">${indexName}</span>`;
        }
        
        const newAddFieldBtn = addFieldBtn.cloneNode(true);
        addFieldBtn.parentNode.replaceChild(newAddFieldBtn, addFieldBtn);
        
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        mappingTabs.forEach(tab => {
            const newTab = tab.cloneNode(true);
            tab.parentNode.replaceChild(newTab, tab);
        });
        
        const updatedMappingTabs = modal.querySelectorAll('.mapping-tabs .tab-button');
        
        try {
            const details = await this.indicesRepository.getIndexDetails(indexName);
            const currentMapping = details.mapping;
            const originalMapping = JSON.parse(JSON.stringify(details.mapping));
            
            document.getElementById('mappingJson').value = JSON.stringify(currentMapping, null, 2);
            
            const mappingFields = document.querySelector('.mapping-fields');
            
            const refreshVisualFields = () => {
                mappingFields.innerHTML = '';
                if (currentMapping.properties) {
                    Object.entries(currentMapping.properties).forEach(([fieldName, fieldConfig]) => {
                        const isDraft = !originalMapping.properties?.[fieldName];
                        mappingFields.innerHTML += `
                            <div class="mapping-field">
                                <div class="field-info">
                                    <span class="field-name">${fieldName}</span>
                                    <span class="field-type">${fieldConfig.type}</span>
                                    ${isDraft ? '<span class="field-draft-badge">draft</span>' : ''}
                                </div>
                            </div>
                        `;
                    });
                }
            };
            
            refreshVisualFields();
            
            modal.dataset.indexName = indexName;
            
            document.getElementById('addFieldBtn').addEventListener('click', () => {
                const fieldName = document.getElementById('fieldName').value.trim();
                const fieldType = document.getElementById('fieldType').value;
                
                if (!fieldName) {
                    Toast.show('Please enter a field name', 'error');
                    return;
                }
                
                if (!currentMapping.properties) {
                    currentMapping.properties = {};
                }
                
                if (currentMapping.properties[fieldName]) {
                    Toast.show('Field already exists', 'error');
                    return;
                }
                
                currentMapping.properties[fieldName] = { type: fieldType };
                document.getElementById('fieldName').value = '';
                refreshVisualFields();
            });
            
            modal.classList.remove('hidden');
            
            updatedMappingTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const tabId = tab.dataset.tab;
                    updatedMappingTabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    
                    modal.querySelectorAll('.tab-pane').forEach(pane => {
                        pane.classList.remove('active');
                    });
                    document.getElementById(`${tabId}MappingTab`).classList.add('active');
                });
            });
            
            [closeBtn, cancelBtn].forEach(btn => {
                btn.addEventListener('click', () => {
                    modal.classList.add('hidden');
                });
            });
            
            document.getElementById('confirmUpdateMapping').addEventListener('click', async () => {
                try {
                    const activeTab = modal.querySelector('.mapping-tabs .tab-button.active').dataset.tab;
                    let newMapping;
                    
                    if (activeTab === 'json') {
                        newMapping = JSON.parse(document.getElementById('mappingJson').value);
                    } else {
                        newMapping = {
                            properties: {}
                        };
                        
                        mappingFields.querySelectorAll('.mapping-field').forEach(field => {
                            const fieldName = field.querySelector('.field-name').textContent;
                            const fieldType = field.querySelector('.field-type').textContent;
                            newMapping.properties[fieldName] = { type: fieldType };
                        });
                    }
                    
                    const targetIndexName = modal.dataset.indexName;
                    
                    await this.esService.updateMapping(targetIndexName, newMapping);
                    Toast.show(`Mapping updated successfully for index "${targetIndexName}"`, 'success');
                    modal.classList.add('hidden');
                    
                    await this.updateDashboard();
                } catch (error) {
                    Toast.show(`Failed to update mapping: ${error.message}`, 'error');
                }
            });
            
        } catch (error) {
            Toast.show(`Failed to load mapping: ${error.message}`, 'error');
        }
    }

    async showAddDocument(indexName) {
        const modal = document.getElementById('addDocumentModal');
        const closeBtn = modal.querySelector('.close-modal');
        const cancelBtn = document.getElementById('cancelAddDocument');
        const confirmBtn = document.getElementById('confirmAddDocument');
        const documentFields = document.getElementById('documentFields');
        
        try {
            const details = await this.indicesRepository.getIndexDetails(indexName);
            const mapping = details.mapping;
            
            documentFields.innerHTML = '';
            if (mapping.properties) {
                Object.entries(mapping.properties).forEach(([fieldName, fieldConfig]) => {
                    const fieldHtml = this.createFieldInput(fieldName, fieldConfig);
                    documentFields.innerHTML += fieldHtml;
                });
            }
            
            modal.classList.remove('hidden');
            modal.dataset.indexName = indexName;
            
            document.getElementById('documentId').value = '';
            
            const newCloseBtn = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
            
            const newCancelBtn = cancelBtn.cloneNode(true);
            cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
            
            const newConfirmBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
            
            [newCloseBtn, newCancelBtn].forEach(btn => {
                btn.addEventListener('click', () => {
                    modal.classList.add('hidden');
                });
            });
            
            newConfirmBtn.addEventListener('click', async () => {
                try {
                    const documentId = document.getElementById('documentId').value.trim();
                    const docData = this.collectFormData(mapping.properties);
                    
                    await this.esService.addDocument(indexName, docData, documentId || null);
                    await this.esService.refreshIndex(indexName);
                    
                    Toast.show('Document added successfully', 'success');
                    modal.classList.add('hidden');
                    await this.updateDashboard();
                } catch (error) {
                    Toast.show(`Failed to add document: ${error.message}`, 'error');
                }
            });
            
        } catch (error) {
            Toast.show(`Failed to prepare document form: ${error.message}`, 'error');
        }
    }

    createFieldInput(fieldName, fieldConfig) {
        let input = '';
        const fieldId = `field_${fieldName}`;
        
        switch(fieldConfig.type) {
            case 'text':
            case 'keyword':
                input = `<input type="text" id="${fieldId}" placeholder="Enter value">`;
                break;
            case 'long':
            case 'integer':
            case 'short':
            case 'byte':
                input = `<input type="number" id="${fieldId}" placeholder="Enter number">`;
                break;
            case 'double':
            case 'float':
                input = `<input type="number" step="0.01" id="${fieldId}" placeholder="Enter decimal">`;
                break;
            case 'date':
                input = `<input type="datetime-local" id="${fieldId}">`;
                break;
            case 'boolean':
                input = `
                    <select id="${fieldId}">
                        <option value="">Select value</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                    </select>`;
                break;
            default:
                input = `<input type="text" id="${fieldId}" placeholder="Enter value">`;
        }
        
        return `
            <div class="document-field">
                <label for="${fieldId}">
                    ${fieldName}
                    <span class="field-type-badge">${fieldConfig.type}</span>
                </label>
                ${input}
            </div>
        `;
    }

    collectFormData(mappingProperties) {
        const docData = {};
        
        Object.entries(mappingProperties).forEach(([fieldName, fieldConfig]) => {
            const fieldId = `field_${fieldName}`;
            const value = document.getElementById(fieldId).value;
            
            if (value) {
                switch(fieldConfig.type) {
                    case 'long':
                    case 'integer':
                    case 'short':
                    case 'byte':
                        docData[fieldName] = parseInt(value);
                        break;
                    case 'double':
                    case 'float':
                        docData[fieldName] = parseFloat(value);
                        break;
                    case 'boolean':
                        docData[fieldName] = value === 'true';
                        break;
                    default:
                        docData[fieldName] = value;
                }
            }
        });
        
        return docData;
    }

    async showSampleDataPreview(indexName) {
        try {
            const indexDetails = await this.esService.getIndexMapping(indexName);
            const mapping = indexDetails[indexName].mappings.properties || {};

            const response = await this.esService.searchDocuments(indexName, {
                size: 10,
                sort: ['_doc']
            });

            const container = document.querySelector('.sample-table-container');
            
            if (!response.hits || !response.hits.hits || response.hits.total.value === 0) {
                container.innerHTML = `
                    <div class="no-records">
                        <p>${response.hits.total.value === 0 ? 'No documents found in this index.' : 'Error loading documents.'}</p>
                    </div>`;
                return;
            }

            const fieldArray = Object.keys(mapping);

            const data = response.hits.hits.map(hit => {
                const row = {};
                row.id = hit._id;
                fieldArray.forEach(field => {
                    row[field] = hit._source[field] !== undefined ? 
                        typeof hit._source[field] === 'object' ? 
                            JSON.stringify(hit._source[field]) : 
                            hit._source[field] : '';
                });
                return row;
            });

            if (this.sampleDataTable) {
                this.sampleDataTable.destroy();
                container.innerHTML = '';
            }

            container.innerHTML = `
                <table id="sampleDataTable" class="display" style="width:100%">
                    <thead>
                        <tr>
                            <th>ID</th>
                            ${fieldArray.map(field => `<th>${field}</th>`).join('')}
                        </tr>
                    </thead>
                </table>
            `;

            this.sampleDataTable = $('#sampleDataTable').DataTable({
                data: data,
                columns: [
                    { 
                        data: 'id', 
                        title: `<div class="column-header">
                                    <span>ID</span>
                                    <span class="field-type" data-type="keyword">keyword</span>
                                </div>`,
                        width: '280px'
                    },
                    ...fieldArray.map(field => ({
                        data: field,
                        title: `<div class="column-header">
                                    <span>${field}</span>
                                    <span class="field-type" data-type="${mapping[field]?.type || 'unknown'}">${mapping[field]?.type || 'unknown'}</span>
                                </div>`,
                        width: '220px'
                    }))
                ],
                scrollX: true,
                scrollY: '400px',
                scrollCollapse: true,
                paging: false,
                ordering: true,
                info: false,
                searching: true,
                autoWidth: false,
                responsive: false,
                fixedHeader: false,
                dom: "<'dt-controls'<'dataTables_filter'f>>" +
                     "<'dataTables_scroll't>",
                language: {
                    search: "Search:"
                }
            });

        } catch (error) {
            const container = document.querySelector('.sample-table-container');
            container.innerHTML = `
                <div class="no-records error">
                    <p>Error: ${error.message}</p>
                </div>`;
        }
    }

    initializeConnectionHandlers() {
        const connectionSelectBtn = document.getElementById('connectionSelectBtn');
        const connectionDropdownMenu = document.getElementById('connectionDropdownMenu');
        
        if (!connectionSelectBtn || !connectionDropdownMenu) {
            console.error('Connection dropdown elements not found');
            return;
        }
        
        connectionSelectBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            connectionDropdownMenu.classList.toggle('show');
             });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.saved-connections') && connectionDropdownMenu.classList.contains('show')) {
                connectionDropdownMenu.classList.remove('show');
            }
        });
        
        const saveBtn = document.getElementById('saveConnectionBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                console.log('Save button clicked');
                this.saveConnection();
            });
        }
    }

    updateConnectionsList() {
        const connectionList = document.getElementById('connectionList');
        connectionList.innerHTML = '';
        
        this.getSavedConnections().then(connections => {
           const connectionArray = Array.isArray(connections) ? connections : [];
            
            if (connectionArray.length === 0) {
                const emptyItem = document.createElement('div');
                emptyItem.className = 'connection-item empty';
                emptyItem.textContent = 'No saved connections';
                connectionList.appendChild(emptyItem);
                return;
            }
            
            connectionArray.forEach(connection => {
                const item = document.createElement('div');
                item.className = 'connection-item';
                item.dataset.name = connection.name;
                
                const nameSpan = document.createElement('span');
                nameSpan.className = 'connection-name';
                nameSpan.textContent = connection.name;
                
                const actions = document.createElement('div');
                actions.className = 'connection-item-actions';
                
                const editBtn = document.createElement('button');
                editBtn.className = 'connection-action-btn edit';
                editBtn.dataset.name = connection.name;
                editBtn.innerHTML = '<i class="fas fa-edit"></i>';
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'connection-action-btn delete';
                deleteBtn.dataset.name = connection.name;
                deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
                
                actions.appendChild(editBtn);
                actions.appendChild(deleteBtn);
                
                item.appendChild(nameSpan);
                item.appendChild(actions);
                
                connectionList.appendChild(item);
            });
            
            const dropdownMenu = document.getElementById('connectionDropdownMenu');
            
            connectionList.querySelectorAll('.connection-item').forEach(item => {
                if (item.classList.contains('empty')) return;
                
                item.addEventListener('click', async (e) => {
                    if (!e.target.closest('.connection-action-btn')) {
                        const name = item.dataset.name;
                        const connection = connectionArray.find(c => c.name === name);
                        if (connection) {
                            document.getElementById('connectionName').value = connection.name;
                            document.getElementById('esUrl').value = connection.url;
                            document.getElementById('esUsername').value = connection.auth?.username || '';
                            document.getElementById('esPassword').value = connection.auth?.password || '';
                            document.getElementById('selectedConnectionText').textContent = connection.name;
                            dropdownMenu.classList.remove('show');
                            await this.connect();
                        }
                    }
                });
            });
            
            connectionList.querySelectorAll('.connection-action-btn.edit').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const name = btn.dataset.name;
                    const connection = connectionArray.find(c => c.name === name);
                    if (connection) {
                        document.getElementById('connectionName').value = connection.name;
                        document.getElementById('esUrl').value = connection.url;
                        document.getElementById('esUsername').value = connection.auth?.username || '';
                        document.getElementById('esPassword').value = connection.auth?.password || '';
                        document.getElementById('selectedConnectionText').textContent = connection.name;
                        dropdownMenu.classList.remove('show');
                    }
                });
            });
            
            connectionList.querySelectorAll('.connection-action-btn.delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const name = btn.dataset.name;
                    document.getElementById('connectionName').value = name;
                    this.deleteConnection();
                });
            });
        });
    }

    async getSavedConnections() {
        try {
            const result = await new Promise(resolve => {
                chrome.storage.local.get(['esConnections'], resolve);
            });
            return result.esConnections || [];
        } catch (error) {
            console.error('Failed to get saved connections:', error);
            return [];
        }
    }

    async saveConnection() {
        const name = document.getElementById('connectionName').value.trim();
        const url = document.getElementById('esUrl').value.trim();
        const username = document.getElementById('esUsername').value.trim();
        const password = document.getElementById('esPassword').value.trim();

        if (!url) {
            Toast.show('Please enter Elasticsearch URL', 'error');
            return;
        }

        if (!name) {
            Toast.show('Please enter a name for the connection', 'error');
            return;
        }

        const connections = await this.getSavedConnections();
        const connectionData = {
            name,
            url,
            auth: username && password ? { username, password } : null
        };
        
        const existingIndex = connections.findIndex(c => c.name === name);
        if (existingIndex !== -1) {
            connections[existingIndex] = connectionData;
            Toast.show('Connection updated successfully', 'success');
        } else {
            connections.push(connectionData);
            Toast.show('Connection saved successfully', 'success');
        }

        await new Promise(resolve => {
            chrome.storage.local.set({ esConnections: connections }, resolve);
        });
        
        await new Promise(resolve => {
            chrome.storage.local.set({ lastConnection: name }, resolve);
        });
        
        this.updateConnectionsList();
    }

    async deleteConnection() {
        const name = document.getElementById('connectionName').value.trim();
        if (!name) {
            Toast.show('Please select a connection to delete', 'error');
            return;
        }

        try {
            const connections = await this.getSavedConnections();
            const newConnections = connections.filter(c => c.name !== name);
            
            await new Promise(resolve => {
                chrome.storage.local.set({ esConnections: newConnections }, resolve);
            });
            
            this.updateConnectionsList();
            document.getElementById('connectionName').value = '';
            document.getElementById('esUrl').value = '';
            document.getElementById('esUsername').value = '';
            document.getElementById('esPassword').value = '';
            document.getElementById('selectedConnectionText').textContent = 'Select a connection';
            Toast.show('Connection deleted successfully', 'success');
        } catch (error) {
            Toast.show('Failed to delete connection', 'error');
        }
    }

    loadSavedConnections() {
        this.updateConnectionsList();
    }

    async initializeComponents() {
        try {
            this.search = new Search(this.esService);
        } catch (error) {
            Toast.show('Failed to initialize components', 'error');
        }
    }

    async initializePanelToggles() {
        const panels = document.querySelectorAll('.status-panel, .metrics-panel, .indices-panel, .sample-data-panel, .quick-filter-panel, .search-panel, .shards-data-panel, .connection-panel, .cluster-health-panel');
        
        panels.forEach(async panel => {
            const header = panel.querySelector('.panel-header');
            if (!header) return;
            
            const title = header.querySelector('h2');
            if (!title) return;
            
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'panel-toggle';
            toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
            
            title.insertBefore(toggleBtn, title.firstChild);
            
            let content = panel.querySelector('.panel-content');
            
            if (!content) {
                const contentElement = 
                    panel.querySelector('.cluster-overview') ||
                    panel.querySelector('.indices-table') ||
                    panel.querySelector('.shards-table-container') ||
                    panel.querySelector('.search-content') ||
                    panel.querySelector('.sample-table-container') ||
                    panel.querySelector('.quick-filter-content');

                if (contentElement && contentElement.parentNode === panel) {
                    content = document.createElement('div');
                    content.className = 'panel-content';
                    
                    if (panel.classList.contains('search-panel')) {
                        content.appendChild(contentElement);
                        panel.appendChild(content);
                    } else {
                        contentElement.parentNode.insertBefore(content, contentElement);
                        content.appendChild(contentElement);
                    }
                }
            }
            
            if (content) {
                const panelId = panel.id || panel.className.split(' ')[0];
                
                try {
                    const result = await new Promise(resolve => {
                        chrome.storage.local.get([`panel_${panelId}_collapsed`], resolve);
                    });
                    
                    const isCollapsed = result[`panel_${panelId}_collapsed`] === true;
                    
                    if (isCollapsed) {
                        content.classList.add('collapsed');
                        toggleBtn.classList.add('collapsed');
                        if (panel.classList.contains('search-panel')) {
                            panel.classList.add('collapsed');
                        }
                    }
                    
                    toggleBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        content.classList.toggle('collapsed');
                        toggleBtn.classList.toggle('collapsed');
                        
                        if (panel.classList.contains('search-panel')) {
                            panel.classList.toggle('collapsed');
                        }
                        
                        const isNowCollapsed = content.classList.contains('collapsed');
                        await new Promise(resolve => {
                            chrome.storage.local.set({
                                [`panel_${panelId}_collapsed`]: isNowCollapsed
                            }, resolve);
                        });
                    });
                } catch (error) {
                    console.error('Failed to load panel state:', error);
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    new ThemeManager();
    window.esMonitor = new ESMonitor();
});