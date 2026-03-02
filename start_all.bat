@echo off
echo ========================================
echo   Starting Rasa Chatbot Project
echo ========================================
echo.

echo [1/3] Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"
timeout /t 5 >nul

echo [2/3] Starting Rasa Action Server...
start "Rasa Actions" cmd /k "cd rasa && rasa run actions"
timeout /t 5 >nul

echo [3/3] Starting Rasa Server...
start "Rasa Server" cmd /k "cd rasa && rasa run --enable-api --cors *"

echo.
echo ========================================
echo   All services are starting!
echo ========================================
echo.
echo Wait 30 seconds for all services to be ready:
echo - Backend Server: http://localhost:5000
echo - Rasa Actions: http://localhost:5055
echo - Rasa Server: http://localhost:5005
echo.
echo Press any key to exit this window...
pause >nul
