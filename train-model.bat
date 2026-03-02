@echo off
echo ========================================
echo Training Rasa Model
echo ========================================
echo.

cd rasa

echo Training model with updated NLU data...
rasa train

echo.
echo ========================================
echo Training Complete!
echo ========================================
echo.
echo New model created in rasa/models/
echo.
echo Next steps:
echo 1. Run start-actions.bat to start action server
echo 2. Run start-rasa.bat to start Rasa server
echo 3. Run backend server: cd backend ^&^& npm start
echo 4. Test with: python test_queries.py
echo.
pause
