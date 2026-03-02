import chromadb
from sentence_transformers import SentenceTransformer
import os
from actions.nlp_processor import NLPProcessor

class VectorStore:
    def __init__(self):
        self.client = chromadb.PersistentClient(path="./chroma_db")
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.nlp = NLPProcessor()
        self.collection = self._get_or_create_collection()
        
    def _get_or_create_collection(self):
        try:
            return self.client.get_collection("agent_queries")
        except:
            collection = self.client.create_collection("agent_queries")
            self._initialize_data(collection)
            return collection
    
    def _initialize_data(self, collection):
        """Initialize with common query patterns"""
        queries = [
            {"text": "find agent by email address", "type": "agent_lookup", "field": "email"},
            {"text": "get agent by ID number", "type": "agent_lookup", "field": "agent_id"},
            {"text": "search agent by name", "type": "agent_lookup", "field": "name"},
            {"text": "show agent email address", "type": "field_query", "field": "email"},
            {"text": "what is agent ID", "type": "field_query", "field": "agent_id"},
            {"text": "which company does agent work", "type": "field_query", "field": "company"},
            {"text": "agent nationality country", "type": "field_query", "field": "nationality"},
            {"text": "last login time date", "type": "login_query", "action": "last_login"},
            {"text": "login count frequency", "type": "login_query", "action": "login_count"},
            {"text": "login history records", "type": "login_query", "action": "login_history"},
            {"text": "first login date", "type": "login_query", "action": "first_login"},
            {"text": "agents from company", "type": "filter_query", "filter": "company"},
            {"text": "agents by nationality", "type": "filter_query", "filter": "nationality"},
            {"text": "most active agent", "type": "stats_query", "stat": "most_active"},
            {"text": "least active agent", "type": "stats_query", "stat": "least_active"},
            {"text": "agents never logged in", "type": "stats_query", "stat": "no_logins"},
        ]
        
        embeddings = self.model.encode([q["text"] for q in queries]).tolist()
        collection.add(
            embeddings=embeddings,
            documents=[q["text"] for q in queries],
            metadatas=queries,
            ids=[f"query_{i}" for i in range(len(queries))]
        )
    
    def search_similar(self, query_text, n_results=3):
        """Find similar queries using semantic search with NLP enhancement"""
        # Extract entities and intent
        entities = self.nlp.extract_entities(query_text)
        intent_keywords = self.nlp.get_intent_keywords(query_text)
        
        # Semantic search
        embedding = self.model.encode([query_text]).tolist()
        results = self.collection.query(query_embeddings=embedding, n_results=n_results)
        
        # Enhance results with NLP insights
        if results['metadatas']:
            results['metadatas'][0][0]['entities'] = entities
            results['metadatas'][0][0]['intent_keywords'] = intent_keywords
        
        return results['metadatas'][0] if results['metadatas'] else []
