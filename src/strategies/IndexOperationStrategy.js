class IndexOperation {
    async execute() {
        throw new Error('execute method must be implemented');
    }
}

class CreateIndexOperation extends IndexOperation {
    constructor(service, indexName, settings) {
        super();
        this.service = service;
        this.indexName = indexName;
        this.settings = settings;
    }

    async execute() {
        if (!this.indexName) {
            throw new Error('Index name is required');
        }

        try {
            return await this.service.createIndex(this.indexName, this.settings);
        } catch (error) {
            throw new Error(`Failed to create index: ${error.message}`);
        }
    }
}

class DeleteIndexOperation extends IndexOperation {
    constructor(service, indexName) {
        super();
        this.service = service;
        this.indexName = indexName;
    }

    async execute() {
        return await this.service.deleteIndex(this.indexName);
    }
}

export { CreateIndexOperation, DeleteIndexOperation }; 