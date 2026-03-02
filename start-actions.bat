@echo off
echo ========================================
echo Starting Rasa Actions Server
echo ========================================

cd rasa
call ..\venv\Scripts\activate.bat

echo.
echo Starting actions server on http://localhost:5055
echo.

rasa run actions
