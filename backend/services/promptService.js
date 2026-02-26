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

  return `You are a travel agent database assistant. Answer questions using ONLY the records below.

=== YOUR RULES ===
${intentInstructions}

=== GENERAL RULES ===
- Use ONLY data from the records below. Never invent data.
- If data spans multiple records, JOIN them by AgentID.
- If asked for a list, return ALL matching agents, not just one.
- If no data found after checking all records, say: "No matching records found for your query."
- Format dates as: DD-MMM-YYYY (e.g., 15-Jan-2024)
- Be concise but complete.

=== DATABASE RECORDS (${contexts.length} found) ===
${contextText}

=== USER QUESTION ===
${question}

=== YOUR ANSWER ===`;
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
      case 'LAST_LOGIN':
        instructions.push(
          "- For 'last login' questions: Find the MOST RECENT date in Login History for the agent.",
          "- Sort login dates descending and return the first one."
        );
        break;

      case 'LOGIN_COUNT':
        instructions.push(
          "- For login count: Count ALL login entries for the agent and return the number."
        );
        break;

      case 'ALL_AGENTS_COMPANY':
        instructions.push(
          "- For company queries: List EVERY agent with that company name.",
          "- Format as numbered list with: Name, AgentID, Email."
        );
        break;

      case 'INACTIVE_AGENTS':
        instructions.push(
          "- For inactive agents: Find agents whose Last Login is oldest or missing.",
          "- Calculate how many days since their last login if possible."
        );
        break;

      case 'MOST_ACTIVE':
        instructions.push(
          "- For most active: Find the agent with highest Total Logins count.",
          "- Rank agents from most to least active."
        );
        break;

      case 'NATIONALITY_SEARCH':
        instructions.push(
          "- For nationality queries: List ALL agents matching that nationality.",
          "- Include Name, AgentID, Company for each."
        );
        break;

      case 'COUNT_QUERY':
        instructions.push(
          "- For count queries: Count matching records and give a clear number.",
          "- Example: 'There are 5 agents from XYZ Company.'"
        );
        break;

      case 'DATE_RANGE':
        instructions.push(
          "- For date range queries: Filter login dates that fall within the specified range.",
          "- Return agents who match the date criteria."
        );
        break;

      case 'LIST_ALL':
        instructions.push(
          "- List ALL agents in the records provided.",
          "- Format as a numbered list."
        );
        break;

      case 'OUT_OF_SCOPE':
        instructions.push(
          "- This question is outside the travel agent database scope.",
          "- Politely say you can only answer questions about agent profiles and login history."
        );
        break;
    }
  });

  return instructions.length > 0
    ? instructions.join('\n')
    : "- Answer the question directly using the records provided.";
};

module.exports = { buildDynamicPrompt };
