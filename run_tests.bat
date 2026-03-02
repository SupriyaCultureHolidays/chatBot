@echo off
echo ========================================
echo Testing All Queries
echo ========================================
echo.
echo Make sure all services are running:
echo 1. Rasa server (port 5005)
echo 2. Action server (port 5055)
echo 3. Backend server (port 5000)
echo.
pause

python test_all_queries.py

echo.
echo ========================================
echo Test Complete!
echo ========================================
echo Check the test_results_*.txt file for detailed results
echo.
pause
