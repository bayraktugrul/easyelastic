export default class JsonHighlighter {
    static highlight(jsonString) {
        if (!jsonString || typeof jsonString !== 'string') {
            return jsonString;
        }

        try {
            const parsed = JSON.parse(jsonString);
            const formatted = JSON.stringify(parsed, null, 2);
            
            return this.syntaxHighlight(formatted);
        } catch (error) {
            return this.syntaxHighlight(jsonString);
        }
    }

    static syntaxHighlight(json) {
        if (!json) return json;

        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        return json.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            (match) => {
                let cls = 'json-number';
                
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'json-key';
                    } else {
                        cls = 'json-string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'json-boolean';
                } else if (/null/.test(match)) {
                    cls = 'json-null';
                }
                
                return `<span class="${cls}">${match}</span>`;
            }
        );
    }

    static highlightElement(element, jsonData) {
        if (!element) return;
        
        let jsonString;
        if (typeof jsonData === 'string') {
            jsonString = jsonData;
        } else {
            jsonString = JSON.stringify(jsonData, null, 2);
        }
        
        const highlighted = this.highlight(jsonString);
        element.innerHTML = highlighted;
        element.classList.add('json-highlighted');
    }

    static createHighlightedPre(jsonData, className = '') {
        const pre = document.createElement('pre');
        pre.className = `json-highlighted ${className}`.trim();
        
        let jsonString;
        if (typeof jsonData === 'string') {
            jsonString = jsonData;
        } else {
            jsonString = JSON.stringify(jsonData, null, 2);
        }
        
        const highlighted = this.highlight(jsonString);
        pre.innerHTML = highlighted;
        
        return pre;
    }
} 