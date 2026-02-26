/**
 * Intent Classification Service
 * Detects user query intent and determines required data sources
 */

const INTENT_PATTERNS = {
  AGENT_BY_EMAIL: {
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i,
    description: "Find agent by email",
    dataNeeded: ['profile']
  },
  AGENT_BY_ID: {
    pattern: /CHAGT\d+/i,
    description: "Find agent by AgentID",
    dataNeeded: ['profile', 'logins']
  },
  AGENT_BY_NAME: {
    pattern: /who is|find|details|info|tell me about|profile/i,
    description: "Find agent by name",
    dataNeeded: ['profile', 'logins']
  },
  LAST_LOGIN: {
    pattern: /last\s*(login|seen|active|access|time)/i,
    description: "Get last login date",
    dataNeeded: ['profile', 'logins']
  },
  LOGIN_COUNT: {
    pattern: /how many times|login\s*count|total\s*login|frequency/i,
    description: "Count logins",
    dataNeeded: ['logins']
  },
  LOGIN_HISTORY: {
    pattern: /login\s*history|all\s*login|when.*login|login.*dates/i,
    description: "Full login history",
    dataNeeded: ['logins']
  },
  INACTIVE_AGENTS: {
    pattern: /not\s*login|inactive|haven.t\s*login|no\s*login|dormant/i,
    description: "Agents who haven't logged in",
    dataNeeded: ['profile', 'logins']
  },
  MOST_ACTIVE: {
    pattern: /most\s*(active|login)|highest\s*login|top\s*agent|who.*logged.*most/i,
    description: "Most active agents",
    dataNeeded: ['logins']
  },
  RECENT_LOGINS: {
    pattern: /recent|latest|today|this\s*week|this\s*month|last\s*\d+\s*days/i,
    description: "Recently logged in agents",
    dataNeeded: ['logins']
  },
  ALL_AGENTS_COMPANY: {
    pattern: /all\s*agent|list\s*agent|who\s*work|agent.*company|company.*agent/i,
    description: "List all agents in a company",
    dataNeeded: ['profile']
  },
  COMPANY_COUNT: {
    pattern: /how\s*many.*company|count.*agent|total.*agent/i,
    description: "Count agents per company",
    dataNeeded: ['profile']
  },
  NATIONALITY_SEARCH: {
    pattern: /nationality|citizen|from\s+[A-Z][a-z]+|country/i,
    description: "Search by nationality",
    dataNeeded: ['profile']
  },
  COUNT_QUERY: {
    pattern: /how\s*many|count|total|number\s*of/i,
    description: "Count/aggregate query",
    dataNeeded: ['profile', 'logins']
  },
  DATE_RANGE: {
    pattern: /between|from\s+\d|to\s+\d|after|before|since|until|\d{4}/i,
    description: "Date range query",
    dataNeeded: ['logins']
  },
  LIST_ALL: {
    pattern: /list\s*all|show\s*all|every\s*agent|all\s*agents|give\s*me\s*all/i,
    description: "List all agents",
    dataNeeded: ['profile']
  },
  OUT_OF_SCOPE: {
    pattern: /weather|news|joke|capital\s*of|who\s*is\s*president|stock\s*price|recipe|hello|hi|hey/i,
    description: "Not related to travel agent database",
    dataNeeded: []
  }
};

/**
 * Classifies user question intent and determines data requirements
 * @param {string} question - User's question
 * @returns {Object} Intent classification result
 */
const classifyIntent = (question) => {
  const detectedIntents = [];

  for (const [intentName, config] of Object.entries(INTENT_PATTERNS)) {
    if (config.pattern.test(question)) {
      detectedIntents.push({
        intent: intentName,
        description: config.description,
        dataNeeded: config.dataNeeded
      });
    }
  }

  const allDataNeeded = [...new Set(detectedIntents.flatMap(i => i.dataNeeded))];

  const isListQuery = detectedIntents.some(i =>
    ['ALL_AGENTS_COMPANY', 'LIST_ALL', 'NATIONALITY_SEARCH', 'MOST_ACTIVE', 'RECENT_LOGINS', 'COUNT_QUERY'].includes(i.intent)
  );

  return {
    intents: detectedIntents,
    primaryIntent: detectedIntents[0]?.intent || 'UNKNOWN',
    dataNeeded: allDataNeeded,
    isListQuery,
    isOutOfScope: detectedIntents.some(i => i.intent === 'OUT_OF_SCOPE'),
    needsLoginData: allDataNeeded.includes('logins'),
    needsProfileData: allDataNeeded.includes('profile'),
    resultLimit: isListQuery ? 20 : 5
  };
};

module.exports = { classifyIntent, INTENT_PATTERNS };
