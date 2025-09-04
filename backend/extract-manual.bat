@echo off
echo Extracting CBT Data Export...
echo.

echo Creating extraction directory...
if not exist "extracted_data" mkdir extracted_data

echo.
echo Please extract the ZIP file manually:
echo 1. Right-click on the file: 761d46e2a5f95ceb67b9a78d8570796ecee1e081e0d05ae2e468ac6691d2b429
echo 2. Select "Extract All..." or "Extract Here"
echo 3. Extract to: C:\CBT\backend\extracted_data
echo.

echo After extraction, run: node restore-extracted.js
echo.
pause 