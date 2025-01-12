import Toast from '../utils/Toast.js';

export default class Search {
    constructor(esService) {
        this.esService = esService;
        this.editor = null;
        this.init();
    }

    async init() {
        await this.initializeMonacoEditor();
        this.initializeEventListeners();
    }

    async initializeMonacoEditor() {
        require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }});
        require(['vs/editor/editor.main'], () => {
            monaco.languages.register({ id: 'elasticsearch' });
            monaco.languages.setMonarchTokensProvider('elasticsearch', {
                tokenizer: {
                    root: [
                        [/(GET|POST|PUT|DELETE)/, "keyword"],
                        [/[a-zA-Z0-9_*-]+\//, "string"],
                        [/{/, { token: "delimiter.curly", next: "@json" }],
                    ],
                    json: [
                        [/[{}]/, "delimiter.curly"],
                        [/".*?"/, "string"],
                        [/[0-9]+/, "number"],
                        [/[a-zA-Z_]\w*/, "identifier"],
                        [/[,:]/, "delimiter"],
                        [/\s+/, "white"],
                        [/}/, { token: "delimiter.curly", next: "@pop" }]
                    ]
                }
            });

            this.editor = monaco.editor.create(document.getElementById('queryInput'), {
                value: 'GET my-index/_search\n{\n  "query": {\n    "match_all": {}\n  }\n}',
                language: 'elasticsearch',
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

            // Snippet'leri ekle
            monaco.languages.registerCompletionItemProvider('elasticsearch', {
                provideCompletionItems: () => {
                    const suggestions = [
                        {
                            label: 'GET index/_search',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: 'GET ${1:my-index}/_search\n{\n  "query": {\n    "match": {\n      "${2:field}": "${3:value}"\n    }\n  }\n}',
                            documentation: 'Search specific index'
                        },
                        {
                            label: 'GET _search',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: 'GET _search\n{\n  "query": {\n    "match_all": {}\n  }\n}',
                            documentation: 'Search all indices'
                        },
                        {
                            label: 'GET _cat/indices',
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: 'GET _cat/indices?v',
                            documentation: 'List all indices'
                        }
                    ];
                    return { suggestions };
                }
            });
        });
    }

    initializeEventListeners() {
        const executeBtn = document.getElementById('executeQuery');
        const formatBtn = document.getElementById('formatQuery');
        const copyBtn = document.getElementById('copyQuery');

        if (executeBtn) {
            executeBtn.addEventListener('click', () => this.executeSearch());
        }

        if (formatBtn) {
            formatBtn.addEventListener('click', () => this.formatQuery());
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyQuery());
        }

        const popularQueriesBtn = document.querySelector('.popular-queries-btn');
        const popularQueriesMenu = document.querySelector('.popular-queries-menu');
        
        if (popularQueriesBtn) {
            popularQueriesBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                popularQueriesMenu.classList.toggle('show');
            });
        }

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.popular-queries')) {
                popularQueriesMenu.classList.remove('show');
            }
        });

        document.querySelectorAll('.query-item').forEach(item => {
            item.addEventListener('click', () => {
                const query = item.dataset.query
                    .replace(/&quot;/g, '"')
                    .replace(/\\n/g, '\n');
                this.editor.setValue(query);
                popularQueriesMenu.classList.remove('show');
            });
        });
    }

    async executeSearch() {
        try {
            const query = this.editor.getValue().trim();
            const firstLine = query.split('\n')[0];
            const [httpMethod, endpoint] = firstLine.trim().split(' ');
            
            if (httpMethod === 'GET') {
                const results = await this.esService.executeQuery(httpMethod, endpoint, null);
                this.displayResults(results);
                return;
            }
            
            const bodyContent = query.substring(query.indexOf('\n') + 1).trim();
            
            let body = null;
            if (bodyContent) {
                try {
                    body = JSON.parse(bodyContent);
                } catch (e) {
                    throw new Error('Invalid JSON in request body');
                }
            }

            const results = await this.esService.executeQuery(httpMethod, endpoint, body);
            this.displayResults(results);
        } catch (error) {
            Toast.show(error.message, 'error');
        }
    }

    formatQuery() {
        try {
            const query = this.editor.getValue().trim();
            const firstLine = query.split('\n')[0];
            const bodyContent = query.substring(query.indexOf('\n') + 1).trim();

            if (bodyContent) {
                try {
                    const body = JSON.parse(bodyContent);
                    const formatted = `${firstLine}\n${JSON.stringify(body, null, 2)}`;
                    
                    const model = this.editor.getModel();
                    const range = model.getFullModelRange();
                    this.editor.executeEdits('format', [{
                        range: range,
                        text: formatted,
                        forceMoveMarkers: true
                    }]);

                    this.editor.setPosition({ lineNumber: 1, column: 1 });
                } catch (e) {
                    throw new Error('Invalid JSON in request body');
                }
            }
        } catch (error) {
            Toast.show(error.message, 'error');
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
        
        if (results.result) {
            countElement.textContent = 'Query executed';
            resultsElement.textContent = results.result;
        } else if (results.hits?.total?.value !== undefined) {
            countElement.textContent = `${results.hits.total.value} results found`;
            resultsElement.textContent = JSON.stringify(results, null, 2);
        } else {
            countElement.textContent = 'Query executed';
            resultsElement.textContent = JSON.stringify(results, null, 2);
        }
    }
} 