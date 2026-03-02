@echo off
title Rasa Chatbot - Complete Startup
color 0A

echo ========================================
echo   RASA CHATBOT - COMPLETE STARTUP
echo ========================================
echo.

:MENU
echo Select an option:
echo.
echo [1] First Time Setup (Install + Train)
echo [2] Start All Services
echo [3] Run Tests
echo [4] Full Run (Setup + Start + Test)
echo [5] Exit
echo.
set /p choice="Enter choice (1-5): "

if "%choice%"=="1" goto SETUP
if "%choice%"=="2" goto START
if "%choice%"=="3" goto TEST
if "%choice%"=="4" goto FULL
if "%choice%"=="5" goto END
goto MENU

:SETUP
echo.
echo ========================================
echo   STEP 1: Installing Dependencies
echo ========================================
echo.
call install-vectordb.bat
echo.
echo ========================================
echo   STEP 2: Training Model
echo ========================================
echo.
call train-model.bat
echo.
echo ✅ Setup Complete!
echo.
pause
goto MENU

:START
echo.
echo ========================================
echo   STARTING ALL SERVICES
echo ========================================
echo.
echo Opening 3 terminals...
echo.
echo Terminal 1: Action Server (Port 5055)
start "Rasa Action Server" cmd /k "cd rasa && rasa run actions"
timeout /t 3 >nul

echo Terminal 2: Rasa Server (Port 5005)
start "Rasa Server" cmd /k "cd rasa && rasa run --enable-api --cors *"
timeout /t 3 >nul

echo Terminal 3: Backend Server (Port 5000)
start "Backend Server" cmd /k "cd backend && npm start"
timeout /t 3 >nul

echo.
echo ✅ All services starting...
echo.
echo Wait 30 seconds for all services to be ready, then:
echo - Action Server: http://localhost:5055
echo - Rasa Server: http://localhost:5005
echo - Backend Server: http://localhost:5000
echo.
pause
goto MENU

:TEST
echo.
echo ========================================
echo   RUNNING TESTS
echo ========================================
echo.
echo Make sure all services are running!
echo.
pause
python test_all_queries.py
echo.
pause
goto MENU

:FULL
echo.
echo ========================================
echo   FULL SETUP AND RUN
echo ========================================
echo.
echo This will:
echo 1. Install dependencies
echo 2. Train model
echo 3. Start all services
echo 4. Run tests
echo.
pause

echo [1/4] Installing dependencies...
call install-vectordb.bat

echo.
echo [2/4] Training model...
call train-model.bat

echo.
echo [3/4] Starting services...
start "Rasa Action Server" cmd /k "cd rasa && rasa run actions"
timeout /t 3 >nul
start "Rasa Server" cmd /k "cd rasa && rasa run --enable-api --cors *"
timeout /t 3 >nul
start "Backend Server" cmd /k "cd backend && npm start"

echo.
echo [4/4] Waiting for services to start (30 seconds)...
timeout /t 30 >nul

echo.
echo Running tests...
python test_all_queries.py

echo.
echo ✅ Full setup complete!
pause
goto MENU

:END
echo.
echo Goodbye!
timeout /t 2 >nul
exit
