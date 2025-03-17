import Toast from '../utils/Toast.js';
import { httpMethods, queryDSL } from '../utils/ElasticsearchSuggestions.js';

export default class Search {
    constructor(esService) {
        this.esService = esService;
        this.editor = null;
        this.savedQueries = [];
        this.init();
    }

    async init() {
        this.savedQueries = await this.loadSavedQueries();
        await this.initializeMonacoEditor();
        this.initializeEventListeners();
        this.initializeSavedQueries();
    }

    async loadSavedQueries() {
        try {
            const result = await new Promise(resolve => {
                chrome.storage.local.get(['savedQueries'], resolve);
            });
            return result.savedQueries || [];
        } catch (error) {
            console.error('Failed to load saved queries:', error);
            return [];
        }
    }

    async saveQuery() {
        try {
            await new Promise(resolve => {
                chrome.storage.local.set({ savedQueries: this.savedQueries }, resolve);
            });
        } catch (error) {
            Toast.show('Error saving query', 'error');
        }
    }

    initializeSavedQueries() {
        this.toggleBtn = document.querySelector('.saved-queries-btn');
        this.menu = document.querySelector('.saved-queries-menu');
        this.queriesList = document.querySelector('#savedQueriesList');

        this.toggleBtn.addEventListener('click', () => {
            this.menu.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.saved-queries') && this.menu.classList.contains('show')) {
                this.menu.classList.remove('show');
            }
        });

