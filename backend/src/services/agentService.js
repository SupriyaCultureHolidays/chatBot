import dataService from './dataService.js';

class AgentService {
  formatAgentDetails(agent) {
    if (!agent) return null;
    
    return `📋 Agent Details:\n` +
           `• Name: ${agent.Name || 'N/A'}\n` +
           `• Agent ID: ${agent.AgentID || 'N/A'}\n` +
           `• Email: ${agent.UserName || 'N/A'}\n` +
           `• Company: ${agent.Comp_Name || 'N/A'}\n` +
           `• Nationality: ${agent.Nationality || 'N/A'}\n` +
           `• Established: ${agent.Date_establishment || 'N/A'}\n` +
           `• Created: ${agent.CreatedDate || 'N/A'}\n` +
           `• Last Login: ${agent.LastLogin || 'N/A'}`;
  }

  formatMultipleAgents(agents) {
    if (!agents || agents.length === 0) return null;
    
    let message = `Found ${agents.length} agent(s):\n\n`;
    
    agents.forEach((agent, index) => {
      message += `${index + 1}. ${agent.Name || 'Unknown'} (${agent.AgentID || 'N/A'})\n`;
      message += `   📧 ${agent.UserName || 'N/A'}\n`;
      message += `   🏢 ${agent.Comp_Name || 'N/A'}\n`;
      if (index < agents.length - 1) message += '\n';
    });
    
    return message;
  }

  async getAgentById(agentId) {
    const agent = await dataService.findAgentById(agentId);
    
    if (!agent) {
      return {
        success: false,
        message: `❌ Agent with ID "${agentId}" not found. Please check the ID and try again.`
      };
    }
    
    return {
      success: true,
      message: this.formatAgentDetails(agent),
      data: agent
    };
  }

  async getAgentByEmail(email) {
    const agent = await dataService.findAgentByEmail(email);
    
    if (!agent) {
      return {
        success: false,
        message: `❌ Agent with email "${email}" not found. Please verify the email address.`
      };
    }
    
    return {
      success: true,
      message: this.formatAgentDetails(agent),
      data: agent
    };
  }

  async getAgentsByCompany(company) {
    const agents = await dataService.findAgentsByCompany(company);
    
    if (!agents || agents.length === 0) {
      return {
        success: false,
        message: `❌ No agents found for company "${company}". Please check the company name.`
      };
    }
    
    return {
      success: true,
      message: this.formatMultipleAgents(agents),
      data: agents
    };
  }

  async getAgentsByName(name) {
    const agents = await dataService.findAgentsByName(name);
    
    if (!agents || agents.length === 0) {
      return {
        success: false,
        message: `❌ No agents found with name "${name}". Please try a different name.`
      };
    }
    
    return {
      success: true,
      message: this.formatMultipleAgents(agents),
      data: agents
    };
  }

  async getAgentLastLogin(agentId) {
    const loginRecord = await dataService.getAgentLastLogin(agentId);
    
    if (!loginRecord) {
      return {
        success: false,
        message: `❌ No login records found for agent "${agentId}".`
      };
    }
    
    const agent = await dataService.findAgentById(agentId);
    const agentName = agent ? agent.Name : 'Unknown';
    
    return {
      success: true,
      message: `🕐 Last Login Information:\n` +
               `• Agent: ${agentName} (${agentId})\n` +
               `• Last Login: ${loginRecord.LOGINDATE || 'N/A'}`,
      data: loginRecord
    };
  }

  async getAgentNationality(agentId) {
    // Try to find by ID first, then by email, then by name
    let agent = await dataService.findAgentById(agentId);
    if (!agent) agent = await dataService.findAgentByEmail(agentId);
    if (!agent) {
      const agents = await dataService.findAgentsByName(agentId);
      agent = agents && agents.length > 0 ? agents[0] : null;
    }
    
    if (!agent || !agent.Nationality) {
      return {
        success: false,
        message: `❌ Nationality information not found for "${agentId}".`
      };
    }
    
    return {
      success: true,
      message: `🌍 Nationality Information:\n` +
               `• Agent: ${agent.Name} (${agent.AgentID})\n` +
               `• Nationality: ${agent.Nationality}`,
      data: { nationality: agent.Nationality }
    };
  }

