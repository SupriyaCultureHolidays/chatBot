"""
Test script to verify all sample queries work correctly
Run this after training the model to test the dynamic query system
"""

import requests
import json

RASA_URL = "http://localhost:5005/webhooks/rest/webhook"

# All test queries from your requirements
TEST_QUERIES = [
    # Basic agent lookup
    "Who is demo demoo?",
    "Find agent CHAGT0001000024104",
    "Tell me about mailto:gautam@cultureholidays.com",
    "Find agent demo",
    "Who is ray harper",
    "Find CHAGT9999999999",
    
    # Field queries
    "What is RAY HARPER email?",
    "What is the AgentID of RAY HARPER?",
    "What company does demo demoo work at?",
    "What nationality is RAY HARPER?",
    
    # Profile queries
    "Give me full profile of CHAGT00101",
    
    # Login queries
    "When did mailto:gautam@cultureholidays.com last login?",
    "When did CHAGT0001000024104 last login?",
    "How many times did mailto:gautam@cultureholidays.com login?",
    "Show login history for demo demoo",
    "What was the first login of CHAGT0001000024104?",
    "Find login ID 1",
    "How many times did RAY HARPER login?",
    "When did mailto:nobody@fake.com last login?",
    
    # Date range queries
    "Which agents logged in this month?",
    "Who logged in between 2022-01-01 and 2022-12-31?",
    
    # Company queries
    "Show all agents from Culture Holidays",
    "Who works at LUXE GRAND TRAVEL?",
    "List all agents from culture holidays",
    "How many agents are in Culture Holidays?",
    "Agents from LUXE GRAND",
    "Show all agents from luxegrandtravel",
    
    # Nationality queries
    "Show all agents from India",
    "List all Indian agents",
    "How many agents are from United States?",
    "Show agents by nationality",
    "Show agents where nationality is india",
    
    # Statistics queries
    "Who is the most active agent?",
    "Which agent logged in most frequently?",
    "Who is the least active agent?",
    "Which agents have never logged in?",
    "Show top 5 agents by login count",
    "How many agents are in the database?",
    "How many agents have not logged in?",
]

def test_query(query):
    """Send a query to Rasa and return the response"""
    try:
        response = requests.post(
            RASA_URL,
            json={"sender": "test_user", "message": query},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                return data[0].get('text', 'No response')
            return "Empty response"
        else:
            return f"Error: HTTP {response.status_code}"
    except Exception as e:
        return f"Error: {str(e)}"

def run_tests():
    """Run all test queries"""
    print("=" * 80)
    print("TESTING DYNAMIC QUERY SYSTEM")
    print("=" * 80)
    print()
    
    passed = 0
    failed = 0
    
    for i, query in enumerate(TEST_QUERIES, 1):
        print(f"\n[{i}/{len(TEST_QUERIES)}] Query: {query}")
        print("-" * 80)
        
        response = test_query(query)
        print(f"Response: {response}")
        
        # Check if response indicates success or failure
        if "❌" in response or "Error" in response or "couldn't" in response:
            failed += 1
            print("❌ FAILED")
        else:
            passed += 1
            print("✅ PASSED")
    
    print("\n" + "=" * 80)
    print(f"RESULTS: {passed} passed, {failed} failed out of {len(TEST_QUERIES)} tests")
    print("=" * 80)

if __name__ == "__main__":
    print("Make sure Rasa server is running on http://localhost:5005")
    print("Make sure backend server is running on http://localhost:5000")
    input("Press Enter to start testing...")
    run_tests()
