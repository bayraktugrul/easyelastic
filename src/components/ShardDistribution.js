export default class ShardDistribution {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.table = this.container.querySelector('.shards-table');
        this.hideSystemIndices = true;
        this.languageManager = null;
        if (!this.table) {
            console.error('Shards table not found in container:', containerId);
        }
    }
    
    setLanguageManager(languageManager) {
        this.languageManager = languageManager;
    }

    getTranslation(key, fallback) {
        return this.languageManager ? 
            this.languageManager.getSafeTranslation(key, fallback) : 
            fallback;
    }
    
    render(data) {
        
        const thead = this.table.querySelector('thead tr');
        const tbody = this.table.querySelector('tbody');
        
        while (thead.children.length > 1) {
            thead.removeChild(thead.lastChild);
        }
        tbody.innerHTML = '';
        
        let sortedIndices = [...data.indices].sort();
        if (this.hideSystemIndices) {
            sortedIndices = sortedIndices.filter(indexName => !this.isSystemIndex(indexName));
        }
        
        sortedIndices.forEach(indexName => {
            const th = document.createElement('th');
            const count = this.getShardCount(data.distribution, indexName);
            const shardsText = this.getTranslation('shards.shard', 'shards');
            
            let displayName = indexName;
            if (indexName.length > 10) {
                displayName = indexName.substring(0, 10) + '...';
            }
            
            th.innerHTML = `
                <div class="index-header">
                    <div class="index-name ${indexName.length > 10 ? 'has-tooltip' : ''}" data-tooltip="${indexName}">${displayName}</div>
                    <div class="shard-count">${count} ${shardsText}</div>
                </div>
            `;
            thead.appendChild(th);
        });
        
        const nodes = Object.keys(data.distribution).sort((a, b) => {
            if (a === 'unassigned') return 1;
            if (b === 'unassigned') return -1;
            return a.localeCompare(b);
        });
        
        nodes.forEach(nodeId => {
            const tr = document.createElement('tr');
            
            const nodeTd = document.createElement('td');
            nodeTd.className = 'node-cell';
            nodeTd.innerHTML = this.formatNodeName(nodeId);
            tr.appendChild(nodeTd);
            
            sortedIndices.forEach(indexName => {
                const td = document.createElement('td');
                td.className = 'shard-cell';
                
                const shards = data.distribution[nodeId]?.[indexName] || [];
                if (shards.length > 0) {
                    td.innerHTML = this.renderShards(shards);
                }
                
                tr.appendChild(td);
            });
            
            tbody.appendChild(tr);
        });
        
        this.updateTranslations();
    }
    
    renderShards(shards) {
        const sortedShards = [...shards].sort((a, b) => {
            if (a.type === b.type) {
                return parseInt(a.number) - parseInt(b.number);
            }
            return a.type === 'primary' ? -1 : 1;
        });
        
        return sortedShards.map(shard => {
            const type = shard.type === 'primary' ? 'p' : 'r';
            const stateClass = shard.state.toLowerCase();
            
            const typeText = shard.type === 'primary' ? 
                this.getTranslation('shards.primary', 'Primary') : 
                this.getTranslation('shards.replica', 'Replica');
            const shardText = this.getTranslation('shards.shard', 'shard');
            const stateText = this.getTranslation(`shards.${shard.state.toLowerCase()}`, shard.state);
            
            const title = `${typeText} ${shardText} ${shard.number} (${stateText})`;
            
            return `<span class="shard-badge ${type} ${stateClass}" title="${title}">
                ${type}${shard.number}
            </span>`;
        }).join('');
    }
    
    formatNodeName(nodeId) {
        if (nodeId === 'unassigned') {
            const unassignedText = this.getTranslation('shards.unassigned', 'Unassigned');
            return `<span class="node-name unassigned">
                <i class="fas fa-exclamation-triangle"></i> ${unassignedText}
            </span>`;
        }
        return `<span class="node-name" title="${nodeId}">
            <i class="fas fa-server"></i> ${nodeId}
        </span>`;
    }
    
    getShardCount(distribution, indexName) {
        let count = 0;
        Object.values(distribution).forEach(nodeData => {
            if (nodeData[indexName]) {
                count += nodeData[indexName].length;
            }
        });
        return count;
    }
    
    isSystemIndex(indexName) {
        return indexName.startsWith('.') ||  
               indexName.startsWith('_');
    }
    
    toggleSystemIndices() {
        this.hideSystemIndices = !this.hideSystemIndices;
        return this.hideSystemIndices;
    }

    updateTranslations() {
        if (this.languageManager) {
            setTimeout(() => {
                this.languageManager.updateUI();
            }, 10);
        }
    }
} 