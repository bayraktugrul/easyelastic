class IndicesService {
    constructor(elasticsearchService) {
        this.esService = elasticsearchService;
    }

    async getIndicesWithAliases(indices) {
        const flattenedIndices = indices.map(index => ({
            index: index.index,
            docs_count: index.docs_count || 0,
            store_size: index.store_size || '0b',
            health: index.health,
            aliases: []
        }));

        for (let index of flattenedIndices) {
            try {
                const aliases = await this.esService.getAliases(index.index);
                index.aliases = aliases;
            } catch (error) {
                console.error(`Failed to fetch aliases for ${index.index}:`, error);
                index.aliases = [];
            }
        }

        return flattenedIndices;
    }

    async createIndex(indexName, settings) {
        return await this.esService.createIndex(indexName, settings);
    }

    async deleteIndex(indexName) {
        return await this.esService.deleteIndex(indexName);
    }

    async manageAlias(indexName, aliasName, action) {
        if (action === 'add') {
            return await this.esService.addAlias(indexName, aliasName);
        } else if (action === 'remove') {
            return await this.esService.removeAlias(indexName, aliasName);
        }
    }
}

export default IndicesService; 