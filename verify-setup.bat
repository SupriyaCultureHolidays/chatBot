@echo off
echo ========================================
echo   Chatbot System Setup Verification
echo ========================================
echo.

echo [1/5] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js 16+
    exit /b 1
) else (
    node --version
    echo [OK] Node.js installed
)
echo.

echo [2/5] Checking Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.8+
    exit /b 1
) else (
    python --version
    echo [OK] Python installed
)
echo.

echo [3/5] Checking project structure...
if not exist "backend\src\server.js" (
    echo [ERROR] Backend files missing
    exit /b 1
)
if not exist "frontend\src\App.js" (
    echo [ERROR] Frontend files missing
    exit /b 1
)
if not exist "rasa\config.yml" (
    echo [ERROR] Rasa files missing
    exit /b 1
)
echo [OK] All project files present
echo.

echo [4/5] Checking data files...
if not exist "backend\src\data\agentData.json" (
    echo [ERROR] agentData.json missing
    exit /b 1
)
if not exist "backend\src\data\agentLogin.json" (
    echo [ERROR] agentLogin.json missing
    exit /b 1
)
echo [OK] Data files present
echo.

echo [5/5] Checking dependencies...
if not exist "backend\node_modules" (
    echo [WARN] Backend dependencies not installed
    echo Run: cd backend ^&^& npm install
) else (
    echo [OK] Backend dependencies installed
)

if not exist "frontend\node_modules" (
    echo [WARN] Frontend dependencies not installed
    echo Run: cd frontend ^&^& npm install
) else (
    echo [OK] Frontend dependencies installed
)
echo.

echo ========================================
echo   Setup Verification Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Install dependencies if needed
echo 2. Train Rasa: cd rasa ^&^& rasa train
echo 3. Start services (see QUICKSTART.md)
echo.
pause
