class IndicesRepository {
    constructor(elasticsearchService) {
        this.service = elasticsearchService;
    }

    async getAllIndices() {
        const indices = await this.service.getIndicesInfo();
        const mappedIndices = this.mapIndices(indices);
        
        for (let index of mappedIndices) {
            try {
                const aliases = await this.service.getAliases(index.index);
                index.aliases = aliases;
            } catch (error) {
                console.error(`Failed to fetch aliases for ${index.index}:`, error);
                index.aliases = [];
            }
        }

        return mappedIndices;
    }

    async getIndexByName(indexName) {
        const indices = await this.getAllIndices();
        return indices.find(index => index.index === indexName);
    }

    async getIndexAliases(indexName) {
        return await this.service.getAliases(indexName);
    }

    mapIndices(indices) {
        return indices.map(index => ({
            index: index.index,
            docs_count: index.docs_count || 0,
            store_size: index.store_size || '0b',
            health: index.health,
            aliases: []
        }));
    }

    async getIndexDetails(indexName) {
        const [settings, mapping] = await Promise.all([
            this.service.getIndexSettings(indexName),
            this.service.getIndexMapping(indexName)
        ]);

        return {
            settings: settings[indexName].settings,
            mapping: mapping[indexName].mappings
        };
    }
}

export default IndicesRepository; 