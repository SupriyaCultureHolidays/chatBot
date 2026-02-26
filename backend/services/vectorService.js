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

            this.agentData = await databaseService.getAllAgents();
            this.agentLoginData = await databaseService.getAllLogins();

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
        this.agentByCompany = new Map();
        this.agentByNationality = new Map();
        this.loginsByIdentifier = new Map();
        this.loginsByID = new Map();
        this.searchIndex = new Map();
        this.emailToAgentID = new Map();
        this.agentIDToEmail = new Map();

        this.agentData.forEach(agent => {
            const cleanEmail = (agent.UserName || '').toLowerCase().trim();
            const cleanAgentID = (agent.AgentID || '').toLowerCase().trim();
            const cleanName = (agent.Name || '').toLowerCase().trim();

            if (cleanEmail) {
                this.agentByEmail.set(cleanEmail, agent);
                if (cleanAgentID) this.emailToAgentID.set(cleanEmail, cleanAgentID);
            }
            if (cleanAgentID) {
                this.agentByID.set(cleanAgentID, agent);
                if (cleanEmail) this.agentIDToEmail.set(cleanAgentID, cleanEmail);
            }
            if (cleanName) {
                if (!this.agentByName.has(cleanName)) this.agentByName.set(cleanName, []);
                this.agentByName.get(cleanName).push(agent);
            }
            if (agent.Comp_Name) {
                const compKey = agent.Comp_Name.toLowerCase().trim();
                if (!this.agentByCompany.has(compKey)) this.agentByCompany.set(compKey, []);
                this.agentByCompany.get(compKey).push(agent);
            }
            if (agent.Nationality) {
                const natKey = agent.Nationality.toLowerCase().trim();
                if (!this.agentByNationality.has(natKey)) this.agentByNationality.set(natKey, []);
                this.agentByNationality.get(natKey).push(agent);
            }

            const tokens = this._tokenize(`${agent.Name} ${agent.UserName} ${agent.AgentID} ${agent.Comp_Name}`);
            tokens.forEach(token => {
                if (!this.searchIndex.has(token)) this.searchIndex.set(token, new Set());
                this.searchIndex.get(token).add(cleanAgentID || cleanEmail);
            });
        });

        this.agentLoginData.forEach(login => { 
            if (!login.AGENTID) return;
            const key = login.AGENTID.toLowerCase().trim();
            
            if (!this.loginsByIdentifier.has(key)) this.loginsByIdentifier.set(key, []); 
            this.loginsByIdentifier.get(key).push(login);
            
            if (key.includes('@')) {
                const agentID = this.emailToAgentID.get(key);
                if (agentID) {
                    if (!this.loginsByIdentifier.has(agentID)) this.loginsByIdentifier.set(agentID, []);
                    this.loginsByIdentifier.get(agentID).push(login);
                }
            } else {
                const email = this.agentIDToEmail.get(key);
                if (email) {
                    if (!this.loginsByIdentifier.has(email)) this.loginsByIdentifier.set(email, []);
                    this.loginsByIdentifier.get(email).push(login);
                }
            }
            
            if (login.ID) this.loginsByID.set(String(login.ID), login);
        });

        logger.info('Indexes built', {
            agents: this.agentByEmail.size,
            companies: this.agentByCompany.size,
            nationalities: this.agentByNationality.size,
            logins: this.agentLoginData.length
        });
    }

    _tokenize(text) {
        return text.toLowerCase().split(/\s+/).filter(t => t.length > 0);
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
        const clean = identifier.toLowerCase().trim();
        
        let agent = this.agentByEmail.get(clean) || this.agentByID.get(clean);
        if (agent) return agent;
        
        if (clean.includes('@')) {
            const agentID = this.emailToAgentID.get(clean);
            if (agentID) return this.agentByID.get(agentID);
        } else {
            const email = this.agentIDToEmail.get(clean);
            if (email) return this.agentByEmail.get(email);
        }
        
        return null;
    }

    _getLoginHistory(identifier) {
        if (!identifier) return [];
        const clean = identifier.toLowerCase().trim();
        const logins = this.loginsByIdentifier.get(clean) || [];
        return Array.from(new Map(logins.map(l => [l.ID, l])).values());
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

    _normalizeQuery(query) {
        return query
            .replace(/pvt\.?\s*ltd\.?/gi, 'pvt ltd')
            .replace(/&/g, 'and')
            .replace(/\bco\b\.?/gi, 'company')
            .trim();
    }

    _fuzzyCompanyMatch(queryTerm) {
        const term = queryTerm.toLowerCase().trim();
        const matches = [];
        const scored = [];

        for (const [companyName, agents] of this.agentByCompany) {
            let score = 0;
            
            if (companyName === term) {
                score = 100;
            } else if (companyName.includes(term) || term.includes(companyName)) {
                score = 90;
            } else {
                const compWords = companyName.split(/\s+/);
                const termWords = term.split(/\s+/);
                let wordMatches = 0;
                
                termWords.forEach(tw => {
                    compWords.forEach(cw => {
                        if (cw === tw) wordMatches += 2;
                        else if (cw.includes(tw) || tw.includes(cw)) wordMatches += 1;
                        else if (this._fuzzyMatch(tw, cw, 0.75)) wordMatches += 0.5;
                    });
                });
                
                if (wordMatches > 0) score = Math.min(85, wordMatches * 20);
            }
            
            if (score === 0) {
                const similarity = 1 - (this._levenshtein(term, companyName) / Math.max(term.length, companyName.length));
                if (similarity > 0.65) score = similarity * 80;
            }
            
            if (score > 0) scored.push({ agents, score, name: companyName });
        }

        scored.sort((a, b) => b.score - a.score);
        scored.forEach(s => matches.push(...s.agents));
        
        return matches;
    }

    async search(query, options = {}) {
        if (!this.initialized) await this.init();
        
        const { limit = 5, includeLogins = true } = options;
        const normalizedQuery = this._normalizeQuery(query);
        const { emails, agentIDs, loginIDs } = this._extractIdentifiers(normalizedQuery);
        const results = [];
        const foundAgentIDs = new Set();

        logger.info('Search initiated', { query, normalizedQuery, emails, agentIDs, loginIDs });

        if (loginIDs.length > 0 && this.loginsByID) {
            loginIDs.forEach(loginID => {
                const login = this.loginsByID.get(loginID);
                if (login) {
                    const agent = this._findAgentByIdentifier(login.AGENTID);
                    if (agent && !foundAgentIDs.has(agent.AgentID)) {
                        foundAgentIDs.add(agent.AgentID);
                        results.push({ id: agent.AgentID, content: this._buildAgentContent(agent), score: 100 });
                    } else {
                        const content = `Login Record (ID: ${login.ID}):\n- Agent: ${login.AGENTID}\n- Login Date: ${login.LOGINDATE}\n`;
                        results.push({ id: `LOGIN_${login.ID}`, content, score: 100 });
                    }
                }
            });
        }

        [...emails, ...agentIDs].forEach(identifier => {
            const agent = this._findAgentByIdentifier(identifier);
            if (agent && !foundAgentIDs.has(agent.AgentID)) {
                foundAgentIDs.add(agent.AgentID);
                results.push({ id: agent.AgentID, content: this._buildAgentContent(agent), score: 100 });
            } else {
                const logins = this._getLoginHistory(identifier);
                if (logins.length > 0) {
                    const sorted = logins.sort((a, b) => new Date(b.LOGINDATE) - new Date(a.LOGINDATE));
                    const content = `Login Information for ${identifier}:\n- Last Login Date: ${sorted[0].LOGINDATE}\n- Total Logins: ${logins.length}\n- Note: No agent profile found in database\n`;
                    results.push({ id: identifier, content, score: 100 });
                }
            }
        });

        if (results.length === 0) {
            const queryLower = normalizedQuery.toLowerCase();
            if (queryLower.includes('nationality') || queryLower.includes('from') || queryLower.includes('country')) {
                for (const [nationality, agents] of this.agentByNationality) {
                    if (queryLower.includes(nationality)) {
                        agents.forEach(agent => {
                            if (!foundAgentIDs.has(agent.AgentID)) {
                                foundAgentIDs.add(agent.AgentID);
                                results.push({ id: agent.AgentID, content: this._buildAgentContent(agent, includeLogins), score: 100 });
                            }
                        });
                    }
                }
            }
        }

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
                            results.push({ id: agent.AgentID, content: this._buildAgentContent(agent, includeLogins), score: 95 });
                        }
                    });
                }
            }
        }

        if (results.length === 0) {
            const tokens = this._tokenize(normalizedQuery).filter(t =>
                !['what', 'is', 'the', 'of', 'for', 'tell', 'me', 'whose', 'with', 'ends', 'starts', 'agent', 'details', 'give', 'all', 'last', 'login', 'date', 'full', 'find', 'search', 'show', 'get'].includes(t)
            );

            const queryName = tokens.join(' ');
            for (const [name, agents] of this.agentByName) {
                const agentList = Array.isArray(agents) ? agents : [agents];
                
                agentList.forEach(agent => {
                    const nameParts = name.split(/\s+/);
                    const queryParts = queryName.split(/\s+/);
                    let matchScore = 0;
                    
                    if (name === queryName) {
                        matchScore = 100;
                    } else if (queryParts.length >= 2) {
                        const firstMatch = nameParts.some(p => p === queryParts[0]);
                        const lastMatch = nameParts.some(p => p === queryParts[queryParts.length - 1]);
                        
                        if (firstMatch && lastMatch) matchScore = 95;
                        else if (firstMatch || lastMatch) matchScore = 85;
                    } else if (name.includes(queryName)) {
                        matchScore = 90;
                    } else if (queryName.includes(name)) {
                        matchScore = 88;
                    }
                    
                    if (matchScore > 0 && !foundAgentIDs.has(agent.AgentID)) {
                        foundAgentIDs.add(agent.AgentID);
                        results.push({ id: agent.AgentID, content: this._buildAgentContent(agent, includeLogins), score: matchScore });
                    }
                });
            }

            if (results.length === 0 && tokens.length > 0) {
                const fuzzyMatches = [];
                for (const [name, agents] of this.agentByName) {
                    const agentList = Array.isArray(agents) ? agents : [agents];
                    const nameParts = name.split(/\s+/);
                    let matchScore = 0;
                    let totalPossible = 0;
                    
                    tokens.forEach(token => {
                        if (token.length < 2) return;
                        totalPossible++;
                        
                        nameParts.forEach(part => {
                            if (part === token) matchScore += 2;
                            else if (part.startsWith(token) || token.startsWith(part)) matchScore += 1.5;
                            else if (this._fuzzyMatch(token, part, 0.70)) matchScore += 1;
                        });
                    });
                    
                    if (totalPossible > 0 && matchScore >= totalPossible * 0.5) {
                        agentList.forEach(agent => fuzzyMatches.push({ agent, score: matchScore }));
                    }
                }
                fuzzyMatches.sort((a, b) => b.score - a.score).slice(0, 10).forEach(match => {
                    if (!foundAgentIDs.has(match.agent.AgentID)) {
                        foundAgentIDs.add(match.agent.AgentID);
                        results.push({ id: match.agent.AgentID, content: this._buildAgentContent(match.agent, includeLogins), score: 80 });
                    }
                });
            }

            if (results.length === 0) {
                const agentScores = new Map();
                tokens.forEach(token => {
                    const matchingIDs = this.searchIndex.get(token);
                    if (matchingIDs) {
                        matchingIDs.forEach(identifier => {
                            agentScores.set(identifier, (agentScores.get(identifier) || 0) + 1);
                        });
                    }
                });

                Array.from(agentScores.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .forEach(([identifier, score]) => {
                        const agent = this._findAgentByIdentifier(identifier);
                        if (agent && !foundAgentIDs.has(agent.AgentID)) {
                            foundAgentIDs.add(agent.AgentID);
                            results.push({ id: agent.AgentID, content: this._buildAgentContent(agent, includeLogins), score: score * 15 });
                        }
                    });
            }
        }

        logger.info('Search completed', { resultsFound: results.length, foundAgents: Array.from(foundAgentIDs) });
        return results.slice(0, limit);
    }

    _buildAgentContent(agent, includeLogins = true) {
        let content = `AgentID: ${agent.AgentID || 'N/A'}\nName: ${agent.Name || 'N/A'}\nEmail: ${agent.UserName || 'N/A'}\nCompany: ${agent.Comp_Name || 'N/A'}\nNationality: ${agent.Nationality || 'N/A'}\nCreated: ${agent.CreatedDate || 'N/A'}`;

        if (includeLogins) {
            const loginsByEmail = this._getLoginHistory(agent.UserName);
            const loginsByID = this._getLoginHistory(agent.AgentID);
            const allLogins = [...loginsByEmail, ...loginsByID];
            const uniqueLogins = Array.from(new Map(allLogins.map(l => [`${l.ID}_${l.LOGINDATE}`, l])).values());
            
            if (uniqueLogins.length > 0) {
                const sorted = uniqueLogins.sort((a, b) => new Date(b.LOGINDATE) - new Date(a.LOGINDATE));
                content += `\nLast Login: ${sorted[0].LOGINDATE}`;
                content += `\nTotal Logins: ${uniqueLogins.length}`;
                if (sorted.length > 1) {
                    content += `\nFirst Login: ${sorted[sorted.length - 1].LOGINDATE}`;
                    content += `\nRecent Login History: ${sorted.slice(0, 5).map(l => l.LOGINDATE).join(', ')}`;
                }
            } else if (agent.LastLogin) {
                content += `\nLast Login: ${agent.LastLogin}`;
            }
        }

        return content;
    }

    async getAnalytics(type, limit = 10) {
        if (!this.initialized) await this.init();
        
        const results = [];
        
        if (type === 'MOST_ACTIVE') {
            const loginCounts = new Map();
            for (const [identifier, logins] of this.loginsByIdentifier) {
                const agent = this._findAgentByIdentifier(identifier);
                if (agent) {
                    const currentCount = loginCounts.get(agent.AgentID) || 0;
                    loginCounts.set(agent.AgentID, currentCount + logins.length);
                }
            }
            
            Array.from(loginCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, limit)
                .forEach(([agentID, count]) => {
                    const agent = this.agentByID.get(agentID.toLowerCase());
                    if (agent) {
                        results.push({ agent, loginCount: count, content: this._buildAgentContent(agent, true) });
                    }
                });
        } else if (type === 'LEAST_ACTIVE') {
            this.agentData.forEach(agent => {
                const logins = this._getLoginHistory(agent.UserName);
                results.push({ agent, loginCount: logins.length, content: this._buildAgentContent(agent, true) });
            });
            results.sort((a, b) => a.loginCount - b.loginCount);
            results.splice(limit);
        }
        
        return results;
    }

    async searchByNationality(query) {
        if (!this.initialized) await this.init();
        
        const queryLower = query.toLowerCase();
        const results = [];
        
        for (const [nationality, agents] of this.agentByNationality) {
            if (queryLower.includes(nationality)) {
                results.push(...agents);
            }
        }
        
        return results;
    }
}

module.exports = new VectorService();
