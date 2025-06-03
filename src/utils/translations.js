const translations = {
    en: {
        navbar: {
            home: "Home",
            cluster: "Cluster",
            indices: "Indices",
            shards: "Shards",
            search: "Search",
            sampleData: "Sample Data",
            quickFilter: "Quick Filter"
        },
        connection: {
            connectionName: "Connection name (optional)",
            esUrl: "Elasticsearch URL (e.g. http://localhost:9200)",
            selectConnection: "Select a connection",
            authentication: "Authentication",
            optional: "(optional)",
            username: "Username",
            password: "Password",
            save: "Save",
            test: "Test",
            connect: "Connect",
            disconnect: "Disconnect"
        },
        cluster: {
            title: "Cluster",
            clusterName: "Cluster Name",
            nodeName: "Node Name",
            esVersion: "Elasticsearch Version",
            luceneVersion: "Lucene Version",
            indicesDocuments: "Indices & Documents",
            documents: "documents",
            storage: "Storage",
            of: "of",
            nodes: "Nodes",
            master: "master",
            data: "data",
            shards: "Shards",
            active: "active",
            relocating: "relocating",
            system: "System",
            clusterStatus: "Cluster Status",
            healthGreen: "HEALTHY",
            healthYellow: "WARNING",
            healthRed: "CRITICAL",
            jvm: "JVM",
            systemMemory: "System"
        },
        indices: {
            title: "Indices",
            createIndex: "Create Index",
            indexName: "Index Name",
            docsCount: "Docs Count",
            size: "Size",
            aliases: "Aliases",
            health: "Health",
            createdDate: "Created Date",
            actions: "Actions"
        },
        shards: {
            title: "Shards Distribution",
            hideSystemIndices: "Hide system indices",
            node: "Node",
            primary: "Primary",
            replica: "Replica",
            shard: "shards",
            unassigned: "Unassigned",
            started: "Started",
            initializing: "Initializing",
            relocating: "Relocating"
        },
        search: {
            title: "Search",
            popularQueries: "Popular Queries",
            savedQueries: "Saved Queries",
            elasticsearchQuery: "Elasticsearch Query",
            execute: "Execute",
            searchResults: "Search Results",
            resultsFound: "results found",
            indexOperations: "Index Operations",
            listAllIndices: "List All Indices",
            createIndex: "Create Index",
            aliasManagement: "Alias Management",
            addRemoveAlias: "Add/Remove Alias (Atomic)",
            addAlias: "Add Alias",
            listAllAliases: "List All Aliases",
            settingsMapping: "Settings & Mapping",
            getSettings: "Get Settings",
            getMapping: "Get Mapping"
        },
        sampleData: {
            title: "Sample Data"
        },
        quickFilter: {
            title: "Quick Filter",
            addFilter: "Add Filter",
            elasticsearchQuery: "Elasticsearch Query",
            searchResults: "Search Results",
            resultsFound: "results found"
        },
        feedback: {
            title: "Feedback & Support",
            description: "Have a suggestion, found a bug, or need help? We'd love to hear from you!",
            reportBug: "Report Bug",
            requestFeature: "Request Feature",
            viewIssues: "View Issues"
        },
        modals: {
            createNewIndex: "Create New Index",
            indexName: "Index Name",
            enterIndexName: "Enter index name",
            numberOfShards: "Number of Shards",
            numberOfReplicas: "Number of Replicas",
            cancel: "Cancel",
            create: "Create",
            delete: "Delete",
            deleteConfirmation: "Are you sure you want to delete",
            cannotBeUndone: "This action cannot be undone!",
            manageAliases: "Manage Aliases",
            currentAliases: "Current Aliases",
            addNewAlias: "Add New Alias",
            enterAliasName: "Enter alias name",
            add: "Add",
            close: "Close",
            indexDetails: "Index Details",
            settings: "Settings",
            mapping: "Mapping",
            details: "Details",
            updateMapping: "Update Mapping",
            addDocument: "Add Document",
            deleteAlias: "Delete Alias",
            managingAliasesFor: "Managing aliases for index",
            deleteFieldTitle: "Delete Field",
            deleteFieldConfirmation: "Are you sure you want to delete field",
            documentId: "Document ID (optional)",
            documentIdPlaceholder: "Leave empty for auto-generated ID",
            mappingJson: "Mapping JSON",
            visualEditor: "Visual Editor",
            fieldName: "Field Name",
            fieldType: "Field Type",
            enterFieldName: "Enter field name",
            addField: "Add Field",
            update: "Update"
        },
        fieldTypes: {
            text: "Text",
            keyword: "Keyword",
            long: "Long",
            integer: "Integer",
            short: "Short",
            byte: "Byte",
            double: "Double",
            float: "Float",
            date: "Date",
            boolean: "Boolean",
            binary: "Binary",
            object: "Object",
            nested: "Nested"
        },
        messages: {
            connectionSaved: "Connection saved successfully",
            connectionDeleted: "Connection deleted successfully",
            connectionSuccessful: "Connection successful",
            connectionFailed: "Connection failed",
            querySaved: "Query saved successfully",
            queryDeleted: "Query deleted successfully",
            queryRenamed: "Query renamed successfully",
            queryCopied: "Query copied to clipboard",
            indexCreated: "Index created successfully",
            indexDeleted: "Index deleted successfully",
            aliasAdded: "Alias added successfully",
            aliasDeleted: "Alias deleted successfully",
            formatQuery: "Format Query",
            copyQuery: "Copy Query",
            saveQuery: "Save Query"
        },
        common: {
            noAliases: "No aliases",
            noAliasesDefined: "No aliases defined",
            selectIndex: "Select an index",
            noRecords: "No records found",
            loading: "Loading...",
            refresh: "Refresh",
            id: "ID",
            pleaseSelectIndex: "Please select an index to view documents.",
            noDocumentsFound: "No documents found in this index.",
            errorLoadingDocuments: "Error loading documents.",
            error: "Error"
        },
        dataTables: {
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
        }
    },
    zh: {
        navbar: {
            home: "首页",
            cluster: "集群",
            indices: "索引",
            shards: "分片",
            search: "搜索",
            sampleData: "示例数据",
            quickFilter: "快速过滤"
        },
        connection: {
            connectionName: "连接名称（可选）",
            esUrl: "Elasticsearch URL（例如：http://localhost:9200）",
            selectConnection: "选择连接",
            authentication: "身份验证",
            optional: "（可选）",
            username: "用户名",
            password: "密码",
            save: "保存",
            test: "测试",
            connect: "连接",
            disconnect: "断开连接"
        },
        cluster: {
            title: "集群",
            clusterName: "集群名称",
            nodeName: "节点名称",
            esVersion: "Elasticsearch 版本",
            luceneVersion: "Lucene 版本",
            indicesDocuments: "索引和文档",
            documents: "文档",
            storage: "存储",
            of: "共",
            nodes: "节点",
            master: "主节点",
            data: "数据节点",
            shards: "分片",
            active: "活跃",
            relocating: "重新定位",
            system: "系统",
            clusterStatus: "集群状态",
            healthGreen: "健康",
            healthYellow: "警告",
            healthRed: "严重",
            jvm: "JVM",
            systemMemory: "系统"
        },
        indices: {
            title: "索引",
            createIndex: "创建索引",
            indexName: "索引名称",
            docsCount: "文档数量",
            size: "大小",
            aliases: "别名",
            health: "健康状态",
            createdDate: "创建日期",
            actions: "操作"
        },
        shards: {
            title: "分片分布",
            hideSystemIndices: "隐藏系统索引",
            node: "节点",
            primary: "主分片",
            replica: "副本分片",
            shard: "分片",
            unassigned: "未分配",
            started: "已启动",
            initializing: "初始化中",
            relocating: "重新定位中"
        },
        search: {
            title: "搜索",
            popularQueries: "常用查询",
            savedQueries: "保存的查询",
            elasticsearchQuery: "Elasticsearch 查询",
            execute: "执行",
            searchResults: "搜索结果",
            resultsFound: "条结果",
            indexOperations: "索引操作",
            listAllIndices: "列出所有索引",
            createIndex: "创建索引",
            aliasManagement: "别名管理",
            addRemoveAlias: "添加/删除别名（原子操作）",
            addAlias: "添加别名",
            listAllAliases: "列出所有别名",
            settingsMapping: "设置和映射",
            getSettings: "获取设置",
            getMapping: "获取映射"
        },
        sampleData: {
            title: "示例数据"
        },
        quickFilter: {
            title: "快速过滤",
            addFilter: "添加过滤器",
            elasticsearchQuery: "Elasticsearch 查询",
            searchResults: "搜索结果",
            resultsFound: "条结果"
        },
        feedback: {
            title: "反馈与支持",
            description: "有建议、发现问题或需要帮助吗？我们很乐意听到您的声音！",
            reportBug: "报告错误",
            requestFeature: "请求功能",
            viewIssues: "查看问题"
        },
        modals: {
            createNewIndex: "创建新索引",
            indexName: "索引名称",
            enterIndexName: "输入索引名称",
            numberOfShards: "分片数量",
            numberOfReplicas: "副本数量",
            cancel: "取消",
            create: "创建",
            delete: "删除",
            deleteConfirmation: "您确定要删除",
            cannotBeUndone: "此操作无法撤销！",
            manageAliases: "管理别名",
            currentAliases: "当前别名",
            addNewAlias: "添加新别名",
            enterAliasName: "输入别名",
            add: "添加",
            close: "关闭",
            indexDetails: "索引详情",
            settings: "设置",
            mapping: "映射",
            details: "详情",
            updateMapping: "更新映射",
            addDocument: "添加文档",
            deleteAlias: "删除别名",
            managingAliasesFor: "管理索引的别名",
            deleteFieldTitle: "删除字段",
            deleteFieldConfirmation: "您确定要删除字段",
            documentId: "文档ID（可选）",
            documentIdPlaceholder: "留空以自动生成ID",
            mappingJson: "映射JSON",
            visualEditor: "可视化编辑器",
            fieldName: "字段名称",
            fieldType: "字段类型",
            enterFieldName: "输入字段名称",
            addField: "添加字段",
            update: "更新"
        },
        fieldTypes: {
            text: "文本",
            keyword: "关键字",
            long: "长整型",
            integer: "整数",
            short: "短整型",
            byte: "字节",
            double: "双精度",
            float: "浮点数",
            date: "日期",
            boolean: "布尔值",
            binary: "二进制",
            object: "对象",
            nested: "嵌套"
        },
        messages: {
            connectionSaved: "连接保存成功",
            connectionDeleted: "连接删除成功",
            connectionSuccessful: "连接成功",
            connectionFailed: "连接失败",
            querySaved: "查询保存成功",
            queryDeleted: "查询删除成功",
            queryRenamed: "查询重命名成功",
            queryCopied: "查询已复制到剪贴板",
            indexCreated: "索引创建成功",
            indexDeleted: "索引删除成功",
            aliasAdded: "别名添加成功",
            aliasDeleted: "别名删除成功",
            formatQuery: "格式化查询",
            copyQuery: "复制查询",
            saveQuery: "保存查询"
        },
        common: {
            noAliases: "没有别名",
            noAliasesDefined: "没有定义的别名",
            selectIndex: "选择索引",
            noRecords: "没有找到记录",
            loading: "加载中...",
            refresh: "刷新",
            id: "ID",
            pleaseSelectIndex: "请选择一个索引来查看文档。",
            noDocumentsFound: "此索引中没有找到文档。",
            errorLoadingDocuments: "加载文档时出错。",
            error: "错误"
        },
        dataTables: {
            search: "搜索:",
            lengthMenu: "显示 _MENU_ 项",
            info: "显示从 _START_ 到 _END_ 共 _TOTAL_ 项",
            infoEmpty: "没有可用记录",
            infoFiltered: "(从 _MAX_ 项中过滤)",
            paginate: {
                first: "第一页",
                last: "最后一页",
                next: "下一页",
                previous: "上一页"
            }
        }
    }
};

