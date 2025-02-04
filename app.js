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

class ESMonitor {
    constructor() {
        this.esService = null;
        this.metricsService = new MetricsService();
        this.indicesRepository = null;
        this.eventBus = EventBus;
        this.components = {
            clusterHealth: new ClusterHealth('clusterHealth')
        };
        
        this.initializeEventListeners();
        this.initializeModalHandlers();
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

        // Index details modal handlers
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

    resetIndexForm() {
        document.getElementById('indexName').value = '';
        document.getElementById('shardCountInput').value = '1';
        document.getElementById('replicaCountInput').value = '1';
        
        // Input değerlerini kontrol edelim
        console.log('Reset form values:', {
            indexName: document.getElementById('indexName').value,
            shards: document.getElementById('shardCountInput').value,
            replicas: document.getElementById('replicaCountInput').value
        });
    }

    async handleCreateIndex() {
        try {
            const indexName = document.getElementById('indexName').value.trim();
            const shardsInput = document.getElementById('shardCountInput');
            const replicasInput = document.getElementById('replicaCountInput');

            console.log('Raw input values:', {
                shards: shardsInput.value,
                replicas: replicasInput.value
            });

            const shards = parseInt(shardsInput.value) || 1;
            const replicas = parseInt(replicasInput.value) || 1;

            console.log('Parsed values:', { shards, replicas });

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

            console.log('Final settings to be sent:', JSON.stringify(settings, null, 2));

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
        try {
            const url = document.getElementById('esUrl').value.trim();
            console.log('Connecting to URL:', url);
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

            this.esService = new ElasticsearchService(url);
            this.indicesRepository = new IndicesRepository(this.esService);
            
            const isConnected = await this.esService.checkConnection();
            if (isConnected) {
                localStorage.setItem('esUrl', url);
                const name = document.getElementById('connectionName').value.trim();
                if (name) {
                    localStorage.setItem('lastConnection', name);
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
            const [clusterInfo, health, stats, indices] = await Promise.all([
                this.esService.getClusterInfo(),
                this.esService.getClusterHealth(),
                this.esService.getClusterStats(),
                this.esService.getIndicesInfo()
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
                            if (data.length > 30) {
                                return `<span class="font-medium" title="${data}">
                                    ${data.substring(0, 30)}...
                                </span>`;
                            }
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
        console.error(message);
    }

    async loadSavedConnection() {
        const lastConnectionName = localStorage.getItem('lastConnection');
        if (lastConnectionName) {
            const connections = this.getSavedConnections();
            const lastConnection = connections.find(c => c.name === lastConnectionName);
            if (lastConnection) {
                document.getElementById('connectionName').value = lastConnection.name;
                document.getElementById('esUrl').value = lastConnection.url;
                document.getElementById('selectedConnectionText').textContent = lastConnection.name;
                
                this.esService = new ElasticsearchService(lastConnection.url);
                this.indicesRepository = new IndicesRepository(this.esService);
                
                const isConnected = await this.esService.checkConnection();
                if (isConnected) {
                    document.getElementById('dashboard').classList.remove('hidden');
                    this.quickFilter = new QuickFilter(this.esService);
                    this.search = new Search(this.esService);
                    await this.updateDashboard();
                } else {
                    localStorage.removeItem('lastConnection');
                    Toast.show('Saved connection is no longer valid', 'error');
                }
            }
        }
    }

    clearConnection() {
        localStorage.removeItem('lastConnection');
        document.getElementById('esUrl').value = '';
        document.getElementById('connectionName').value = '';
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
        document.getElementById('aliasIndexName').textContent = indexName;
        modal.dataset.indexName = indexName;
        
        await this.refreshAliasesList(indexName);
        modal.classList.remove('hidden');
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
        const mappingTabs = modal.querySelectorAll('.mapping-tabs .tab-button');
        const closeBtn = modal.querySelector('.close-modal');
        const cancelBtn = document.getElementById('cancelUpdateMapping');
        const confirmBtn = document.getElementById('confirmUpdateMapping');
        const addFieldBtn = document.getElementById('addFieldBtn');
        
        try {
            const details = await this.indicesRepository.getIndexDetails(indexName);
            const currentMapping = details.mapping;
            const originalMapping = JSON.parse(JSON.stringify(details.mapping)); // Deep copy original mapping
            
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
            
            // Add field handler
            addFieldBtn.addEventListener('click', () => {
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
            modal.dataset.indexName = indexName;
            
            // Tab switching
            mappingTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const tabId = tab.dataset.tab;
                    mappingTabs.forEach(t => t.classList.remove('active'));
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
            
            confirmBtn.addEventListener('click', async () => {
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
                    
                    await this.esService.updateMapping(indexName, newMapping);
                    Toast.show('Mapping updated successfully', 'success');
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
            
            [closeBtn, cancelBtn].forEach(btn => {
                btn.addEventListener('click', () => {
                    modal.classList.add('hidden');
                });
            });
            
            confirmBtn.addEventListener('click', async () => {
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
            // Önce mapping bilgisini alalım
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

            // Tüm alanları mapping'den alalım
            const fieldArray = Object.keys(mapping);

            const data = response.hits.hits.map(hit => {
                const row = {};
                row.id = hit._id;
                // Tüm mapping alanlarını döngüye al
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
        const dropdownBtn = document.getElementById('connectionSelectBtn');
        const dropdownMenu = document.getElementById('connectionDropdownMenu');
        
        document.getElementById('saveConnectionBtn').addEventListener('click', () => {
            this.saveConnection();
        });
        
        dropdownBtn.addEventListener('click', () => {
            dropdownMenu.classList.toggle('show');
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.connection-dropdown')) {
                dropdownMenu.classList.remove('show');
            }
        });
    }

    updateConnectionsList() {
        const connectionList = document.getElementById('connectionList');
        const connections = this.getSavedConnections();
        const dropdownMenu = document.getElementById('connectionDropdownMenu');
        
        connectionList.innerHTML = connections.length === 0 ? 
            '<div class="connection-item">No saved connections</div>' :
            connections.map(conn => `
                <div class="connection-item" data-name="${conn.name}">
                    <span class="connection-name">${conn.name}</span>
                    <div class="connection-item-actions">
                        <button class="connection-action-btn edit" data-name="${conn.name}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="connection-action-btn delete" data-name="${conn.name}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');

        // Add click handlers
        connectionList.querySelectorAll('.connection-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                if (!e.target.closest('.connection-action-btn')) {
                    const name = item.dataset.name;
                    const connection = connections.find(c => c.name === name);
                    if (connection) {
                        document.getElementById('connectionName').value = connection.name;
                        document.getElementById('esUrl').value = connection.url;
                        document.getElementById('selectedConnectionText').textContent = connection.name;
                        dropdownMenu.classList.remove('show');
                        // Otomatik connect
                        await this.connect();
                    }
                }
            });
        });

        connectionList.querySelectorAll('.connection-action-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const name = btn.dataset.name;
                const connection = connections.find(c => c.name === name);
                if (connection) {
                    document.getElementById('connectionName').value = connection.name;
                    document.getElementById('esUrl').value = connection.url;
                    document.getElementById('selectedConnectionText').textContent = connection.name;
                    dropdownMenu.classList.remove('show');
                }
            });
        });

        connectionList.querySelectorAll('.connection-action-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const name = btn.dataset.name;
                this.deleteConnection();
                dropdownMenu.classList.remove('show');
            });
        });
    }

    getSavedConnections() {
        const connections = localStorage.getItem('esConnections');
        return connections ? JSON.parse(connections) : [];
    }

    saveConnection() {
        const name = document.getElementById('connectionName').value.trim();
        const url = document.getElementById('esUrl').value.trim();

        if (!url) {
            Toast.show('Please enter Elasticsearch URL', 'error');
            return;
        }

        if (!name) {
            Toast.show('Please enter a name for the connection', 'error');
            return;
        }

        const connections = this.getSavedConnections();
        
        // Eğer connection zaten varsa güncelle
        const existingIndex = connections.findIndex(c => c.name === name);
        if (existingIndex !== -1) {
            connections[existingIndex] = { name, url };
            Toast.show('Connection updated successfully', 'success');
        } else {
            connections.push({ name, url });
            Toast.show('Connection saved successfully', 'success');
        }

        localStorage.setItem('esConnections', JSON.stringify(connections));
        this.updateConnectionsList();
    }

    deleteConnection() {
        const name = document.getElementById('connectionName').value.trim();
        if (!name) {
            Toast.show('Please select a connection to delete', 'error');
            return;
        }

        const connections = this.getSavedConnections();
        const newConnections = connections.filter(c => c.name !== name);
        localStorage.setItem('esConnections', JSON.stringify(newConnections));
        
        this.updateConnectionsList();
        document.getElementById('connectionName').value = '';
        document.getElementById('esUrl').value = '';
        document.getElementById('selectedConnectionText').textContent = 'Select a connection';
        Toast.show('Connection deleted successfully', 'success');
    }

    loadSavedConnections() {
        this.updateConnectionsList();
    }

    async initializeComponents() {
        try {
            this.search = new Search(this.esService);
        } catch (error) {
            console.error('Failed to initialize components:', error);
            Toast.show('Failed to initialize components', 'error');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    new ThemeManager();
    window.esMonitor = new ESMonitor();
});