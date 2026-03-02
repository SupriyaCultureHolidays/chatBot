"""
Comprehensive Test Script - Tests all queries and saves results to file
"""

import requests
import json
from datetime import datetime

RASA_URL = "http://localhost:5005/webhooks/rest/webhook"

# All test queries
TEST_QUERIES = [
    "Who is demo demoo?",
    "Find agent CHAGT0001000024104",
    "Tell me about mailto:gautam@cultureholidays.com",
    "What is RAY HARPER email?",
    "What is the AgentID of RAY HARPER?",
    "What company does demo demoo work at?",
    "What nationality is RAY HARPER?",
    "Give me full profile of CHAGT00101",
    "When did mailto:gautam@cultureholidays.com last login?",
    "When did CHAGT0001000024104 last login?",
    "How many times did mailto:gautam@cultureholidays.com login?",
    "Show login history for demo demoo",
    "What was the first login of CHAGT0001000024104?",
    "Find login ID 1",
    "Which agents logged in this month?",
    "Who logged in between 2022-01-01 and 2022-12-31?",
    "How many times did RAY HARPER login?",
    "Show all agents from Culture Holidays",
    "Who works at LUXE GRAND TRAVEL?",
    "List all agents from culture holidays",
    "How many agents are in Culture Holidays?",
    "Agents from LUXE GRAND",
    "Show all agents from luxegrandtravel",
    "Show all agents from India",
    "List all Indian agents",
    "How many agents are from United States?",
    "Show agents by nationality",
    "Who is the most active agent?",
    "Which agent logged in most frequently?",
    "Who is the least active agent?",
    "Which agents have never logged in?",
    "Show top 5 agents by login count",
    "How many agents are in the database?",
    "How many agents have not logged in?",
    "Find agent demo",
    "Who is ray harper",
    "Find CHAGT9999999999",
    "When did mailto:nobody@fake.com last login?",
    "Show agents where nationality is india",
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
    except requests.exceptions.ConnectionError:
        return "ERROR: Cannot connect to Rasa server. Make sure it's running on http://localhost:5005"
    except Exception as e:
        return f"Error: {str(e)}"

def run_tests():
    """Run all test queries and save to file"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"test_results_{timestamp}.txt"
    
    results = []
    results.append("=" * 100)
    results.append("RASA CHATBOT - COMPREHENSIVE TEST RESULTS")
    results.append("=" * 100)
    results.append(f"Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    results.append(f"Total Queries: {len(TEST_QUERIES)}")
    results.append("=" * 100)
    results.append("")
    
    passed = 0
    failed = 0
    errors = 0
    
    for i, query in enumerate(TEST_QUERIES, 1):
        print(f"Testing {i}/{len(TEST_QUERIES)}: {query}")
        
        results.append(f"\n{'='*100}")
        results.append(f"Query #{i}: {query}")
        results.append("-" * 100)
        
        response = test_query(query)
        results.append(f"Response: {response}")
        
        # Categorize result
        if "ERROR:" in response or "Error:" in response:
            status = "❌ ERROR"
            errors += 1
        elif "❌" in response or "not found" in response.lower() or "couldn't" in response.lower():
            # Check if it's expected to fail
            if "CHAGT9999999999" in query or "nobody@fake.com" in query:
                status = "✅ EXPECTED (Not Found)"
                passed += 1
            else:
                status = "❌ FAILED"
                failed += 1
        elif response == "Empty response" or response == "No response":
            status = "❌ NO RESPONSE"
            failed += 1
        else:
            status = "✅ PASSED"
            passed += 1
        
        results.append(f"Status: {status}")
        results.append("=" * 100)
    
    # Summary
    results.append("\n\n")
    results.append("=" * 100)
    results.append("TEST SUMMARY")
    results.append("=" * 100)
    results.append(f"Total Tests: {len(TEST_QUERIES)}")
    results.append(f"✅ Passed: {passed}")
    results.append(f"❌ Failed: {failed}")
    results.append(f"⚠️  Errors: {errors}")
    results.append(f"Success Rate: {(passed/len(TEST_QUERIES)*100):.1f}%")
    results.append("=" * 100)
    
    # Failed queries list
    if failed > 0:
        results.append("\n\n")
        results.append("=" * 100)
        results.append("FAILED QUERIES (Need Attention)")
        results.append("=" * 100)
        for i, query in enumerate(TEST_QUERIES, 1):
            response = test_query(query)
            if ("❌" in response or "not found" in response.lower()) and "CHAGT9999999999" not in query and "nobody@fake.com" not in query:
                results.append(f"{i}. {query}")
        results.append("=" * 100)
    
    # Write to file
    with open(filename, 'w', encoding='utf-8') as f:
        f.write('\n'.join(results))
    
    # Print summary
    print("\n" + "=" * 100)
    print("TEST COMPLETE!")
    print("=" * 100)
    print(f"Results saved to: {filename}")
    print(f"✅ Passed: {passed}/{len(TEST_QUERIES)}")
    print(f"❌ Failed: {failed}/{len(TEST_QUERIES)}")
    print(f"⚠️  Errors: {errors}/{len(TEST_QUERIES)}")
    print(f"Success Rate: {(passed/len(TEST_QUERIES)*100):.1f}%")
    print("=" * 100)
    
    return filename

if __name__ == "__main__":
    print("=" * 100)
    print("RASA CHATBOT - COMPREHENSIVE TEST")
    print("=" * 100)
    print("\nPrerequisites:")
    print("1. Rasa server running on http://localhost:5005")
    print("2. Action server running on http://localhost:5055")
    print("3. Backend server running on http://localhost:5000")
    print("\nPress Enter to start testing...")
    input()
    
    filename = run_tests()
    
    print(f"\n✅ Test results saved to: {filename}")
    print("\nOpen the file to see detailed results for each query.")