const DATATABLES_INITIALIZATION_TIMEOUT = 500;

class LanguageManager {
    constructor() {
        this.currentLanguage = 'en';
        this.loadSavedLanguage();
    }

    loadSavedLanguage() {
        try {
            chrome.storage.local.get(['language'], (result) => {
                if (result.language && translations[result.language]) {
                    this.currentLanguage = result.language;
                    
                    setTimeout(() => {
                        this.updateUI();
                        const languageToggle = document.getElementById('languageToggle');
                        if (languageToggle) {
                            const langText = languageToggle.querySelector('.lang-text');
                            if (langText) {
                                langText.textContent = this.currentLanguage.toUpperCase();
                            }
                        }
                    }, 100);
                }
            });
        } catch (error) {
            console.warn('Failed to load saved language:', error);
        }
    }

    setLanguage(language) {
        if (translations[language]) {
            this.currentLanguage = language;
            this.saveLanguage();
            this.updateUI();
            document.dispatchEvent(new CustomEvent('languageChanged', { 
                detail: { language } 
            }));
        }
    }

    saveLanguage() {
        try {
            chrome.storage.local.set({ language: this.currentLanguage });
        } catch (error) {
            console.warn('Failed to save language:', error);
        }
    }

    translate(key) {
        const keys = key.split('.');
        let value = translations[this.currentLanguage];
        
        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                return translations.en ? this.getEnglishTranslation(key) : key;
            }
        }
        
        return value || this.getEnglishTranslation(key) || key;
    }

    getEnglishTranslation(key) {
        const keys = key.split('.');
        let value = translations.en;
        
        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                return key;
            }
        }
        
        return value || key;
    }

    getSafeTranslation(key, fallback = null) {
        try {
            if (!this || typeof this.translate !== 'function') {
                console.warn('LanguageManager not properly initialized, using fallback for:', key);
                return fallback || key;
            }
            
            const result = this.translate(key);
            
            if (result === undefined || result === null || result === '') {
                console.warn('Empty translation for:', key, 'using fallback:', fallback || key);
                return fallback || key;
            }
            
            return result;
        } catch (error) {
            console.warn('Translation error for:', key, error, 'using fallback:', fallback || key);
            return fallback || key;
        }
    }

    updateUI() {
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.translate(key);
            
            if (element.tagName === 'INPUT' && element.placeholder !== undefined) {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });

        document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
            const key = element.getAttribute('data-translate-placeholder');
            const translation = this.translate(key);
            element.placeholder = translation;
        });

        document.querySelectorAll('[data-translate-title]').forEach(element => {
            const key = element.getAttribute('data-translate-title');
            const translation = this.translate(key);
            element.title = translation;
        });

        document.querySelectorAll('option[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            const translation = this.translate(key);
            element.textContent = translation;
        });

        if (window.esMonitor) {
            setTimeout(() => {
                window.esMonitor.refreshDataTablesLanguage();
            }, DATATABLES_INITIALIZATION_TIMEOUT);
        }
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }

    getAvailableLanguages() {
        return Object.keys(translations);
    }
}

export default LanguageManager; 