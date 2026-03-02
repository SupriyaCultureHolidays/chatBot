class LoginLinker {
  constructor() {
    this.usernameIndex = new Map();
    this.emailIndex = new Map();
    this.idIndex = new Map();
  }

  buildIndexes(agents) {
    this.usernameIndex.clear();
    this.emailIndex.clear();
    this.idIndex.clear();

    agents.forEach(agent => {
      if (agent.AgentID) {
        this.idIndex.set(agent.AgentID.toLowerCase(), agent);
      }
      
      if (agent.UserName && agent.UserName.includes('@')) {
        const email = agent.UserName.toLowerCase().replace('mailto:', '');
        this.emailIndex.set(email, agent);
        
        const prefix = email.split('@')[0];
        for (let i = 3; i <= prefix.length; i++) {
          const substring = prefix.substring(0, i);
          if (!this.usernameIndex.has(substring)) {
            this.usernameIndex.set(substring, []);
          }
          this.usernameIndex.get(substring).push(agent);
        }
      }
    });
    
    console.log(`✓ Login linker indexed ${this.idIndex.size} IDs, ${this.emailIndex.size} emails`);
  }

  resolveLoginToAgent(loginId) {
    const normalized = loginId.toLowerCase().trim().replace('mailto:', '');
    
    // Strategy 1: Exact email match
    if (this.emailIndex.has(normalized)) {
      return this.emailIndex.get(normalized);
    }
    
    // Strategy 2: Exact AgentID match
    if (this.idIndex.has(normalized)) {
      return this.idIndex.get(normalized);
    }
    
    // Strategy 3: Username prefix match
    const emailPrefix = normalized.split('@')[0];
    const candidates = this.usernameIndex.get(emailPrefix);
    if (candidates && candidates.length === 1) {
      return candidates[0];
    }
    
    // Strategy 4: Partial match
    for (const [email, agent] of this.emailIndex.entries()) {
      if (email.includes(normalized) || normalized.includes(email.split('@')[0])) {
        return agent;
      }
    }
    
    // Strategy 5: Fuzzy match
    let bestMatch = null;
    let bestScore = 0.85;
    
    for (const [email, agent] of this.emailIndex.entries()) {
      const score = this.similarity(normalized, email);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = agent;
      }
    }
    
    return bestMatch;
  }

  similarity(s1, s2) {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    if (longer.length === 0) return 1.0;
    return (longer.length - this.editDistance(longer, shorter)) / longer.length;
  }

  editDistance(s1, s2) {
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) costs[j] = j;
        else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }

  getLoginsByAgent(agent, allLogins) {
    const matches = [];
    const seen = new Set();
    
    allLogins.forEach(login => {
      const resolvedAgent = this.resolveLoginToAgent(login.AGENTID);
      if (resolvedAgent && resolvedAgent.AgentID === agent.AgentID) {
        const key = `${login.LOGINDATE}-${login.AGENTID}`;
        if (!seen.has(key)) {
          matches.push(login);
          seen.add(key);
        }
      }
    });
    
    return matches;
  }
}

export default new LoginLinker();
