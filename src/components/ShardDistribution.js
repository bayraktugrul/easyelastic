export default class ShardDistribution {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.table = this.container.querySelector('.shards-table');
        this.hideSystemIndices = true;
        if (!this.table) {
            console.error('Shards table not found in container:', containerId);
        }
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
            
            let displayName = indexName;
            if (indexName.length > 10) {
                displayName = indexName.substring(0, 10) + '...';
            }
            
            th.innerHTML = `
                <div class="index-header">
                    <div class="index-name ${indexName.length > 10 ? 'has-tooltip' : ''}" data-tooltip="${indexName}">${displayName}</div>
                    <div class="shard-count">${count} shards</div>
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
            const title = `${shard.type} shard ${shard.number} (${shard.state})`;
            
            return `<span class="shard-badge ${type} ${stateClass}" title="${title}">
                ${type}${shard.number}
            </span>`;
        }).join('');
    }
    
    formatNodeName(nodeId) {
        if (nodeId === 'unassigned') {
            return `<span class="node-name unassigned">
                <i class="fas fa-exclamation-triangle"></i> Unassigned
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
} 