  async getAgentLoginCount(agentId) {
    const result = await dataService.getAgentLoginCountByIdentifier(agentId);
    
    if (!result) {
      return {
        success: false,
        message: `❌ Agent "${agentId}" not found.`
      };
    }
    
    return {
      success: true,
      message: `📊 Login Count:\n` +
               `• Agent: ${result.agent.Name}\n` +
               `• Total Logins: ${result.loginCount}`,
      data: result
    };
  }

  async getAgentLoginHistory(agentId) {
    const result = await dataService.getAgentLoginHistoryByIdentifier(agentId);
    
    if (!result || !result.loginHistory || result.loginHistory.length === 0) {
      return {
        success: false,
        message: `❌ No login history found for "${agentId}".`
      };
    }
    
    let message = `📜 Login History for ${result.agent.Name}:\n`;
    message += `Total Logins: ${result.loginHistory.length}\n\n`;
    
    const recentLogins = result.loginHistory.slice(0, 10);
    recentLogins.forEach((login, index) => {
      message += `${index + 1}. ${login.LOGINDATE} (ID: ${login.ID})\n`;
    });
    
    if (result.loginHistory.length > 10) {
      message += `\n... and ${result.loginHistory.length - 10} more logins`;
    }
    
    return {
      success: true,
      message,
      data: result.loginHistory
    };
  }

  async getAgentFirstLogin(agentId) {
    const result = await dataService.getAgentFirstLoginByIdentifier(agentId);
    
    if (!result) {
      return {
        success: false,
        message: `❌ No login records found for "${agentId}".`
      };
    }
    
    return {
      success: true,
      message: `🕐 First Login Information:\n` +
               `• Agent: ${result.agent.Name}\n` +
               `• First Login: ${result.firstLogin.LOGINDATE}\n` +
               `• Login ID: ${result.firstLogin.ID}`,
      data: result.firstLogin
    };
  }

  async getLoginById(loginId) {
    const login = await dataService.getLoginById(loginId);
    
    if (!login) {
      return {
        success: false,
        message: `❌ Login record with ID "${loginId}" not found.`
      };
    }
    
    return {
      success: true,
      message: `🔍 Login Record #${loginId}:\n` +
               `• Agent ID: ${login.AGENTID}\n` +
               `• Login Date: ${login.LOGINDATE}`,
      data: login
    };
  }

  async getAgentsByNationality(nationality) {
    const agents = await dataService.getAgentsByNationality(nationality);
    
    if (!agents || agents.length === 0) {
      return {
        success: false,
        message: `❌ No agents found with nationality "${nationality}".`
      };
    }
    
    return {
      success: true,
      message: this.formatMultipleAgents(agents),
      data: agents
    };
  }

  async getAgentFullProfile(agentId) {
    let agent = await dataService.findAgentById(agentId);
    if (!agent) agent = await dataService.findAgentByEmail(agentId);
    if (!agent) {
      const agents = await dataService.findAgentsByName(agentId);
      agent = agents && agents.length > 0 ? agents[0] : null;
    }
    
    if (!agent) {
      return {
        success: false,
        message: `❌ Agent "${agentId}" not found.`
      };
    }
    
    const profile = await dataService.getAgentFullProfile(agent.AgentID);
    
    let message = `👤 Full Profile:\n\n`;
    message += `📋 Basic Information:\n`;
    message += `• Name: ${profile.Name}\n`;
    message += `• Agent ID: ${profile.AgentID}\n`;
    message += `• Email: ${profile.UserName}\n`;
    message += `• Company: ${profile.Comp_Name}\n`;
    message += `• Nationality: ${profile.Nationality}\n`;
    message += `• Established: ${profile.Date_establishment}\n\n`;
    
    message += `📊 Login Statistics:\n`;
    message += `• Total Logins: ${profile.loginCount}\n`;
    message += `• First Login: ${profile.firstLogin || 'N/A'}\n`;
    message += `• Last Login: ${profile.lastLogin || 'N/A'}`;
    
    return {
      success: true,
      message,
      data: profile
    };
  }

