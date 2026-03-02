import re
from typing import Dict, List, Optional

class NLPProcessor:
    def __init__(self):
        pass
    
    def extract_entities(self, text: str) -> Dict:
        """Extract entities using regex"""
        entities = {
            "email": self._extract_email(text),
            "agent_id": self._extract_agent_id(text),
            "person_name": self._extract_person(text),
            "company": self._extract_company(text),
            "date": self._extract_dates(text),
            "number": self._extract_numbers(text)
        }
        return {k: v for k, v in entities.items() if v}
    
    def _extract_email(self, text: str) -> Optional[str]:
        match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
        return match.group(0).replace('mailto:', '') if match else None
    
    def _extract_agent_id(self, text: str) -> Optional[str]:
        match = re.search(r'(CHAGT\d+|AG\d+|DEMO\d+)', text, re.IGNORECASE)
        return match.group(0).upper() if match else None
    
    def _extract_person(self, text: str) -> Optional[str]:
        words = text.split()
        for i, word in enumerate(words):
            if word[0].isupper() and len(word) > 2 and word.isalpha():
                return word
        return None
    
    def _extract_company(self, text: str) -> Optional[str]:
        companies = ['google', 'microsoft', 'amazon', 'apple', 'meta', 'netflix']
        for company in companies:
            if company in text.lower():
                return company.title()
        return None
    
    def _extract_dates(self, text: str) -> List[str]:
        return re.findall(r'\d{4}-\d{2}-\d{2}', text)
    
    def _extract_numbers(self, text: str) -> Optional[int]:
        match = re.search(r'\b\d+\b', text)
        return int(match.group(0)) if match else None
    
    def get_intent_keywords(self, text: str) -> Dict[str, bool]:
        """Identify query intent using keyword analysis"""
        text_lower = text.lower()
        return {
            "is_lookup": any(w in text_lower for w in ["find", "search", "get", "show", "tell"]),
            "is_count": any(w in text_lower for w in ["how many", "count", "total"]),
            "is_login": "login" in text_lower,
            "is_profile": "profile" in text_lower,
            "is_company": "company" in text_lower or "work" in text_lower,
            "is_nationality": "nationality" in text_lower or "country" in text_lower,
            "is_email": "email" in text_lower,
            "is_active": any(w in text_lower for w in ["active", "frequently", "most", "least"]),
            "is_history": "history" in text_lower,
            "is_date_range": "between" in text_lower or "from" in text_lower
        }
