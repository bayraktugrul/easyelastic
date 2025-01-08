import Toast from '../utils/Toast.js';

export default class QuickFilter {
    constructor(esService) {
        this.esService = esService;
        this.selectedIndex = null;
        this.fields = [];
        this.init();
    }

    async init() {
        this.initializeEventListeners();
        await this.loadIndices();
    }

    initializeEventListeners() {
        // Index dropdown
        const indexBtn = document.getElementById('quickFilterIndexBtn');
        const indexMenu = document.getElementById('quickFilterDropdownMenu');

        if (indexBtn && indexMenu) {
            indexBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                indexMenu.classList.toggle('show');
            });

            document.addEventListener('click', (e) => {
                if (!e.target.closest('#quickFilterIndexBtn')) {
                    indexMenu.classList.remove('show');
                }
            });
        }

        // Add filter button
        const addFilterBtn = document.getElementById('addQuickFilterBtn');
        if (addFilterBtn) {
            addFilterBtn.addEventListener('click', () => this.addFilter());
        }

        // Copy query button
        const copyQueryBtn = document.getElementById('copyQuickFilterQuery');
        if (copyQueryBtn) {
            copyQueryBtn.addEventListener('click', () => this.copyQuery());
        }
    }

    async loadIndices() {
        try {
            const indices = await this.esService.getIndicesInfo();
            const indexList = document.getElementById('quickFilterIndexList');
            
            indexList.innerHTML = indices.map(index => `
                <div class="quick-filter-item" data-index="${index.index}">
                    <span class="index-name">${index.index}</span>
                    <span class="index-count">${index.docs?.count || 0} docs</span>
                </div>
            `).join('');

            indexList.querySelectorAll('.quick-filter-item').forEach(item => {
                item.addEventListener('click', () => {
                    const indexName = item.dataset.index;
                    this.selectIndex(indexName);
                });
            });
        } catch (error) {
            Toast.show('Failed to load indices', 'error');
        }
    }

    async selectIndex(indexName) {
        this.selectedIndex = indexName;
        document.getElementById('selectedQuickFilterIndex').textContent = indexName;
        document.getElementById('quickFilterDropdownMenu').classList.remove('show');
        document.getElementById('addQuickFilterBtn').disabled = false;
        await this.loadFields();
    }

    async loadFields() {
        try {
            const mapping = await this.esService.getIndexMapping(this.selectedIndex);
            this.fields = Object.keys(mapping[this.selectedIndex].mappings.properties || {});
        } catch (error) {
            Toast.show('Failed to load fields', 'error');
        }
    }

    addFilter() {
        const filterId = Date.now();
        const filterHtml = `
            <div class="filter-item" data-filter-id="${filterId}">
                <select class="field-select">
                    <option value="">Select Field</option>
                    ${this.fields.map(field => `
                        <option value="${field}">${field}</option>
                    `).join('')}
                </select>
                <input type="text" class="value-input" placeholder="Enter value">
                <button class="remove-filter" title="Remove Filter">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        const container = document.getElementById('quickFilters');
        container.insertAdjacentHTML('beforeend', filterHtml);

        const filterElement = container.lastElementChild;
        
        filterElement.querySelector('.remove-filter').addEventListener('click', () => {
            filterElement.remove();
            this.updateQuery();
        });

        filterElement.querySelectorAll('select, input').forEach(element => {
            element.addEventListener('change', () => this.updateQuery());
            element.addEventListener('input', () => this.updateQuery());
        });

        this.updateQuery();
    }

    buildQuery() {
        const filters = Array.from(document.querySelectorAll('.filter-item')).map(filter => {
            const field = filter.querySelector('.field-select').value;
            const value = filter.querySelector('.value-input').value;

            if (!field || !value) return null;

            return { match: { [field]: value } };
        }).filter(Boolean);

        return {
            query: {
                bool: {
                    must: filters.length ? filters : [{ match_all: {} }]
                }
            }
        };
    }

    async updateQuery() {
        const query = this.buildQuery();
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
} 