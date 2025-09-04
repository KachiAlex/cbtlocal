@echo off
echo Starting CBT Database Migration...
echo.
echo Make sure your local MongoDB is running!
echo.
node migrate-to-cloud.js
echo.
echo Migration completed!
pause 