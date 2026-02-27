/**
 * Query Normalization Service
 * Extracts key entities (names, emails, IDs) from various question formats
 */

class QueryNormalizer {
    constructor() {
        // Common noise words to remove
        this.noiseWords = new Set([
            'what', 'is', 'the', 'of', 'for', 'tell', 'me', 'about', 'whose', 'with',
            'person', 'company', 'name', 'agent', 'details', 'give', 'show', 'find',
            'search', 'get', 'which', 'where', 'does', 'work', 'works', 'from', 'in',
            'a', 'an', 'their', 'his', 'her', 'has', 'have', 'can', 'you', 'please'
        ]);

        // Question patterns that indicate specific queries
        this.patterns = {
            email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
            agentID: /CHAGT\d+/gi,
            loginID: /(?:login\s*)?(?:ID|id)\s*(\d+)/gi
        };
    }

    /**
     * Normalize query to extract key search terms
     * @param {string} query - Raw user query
     * @returns {Object} Normalized query with extracted entities
     */
    normalize(query) {
        const original = query;
        let normalized = query.toLowerCase().trim();

        // Extract structured identifiers first
        const emails = this._extractEmails(query);
        const agentIDs = this._extractAgentIDs(query);
        const loginIDs = this._extractLoginIDs(query);

        // If we found structured identifiers, use them directly
        if (emails.length > 0 || agentIDs.length > 0 || loginIDs.length > 0) {
            return {
                original,
                normalized: query,
                cleanQuery: query,
                entities: { emails, agentIDs, loginIDs },
                hasStructuredID: true
            };
        }

        // Extract person names (capitalized words that aren't noise)
        const personName = this._extractPersonName(query);

        // Remove noise words
        const words = normalized.split(/\s+/);
        const cleanWords = words.filter(word => 
            !this.noiseWords.has(word) && word.length > 1
        );

        const cleanQuery = cleanWords.join(' ');

        return {
            original,
            normalized,
            cleanQuery,
            personName,
            entities: { emails, agentIDs, loginIDs },
            hasStructuredID: false
        };
    }

    /**
     * Extract person name from query (looks for capitalized words)
     */
    _extractPersonName(query) {
        // Match capitalized words (likely names) - including ALL CAPS
        const namePattern = /\b[A-Z][A-Z]+(?:\s+[A-Z][A-Z]+)*\b|\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
        const matches = query.match(namePattern);
        
        if (!matches) return null;

        // Filter out common non-name capitalized words
        const nonNames = new Set(['What', 'Which', 'Who', 'When', 'Where', 'How', 'Tell', 'Show', 'Find', 'Get', 'List', 'Give', 'WHAT', 'WHICH', 'WHO', 'WHEN', 'WHERE', 'HOW', 'TELL', 'SHOW', 'FIND', 'GET', 'LIST', 'GIVE', 'ID', 'AGENTID']);
        const names = matches.filter(m => !nonNames.has(m));

        // Return the longest match (likely full name)
        return names.length > 0 ? names.sort((a, b) => b.length - a.length)[0] : null;
    }

    _extractEmails(query) {
        return Array.from(query.matchAll(this.patterns.email)).map(m => m[0]);
    }

    _extractAgentIDs(query) {
        return Array.from(query.matchAll(this.patterns.agentID)).map(m => m[0]);
    }

    _extractLoginIDs(query) {
        const matches = [];
        let match;
        const regex = new RegExp(this.patterns.loginID.source, 'gi');
        while ((match = regex.exec(query)) !== null) {
            matches.push(match[1]);
        }
        return matches;
    }
}

module.exports = new QueryNormalizer();