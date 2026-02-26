const fs = require('fs');
const path = require('path');
const databaseService = require('./databaseService');
const logger = require('../config/logger');

class VectorService {
    constructor() {
        this.agentData = [];
        this.agentLoginData = [];
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        try {
            await databaseService.connect();

            // Try loading from database first
            this.agentData = await databaseService.getAllAgents();
            this.agentLoginData = await databaseService.getAllLogins();

            // Fallback to JSON files if database is empty
            if (this.agentData.length === 0) {
                const agentDataPath = path.join(__dirname, '..', 'data', 'agentData.json');
                const agentLoginPath = path.join(__dirname, '..', 'data', 'agentLoginData.json');
                
                if (fs.existsSync(agentDataPath)) {
                    this.agentData = JSON.parse(fs.readFileSync(agentDataPath, 'utf8'));
                }
                if (fs.existsSync(agentLoginPath)) {
                    this.agentLoginData = JSON.parse(fs.readFileSync(agentLoginPath, 'utf8'));
                }
            }

            this._buildIndexes();
            this.initialized = true;
            logger.info('VectorService initialized');
        } catch (error) {
            logger.error('VectorService init error:', error);
            throw error;
        }
    }

    _buildIndexes() {
        this.agentByEmail = new Map();
        this.agentByID = new Map();
        this.agentByName = new Map();
        this.agentByCompany = new Map(); // Add company index
        this.agentByNationality = new Map(); // Add nationality index
        this.loginsByIdentifier = new Map();
        this.searchIndex = new Map();

        this.agentData.forEach(agent => {
            if (agent.UserName) {
                this.agentByEmail.set(agent.UserName.toLowerCase(), agent);
            }
            if (agent.AgentID) {
                this.agentByID.set(agent.AgentID.toLowerCase(), agent);
            }
            if (agent.Name) {
                this.agentByName.set(agent.Name.toLowerCase(), agent);
            }
            if (agent.Comp_Name) {
                const compKey = agent.Comp_Name.toLowerCase();
                if (!this.agentByCompany.has(compKey)) {
                    this.agentByCompany.set(compKey, []);
                }
                this.agentByCompany.get(compKey).push(agent);
            }
            if (agent.Nationality) {
                const natKey = agent.Nationality.toLowerCase();
                if (!this.agentByNationality.has(natKey)) {
                    this.agentByNationality.set(natKey, []);
                }
                this.agentByNationality.get(natKey).push(agent);
            }

            const tokens = this._tokenize(`${agent.Name} ${agent.UserName} ${agent.AgentID} ${agent.Comp_Name}`);
            tokens.forEach(token => {
                if (!this.searchIndex.has(token)) {
                    this.searchIndex.set(token, new Set());
                }
                this.searchIndex.get(token).add(agent.AgentID);
            });
        });

        this.agentLoginData.forEach(login => { 
            if (!login.AGENTID) return;
            const key = login.AGENTID.toLowerCase();
            if (!this.loginsByIdentifier.has(key)) {
                this.loginsByIdentifier.set(key, []); 
            }
            this.loginsByIdentifier.get(key).push(login);
            
            // Index by login ID
            if (login.ID) {
                if (!this.loginsByID) this.loginsByID = new Map();
                this.loginsByID.set(String(login.ID), login);
            }
        });

        console.log(`Indexed ${this.agentByEmail.size} agents, ${this.agentByCompany.size} companies, ${this.searchIndex.size} keywords`);
    }

    _tokenize(text) {
        return text.toLowerCase()
            .split(/\s+/)
            .filter(t => t.length > 2);
    }

