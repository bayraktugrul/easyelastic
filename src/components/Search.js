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

    async loadIndices() {
        try {
            console.log('Loading indices...');
            const indices = await this.esService.getIndicesInfo();
            console.log('Received indices:', indices);
            
            const indexSelector = document.getElementById('searchIndexSelector');
            console.log('Index selector element:', indexSelector);
            
            if (!indexSelector) {
                console.error('Search index selector element not found');
                return;
            }
            
            // Mevcut seçenekleri temizle
            indexSelector.innerHTML = '<option value="">Select an index</option>';
            
            if (Array.isArray(indices)) {
                // İndeksleri sırala
                const sortedIndices = indices.sort((a, b) => a.index.localeCompare(b.index));
                
                // İndeksleri select'e ekle
                sortedIndices.forEach(index => {
                    console.log('Adding index:', index.index);
                    const option = document.createElement('option');
                    option.value = index.index;
                    option.textContent = index.index;
                    indexSelector.appendChild(option);
                });
            } else {
                console.error('Indices is not an array:', indices);
            }
        } catch (error) {
            console.error('Failed to load indices:', error);
            Toast.show('Failed to load indices', 'error');
        }
    }

    initializeEventListeners() {
        const indexSelector = document.getElementById('searchIndexSelector');
        const executeBtn = document.getElementById('executeQuery');
        const formatBtn = document.getElementById('formatQuery');
        const copyBtn = document.getElementById('copyQuery');

        if (indexSelector) {
            indexSelector.addEventListener('change', (e) => {
                this.selectedIndex = e.target.value;
                console.log('Selected index:', this.selectedIndex);
            });
        }

        if (executeBtn) {
            executeBtn.addEventListener('click', () => this.executeSearch());
        }

        if (formatBtn) {
            formatBtn.addEventListener('click', () => this.formatQuery());
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyQuery());
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