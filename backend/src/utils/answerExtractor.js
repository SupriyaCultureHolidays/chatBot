class AnswerExtractor {
  buildAgentContent(agent) {
    return [
      `- AgentID: ${agent.AgentID || 'N/A'}`,
      `- Name: ${agent.Name || 'N/A'}`,
      `- Email: ${agent.UserName || 'N/A'}`,
      `- Company: ${agent.Comp_Name || 'N/A'}`,
      `- Nationality: ${agent.Nationality || 'N/A'}`,
      `- Phone: ${agent.Phone || 'N/A'}`,
      `- Last Login: ${agent.Last_Login || 'Never'}`,
      `- Status: ${agent.Status || 'Unknown'}`
    ].join('\n');
  }

  buildContext(agents) {
    return agents.map(a => this.buildAgentContent(a)).join('\n---\n');
  }

  parseAgents(text) {
    const agentBlocks = text.split(/\n---\n/);
    return agentBlocks.map(block => {
      const agent = {};
      const lines = block.split('\n');
      lines.forEach(line => {
        const match = line.match(/^-\s*([^:]+):\s*(.+)$/);
        if (match) {
          agent[match[1].trim()] = match[2].trim();
        }
      });
      return Object.keys(agent).length > 0 ? agent : null;
    }).filter(Boolean);
  }

  extractStructuredData(llmResponse) {
    const agents = this.parseAgents(llmResponse);
    if (agents.length > 0) return agents;
    
    const data = {};
    const lines = llmResponse.split('\n');
    lines.forEach(line => {
      const match = line.match(/^-?\s*([^:]+):\s*(.+)$/);
      if (match) {
        data[match[1].trim()] = match[2].trim();
      }
    });
    
    return Object.keys(data).length > 0 ? [data] : [];
  }
}

export default new AnswerExtractor();
