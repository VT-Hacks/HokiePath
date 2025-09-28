@echo off
echo Starting HokiePath Backend...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist "package.json" (
    echo Error: package.json not found. Please run this script from the project root directory.
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if .env.development exists
if not exist ".env.development" (
    echo Warning: .env.development not found. Creating a template...
    echo NODE_ENV=development > .env.development
    echo PORT=8000 >> .env.development
    echo SUPABASE_URL=http://127.0.0.1:54321 >> .env.development
    echo SUPABASE_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0 >> .env.development
    echo GOOGLE_CUSTOM_SEARCH_API=your_google_custom_search_api_key_here >> .env.development
    echo GOOGLE_CSE_ID=your_google_cse_id_here >> .env.development
    echo GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key_here >> .env.development
    echo.
    echo Please edit .env.development with your actual API keys before running the backend.
    pause
    exit /b 1
)

echo Starting backend server...
echo Backend will be available at: http://localhost:8000
echo.
npm run dev

pause
