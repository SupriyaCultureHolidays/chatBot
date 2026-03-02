# Dynamic Agent Query System - Training Guide

## Overview
This system handles agent queries dynamically without hardcoding. It uses:
- **Rasa NLU**: Intent classification and entity extraction
- **Dynamic Actions**: Smart routing based on intent and keywords
- **Backend API**: Query-based data retrieval from JSON files

## What's Dynamic?
✅ Users can ask questions in different ways
✅ System extracts entities (names, IDs, emails) automatically
✅ Intent-based routing to appropriate endpoints
✅ No hardcoded responses - all data comes from agentData.json
✅ Easy to add new agents without code changes

## Supported Query Types

### 1. Agent Lookup
- "Who is demo demoo?"
- "Find agent CHAGT0001000024104"
- "Tell me about gautam@cultureholidays.com"

### 2. Field Queries
- "What is RAY HARPER email?"
- "What is the AgentID of RAY HARPER?"
- "What company does demo demoo work at?"
- "What nationality is RAY HARPER?"

### 3. Profile Queries
- "Give me full profile of CHAGT00101"
- "Complete details of RAY HARPER"

### 4. Login Queries
- "When did gautam@cultureholidays.com last login?"
- "How many times did RAY HARPER login?"
- "Show login history for demo demoo"
- "What was the first login of CHAGT0001000024104?"

### 5. Company Queries
- "Show all agents from Culture Holidays"
- "Who works at LUXE GRAND TRAVEL?"
- "How many agents are in Culture Holidays?"

### 6. Nationality Queries
- "Show all agents from India"
- "List all Indian agents"
- "How many agents are from United States?"

### 7. Statistics Queries
- "Who is the most active agent?"
- "Which agent logged in most frequently?"
- "Show top 5 agents by login count"
- "How many agents are in the database?"

### 8. Date Range Queries
- "Who logged in between 2022-01-01 and 2022-12-31?"
- "Which agents logged in this month?"

## Training Steps

### 1. Train the Rasa Model
```bash
cd rasa
rasa train
```

This will:
- Process nlu.yml (intent examples)
- Process domain.yml (intents, entities, slots)
- Process stories.yml (conversation flows)
- Generate a new model in models/ folder

### 2. Start the Action Server
```bash
cd rasa
rasa run actions
```

Or use the batch file:
```bash
start-actions.bat
```

### 3. Start the Rasa Server
```bash
cd rasa
rasa run --enable-api --cors "*"
```

Or use the batch file:
```bash
start-rasa.bat
```

### 4. Start the Backend Server
```bash
cd backend
npm start
```

### 5. Test the System
```bash
python test_queries.py
```

## How It Works

### Intent Classification
Rasa classifies user input into intents:
- `query_agent`: Basic agent lookup
- `query_field`: Specific field queries (email, company, etc.)
- `query_profile`: Full profile requests
- `query_login`: Login-related queries
- `query_by_company`: Company-based queries
- `query_by_nationality`: Nationality-based queries
- `query_statistics`: Statistical queries
- `query_date_range`: Date range queries

### Entity Extraction
Rasa extracts entities from user input:
- `query`: The main search term (name, ID, email, company, etc.)
- `start_date`: Start date for range queries
- `end_date`: End date for range queries

### Dynamic Routing
The action server (actions.py):
1. Receives intent and entities from Rasa
2. Analyzes the user message for keywords
3. Extracts identifiers (email, agent ID, name)
4. Routes to appropriate backend API endpoint
5. Returns formatted response

### Backend API
The Node.js backend:
1. Receives API calls from action server
2. Queries agentData.json and agentLogin.json
3. Performs fuzzy matching for flexible searches
4. Returns formatted results

## Adding New Agents

Simply add to `backend/src/data/agentData.json`:
```json
{
  "UserName": "newagent@company.com",
  "Name": "New Agent",
  "Nationality": "Country",
  "Comp_Name": "Company Name",
  "Date_establishment": "2024-01-01",
  "AgentID": "NEWID001",
  "CreatedDate": "2024-01-01T00:00:00Z",
  "LastLogin": "2024-01-01T00:00:00Z"
}
```

No code changes needed! The system will automatically:
- Find the agent by name, email, or ID
- Answer all query types for the new agent
- Include them in statistics and company/nationality queries

