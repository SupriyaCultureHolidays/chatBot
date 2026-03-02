@echo off
echo ========================================
echo Starting Rasa Chatbot System
echo ========================================

echo.
echo [1/3] Checking for existing Rasa processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5005') do (
    echo Killing process on port 5005 (PID: %%a)
    taskkill /PID %%a /F >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5055') do (
    echo Killing process on port 5055 (PID: %%a)
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo [2/3] Training Rasa model...
cd rasa
call ..\venv\Scripts\activate.bat
rasa train

echo.
echo [3/3] Starting Rasa server...
echo.
echo ========================================
echo Rasa server will start on http://localhost:5005
echo.
echo IMPORTANT: Open a NEW terminal and run:
echo   cd rasa
echo   ..\venv\Scripts\activate.bat
echo   rasa run actions
echo ========================================
echo.
pause

rasa run --enable-api --cors "*"