        this.renderSavedQueries();
    }

    renderSavedQueries() {
        if (!this.queriesList) return;

        if (this.savedQueries.length === 0) {
            this.queriesList.innerHTML = `
                <div class="saved-query-item no-queries">
                    <span class="saved-query-name">No saved queries</span>
                </div>`;
            return;
        }

        this.queriesList.innerHTML = this.savedQueries.map(query => `
            <div class="saved-query-item" data-id="${query.id}">
                <span class="saved-query-name" style="cursor: pointer;">${this.escapeHtml(query.name)}</span>
                <div class="saved-query-actions">
                    <button class="query-action-btn rename">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="query-action-btn delete">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `).join('');

        this.queriesList.querySelectorAll('.saved-query-item').forEach(item => {
            const id = parseInt(item.dataset.id);
            const query = this.savedQueries.find(q => q.id === id);
            const nameElement = item.querySelector('.saved-query-name');

            if (!query) return;

            nameElement.addEventListener('click', () => {
                this.editor.setValue(query.query);
                this.menu.classList.remove('show');
            });

            item.querySelector('.rename').addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'text';
                input.value = query.name;
                input.className = 'rename-input';

                nameElement.style.display = 'none';
                nameElement.parentNode.insertBefore(input, nameElement.nextSibling);
                input.focus();
                input.select();

                const handleRename = () => {
                    const newName = input.value.trim();
                    if (newName && newName !== query.name) {
                        query.name = newName;
                        this.saveQuery();
                        Toast.show('Query renamed successfully', 'success');
                    }
                    input.remove();
                    nameElement.style.display = '';
                    this.renderSavedQueries();
                };

                input.addEventListener('blur', handleRename);
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        handleRename();
                    }
                });
            });

            item.querySelector('.delete').addEventListener('click', () => {
                const modal = document.getElementById('deleteConfirmationModal');
                const modalTitle = document.getElementById('deleteConfirmationModalTitle');
                const modalItemType = document.getElementById('deleteConformationModalItemType');
                
                modalTitle.textContent = 'Delete Query';
                modalItemType.textContent = 'query';
                document.getElementById('deleteConformationModalItemName').textContent = query.name;
                modal.dataset.queryId = id;
                modal.dataset.type = 'query';
                modal.classList.remove('hidden');
            });
        });
    }

    async deleteSavedQuery(id) {
        this.savedQueries = this.savedQueries.filter(q => q.id !== id);
        await this.saveQuery();
        this.renderSavedQueries();
        Toast.show('Query deleted successfully', 'success');
    }

    async quickSave(name, query) {
        if (!query) {
            Toast.show('Query is empty', 'error');
            return;
        }

        const newQuery = {
            id: Date.now(),
            name,
            query
        };

        this.savedQueries.push(newQuery);
        await this.saveQuery();
        this.renderSavedQueries();
        Toast.show('Query saved successfully', 'success');
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    async initializeMonacoEditor() {
        try {
            require.config({ paths: { 'vs': 'libs/monaco-editor/min/vs' }});
            require(['vs/editor/editor.main'], () => {
                monaco.editor.defineTheme('es-dark', {
                    base: 'vs-dark',
                    inherit: true,
                    rules: [],
                    colors: {
                        'editor.background': '#1e293b',
                        'editor.foreground': '#e2e8f0',
                        'editor.lineHighlightBackground': '#334155',
                        'editorLineNumber.foreground': '#64748b',
                        'editorIndentGuide.background': '#334155'
                    }
                });

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

                const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'es-dark' : 'vs-light';
                
                this.editor = monaco.editor.create(document.getElementById('queryInput'), {
                    value: 'GET my-index/_search\n{\n  "query": {\n    "match_all": {}\n  }\n}',
                    language: 'elasticsearch',
                    theme: theme,
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
                    },
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: {
                        other: true,
                        comments: true,
                        strings: true
                    }
                });

                document.addEventListener('themeChanged', (e) => {
                    const newTheme = e.detail.theme === 'dark' ? 'es-dark' : 'vs-light';
                    monaco.editor.setTheme(newTheme);
                });

                monaco.languages.registerCompletionItemProvider('elasticsearch', {
                    provideCompletionItems: (model, position) => {
                        const textUntilPosition = model.getValueInRange({
                            startLineNumber: position.lineNumber,
                            startColumn: 1,
                            endLineNumber: position.lineNumber,
                            endColumn: position.column
                        });

                        if (position.lineNumber === 1) {
                            return {
                                suggestions: httpMethods.map(method => ({
                                    ...method,
                                    kind: monaco.languages.CompletionItemKind[method.kind]
                                }))
                            };
                        }

                        return {
                            suggestions: queryDSL.map(suggestion => ({
                                ...suggestion,
                                kind: monaco.languages.CompletionItemKind[suggestion.kind],
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                            }))
                        };
                    },
                    triggerCharacters: ['"', '{', '[', '.', ' ']
                });
            });
        } catch (error) {
            console.error('Failed to initialize Monaco editor:', error);
        }
    }

    initializeEventListeners() {
        const executeBtn = document.getElementById('executeQuery');
        const formatBtn = document.getElementById('formatQuery');
        const copyBtn = document.getElementById('copyQuery');
        const saveBtn = document.getElementById('saveQueryIcon');
        const popularQueriesBtn = document.querySelector('.popular-queries-btn');
        const popularQueriesMenu = document.querySelector('.popular-queries-menu');
        const deleteModal = document.getElementById('deleteConfirmationModal');
        const confirmDeleteBtn = document.getElementById('confirmDelete');
        const cancelDeleteBtn = document.getElementById('cancelDelete');

        if (executeBtn) {
            executeBtn.addEventListener('click', () => this.executeSearch());
        }

        if (formatBtn) {
            formatBtn.addEventListener('click', () => this.formatQuery());
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyQuery());
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                try {
                    const queryText = this.editor.getValue();
                    const firstLine = queryText.split('\n')[0].trim();
                    this.quickSave(firstLine, queryText);
                } catch (error) {
                    Toast.show('Error saving query: ' + error.message, 'error');
                }
            });
        }
        
        if (popularQueriesBtn) {
            popularQueriesBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.menu.classList.remove('show');
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

        confirmDeleteBtn.addEventListener('click', () => {
            const type = deleteModal.dataset.type;
            if (type === 'query') {
                const queryId = parseInt(deleteModal.dataset.queryId);
                this.deleteSavedQuery(queryId);
                deleteModal.classList.add('hidden');
            }
        });

        cancelDeleteBtn.addEventListener('click', () => {
            deleteModal.classList.add('hidden');
        });

        deleteModal.querySelector('.close-modal').addEventListener('click', () => {
            deleteModal.classList.add('hidden');
        });
    }

    async executeSearch() {
        try {
            const query = this.editor.getValue().trim();
            
            if (!query) {
                Toast.show('Please enter a valid Elasticsearch query', 'warning');
                return;
            }
            
            const firstLine = query.split('\n')[0];
            const [httpMethod, endpoint] = firstLine.trim().split(' ');
            
            if (!httpMethod) {
                Toast.show('Missing HTTP method (GET, POST, PUT, DELETE)', 'warning');
                return;
            }
            
            const validMethods = ['GET', 'POST', 'PUT', 'DELETE'];
            if (!validMethods.includes(httpMethod.toUpperCase())) {
                Toast.show(`Invalid HTTP method: ${httpMethod}. Use GET, POST, PUT or DELETE.`, 'warning');
                return;
            }
            
            if (!endpoint) {
                Toast.show('Missing endpoint (e.g. my-index/_search)', 'warning');
                return;
            }
            
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