  async getLoginsInDateRange(startDate, endDate) {
    const logins = await dataService.getLoginsInDateRange(startDate, endDate);
    
    if (!logins || logins.length === 0) {
      return {
        success: false,
        message: `❌ No logins found between ${startDate} and ${endDate}.`
      };
    }
    
    const uniqueAgents = new Set(logins.map(l => l.AGENTID));
    
    return {
      success: true,
      message: `📅 Logins between ${startDate} and ${endDate}:\n` +
               `• Total Logins: ${logins.length}\n` +
               `• Unique Agents: ${uniqueAgents.size}`,
      data: logins
    };
  }

  async getLoginsThisMonth() {
    const logins = await dataService.getLoginsThisMonth();
    
    if (!logins || logins.length === 0) {
      return {
        success: false,
        message: `❌ No logins found this month.`
      };
    }
    
    const uniqueAgents = new Set(logins.map(l => l.AGENTID));
    
    return {
      success: true,
      message: `📅 Logins This Month:\n` +
               `• Total Logins: ${logins.length}\n` +
               `• Unique Agents: ${uniqueAgents.size}`,
      data: logins
    };
  }

  async getMostActiveAgent() {
    const result = await dataService.getMostActiveAgent();
    
    if (!result || !result.agent) {
      return {
        success: false,
        message: `❌ No login data available.`
      };
    }
    
    return {
      success: true,
      message: `🏆 Most Active Agent:\n` +
               `• Name: ${result.agent.Name || 'Unknown'}\n` +
               `• Agent ID: ${result.agent.AgentID || 'N/A'}\n` +
               `• Total Logins: ${result.loginCount}`,
      data: result
    };
  }

  async getLeastActiveAgent() {
    const topAgents = await dataService.getTopAgentsByLoginCount(1000);
    
    if (!topAgents || topAgents.length === 0) {
      return {
        success: false,
        message: `❌ No login data available.`
      };
    }
    
    const leastActive = topAgents[topAgents.length - 1];
    
    return {
      success: true,
      message: `📉 Least Active Agent (with logins):\n` +
               `• Name: ${leastActive.agent?.Name || 'Unknown'}\n` +
               `• Agent ID: ${leastActive.agent?.AgentID || 'N/A'}\n` +
               `• Total Logins: ${leastActive.loginCount}`,
      data: leastActive
    };
  }

  async getAgentsWithNoLogins() {
    const agents = await dataService.getAgentsWithNoLogins();
    
    if (!agents || agents.length === 0) {
      return {
        success: true,
        message: `✅ All agents have logged in at least once!`,
        data: []
      };
    }
    
    return {
      success: true,
      message: `📊 Agents with No Logins:\n` +
               `• Total: ${agents.length} agents\n\n` +
               agents.slice(0, 10).map((a, i) => 
                 `${i + 1}. ${a.Name} (${a.AgentID})`
               ).join('\n') +
               (agents.length > 10 ? `\n\n... and ${agents.length - 10} more` : ''),
      data: agents
    };
  }

  async getTotalAgentCount() {
    const count = await dataService.getTotalAgentCount();
    
    return {
      success: true,
      message: `📊 Total Agents in Database: ${count}`,
      data: { count }
    };
  }

  async getTopAgentsByLogin() {
    const topAgents = await dataService.getTopAgentsByLoginCount(5);
    
    if (!topAgents || topAgents.length === 0) {
      return {
        success: false,
        message: `❌ No login data available.`
      };
    }
    
    let message = `🏆 Top 5 Agents by Login Count:\n\n`;
    topAgents.forEach((item, index) => {
      message += `${index + 1}. ${item.agent?.Name || 'Unknown'} (${item.agent?.AgentID || 'N/A'})\n`;
      message += `   Logins: ${item.loginCount}\n`;
      if (index < topAgents.length - 1) message += '\n';
    });
    
    return {
      success: true,
      message,
      data: topAgents
    };
  }
}

export default new AgentService();
