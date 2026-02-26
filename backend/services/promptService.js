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
      case 'LOGIN_BY_ID':
        instructions.push(
          "- For login ID queries: Find the login record with that specific ID number.",
          "- Show the AGENTID and LOGINDATE for that login record.",
          "- If agent profile exists, include agent name and details."
        );
        break;

      case 'FIRST_LOGIN':
        instructions.push(
          "- For 'first login' questions: Find the EARLIEST date in all login records.",
          "- Sort login dates ascending and return the first one."
        );
        break;

      case 'LAST_LOGIN':
        instructions.push(
          "- For 'last login' questions: Find the MOST RECENT date in Login History for the agent.",
          "- Sort login dates descending and return the first one."
        );
        break;

      case 'LOGIN_COUNT':
        instructions.push(
          "- For login count: Count ALL login entries for the agent and return the number.",
          "- Handle case-insensitive matching of AGENTID."
        );
        break;

      case 'ALL_AGENTS_COMPANY':
        instructions.push(
          "- For company queries: List EVERY agent with that company name.",
          "- Format as numbered list with: Name, AgentID, Email.",
          "- Handle fuzzy company name matching (e.g., 'Inteletravel' vs 'InteleTravel')."
        );
        break;

      case 'INACTIVE_AGENTS':
      case 'LEAST_ACTIVE':
        instructions.push(
          "- For inactive/least active agents: Find agents whose Last Login is oldest or missing.",
          "- Calculate how many days since their last login if possible.",
          "- Sort by login count ascending."
        );
        break;

      case 'MOST_ACTIVE':
        instructions.push(
          "- For most active: Find the agent with highest Total Logins count.",
          "- Rank agents from most to least active.",
          "- Group logins by AGENTID (case-insensitive)."
        );
        break;

      case 'NATIONALITY_SEARCH':
        instructions.push(
          "- For nationality queries: List ALL agents matching that nationality.",
          "- Include Name, AgentID, Company for each.",
          "- Handle case-insensitive nationality matching."
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
          "- Return agents who match the date criteria.",
          "- Parse dates like '2022-05-04' or 'May 4, 2022'."
        );
        break;

      case 'MULTIPLE_AGENTIDS':
        instructions.push(
          "- For multiple AgentID queries: Find agents with same email but different AgentIDs.",
          "- Group by email and show all associated AgentIDs."
        );
        break;

      case 'DIRTY_DATA':
        instructions.push(
          "- For dirty data detection: Look for spaces in emails, mixed case, typos.",
          "- Report inconsistencies in data format."
        );
        break;

      case 'AGENTS_NOT_IN_PROFILE':
        instructions.push(
          "- For agents not in profile: Find AGENTIDs in login data that don't have agent profiles.",
          "- List these AGENTIDs with their login counts."
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
