export default class Search {
    constructor(esService) {
        this.esService = esService;
        this.selectedIndex = null;
        this.init();
    }

    async init() {
        await this.loadIndices();
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const indexSelector = document.getElementById('searchIndexSelector');
        const executeBtn = document.getElementById('executeQuery');
        const formatBtn = document.getElementById('formatQuery');
        const copyBtn = document.getElementById('copyQuery');

        indexSelector?.addEventListener('change', (e) => {
            this.selectedIndex = e.target.value;
        });

        executeBtn?.addEventListener('click', () => this.executeSearch());
        formatBtn?.addEventListener('click', () => this.formatQuery());
        copyBtn?.addEventListener('click', () => this.copyQuery());
    }

    async loadIndices() {
        try {
            const indices = await this.esService.getIndicesInfo();
            const indexSelector = document.getElementById('searchIndexSelector');
            
            if (!indexSelector) return;
            
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
            console.error('Failed to load indices:', error);
            Toast.show('Failed to load indices', 'error');
        }
    }

    async executeSearch() {
        if (!this.selectedIndex) {
            Toast.show('Please select an index', 'error');
            return;
        }

        try {
            const queryInput = document.getElementById('queryInput');
            const query = JSON.parse(queryInput.textContent);
            
            const results = await this.esService.searchDocuments(this.selectedIndex, query);
            this.displayResults(results);
        } catch (error) {
            Toast.show(error.message, 'error');
        }
    }

    formatQuery() {
        try {
            const queryInput = document.getElementById('queryInput');
            const query = JSON.parse(queryInput.textContent);
            queryInput.textContent = JSON.stringify(query, null, 4);
        } catch (error) {
            Toast.show('Invalid JSON', 'error');
        }
    }

    copyQuery() {
        const queryInput = document.getElementById('queryInput');
        navigator.clipboard.writeText(queryInput.textContent)
            .then(() => Toast.show('Query copied to clipboard', 'success'))
            .catch(() => Toast.show('Failed to copy query', 'error'));
    }

    displayResults(results) {
        const resultsElement = document.getElementById('searchResults');
        const countElement = document.getElementById('searchResultsCount');
        
        countElement.textContent = `${results.hits.total.value} results found`;
        resultsElement.textContent = JSON.stringify(results, null, 2);
    }
} 