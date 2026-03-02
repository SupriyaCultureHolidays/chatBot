from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
import requests
import re
from actions.vector_store import VectorStore

NODE_SERVICE_URL = "http://localhost:5000/api/internal"
vector_store = VectorStore()

class ActionDynamicQuery(Action):
    def name(self) -> Text:
        return "action_dynamic_query"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        user_message = tracker.latest_message.get('text', '')
        intent = tracker.latest_message.get('intent', {}).get('name', '')
        query_slot = tracker.get_slot('query')
        
        # Use vector search with NLP for better query understanding
        similar_queries = vector_store.search_similar(user_message, n_results=1)
        query_info = similar_queries[0] if similar_queries else {}
        entities = query_info.get('entities', {})
        intent_keywords = query_info.get('intent_keywords', {})
        
        text_lower = user_message.lower()
        
        # Extract identifiers using NLP-enhanced extraction
        identifier = entities.get('agent_id') or entities.get('email') or entities.get('person_name') or query_slot or ''
        email_match = entities.get('email')
        agent_id_match = entities.get('agent_id')
        date_matches = entities.get('date', [])
        login_id_match = re.search(r'login\s+(?:id\s+)?(\d+)', text_lower)
        
        try:
            response = None
            
            # Field queries
            if 'email' in text_lower and identifier:
                response = requests.post(f"{NODE_SERVICE_URL}/agent/by-name", json={"agent_name": identifier}, timeout=5)
                if not response.json().get('success'):
                    response = requests.post(f"{NODE_SERVICE_URL}/agent/by-id", json={"agent_id": identifier}, timeout=5)
                data = response.json()
                if data.get('success'):
                    agent = data['data'][0] if isinstance(data['data'], list) else data['data']
                    dispatcher.utter_message(text=f"📧 Email of {identifier}: {agent.get('UserName', 'N/A')}")
                    return []
            
            elif ('agent id' in text_lower or 'agentid' in text_lower) and identifier:
                response = requests.post(f"{NODE_SERVICE_URL}/agent/by-name", json={"agent_name": identifier}, timeout=5)
                if not response.json().get('success'):
                    response = requests.post(f"{NODE_SERVICE_URL}/agent/by-email", json={"email": identifier}, timeout=5)
                data = response.json()
                if data.get('success'):
                    agent = data['data'][0] if isinstance(data['data'], list) else data['data']
                    dispatcher.utter_message(text=f"🆔 Agent ID of {identifier}: {agent.get('AgentID', 'N/A')}")
                    return []
            
            elif ('company' in text_lower or 'work at' in text_lower or 'works at' in text_lower) and identifier:
                response = requests.post(f"{NODE_SERVICE_URL}/agent/by-name", json={"agent_name": identifier}, timeout=5)
                if not response.json().get('success'):
                    response = requests.post(f"{NODE_SERVICE_URL}/agent/by-id", json={"agent_id": identifier}, timeout=5)
                data = response.json()
                if data.get('success'):
                    agent = data['data'][0] if isinstance(data['data'], list) else data['data']
                    dispatcher.utter_message(text=f"🏢 Company of {identifier}: {agent.get('Comp_Name', 'N/A')}")
                    return []
            
            elif 'nationality' in text_lower and identifier and intent == 'query_field':
                response = requests.post(f"{NODE_SERVICE_URL}/agent/nationality", json={"agent_id": identifier}, timeout=5)
            
            elif 'last login' in text_lower or 'when did' in text_lower:
                response = requests.post(f"{NODE_SERVICE_URL}/agent/last-login", json={"agent_id": identifier}, timeout=5)
            
            elif 'how many times' in text_lower or ('login count' in text_lower and identifier):
                response = requests.post(f"{NODE_SERVICE_URL}/agent/login-count", json={"agent_id": identifier}, timeout=5)
            
            elif 'login history' in text_lower or 'show login' in text_lower:
                response = requests.post(f"{NODE_SERVICE_URL}/agent/login-history", json={"agent_id": identifier}, timeout=5)
            
            elif 'first login' in text_lower:
                response = requests.post(f"{NODE_SERVICE_URL}/agent/first-login", json={"agent_id": identifier}, timeout=5)
            
            elif 'full profile' in text_lower:
                response = requests.post(f"{NODE_SERVICE_URL}/agent/full-profile", json={"agent_id": identifier}, timeout=5)
            
            elif intent == 'query_by_company' or ('agents from' in text_lower or 'agents in' in text_lower or 'works at' in text_lower) and not ('email' in text_lower or 'company does' in text_lower):
                response = requests.post(f"{NODE_SERVICE_URL}/agent/by-company", json={"company": identifier}, timeout=5)
            
            elif intent == 'query_by_nationality' or ('agents from' in text_lower and ('india' in text_lower or 'united states' in text_lower or 'american' in text_lower or 'indian' in text_lower)):
                nationality = identifier.lower()
                if 'indian' in nationality:
                    nationality = 'india'
                elif 'american' in nationality:
                    nationality = 'american'
                response = requests.post(f"{NODE_SERVICE_URL}/agent/by-nationality", json={"nationality": nationality}, timeout=5)
            
            elif 'most active' in text_lower or 'most frequently' in text_lower:
                response = requests.get(f"{NODE_SERVICE_URL}/agent/most-active", timeout=5)
            
            elif 'least active' in text_lower:
                response = requests.get(f"{NODE_SERVICE_URL}/agent/least-active", timeout=5)
            
            elif 'never logged' in text_lower or ('no logins' in text_lower or 'not logged in' in text_lower or 'have not logged' in text_lower):
                response = requests.get(f"{NODE_SERVICE_URL}/agent/no-logins", timeout=5)
            
            elif 'top 5' in text_lower or 'top agents' in text_lower:
                response = requests.get(f"{NODE_SERVICE_URL}/agent/top-by-login", timeout=5)
            
            elif 'how many agents' in text_lower or 'total agents' in text_lower or 'agents in the database' in text_lower:
                response = requests.get(f"{NODE_SERVICE_URL}/agent/count", timeout=5)
            
            elif 'this month' in text_lower:
                response = requests.get(f"{NODE_SERVICE_URL}/login/this-month", timeout=5)
            
            elif len(date_matches) == 2:
                response = requests.post(f"{NODE_SERVICE_URL}/login/date-range", json={"start_date": date_matches[0], "end_date": date_matches[1]}, timeout=5)
            
            elif login_id_match:
                response = requests.post(f"{NODE_SERVICE_URL}/login/by-id", json={"login_id": login_id_match.group(1)}, timeout=5)
            
            else:
                # Default: lookup agent
                if email_match:
                    response = requests.post(f"{NODE_SERVICE_URL}/agent/by-email", json={"email": identifier}, timeout=5)
                elif agent_id_match:
                    response = requests.post(f"{NODE_SERVICE_URL}/agent/by-id", json={"agent_id": identifier}, timeout=5)
                elif identifier:
                    response = requests.post(f"{NODE_SERVICE_URL}/agent/by-name", json={"agent_name": identifier}, timeout=5)
            
            if response:
                data = response.json()
                dispatcher.utter_message(text=data.get('message', 'No data found'))
            else:
                dispatcher.utter_message(text="I couldn't find that information.")
        
        except Exception as e:
            dispatcher.utter_message(text=f"Error: {str(e)}")
        
        return []


class ActionDefaultFallback(Action):
    def name(self) -> Text:
        return "action_default_fallback"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        dispatcher.utter_message(text="I can help with agent info, logins, and statistics. Just ask naturally!")
        return []
