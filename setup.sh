#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Starting the full-stack application..."

# --- Setting up Frontend Server ---
echo "Starting frontend server in the background using npm run dev..."
cd frontend && npm install 

# --- Setting up Backend Server ---
cd ./backend
echo "Setting up and starting the backend server in this window..."
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
echo "Installing backend dependencies..."
pip install -r requirements.txt