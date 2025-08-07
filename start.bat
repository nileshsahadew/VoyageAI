@echo off
ECHO Starting the full-stack application setup...
ECHO.

REM --- Setting up Frontend Server ---
ECHO Setting up frontend server...
cd frontend
call npm install
cd ..

REM --- Setting up Backend Server ---
ECHO.
ECHO Setting up the backend server...
cd backend
IF NOT EXIST venv (
    ECHO Creating Python virtual environment...
    python -m venv venv
)
call venv\Scripts\activate
ECHO Installing backend dependencies...
pip install -r requirements.txt
cd ..

ECHO.
ECHO Setup complete.