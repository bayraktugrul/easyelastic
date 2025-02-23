export const httpMethods = [
    {
        label: 'GET',
        kind: 'Keyword',
        insertText: 'GET ',
        documentation: 'GET request'
    },
    {
        label: 'POST',
        kind: 'Keyword',
        insertText: 'POST ',
        documentation: 'POST request'
    },
    {
        label: 'PUT',
        kind: 'Keyword',
        insertText: 'PUT ',
        documentation: 'PUT request'
    },
    {
        label: 'DELETE',
        kind: 'Keyword',
        insertText: 'DELETE ',
        documentation: 'DELETE request'
    }
];

export const queryDSL = [
    // Query Context
    {
        label: 'query',
        kind: 'Keyword',
        insertText: 'query": {\n\t${1}\n}',
        documentation: 'Elasticsearch query container'
    },
    {
        label: 'bool',
        kind: 'Keyword',
        insertText: 'bool": {\n\t${1}\n}',
        documentation: 'Boolean query for combining multiple leaf or compound query clauses'
    },
    {
        label: 'must',
        kind: 'Keyword',
        insertText: 'must": [\n\t${1}\n]',
        documentation: 'Must clause of bool query. Queries that must match for the document to be included.'
    },
    {
        label: 'should',
        kind: 'Keyword',
        insertText: 'should": [\n\t${1}\n]',
        documentation: 'Should clause of bool query. Documents that match will have a higher score.'
    },
    {
        label: 'must_not',
        kind: 'Keyword',
        insertText: 'must_not": [\n\t${1}\n]',
        documentation: 'Must not clause of bool query. Queries that must not match for the document to be included.'
    },
    {
        label: 'filter',
        kind: 'Keyword',
        insertText: 'filter": [\n\t${1}\n]',
        documentation: 'Filter clause of bool query. Must match, but no scoring.'
    },

    // Full text queries
    {
        label: 'match',
        kind: 'Keyword',
        insertText: 'match": {\n\t"${1:field}": "${2:value}"\n}',
        documentation: 'Match query for full text search'
    },
    {
        label: 'match_all',
        kind: 'Keyword',
        insertText: 'match_all": {}',
        documentation: 'Match all documents'
    },
    {
        label: 'match_phrase',
        kind: 'Keyword',
        insertText: 'match_phrase": {\n\t"${1:field}": "${2:phrase}"\n}',
        documentation: 'Match exact phrase in the text'
    },
    {
        label: 'multi_match',
        kind: 'Keyword',
        insertText: 'multi_match": {\n\t"query": "${1:text}",\n\t"fields": ["${2:field1}", "${3:field2}"]\n}',
        documentation: 'Match query for multiple fields'
    },

    // Term level queries
    {
        label: 'term',
        kind: 'Keyword',
        insertText: 'term": {\n\t"${1:field}": {\n\t\t"value": "${2:value}"\n\t}\n}',
        documentation: 'Term level query for exact matches'
    },
    {
        label: 'terms',
        kind: 'Keyword',
        insertText: 'terms": {\n\t"${1:field}": ["${2:value1}", "${3:value2}"]\n}',
        documentation: 'Terms query for multiple exact matches'
    },
    {
        label: 'range',
        kind: 'Keyword',
        insertText: 'range": {\n\t"${1:field}": {\n\t\t"gte": "${2:value}",\n\t\t"lte": "${3:value}"\n\t}\n}',
        documentation: 'Range query for numeric/date fields'
    },
    {
        label: 'exists',
        kind: 'Keyword',
        insertText: 'exists": {\n\t"field": "${1:field}"\n}',
        documentation: 'Exists query to find documents where a field exists'
    },
    {
        label: 'prefix',
        kind: 'Keyword',
        insertText: 'prefix": {\n\t"${1:field}": "${2:prefix}"\n}',
        documentation: 'Prefix query for prefix matches'
    },
    {
        label: 'wildcard',
        kind: 'Keyword',
        insertText: 'wildcard": {\n\t"${1:field}": "${2:pa*ern}"\n}',
        documentation: 'Wildcard query for pattern matches'
    },

    // Aggregations
    {
        label: 'aggs',
        kind: 'Keyword',
        insertText: 'aggs": {\n\t"${1:name}": {\n\t\t"${2:type}": {\n\t\t\t"field": "${3:field}"\n\t\t}\n\t}\n}',
        documentation: 'Aggregations for analytics'
    },
    {
        label: 'terms_agg',
        kind: 'Keyword',
        insertText: 'terms": {\n\t"field": "${1:field}",\n\t"size": ${2:10}\n}',
        documentation: 'Terms aggregation'
    },
    {
        label: 'date_histogram',
        kind: 'Keyword',
        insertText: 'date_histogram": {\n\t"field": "${1:date_field}",\n\t"calendar_interval": "${2:month}"\n}',
        documentation: 'Date histogram aggregation'
    },

    // Other options
    {
        label: 'sort',
        kind: 'Keyword',
        insertText: 'sort": [\n\t{\n\t\t"${1:field}": {\n\t\t\t"order": "${2:desc}"\n\t\t}\n\t}\n]',
        documentation: 'Sort results'
    },
    {
        label: 'from',
        kind: 'Keyword',
        insertText: 'from": ${1:0}',
        documentation: 'Starting from document number'
    },
    {
        label: 'size',
        kind: 'Keyword',
        insertText: 'size": ${1:10}',
        documentation: 'Number of hits to return'
    }
]; 