## Adding New Query Types

### 1. Add Intent Examples to nlu.yml
```yaml
- intent: query_new_type
  examples: |
    - new query pattern [entity](query)
    - another pattern [entity](query)
```

### 2. Update domain.yml
```yaml
intents:
  - query_new_type
```

### 3. Add Story to stories.yml
```yaml
- story: new query type
  steps:
    - intent: query_new_type
    - action: action_dynamic_query
```

### 4. Update actions.py
Add detection logic in `detect_intent_type()`:
```python
if 'new_keyword' in text_lower:
    return 'new_action_type'
```

Add routing in `run()`:
```python
elif action_type == 'new_action_type':
    response = self.call_api('new/endpoint', 'POST', {'param': identifier})
```

### 5. Add Backend Endpoint
Add to `backend/src/routes/api.js` and implement in controllers/services.

### 6. Retrain
```bash
cd rasa
rasa train
```

## Testing Individual Queries

### Using Rasa Shell
```bash
cd rasa
rasa shell
```

Then type your queries interactively.

### Using REST API
```bash
curl -X POST http://localhost:5005/webhooks/rest/webhook \
  -H "Content-Type: application/json" \
  -d '{"sender":"test","message":"Who is demo demoo?"}'
```

### Using Test Script
```bash
python test_queries.py
```

## Troubleshooting

### Model Not Found
- Run `rasa train` to create a new model
- Check that models/ folder contains .tar.gz files

### Action Server Not Responding
- Ensure action server is running on port 5055
- Check endpoints.yml has correct action_endpoint

### Backend API Errors
- Ensure backend server is running on port 5000
- Check agentData.json and agentLogin.json exist
- Verify NODE_SERVICE_URL in actions.py

### Intent Not Recognized
- Add more training examples to nlu.yml
- Retrain the model
- Check confidence threshold in config.yml

## Performance Tips

1. **Precompute Analytics**: Backend caches statistics on startup
2. **Fuzzy Matching**: searchEnhancer.js handles typos and variations
3. **Entity Extraction**: Rasa extracts entities for precise queries
4. **Fallback Handling**: Unknown queries get helpful error messages

## Next Steps

1. Add more training examples for better accuracy
2. Implement database instead of JSON files
3. Add authentication and authorization
4. Create web interface for easier testing
5. Add logging and analytics
6. Implement conversation context for follow-up questions

## Sample Conversation Flow

```
User: Who is demo demoo?
Bot: 📋 Agent Details:
     • Name: demo demoo
     • Agent ID: DEMO001
     • Email: demo@demoo.com
     • Company: Demo Company
     • Nationality: United States

User: What company does RAY HARPER work at?
Bot: 🏢 Company of RAY HARPER: LUXE GRAND TRAVEL

User: Show all agents from Culture Holidays
Bot: Found 5 agent(s):
     1. Gautam Kumar (CHAGT0001000024104)
        📧 mailto:gautam@cultureholidays.com
        🏢 Culture Holidays
     ...

User: Who is the most active agent?
Bot: 🏆 Most Active Agent:
     • Name: Ankit Verma
     • Agent ID: CHAGT0001000024107
     • Total Logins: 15
```

## Architecture

```
User Input
    ↓
Rasa NLU (Intent + Entity Extraction)
    ↓
Rasa Core (Story/Rule Matching)
    ↓
Action Server (actions.py)
    ↓
Backend API (Node.js)
    ↓
Data Layer (JSON files)
    ↓
Response to User
```

## Key Files

- `rasa/data/nlu.yml`: Training examples for intents
- `rasa/domain.yml`: Intents, entities, slots, actions
- `rasa/data/stories.yml`: Conversation flows
- `rasa/actions/actions.py`: Dynamic query handler
- `backend/src/routes/api.js`: API endpoints
- `backend/src/services/agentService.js`: Business logic
- `backend/src/services/dataService.js`: Data access layer
- `backend/src/data/agentData.json`: Agent data
- `backend/src/data/agentLogin.json`: Login records

## Success Criteria

✅ All 40+ sample queries work correctly
✅ System handles typos and variations
✅ New agents work without code changes
✅ Responses are formatted and user-friendly
✅ Error messages are helpful
✅ Performance is fast (<1 second per query)
