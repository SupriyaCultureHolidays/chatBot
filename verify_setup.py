"""
Configuration Verification Script
Checks if all files and services are properly configured
"""

import os
import json
import sys

def check_file_exists(filepath, description):
    """Check if a file exists"""
    if os.path.exists(filepath):
        print(f"✅ {description}: Found")
        return True
    else:
        print(f"❌ {description}: NOT FOUND")
        print(f"   Expected at: {filepath}")
        return False

def check_json_valid(filepath, description):
    """Check if JSON file is valid"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"✅ {description}: Valid JSON ({len(data)} records)")
        return True
    except Exception as e:
        print(f"❌ {description}: Invalid JSON")
        print(f"   Error: {str(e)}")
        return False

def check_service_running(url, service_name):
    """Check if a service is running"""
    try:
        import requests
        response = requests.get(url, timeout=2)
        print(f"✅ {service_name}: Running")
        return True
    except:
        print(f"⚠️  {service_name}: Not running (start it manually)")
        return False

def main():
    print("=" * 80)
    print("CONFIGURATION VERIFICATION")
    print("=" * 80)
    print()
    
    all_good = True
    
    # Check Rasa files
    print("📁 Checking Rasa Configuration Files...")
    print("-" * 80)
    all_good &= check_file_exists("rasa/data/nlu.yml", "NLU Training Data")
    all_good &= check_file_exists("rasa/domain.yml", "Domain Configuration")
    all_good &= check_file_exists("rasa/data/stories.yml", "Stories")
    all_good &= check_file_exists("rasa/rules.yml", "Rules")
    all_good &= check_file_exists("rasa/config.yml", "Config")
    all_good &= check_file_exists("rasa/actions/actions.py", "Actions")
    print()
    
    # Check if model exists
    print("🤖 Checking Rasa Model...")
    print("-" * 80)
    if os.path.exists("rasa/models") and len(os.listdir("rasa/models")) > 0:
        models = [f for f in os.listdir("rasa/models") if f.endswith('.tar.gz')]
        if models:
            print(f"✅ Rasa Model: Found ({len(models)} model(s))")
            print(f"   Latest: {sorted(models)[-1]}")
        else:
            print("❌ Rasa Model: No trained models found")
            print("   Run: train-model.bat")
            all_good = False
    else:
        print("❌ Rasa Model: models/ folder not found")
        print("   Run: train-model.bat")
        all_good = False
    print()
    
    # Check backend files
    print("📁 Checking Backend Files...")
    print("-" * 80)
    all_good &= check_file_exists("backend/src/server.js", "Backend Server")
    all_good &= check_file_exists("backend/src/routes/api.js", "API Routes")
    all_good &= check_file_exists("backend/src/controllers/internalController.js", "Internal Controller")
    all_good &= check_file_exists("backend/src/services/agentService.js", "Agent Service")
    all_good &= check_file_exists("backend/src/services/dataService.js", "Data Service")
    print()
    
    # Check data files
    print("📊 Checking Data Files...")
    print("-" * 80)
    if check_file_exists("backend/src/data/agentData.json", "Agent Data"):
        check_json_valid("backend/src/data/agentData.json", "Agent Data")
    else:
        all_good = False
    
    if check_file_exists("backend/src/data/agentLogin.json", "Login Data"):
        check_json_valid("backend/src/data/agentLogin.json", "Login Data")
    else:
        all_good = False
    print()
    
    # Check services
    print("🌐 Checking Running Services...")
    print("-" * 80)
    backend_running = check_service_running("http://localhost:5000", "Backend Server (port 5000)")
    rasa_running = check_service_running("http://localhost:5005", "Rasa Server (port 5005)")
    actions_running = check_service_running("http://localhost:5055/health", "Action Server (port 5055)")
    print()
    
    # Check test files
    print("🧪 Checking Test Files...")
    print("-" * 80)
    check_file_exists("test_queries.py", "Test Script")
    print()
    
    # Check documentation
    print("📚 Checking Documentation...")
    print("-" * 80)
    check_file_exists("QUICK_START.md", "Quick Start Guide")
    check_file_exists("TRAINING_GUIDE.md", "Training Guide")
    check_file_exists("IMPLEMENTATION_SUMMARY.md", "Implementation Summary")
    print()
    
    # Summary
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    
    if all_good:
        print("✅ All configuration files are present and valid!")
    else:
        print("⚠️  Some configuration files are missing or invalid")
        print("   Please check the errors above")
    
    print()
    
    if not backend_running or not rasa_running or not actions_running:
        print("⚠️  Some services are not running. To start them:")
        if not backend_running:
            print("   Backend: cd backend && npm start")
        if not actions_running:
            print("   Actions: start-actions.bat")
        if not rasa_running:
            print("   Rasa: start-rasa.bat")
    else:
        print("✅ All services are running!")
    
    print()
    
    if all_good and backend_running and rasa_running and actions_running:
        print("🎉 System is ready! Run: python test_queries.py")
    elif all_good:
        print("📝 Configuration is good. Start the services and run: python test_queries.py")
    else:
        print("📝 Fix the configuration issues above, then:")
        print("   1. Run: train-model.bat")
        print("   2. Start all services")
        print("   3. Run: python test_queries.py")
    
    print("=" * 80)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Error running verification: {str(e)}")
        sys.exit(1)
