import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import searchEnhancer from './searchEnhancer.js';
import cacheService from './cacheService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DataService {
  constructor() {
    this.agentData = [];
    this.loginData = [];
    this._cachedMostActive = null;
    this._cachedLeastActive = null;
    this.loadData();
    this.precomputeAnalytics();
  }

  loadData() {
    try {
      const agentPath = path.join(__dirname, '../data/agentData.json');
      const loginPath = path.join(__dirname, '../data/agentLogin.json');
      
      if (fs.existsSync(agentPath)) {
        this.agentData = JSON.parse(fs.readFileSync(agentPath, 'utf-8'));
      }
      
      if (fs.existsSync(loginPath)) {
        this.loginData = JSON.parse(fs.readFileSync(loginPath, 'utf-8'));
      }
      
      console.log(`[DataService] Loaded ${this.agentData.length} agents and ${this.loginData.length} login records`);
    } catch (error) {
      console.error('[DataService] Error loading data:', error.message);
    }
  }

  // MongoDB-ready methods - easy to replace with DB queries
  
  async findAgentById(agentId) {
    const normalizedId = agentId.toUpperCase().trim();
    return this.agentData.find(agent => 
      agent.AgentID && agent.AgentID.toUpperCase() === normalizedId
    );
  }

  async findAgentByEmail(email) {
    const normalizedEmail = email.toLowerCase().trim().replace('mailto:', '');
    return this.agentData.find(agent => 
      agent.UserName && agent.UserName.toLowerCase().replace('mailto:', '') === normalizedEmail
    );
  }

  async findAgentsByCompany(company) {
    const normalizedCompany = company.toLowerCase().trim();
    return this.agentData.filter(agent => 
      agent.Comp_Name && (
        agent.Comp_Name.toLowerCase().includes(normalizedCompany) ||
        searchEnhancer.matchCompany(company, agent.Comp_Name)
      )
    );
  }

  async findAgentsByName(name) {
    const normalizedName = name.toLowerCase().trim();
    return this.agentData.filter(agent => 
      agent.Name && agent.Name.toLowerCase().includes(normalizedName)
    );
  }

  async getAgentLastLogin(agentId) {
    const agent = await this.findAgentById(agentId) || await this.findAgentByEmail(agentId);
    if (!agent) return null;
    
    const loginRecords = this.loginData.filter(login => {
      const resolvedAgent = searchEnhancer.resolveLoginAgent(login.AGENTID, [agent]);
      return resolvedAgent?.AgentID === agent.AgentID;
    });
    
    if (loginRecords.length === 0) return null;
    loginRecords.sort((a, b) => new Date(b.LOGINDATE) - new Date(a.LOGINDATE));
    return loginRecords[0];
  }

  async getAgentNationality(agentId) {
    const agent = await this.findAgentById(agentId);
    return agent ? agent.Nationality : null;
  }

  // Advanced query methods
  async getAgentLoginCount(agentId) {
    const normalizedId = agentId.toUpperCase().trim();
    const loginRecords = this.loginData.filter(login => 
      login.AGENTID && login.AGENTID.toUpperCase().includes(normalizedId)
    );
    return loginRecords.length;
  }

  async getAgentLoginHistory(agentId) {
    const normalizedId = agentId.toUpperCase().trim();
    const loginRecords = this.loginData.filter(login => 
      login.AGENTID && login.AGENTID.toUpperCase().includes(normalizedId)
    );
    loginRecords.sort((a, b) => new Date(b.LOGINDATE) - new Date(a.LOGINDATE));
    return loginRecords;
  }

  async getAgentFirstLogin(agentId) {
    const loginRecords = await this.getAgentLoginHistory(agentId);
    return loginRecords.length > 0 ? loginRecords[loginRecords.length - 1] : null;
  }

  async getLoginById(loginId) {
    return this.loginData.find(login => login.ID === parseInt(loginId));
  }

  async getAgentsByNationality(nationality) {
    const normalizedNationality = searchEnhancer.normalizeNationality(nationality);
    return this.agentData.filter(agent => 
      agent.Nationality && (
        agent.Nationality.toLowerCase().includes(normalizedNationality) ||
        agent.Nationality.toLowerCase() === normalizedNationality
      )
    );
  }

  async getAgentFullProfile(agentId) {
    const agent = await this.findAgentById(agentId);
    if (!agent) return null;
    
    const loginHistory = await this.getAgentLoginHistory(agentId);
    const loginCount = loginHistory.length;
    const lastLogin = loginHistory.length > 0 ? loginHistory[0] : null;
    const firstLogin = loginHistory.length > 0 ? loginHistory[loginHistory.length - 1] : null;
    
    return {
      ...agent,
      loginCount,
      lastLogin: lastLogin ? lastLogin.LOGINDATE : null,
      firstLogin: firstLogin ? firstLogin.LOGINDATE : null,
      loginHistory: loginHistory.slice(0, 10) // Last 10 logins
    };
  }

  async getLoginsInDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return this.loginData.filter(login => {
      const loginDate = new Date(login.LOGINDATE);
      return loginDate >= start && loginDate <= end;
    });
  }

  async getLoginsThisMonth() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return this.getLoginsInDateRange(startOfMonth, endOfMonth);
  }

  async getMostActiveAgent() {
    if (this._cachedMostActive) return this._cachedMostActive;
    
    return cacheService.getAnalytics(async () => {
      const loginCounts = {};
      
      this.loginData.forEach(login => {
        const agentId = login.AGENTID;
        if (agentId) {
          loginCounts[agentId] = (loginCounts[agentId] || 0) + 1;
        }
      });
      
      let maxLogins = 0;
      let mostActiveAgentId = null;
      
      for (const [agentId, count] of Object.entries(loginCounts)) {
        if (count > maxLogins) {
          maxLogins = count;
          mostActiveAgentId = agentId;
        }
      }
      
      if (!mostActiveAgentId) return null;
      
      const agent = await this.findAgentByEmail(mostActiveAgentId) || 
                    await this.findAgentById(mostActiveAgentId);
      
      const result = { agent, loginCount: maxLogins };
      this._cachedMostActive = result;
      return result;
    });
  }

  async getAgentsWithNoLogins() {
    const loggedInAgentIds = new Set(
      this.loginData.map(login => login.AGENTID?.toUpperCase())
    );
    
    return this.agentData.filter(agent => 
      !loggedInAgentIds.has(agent.AgentID?.toUpperCase()) &&
      !loggedInAgentIds.has(agent.UserName?.toUpperCase())
    );
  }

  async getTotalAgentCount() {
    return this.agentData.length;
  }

  async getTopAgentsByLoginCount(limit = 5) {
    const loginCounts = {};
    
    this.loginData.forEach(login => {
      const agentId = login.AGENTID;
      if (agentId) {
        loginCounts[agentId] = (loginCounts[agentId] || 0) + 1;
      }
    });
    
    const sorted = Object.entries(loginCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
    
    const results = [];
    for (const [agentId, count] of sorted) {
      const agent = await this.findAgentByEmail(agentId) || 
                    await this.findAgentById(agentId);
      results.push({ agent, loginCount: count });
    }
    
    return results;
  }

  async getLeastActiveAgent() {
    const loginCounts = {};
    
    this.loginData.forEach(login => {
      const agentId = login.AGENTID;
      if (agentId) {
        loginCounts[agentId] = (loginCounts[agentId] || 0) + 1;
      }
    });
    
    let minLogins = Infinity;
    let leastActiveAgentId = null;
    
    for (const [agentId, count] of Object.entries(loginCounts)) {
      if (count < minLogins) {
        minLogins = count;
        leastActiveAgentId = agentId;
      }
    }
    
    if (!leastActiveAgentId) return null;
    
    const agent = await this.findAgentByEmail(leastActiveAgentId) || 
                  await this.findAgentById(leastActiveAgentId);
    
    return {
      agent,
      loginCount: minLogins
    };
  }

  async getAgentLoginCountByIdentifier(identifier) {
    // Try to find agent by email, name, or ID
    let agent = await this.findAgentByEmail(identifier);
    if (!agent) agent = await this.findAgentById(identifier);
    if (!agent) {
      const agents = await this.findAgentsByName(identifier);
      if (agents.length > 0) agent = agents[0];
    }
    
    if (!agent) return null;
    
    // Count logins by both AgentID and UserName
    const loginCount = this.loginData.filter(login => {
      const loginId = login.AGENTID?.toLowerCase().replace('mailto:', '');
      const agentEmail = agent.UserName?.toLowerCase().replace('mailto:', '');
      const agentId = agent.AgentID?.toLowerCase();
      return loginId === agentEmail || loginId === agentId;
    }).length;
    
    return { agent, loginCount };
  }

  async getAgentLoginHistoryByIdentifier(identifier) {
    let agent = await this.findAgentByEmail(identifier);
    if (!agent) agent = await this.findAgentById(identifier);
    if (!agent) {
      const agents = await this.findAgentsByName(identifier);
      if (agents.length > 0) agent = agents[0];
    }
    
    if (!agent) return null;
    
    const loginRecords = this.loginData.filter(login => {
      const loginId = login.AGENTID?.toLowerCase().replace('mailto:', '');
      const agentEmail = agent.UserName?.toLowerCase().replace('mailto:', '');
      const agentId = agent.AgentID?.toLowerCase();
      return loginId === agentEmail || loginId === agentId;
    });
    
    loginRecords.sort((a, b) => new Date(b.LOGINDATE) - new Date(a.LOGINDATE));
    return { agent, loginHistory: loginRecords };
  }

  async getAgentFirstLoginByIdentifier(identifier) {
    const result = await this.getAgentLoginHistoryByIdentifier(identifier);
    if (!result || result.loginHistory.length === 0) return null;
    
    return {
      agent: result.agent,
      firstLogin: result.loginHistory[result.loginHistory.length - 1]
    };
  }

  async getAgentLastLoginByIdentifier(identifier) {
    const result = await this.getAgentLoginHistoryByIdentifier(identifier);
    if (!result || result.loginHistory.length === 0) return null;
    
    return {
      agent: result.agent,
      lastLogin: result.loginHistory[0]
    };
  }

  async getCompanyAgentCount(company) {
    const agents = await this.findAgentsByCompany(company);
    return agents.length;
  }

  async getNationalityAgentCount(nationality) {
    const agents = await this.getAgentsByNationality(nationality);
    return agents.length;
  }

  async getAllNationalities() {
    const nationalities = new Set();
    this.agentData.forEach(agent => {
      if (agent.Nationality) {
        nationalities.add(agent.Nationality);
      }
    });
    return Array.from(nationalities).sort();
  }

  async getAllCompanies() {
    const companies = new Set();
    this.agentData.forEach(agent => {
      if (agent.Comp_Name) {
        companies.add(agent.Comp_Name);
      }
    });
    return Array.from(companies).sort();
  }

  async getLoginStatistics() {
    const totalLogins = this.loginData.length;
    const uniqueAgents = new Set(this.loginData.map(l => l.AGENTID)).size;
    const avgLoginsPerAgent = totalLogins / uniqueAgents;
    
    return {
      totalLogins,
      uniqueAgents,
      avgLoginsPerAgent: Math.round(avgLoginsPerAgent * 100) / 100
    };
  }

  async precomputeAnalytics() {
    console.log('🔄 Precomputing analytics...');
    this._cachedMostActive = null;
    this._cachedLeastActive = null;
    await this.getMostActiveAgent();
    await this.getLeastActiveAgent();
    console.log('✅ Analytics precomputed');
  }
}


// Singleton instance
export default new DataService();
