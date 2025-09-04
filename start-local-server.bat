@echo off
echo 🚀 Starting CBT Local Server...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

REM Build the application
echo 🔨 Building the application...
call npm run build

REM Check if serve is installed globally
serve --version >nul 2>&1
if errorlevel 1 (
    echo 📦 Installing serve globally...
    call npm install -g serve
)

REM Start the server
echo 🌐 Starting server on http://localhost:3000
echo 📝 Press Ctrl+C to stop the server
echo.

serve -s build -l 3000 