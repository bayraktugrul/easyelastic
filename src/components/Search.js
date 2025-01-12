export default class Search {
    constructor(esService) {
        this.esService = esService;
        this.selectedIndex = null;
        this.editor = null;
        this.init();
    }

    async init() {
        await this.loadIndices();
        await this.initializeMonacoEditor();
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

    async initializeMonacoEditor() {
        require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }});
        require(['vs/editor/editor.main'], () => {
            monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
                schemas: [{
                    fileMatch: ["*"],
                    schema: {
                        type: "object",
                        properties: {
                            query: {
                                type: "object",
                                properties: {
                                    match: { type: "object" },
                                    match_all: { type: "object" },
                                    term: { type: "object" },
                                    terms: { type: "object" },
                                    range: { type: "object" },
                                    exists: { type: "object" },
                                    prefix: { type: "object" },
                                    wildcard: { type: "object" },
                                    regexp: { type: "object" },
                                    fuzzy: { type: "object" },
                                    bool: {
                                        type: "object",
                                        properties: {
                                            must: { type: "array" },
                                            should: { type: "array" },
                                            must_not: { type: "array" },
                                            filter: { type: "array" }
                                        }
                                    }
                                }
                            },
                            sort: { type: "array" },
                            from: { type: "number" },
                            size: { type: "number" },
                            _source: {
                                oneOf: [
                                    { type: "array" },
                                    { type: "boolean" }
                                ]
                            }
                        }
                    }
                }]
            });

            this.editor = monaco.editor.create(document.getElementById('queryInput'), {
                value: JSON.stringify({
                    query: {
                        match_all: {}
                    }
                }, null, 2),
                language: 'json',
                theme: 'vs-light',
                minimap: { enabled: false },
                automaticLayout: true,
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                roundedSelection: false,
                renderIndentGuides: true,
                contextmenu: true,
                lineHeight: 21,
                padding: { top: 8, bottom: 8 },
                suggest: {
                    snippets: 'inline'
                }
            });

            monaco.languages.registerCompletionItemProvider('json', {
                provideCompletionItems: () => {
                    const suggestions = [
                        {
                            label: 'match_all',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: {
                                value: '{\n  "query": {\n    "match_all": {}\n  }\n}'
                            },
                            documentation: 'Match all documents query'
                        },
                        {
                            label: 'match',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: {
                                value: '{\n  "query": {\n    "match": {\n      "${1:field}": "${2:value}"\n    }\n  }\n}'
                            },
                            documentation: 'Match query'
                        },
                        {
                            label: 'bool',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: {
                                value: '{\n  "query": {\n    "bool": {\n      "must": [\n        ${1}\n      ],\n      "should": [\n        ${2}\n      ],\n      "must_not": [\n        ${3}\n      ]\n    }\n  }\n}'
                            },
                            documentation: 'Bool query'
                        }
                    ];
                    return { suggestions };
                }
            });
        });
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
            const query = JSON.parse(this.editor.getValue());
            const results = await this.esService.searchDocuments(this.selectedIndex, query);
            this.displayResults(results);
        } catch (error) {
            Toast.show(error.message, 'error');
        }
    }

    formatQuery() {
        try {
            const query = JSON.parse(this.editor.getValue());
            this.editor.setValue(JSON.stringify(query, null, 2));
        } catch (error) {
            Toast.show('Invalid JSON', 'error');
        }
    }

    copyQuery() {
        navigator.clipboard.writeText(this.editor.getValue())
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