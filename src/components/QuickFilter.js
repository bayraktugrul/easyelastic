import Toast from '../utils/Toast.js';

export default class QuickFilter {
    constructor(esService) {
        this.esService = esService;
        this.selectedIndex = null;
        this.fields = [];
        this.savedFilters = [];
        this.init();
    }

    async init() {
        this.savedFilters = await this.loadFilters();
        await this.loadIndices();
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const indexSelector = document.getElementById('quickFilterIndexSelector');
        const addFilterBtn = document.getElementById('addQuickFilterBtn');
        const copyQueryBtn = document.getElementById('copyQuickFilterQuery');

        if (indexSelector) {
            indexSelector.addEventListener('change', (e) => {
                const selectedIndex = e.target.value;
                if (selectedIndex) {
                    this.selectIndex(selectedIndex);
                } else {
                    document.getElementById('addQuickFilterBtn').disabled = true;
                }
            });
        }

        if (addFilterBtn) {
            addFilterBtn.addEventListener('click', () => this.addFilter());
        }

        if (copyQueryBtn) {
            copyQueryBtn.addEventListener('click', () => this.copyQuery());
        }
    }

    async loadIndices() {
        try {
            const indices = await this.esService.getIndicesInfo();
            const indexSelector = document.getElementById('quickFilterIndexSelector');
            
            if (!indexSelector) {
                console.error('Index selector element not found');
                return;
            }
            
            indexSelector.innerHTML = '<option value="">Select an index</option>';
            
            if (indices && indices.length > 0) {
                indices.forEach(index => {
                    const option = document.createElement('option');
                    option.value = index.index;
                    option.textContent = index.index;
                    indexSelector.appendChild(option);
                });
            }
        } catch (error) {
            Toast.show('Failed to load indices', 'error');
        }
    }

    async selectIndex(indexName) {
        this.selectedIndex = indexName;
        document.getElementById('addQuickFilterBtn').disabled = false;
        await this.loadFields();
    }

    async loadFields() {
        try {
            const mapping = await this.esService.getIndexMapping(this.selectedIndex);
            const properties = mapping[this.selectedIndex].mappings.properties || {};
            this.fields = this.flattenFields(properties);
        } catch (error) {
            Toast.show('Failed to load fields', 'error');
        }
    }

    flattenFields(properties, prefix = '') {
        let fields = [];
        
        for (const [key, value] of Object.entries(properties)) {
            const fieldName = prefix ? `${prefix}.${key}` : key;
            
            if (value.type) {
                fields.push(fieldName);
            }
            
            if (value.properties) {
                fields = fields.concat(this.flattenFields(value.properties, fieldName));
            }
        }
        
        return fields;
    }

    addFilter() {
        const filterHtml = `
            <div class="filter-item">
                <select class="field-select">
                    <option value="">Select Field</option>
                    ${this.fields.map(field => `<option value="${field}">${field}</option>`).join('')}
                </select>
                <input type="text" class="value-input" placeholder="Enter value">
                <button class="remove-filter">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        const container = document.getElementById('quickFilters');
        container.insertAdjacentHTML('beforeend', filterHtml);

        const filterElement = container.lastElementChild;
        this.attachFilterListeners(filterElement);
        this.updateQuery();
    }

    attachFilterListeners(filterElement) {
        filterElement.querySelector('.remove-filter').addEventListener('click', () => {
            filterElement.remove();
            this.updateQuery();
        });

        filterElement.querySelectorAll('select, input').forEach(element => {
            element.addEventListener('change', () => this.updateQuery());
            element.addEventListener('input', () => this.updateQuery());
        });
    }

    async buildQuery() {
        const filters = Array.from(document.querySelectorAll('.filter-item'))
            .map(filter => {
                const field = filter.querySelector('.field-select').value;
                const value = filter.querySelector('.value-input').value;
                return field && value ? { match: { [field]: value } } : null;
            })
            .filter(Boolean);

        const query = {
            query: {
                bool: {
                    must: filters.length ? filters : [{ match_all: {} }]
                }
            }
        };
        
        await this.saveFilters(filters);
        
        return query;
    }

    async updateQuery() {
        const query = await this.buildQuery();
        const queryPreview = document.getElementById('quickFilterQueryPreview');
        queryPreview.textContent = JSON.stringify(query, null, 2);

        if (this.selectedIndex) {
            try {
                const results = await this.esService.searchDocuments(this.selectedIndex, query);
                this.displayResults(results);
            } catch (error) {
                Toast.show('Search failed', 'error');
            }
        }
    }

    displayResults(results) {
        const resultsElement = document.getElementById('quickFilterResults');
        const countElement = document.getElementById('quickFilterResultsCount');
        
        countElement.textContent = `${results.hits.total.value} results found`;
        resultsElement.textContent = JSON.stringify(results, null, 2);
    }

    copyQuery() {
        const query = document.getElementById('quickFilterQueryPreview').textContent;
        navigator.clipboard.writeText(query)
            .then(() => Toast.show('Query copied to clipboard', 'success'))
            .catch(() => Toast.show('Failed to copy query', 'error'));
    }

    async saveFilters(filters) {
        try {
            await new Promise(resolve => {
                chrome.storage.local.set({ savedFilters: filters }, resolve);
            });
        } catch (error) {
            console.error('Failed to save filters:', error);
        }
    }

    async loadFilters() {
        try {
            const result = await new Promise(resolve => {
                chrome.storage.local.get(['savedFilters'], resolve);
            });
            
            return result.savedFilters || [];
        } catch (error) {
            console.error('Failed to load filters:', error);
            return [];
        }
    }
} 