class IndicesRepository {
    constructor(elasticsearchService) {
        this.service = elasticsearchService;
    }

    async getAllIndices() {
        try {
            const indices = await this.service.getIndicesInfo();
            const formattedIndices = [];

            for (let index of indices) {
                try {
                    const settings = await this.service.getIndexSettings(index.index);
                    const aliases = await this.service.getAliases(index.index);

                    formattedIndices.push({
                        index: index.index,
                        docs_count: index.docs.count || 0,
                        store_size: index.store.size_string || '0b',
                        health: index.health,
                        creation_date: settings[index.index]?.settings?.index?.creation_date || '',
                        aliases: aliases
                    });
                } catch (error) {
                    formattedIndices.push({
                        index: index.index,
                        docs_count: index.docs.count || 0,
                        store_size: index.store.size_string || '0b',
                        health: index.health,
                        creation_date: '',
                        aliases: []
                    });
                }
            }

            return formattedIndices;
        } catch (error) {
            console.error('Error getting indices:', error);
            throw error;
        }
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