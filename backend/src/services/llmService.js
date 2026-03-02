import axios from 'axios';

class LLMService {
  constructor() {
    this.baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = 'llama3.2:1b';
    this.timeout = 10000;
    this.maxRetries = 2;
  }

  formatDate(isoDate) {
    if (!isoDate || isoDate === '0000-00-00' || isoDate.startsWith('0000')) {
      return 'No date recorded';
    }
    const date = new Date(isoDate);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${String(date.getDate()).padStart(2, '0')}-${months[date.getMonth()]}-${date.getFullYear()}`;
  }

  preprocessAgents(agents) {
    return agents.map(agent => ({
      ...agent,
      Last_Login: this.formatDate(agent.Last_Login),
      First_Login: this.formatDate(agent.First_Login),
      Reg_Date: this.formatDate(agent.Reg_Date)
    }));
  }

  buildPrompt(query, agents) {
    const processedAgents = this.preprocessAgents(agents);
    const context = processedAgents.map(a => 
      `- AgentID: ${a.AgentID || 'N/A'}\n` +
      `- Name: ${a.Name || 'N/A'}\n` +
      `- Email: ${a.UserName || 'N/A'}\n` +
      `- Company: ${a.Comp_Name || 'N/A'}\n` +
      `- Nationality: ${a.Nationality || 'N/A'}\n` +
      `- Last Login: ${a.Last_Login}`
    ).join('\n---\n');

    return `You are a travel agent database assistant. Answer ONLY using the provided records.

STRICT RULES:
1. If information is NOT in the records below, respond: "No data available for this query"
2. NEVER guess, infer, or say "probably", "likely", "might", "I think"
3. NEVER mix data between different agents
4. All dates are already formatted as DD-MMM-YYYY
5. If a field shows "N/A" or "No date recorded", state that explicitly

AGENT RECORDS:
${context}

USER QUESTION: ${query}

ANSWER (using ONLY the records above):`;
  }

  async query(prompt) {
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeout);

        const response = await axios.post(
          `${this.baseUrl}/api/generate`,
          { model: this.model, prompt, stream: false },
          { signal: controller.signal, timeout: this.timeout }
        );

        clearTimeout(timeout);
        return response.data.response;
      } catch (error) {
        if (attempt < this.maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    throw new Error('LLM timeout after retries');
  }

  async answer(query, agents) {
    const prompt = this.buildPrompt(query, agents);
    return await this.query(prompt);
  }
}

export default new LLMService();
