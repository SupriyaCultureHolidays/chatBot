class SearchEnhancer {
  constructor() {
    this.nationalityMap = {
      'indian': 'india', 'american': 'usa', 'british': 'uk', 'canadian': 'canada',
      'australian': 'australia', 'french': 'france', 'german': 'germany',
      'italian': 'italy', 'spanish': 'spain', 'chinese': 'china', 'japanese': 'japan',
      'mexican': 'mexico', 'brazilian': 'brazil', 'russian': 'russia', 'korean': 'korea',
      'dutch': 'netherlands', 'swedish': 'sweden', 'norwegian': 'norway', 'danish': 'denmark'
    };
  }

  normalizeNationality(input) {
    const lower = input.toLowerCase().trim();
    return this.nationalityMap[lower] || lower;
  }

  normalizeCompanyName(name) {
    return name.toLowerCase().replace(/\s+/g, '').replace(/[^\w]/g, '');
  }

  matchCompany(query, companyName) {
    const normalizedQuery = this.normalizeCompanyName(query);
    const normalizedCompany = this.normalizeCompanyName(companyName);
    return normalizedCompany.includes(normalizedQuery) || normalizedQuery.includes(normalizedCompany);
  }

  resolveLoginAgent(loginId, agents) {
    const normalized = loginId.toLowerCase().trim().replace('mailto:', '');
    
    // Strategy 1: Exact email match
    let match = agents.find(a => a.UserName?.toLowerCase().replace('mailto:', '') === normalized);
    if (match) return match;

    // Strategy 2: Exact AgentID match
    match = agents.find(a => a.AgentID?.toLowerCase() === normalized);
    if (match) return match;

    // Strategy 3: Username contains loginId
    match = agents.find(a => a.UserName?.toLowerCase().includes(normalized));
    if (match) return match;

    // Strategy 4: Email prefix match
    const emailPrefix = normalized.split('@')[0];
    match = agents.find(a => a.UserName?.toLowerCase().startsWith(emailPrefix));
    if (match) return match;

    // Strategy 5: Fuzzy match (≥0.85 similarity)
    let bestMatch = null;
    let bestScore = 0.85;
    
    agents.forEach(agent => {
      if (!agent.UserName) return;
      const score = this.similarity(normalized, agent.UserName.toLowerCase());
      if (score > bestScore) {
        bestScore = score;
        bestMatch = agent;
      }
    });

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
}

export default new SearchEnhancer();