    _levenshtein(a, b) {
        const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(0));
        for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
        for (let j = 1; j <= b.length; j++) {
            for (let i = 1; i <= a.length; i++) {
                matrix[j][i] = b[j - 1] === a[i - 1] ? matrix[j - 1][i - 1] :
                    Math.min(matrix[j - 1][i - 1], matrix[j][i - 1], matrix[j - 1][i]) + 1;
            }
        }
        return matrix[b.length][a.length];
    }

    _fuzzyMatch(query, target, threshold = 0.7) {
        const distance = this._levenshtein(query.toLowerCase(), target.toLowerCase());
        const maxLen = Math.max(query.length, target.length);
        return 1 - (distance / maxLen) >= threshold;
    }

    _findAgentByIdentifier(identifier) {
        if (!identifier) return null;
        const lower = identifier.toLowerCase();
        return this.agentByEmail.get(lower) || this.agentByID.get(lower) || null;
    }

    _getLoginHistory(identifier) {
        if (!identifier) return [];
        return this.loginsByIdentifier.get(identifier.toLowerCase()) || [];
    }

    _extractIdentifiers(query) {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
        const agentIDRegex = /-?CHAGT\d+/gi;
        const loginIDRegex = /\b(?:ID|id)\s*(\d+)\b/gi;

        const emails = query.match(emailRegex) || [];
        const agentIDs = query.match(agentIDRegex) || [];
        
        const loginIDs = [];
        let match;
        while ((match = loginIDRegex.exec(query)) !== null) {
            loginIDs.push(match[1]);
        }

        return { emails, agentIDs, loginIDs };
    }

    /**
     * Normalize query for better matching
     * @param {string} query - Raw query
     * @returns {string} Normalized query
     */
    _normalizeQuery(query) {
        return query
            .replace(/pvt\.?\s*ltd\.?/gi, 'pvt ltd')
            .replace(/&/g, 'and')
            .replace(/\bco\b\.?/gi, 'company')
            .trim();
    }

    /**
     * Fuzzy company matching with Levenshtein similarity
     * @param {string} queryTerm - Company name from query
     * @returns {Array} Matching agents
     */
    _fuzzyCompanyMatch(queryTerm) {
        const term = queryTerm.toLowerCase();
        const matches = [];

        for (const [companyName, agents] of this.agentByCompany) {
            if (companyName.includes(term)) {
                matches.push(...agents);
            } else {
                const similarity = 1 - (this._levenshtein(term, companyName) / Math.max(term.length, companyName.length));
                if (similarity > 0.70) {
                    matches.push(...agents);
                }
            }
        }

        return matches;
    }

    /**
     * Search for agents with options
     * @param {string} query - Search query
     * @param {Object} options - Search options { limit, includeLogins }
     * @returns {Array} Search results
     */
    async search(query, options = {}) {
        if (!this.initialized) await this.init();
        
        const { limit = 5, includeLogins = true } = options;
        const normalizedQuery = this._normalizeQuery(query);
        const { emails, agentIDs, loginIDs } = this._extractIdentifiers(normalizedQuery);
        const results = [];
        const foundAgentIDs = new Set();

        // Check login IDs first
        if (loginIDs.length > 0 && this.loginsByID) {
            loginIDs.forEach(loginID => {
                const login = this.loginsByID.get(loginID);
                if (login) {
                    const agent = this._findAgentByIdentifier(login.AGENTID);
                    if (agent && !foundAgentIDs.has(agent.AgentID)) {
                        foundAgentIDs.add(agent.AgentID);
                        results.push({
                            id: agent.AgentID,
                            content: this._buildAgentContent(agent),
                            score: 100
                        });
                    } else {
                        const content = `Login Record (ID: ${login.ID}):
- Agent: ${login.AGENTID}
- Login Date: ${login.LOGINDATE}
`;
                        results.push({ id: `LOGIN_${login.ID}`, content, score: 100 });
                    }
                }
            });
        }

        // 1. Direct lookup (O(1))
        [...emails, ...agentIDs].forEach(identifier => {
            const agent = this._findAgentByIdentifier(identifier);
            if (agent && !foundAgentIDs.has(agent.AgentID)) {
                foundAgentIDs.add(agent.AgentID);
                results.push({
                    id: agent.AgentID,
                    content: this._buildAgentContent(agent),
                    score: 100
                });
            } else {
                // Check if it's a login-only record
                const logins = this._getLoginHistory(identifier);
                if (logins.length > 0) {
                    const sorted = logins.sort((a, b) => new Date(b.LOGINDATE) - new Date(a.LOGINDATE));
                    const content = `Login Information for ${identifier}:
- Last Login Date: ${sorted[0].LOGINDATE}
- Total Logins: ${logins.length}
- Note: No agent profile found in database
`;
                    results.push({ id: identifier, content, score: 100 });
                }
            }
        });

        // 2. Search by nationality (exact match)
        if (results.length === 0) {
            const queryLower = normalizedQuery.toLowerCase();
            if (queryLower.includes('nationality') || queryLower.includes('from') || queryLower.includes('country')) {
                for (const [nationality, agents] of this.agentByNationality) {
                    if (queryLower.includes(nationality)) {
                        agents.forEach(agent => {
                            if (!foundAgentIDs.has(agent.AgentID)) {
                                foundAgentIDs.add(agent.AgentID);
                                results.push({
                                    id: agent.AgentID,
                                    content: this._buildAgentContent(agent, includeLogins),
                                    score: 100
                                });
                            }
                        });
                    }
                }
            }
        }

        // 2.5. Fuzzy company search
        if (results.length === 0) {
            const queryLower = normalizedQuery.toLowerCase();
            if (queryLower.includes('company') || queryLower.includes('all agent') || queryLower.includes('list agent')) {
                const tokens = this._tokenize(normalizedQuery).filter(t => 
                    !['company', 'all', 'agent', 'agents', 'list', 'show', 'from', 'work', 'working'].includes(t)
                );
                if (tokens.length > 0) {
                    const companyMatches = this._fuzzyCompanyMatch(tokens.join(' '));
                    companyMatches.forEach(agent => {
                        if (!foundAgentIDs.has(agent.AgentID)) {
                            foundAgentIDs.add(agent.AgentID);
                            results.push({
                                id: agent.AgentID,
                                content: this._buildAgentContent(agent, includeLogins),
                                score: 95
                            });
                        }
                    });
                }
            }
        }

        // 3. Inverted index search
        if (results.length === 0) {
            const tokens = this._tokenize(normalizedQuery).filter(t =>
                !['what', 'is', 'the', 'of', 'for', 'tell', 'me', 'whose', 'with', 'ends', 'starts', 'agent', 'details', 'give', 'all', 'last', 'login', 'date', 'full'].includes(t)
            );

            // Try exact name match first
            const queryName = tokens.join(' ');
            for (const [name, agent] of this.agentByName) {
                const nameParts = name.split(' ');
                const queryParts = queryName.split(' ');
                
                // Exact full name match
                if (name === queryName) {
                    if (!foundAgentIDs.has(agent.AgentID)) {
                        foundAgentIDs.add(agent.AgentID);
                        results.push({
                            id: agent.AgentID,
                            content: this._buildAgentContent(agent, includeLogins),
                            score: 100
                        });
                    }
                }
                // Partial match (first + last name)
                else if (queryParts.length >= 2 && 
                         nameParts.some(p => p === queryParts[0]) && 
                         nameParts.some(p => p === queryParts[queryParts.length - 1])) {
                    if (!foundAgentIDs.has(agent.AgentID)) {
                        foundAgentIDs.add(agent.AgentID);
                        results.push({
                            id: agent.AgentID,
                            content: this._buildAgentContent(agent, includeLogins),
                            score: 95
                        });
                    }
                }
            }

            // Fuzzy name matching for typos
            if (results.length === 0 && tokens.length > 0) {
                const fuzzyMatches = [];
                for (const [name, agent] of this.agentByName) {
                    const nameParts = name.split(' ');
                    let matchScore = 0;
                    tokens.forEach(token => {
                        nameParts.forEach(part => {
                            if (this._fuzzyMatch(token, part, 0.75)) matchScore++;
                        });
                    });
                    if (matchScore >= tokens.length) {
                        fuzzyMatches.push({ agent, score: matchScore });
                    }
                }
                fuzzyMatches.sort((a, b) => b.score - a.score).slice(0, 5).forEach(match => {
                    if (!foundAgentIDs.has(match.agent.AgentID)) {
                        foundAgentIDs.add(match.agent.AgentID);
                        results.push({
                            id: match.agent.AgentID,
                            content: this._buildAgentContent(match.agent, includeLogins),
                            score: 90
                        });
                    }
                });
            }

            // Fallback to token matching
            if (results.length === 0) {
                const agentScores = new Map();
                tokens.forEach(token => {
                    const matchingIDs = this.searchIndex.get(token);
                    if (matchingIDs) {
                        matchingIDs.forEach(agentID => {
                            agentScores.set(agentID, (agentScores.get(agentID) || 0) + 1);
                        });
                    }
                });

                Array.from(agentScores.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .forEach(([agentID, score]) => {
                        const agent = this.agentByID.get(agentID.toLowerCase());
                        if (agent) {
                            results.push({
                                id: agentID,
                                content: this._buildAgentContent(agent, includeLogins),
                                score: score * 20
                            });
                        }
                    });
            }
        }

        return results.slice(0, limit);
    }

    /**
     * Build agent content with optional login history
     * @param {Object} agent - Agent data
     * @param {boolean} includeLogins - Whether to include login history
     * @returns {string} Formatted agent content
     */
    _buildAgentContent(agent, includeLogins = true) {
        let content = `AgentID: ${agent.AgentID || 'N/A'}
Name: ${agent.Name || 'N/A'}
Email: ${agent.UserName || 'N/A'}
Company: ${agent.Comp_Name || 'N/A'}
Nationality: ${agent.Nationality || 'N/A'}
Created: ${agent.CreatedDate || 'N/A'}`;

        if (includeLogins) {
            const logins = [...(this._getLoginHistory(agent.UserName) || []), ...(this._getLoginHistory(agent.AgentID) || [])];
            const uniqueLogins = Array.from(new Map(logins.map(l => [l.LOGINDATE, l])).values());
            
            if (uniqueLogins.length > 0) {
                const sorted = uniqueLogins.sort((a, b) => new Date(b.LOGINDATE) - new Date(a.LOGINDATE));
                content += `\nLast Login: ${sorted[0].LOGINDATE}`;
                content += `\nTotal Logins: ${uniqueLogins.length}`;
                if (sorted.length > 1) {
                    content += `\nLogin History: ${sorted.slice(0, 5).map(l => l.LOGINDATE).join(', ')}`;
                }
            } else if (agent.LastLogin) {
                content += `\nLast Login: ${agent.LastLogin}`;
            }
        }

        return content;
    }
}

module.exports = new VectorService();
