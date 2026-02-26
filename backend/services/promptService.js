/**
 * Dynamic Prompt Builder Service
 * Generates intent-specific prompts for LLM
 */

/**
 * Builds dynamic prompt based on detected intent
 * @param {string} question - User's question
 * @param {Array<string>} contexts - Retrieved context records
 * @param {Object} intentResult - Intent classification result
 * @returns {string} Complete LLM prompt
 */
const buildDynamicPrompt = (question, contexts, intentResult) => {
  const contextText = contexts.map((ctx, i) =>
    `[Record ${i + 1}]\n${ctx}`
  ).join('\n\n');

  const intentInstructions = buildIntentInstructions(intentResult);

  return `You are a travel agent database assistant. Answer using ONLY the records below.

${intentInstructions}

RULES:
- Use ONLY data from records. Never invent data.
- If asked for a list, return ALL matching agents.
- Format dates as: DD-MMM-YYYY
- Be concise.

RECORDS (${contexts.length}):
${contextText}

QUESTION: ${question}

ANSWER:`;
};

/**
 * Builds intent-specific instructions for LLM
 * @param {Object} intentResult - Intent classification result
 * @returns {string} Intent-specific instructions
 */
const buildIntentInstructions = (intentResult) => {
  const instructions = [];

  intentResult.intents.forEach(({ intent }) => {
    switch (intent) {
      case 'LOGIN_BY_ID':
        instructions.push("Find login record by ID. Show AGENTID and LOGINDATE.");
        break;
      case 'FIRST_LOGIN':
        instructions.push("Find EARLIEST login date.");
        break;
      case 'LAST_LOGIN':
        instructions.push("Find MOST RECENT login date.");
        break;
      case 'LOGIN_COUNT':
        instructions.push("Count ALL login entries for the agent.");
        break;
      case 'ALL_AGENTS_COMPANY':
        instructions.push("List EVERY agent with that company. Format: Name, AgentID, Email.");
        break;
      case 'INACTIVE_AGENTS':
      case 'LEAST_ACTIVE':
        instructions.push("Find agents with oldest Last Login or missing logins.");
        break;
      case 'MOST_ACTIVE':
        instructions.push("Find agent with highest Total Logins.");
        break;
      case 'NATIONALITY_SEARCH':
        instructions.push("List ALL agents matching that nationality.");
        break;
      case 'COUNT_QUERY':
        instructions.push("Count matching records and give clear number.");
        break;
      case 'DATE_RANGE':
        instructions.push("Filter login dates within specified range.");
        break;
      case 'LIST_ALL':
        instructions.push("List ALL agents in records.");
        break;
    }
  });

  return instructions.length > 0 ? instructions.join('\n') : "Answer directly using records.";
};

module.exports = { buildDynamicPrompt };
